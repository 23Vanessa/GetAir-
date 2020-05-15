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
    buffer.guessSegmentProperties();    // Set script, language and direction
    hb.shape(font, buffer);             // Shape the text, determining glyph IDs and positions
    var output = shape.json();

    // Enumerate the glyphs
    var xCursor = 0;
    var yCursor = 0;
    for (glyph of output) {
        var glyphId = glyph.g;
        var xAdvance = glyph.ax;
        var xDisplacement = glyph.dx;
        var yDisplacement = glyph.dy;

        var svgPath = font.glyphToPath(glyphId);
        // You need to supply this bit
        drawAGlyph(svgPath, xCursor + xDisplacement, yDisplacement);

        xCursor += xAdvance;
    }

    // Release memory
    buffer.destroy();
    font.destroy();
    face.destroy();
    blob.destroy();
})
```

More examples:

### Browser

1. `npx pad.js`
2. Open `http://127.0.0.1/examples/hbjs.example.html` or `http://127.0.0.1/examples/nohbjs.html`

### Node.js

1. `(cd examples && node hbjs.example.node.js)`

We provide a tiny wrapper (`hbjs.js`) around the main functionality of harfbuzz, but it's also easy to use other parts. (See `example/nohbjs.js` as an example. However, you may need a custom build to expose additional functionality.)

## [npm](https://www.npmjs.com/package/harfbuzzjs)
Can be added with `npm i harfbuzzjs` or `yarn add harfbuzzjs`, see the examples for
how to use it.

## Need mor