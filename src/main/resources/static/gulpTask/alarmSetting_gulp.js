
var libsJs = ['jquery-1.12.0.min.js', 'sweetalert.min.js', 'select2.min.js', 'vue.js'] ,
    libsCss = ['sweetalert.css', 'select2.min.css'],
    filename = 'alarmSetting',
    mainCss = './sass/alarmSetting.scss',
    mainJs = './js/alarmSetting.js';

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
    fileDir: '../WEB-INF/vm/config/',
    mainCss: mainCss,
    mainJs: mainJs
}