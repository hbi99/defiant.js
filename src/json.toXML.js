
if (!JSON.toXML) {
	JSON.toXML = function(tree) {
		'use strict';

		var interpreter = {
			rx_validate_name : /^(?!xml)[a-z_][\w\d.:]*$/i,
			rx_node          : /<(.+?)( .*?)>/,
			rx_constructor   : /<(.+?)( d:contr=".*?")>/,
			rx_namespace     : / xmlns\:d="defiant\-namespace"/,
			rx_data          : /(<.+?>)(.*?)(<\/d:data>)/i,
			rx_function      : /function (\w+)/i,
			replace: function(dep) {
				for (var key in this) {
					delete this[key];
				}
				Defiant.extend(this, dep);
			},
			to_xml: function(tree) {
				var str = this.hash_to_xml(null, tree);
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
					cnName,
					i;

				for (key in tree) {
					val = tree[key];
					if (val === null || val === undefined || val.toString() === 'NaN') val = null;

					is_attr = key.slice(0,1) === '@';
					cname   = array_child ? name : key;
					if (cname == +cname && tree.constructor !== Object) cname = 'd:item';
					if (val === null) {
						constr = null;
						cnName = false;
					} else {
						constr = val.constructor;
						cnName = constr.toString().match(this.rx_function)[1];
					}

					if (is_attr) {
						attr.push( cname.slice(1) +'="'+ this.escape_xml(val) +'"' );
						if (cnName !== 'String') attr.push( 'd:'+ cname.slice(1) +'="'+ cnName +'"' );
					} else if (val === null) {
						elem.push( this.scalar_to_xml( cname, val ) );
					} else {
						switch (constr) {
							case Function:
								// if constructor is function, then it's not a JSON structure
								// it's a JS object
								//throw 'ERROR!';
								break;
							case Object:
								elem.push( this.hash_to_xml( cname, val ) );
								break;
							case Array:
								if (key === cname) {
									val_is_array = val.constructor === Array;
									if (val_is_array) {
										i = val.length;
										while (val[i]) {
											i--;
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
								if (cname === '#text') {
									attr.push('d:constr="'+ cnName +'"');
									elem.push( this.escape_xml(val) );
									break;
								}
								/* falls through */
							case Number:
							case Boolean:
								if (cname === '#text' && cnName !== 'String') {
									attr.push('d:constr="'+ cnName +'"');
									elem.push( this.escape_xml(val) );
									break;
								}
								elem.push( this.scalar_to_xml( cname, val ) );
								break;
						}
					}
				}
				if (!name) {
					name = 'd:data';
					attr.push(Defiant.namespace);
					if (is_array) attr.push('d:constr="Array"');
				}
				if (name.match(this.rx_validate_name) === null) {
					attr.push( 'd:name="'+ name +'"' );
					name = 'd:name';
				}
				if (array_child) return elem.join('');

				return '<'+ name + (attr.length ? ' '+ attr.join(' ') : '') + (elem.length ? '>'+ elem.join('') +'</'+ name +'>' : '/>' );
			},
			scalar_to_xml: function(name, val, override) {
				var attr = '',
					text,
					constr,
					cnName;

				// check whether the nodename is valid
				if (name.match(this.rx_validate_name) === null) {
					attr += ' d:name="'+ name +'"';
					name = 'd:name';
					override = false;
				}
				if (val === null || val.toString() === 'NaN') val = null;
				if (val === null) return '<'+ name +' d:constr="null"/>';
				if (val.length === 1 && val[0].constructor === Object) {
					
					text = this.hash_to_xml(false, val[0]);

					var a1 = text.match(this.rx_node),
						a2 = text.match(this.rx_constructor);
					a1 = (a1 !== null)? a1[2]
								.replace(this.rx_namespace, '')
								.replace(/>/, '')
								.replace(/"\/$/, '"') : '';
					a2 = (a2 !== null)? a2[2] : '';

					text = text.match(this.rx_data);
					text = (text !== null)? text[2] : '';

					return '<'+ name + a1 +' '+ a2 +' d:type="ArrayItem">'+ text +'</'+ name +'>';
				} else if (val.length === 0 && val.constructor === Array) {
					return '<'+ name +' d:constr="Array"/>';
				}
				// else 
				if (override) {
					return this.hash_to_xml( name, val, true );
				}

				constr = val.constructor;
				cnName = constr.toString().match(this.rx_function)[1];
				text = (constr === Array)   ? this.hash_to_xml( 'd:item', val, true )
											: this.escape_xml(val);

				attr += ' d:constr="'+ cnName +'"';

				return (name === '#text') ? this.escape_xml(val) : '<'+ name + attr +'>'+ text +'</'+ name +'>';
			},
			escape_xml: function(text) {
				return String(text) .replace(/</g, '&lt;')
									.replace(/>/g, '&gt;')
									.replace(/"/g, '&quot;')
									.replace(/&nbsp;/g, '&#160;');
			}
		},
		doc = interpreter.to_xml.call(interpreter, tree);

		interpreter.replace.call(tree, Defiant.node.toJSON(doc.documentElement));
		return doc;
	};
}
