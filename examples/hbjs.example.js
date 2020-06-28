function example(hb, fontBlob, text) {
  var blob = hb.createBlob(fontBlob);
  var face = hb.createFace(blob, 0);
  // console.log(face.getAxisInfos());
  var font = hb.createFont(face);
  // font.setVariations({ wdth: 200, wght: 700 });
  font.setScale(1000, 1000); // Optional, if not given will be in font upem

  var buffer = hb.createBuffer();
  bu