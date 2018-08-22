/**
 * Created by Administrator on 2017/12/18.
 */

$('body').on('click', '.returnTop', function(){
    returnTop(300);
});

function returnTop(time){
    var allTop = $(window).scrollTop(),
        val = Math.ceil(allTop / (time/20) );

    actTop(allTop, val);
}

function actTop(all, val){
    all -= val;
    all <= 0 ? all = 0 : '';
    window.scrollTo(0, all);
    if ( all <= 0 )
        return ;
    window.requestAnimationFrame(function(){actTop(all, val)});
}


getData(true);

function getData(force){
    if ( window.localStorage && !force ){
        var version = localStorage.getItem('datahub.version'),
            data = localStorage.getItem('datahub.openapi') ;
        if ( data ){
            try{
                var data = JSON.parse( data );
                showContent(data);
                return ;
            } catch (e) {}
        }
    }

    $.get('env/api/list').then(function(data){
        if ( data.code != 200 ){
            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
            return ;
        }
        //localStorage.setItem('datahub.version', 'v3.4.1');
        localStorage.setItem('datahub.openapi', JSON.stringify(data));
        showContent( data );
    });
}

function showContent(data){
    var indexHtml = '',
        apiHtml = '' ;
    if ( common_i18n_lang == 'zh' ) {  //中文
        data.model.data.map(function (v, i) {
            indexHtml += '<tr>' +
            '<td><a href="#index' + v.id + '">'+ v.nameZh+'</a></td>' +
            '<td>'+ v.url+'</td>' +
            '</tr>';
        });
        apiHtml = template('template/zh', data.model);
    }
    else {  //英文
        data.model.data.map(function (v, i) {
            indexHtml += '<tr>' +
            '<td><a href="#index' + v.id + '">'+ v.nameEn+'</a></td>' +
            '<td>'+ v.url+'</td>' +
            '</tr>';
        });
        apiHtml = template('template/en', data.model);
    }

    $('.index tbody').html( indexHtml );
    $('article.main').append(apiHtml);
    setTimeout(function() {
        $('.json').map(function (i, v) {
            try {
                var json = JSON.parse($(v).text());
                $(v).text(JSON.stringify(json, null, 2));
            } catch (e) { }
        })
    }, 0);
}
