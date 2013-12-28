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
						'src/defiant.js',
						// extend string object
						'src/string.js',
						// extend node object
						'src/xml.selectNodes.js',
						'src/xml.selectSingleNode.js',
						'src/xml.serialize.js',
						'src/xml.toJSON.js',
						// extend json object
						'src/json.js',
						'src/json.toXML.js',
						'src/json.search.js',
						// add jQuery plugin
						'src/jquery-plugin.js'
			]
		},

		// concatenation source files
		concat: {
			options: {
				stripBanners: 'all',
				banner: '<%= meta.banner %>'
			},
			// concat this version
			stable: {
				src: '<%= meta.source %>',
				dest: 'dist/defiant-<%= pkg.version %>.js'
			},
			// concat latest
			latest: {
				src: '<%= meta.source %>',
				dest: 'dist/defiant-latest.js'
			}
		},

		// uglifying concatenated file
		uglify: {
			options: {
				banner: '<%= meta.banner %>',
				mangle: true
			},
			// uglify this version
			stable: {
				src: ['<%= concat.stable.dest %>'],
				dest: 'dist/defiant-<%= pkg.version %>.min.js'
			},
			// uglify latest
			latest: {
				src: ['<%= concat.latest.dest %>'],
				dest: 'dist/defiant-latest.min.js'
			}
		}

		// uglifying concatenated file

	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', [
		'concat:stable',
    	'uglify:stable'
	]);

	grunt.registerTask('latest', [
		'concat:latest',
    	'uglify:latest'
	]);
};