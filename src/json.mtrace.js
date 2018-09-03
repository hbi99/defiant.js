
if (!JSON.mtrace) {
	JSON.mtrace = (root, hits, xres) => {
		'use strict';
		var trace = [],
			fIndex = 0,
			win = window,
			toJson = Defiant.node.toJSON,
			stringify = (data) => JSON.stringify(data, null, '\t').replace(/\t/g, ''),
			jsonStr = stringify(root);
		xres.map((item, index) => {
			var constr,
				pJson,
				pStr,
				hit,
				hstr,
				pIdx,
				lines,
				len = 0;
			switch (item.nodeType) {
				case 2:
					constr = xres[index].ownerElement ? xres[index].ownerElement.getAttribute('d:'+ xres[index].nodeName) : 'String';
					hit = win[constr](hits[index]);
					hstr = '"@'+ xres[index].nodeName +'": '+ hit;
					pIdx = jsonStr.indexOf(hstr, fIndex);
					break;
				case 3:
					constr = xres[index].parentNode.getAttribute('d:constr');
					hit = win[constr](hits[index]);
					hstr = '"'+ xres[index].parentNode.nodeName +'": '+ (hstr === 'Number' ? hit : '"'+ hit +'"');
					pIdx = jsonStr.indexOf(hstr, fIndex);
					break;
				default:
					constr = item.getAttribute('d:constr');
					if (['String', 'Number'].indexOf(constr) > -1) {
						pJson = toJson(xres[index].parentNode);
						pStr = stringify(pJson);
						hit = win[constr](hits[index]);
						hstr = '"'+ xres[index].nodeName +'": '+ (constr === 'Number' ? hit : '"'+ hit +'"');
						pIdx = jsonStr.indexOf(pStr, fIndex) + pStr.indexOf(hstr);
					} else {
						hstr = stringify( hits[index] );
						pIdx = jsonStr.indexOf(hstr);
						len = hstr.split('\n').length - 1;
					}
			}
			fIndex = pIdx + 1;
			lines = jsonStr.slice(0, pIdx).split('\n').length;
			trace.push([lines, len]);
		});
		return trace;
	};
}