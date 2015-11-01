
"use strict";

describe('Test 3', function() {
	var data = {
			"a": {
				"b": true
			}
		};

	beforeEach(function() {
		JSON.search( data, '//*' );
	});
	
	it('test completed.', function() {
		expect( JSON.stringify( data ) ).toEqual('{"a":{"b":true}}');
	});
});
