
if (!JSON.search) {
	JSON.search = function(tree, xpath, single) {
		'use strict';
		
		var doc = JSON.toXML(tree),
			res = doc[ single ? 'selectSingleNode' : 'selectNodes' ](xpath),
			ret = [],
			map,
			node,
			map_index,
			item_map,
			current,
			is_attr,
			do_search = function(current) {
				if (map_index === ret[i].length) return current;
				
				switch (current.constructor) {
					case Array:
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
						current = current[item_map.key];
						if (typeof(current) !== 'object') return current;
						if (current.constructor === Object) {
							map_index++;
							item_map = ret[i][map_index];
						}
				}
				return do_search( current );
			};

		if (single) res = [res];
		//console.log( 'x-RES:', res );
		for (var i=0, il=res.length; i<il; i++) {
			map  = [];
			node = res[i];
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
			map_index  = 0;
			item_map = ret[i][map_index];
			
			ret[i] = do_search(tree);
		}
		
		return ret;
	};
}
