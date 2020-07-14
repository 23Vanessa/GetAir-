var fs = require('fs');
var path = require('path');
var example = require('./hbjs.example.js');

require('../').then(function (hbjs) {
  co