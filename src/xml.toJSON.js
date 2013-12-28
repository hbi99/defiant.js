
if (!Node.toJSON) {
	Node.prototype.toJSON = function(stringify) {
		var interpreter = function(leaf) {
				var obj = {},
					attr,
					val,
					is_array;
				if (leaf.getAttribute && leaf.getAttribute('defiant:type') === 'array') {
					obj = [];
					leaf.removeAttribute('type');
				}
				if (typeof(leaf) === 'string') {
					leaf = Defiant.xmlFromString(leaf);
				}
				switch (leaf.nodeType) {
					case 1:
						attr = leaf.attributes;
						if (attr.length > 0) {
							for (var j=0, jl=attr.length, a; j<jl; j++) {
								a = attr.item(j);
								val = a.nodeValue;
								obj['@'+ a.nodeName] = (val == +val)? +val : val ;
							}
						}
						break;
					case 3:
						val = leaf.nodeValue;
						obj = (val == +val)? +val : val ;
						break;
				}
				if (leaf.hasChildNodes()) {
					is_array = obj.constructor === Array;
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
							if (is_array) obj.push(interpreter(item));
							else obj[nodeName] = interpreter(item);
						} else {
							if (typeof(obj[nodeName].push) == 'undefined') {
								var old = obj[nodeName];
								obj[nodeName] = [];
								obj[nodeName].push(old);
							}
							obj[nodeName].push(interpreter(item));
						}
					}
				} else {
					obj = null;
				}
				return obj;
			},
			node = (this.nodeType === 9) ? this.documentElement : this,
			ret = interpreter(node);
		return stringify ? JSON.stringify(ret, null, '\t') : ret;
	};
}