const gulp = require('gulp');

const browserSync = require('browser-sync').create();
const injectPartials = require('gulp-inject-partials');
const injectVars = require('gulp-inject-env-variables');
const gulpif = require('gulp-if');
const sass = require('gulp-sass');
const concat = require('gulp-concat-multi');
const uglify = require('gulp-uglify');
const autoprefixer = require('gulp-autoprefixer');


var conf = require('./gulpProjectSettings');
var env = require('./environmentVars');

gulp.task('start', function () {
	browserSync.init(conf.browserSync);
	
	gulp.watch(conf.assets.watch, gulp.series('assets_task'));
	
	gulp.watch(conf.templates.watch, gulp.series('templates_task'));
	
	gulp.watch(conf.css.watch, gulp.series('css_task'));
	
	gulp.watch(conf.js.vendorsWatch, gulp.series('js_vendors_task'));
	gulp.watch(conf.js.execWatch, gulp.series('js_exec_task'));
});


// ------------------------------------------------------
//    ASSETS
 
gulp.task('assets_task', function(){
	return gulp.src(conf.assets.watch)
		.pipe(gulp.dest(conf.distRoot + 'assets/'))
		.pipe(browserSync.stream());
});


// ------------------------------------------------------
//    TEMPLATES

gulp.task('templates_task', function () {
	return gulp.src(conf.templates.entries)
		.pipe(injectPartials(conf.templates.injectPartials))
		.pipe(injectVars(env))
		.pipe(gulp.dest(conf.distRoot))
		.pipe(browserSync.stream());
});
 

// ------------------------------------------------------
//    CSS

gulp.task('css_task', function(){
	return gulp.src(conf.css.main)
		// .pipe(injectVars(env))
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer(conf.css.autoprefixerOptions))
		.pipe(gulp.dest(conf.distRoot + "assets/css/"))
		.pipe(browserSync.stream());
});


// ------------------------------------------------------
//    JS


gulp.task('js_vendors_task', function(){
	if(test_concatenated_files(conf.js.vendorsConcat)){
		gutil.log('[js_vendors_task] No file has been set');
		return;
	}
	return concat(conf.js.vendorsConcat)
		.pipe(gulpif(conf.production, uglify()))
		.pipe(gulp.dest(conf.distRoot + 'assets/'))
		.pipe(browserSync.stream());
});
gulp.task('js_exec_task', function(){
	if(test_concatenated_files(conf.js.execConcat)){
		gutil.log('[js_exec_task] No file has been set');
		return;
	}
	return concat(conf.js.execConcat)
		.pipe(injectVars(env))
		.pipe(gulpif(conf.production, uglify()))
		.pipe(gulp.dest(conf.distRoot + 'assets/'))
		.pipe(browserSync.stream());
});



// ------------------ UTILITIES

function test_concatenated_files(options){
	var files = [], prop, targetFile, path, filename, stream;
	
	for(targetFile in options) {
		prop = targetFile + '';
		if(options[prop].length == 0) {
			prop = prop.split('/');
			if(prop.length > 1){
				filename = prop.pop();
				path = prop.join('/');
			}
			else{
				filename = prop.join('/');
				path = '';
			}
			files.push(new gutil.File({
				cwd: '',
				base: '',
				path: path + '/' + filename,
				contents: new Buffer('')
			}));
			gutil.log('---- create: ' + path + '/' + filename);
		}
	}
	
	if(files.length > 0){
		files.push(null);
		
		stream = require('stream').Readable({
			objectMode: true
		});
		files.forEach(function(el){
			stream.push(el);
		});
		stream.push(null);
		return stream.pipe(gulp.dest(conf.distRoot));
	}
	else
		return false;
}


gulp.task('default', gulp.series(
	'start',
	'assets_task',
	'css_task',
	'js_vendors_task',
	'js_exec_task'
));
