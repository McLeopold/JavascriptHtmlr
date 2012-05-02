;(function (exports) {

  // subclass string class
  var HtmlrString = (function () {
    var Class = function () {
      if (arguments.length) {
        Array.prototype.push.apply(this, Array.prototype.slice.call(arguments).join('').split(''));
      }
    };
    Class.prototype = new String;
    var join = Array.prototype.join;
    Class.prototype.toString = Class.prototype.valueOf = function () {
      return join.call(this, '');
    };
    // check for toString bug
    if (new Class('test').toString() !== 'test') {
      Class.prototype.toString = Class.prototype.valueOf = function () {
        for (var a = [], i = 0; a[i] = this[i]; i++);
        return a.join('');
      };
    }
    Class.prototype.constructor = Class;
    return Class;
  }());
  // augment subclasses string
  HtmlrString.prototype.display = function (indent, data) {
    indent = indent || 0;
    return Array(indent+1).join(INDENT) + '*str ' + this + ' ' + JSON.stringify(data) + '\n';
  };
  HtmlrString.prototype.renderDOM = function (data) {
    if (!(typeof data === 'object')) {
      data = [data];
    }
    return document.createTextNode(this.supplant(data));
  };
  HtmlrString.prototype.render = function (data) {
    if (!(typeof data === 'object')) {
      data = [data];
    }
    return this.supplant(data);
  };
  HtmlrString.prototype.supplant = function (o) {
      return this.replace(/{([^{}]*)}/g,
          function (a, b) {
              var r = o[b];
              return typeof r === 'string' || typeof r === 'number' ? r : a;
          }
      );
  };
  HtmlrString.prototype.entityify = function () {
    return this.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  
  /* constants */
  var INDENT = '  ';
 
  var Htmlrs = []; // maintain list of all Htmlr classes
 
  /* Htmlr */
  var Htmlr = function () {};
  Htmlr.prototype.htmlr = true;
  Htmlr.prototype.close = true;
  Htmlr.prototype.empty_element = true;
  Htmlr.prototype.renderDOM_nodes = function (e, data) {
    for (var i = 0, len = this.nodes.length; i < len; ++i) {
      var node = this.nodes[i];
      if (typeof node === 'function') {
        node = node();
        this.nodes[i] = node;
      }
      var child = node.renderDOM(data);
      e.appendChild(child);
    }
  };
  Htmlr.prototype.renderDOM = function (data) {
    if (this.name) {
      var e = document.createElement(this.name);
      for (attr in this.attributes) { if (this.attributes.hasOwnProperty(attr)) {
        var value = this.attributes[attr];
        if (value.supplant) {
          value = value.supplant(data);
        }
        e.setAttribute(attr, value);
      }}
    } else {
      var e = document.createDocumentFragment();
    }
    this.renderDOM_nodes(e, data);
    return e;
  };
  Htmlr.prototype.open_tag = function (data) {
    var tag = '<' + this.name;
    if (this.attributes) {
      for (attr in this.attributes) { if (this.attributes.hasOwnProperty(attr)) {
        var value = this.attributes[attr];
        tag += ' ' + attr;
        if (value !== null & value !== undefined) {
          // TODO: quote attribute
          tag += '="' + this.attributes[attr] + '"';
        }
      }}
    }
    if (this.nodes.length === 0 && this.close && this.empty_element) {
      tag += ' /';
    }
    tag += '>';
    return tag;
  };
  Htmlr.prototype.close_tag = function (data) {
    if (this.close && (this.nodes.length > 0 || !this.empty_element)) {
      return '</' + this.name + '>';
    } else {
      return '';
    }      
  };
  Htmlr.prototype.render_nodes = function (data) {
    var tag = '';
    for (var i = 0, len = this.nodes.length; i < len; ++i) {
      var node = this.nodes[i];
      if (typeof node === 'function') {
        node = node();
        this.nodes[i] = node;
      }
      tag += node.render(data);
    }
    return tag;
  };
  Htmlr.prototype.render = function (data) {
    var tag = '';
    if (this.name) {
      var tag = this.open_tag(data);
      if (this.nodes.length > 1 || !this.close) {
        tag += '\n';
      }
    }
    tag += this.render_nodes(data);
    if (this.name) {
      tag += this.close_tag(data);
      if (this.nodes.length > 0 || !this.name) {
        tag += '\n';
      }
    }
    return tag;
  };
  Htmlr.prototype.display_nodes = function (indent, data) {
    var result = '';
    for (var i = 0, len = this.nodes.length; i < len; ++i) {
      var node = this.nodes[i];
      if (typeof node === 'function') {
        node = node();
        this.nodes[i] = node;
      }
      try {
        result += this.nodes[i].display(indent+1, data);
      } catch (e) {
        result += this.nodes[i].display(indent+1, data);
      }
    }
    return result;
  };
  Htmlr.prototype.display = function (indent, data) {
    indent = indent || 0;
    var result = Array(indent+1).join(INDENT) + this.name + ' ' + JSON.stringify(data) + '\n';
    result += this.display_nodes(indent, data);
    return result;
  };
  Htmlr.prototype.merge_attributes = function (obj2) {
    var obj = {};
    var obj1 = this.attributes;
    if (typeof obj1 === 'object' && obj1 !== null) {
      for (var prop in obj1) { if (obj1.hasOwnProperty(prop)) {
        obj[prop] = typeof obj1[prop] === 'string' ? new HtmlrString(obj1[prop]) : obj1[prop];
      }}
    }
    if (typeof obj2 === 'object' && obj2 !== null) {
      for (var prop in obj2) { if (obj2.hasOwnProperty(prop)) {
        obj[prop] = typeof obj2[prop] === 'string' ? new HtmlrString(obj2[prop]) : obj2[prop];
      }}
    }
    return obj;
  };
  Htmlr.prototype.init = function () {
    if (arguments.length >= 1) {
      var attributes = arguments[0];
      var nodes;
      if (typeof attributes === "object" && !attributes.htmlr && this.name) {
        this.attributes = this.merge_attributes(attributes);
        nodes = Array.prototype.slice.call(arguments, 1);
      } else {
        nodes = Array.prototype.slice.call(arguments);          
      }
      this.nodes = nodes || this.nodes && Array.prototype.slice.call(this.nodes) || [];
      for (var i = 0, len = this.nodes.length; i < len; ++i) {
        var node = this.nodes[i];
        if (typeof node === 'string' || typeof node === 'number') {
          this.nodes[i] = new HtmlrString(node.toString());
        }
      }
    } else {
      this.attributes = this.merge_attributes();
      this.nodes = this.nodes && Array.prototype.slice.call(this.nodes) || [];
    }
  };
  Htmlr.copy = function (constructor) {
    var prototype = new this();
    var HtmlrClass = constructor || function () {};
    HtmlrClass.prototype = prototype;
    HtmlrClass.prototype.constructor = HtmlrClass;
    HtmlrClass.copy = Htmlr.copy;
    HtmlrClass.create_iter = Htmlr.create_iter;
    HtmlrClass.creator = Htmlr.creator;
    HtmlrClass.create = Htmlr.create;
    Htmlrs.push(HtmlrClass);
    return HtmlrClass;
  };
  Htmlr.create_iter = function () {
    var base = this;
    return function () {
      var iter = (arguments.length === 1 && typeof arguments[0]  === "object" ?
                  arguments[0] :
                  (arguments.length === 0 ?
                   null :
                   Array.prototype.slice.call(arguments)));
      return function () {
        var result = new base(iter);
        result.init.apply(result, arguments);
        return result;
      };
    };
  };
  /*
   * create a tag creator that siphons off the first few arguments
   * and applies them to the new tag after it is created
   */
  Htmlr.creator = function (fn) {
    var creator = this.create.apply(this, Array.prototype.slice.call(arguments, 1));
    var siphoner = function () {
      var args = Array.prototype.slice.call(arguments, fn.length);
      var tag = creator.apply(null, args);
      fn.apply(tag, arguments);
      return tag;
    };
    siphoner.class = creator.class;
    // TODO: add create function
    return siphoner;
  };
  /*
   * create a tag creator
   */
  Htmlr.create = function (name) {
    var HtmlrClass = this.copy();
    if (typeof name === 'string') {
      HtmlrClass.prototype.name = name;
      arguments = Array.prototype.slice.call(arguments, 1);
    }
    if (arguments.length >= 1) {
      var attributes = arguments[0];
      if (typeof attributes === 'object' && !attributes.htmlr) {
        HtmlrClass.prototype.attributes = attributes;
        HtmlrClass.prototype.nodes = Array.prototype.slice.call(arguments, 1);
      } else {
        HtmlrClass.prototype.nodes = Array.prototype.slice.call(arguments);
      }
    } else {
      HtmlrClass.prototype.attributes = {};
    }
    var creator = function () {
      var result = new HtmlrClass();
      result.init.apply(result, arguments);
      return result;
    };
    creator.class = HtmlrClass;
    creator.create = function () {
      return HtmlrClass.create.apply(HtmlrClass, arguments);
    };
    return creator;
  };
  Htmlr.chainer = function (fn) {
    return function () {
      var result = fn.apply(null, arguments);
      return this.chain(result);
    }
  };
  Htmlr.prototype.chain = function (element) {
    if (this.name) {
      var result = new Htmlr();
      result.nodes = [this, element];
      return result
    } else {
      this.nodes.push(element);
      return this;
    }
  };
  
  /* HtmlrExtract */
  var HtmlrExtract = Htmlr.copy(function (extract) {
    this.extract = extract;
  });
  HtmlrExtract.prototype.extract_data = function (data) {
    for (var i = 0, len = this.extract.length; i < len; ++i) {
      try {
        var new_data = data[this.extract[i]];
        data = new_data;
      } catch (e) {
        return data;
      };
    }
    return data;
  };
  HtmlrExtract.prototype.renderDOM = function (data) {
    var extract = this.extract_data(data);
    var f = document.createDocumentFragment();
    this.renderDOM_nodes(f, extract);
    return f;
  };
  HtmlrExtract.prototype.render = function (data) {
    var extract = this.extract_data(data);
    return this.render_nodes(extract);
  };
  HtmlrExtract.prototype.display = function (indent, data) {
    indent = indent || 0;
    var result = Array(indent+1).join(INDENT) + '=extract ' + JSON.stringify(this.extract) + ' ' + JSON.stringify(data) + '\n';
    var extract = this.extract_data(data);
    result += this.display_nodes(indent, extract);
    return result;
  };
  var extract = HtmlrExtract.create_iter();
  
  /* HtmlrEach */
  var HtmlrEach = Htmlr.copy(function (iter) {
    this.iter = iter;
  });
  HtmlrEach.prototype.renderDOM = function (data) {
    var iter = this.iter || data || [];
    var f = document.createDocumentFragment();
    if (Object.prototype.toString.call(iter) === '[object Array]') {
      for (var i = 0, len = iter.length; i < len; ++i) {
        var item = iter[i];
        this.renderDOM_nodes(f, item);
      }
    } else {
      for (var key in iter) { if (iter.hasOwnProperty(key)) {
        var value = iter[key];
        this.renderDOM_nodes(f, {key: key, value: value});
      }}
    }
    return f;
  };
  HtmlrEach.prototype.render = function (data) {
    var iter = this.iter || data || [];
    var tag = '';
    if (Object.prototype.toString.call(iter) === '[object Array]') {
      for (var i = 0, len = iter.length; i < len; ++i) {
        var item = iter[i];
        tag += this.render_nodes(item);
      }
    } else {
      for (var key in iter) { if (iter.hasOwnProperty(key)) {
        var value = iter[key];
        tag += this.render_nodes({key: key, value: value});
      }}
    }
    return tag;
  };
  HtmlrEach.prototype.display = function (indent, data) {
    indent = indent || 0;
    var iter = this.iter || data || [undefined];
    var result = Array(indent+1).join(INDENT) + '+each ' + JSON.stringify(this.iter) + ' ' + JSON.stringify(data) + '\n';
    if (Object.prototype.toString.call(iter) === '[object Array]') {
      for (var i = 0, len = iter.length; i < len; ++i) {
        var item = iter[i];
        result += this.display_nodes(indent, item);
      }
    } else {
      for (var key in iter) { if (iter.hasOwnProperty(key)) {
        var value = iter[key];
        result += this.display_nodes(indent, {key: key, value: value});
      }}
    }
    return result;      
  };
  var each = HtmlrEach.create_iter();
  
  /* class definitions */
  var doctype = Htmlr.create('!DOCTYPE', {html: null});
  doctype.class.prototype.close = false;
  
  var input = Htmlr.create('input', {type: '', value: ''});
  
  var comment = Htmlr.create();
  comment.class.prototype.open_tag = function () { return '<!--'; };
  comment.class.prototype.close_tag = function () { return '-->'; };
  
  var javascript = Htmlr.creator(function (js) {
    if (typeof js === 'string') {
      this.attributes.src = js;
    } else if (typeof js === 'function') {
      var s = js.toString();
      s = s.replace(/^function[ \t]*[_$a-zA-Z0-9]*[ \t]*\([ \t]*\)[ \t]*\{/, '');
      s = s.replace(/\}$/, '');
      this.nodes.push(new HtmlrString(s));
    }
  }, 'script');
  javascript.class.prototype.empty_element = false;
    
  var d = Htmlr.creator(function (id) {
    this.attributes.id = id;
  }, 'div');
  
  HtmlrObjects = {
    each: each,
    extract: extract,
    HtmlrString: HtmlrString,
    
    // page
    doctype: doctype,
    html: Htmlr.create('html'),
    head: Htmlr.create('head'),
    meta: Htmlr.create('meta'),
    link: Htmlr.create('link'),
    css: Htmlr.creator(function (css_file) {
      this.attributes.href = css_file;
    }, 'link', {rel: 'stylesheet'}),
    javascript: javascript,
    title: Htmlr.create('title'),
    body: Htmlr.create('body'),
    div: Htmlr.create('div'),
    d: d,
    span: Htmlr.create('span'),
    hr: Htmlr.create('hr'),
    br: Htmlr.create('br'),
    p: Htmlr.create('p'),
    a: Htmlr.create('a'),
    h1: Htmlr.create('h1'),
    h2: Htmlr.create('h2'),
    h3: Htmlr.create('h3'),
    h4: Htmlr.create('h4'),
    h5: Htmlr.create('h5'),
    h6: Htmlr.create('h6'),
    h7: Htmlr.create('h7'),
    comment: comment,
    pre: Htmlr.create('pre')
    
    // html5
    section: Htmlr.create('section'),
    nav: Htmlr.create('nav'),
    article: Htmlr.create('article'),
    aside: Htmlr.create('aside'),
    hgroup: Htmlr.create('hgroup'),
    header: Htmlr.create('header'),
    footer: Htmlr.create('footer'),
    time: Htmlr.create('time'),
    mark: Htmlr.create('mark'),
    
    // lists
    ol: Htmlr.create('ol'),
    ul: Htmlr.create('ul'),
    li: Htmlr.create('li'),
    dt: Htmlr.create('dt'),
    dd: Htmlr.create('dd'),  
    
    // tables
    table: Htmlr.create('table', {cellspacing: 0, cellpadding: 0}),
    caption: Htmlr.create('caption'),
    thead: Htmlr.create('thead'),
    tbody: Htmlr.create('tbody'),
    tfoot: Htmlr.create('tfoot'),
    tr: Htmlr.create('tr'),
    td: Htmlr.create('td'),
    th: Htmlr.create('th'),
    
    // forms
    form: Htmlr.create('form', {method: 'POST', action: ''}),
    input: input,
    button: input.create({type: 'button'}),
    text: input.create({type: 'text'}),
    checkbox: input.create({type: 'checkbox'}),
    radio: input.create({type: 'radio'}),
    textarea: Htmlr.create('textarea'),
    select: Htmlr.create('select'),
    option: Htmlr.create('option'),
    fileinput: input.create({type: 'file'}),
    hidden: input.create({type: 'hidden'}),
    submit: input.create({type: 'submit'})

    // utilities
    create: Htmlr.create.bind(Htmlr)
  };

  for (var prop in HtmlrObjects) { if (HtmlrObjects.hasOwnProperty(prop)) {
    Htmlr.prototype[prop] = Htmlr.chainer(HtmlrObjects[prop]);
  }};

  /* export to global namespace */
  exports.Htmlr = HtmlrObjects;
  
}(this));
