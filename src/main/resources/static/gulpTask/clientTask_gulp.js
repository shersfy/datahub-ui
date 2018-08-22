
var libsJs = ['jquery-1.12.0.min.js','jquery.bootpag.min.js', 'template.js','sweetalert.min.js', 'select2.min.js'] ,
    libsCss = ['bootstrap.css', 'sweetalert.css', 'select2.min.css'],
    filename = 'clientTask',
    mainCss = './sass/clientTask.scss',
    mainJs = './js/clientTask.js';

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
    mainJs: mainJs
}