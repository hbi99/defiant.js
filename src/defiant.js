
if (typeof module === "undefined") {
	module = { exports: undefined };
} else {
	var dom = require('xmldom');

	this.Document      = Document      = dom.DOMImplementation;
	this.DOMParser     = DOMParser     = dom.DOMParser;
	this.XMLSerializer = XMLSerializer = dom.XMLSerializer;

	document = new Document().createDocument(null, null, null);
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
			//str = str.replace(/>\s{1,}</g, '><');
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
				if (i === 0 && lines[i].toLowerCase() === decl) continue;
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
		nodeToJSON: function(node, stringify) {
			var interpret = function(leaf) {
					var obj = {},
						attr,
						type,
						item,
						childName,
						cConstr,
						childVal;

					switch (leaf.nodeType) {
						case 1:
							type = leaf.getAttribute('d:constr');
							if (type === 'Array') obj = [];

							attr = leaf.attributes;
							for (var j=0, jl=attr.length, a; j<jl; j++) {
								a = attr.item(j);
								if (a.nodeName.match(/\:d|d\:/g) !== null) continue;

								type = leaf.getAttribute('d:'+ a.nodeName);
								childVal = (type) ? window[ type ]( a.nodeValue === 'false' ? '' : a.nodeValue ) : a.nodeValue;
								obj['@'+ a.nodeName] = childVal;
							}
							break;
						case 3:
							type = leaf.parentNode.getAttribute('d:type');
							childVal = (type) ? window[ type ]( leaf.nodeValue === 'false' ? '' : leaf.nodeValue ) : leaf.nodeValue;
							obj = childVal;
							break;
					}
					if (leaf.hasChildNodes()) {
						for(var i=0, il=leaf.childNodes.length; i<il; i++) {
							item      = leaf.childNodes.item(i);
							childName = item.nodeName;
							attr      = leaf.attributes;

							if (childName === '#text') {
								cConstr = leaf.getAttribute('d:constr');
								childVal = cConstr === 'Boolean' && item.textContent === 'false' ? '' : item.textContent;

								if (!cConstr && !attr.length) obj = childVal;
								else if (cConstr && attr.length === 1) obj = window[cConstr](childVal);
								else obj[childName] = (cConstr)? window[cConstr](childVal) : childVal;
							} else {
								if (obj[childName]) {
									
									if (obj[childName].push) obj[childName].push( interpret(item) );
									else obj[childName] = [obj[childName], interpret(item)];
									continue;
								}
								cConstr = item.getAttribute('d:constr');
								switch (cConstr) {
									case 'null':
										if (obj.push) obj.push(null);
										else obj[childName] = null;
										break;
									case 'Array':
										if (item.parentNode.firstChild === item &&
											item.getAttribute('d:constr') === 'Array' && childName !== 'item') {
											obj[childName] = [interpret(item)];
										}
										else if (obj.push) obj.push( interpret(item) );
										else obj[childName] = interpret(item);
										break;
									case 'String':
									case 'Number':
									case 'Boolean':
										childVal = cConstr === 'Boolean' && item.textContent === 'false' ? '' : item.textContent;

										if (obj.push) obj.push( window[cConstr](childVal) );
										else obj[childName] = interpret(item);
										break;
									default:
										if (obj.push) obj.push( interpret( item ) );
										else obj[childName] = interpret( item );
								}
							}
						}
					}
					return obj;
				},
				node = (node.nodeType === 9) ? node.documentElement : node,
				ret = interpret(node),
				rn  = ret[node.nodeName];

			// exclude root, if "node" is root node
			if (node === node.ownerDocument.documentElement && rn && rn.constructor === Array) {
				ret = rn;
			}
			if (stringify && stringify.toString() === 'true') stringify = '\t';
			return stringify ? JSON.stringify(ret, null, stringify) : ret;
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
