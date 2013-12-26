
// Javascript by Hakan Bilgin (c) 2013-2014

(function(window, document, undefined) {
	'use strict';

	var Defiant = {
		is_safari: navigator.userAgent.match(/safari/i) !== null,
		xml_decl: '<?xml version="1.0" encoding="utf-8"?>',
		render: function(template, data) {
			var processor = new XSLTProcessor(),
				xml       = JSON.toXML(data),
				span      = document.createElement('span'),
				scripts;
			if (!this.xsl_template) {
				var xTemp = document.getElementById('defiant_xsl'),
					str   = '<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:defiant="defiant-custom-namespace">'+
									xTemp.innerHTML.replace(/defiant:(\w+)/g, '$1') +'</xsl:stylesheet>';
				this.xsl_template = this.xmlFromString(str);
			}
			var temp = this.xsl_template.selectSingleNode('//xsl:template[@name="'+ template +'"]'),
				fragment;
			temp.setAttribute('match', '/');
			processor.importStylesheet(this.xsl_template);
			span.appendChild(processor.transformToFragment(xml, document));
			temp.removeAttribute('match');

			if (this.is_safari) {
				scripts = span.getElementsByTagName('script');
				for (var i=0, il=scripts.length; i<il; i++) scripts[i].defer = true;
			}

			return span.innerHTML;
		},
		xsl_support: function() {
			var support = false;
			if (document.recalc) {
				support = true; // IE 5+
			} else if (window.XMLHttpRequest !== undefined && window.XSLTProcessor !== undefined) {
				// Mozilla 0.9.4+, Opera 9+
				var processor = new XSLTProcessor();
				support = (typeof(processor.transformDocument) === 'function') ?
					(window.XMLSerializer !== undefined) : true
			}
			return support;
		},
		xmlFromString: function(str) {
			var parser,
				xmlDoc;
			str = str.replace(/> {1,}</g, '><');
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
		}
	};

	// extending
	if (!String.prototype.fill) String.prototype.fill = function(i,c) {var str = this; c = c || ' '; for (; str.length<i; str+=c){}; return str;};
	if (!String.prototype.trim) String.prototype.trim = function () {return this.replace(/^\s+|\s+$/gm, '');};

	if (!Document.selectNodes)      Document.prototype.selectNodes        = function(XPath, XNode) {if(!XNode) XNode = this; this.ns = this.createNSResolver(this.documentElement); this.qI = this.evaluate(XPath, XNode, this.ns, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null); var aResult = []; for(var i=0; i<this.qI.snapshotLength; i++) aResult[i] = this.qI.snapshotItem(i); return aResult;};
	if (!Document.selectSingleNode) Document.prototype.selectSingleNode   = function(XPath, XNode) {if(!XNode) XNode = this; this.xI = this.selectNodes(XPath, XNode); return (this.xI.length > 0)? this.xI[0] : null ;};
	if (!Node.selectNodes)          Node.prototype.selectNodes            = function(XPath) {return this.ownerDocument.selectNodes(XPath, this);};
	if (!Node.selectSingleNode)     Node.prototype.selectSingleNode       = function(XPath) {return this.ownerDocument.selectSingleNode(XPath, this);};
	if (!Node.xml)                  Node.prototype.__defineGetter__('xml',  function() {
		var ser    = new XMLSerializer(),
			str    = ser.serializeToString(this).replace(/(>)\s*(<)(\/*)/g, '$1\n$2$3'),
			lines  = str.split('\n'),
			indent = -1,
			s      = '',
			start,
			end;
		for (var i=0, il=lines.length; i<il; i++) {
			if (lines[i].toLowerCase() === Defiant.xml_decl.toLowerCase()) continue;
			start = lines[i].match(/<[^\/]+>/g) !== null;
			end   = lines[i].match(/<\/\w+>/g) !== null;
			if (lines[i].match(/<.*?\/>/g) !== null) start = end = true;
			if (start) indent++;
			lines[i] = s.fill(indent, '\t') + lines[i];
			if (start && end) indent--;
			if (!start && end) indent--;
		}
		return lines.join('\n').replace(/\t/g, s.fill(4, ' '));
	});
	if (!Node.text) {
		Node.prototype.__defineGetter__('text', function() {return this.textContent;});
	    Node.prototype.__defineSetter__('text', function(s) {this.textContent = s;});
	}
	if (!Node.toJSON) {
		Node.prototype.toJSON = function(stringify) {
			var interpreter = function(leaf) {
					var obj = {},
						attr,
						val;
					if (typeof(leaf) === 'string') {
						leaf = Defiant.xmlFromString(leaf);
					}
					if (leaf.nodeType == 1) {
						attr = leaf.attributes;
						if (attr.length > 0) {
							for (var j=0, jl=attr.length, a; j<jl; j++) {
								a = attr.item(j);
								val = a.nodeValue;
								obj['@'+ a.nodeName] = (val == +val)? +val : val ;
							}
						}
					} else if (leaf.nodeType == 3) {
						val = leaf.nodeValue;
						obj = (val == +val)? +val : val ;
					}
					if (leaf.hasChildNodes()) {
						for(var i=0, il=leaf.childNodes.length; i<il; i++) {
							var item     = leaf.childNodes.item(i),
								nodeName = item.nodeName,
								children = item.childNodes;
							if (typeof(obj[nodeName]) == 'undefined') {
								if (nodeName === '#text') {
									val = item.nodeValue;
									if (JSON.stringify(obj) === '{}') return (val == +val)? +val : val ;
									obj[nodeName] = val;
								}
								obj[nodeName] = interpreter(item);
							} else {
								if (typeof(obj[nodeName].push) == 'undefined') {
									var old = obj[nodeName];
									obj[nodeName] = [];
									obj[nodeName].push(old);
								}
								obj[nodeName].push(interpreter(item));
							}
						}
					}
					return obj;
				},
				ret = interpreter(this);
			return stringify ? JSON.stringify(ret, null, '\t') : ret;
		};
	}

	if (!window.JSON) {
		window.JSON = {
			parse: function (sJSON) { return eval("(" + sJSON + ")"); },
			stringify: function (vContent) {
				if (vContent instanceof Object) {
					var sOutput = "";
					if (vContent.constructor === Array) {
			  			for (var nId = 0; nId < vContent.length; sOutput += this.stringify(vContent[nId]) + ",", nId++);
			  			return "[" + sOutput.substr(0, sOutput.length - 1) + "]";
					}
					if (vContent.toString !== Object.prototype.toString) {
						return "\"" + vContent.toString().replace(/"/g, "\\$&") + "\"";
					}
					for (var sProp in vContent) {
						sOutput += "\"" + sProp.replace(/"/g, "\\$&") + "\":" + this.stringify(vContent[sProp]) + ",";
					}
					return "{" + sOutput.substr(0, sOutput.length - 1) + "}";
				}
		  		return typeof vContent === "string" ? "\"" + vContent.replace(/"/g, "\\$&") + "\"" : String(vContent);
			}
		};
	}
	if (!JSON.toXML) {
		JSON.toXML = function(tree) {
			var interpreter = {
					repl: function(dep) {
						for (var key in this) {
							delete this[key];
						}
						interpreter.extend(this, dep);
					},
					to_xml: function(tree) {
						var str = this.hash_to_xml(null, tree).replace(/<\d{1,}>|<\/\d{1,}>/g, '');
						return Defiant.xmlFromString(str);
					},
					hash_to_xml: function(name, tree, is_array) {
						var elem = [],
							attr = [];
						for (var key in tree) {
							var val     = tree[key],
								type    = typeof(val),
								n       = is_array ? name : key,
								is_attr = n.slice(0,1) === '@';
							if (is_attr) n = n.slice(1);
							switch (true) {
								case (typeof(val) === 'undefined' || val == null):
									elem.push( '<'+ n +' />' );
									break;
								case (type === 'object'):
									elem.push( this.hash_to_xml(n, val, val.constructor == Array) );
									break;
								default:
									if (is_attr) attr.push( n +'="'+ val +'"' );
									else  elem.push( this.scalar_to_xml(n, val) );
							}
						}
						if (!name) name = 'data';
						return is_array ? elem.join('')
										: '<'+ name + (attr.length ? ' '+ attr.join(' ') : '') + (elem.length ? '>'+ elem.join('') +'</'+ name +'>' : '/>' );
					},
					scalar_to_xml: function(name, text) {
						return (name === '#text')? this.escape_xml(text)
												 : '<' + name + '>' + this.escape_xml(text) + '</' + name + '>';
					},
					escape_xml: function(text) {
						return String(text) //.replace(/&/g, '&amp;')
											.replace(/</g, '&lt;')
											.replace(/>/g, '&gt;')
											.replace(/"/g, '&quot;');
					},
					extend: function(safe, deposit) {
						for (var content in deposit) {
							if (!safe[content] || typeof(deposit[content]) !== 'object') {
								safe[content] = deposit[content];
							} else {
								this.extend(safe[content], deposit[content]);
							}
						}
						return safe;
					}
				},
				xdoc = interpreter.to_xml.call(interpreter, tree);
			interpreter.repl.call(tree, xdoc.documentElement.toJSON());
			return xdoc;
		};
	}
	if (!JSON.search) {
		/* TODO:
		 * tracing matching lines should be
		 * separated from main branch.
		 */
		JSON.search = function(tree, xpath, single) {
			if (tree.constructor !== Object) throw 'object is not valid JSON';
			var trc = single === null ? [] : false,
				doc = JSON.toXML(tree),
				res = doc[ single ? 'selectSingleNode' : 'selectNodes' ](xpath),
				ret = [],
				map,
				node,
				node_index,
				map_index,
				char_index,
				line_index,
				line_len,
				item_map,
				current;
			if (single) res = [res];
			//console.log( res );
			for (var i=0, il=res.length; i<il; i++) {
				map  = [];
				node = res[i];
				// can't access "root"
				if (node === node.ownerDocument.documentElement) continue;
				// find out index - speeds up search later and finds
				// correct matches if xpath contains positon(), last(), etc
				node_index = 0;
				while (node = node.previousSibling) node_index++;
				// reset node
				node = res[i];
				while (node !== doc.documentElement) {
					map.push({
						node : node,
						key  : node.nodeName,
						val  : (node.nodeType === 2) ? node.value : node.toJSON(true),
						index: node_index
					});
					node = (node.nodeType === 2) ? node.ownerElement : node.parentNode;
				}
				ret.push(map.reverse());
			}
			for (i=0, il=ret.length; i<il; i++) {
				current   = tree;
				map_index = 0;
				line_index = 0;
				char_index = 0;
				while (map_index < ret[i].length) {
					item_map = ret[i][map_index];
					current  = current[ item_map.key ];
					if (trc && map_index < ret[i].length-1) {
						var t1 = item_map.val.replace(/\t/g, ''),
							t2 = ret[i][map_index+1].val.replace(/\t/g, ''),
							cI = t1.indexOf(t2);
						char_index += cI;
					}
					if (typeof(current) === 'object' && current.constructor == Array) {
						for (var j=item_map.index, jl=current.length; j<jl; j++) {
							if (item_map.val === JSON.stringify(current[j], null, '\t') ) {
								current = current[j];
								break;
							}
						}
					}
					map_index++;
				}
				if (trc) {
					line_index = (char_index)? ret[i][0].val.replace(/\t/g, '').slice(0,char_index).match(/\n/g).length : 0;
					line_len = item_map.val.match(/\n/g);
					trc.push([line_index+2, (line_len === null ? 0 : line_len.length)]);
				}
				switch (item_map.node.nodeType) {
					case 2: ret[i] = item_map.node.value; break;
					case 3: ret[i] = item_map.node.text; break;
					default: ret[i] = current || item_map.val;
				}
			}
			if (trc) this.trace = trc;
			else delete this.trace;
			return ret;
		};
	}

	window.Defiant = Defiant;

})(window, document);
