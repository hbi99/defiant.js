
var qure = require('qure'),
	qure_defiant = require('./qure-defiant.js');

qure.declare(qure_defiant).run('init');

var defiant = {
		// returns handle to snapshot of data
		getSnapshot: function(data, callback) {

		},
		register_template: function(xslt) {
			return new Promise(function(resolve, reject) {
				qure.run('register_template', xslt)
					.then(result => resolve(result));
			});
		},
		render: function(name, data) {
			return new Promise(function(resolve, reject) {
				qure.run('defiant_render', name, data)
					.then(result => resolve(result));
			});
		},
		render_xml: function(name, xstr) {
			return new Promise(function(resolve, reject) {
				qure.run('defiant_render_xml', name, xstr)
					.then(result => resolve(result));
			});
		},
		search: async function(data, xpath) {
			return new Promise(function(resolve, reject) {
				qure.run('defiant_search', data, xpath)
					.then(result => resolve(result));
			});
		}
	};

module.exports = defiant;