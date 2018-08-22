var klaw = require('klaw-sync'),
    gulp = require('gulp'),
    replace = require('gulp-replace'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    csso = require('gulp-csso'),
    plumber = require('gulp-plumber'),
    concat = require('gulp-concat') ;

var resDir = '../datahub/datahub-web/src/main/webapp/resources/';
var minimist = require('minimist');
var knownOptions = {
    string: 'file',
    default: ''
};
var options = minimist(process.argv.slice(2), knownOptions);
if ( options.file ){
    var fileArr = options.file.split(','),
        configs = [] ;
    for ( var i=0,len=fileArr.length; i<len; i++ ){
        configs.push(require('./gulpTask/'+fileArr[i]+'_gulp.js'));
    }
    // var configs = [require('./gulpTask/'+options.file+'_gulp.js')];
}
else{
    var configs = klaw('./gulpTask', {filter: function(file) {
        return file.path.slice(-8) === '_gulp.js';
    }}).map(function(file){
        return require(file.path)
    });
};

gulp.task('common', commonTask);
gulp.task('config', function(){
    configs.map(function(v){
        configTask(v);
    });
});
gulp.task('main', ['common'], function(){
    configs.map(function(v){
        mainTask(v);
    })
});
gulp.task('main', ['common'], function(){
    configs.map(function(v){
        mainTask(v);
    })
});

gulp.task('default', ['common', 'config']);

// 给 .js .css 文件加时间戳
var timestamp = Date.now();
gulp.task('version', function(){
    configs.map(function(v){
        version(v);
    });
});

function version(v){  
  gulp.src(resDir+v.fileDir+v.filename+'.vm')
      .pipe(plumber())
      .pipe(replace(/\/((\w|-|\.)+)\.js(\?v=\w+)?/g, '/$1.js?v='+timestamp))
      .pipe(replace(/\/((\w|-|\.)+)\.css(\?v=\w+)?/g, '/$1.css?v='+timestamp))
      .pipe(gulp.dest(resDir+v.fileDir));
}

function commonTask(){
  var commonCss = resDir+'common/*.css',
      commonJs = resDir+'common/*.js',
      langJs = resDir+'i18n/message_lang.js',
      msgTip = resDir+'libs/MessageTip/MsgTip.js' ;

  gulp.task('jsCommon', function(){
      return gulp.src([langJs, msgTip, commonJs])
          .pipe(plumber())
          .pipe(uglify())
          .pipe(concat('common.js'))
          .pipe(gulp.dest(resDir+'dist/common'));

  });

    gulp.task('commonVersion', function(){
        gulp.src([resDir+'../WEB-INF/vm/**/*.vm'])
            .pipe(plumber())
            .pipe(replace(/common\.js(\?v=\w+)?/g, 'common.js?v='+Date.now()))
            .pipe(replace(/common\.css(\?v=\w+)?/g, 'common.css?v='+Date.now()))
            .pipe(gulp.dest(resDir+'../WEB-INF/vm/'))
    });

  gulp.task('cssCommon', function(){
      return gulp.src(commonCss)
          .pipe(plumber())
          .pipe(csso())
          .pipe(gulp.dest(resDir+'dist/common'));
  });

  gulp.watch([commonJs, langJs, msgTip], ['jsCommon', 'commonVersion']);
  gulp.watch(commonCss, ['cssCommon', 'commonVersion']);
  gulp.start(['jsCommon', 'cssCommon']);
}

function mainTask(config){
  var libsJs = config.libsJs,
      libsCss = config.libsCss,
      filename = config.filename,
      fileDir = config.fileDir,
      mainCss = resDir+config.mainCss,
      mainJs = resDir+config.mainJs,
      jsName = config.mainJs.split('/').slice(-1)[0].replace(/\.js/, ''),
      cssName = config.mainCss.split('/').slice(-1)[0].replace(/\.scss/, '') ;

    var jsReg = new RegExp(jsName + '\\.js(\\?v=\\w+)?'),
        cssReg = new RegExp(cssName + '\\.css(\\?v=\\w+)?') ;
    gulp.task('version_css:'+filename, function(){
        gulp.src(resDir + fileDir + filename + '.vm')
            .pipe(plumber())
            .pipe(replace(cssReg, cssName+'.css?v=' + Date.now()))
            .pipe(gulp.dest(resDir + fileDir));
    });
    gulp.task('version_js:'+filename, function(){
        gulp.src(resDir + fileDir + filename + '.vm')
            .pipe(plumber())
            .pipe(replace(jsReg, jsName+'.js?v=' + Date.now()))
            .pipe(gulp.dest(resDir + fileDir));
    });


  gulp.task('jsMain:'+filename, function(){
      return gulp.src(mainJs)
          .pipe(plumber())
          .pipe(uglify())
              .pipe(gulp.dest(resDir+'dist/'+filename));
  });

  gulp.task('jsInit:'+filename, ['jsMain:'+filename]);
  gulp.task('jsWatch:'+filename, function(){
      gulp.watch(mainJs, ['jsMain:'+filename, 'version_js:'+filename]);
  });


  gulp.task('cssMain:'+filename, function(){
      return gulp.src(mainCss)
          .pipe(plumber())
          .pipe(sass())
          .pipe(csso())
          .pipe(gulp.dest(resDir+'dist/'+filename));
  });
  gulp.task('cssInit:'+filename, ['cssMain:'+filename]);
  gulp.task('cssWatch:'+filename, function(){
      gulp.watch(mainCss, ['cssMain:'+filename, 'version_css:'+filename]);
  });

  gulp.task('init:'+filename, ['jsInit:'+filename, 'cssInit:'+filename]);
  gulp.task('watch:'+filename, ['jsWatch:'+filename, 'cssWatch:'+filename]);
  gulp.start(['init:'+filename, 'watch:'+filename]);
}

function configTask(config){
  var libsJs = config.libsJs,
      libsCss = config.libsCss,
      filename = config.filename,
      mainCss = resDir+config.mainCss,
      mainJs = resDir+config.mainJs ;
  libsJs = libsJs.map(function(v){
      return (v = resDir + v);
  });
  libsCss = libsCss.map(function(v){
      return (v = resDir + v);
  });
  gulp.task('jsLibs:'+filename, function(){
      return gulp.src(libsJs)
          .pipe(plumber())
          .pipe(uglify())
          .pipe(concat('libs.min.js'))
          .pipe(gulp.dest(resDir+'dist/'+filename));
  });

  gulp.task('jsMain:'+filename, function(){
      return gulp.src(mainJs)
          .pipe(plumber())
          .pipe(uglify())
              .pipe(gulp.dest(resDir+'dist/'+filename));
  });

  gulp.task('jsInit:'+filename, ['jsLibs:'+filename, 'jsMain:'+filename]);
  gulp.task('jsWatch:'+filename, function(){
      gulp.watch(libsJs, ['jsLibs:'+filename]);
      gulp.watch(mainJs, ['jsMain:'+filename]);
  });

  gulp.task('cssLibs:'+filename, function(){
      return gulp.src(libsCss)
          .pipe(plumber())
          .pipe(csso())
          .pipe(concat('libs.min.css'))
          .pipe(gulp.dest(resDir+'dist/'+filename));
  });

  gulp.task('cssMain:'+filename, function(){
      return gulp.src(mainCss)
          .pipe(plumber())
          .pipe(sass())
          .pipe(csso())
          .pipe(gulp.dest(resDir+'dist/'+filename));
  });
  gulp.task('cssInit:'+filename, ['cssLibs:'+filename, 'cssMain:'+filename]);
  gulp.task('cssWatch:'+filename, function(){
      gulp.watch(libsCss, ['cssLibs:'+filename]);
      gulp.watch(mainCss, ['cssMain:'+filename]);
  });

  gulp.task('init:'+filename, ['jsInit:'+filename, 'cssInit:'+filename]);
  gulp.task('watch:'+filename, ['jsWatch:'+filename, 'cssWatch:'+filename]);
  gulp.start(['init:'+filename, 'watch:'+filename]);
}