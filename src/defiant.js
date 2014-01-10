
if (typeof module === "undefined") {
	module = { exports: undefined };
} else {
	// Node env adaptation goes here...
}

module.exports = Defiant = (function(window, undefined) {
	'use strict';

	var Defiant = {
		env       : 'production',
		xml_decl  : '<?xml version="1.0" encoding="utf-8"?>',
		namespace : 'xmlns:d="defiant-namespace"',
		tabsize   : 4,
		is_safari : typeof navigator !== 'undefined'? navigator.userAgent.match(/safari/i) !== null
													: false,
		render: function(template, data) {
			var processor = new XSLTProcessor(),
				span      = document.createElement('span'),
				opt       = {match: '/'},
				scripts,
				temp;
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

			if (!this.xsl_template) this.gather_templates();

			temp = this.selectSingleNode(this.xsl_template, '//xsl:template[@name="'+ opt.template +'"]');
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
				xmlDoc;
			str = str.replace(/>\s{1,}</g, '><');
			if (str.match(/<\?xml/) === null) str = this.xml_decl + str;
			if (window.DOMParser) {
				parser = new DOMParser();
				xmlDoc = parser.parseFromString(str, 'text/xml');
			} else {
				// Internet Explorer
				xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
				xmlDoc.async = 'false';
				xmlDoc.loadXML(str);
			}
			return xmlDoc;
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
		prettyPrint: function(node) {
			var tabs = this.tabsize,
				decl = this.xml_decl.toLowerCase(),
				ser  = new XMLSerializer(),
				xstr = ser.serializeToString(node);
			if (this.env !== 'development') {
				// if environment is not development, remove defiant related info
				xstr = xstr.replace(/ \w+\:d=".*?"| d\:\w+=".*?"/g, '');
			}
			var str    = xstr.trim().replace(/(>)\s*(<)(\/*)/g, '$1\n$2$3'),
				lines  = str.split('\n'),
				indent = -1,
				i      = 0,
				il     = lines.length,
				start,
				end;
			for (; i<il; i++) {
				if (i === 0 && lines[i].toLowerCase() === decl) {
					lines[i] = decl;
					continue;
				}
				start = lines[i].match(/<[^\/]+>/g) !== null;
				end   = lines[i].match(/<\/[\w\:]+>/g) !== null;
				if (lines[i].match(/<.*?\/>/g) !== null) start = end = true;
				if (start) indent++;
				lines[i] = String().fill(indent, '\t') + lines[i];
				if (start && end) indent--;
				if (!start && end) indent--;
			}
			return lines.join('\n').replace(/\t/g, String().fill(tabs, ' '));
		},
		selectNodes: function(node, XPath, XNode) {
			if (!XNode) XNode = node;
			if (node.get) {

				return 1;
			}
			node.ns = node.createNSResolver(node.documentElement);
			node.qI = node.evaluate(XPath, XNode, node.ns, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			var res = [],
				i   = 0,
				il  = node.qI.snapshotLength;
			for (; i<il; i++) {
				res.push( node.qI.snapshotItem(i) );
			}
			return res;
		},
		selectSingleNode: function(node, XPath, XNode) {
			if (!XNode) XNode = node;
			node.xI = this.selectNodes(node, XPath, XNode);
			return (node.xI.length > 0)? node.xI[0] : null;
		},
		result: function() {
			var Q = function(found) {
				var coll = Object.create(Array.prototype);
				for (var method in Q.prototype) {
					if (Q.prototype.hasOwnProperty(method)) {
						coll[method] = Q.prototype[method];
					}
				}
				for (var i=0, il=found.length; i<il; i++) {
					coll.push(found[i]);
				}
				return coll;
			};
			Q.prototype = {
				toArray: function() {
					return Array.prototype.slice.call(this, 0);
				},
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
		}
	};

	return Defiant;

})(this);
