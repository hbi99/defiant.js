
var defiant = require('../lib/defiant');

exports['calculate'] = function (test) {
    test.equal(defiant.search(2), 3);
    test.done();
};

