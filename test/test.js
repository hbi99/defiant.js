
var assert = require('assert'),
	Defiant = require('./../');

suite('Defiant', function() {
	/*
	// testing XML from String
	test('Testing Defiant.xmlFromString', function() {
		var str = '<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<data>\n    <i id=\"1\"/>\n</data>',
			doc = Defiant.xmlFromString( str );
		assert.equal( str, Defiant.prettyPrint( doc ) );
	});

	// testing Extending an object with another object
	test('Testing Defiant.extend', function() {
		var o1 = { "a": 1 },
			o2 = { "b": 2 },
			o3 = Defiant.extend( o1, o2 );
		assert.equal( '{"a":1,"b":2}', JSON.stringify( o3 ) );
	});
	*/

	// testing XML Node to JSON object
	test('Testing Defiant.nodeToJSON', function() {
		var str = '<data><i id="1">a</i><i id="2"/></data>',
			obj = { "i": [ { "@id": "1", "#text": "a" }, { "@id": "2" } ] },
			doc = Defiant.xmlFromString( str ),
			trs = Defiant.nodeToJSON( doc );
		assert.equal( JSON.stringify(trs), JSON.stringify(obj) );
	});
	/*

	// testing transforming JSON object
	test('Testing JSON.toXML', function() {
		var obj = { "i": [ { "@id": "1", "#text": "3" }, { "@id": "2" } ] },
			str = '<?xml version="1.0" encoding="utf-8"?>\n<d:data>\n    <i id="1">3</i>\n    <i id="2"/>\n</d:data>',
			doc = JSON.toXML( obj );
		assert.equal( str, Defiant.prettyPrint( doc ) );
	});
	
	// searcching XML from String
	test('Testing Defiant.prettyPrint', function() {
		var str  = '<data><i id="1"/><i id="2"/><i id="3"/></data>',
			doc  = Defiant.xmlFromString( str );
		//console.log( doc );
		//assert.equal( xstr, '<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<data>\n    <i id=\"1\"/>\n</data>' );
	});
*/

});


