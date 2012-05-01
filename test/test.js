var Htmlr = require('../lib/htmlr.js').Htmlr
  , assert = require('chai').assert
;

suite('JavascriptHtmlr', function () {
  suite('simple', function () {
    test('div() should return <div />', function () {
      with (Htmlr) {
        assert.deepEqual(div().render(), '<div />');
      }
    });
  });
  suite('special', function () {
		test('javascript function', function () {
		  with (Htmlr) {
		  	assert.deepEqual(javascript(function () {var h = "hello";}).render(),
		  		               '<script>var h = "hello";</script>\n');
		  }
		})
  })
});
