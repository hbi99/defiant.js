
Defiant.node.toJSON = function(xnode, stringify) {
	'use strict';

	var interpret = function(leaf) {
			var obj = {},
				win = window,
				attr,
				type,
				item,
				cname,
				cConstr,
				cval,
				text,
				i, il, a;

			switch (leaf.nodeType) {
				case 1:
					cConstr = leaf.getAttribute('d:constr');
					if (cConstr === 'Array') obj = [];
					else if (cConstr === 'String' && leaf.textContent === '') obj = '';

					attr = leaf.attributes;
					i = 0;
					il = attr.length;
					for (; i<il; i++) {
						a = attr.item(i);
						if (a.nodeName.match(/\:d|d\:/g) !== null) continue;

						cConstr = leaf.getAttribute('d:'+ a.nodeName);
						if (cConstr && cConstr !== 'undefined') {
							if (a.nodeValue === 'null') cval = null;
							else cval = win[ cConstr ]( (a.nodeValue === 'false') ? '' : a.nodeValue );
						} else {
							cval = a.nodeValue;
						}
						obj['@'+ a.nodeName] = cval;
					}
					break;
				case 3:
					type = leaf.parentNode.getAttribute('d:type');
					cval = (type) ? win[ type ]( leaf.nodeValue === 'false' ? '' : leaf.nodeValue ) : leaf.nodeValue;
					obj = cval;
					break;
			}
			if (leaf.hasChildNodes()) {
				i = 0;
				il = leaf.childNodes.length;
				for(; i<il; i++) {
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
						else if (cConstr && il === 1) {
							obj = win[cConstr](cval);
						} else if (!leaf.hasChildNodes()) {
							obj[cname] = (cConstr)? win[cConstr](cval) : cval;
						} else {
							if (attr.length < 3) obj = (cConstr)? win[cConstr](cval) : cval;
							else obj[cname] = (cConstr)? win[cConstr](cval) : cval;
						}
					} else {
						if (item.getAttribute('d:constr') === 'null') {
							if (obj[cname] && obj[cname].push) obj[cname].push(null);
							else if (item.getAttribute('d:type') === 'ArrayItem') obj[cname] = [obj[cname]];
							else obj[cname] = null;
							continue;
						}
						if (obj[cname]) {
							if (obj[cname].push) obj[cname].push(interpret(item));
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
									if (cname === 'd:item' || cConstr === 'Array') {
										cval = interpret(item);
										obj[cname] = cval.length ? [cval] : cval;
									} else {
										obj[cname] = interpret(item);
									}
								}
								else if (obj.push) obj.push( interpret(item) );
								else obj[cname] = interpret(item);
								break;
							case 'String':
							case 'Number':
							case 'Boolean':
								text = item.textContent || item.text;
								cval = cConstr === 'Boolean' && text === 'false' ? '' : text;

								if (obj.push) obj.push( win[cConstr](cval) );
								else obj[cname] = interpret(item);
								break;
							default:
								if (obj.push) obj.push( interpret( item ) );
								else obj[cname] = interpret( item );
						}
					}
				}
			}
			if (leaf.nodeType === 1 && leaf.getAttribute('d:type') === 'ArrayItem') {
				obj = [obj];
			}
			return obj;
		},
		node = (xnode.nodeType === 9) ? xnode.documentElement : xnode,
		ret  = interpret(node),
		rn   = ret[node.nodeName];

	// exclude root, if "this" is root node
	if (node === node.ownerDocument.documentElement && rn && rn.constructor === Array) {
		ret = rn;
	}
	if (stringify && stringify.toString() === 'true') stringify = '\t';
	return stringify ? JSON.stringify(ret, null, stringify) : ret;
};
