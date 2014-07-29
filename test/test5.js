
"use strict";

describe('Test 5', function() {
	var data = {
			"a": {
				"b": 37
			}
		};

	beforeEach(function() {
		JSON.search( data, '//*' );
	});
	
	it('test completed.', function() {
		expect( JSON.stringify( data ) ).toEqual('{"a":{"b":37}}');
	});
});


