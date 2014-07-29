
"use strict";

describe('Test Search 1', function() {
	var found,
		data = {
			"a": {
				"b": [1,2,3,4]
			}
		};

	beforeEach(function() {
		found = JSON.search( data, '//a/b' );
	});
	
	it('test completed.', function() {
		expect( found.length ).toEqual( 4 );
	});
});


