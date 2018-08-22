var libsJs = ['jquery-1.12.0.min.js','sweetalert.min.js','template.js','select2.min.js'] ,
    libsCss = ['sweetalert.css', 'select2.min.css'],
    filename = 'amazonS3',
    mainCss = './sass/amazonS3.scss',
    mainJs = './js/amazonS3.js';

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
    fileDir: '../WEB-INF/vm/transfer/',
    mainCss: mainCss,
    mainJs: mainJs
}