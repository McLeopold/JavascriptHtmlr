#!/usr/bin/env node

var program = require('commander');
var htmlr = require("../lib/main.js");
var Htmlr = htmlr.Htmlr;
var path = require('path');
var fs = require('fs');

program
  .version(htmlr.version)
  .usage('[options] <file>')
  .option('-d, --data [data]', 'json or file to pass to template')
  .option('-l, --layout [layout]', 'layout file (blank for no layout)')
  .parse(process.argv);

if (program.args.length == 0) {
  console.log(program.helpInformation());
} else {
  // get optional data from command line as json
  // or file containing json or javascript
  var data;
  try {
    data = program.data ? JSON.parse(program.data) : {};
  } catch (e) {
    fs.readFile(program.data, function (err, str) {
      str = '' + str;
      if (!err) {
        try {
          data = JSON.parse(str);
        } catch (e) {
          data = eval(str);
        }
      }
    });
  }
  // loop through all given files outputing results
  for (var i = 0, len = program.args.length; i < len; ++i) {
    var template_file = program.args[i];
    // append '.htmlr' to end if file doesn't exist
    try {
      fs.statSync(template_file);
    } catch (e) {
      template_file += '.htmlr';
    }
    fs.readFile(template_file, function (err, str) {
      if (err) {
        console.log('Error: file "' + template_file + '" can not be opened');
      } else {
        var html = htmlr.compile(str, data)();
        // check to see if results should be given to a layout file
        if (!program.layout) {
          program.layout = 'layout.htmlr';
        }
        if (typeof program.layout === 'string' && program.layout !== template_file) {
          fs.readFile(program.layout, function (err, str) {
            if (err) {
              console.log(html);
            } else {
              data.body = html; // 'body' is the express property used for layouts
              console.log(htmlr.compile(str, data)());
            }
          });
        } else {
          console.log(html);
        }
      }
    });
  }
}
