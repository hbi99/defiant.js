
// just testing some stuff

var DOMParser     = require('xmldom').DOMParser,
    XMLSerializer = require('xmldom').XMLSerializer;


var defiant = {
    search: function() {
        return 4;
    }
};

for (var f in defiant) { exports[f] = defiant[f]; }




var str = '<data><child1 id="a1" title="1"><child11 id="a2"  title="2"/></child1>' +
          '<child2 id="a1"   title="3"/><child3 id="a1"   title="3"/></data>',
    doc = new DOMParser().parseFromString(str, 'text/xml'),
    str = doc.documentElement.childNodes[0].toString();


console.log( str );
