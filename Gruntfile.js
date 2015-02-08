'use strict';

module.exports = function (grunt) {
	grunt.initConfig({

		// metadata
		pkg : grunt.file.readJSON('package.json'),
		meta: {
			copyright : 'Copyright (c) 2013-<%= grunt.template.today("yyyy") %>',
			banner    : '/* \n' +
						' * Defiant.js v<%= pkg.version %> \n' +
						' * <%= pkg.description %> \n' +
						' * http://defiantjs.com \n' +
						' * \n' +
						' * <%= meta.copyright %>, <%= pkg.author.name %> <<%= pkg.author.email %>> \n' +
						' * Licensed under the <%= pkg.license.type %> License \n' +
						' */ \n',
			source    : [
						// import x10.js
						'node_modules/x10.js/dist/x10.js',
						// defiant source code
						'src/defiant.js',
						// IE polyfills
						'src/ie.polyfill.js',
						// extend string object
						'src/string.js',
						// extend json object
						'src/json.js',
						'src/json.toXML.js',
						'src/json.search.js',
						'src/json.mtrace.js',
						// extend node object
						'src/node.select.js',
						'src/node.serialize.js',
						'src/node.toJSON.js',
						// add jQuery plugin
						'src/jquery-plugin.js'
			]
		},

		// JShint this version
		jshint: {
			files: {
				src: '<%= meta.source %>'
			}
		},

		// concatenation source files
		concat: {
			options: {
				stripBanners: 'all',
				banner: '<%= meta.banner %>'
			},
			// concat latest
			latest: {
				src: '<%= meta.source %>',
				dest: 'dist/defiant.js'
			},
			// concat Node version
			nodelib: {
				src: '<%= meta.source %>',
				dest: 'lib/defiant.js'
			}
		},

		// uglifying concatenated file
		uglify: {
			options: {
				banner: '<%= meta.banner %>',
				mangle: true
			},
			// uglify latest
			latest: {
				src: ['<%= concat.latest.dest %>'],
				dest: 'dist/defiant.min.js'
			}
		},

		// test tasks
		jasmine: {
			test: {
				src: '<%= meta.source %>',
				options: {
					specs: 'test/*.js'
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jasmine');

	grunt.registerTask('default', [
		'jshint',
		'test',
		'concat:latest',
    	'uglify:latest',
    	'concat:nodelib'
	]);

	grunt.registerTask('lib', [ 'concat:nodelib' ]);

	grunt.registerTask('test', [ 'jasmine' ]);

};

