
var libsJs = ['jquery-1.12.0.min.js', 'select2.min.js','sweetalert.min.js'] ,
    libsCss = ['select2.min.css','sweetalert.css',],
    filename = 'envir',
    mainCss = './sass/envir.scss',
    mainJs = './js/envir.js';

libsJs = libsJs.map(function(v){
    return (v = 'libs/**/'+v);
});
libsCss = libsCss.map(function(v){
    return (v = 'libs/**/'+v);
});


module.exports = {
    libsJs: libsJs,
    libsCss: libsCss,
    filename: filename,
    fileDir: '../WEB-INF/vm/environment/',
    mainCss: mainCss,
    mainJs: mainJs,
}