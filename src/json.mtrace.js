
if (!JSON.mtrace) {
	JSON.mtrace = function(root, map) {
		'use strict';

		var trace = [],
			sroot = JSON.stringify( root, null, '\t' ).notabs(),
			mroot,
			mrow,
			mlen,
			is_leaf,
			char_index,
			line_index,
			line_length;

		for (var i=0, il=map.length; i<il; i++) {
			mrow       = map[i];
			char_index = 0;
			mroot      = sroot;
			mlen       = mrow.length;
			is_leaf    = mrow[mlen-1].val.match(/[\{\}:\[\]]/g) === null;

			if (is_leaf) mlen--;
			if (mrow[0].val.notabs() !== sroot && mlen > 0) {
				mroot = mrow[0].val.notabs();
				char_index += sroot.indexOf( mroot );
			}
			for (var j=0, jl=mlen; j<jl; j++) {
				char_index += mroot.indexOf( mrow[j].val.notabs() );
				mroot = mrow[j].val.notabs();
			}
			if (is_leaf) {
				char_index += mroot.indexOf( '"'+ mrow[j].key +'": ' );
			}
			line_index  = sroot.slice( 0, char_index ).count_nl()+1;
			line_length = mrow[ is_leaf ? mlen : mlen-1  ].val.count_nl();
			trace.push( [line_index, line_length] );
		}
		return trace;
	};
}
