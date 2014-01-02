
if (!JSON.search) {
	JSON.search = function(tree, xpath, single) {
		'use strict';
		
		var doc = JSON.toXML(tree),
			od  = doc.documentElement,
			res = doc[ single ? 'selectSingleNode' : 'selectNodes' ](xpath),
			ret = [],
			found,
			map,
			node,
			map_index,
			item_map,
			current,
			is_attr,
			/* TODO:
			 * tracing matching lines should be
			 * separated from this code
			 */
			trc = (Defiant.trace)? [] : false,
			char_index,
			line_index,
			line_len,
			trace_map,
			do_trace = function() {
				if (trace_map.indexOf( map_index ) > -1) return;
				trace_map.push( map_index );
				if (map_index < ret[i].length-1) {
					var t1 = item_map.val.replace(/\t/g, ''),
						t2 = ret[i][map_index+1].val.replace(/\t/g, ''),
						cI = t1.indexOf(t2);
					char_index += cI;
				}
			},
			do_search = function(current) {
				if (map_index === ret[i].length) return current;

				switch (current.constructor) {
					case Array:
						if (trc) do_trace();

						for (var jl = current.length, j = 0, check; j<jl; j++) {
							if (item_map.val === JSON.stringify(current[j], null, '\t')) {
								if (map_index < ret[i].length) {
									map_index++;
									item_map = ret[i][map_index];
									return do_search( current[j] );
								}
							}
						}
						if (j === jl) {
							if (item_map.val === JSON.stringify(current, null, '\t')) {
								map_index++;
								item_map = ret[i][map_index];

								for (j=0; j<jl; j++) {
									check = do_search( current[j] );
									if (check) return check;
								}
							}
							return current;
						}
						break;
					default:
						if (trc) do_trace();

						current = current[item_map.key];
						if (typeof(current) !== 'object') {
							map_index++;
							item_map = ret[i][map_index];
							return current;
						}
						if (current.constructor === Object) {
							map_index++;
							item_map = ret[i][map_index];
						}
				}
				return do_search( current );
			};
		if (single) res = [res];
		//console.log( 'x-RES:', res );
		for (i=0, il=res.length; i<il; i++) {
			map  = [];
			node = res[i];
			// can't access "root"
			if (node === od) continue;
			while (node !== doc.documentElement) {
				is_attr = node.nodeType === 2;
				map.push({
					node : node,
					key  : (is_attr ? '@' : '') + node.nodeName,
					val  : is_attr ? node.value : node.toJSON(true)
				});
				node = is_attr ? node.ownerElement : node.parentNode;
			}
			ret.push(map.reverse());
		}
		//console.log( 'j-RES:', ret );
		for (var i=0, il=ret.length; i<il; i++) {
			line_index = 0;
			char_index = 0;
			trace_map = [];

			map_index  = 0;
			item_map   = ret[i][map_index];
			found      = do_search(tree);
			if (trc) {
				line_index = (char_index)? ret[i][0].val.replace(/\t/g, '').slice(0,char_index).match(/\n/g).length : 0;
				line_len = ret[i][ map_index-1 ].val.match(/\n/g);
				trc.push([line_index+2, (line_len === null ? 0 : line_len.length)]);
			}
			ret[i] = found;
		}
		// if tracing flag; add trace info to JSON-object
		if (trc) this.trace = trc;
		else delete this.trace;
		return ret;
	};
}
