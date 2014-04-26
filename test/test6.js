
describe('Test 6', function() {
	var data = {
			"a": {
				"b": [
					{
						"c": 1
					},
					"d"
				]
			}
		};

	beforeEach(function() {
		JSON.search( data, '//*' );
	});
	
	it('test completed.', function() {
		expect( JSON.stringify( data ) ).toEqual('{"a":{"b":[{"c":1},"d"]}}');
	});
});


