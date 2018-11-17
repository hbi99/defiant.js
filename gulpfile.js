

/*-------------------------------------------------------------------------
 * Include Gulp & Tools We'll Use
 *
 *-------------------------------------------------------------------------*/

var colors = require('colors'),
	gulp   = require('gulp'),
	$      = require('gulp-load-plugins')(),
	pckg   = require('./package.json');

var include_options = {
		prefix    : '@@',
		basepath  : '@file'
	},
	srcPath = 'src/defiant.js',
	destPath = 'dist/';

var now = new Date(),
	banner = `/*
 * defiant.js [v${pckg.version}]
 * ${pckg.homepage}
 * Copyright (c) 2013-${now.getFullYear()} ${pckg.author.name} <${pckg.author.email}>
 * License ${pckg.license}
 */`;


/*-------------------------------------------------------------------------
 * Gulp HELP
 *-------------------------------------------------------------------------*/
gulp.task('help', (done) => {
	var str = banner.replace(/\/\*|\*\/|\*/g, '').white +
			'\n----DEVELOPMENT Mode-------------------------------------------------------------'+
			'\n  gulp build'.cyan      +'\t\tCreates a build version'.grey+
			'\n  gulp watch'.cyan      +'\t\tWatches source files and compiles on change'.grey+
			'\n----------------------------------------------------------------------------------\n';
	console.log(str);
	done();
});


function build() {
	return gulp.src(srcPath)
		.pipe($.fileInclude(include_options))
		.pipe($.insert.prepend(banner))
		.pipe(gulp.dest(destPath))
		.pipe($.uglifyes())
		.pipe($.rename({suffix: '.min'}))
		.pipe($.insert.prepend(banner))
		.pipe(gulp.dest(destPath))
		.pipe($.size({title: 'build'}));
};

function watch() {
	gulp.watch('src/*.js', build);
}

gulp.task('build', build);
gulp.task('watch', watch);



