
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

}
