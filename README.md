htmlr
=====

Htmlr is a Domain Specific Language (DSL) in javascript for generating HTML.
It can be used on the server or in the browser.  In the browser it can generate
HTML text for use with .innerHTML or it can generate document fragements for use
with .appendChild.

Installation
------------

```bash
npm install htmlr
```

For use in the browser, include the following script tag:

```html
<script src="htmlr.js"></script>
```

Usage
-----

```javascript
with (Htmlr) {
  var template = doctype(
    html(
      head({lang: 'en'},
        meta({charset: 'utf-8'}),
        title('{title}'),
        css('style.css'),
        javascript('script.js')
      ),
      body(
        h1("Hello World!"),
        comment("woot!"),
        div({id: 'content'}, '{0}')
      )
    )
  );
}

var data = {title: "My Title", content: "My Content"};

// create server side string or for browser .innerHTML
var html = template.render(data);

// create browser side DOM
var dom = template.renderDOM(data);
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

Features
--------

1.  Use the `with` statement to prevent pollution of the global namespace

    ```javascript
    with (Htmlr) {
      var template = div();
    }    
    var html = template.render();
    ```
    
    ```html
    <div />
    ```

2.  Use an object as the first parameter to set attributes

    ```javascript
    with (Htmlr) {
      var template = div({id: 'mydiv', class: 'awesome'});
    }    
    var html = template.render();
    ```
    
    ```html
    <div id="mydiv" class="awesome" />
    ```

3.  Use any other data type for the first paramter and all data types afterward
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