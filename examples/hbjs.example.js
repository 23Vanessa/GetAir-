function example(hb, fontBlob, text) {
  var blob = hb.createBlob(fontBlob);
  var face = hb.createFace(blob, 0);
  // console.log(face.getAxisInfos());
  var font = hb.createFo