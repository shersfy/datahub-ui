
var libsJs = ['jquery-1.12.0.min.js','jquery.bootpag.min.js', 'template.js','sweetalert.min.js', 'select2.min.js','WdatePicker.js'] ,
    libsCss = ['sweetalert.css', 'select2.min.css'],
    filename = 'dumpVersion',
    mainCss = './sass/dumpVersion.scss',
    mainJs = './js/dumpVersion.js';

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