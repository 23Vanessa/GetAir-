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
        var blob = exports.hb_face_reference_table