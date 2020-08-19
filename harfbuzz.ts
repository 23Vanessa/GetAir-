
﻿type Pointer = number;

const HB_MEMORY_MODE_WRITABLE: number = 2;
const HB_SET_VALUE_INVALID: Pointer = -1;

class HarfBuzzExports {
  readonly heapu8: Uint8Array;
  readonly heapu32: Uint32Array;
  readonly heapi32: Int32Array;
  readonly utf8Encoder: TextEncoder;

  //exported HarfBuzz methods
  readonly malloc: (length: number) => Pointer
  readonly free: (ptr: Pointer) => void
  readonly free_ptr: () => Pointer
  readonly hb_blob_create: (data: Pointer, length: number, memoryMode: number, useData: Pointer, destroyFunction: Pointer) => Pointer
  readonly hb_blob_destroy: (ptr: Pointer) => void
  readonly hb_face_create: (blobPtr: Pointer, index: number) => Pointer
  readonly hb_face_get_upem: (facePtr: Pointer) => number
  readonly hb_face_destroy: (ptr: Pointer) => void
  readonly hb_font_create: (facePtr: Pointer) => Pointer
  readonly hb_font_set_scale: (fontPtr: Pointer, xScale: number, yScale: number) => void
  readonly hb_font_destroy: (ptr: Pointer) => void
  readonly hb_face_collect_unicodes: (facePtr: Pointer, setPtr: Pointer) => void
  readonly hb_set_create: () => Pointer
  readonly hb_set_destroy: (setPtr: Pointer) => void
  readonly hb_set_get_population: (setPtr: Pointer) => number
  readonly hb_set_next_many: (
    setPtr: Pointer,
    greaterThanUnicodePtr: Pointer,
    outputU32ArrayPtr: Pointer,
    size: number,
  ) => number
  readonly hb_buffer_create: () => Pointer
  readonly hb_buffer_add_utf8: (bufferPtr: Pointer, stringPtr: Pointer, stringLength: number, itemOffset: number, itemLength: number) => void
  readonly hb_buffer_guess_segment_properties: (bufferPtr: Pointer) => void
  readonly hb_buffer_set_direction: (bufferPtr: Pointer, direction: number) => void
  readonly hb_shape: (fontPtr: Pointer, bufferPtr: Pointer, features: any, numFeatures: number) => void
  readonly hb_buffer_get_length: (bufferPtr: Pointer) => number
  readonly hb_buffer_get_glyph_infos: (bufferPtr: Pointer, length: number) => any
  readonly hb_buffer_get_glyph_positions: (bufferPtr: Pointer, length: number) => any
  readonly hb_buffer_destroy: (bufferPtr: Pointer) => void

  constructor(exports: any) {
    this.heapu8 = new Uint8Array(exports.memory.buffer);
    this.heapu32 = new Uint32Array(exports.memory.buffer);