var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var paths = {
  src: {
    less  : './src/styles/less/*.less',
    css   : './src/styles/css/*.css',
    js    : './src/js/*.js',
    libs  : './src/js/libs/*.js',
    data  : './src/data/**',
    pug   : './src/pug/*.pug',
    images: './src/img/*'
  },
  dest: {
    html  : './dest',
    css   : './dest/styles',
    js    : './dest/js',
    libs  : './dest/js/libs',
    data  : './dest/data',
    images: './dest/img'
  }
};

gulp.task('pug', function() {
  gulp.src(paths.src.pug)
      .pipe($.pug())
      .pipe(gulp.dest('./dest'));
});

gulp.task('less', function() {
  gulp.src(paths.src.less)
      .pipe($.less())
      .pipe(gulp.dest(paths.dest.css));
});
gulp.task('css', function(){
  gulp.src(paths.src.css)
      .pipe(gulp.dest(paths.dest.css))
});

gulp.task('scripts', function() {
  gulp.src(paths.src.js)
      // .pipe($.uglify())
      .pipe(gulp.dest(paths.dest.js))
});

gulp.task('libs', function() {
  gulp.src(paths.src.libs)
      .pipe(gulp.dest(paths.dest.libs))
});

gulp.task('data', function() {
  gulp.src(paths.src.data)
      .pipe(gulp.dest(paths.dest.data))
});


gulp.task('images', function() {
  gulp.src(paths.src.images)
      .pipe($.imagemin())
      .pipe(gulp.dest(paths.dest.images))
});

gulp.task('webserver', function(){
  gulp
    .src(paths.dest.html)
    .pipe($.webserver({
      port: 8080,
      livereload: true,
      directoryListing: false
    }));
});

gulp.task('watch',function(){
  gulp.watch(paths.src.pug, ['pug'])
  gulp.watch(paths.src.less, ['less']);
  gulp.watch(paths.src.js, ['scripts']);
});

gulp.task('default', ['webserver', 'watch']);
gulp.task('build', ['pug', 'less', 'css', 'scripts', 'data', 'libs']);

