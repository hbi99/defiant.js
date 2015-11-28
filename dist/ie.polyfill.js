/*
 * defiant.js [v1.3.4]
 * http://www.defiantjs.com 
 * Copyright (c) 2013-2015, Hakan Bilgin <hbi@longscript.com> 
 * Licensed under the MIT License
 */

if (typeof(XSLTProcessor) === 'undefined') {

	// emulating XSLT Processor (enough to be used in defiant)
	var XSLTProcessor = function() {};
	XSLTProcessor.prototype = {
		importStylesheet: function(xsldoc) {
			this.xsldoc = xsldoc;
		},
		transformToFragment: function(data, doc) {
			var str = data.transformNode(this.xsldoc),
				span = document.createElement('span');
			span.innerHTML = str;
			return span;
		}
	};

} else if (typeof(XSLTProcessor) !== 'function' && !XSLTProcessor) {
	
	// throw error
	throw 'XSLTProcessor transformNode not implemented';

}
