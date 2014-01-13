
if (!JSON.search) {
	JSON.search = function(tree, xpath, single) {
		'use strict';
		
		var doc  = JSON.toXML(tree),
			od   = doc.documentElement,
			xres = doc[ single ? 'selectSingleNode' : 'selectNodes' ](xpath),
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
						key = is_attr ? false : jres[i][map_index].node.getAttribute('d:name');
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
					val  : is_attr ? node.value : node.toJSON('\t')
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
