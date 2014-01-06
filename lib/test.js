
if (typeof module === "undefined") {
	module = { exports: undefined };
} else {
	var dom     = require('xmldom'),
		Element = require('xmldom/dom').Element;

	Document = dom.DOMImplementation;
	document = new Document().createDocument(null, null, null);

	this.DOMParser = DOMParser = dom.DOMParser;
}

module.exports = Defiant = (function(window, undefined) {
	'use strict';

	var Defiant = {

	};

	return Defiant;

})(this);


if (!Document.createElement) {
	Document.prototype.createElement = function(name) {
		return (new DOMParser()).parseFromString('<'+ name +'/>', 'text/xml');
	};
}


var tmp = document.createElement('span');

console.log( tmp.innerHTML );


