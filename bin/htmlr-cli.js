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
  .option('-o, --output [filename]', 'output file (blank for just changing extension)')
  .option('-w, --watch', 'watch for file changes and render')
  .parse(process.argv);

// get optional data from command line as json
// or file containing json or javascript
function get_data () {
  var data;
  try {
    data = program.data ? JSON.parse(program.data) : {};
  } catch (err) {
    fs.readFile(program.data, function (err, str) {
      str = '' + str;
      if (!err) {
        try {
          data = JSON.parse(str);
        } catch (err) {
          data = eval(str);
        }
      }
    });
  }
  return data;
}

function get_template_file(template_file) {
  // append '.htmlr' to end if file doesn't exist
  try {
    fs.statSync(template_file);
  } catch (err) {
    template_file += '.htmlr';
  }
  try {
    fs.statSync(template_file);
  } catch (err) {
    throw new Error('Error: template file "' + template_file + '" not found');
  }
  return template_file;
}

function get_output_file(template_file) {
  return path.join(path.dirname(template_file),
                   path.basename(template_file, path.extname(template_file))
                   + '.html');
}

function render_template(template_file, data, callback) {
  var html;
  fs.readFile(template_file, function (err, str) {
    if (err) {
      console.log('Error: file "' + template_file + '" can not be opened');
    } else {
      html = htmlr.compile(str, data)();
      // check to see if results should be given to a layout file
      if (!program.layout) {
        program.layout = 'layout.htmlr';
      }
      if (typeof program.layout === 'string' && program.layout !== template_file) {
        fs.readFile(program.layout, function (err, str) {
          if (err) {
            //console.log(html);
          } else {
            data.body = html; // 'body' is the express property used for layouts
            html = htmlr.compile(str, data)();
          }
        });
      } else {
        //console.log(html);
      }
      callback(html);
    }
  });
}

function template_output (template_file, output) {
  try {
    render_template(template_file, data, function (html) {
      if (program.output) {
        if (program.output === true) {
          program.output = get_output_file(template_file);
        }
        fs.writeFile(program.output, html, function (err) {
          if (err) throw err;
          console.log('rendered ' + program.output);
        });
      } else {
        console.log(html);
      }
    });
  } catch (err) {
    console.error('error rendering ' + template_file + ': ' + err);
  }
}

function hideCursor(){
    process.stdout.write('\033[?25l');
};

function showCursor(){
    process.stdout.write('\033[?25h');
};

if (program.args.length == 0) {
  console.log(program.helpInformation());
} else {
  if (program.watch) {
    console.log('\nwatching...');
    hideCursor();
    process.on('SIGINT', function () {
      showCursor();
      console.log('\n');
      process.exit();
    });
  }
  var data = get_data();
  var template_file;
  // loop through all given files outputing results
  for (var i = 0, len = program.args.length; i < len; ++i) {
    try {
      template_file = get_template_file(program.args[i]);
    } catch (err) {
      console.log(err);
      continue;
    }
    if (program.watch) {
      fs.watch(template_file, function (template_file) {
        return function (event, filename) {
          console.log(event, filename);
          template_output(template_file, program.output);
        };
      }(template_file));
    } else {
      template_output(template_file, program.output);
    }
  }
}
