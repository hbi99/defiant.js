
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
			item_map,
			current,
			is_attr,
			key,
			i, il,
			do_search = function(current, jr, im, mi) {
				var is_attr,
					key,
					j,
					jl,
					check;
				if (mi === jr.length) return current;
				switch (current.constructor) {
					case Array:
						for (j=0, jl=current.length; j<jl; j++) {
							if (im.val === JSON.stringify(current[j], null, '\t')) {
								if (mi < jr.length) {
									mi++;
									im = jr[mi];
									return do_search(current[j], jr, im, mi);
								}
							}
						}
						if (j === jl) {
							if (im.val === JSON.stringify(current, null, '\t')) {
								mi++;
								im = jr[mi];

								for (j=0; j<jl; j++) {
									check = do_search(current[j], jr, im, mi);
									if (check) return check;
								}
							}
							return current;
						}
						break;
					default:
						is_attr = jr[mi].node.nodeType;
						key = (is_attr === 1)? jr[mi].node.getAttribute('d:name') : false;
						current = current[key || im.key];
						if (typeof(current) !== 'object') {
							mi++;
							im = jr[mi];
							return current;
						}
						if (current.constructor === Object) {
							mi++;
							im = jr[mi];
						}
				}
				return do_search(current, jr, im, mi);
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
				map.unshift({
					node : node,
					key  : (is_attr ? '@' : '') + node.nodeName,
					val  : is_attr ? node.value : Defiant.node.toJSON(node, '\t')
				});
				node = is_attr ? node.ownerElement : node.parentNode;
			}
			jres.push(map);
		}
		//console.log( 'j-RES:', jres );
		var start = Date.now();
		for (i=0, il=jres.length; i<il; i++) {
			ret.push( do_search(tree, jres[i], jres[i][0], 0) );
		}
		console.log( Date.now() - start );

		// if tracing is enabled
		this.trace = JSON.search.trace ? JSON.mtrace(tree, jres) : false;

		//console.log( 'RES:', ret );
		return Defiant.result(ret);
	};
}
