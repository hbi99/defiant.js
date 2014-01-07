
var DOMParser = require('xmldom').DOMParser;

DOMParser.prototype.test = function() {
	return 1;
};


var str = '<?xml version="1.0" encoding="UTF-8"?>' +
           '<root>' +
               '<child foo="bar">' +
                   '<grandchild baz="fizbuzz">grandchild content</grandchild>' +
               '</child>' +
               '<sibling>with content!</sibling>' +
           '</root>',
	xmlDoc = (new DOMParser()).parseFromString(str, 'text/xml');


console.log( DOMParser.test );


