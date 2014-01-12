
if (!Node.toJSON) {

	Node.prototype.toJSON = function(stringify) {
		'use strict';

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

						if (childName === 'd:name') {
							childName = item.getAttribute('d:name');
						}
						if (childName === '#text') {
							cConstr = leaf.getAttribute('d:constr');
							childVal = cConstr === 'Boolean' && item.textContent === 'false' ? '' : item.textContent;

							if (!cConstr && !attr.length) obj = childVal;
							else if (cConstr && attr.length === 1) obj = window[cConstr](childVal);
							else if (!leaf.hasChildNodes()) {
								obj[childName] = (cConstr)? window[cConstr](childVal) : childVal;
							} else {
								if (attr.length < 3) obj = (cConstr)? window[cConstr](childVal) : childVal;
								else obj[childName] = (cConstr)? window[cConstr](childVal) : childVal;
							}
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
			node = (this.nodeType === 9) ? this.documentElement : this,
			ret = interpret(node),
			rn  = ret[node.nodeName];

		// exclude root, if "this" is root node
		if (node === node.ownerDocument.documentElement && rn && rn.constructor === Array) {
			ret = rn;
		}
		if (stringify && stringify.toString() === 'true') stringify = '\t';
		return stringify ? JSON.stringify(ret, null, stringify) : ret;
	};
}