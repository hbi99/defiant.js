module.exports = function (grunt) {
	grunt.initConfig({
		uglify: {
			dist: {
				files: {
					'build/defiant.min.js': 'src/*.js'
				},
				options: {
					banner: '/* Javascript by Hakan Bilgin (c) 2013-2014 */'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', [
		'uglify'
	]);
};