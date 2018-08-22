
var libsJs = ['jquery-1.12.0.min.js','sweetalert.min.js', 'template.js', 'vue.js'] ,
    libsCss = ['sweetalert.css'],
    filename = 'interface',
    mainCss = './sass/interface.scss',
    mainJs = './js/interface.js';

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
    fileDir: '../WEB-INF/vm/api/',
    mainCss: mainCss,
    mainJs: mainJs
}