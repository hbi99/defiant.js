// IE polyfills
if (window.ActiveXObject !== undefined) {

	if (typeof(DOMParser) === 'undefined') {
		var DOMParser = function() {}
		DOMParser.prototype.parseFromString = function(str, contentType) {
			if(typeof(ActiveXObject) != 'undefined') {
				var xmldata = new ActiveXObject('MSXML.DomDocument');
				xmldata.async = false;
				xmldata.loadXML(str);
				return xmldata;
			} else if(typeof(XMLHttpRequest) != 'undefined') {
				var xmldata = new XMLHttpRequest();
				if(!contentType) {
					contentType = 'application/xml';
				}
				xmldata.open('GET', 'data:' + contentType + ';charset=utf-8,' + encodeURIComponent(str), false);
				if(xmldata.overrideMimeType) {
					xmldata.overrideMimeType(contentType);
				}
				xmldata.send(null);
				return xmldata.responseXML;
			}
		}
	}

	if (typeof(XMLSerializer) === 'undefined') {
		var XMLSerializer = function() {};
		XMLSerializer.prototype = {
			serializeToString: function(node) {
				return node.xml;
			}
		};
	}

	if (typeof(XSLTProcessor) === 'undefined') {
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

	Object.prototype.getName = function() {
		var funcNameRegex = /function (.{1,})\(/,
			results = (funcNameRegex).exec(this.toString());
		return (results && results.length > 1) ? results[1] : '';
	};
}
