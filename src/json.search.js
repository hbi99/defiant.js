
if (!JSON.search) {
	JSON.search = function(tree, xpath, single) {
		'use strict';
		
		var doc  = JSON.toXML(tree),
			xres = Defiant.node[ single ? 'selectSingleNode' : 'selectNodes' ](doc, xpath),
			ret  = [],
			mapIndex,
			i;

		if (single) xres = [xres];

		//console.log( 'x-RES:', xres );
		i = xres.length;
		while (i--) {
			if (xres[i].nodeType === 2) {
				ret.unshift( xres[i].nodeValue );
			} else {
				mapIndex = +xres[i].getAttribute('d:mi');
				ret.unshift( this.search.map[mapIndex-1] );
			}
		}

		//console.log( 'RES:', ret );
		return Defiant.result(ret);
	};
}
