
var assert = require('assert'),
	Defiant = require('./../');

suite('Defiant', function() {

	// testing XML from String
	test('Testing Defiant.xmlFromString', function() {
		var str = '<?xml version=\"1.0\" encoding=\"utf-8\"?><data><i id=\"1\"/></data>',
			doc = Defiant.xmlFromString( str );
		assert.equal( str, doc.toString() );
	});

	// testing Extending an object with another object
	test('Testing Defiant.extend', function() {
		var o1 = { "a": 1 },
			o2 = { "b": 2 },
			o3 = Defiant.extend( o1, o2 );
		assert.equal( '{"a":1,"b":2}', JSON.stringify( o3 ) );
	});
	
	// testing XML from String
	test('Testing Defiant.prettyPrint', function() {
		var str  = '<data><i id="1"/></data>',
			doc  = Defiant.xmlFromString( str ),
			xstr = Defiant.prettyPrint( doc );
		assert.equal( xstr, '<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<data>\n    <i id=\"1\"/>\n</data>' );
	});

});