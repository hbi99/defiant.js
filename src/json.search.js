
if (!JSON.search) {
	/* TODO:
	 * tracing matching lines should be
	 * separated from main branch.
	 */
	JSON.search = function(tree, xpath, single) {
		//if (tree.constructor !== Object) throw 'object is not valid JSON';
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
			while ((node = node.previousSibling)) node_index++;
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
