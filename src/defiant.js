
if (typeof module === "undefined") {
	var module = { exports: undefined };
} else {
	// Node env adaptation goes here...
}

module.exports = Defiant = (function(window, undefined) {
	'use strict';

	var Defiant = {
		is_ie     : /msie/i.test(navigator.userAgent),
		is_safari : /safari/i.test(navigator.userAgent),
		env       : 'production',
		xml_decl  : '<?xml version="1.0" encoding="utf-8"?>',
		namespace : 'xmlns:d="defiant-namespace"',
		tabsize   : 4,
		render: function(template, data) {
			var processor = new XSLTProcessor(),
				span      = document.createElement('span'),
				opt       = {match: '/'},
				tmplt_xpath,
				scripts,
				temp,
				sorter;
			// handle arguments
			switch (typeof(template)) {
				case 'object':
					this.extend(opt, template);
					if (!opt.data) opt.data = data;
					break;
				case 'string':
					opt.template = template;
					opt.data = data;
					break;
				default:
					throw 'error';
			}
			opt.data = JSON.toXML(opt.data);
			tmplt_xpath = '//xsl:template[@name="'+ opt.template +'"]';

			if (!this.xsl_template) this.gather_templates();

			if (opt.sorter) {
				sorter = this.node.selectSingleNode(this.xsl_template, tmplt_xpath +'//xsl:for-each//xsl:sort');
				if (sorter) {
					if (opt.sorter.order) sorter.setAttribute('order', opt.sorter.order);
					if (opt.sorter.select) sorter.setAttribute('select', opt.sorter.select);
					sorter.setAttribute('data-type', opt.sorter.type || 'text');
				}
			}

			temp = this.node.selectSingleNode(this.xsl_template, tmplt_xpath);
			temp.setAttribute('match', opt.match);
			processor.importStylesheet(this.xsl_template);
			span.appendChild(processor.transformToFragment(opt.data, document));
			temp.removeAttribute('match');

			if (this.is_safari) {
				scripts = span.getElementsByTagName('script');
				for (var i=0, il=scripts.length; i<il; i++) scripts[i].defer = true;
			}
			return span.innerHTML;
		},
		gather_templates: function() {
			var scripts = document.getElementsByTagName('script'),
				str     = '',
				i       = 0,
				il      = scripts.length;
			for (; i<il; i++) {
				if (scripts[i].type === 'defiant/xsl-template') str += scripts[i].innerHTML;
			}
			this.xsl_template = this.xmlFromString('<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" '+ this.namespace +'>'+ str.replace(/defiant:(\w+)/g, '$1') +'</xsl:stylesheet>');
		},
		xmlFromString: function(str) {
			var parser,
				doc;
			str = str.replace(/>\s{1,}</g, '><');
			if (str.trim().match(/<\?xml/) === null) {
				str = this.xml_decl + str;
			}
			if (this.is_ie) {
				doc = new ActiveXObject('Msxml2.DOMDocument');
				doc.loadXML(str);
				doc.setProperty('SelectionLanguage', 'XPath');
			} else {
				parser = new DOMParser();
				doc = parser.parseFromString(str, 'text/xml');
			}
			return doc;
		},
		extend: function(src, dest) {
			for (var content in dest) {
				if (!src[content] || typeof(dest[content]) !== 'object') {
					src[content] = dest[content];
				} else {
					this.extend(src[content], dest[content]);
				}
			}
			return src;
		},
		result: function() {
			var Q = function(found) {
				for (var method in Q.prototype) {
					if (Q.prototype.hasOwnProperty(method)) {
						found[method] = Q.prototype[method];
					}
				}
				return found;
			};
			Q.prototype = {
				sum: function(key) {
					var i = 0,
						il = this.length,
						sum = 0;
					for (; i<il; i++) {
						sum += +this[i][key];
					}
					return sum;
				},
				avg: function(key) {
					return this.sum(key) / this.length;
				},
				sortAsc: function(key) {
					return this.sort(function(a,b) {
						return a[key] - b[key];
					});
				},
				sortDesc: function(key) {
					return this.sort(function(a,b) {
						return b[key] - a[key];
					});
				},
				min: function(key, method) {
					var i = 0,
						il = this.length,
						arr = [];
					for (; i<il; i++) {
						arr.push(this[i][key]);
					}
					return Math[ method || 'min' ].apply(null, arr);
				},
				max: function(key) {
					return this.min(key, 'max');
				},
				add: function(key, val, operator) {
					var i = 0,
						il = this.length,
						is_string = typeof(val) === 'string';

					for (; i<il; i++) {
						switch (operator) {
							case 'divide':   this[i][key] /= (is_string) ? this[i][val] : +val; break;
							case 'multiply': this[i][key] *= (is_string) ? this[i][val] : +val; break;
							case 'subtract': this[i][key] -= (is_string) ? this[i][val] : +val; break;
							default: this[i][key] += (is_string) ? this[i][val] : +val;
						}
					}
					return this;
				},
				subtract: function(key, val) {
					return this.add(key, val, 'subtract');
				},
				divide: function(key, val) {
					return this.add(key, val, 'divide');
				},
				multiply: function(key, val) {
					return this.add(key, val, 'multiply');
				},
				each: function(fn) {
					var i = 0,
						il = this.length;
					for (; i<il; i++) {
						fn(this[i]);
					}
					return this;
				}
			};
			return new Q(arguments[0]);
		},
		ajax: function(url, callback) {
			var that = Defiant.ajax;
			for (var method in ajax.prototype) {
				if (ajax.prototype.hasOwnProperty(method)) {
					that[method] = ajax.prototype[method];
				}
			}
			that.queue = new Queue(that);
			return url ? that.load(url, callback) : that ;
		},
		node: {}
	};

	// extending Defiant.ajax with function chaining
	var ajax = function(url) {};
	ajax.prototype = {
		callback: function(data) {
			this.data = data;
			this.queue._paused = false;
			this.queue.flush();
			return this;
		},
		wait: function(msec) {
			var self = this,
				fn = function() {
					setTimeout(function() {
						self.queue._paused = false;
						self.queue.flush();
					}, msec);
				};
			fn._paused = true;
			this.queue.add(fn);
			return this;
		},
		load: function(url, cb) {
			var self = this,
				fn = function() {
					var headLoc = document.getElementsByTagName("head").item(0),
						scriptObj = document.createElement("script"),
						delimiter = url.indexOf('?') > -1 ? '&' : '?';
					scriptObj.setAttribute("type", "text/javascript");
					scriptObj.setAttribute("charset", "utf-8");
					scriptObj.setAttribute("src", url + delimiter +'callback=Defiant.ajax.callback');
					headLoc.appendChild(scriptObj);
				},
				f2 = function() {
					cb(this.data);
				};
			fn._paused = true;
			this.queue.add(fn);
			if (cb) this.queue.add(f2);
			return this;
		},
		each: function(fn) {
			var self = this;
			this.queue.add(function() {
				if (!self.res.length) return fn.call(self);
				for (var i=0, il=self.res.length; i<il; i++) {
					fn.call(self, self.res[i]);
				}
			});
			return this;
		},
		search: function(xpath) {
			var self = this,
				fn = function() {
					self.res = JSON.search(self.data, xpath);
				};
			this.queue.add(fn);
			return this;
		}
	};

	// implementing function chaining
	function Queue(owner) {
		this._methods = [];
		this._owner = owner;
		this._paused = false;
	}
	Queue.prototype = {
		add: function(fn) {
			this._methods.push(fn);
			if (!this._paused) this.flush();
		},
		flush: function() {
			if (this._paused) return;
			while (this._methods[0]) {
				var fn = this._methods.shift();
				fn.call(this._owner);
				if (fn._paused) {
					this._paused = true;
					break;
				}
			}
		}
	};

	return Defiant;

})(this);

