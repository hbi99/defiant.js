module.exports = function (grunt) {
	grunt.initConfig({
		uglify: {
			dist: {
				files: {
					'build/defiant.min.js': 'src/*.js'
				},
				options: {
					banner: '/* This is minified */'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', [
		'uglify'
	]);
};