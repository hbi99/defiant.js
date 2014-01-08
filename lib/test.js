
var libxmljs = require("libxmljs"),
	Document = libxmljs.Document;

Document.prototype.createElement = function(s) {
	var xml =  '<?xml version="1.0" encoding="UTF-8"?>' +
           '<root>' +
               '<child foo="bar">' +
                   '<grandchild baz="fizbuzz">grandchild content</grandchild>' +
               '</child>' +
               '<sibling>with content!</sibling>' +
           '</root>';

	return libxmljs.parseXml(xml);
};





var doc = new Document();

console.log( doc.createElement().toString() );
