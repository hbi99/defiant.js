
"use strict";

describe('Test 2', function() {
	var data = {
			"a": {
				"b": ""
			}
		};

	beforeEach(function() {
		JSON.search( data, '//*' );
	});
	
	it('test completed.', function() {
		expect( JSON.stringify( data ) ).toEqual('{"a":{"b":""}}');
	});
});


