
var libsJs = ['jquery-1.12.0.min.js', 'template.js','sweetalert.min.js', 'select2.min.js'] ,
    libsCss = ['sweetalert.css', 'select2.min.css'],
    filename = 'excelUpload',
    mainCss = './sass/excelUpload.scss',
    mainJs = './js/excelUpload.js';

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
    fileDir: '../WEB-INF/vm/transfer/',
    mainCss: mainCss,
    mainJs: mainJs
}