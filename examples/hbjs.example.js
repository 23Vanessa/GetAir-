function example(hb, fontBlob, text) {
  var blob = hb.createBlob(fontBlob);
  var face = hb.createFace(blob, 0);
  // console.log(face.getAxisInfos());
  var font = hb.createFont(face);
  // font.setVariations({ wdth: 200, wght: 700 });
  font.setScale(1000, 1000); // Optional, if not given will be in font upem

  var buffer = hb.createBuffer();
  buffer.addText(text || 'abc');
  buffer.guessSegmentProperties();
  // buffer.setDirection('ltr'); // optional as can be set by guessSegmentProperties also
  hb.shape(font, buffer); // features are not supported yet
  var result = buffer.json(font);

  // returns glyphs paths, totally optional
  var glyphs = {};
  result.forEach(function (x) {
    if (glyphs[x.g]) return;
    glyphs[x.g] = {
      name: font.glyphName(x