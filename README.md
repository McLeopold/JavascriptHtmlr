htmlr [![TravisCI](https://secure.travis-ci.org/McLeopold/JavascriptHtmlr.png?branch=master)](http://travis-ci.org/McLeopold/JavascriptHtmlr)
=====


*   Htmlr is a template language for Express.
*   Htmlr is an easy way to create DOM elements in the browser.
*   Htmlr is a Domain Specific Language (DSL) in javascript for generating HTML.

Htmlr can be used on the server or in the browser.  In the browser it can
generate HTML text for use with `.innerHTML` or it can generate document
fragments for use with `.appendChild`.  Template files use a `.htmlr` extension
and can be a javascript expression or a function that returns an Htmlr object.

Installation
------------

```bash
npm install htmlr
```

Browser Usage
-------------

For use in the browser, include the following script tag:

```html
<script src="lib/htmlr.js"></script>
```

Then create your dynamic elements in the browser:

```javascript
with (Htmlr) {
  var template = div({class: 'person'},
    'Name: ', span('{name}'), br,
    'Email: ', span('{email}')
  );
}

var data = {name: 'Scott', email: 'scott@example.com'};

// html text generation
document.getElementById('my_div').innerHTML = template.render(data);

// DOM object generation
document.getElementById('my_div').appendChild( template.renderDOM(data) );
```

```html
<div class="person">
Name: <span>Scott</span><br />
Email: <span>scott@example.com</span>
</div>
```

Express Usage
-------------

Create the following 2 template files to mimic the default express jade
templates and put them in the views directory:

*   `layout.htmlr`

    ```javascript
    doctype()
    .html(
      head(
        title('{title}'),
        css('/stylesheets/style.css')
      ),
      body('{body}')
    )
    ```

*   `index.htmlr`

    ```javascript
    h1('{title}')
    .p('Welcome to {title}')
    ```

Then modify the `app.js` file to change the default rendering engine to htmlr:

```javascript
// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'htmlr');         // <=== put 'htmlr' right here
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});
```

Command Line Usage
------------------

Htmlr can also be used on the command line to test templates without an express
application running.  Create a filed called `template.htmlr` and a file with
json data called `data.json`:

*   `template.htmlr`

    ```javascript
    doctype()
    .html(
      head({lang: 'en'},
        meta({charset: 'utf-8'}),
        title('{title}'),
        css('style.css'),
        javascript('script.js')
      ),
      body(
        h1("Hello World!"),
        comment("woot!"),
        div({id: 'content'}, '{content}')
      )
    )
    ```

*   `data.json`

    ```json
    {"title": "My Title", "content": "My Content"}
    ```

Then run the following command:

```bash
htmlr template -d data.json -l
```

```html
<!DOCTYPE html>
<html>
  <head lang="en">
    <meta charset="utf-8" />
    <title>My Title</title>
    <link rel="stylesheet" href="style.css" />
    <script src="script.js"></script>
  </head>
  <body>
    <h1>Hello World!</h1>
    <!--woot!-->
    <div id="content">
      My Content
    </div>
  </body>
</html>
```


*   Use the `with` statement to prevent pollution of the global namespace in the
    browser.  ( `with` is forbidden in strict mode :( )

    ```javascript
    with (Htmlr) {
      var template = div();
    }    
    var html = template.render();
    ```
    
    ```html
    <div />
    ```

Features
--------

1.  Use an object literal as the first parameter to set attributes

    ```javascript
    with (Htmlr) {
      var template = div({id: 'mydiv', class: 'awesome'});
    }    
    var html = template.render();
    ```
    
    ```html
    <div id="mydiv" class="awesome" />
    ```

2.  Use any other data type for the first parameter and all data types afterward
    for child nodes
   
    ```javascript
    with (Htmlr) {
      var template = div('Literal String', br, 1337);
    }   
    var html = template.render();
    ```
    
    ```html
    <div>Literal String<br>1337</div>
    ```

3.  Chain objects together to create siblings

    ```javascript
    with (Htmlr) {
      var template = div().div();
    }
    var html = template.render();
    ```
    
    ```html
    <div /><div />
    ```

4.  Create templates that can be reused.  Pass data structures to templates to
    ease variable generation
   
    ```javascript
    with (Htmlr) {
      var template = div({id: '{id}', class: '{class}'},
        '{content}'
      )
    }
    
    var data1 = {id: 'one', class: 'first second', content: 'Hello'};
    var data2 = {id: 'two', class: 'third', content: 'World!'};
    
    var html = template.render(data1) + template.render(data2);
    ```
    
    ```html
    <div id="one" class="first second">Hello</div>
    <div id="two" class="third">World!</div>
    ```

4.  Use substitution syntax for creating templates that can be fed data, either
    objects or arrays

    ```javascript
    with (Htmlr) {
      var template1 = div('{name}');
    }
    var data1 = {name: 'Scott'};
    var html1 = template1.render(data1);
    ```
    
    ```html
    <div>Scott</div>
    ```    

    ```javascript
    with (Htmlr) {
      var template2 = div('{0}');
    }
    var data2 = ['Scott'];
    var html2 = template2.render(data2);
    ```
    
    ```html
    <div>Scott</div>
    ```
    
5.  Loop through data structures, objects or arrays, using the `each` construct

    ```javascript
    with (Htmlr) {
      var template1 = (
        ul(each()(
          li('{0}')
        ))
      );
    }
    var data1 = ['one', 'two', 'three'];
    var html1 = template1.render(data1);
    ```
    
    ```html
    <ul>
      <li>one</li>
      <li>two</li>
      <li>three</li>
    </ul>
    ```
        
    ```javascript
    with (Htmlr) {
      var template2 = (
        ul(each()(
          li('{key}: {value}')
        ))
      );
    }
    var data2 = {1: 'one', 2: 'two', 3: 'three'};
    var html2 = template2.render(data2);
    ```
    
    ```html
    <ul>
      <li>1: one</li>
      <li>2: two</li>
      <li>3: three</li>
    </ul>
    ```

    `each` can also take a static list:

    ```javascript
    with (Htmlr) {
      var template = (
        select(each(['North', 'South', 'East', 'West'])(
          option('{0}')
        )
      );
    }    
    var html = template.render();
    ```
    
    ```html
    <select>
      <option>North</option>
      <option>South</option>
      <option>East</option>
      <option>West</option>
    </select>
    ```

6.  Includes the ability to extracts parts of the data object

    ```javascript
    with (Htmlr) {
      var template1 = div(extract('error')(
        'Error',
        span('{number}'),
        ': ',
        span('{message}')
      ));
    }
    var data1 = {error: {number: 42, message: 'unknown question'}};
    var html1 = template1.render(data1);
    ```
   
    ```html
    <div>Error <span>42</span>: <span>unknown question</span></div>
    ```
   
    `extract` can reach into multiple levels of data structure
   
    ```javascript
    with (Htmlr) {
      var template2 = extract(1, 0)(div('{0}'));
    }
    var data2 = [[[0, 1], [2, 3]], [[4, 5], [6, 7]]];
    var html = template2.render(data2);
    ```
   
    ```html
    <div>4</div>
    ```

Known Issues
------------

None yet.  We need more testers!