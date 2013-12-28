
if (!JSON.toXML) {
	JSON.toXML = function(tree) {
		var ns_defiant,
			interpreter = {
				array_flag: 'defiant:type="array"',
				repl: function(dep) {
					for (var key in this) {
						delete this[key];
					}
					Defiant.extend(this, dep);
				},
				to_xml: function(tree) {
					var str = this.hash_to_xml(null, tree).replace(/<\d{1,}>|<\/\d{1,}>/g, '');
					return Defiant.xmlFromString(str);
				},
				hash_to_xml: function(name, tree, is_array) {
					var elem = [],
						attr = [],
						tree_is_array = tree.constructor === Array,
						val_is_array,
						is_attr,
						parsed,
						type,
						key,
						val,
						n;
					for (key in tree) {
						val     = tree[key],
						type    = typeof(val),
						n       = is_array ? name : key,
						is_attr = n.slice(0,1) === '@';
						if (is_attr) n = n.slice(1);
						switch (true) {
							case (typeof(val) === 'undefined' || val == null):
								elem.push( '<'+ ( tree_is_array ? 'i' : n) +' />' );
								break;
							case (type === 'object'):
								val_is_array = val.constructor === Array;
								parsed = this.hash_to_xml(n, val, val_is_array);
								if (tree_is_array) {
									ns_defiant = true;
									parsed = '<i '+ (val_is_array ? this.array_flag : '') +'>'+ parsed +'</i>';
								}
								elem.push( parsed );
								break;
							default:
								if (is_attr) attr.push( n +'="'+ this.escape_xml(val) +'"' );
								else elem.push( this.scalar_to_xml(n, val, tree_is_array) );
						}
					}
					if (!name) {
						name = 'data';
						if (ns_defiant || tree_is_array) attr.push(Defiant.namespace);
					}
					// mark node as array type
					if (tree_is_array) attr.push(this.array_flag);

					return is_array ? elem.join('')
									: '<'+ name + (attr.length ? ' '+ attr.join(' ') : '') + (elem.length ? '>'+ elem.join('') +'</'+ name +'>' : '/>' );
				},
				scalar_to_xml: function(name, text, is_array) {
					if (is_array) name = 'i';
					return (name === '#text')? this.escape_xml(text)
											 : '<' + name + '>' + this.escape_xml(text) + '</' + name + '>';
				},
				escape_xml: function(text) {
					return String(text) .replace(/</g, '&lt;')
										.replace(/>/g, '&gt;')
										.replace(/"/g, '&quot;');
				}
			},
			xdoc = interpreter.to_xml.call(interpreter, tree);
		interpreter.repl.call(tree, xdoc.documentElement.toJSON());
		return xdoc;
	};
}
