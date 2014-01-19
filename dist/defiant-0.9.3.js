/* 
 * Defiant.js v0.9.3 
 * Smart templating with XSLT and XPath. 
 * http://defiantjs.com 
 * 
 * Copyright (c) 2013-2014, Hakan Bilgin <hbi@longscript.com> 
 * Licensed under the MIT License 
 */ 

if (typeof module === "undefined") {
	var module = { exports: undefined };
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
		is_safari : (typeof navigator !== 'undefined')? navigator.userAgent.match(/safari/i) !== null : false,
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

			temp = this.node.selectSingleNode(this.xsl_template, '//xsl:template[@name="'+ opt.template +'"]');
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
			var parser = new DOMParser(),
				xmlDoc;
			str = str.replace(/>\s{1,}</g, '><');
			if (str.trim().match(/<\?xml/) === null) str = this.xml_decl + str;
			xmlDoc = parser.parseFromString(str, 'text/xml');
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
			return that.load(url, callback);
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
		load: function(url, cb) {
			var self = this,
				fn = function() {
					var headLoc = document.getElementsByTagName("head").item(0),
						scriptObj = document.createElement("script");
					scriptObj.setAttribute("type", "text/javascript");
					scriptObj.setAttribute("charset", "utf-8");
					scriptObj.setAttribute("src", url +'&callback=Defiant.ajax.callback');
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
				for (var i=0, il=self.res.length; i<il; i++) {
					fn.call(self, self.res[i]);
				}
			});
			return this;
		},
		search: function(xpath) {
			var self = this,
				fn = function() {
					self.res = JSON.search(this.data, xpath);
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

// IE polyfills
if (window.ActiveXObject !== undefined) {

	if (typeof(DOMParser) === 'undefined') {
		var DOMParser = function() {};
		DOMParser.prototype.parseFromString = function(str, contentType) {
			var xmldata;
			if(typeof(ActiveXObject) != 'undefined') {
				xmldata = new ActiveXObject('MSXML.DomDocument');
				xmldata.async = false;
				xmldata.loadXML(str);
				return xmldata;
			} else if(typeof(XMLHttpRequest) != 'undefined') {
				xmldata = new XMLHttpRequest();
				if(!contentType) {
					contentType = 'application/xml';
				}
				xmldata.open('GET', 'data:' + contentType + ';charset=utf-8,' + encodeURIComponent(str), false);
				if(xmldata.overrideMimeType) {
					xmldata.overrideMimeType(contentType);
				}
				xmldata.send(null);
				return xmldata.responseXML;
			}
		};
	}

	if (typeof(XMLSerializer) === 'undefined') {
		var XMLSerializer = function() {};
		XMLSerializer.prototype = {
			serializeToString: function(node) {
				return node.xml;
			}
		};
	}

	if (typeof(XSLTProcessor) === 'undefined') {
		var XSLTProcessor = function() {};
		XSLTProcessor.prototype = {
			importStylesheet: function(xsldoc) {
				this.xsldoc = xsldoc;
			},
			transformToFragment: function(data, doc) {
				var str = data.transformNode(this.xsldoc),
					span = document.createElement('span');
				span.innerHTML = str;
				return span;
			}
		};
	}

	Object.prototype.getName = function() {
		var funcNameRegex = /function (.{1,})\(/,
			results = (funcNameRegex).exec(this.toString());
		return (results && results.length > 1) ? results[1] : '';
	};
}


// extending STRING
if (!String.prototype.fill) {
	String.prototype.fill = function(i,c) {
		var str = this;
		c = c || ' ';
		for (; str.length<i; str+=c){}
		return str;
	};
}

if (!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^\s+|\s+$/gm, '');
	};
}

/* temporary (!?)
 * - used to visual matching of search results
 */
if (!String.prototype.count_nl) {
	String.prototype.count_nl = function () {
		var m = this.match(/\n/g);
		return m ? m.length : 0;
	};
}
if (!String.prototype.notabs) {
	String.prototype.notabs = function () {
		return this.replace(/\t/g, '');
	};
}

if (typeof(JSON) === 'undefined') {
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
/* jshint ignore:end */

if (!JSON.toXML) {
	JSON.toXML = function(tree) {
		'use strict';

		var interpreter = {
				replace: function(dep) {
					for (var key in this) {
						delete this[key];
					}
					Defiant.extend(this, dep);
				},
				to_xml: function(tree) {
					var str = this.hash_to_xml(null, tree);
					//console.log(str);
					return Defiant.xmlFromString(str);
				},
				hash_to_xml: function(name, tree, array_child) {
					var is_array = tree.constructor === Array,
						elem = [],
						attr = [],
						key,
						val,
						val_is_array,
						type,
						is_attr,
						cname,
						constr,
						cnName;

					for (key in tree) {
						val     = tree[key];
						if (val === null || val === undefined || val.toString() === 'NaN') val = null;

						is_attr = key.slice(0,1) === '@';
						cname   = array_child ? name : key;
						if (cname == +cname && tree.constructor !== Object) cname = 'd:item';
						if (val === null) {
							constr  = null;
							cnName  = false;
						//} else if (cname === 'getName') {
						//	console.log(val);
						//	continue;
						} else {
							constr  = val.constructor;
							cnName  = (constr.name !== undefined)? constr.name : constr.getName();	
						}

						if (is_attr) {
							attr.push( cname.slice(1) +'="'+ this.escape_xml(val) +'"' );
							if (cnName !== 'String') attr.push( 'd:'+ cname.slice(1) +'="'+ cnName +'"' );
						} else if (val === null) {
							elem.push( this.scalar_to_xml( cname, val ) );
						} else {
							switch (constr) {
								case Object:
									elem.push( this.hash_to_xml( cname, val ) );
									break;
								case Array:
									if (key === cname) {
										val_is_array = val.constructor === Array;
										if (val_is_array) {
											for (var i=0, il=val.length; i<il; i++) {
												if (val[i].constructor === Array) val_is_array = true;
												if (!val_is_array && val[i].constructor === Object) val_is_array = true;
											}
										}
										elem.push( this.scalar_to_xml( cname, val, val_is_array ) );
										break;
									}
									/* falls through */
								case String:
									if (typeof(val) === 'string') val = val.toString().replace(/\&/g, '&amp;');
									/* falls through */
								case Number:
								case Boolean:
									if (cname === '#text' && cnName !== 'String') attr.push('d:constr="'+ cnName+'"');
									elem.push( this.scalar_to_xml( cname, val ) );
									break;
								case Function:
									break;
								default:
									//console.log( val.constructor, key, val );
									//throw 'ERROR! '+ key;
							}
						}
					}
					if (!name) {
						name = 'd:data';
						attr.push(Defiant.namespace);
						if (is_array) attr.push('d:constr="Array"');
					}
					if (name.match(/^(?!xml)[a-z_][\w\d.:]*$/i) === null) {
						attr.push( 'd:name="'+ name +'"' );
						name = 'd:name';
					}
					if (array_child) return elem.join('');

					return '<'+ name + (attr.length ? ' '+ attr.join(' ') : '') + (elem.length ? '>'+ elem.join('') +'</'+ name +'>' : '/>' );
				},
				scalar_to_xml: function(name, val, override) {
					var text,
						attr = '',
						constr,
						cnName;

					// chech whether the nodename is valid
					if (name.match(/^(?!xml)[a-z_][\w\d.:]*$/i) === null) {
						attr += ' d:name="'+ name +'"';
						name = 'd:name';
						override = false;
					}
					if (val === null || val.toString() === 'NaN') val = null;
					if (val === null) return '<'+ name +' d:constr="null"/>';
					if (override) return this.hash_to_xml( name, val, true );

					constr = val.constructor;
					cnName = constr.name || constr.getName();
					text = (constr === Array)   ? this.hash_to_xml( 'd:item', val, true )
												: this.escape_xml(val);

					if ( (cnName) !== 'String' ) {
						attr += ' d:constr="'+ (cnName) +'"';
					}

					return (name === '#text') ? this.escape_xml(val) : '<'+ name + attr +'>'+ text +'</'+ name +'>';
				},
				escape_xml: function(text) {
					return String(text) .replace(/</g, '&lt;')
										.replace(/>/g, '&gt;')
										.replace(/"/g, '&quot;');
				}
			},
			doc = interpreter.to_xml.call(interpreter, tree);

		interpreter.replace.call(tree, Defiant.node.toJSON(doc.documentElement));
		return doc;
	};
}


if (!JSON.search) {
	JSON.search = function(tree, xpath, single) {
		'use strict';
		
		var doc  = JSON.toXML(tree),
			od   = doc.documentElement,
			xres = Defiant.node[ single ? 'selectSingleNode' : 'selectNodes' ](doc, xpath),
			jres = [],
			ret  = [],
			map,
			node,
			map_index,
			item_map,
			current,
			is_attr,
			key,
			do_search = function(current) {
				if (map_index === jres[i].length) return current;
				switch (current.constructor) {
					case Array:
						for (var j=0, jl=current.length, check; j<jl; j++) {
							if (item_map.val === JSON.stringify(current[j], null, '\t')) {
								if (map_index < jres[i].length) {
									map_index++;
									item_map = jres[i][map_index];
									return do_search( current[j] );
								}
							}
						}
						if (j === jl) {
							if (item_map.val === JSON.stringify(current, null, '\t')) {
								map_index++;
								item_map = jres[i][map_index];

								for (j=0; j<jl; j++) {
									check = do_search( current[j] );
									if (check) return check;
								}
							}
							return current;
						}
						break;
					default:
						is_attr = jres[i][map_index].node.nodeType;
						key = (is_attr === 1)? jres[i][map_index].node.getAttribute('d:name') : false;
						//key = jres[i][map_index].node.getAttribute('d:name');
						key = key || item_map.key;
						current = current[key];
						if (typeof(current) !== 'object') {
							map_index++;
							item_map = jres[i][map_index];
							return current;
						}
						if (current.constructor === Object) {
							map_index++;
							item_map = jres[i][map_index];
						}
				}
				return do_search( current );
			};

		if (single) xres = [xres];
		//console.log( 'x-RES:', xres );
		for (i=0, il=xres.length; i<il; i++) {
			map  = [];
			node = xres[i];
			// can't access json "root"
			if (node === od) continue;
			while (node !== od) {
				is_attr = node.nodeType === 2;
				map.push({
					node : node,
					key  : (is_attr ? '@' : '') + node.nodeName,
					val  : is_attr ? node.value : Defiant.node.toJSON(node, '\t')
				});
				node = is_attr ? node.ownerElement : node.parentNode;
			}
			jres.push(map.reverse());
		}
		//console.log( 'j-RES:', jres );
		for (var i=0, il=jres.length; i<il; i++) {
			map_index  = 0;
			item_map   = jres[i][map_index];
			ret.push( do_search(tree) );
		}
		// if tracing is enabled
		this.trace = JSON.search.trace ? JSON.mtrace(tree, jres) : false;

		//console.log( 'RES:', ret );
		return Defiant.result(ret);
	};
}


if (!JSON.mtrace) {
	JSON.mtrace = function(root, map) {
		'use strict';

		var trace = [],
			sroot = JSON.stringify( root, null, '\t' ).notabs(),
			mroot,
			mrow,
			mlen,
			is_leaf,
			char_index,
			line_index,
			line_length;

		for (var i=0, il=map.length; i<il; i++) {
			mrow       = map[i];
			char_index = 0;
			mroot      = sroot;
			mlen       = mrow.length;
			is_leaf    = mrow[mlen-1].val.match(/[\{\}:\[\]]/g) === null;

			if (is_leaf) mlen--;
			if (mrow[0].val.notabs() !== sroot && mlen > 0) {
				mroot = mrow[0].val.notabs();
				char_index += sroot.indexOf( mroot );
			}
			for (var j=0, jl=mlen; j<jl; j++) {
				char_index += mroot.indexOf( mrow[j].val.notabs() );
				mroot = mrow[j].val.notabs();
			}
			if (is_leaf) {
				char_index += mroot.indexOf( '"'+ mrow[j].key +'": ' );
			}
			line_index  = sroot.slice( 0, char_index ).count_nl()+1;
			line_length = mrow[ is_leaf ? mlen : mlen-1  ].val.count_nl();
			trace.push( [line_index, line_length] );
		}
		return trace;
	};
}


Defiant.node.selectNodes = function(XNode, XPath) {
	if (XNode.evaluate) {
		var ns = XNode.createNSResolver(XNode.documentElement),
			qI = XNode.evaluate(XPath, XNode, ns, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null),
			res = [],
			i   = 0,
			il  = qI.snapshotLength;
		for (; i<il; i++) {
			res.push( qI.snapshotItem(i) );
		}
		return res;
	} else return XNode.selectNodes(XPath);
};
Defiant.node.selectSingleNode = function(XNode, XPath) {
	if (XNode.evaluate) {
		var xI = this.selectNodes(XNode, XPath);
		return (xI.length > 0)? xI[0] : null;
	} else return XNode.selectSingleNode(XPath);
};


Defiant.node.prettyPrint = function(node) {
	var tabs = Defiant.tabsize,
		decl = Defiant.xml_decl.toLowerCase(),
		ser  = new XMLSerializer(),
		xstr = ser.serializeToString(node);
	if (Defiant.env !== 'development') {
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
		start = lines[i].match(/<[A-Za-z_\:]+.*?>/g) !== null;
		//start = lines[i].match(/<[^\/]+>/g) !== null;
		end   = lines[i].match(/<\/[\w\:]+>/g) !== null;
		if (lines[i].match(/<.*?\/>/g) !== null) start = end = true;
		if (start) indent++;
		lines[i] = String().fill(indent, '\t') + lines[i];
		if (start && end) indent--;
		if (!start && end) indent--;
	}
	return lines.join('\n').replace(/\t/g, String().fill(tabs, ' '));
};


Defiant.node.toJSON = function(xnode, stringify) {
	'use strict';

	var interpret = function(leaf) {
			var obj = {},
				attr,
				type,
				item,
				cname,
				cConstr,
				cval,
				text;

			switch (leaf.nodeType) {
				case 1:
					type = leaf.getAttribute('d:constr');
					if (type === 'Array') obj = [];

					attr = leaf.attributes;
					for (var j=0, jl=attr.length, a; j<jl; j++) {
						a = attr.item(j);
						if (a.nodeName.match(/\:d|d\:/g) !== null) continue;

						type = leaf.getAttribute('d:'+ a.nodeName);
						if (type && type !== 'undefined') {
							cval = window[ type ]( (a.nodeValue === 'false') ? '' : a.nodeValue );
						} else {
							cval = a.nodeValue;
						}
						obj['@'+ a.nodeName] = cval;
					}
					break;
				case 3:
					type = leaf.parentNode.getAttribute('d:type');
					cval = (type) ? window[ type ]( leaf.nodeValue === 'false' ? '' : leaf.nodeValue ) : leaf.nodeValue;
					obj = cval;
					break;
			}
			if (leaf.hasChildNodes()) {
				for(var i=0, il=leaf.childNodes.length; i<il; i++) {
					item  = leaf.childNodes.item(i);
					cname = item.nodeName;
					attr  = leaf.attributes;

					if (cname === 'd:name') {
						cname = item.getAttribute('d:name');
					}
					if (cname === '#text') {
						cConstr = leaf.getAttribute('d:constr');
						if (cConstr === 'undefined') cConstr = undefined;
						text = item.textContent || item.text;
						cval = cConstr === 'Boolean' && text === 'false' ? '' : text;

						if (!cConstr && !attr.length) obj = cval;
						else if (cConstr && attr.length === 1) {
							obj = window[cConstr](cval);
						} else if (!leaf.hasChildNodes()) {
							obj[cname] = (cConstr)? window[cConstr](cval) : cval;
						} else {
							if (attr.length < 3) obj = (cConstr)? window[cConstr](cval) : cval;
							else obj[cname] = (cConstr)? window[cConstr](cval) : cval;
						}
					} else {
						if (obj[cname]) {
							if (obj[cname].push) obj[cname].push( interpret(item) );
							else obj[cname] = [obj[cname], interpret(item)];
							continue;
						}
						cConstr = item.getAttribute('d:constr');
						switch (cConstr) {
							case 'null':
								if (obj.push) obj.push(null);
								else obj[cname] = null;
								break;
							case 'Array':
								//console.log( Defiant.node.prettyPrint(item) );
								if (item.parentNode.firstChild === item && cConstr === 'Array' && cname !== 'd:item') {
									if (cname === 'd:item' || cConstr === 'Array') obj[cname] = [interpret(item)];
									else obj[cname] = interpret(item);
								}
								else if (obj.push) obj.push( interpret(item) );
								else obj[cname] = interpret(item);
								break;
							case 'String':
							case 'Number':
							case 'Boolean':
								text = item.textContent || item.text;
								cval = cConstr === 'Boolean' && text === 'false' ? '' : text;

								if (obj.push) obj.push( window[cConstr](cval) );
								else obj[cname] = interpret(item);
								break;
							default:
								if (obj.push) obj.push( interpret( item ) );
								else obj[cname] = interpret( item );
						}
					}
				}
			}
			return obj;
		},
		node = (xnode.nodeType === 9) ? xnode.documentElement : xnode,
		ret = interpret(node),
		rn  = ret[node.nodeName];

	// exclude root, if "this" is root node
	if (node === node.ownerDocument.documentElement && rn && rn.constructor === Array) {
		ret = rn;
	}
	if (stringify && stringify.toString() === 'true') stringify = '\t';
	return stringify ? JSON.stringify(ret, null, stringify) : ret;
};


// check if jQuery is present
if (typeof(jQuery) !== 'undefined') {
	(function ( $ ) {
		'use strict';

		$.fn.defiant = function(template, xpath) {
			this.html( Defiant.render(template, xpath) );
			return this;
		};

	}(jQuery));
}
