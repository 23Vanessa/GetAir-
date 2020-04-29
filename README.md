# harfbuzzjs
Providing [HarfBuzz](https://github.com/harfbuzz/harfbuzz) shaping
library for client/server side JavaScript projects.

See the demo [here](https://harfbuzz.github.io/harfbuzzjs/).

## Building
1. Install emscripten
2. `./build.sh`

## Download
Download the pack from [releases tab](https://github.com/harfbuzz/harfbuzzjs/releases)
of the project, or just download the [demo page](https://harfbuzz.github.io/harfbuzzjs/) (the
demo source is in [gh-pages](https://github.com/harfbuzz/harfbuzzjs/tree/gh-pages) branch).

## Usage and testing

### TDLR

```javascript
hb = require("hbjs.js")
WebAssembly.instantiateStreaming(fetch("hb.wasm")).then(function (result) {
  fetch('myfont.ttf').then(function (data) {
    return data.arrayBuffer();
  }).then(function (fontdata) {
    var blob = hb.createBlob(fontdata); // Load the font data into something Harfbuzz can use
    var face = hb.createFace(blob, 0);  // Select the first font in the file (there's normally only one!)
    var font = hb.createFont(face);     // Create a Harfbuzz font object from the face
    var buffer = hb.createBuffer();     // Make a buffer to hold some text
    buffer.addText('abc');              // Fill it with some stuff
    buffer.guessSegmentProperties();    // Set scri