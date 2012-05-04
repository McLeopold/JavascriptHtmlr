var Htmlr = require('./htmlr.js').Htmlr;

var Htmlr_keys = ['Htmlr'];
var Htmlr_values = [Htmlr];
for (var prop in Htmlr) { if (Htmlr.hasOwnProperty(prop)) {
  Htmlr_keys.push(prop);
  Htmlr_values.push(Htmlr[prop]);
}}

exports.version = '0.1.0';
exports.compile = function (str, options) {
  /* `eval()` has access to containing scope, which allows tampering
   * The `new Function()` does not, but then doesn't have access to Htmlr and
   * must be written as a function rather than an expression.
   * Here, we create a template function that returns the result of an eval()
   * and is passed in a reference to Htmlr.
   * Now template cannot tamper with the containing scope.
   * `'use strict';` is used to prevent tampering with the global scope.  This
   * prevents the use of the `with` statement, so the keys and values are passed
   * into the Function constructor to mimic `with`.
   */

  /* the following method was easy, but allowed for tampering with local and
     global scope

    var template = "with (Htmlr) {\n" + str + "\n};";
    var html = eval(template).render(options);

  */

  /* the following method prevented tampering with local scope,
     but not global scope.

    var template = "return eval(" +
                   JSON.stringify("with (Htmlr) {\n" + str + "\n};") +
                   ");";
    var html = new Function("Htmlr", template)(Htmlr).render(options);

  */

  var template = "'use strict';\n" +
                 "return eval(" + JSON.stringify(String(str)) + ");";
  var keys = Htmlr_keys.slice();
  keys.push(template);
  try {
    var html = Function.apply(null,keys)
                 .apply(null, Htmlr_values)
                 .render(options);
    return function () {
      return html;
    };
  } catch (err) {
    return function () {
      throw err;
    }
  }
};
exports.Htmlr = Htmlr;