'use strict';

var git    = require('git-child');
var assert = require('assert');

module.exports = function (callback) {
  return git.status({
    porcelain: true
  })
  .call('trim')
  .then(function (output) {
    assert(!output, 'Git working tree must be clean');
  })
  .nodeify(callback);
}
