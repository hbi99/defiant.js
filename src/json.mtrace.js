
if (!JSON.mtrace) {
	JSON.mtrace = function(root, hits, xres) {
		'use strict';

		var win       = window,
			stringify = JSON.stringify,
			sroot     = stringify( root, null, '\t' ).replace(/\t/g, ''),
			trace     = [],
			i         = 0,
			il        = xres.length,
			od        = il ? xres[i].ownerDocument.documentElement : false,
			map       = this.search.map,
			hstr,
			cConstr,
			fIndex = 0,
			mIndex,
			lStart,
			lEnd;

		for (; i<il; i++) {
			switch (xres[i].nodeType) {
				case 2:
					cConstr = xres[i].ownerElement ? xres[i].ownerElement.getAttribute('d:'+ xres[i].nodeName) : 'String';
					hstr    = '"@'+ xres[i].nodeName +'": '+ win[ cConstr ]( hits[i] );
					mIndex  = sroot.indexOf(hstr);
					lEnd    = 0;
					break;
				case 3:
					cConstr = xres[i].parentNode.getAttribute('d:constr');
					hstr    = win[ cConstr ]( hits[i] );
					hstr    = '"'+ xres[i].parentNode.nodeName +'": '+ (hstr === 'Number' ? hstr : '"'+ hstr +'"');
					mIndex  = sroot.indexOf(hstr);
					lEnd    = 0;
					break;
				default:
					if (xres[i] === od) continue;
					if (xres[i].getAttribute('d:constr') === 'String' || xres[i].getAttribute('d:constr') === 'Number') {
						cConstr = xres[i].getAttribute('d:constr');
						hstr    = win[ cConstr ]( hits[i] );
						mIndex  = sroot.indexOf(hstr, fIndex);
						hstr    = '"'+ xres[i].nodeName +'": '+ (cConstr === 'Number' ? hstr : '"'+ hstr +'"');
						lEnd    = 0;
						fIndex  = mIndex + 1;
					} else {
						hstr   = stringify( hits[i], null, '\t' ).replace(/\t/g, '');
						mIndex = sroot.indexOf(hstr);
						lEnd   = hstr.match(/\n/g).length;
					}
			}
			lStart = sroot.substring(0,mIndex).match(/\n/g).length+1;
			trace.push([lStart, lEnd]);
		}

		return trace;
	};
}