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

// used to fix fs.watch on windows triggering cascading events
// the function fn can only be called once per rate
var rate_limit_fn = function (fn, rate) {
  var allowed = true;
  return function () {
    if (allowed) {
      allowed = false;
      fn.apply(null, [].slice.call(arguments, 0));
      setTimeout(function () {
        allowed = true;
      }, rate);
    }
  }
}

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
      console.error('Error: file "' + template_file + '" can not be opened');
    } else {
      html = htmlr.compile(str, data)();
      // check to see if results should be given to a layout file
      if (!program.layout) {
        program.layout = 'layout.htmlr';
      }
      if (typeof program.layout === 'string' && program.layout !== template_file) {
        fs.readFile(program.layout, function (err, str) {
          if (!err) {
            data.body = html; // 'body' is the express property used for layouts
            html = htmlr.compile(str, data)();
          }
        });
      }
      callback(html);
    }
  });
}

function template_output (template_file, data, output) {
  //try {
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
  //} catch (err) {
  //  console.error('error rendering ' + template_file + ': ' + err);
  //}
}

function hideCursor(){
    process.stdout.write('\033[?25l');
};

function showCursor(){
    process.stdout.write('\033[?25h');
};

function main (program) {
  var data
    , template_file
    , cleanup
    , i, ilen
  ;
  if (program.args.length == 0) {
    console.log(program.helpInformation());
  } else {
    // setup display for watching for file changes
    if (program.watch) {
      console.log('\nwatching...');
      hideCursor();
      cleanup = function () {
        showCursor();
        console.log('\n');
        process.exit();
      }
      try {
        process.on('SIGINT', cleanup);
      } catch (err) {
        // fallback for windows
        try {
          process.on('exit', cleanup);
        } catch (err) {}
      }
    }

    // get data
    data = get_data();

    // loop through all given files outputing results
    for (i = 0, ilen = program.args.length; i < ilen; ++i) {
      try {
        template_file = get_template_file(program.args[i]);
      } catch (err) {
        console.log(err);
        continue;
      }
      // only allow file change events once per second
      var do_output = (function (the_template_file) {
        return rate_limit_fn(function (event, filename) {
          template_output(the_template_file, data, program.output);
        }, 1000);
      }(template_file));
      // generate output and maybe set watch event
      if (program.watch) {
        fs.watch(template_file, do_output);
      }
      do_output();
    }
  }
}

main(program);
