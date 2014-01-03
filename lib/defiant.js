
var DOMParser     = require('xmldom').DOMParser,
	XMLSerializer = require('xmldom').XMLSerializer;


var defiant = {
	search: function() {
		return 4;
	}
};

for (var f in defiant) { exports[f] = defiant[f]; }



// extending STRING
if (!String.prototype.fill) {
	String.prototype.fill = function(i,c) {
		var str = this;
		c = c || ' ';
		for (; str.length<i; str+=c){}
		return str;
	};
}
if (!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^\s+|\s+$/gm, '');
	};
}





var str = '<xml xmlns="http://test.com" id="root">' +
        '<child1 id="a1" title="1"><child11 id="a2"  title="2"/></child1>' +
        '<child2 id="a1"   title="3"/><child3 id="a1"   title="3"/></xml>',
	doc = new DOMParser().parseFromString(str, 'text/xml'),
	str = new XMLSerializer().serializeToString(doc);


console.log( str );
