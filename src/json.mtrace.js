
if (!JSON.mtrace) {
	JSON.mtrace = function(root) {
		'use strict';

		var trace = [],
			sroot = JSON.stringify( root, null, '\t' ).notabs(),
			map   = this.search.map;

		console.log( map );
		
		return trace;
	};
}
