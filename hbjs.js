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
      (s.charCo