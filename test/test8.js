
"use strict";

describe('String manipulation', function() {
	var str1 = "//*[contains(title, 'rings')]/title",
		str2 = str1.xTransform();

	it('test completed.', function() {
		expect( str2 ).toEqual( "//*[contains(translate(title, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'rings')]/title" );
	});
});


