var Htmlr = require('../lib/htmlr.js').Htmlr
  , assert = require('assert')
;

describe('JavascriptHtmlr', function () {
  describe('simple', function () {
    it('div() should return <div />', function () {
      with (Htmlr) {
        assert.deepEqual(div().render(), '<div />');
      }
    });
  });
});
