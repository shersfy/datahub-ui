
var libsJs = ['jquery-1.12.0.min.js','sweetalert.min.js'] ,
    libsCss = ['sweetalert.css'],
    filename = 'dumpDetail',
    mainCss = './sass/dumpDetail.scss',
    mainJs = './js/dumpDetail.js';

libsJs = libsJs.map(function(v){
    return (v = './libs/**/'+v);
});
libsCss = libsCss.map(function(v){
    return (v = './libs/**/'+v);
});


module.exports = {
    libsJs: libsJs,
    libsCss:libsCss,
    filename: filename,
    fileDir: '../WEB-INF/vm/',
    mainCss: mainCss,
    mainJs: mainJs,
}