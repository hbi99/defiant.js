
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
			map_cache = {},
			item_map,
			current,
			is_attr,
			key,
			i, il,
			do_search = function(current, jr) {
				var j,
					jl,
					check;
				if (map_index === jr.length) return current;
				switch (current.constructor) {
					case Array:
						for (j=0, jl=current.length; j<jl; j++) {
							if (item_map.val === JSON.stringify(current[j], null, '\t')) {
								if (map_index < jr.length) {
									map_index++;
									item_map = jr[map_index];
									return do_search(current[j], jr);
								}
							}
						}
						if (j === jl) {
							if (item_map.val === JSON.stringify(current, null, '\t')) {
								map_index++;
								item_map = jr[map_index];

								for (j=0; j<jl; j++) {
									check = do_search(current[j], jr);
									if (check) return check;
								}
							}
							return current;
						}
						break;
					default:
						is_attr = jr[map_index].node.nodeType;
						key = (is_attr === 1)? jr[map_index].node.getAttribute('d:name') : false;
						//key = jr[map_index].node.getAttribute('d:name');
						key = key || item_map.key;
						current = current[key];
						if (typeof(current) !== 'object') {
							map_index++;
							item_map = jr[map_index];
							return current;
						}
						if (current.constructor === Object) {
							map_index++;
							item_map = jr[map_index];
						}
				}
				return do_search(current, jr);
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
				if (!map_cache[node]) {
					map_cache[node] = is_attr ? node.value : Defiant.node.toJSON(node, '\t');
				}
				map.unshift({
					node : node,
					key  : (is_attr ? '@' : '') + node.nodeName,
					val  : map_cache[node]
				});
				node = is_attr ? node.ownerElement : node.parentNode;
			}
			jres.push(map);
		}
		//console.log( 'j-RES:', jres );
		for (i=0, il=jres.length; i<il; i++) {
			map_index = 0;
			item_map  = jres[i][map_index];
			ret.push( do_search(tree, jres[i]) );
		}
		// if tracing is enabled
		this.trace = JSON.search.trace ? JSON.mtrace(tree, jres) : false;

		//console.log( 'RES:', ret );
		return Defiant.result(ret);
	};
}
