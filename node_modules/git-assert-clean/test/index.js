'use strict';

var expect      = require('chai').use(require('chai-as-promised')).expect;
var sinon       = require('sinon');
var git         = require('git-child');
var assertClean = require('../');

require('sinon-as-promised');

describe('git-assert-clean', function () {

  beforeEach(function () {
    sinon.stub(git, 'status');
  });

  afterEach(function () {
    git.status.restore();
  });

  it('resolves when clean', function () {
    git.status.resolves('');
    return assertClean();
  });

  it('rejects when dirty', function () {
    git.status.resolves('?? test/');
    return expect(assertClean()).to.be.rejectedWith('Git working');
  });

  it('can take a callback', function (done) {
    git.status.resolves('');
    assertClean(done);
  });

});
