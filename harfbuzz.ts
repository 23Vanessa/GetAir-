
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