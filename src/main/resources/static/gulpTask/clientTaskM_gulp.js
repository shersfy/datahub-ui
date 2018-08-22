
var libsJs = ['jquery-1.12.0.min.js','jquery.bootpag.min.js', 'template.js','sweetalert.min.js', 'select2.min.js'] ,
    libsCss = ['sweetalert.css', 'select2.min.css'],
    filename = 'clientTaskM',
    mainCss = './sass/clientTaskM.scss',
    mainJs = './js/clientTaskM.js';

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
    fileDir: '../WEB-INF/vm/client/',
    mainCss: mainCss,
    mainJs: mainJs,
}