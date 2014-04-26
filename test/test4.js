
describe('Test 4', function() {
	var data = {
			"a": {
				"b": {}
			}
		};

	beforeEach(function() {
		JSON.search( data, '//*' );
	});
	
	it('test completed.', function() {
		expect( JSON.stringify( data ) ).toEqual('{"a":{"b":{}}}');
	});
});


