function hbjs(instance) {
  'use strict';

  var exports = instance.exports;
  var heapu8 = new Uint8Array(exports.memory.buffer);
  var heapu32 = new Uint32Array(exports.memory.buffer);
  var heapi32 = new Int32Array(exports.memory.buffer);
  var heapf32 = new Float32Array(exports.memory.buffer);
  var utf8Decoder = new TextDecoder("utf8");

  var HB_MEMORY_MODE_WRITABLE = 2;
  var HB_SET_VALUE_INVALID = -1;

  function hb_tag(s) {
    return (
      (s.charCodeAt(0) & 0xFF) << 24 |
      (s.charCodeAt(1) & 0xFF) << 16 |
      (s.charCodeAt(2) & 0xFF) <<  8 |
      (s.charCodeAt(3) & 0xFF) <<  0
    );
  }

  function _hb_untag(tag) {
    return [
      String.fromCharCode((tag >> 24) & 0xFF),
      String.fromCharCode((tag >> 16) & 0xFF),
      String.fromCharCode((tag >>  8) & 0xFF),
      String.fromCharCode((tag >>  0) & 0xFF)
    ].join('');
  }

  function _buffer_flag(s) {
    if (s == "BOT") { return 0x1; }
    if (s == "EOT") { return 0x2; }
    if (s == "PRESERVE_DEFAULT_IGNORABLES") { return 0x4; }
    if (s == "REMOVE_DEFAULT_IGNORABLES") { return 0x8; }
    if (s == "DO_NOT_INSERT_DOTTED_CIRCLE") { return 0x10; }
    return 0x0;
  }

  /**
  * Create an object representing a Harfbuzz blob.
  * @param {string} blob A blob of binary data (usually the contents of a font file).
  **/
  function createBlob(blob) {
    var blobPtr = exports.malloc(blob.byteLength);
    heapu8.set(new Uint8Array(blob), blobPtr);
    var ptr = exports.hb_blob_create(blobPtr, blob.byteLength, HB_MEMORY_MODE_WRITABLE, blobPtr, exports.free_ptr());
    return {
      ptr: ptr,
      /**
      * Free the object.
      */
      destroy: function () { exports.hb_blob_destroy(ptr); }
    };
  }

  /**
   * Return the typed array of HarfBuzz set contents.
   * @template {typeof Uint8Array | typeof Uint32Array | typeof Int32Array | typeof Float32Array} T
   * @param {number} setPtr Pointer of set
   * @param {T} arrayClass Typed array class
   * @returns {InstanceType<T>} Typed array instance
   */
  function typedArrayFromSet(setPtr, arrayClass) {
    let heap = heapu8;
    if (arrayClass === Uint32Array) {
      heap = heapu32;
    } else if (arrayClass === Int32Array) {
      heap = heapi32;
    } else if (arrayClass === Float32Array) {
      heap = heapf32;
    }
    const bytesPerElment = arrayClass.BYTES_PER_ELEMENT;
    const setCount = exports.hb_set_get_population(setPtr);
    const arrayPtr = exports.malloc(
      setCount * bytesPerElment,
    );
    const arrayOffset = arrayPtr / bytesPerElment;
    const array = heap.subarray(
      arrayOffset,
      arrayOffset + setCount,
    );
    heap.set(array, arrayOffset);
    exports.hb_set_next_many(
      setPtr,
      HB_SET_VALUE_INVALID,
      arrayPtr,
      setCount,
    );
    return array;
  }

  /**
  * Create an object representing a Harfbuzz face.
  * @param {object} blob An object returned from `createBlob`.
  * @param {number} index The index of the font in the blob. (0 for most files,
  *  or a 0-indexed font number if the `blob` came form a TTC/OTC file.)
  **/
  function createFace(blob, index) {
    var ptr = exports.hb_face_create(blob.ptr, index);
    const upem = exports.hb_face_get_upem(ptr);
    return {
      ptr: ptr,
      upem,
      /**
       * Return the binary contents of an OpenType table.
       * @param {string} table Table name
       */
      reference_table: function(table) {
        var blob = exports.hb_face_reference_table(ptr, hb_tag(table));
        var length = exports.hb_blob_get_length(blob);
        if (!length) { return; }
        var blobptr = exports.hb_blob_get_data(blob, null);
        var table_string = heapu8.subarray(blobptr, blobptr+length);
        return table_string;
      },
      /**
       * Return variation axis infos
       */
      getAxisInfos: function() {
        var axis = exports.malloc(64 * 32);
        var c = exports.malloc(4);
        heapu32[c / 4] = 64;
        exports.hb_ot_var_get_axis_infos(ptr, 0, c, axis);
        var result = {};
        Array.from({ length: heapu32[c / 4] }).forEach(function (_, i) {
          result[_hb_untag(heapu32[axis / 4 + i * 8 + 1])] = {
            min: heapf32[axis / 4 + i * 8 + 4],
            default: heapf32[axis / 4 + i * 8 + 5],
            max: heapf32[axis / 4 + i * 8 + 6]
          };
        });
        exports.free(c);
        exports.free(axis);
        return result;
      },
      /**
       * Return unicodes the face supports
       */
      collectUnicodes: function() {
        var unicodeSetPtr = exports.hb_set_create();
        exports.hb_face_collect_unicodes(ptr, unicodeSetPtr);
        var result = typedArrayFromSet(unicodeSetPtr, Uint32Array);
        exports.hb_set_destroy(ptr);
        return result;
      },
      /**
       * Free the object.
       */
      destroy: function () {
        exports.hb_face_destroy(ptr);
      },
    };
  }

  var pathBufferSize = 65536; // should be enough for most glyphs
  var pathBuffer = exports.malloc(pathBufferSize); // permanently allocated

  var nameBufferSize = 256; // should be enough for most glyphs
  var nameBuffer = exports.malloc(nameBufferSize); // permanently allocated

  /**
  * Create an object representing a Harfbuzz font.
  * @param {object} blob An object returned from `createFace`.
  **/
  function createFont(face) {
    var ptr = exports.hb_font_create(face.ptr);

    /**
    * Return a glyph as an SVG path string.
    * @param {number} glyphId ID of the requested glyph in the font.
    **/
    function glyphToPath(glyphId) {
      var svgLength = exports.hbjs_glyph_svg(ptr, glyphId, pathBuffer, pathBufferSize);
      return svgLength > 0 ? utf8Decoder.decode(heapu8.subarray(pathBuffer, pathBuffer + svgLength)) : "";
    }

    /**
     * Return glyph name.
     * @param {number} glyphId ID of the requested glyph in the font.
     **/
    function glyphName(glyphId) {
      exports.hb_font_glyph_to_string(
        ptr,
        glyphId,
        nameBuffer,
        nameBufferSize
      );
      var array = heapu8.subarray(nameBuffer, nameBuffer + nameBufferSize);
      return utf8Decoder.decode(array.slice(0, array.indexOf(0)));
    }

    return {
      ptr: ptr,
      glyphName: glyphName,
      glyphToPath: glyphToPath,
      /**
      * Return a glyph as a JSON path string
      * based on format described on https://svgwg.org/specs/paths/#InterfaceSVGPathSegment
      * @param {number} glyphId ID of the requested glyph in the font.
      **/
      glyphToJson: function (glyphId) {
        var path = glyphToPath(glyphId);
        return path.replace(/([MLQCZ])/g, '|$1 ').split('|').filter(function (x) { return x.length; }).map(function (x) {
          var row = x.split(/[ ,]/g);
          return { type: row[0], values: row.slice(1).filter(function (x) { return x.length; }).map(function (x) { return +x; }) };
        });
      },
      /**
      * Set the font's scale factor, affecting the position values returned from
      * shaping.
      * @param {number} xScale Units to scale in the X dimension.
      * @param {number} yScale Units to scale in the Y dimension.
      **/
      setScale: function (xScale, yScale) {
        exports.hb_font_set_scale(ptr, xScale, yScale);
      },
      /**
       * Set the font's variations.
       * @param {object} variations Dictionary of variations to set
       **/
      setVariations: function (variations) {
        var entries = Object.entries(variations);
        var vars = exports.malloc(8 * entries.length);
        entries.forEach(function (entry, i) {
          heapu32[vars / 4 + i * 2 + 0] = hb_tag(entry[0]);
          heapf32[vars / 4 + i * 2 + 1] = entry[1];
        });
        exports.hb_font_set_variations(ptr, vars, entries.length);
        exports.free(vars);
