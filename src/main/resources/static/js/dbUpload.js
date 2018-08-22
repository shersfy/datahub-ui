
// CodeMirror 设置
var editor = CodeMirror.fromTextArea($('.global-ConfigCon .new-sql textarea')[0], {
        lineNumbers: true
    }),
    SQLeditor = CodeMirror.fromTextArea($('.sqlQuery.config .new-sql textarea')[0], {
        lineNumbers: true
    }),
    filterEditor = CodeMirror.fromTextArea($('.filterTab textarea')[0], {
        lineNumbers: true
    }),
    SQLEditor = ace.edit('SQLEditor') ;
SQLEditor.session.setMode("ace/mode/sql");
SQLEditor.setTheme("ace/theme/sqlserver");
SQLEditor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true
});
$('.sqlQuery').on('click', '.format', function(){
    var sql = SQLEditor.getValue();
    SQLEditor.setValue( sqlFormatter.format(sql) );
});

var JSFilter = ace.edit('JSFilter') ;
JSFilter.session.setMode("ace/mode/javascript");
JSFilter.setTheme("ace/theme/sqlserver");
JSFilter.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true
});

var tmpParam = {
    jobId: 0,
    editJobModel: {},
    dbConfigParam: {},
    dbConfigParamOption: '',
    dbParamObj: {},
    sourceId: '',
    targetId: '',
    sourceDb: {},
    targetType: 0,
    groupNo: 0,
    urlConnectList: {},
    curTableList: [],
    curHiveParam: {},
    columnsOption: '',
    filtersOption: '',
    fromJson: [],
    toHdfsJson: [],
    toHiveJson: [],
    toDbJson: [],
    linkSource2type: {
        '1': [38, 4, 40, 44, 24],
        '2': [52, 53, 55, 54],
        '3': [56, 57, 60, 58]
    },
    urlObj: {},
    tmpAppId : 0,
    type1Val: '',
    connId: 0,
    tmpDbParam: {},
    editTmpDbParam: {},
    searchParam: {
        searchInterval: '',
        keyword: '',
        checkedDbNum: 0,
        tarNum: 0,
        isSearch: false
    },
    batchTblMode: false,
    columnObjMap: {},
    curTableColumnsMap: []
};
$.extend(globalParam, tmpParam);

// 是否是 处于编辑状态
try {
    // 取url参数
    var urlParam = location.search.replace(/^\?|\?$/g, '').split('&');
    for ( var i=0,len=urlParam.length; i<len; i++ ){
        var obj = urlParam[i].split('=');
        globalParam.urlObj[obj[0]] = obj[1] || '' ;
    }

    var urlType = globalParam.urlObj.type || 1;
    globalParam.groupNo = [2, 6, 7][+urlType - 1]; // 2 :db  6:ali 7:aws
    if ( urlType != 1 ){     // ali aws 屏蔽掉 多余的sql 选项
        $('.source #dbType option').map(function(i, v){
            var val = +$(v).val();
            if ( val > 0 && globalParam.linkSource2type[urlType+''].indexOf(val) == -1 )
                $(v).css({display:'none'});
        });
    }
    var urlTitle = [common_js_lang['db.title.dbMigrate'], common_js_lang['db.title.aliMigrate'], common_js_lang['db.title.amazonMigrate']][+urlType - 1];
    $(document).attr('title', urlTitle);
    $('h2.title span.titleType').html(urlTitle);
    globalParam.urlObj.dbtype && $('#dbType').val(globalParam.urlObj.dbtype+'');

    if ( globalParam.urlObj.dbtype == 4 ){   // Oracle -> Oracle
        //$('.upload-type .target-type').append('<option value="4">Oracle</option>');
    }
    //else if ( globalParam.urlObj.dbtype == 38 ){ // MySQL -> Oracle
    //    $('.upload-type .target-type').append('<option value="4">Oracle</option>');
    //}

    var id = globalParam.urlObj.id || 0;
    if(id <= 0) throw "";
    $.fn.ajaxAPI({
        url: 'job/detail?jobId=' + id,
        async: false,
        callback: function(data) {
            if ( globalParam.urlObj.copy )
                data.model.jobName = (data.model.jobName+'_copy').slice(0,60);
            $('.configTask .taskName').val(data.model.jobName);
            $('.configTask .taskDes').val(data.model.note);
            data.model.pid && $('#userApp').val(data.model.pid).select2();
            if(JSON.parse(data.model.otherParams).fromList) {
                globalParam.jobId = id;
                globalParam.editJobModel = data.model;
                if ( !data.model.fromId )
                    return ;
                if ( data.model.fromObject ) {
                    if ( data.model.fromObject.delFlg == -1 ){
                        $.extend(globalParam.editTmpDbParam, data.model.fromObject);
                    }
                    globalParam.urlObj.type == 1 && (globalParam.urlObj.dbtype = data.model.fromObject.dbType);
                }

                if ( globalParam.urlObj.dbtype == 4 ){   // Oracle -> Oracle
                    //  $('.upload-type .target-type').append('<option value="4">Oracle</option>');
                }
            }

            var delTip = '';
            if ( !data.model.fromObject ){
                delTip += common_js_lang['conf.info.srcNull'];
            }
            if ( !data.model.toObject ){
                delTip += (delTip ? '<br>':'')+common_js_lang['conf.info.tarNull'];
            }
            delTip ? MsgTip('info', delTip, 5000) : '';
        }
    });
}
catch (e) {

};

function initAct(){
    // 配置提示语
    if ( globalParam.targetType != globalParam.commonLinkType.hdfs ){
        var dbtip = {
            mysql: common_js_lang['db.text.mysql'],
            oracle: common_js_lang['db.text.oracle'],
            db2: common_js_lang['db.text.db2'],
            mssql: common_js_lang['db.text.mssql'],
            psql: common_js_lang['db.text.psql']
        } ;
        var Adbtip = {
            mysql: common_js_lang['db.text.Amysql'],
            oracle: common_js_lang['db.text.Aoracle'],
            db2: common_js_lang['db.text.Adb2'],
            mssql: common_js_lang['db.text.Amssql'],
            psql: common_js_lang['db.text.Apsql']
        } ;
        var type2db = {
            38: 'mysql', 52: 'mysql' ,56:'mysql',
            4:'oracle', 60:'oracle',
            40:'mssql',53:'mssql',57: 'mssql',
            44:'db2',
            24: 'psql', 54: 'psql', 58: 'psql'
        } ;
        var type = $('.choose-link [data-key="dbType"]').val(),
            tarTip = globalParam.urlObj.type == 1 ? dbtip : Adbtip ;
        $('.tip .dbtip span').html(tarTip[ type2db[type] ]);

        $('.stepCon .item2 h3 i.tip').html( common_js_lang['db.note.tableNote'] );
    }
    else {
        $('.stepCon .item2 h3 i.tip').html( common_js_lang['db.note.hdfsNote'] );
        //$('.tip .dbtip').remove();
    }
}

$('.url-info').on('change', '.linkList', function() {
    var val = $(this).val();
    if(!val) return false;
    var obj = JSON.parse( $(this).find('option:selected').attr('data-val') );
    var conDom = $(this).parents('.choose-link');
    conDom.find('[data-key="dbType"]').val(obj.dbType);
    conDom.find('[data-key="host"]').val(obj.host);
    conDom.find('[data-key="port"]').val(obj.port);
    conDom.find('[data-key="dbName"]').val(obj.dbName);
    conDom.find('[data-key="userName"]').val(obj.userName);
    conDom.find('[data-key="password"]').val(obj.password);
    conDom.find('[data-key="url"]').val(obj.url);
    conDom.find('[data-key="connName"]').val(obj.connName);
});

$('.item1').on('change', '.connType', function(){
    var connType = $(this).val();
    var type = globalParam.urlObj.type || 1;
    if ( connType == 1 ){
        $('.item1 .source .type1show').show();
        $('.item1 .source input').prop('disabled', true).val('').removeClass('error');
        if ( type != 1 ){
            $('.item1 .source #dbType').val('').prop('disabled', true);
        }
        $('.source .linkList').select2();
    }
    else {
        $('.item1 .source .linkList').val('').select2();
        $('.item1 .source .type1show').hide();
        $('.item1 .source input').prop('disabled', false).val('').removeClass('error');
        $('.item1 .source [data-key="connName"]').prop('disabled', true);
        if ( type != 1 ){
            $('.item1 .source #dbType').val('').prop('disabled', false);
        }
    }
});

var jobOtherParams = '';
if(globalParam.jobId > 0) {
    jobOtherParams = JSON.parse(globalParam.editJobModel.otherParams);
    getDBList({pageSize: 1000,pageNo: 1, groups:globalParam.urlObj.type, dbType:globalParam.urlObj.dbtype, id: globalParam.editTmpDbParam.delFlg == -1 ? 0 : jobOtherParams.fromList[0].id});
    getConnect(globalParam.editJobModel.toId);
} else {
    getDBList({pageSize: 1000,pageNo: 1, groups:globalParam.urlObj.type, dbType:globalParam.urlObj.dbtype});
    getConnect();
}

$('body').on('click', 'button.index', function(){
    window.location.href = './';
});


// init
$('#userApp').change(function(){
    getDBList({pageSize: 1000,pageNo: 1, groups:globalParam.urlObj.type, dbType:globalParam.urlObj.dbtype});
    var conDom = $('.item1 .choose-link');
    if ( conDom.find('.connType').val() == 1 ){  // 清空源连接 数据
        conDom.find('[data-key="dbType"]').val(globalParam.urlObj.dbtype || '');
        ['host', 'port', 'dbName', 'userName', 'password', 'url', 'connName'].map(function(v){
            conDom.find('[data-key="'+v+'"]').val('');
        }) ;
    }
    getConnect();
    var columnCon = $('.upload-type').find('.column');
    columnCon.find('input,select').val('') ;
});

function getDBList(data) {
    if ( !$('#userApp').val() )
        return false;

    var _data = data;
    $.fn.ajaxAPI({
        url: 'db/list?pid='+$('#userApp').val(),
        data: data,
        callback: function(data) {
            var sourceLink = [];
            data.model.data = data.model.data.map(function(v) {
                v.val = JSON.stringify(v);
                v.paramsVal = JSON.stringify(v.params);
                sourceLink.push(v);
                return v;
            });
            globalParam.urlConnectList = data.model.data;
            var options = '<option value="" disabled>'+common_js_lang['db.info.dbLinkErr']+'</option>';
            options += template('template/options', {data: sourceLink});
            $('.source .linkList').html(options).val('').select2();
            _data.id && $('.source .linkList').val(_data.id).change();
            //globalParam.urlObj.dbtype && $('#dbType').val(globalParam.urlObj.dbtype+'');
        }
    });
}

// input blur 验证
$('.item1 .source').on('blur', 'input', function(){
    var key = $(this).attr('data-key'),
        val = ( $(this).val() || '').trim() ;
    var data = {};
    data[key] = val ;

    if ( key === 'url' && val === '' ){
        var param = getUrlParam($(this));
        $(this).val(getlinkUrl(param)).removeClass('error');
        return false;
    }
    var checkRes = checkDbInfo(data);
    if ( checkRes.res !== true ){   //验证输入合法性
        $(this).addClass('error');
        return false;
    }
    $(this).removeClass('error');

    // tmp connName add
    if ( $('.source .connType').val() == 2 && ['host', 'port', 'dbName'].indexOf(key) > -1 ){
        var tmpCon = $('.source.formCon');
        var host = (tmpCon.find('[data-key="host"]').val() || '').trim(),
            port = (tmpCon.find('[data-key="port"]').val() || '').trim(),
            dbName = (tmpCon.find('[data-key="dbName"]').val() || '').trim() ;
        var connName = 'TMP_'+host+'_'+port+'_'+dbName;
        $('.source [data-key="connName"]').val(connName);
    }
    //

    if ( ['host', 'port', 'dbName'].indexOf(key) > -1 ){
        var param = getUrlParam($(this));
        $(this).parents('ul').find('[data-key="url"]').val(getlinkUrl(param));
    }
});

function getUrlParam(obj){
    var con = obj.parents('ul') ;
    return {
        dbType: (con.find('[data-key="dbType"]').val() || '').trim(),
        host: (con.find('[data-key="host"]').val() || '').trim(),
        port: (con.find('[data-key="port"]').val() || '').trim(),
        dbName: (con.find('[data-key="dbName"]').val() || '').trim()
    }
}
function getlinkUrl(param){
    if ( [38, 52, 56].indexOf(+param.dbType) > -1 ){
        return "jdbc:mysql://"+param.host+":"+param.port+"/"+param.dbName ;
    }
    else if ( [4,55,60].indexOf(+param.dbType) > -1 ){
        return "jdbc:oracle:thin:@"+param.host+":"+param.port+":"+param.dbName ;
    }
    else if ( [40, 53, 57].indexOf(+param.dbType) > -1 ){
        return "jdbc:sqlserver://"+param.host+":"+param.port+";DatabaseName="+param.dbName ;
    }
    else if ( param.dbType == 44 ){
        return "jdbc:db2://"+param.host+":"+param.port+"/"+param.dbName;
    }
    else if ( [24,54,58].indexOf(+param.dbType) > -1 ){
        return "jdbc:postgresql://"+param.host+":"+param.port+"/"+param.dbName;
    }
}

function checkDbInfo(data){
    for (var key in data ){
        if ( key === 'id' ){
            continue;
        }
        if ( key === 'connName' && data.connName === '' )
            continue;

        if ( key === 'port' && !data.port.match(/^[1-9][0-9]*$/g) ){
            return {res:false, key:key};
        }

        if ( data[key] === '' ){
            return {res:false, key:key};
        }
    }
    return {res: true};
}

// 目标位置切换
$('.upload-type').on('change', '.typeCon #targetType', function(e, toId) {
    var type = $(this).val();
    if (!type) {
        return;
    }
    getConnect(toId, type > globalParam.commonLinkType.spark ? type : '');
    var columnCon = $(this).parents('.upload-type').find('.column').addClass('hidden');
    columnCon.find('input,select').val('').attr('title', '');
    if ([globalParam.commonLinkType.hive, globalParam.commonLinkType.spark].indexOf( type ) > -1) {
        columnCon.siblings('.hive').removeClass('hidden');
        return;
    }
    [globalParam.commonLinkType.hdfs].indexOf(type) > -1 ? columnCon.siblings('.hdfs').removeClass('hidden') : columnCon.siblings('.db').removeClass('hidden');
});

function getConnect(id, dbType){
    var pid = $('#userApp').val(),
        targetType = $('#targetType').val(),
        url = 'db/list',
        dbType = dbType || 31, //dbType > 3 为db的连接
        groups = '';
    targetType == globalParam.commonLinkType.hdfs ? (url = 'hdfs/list') : (groups = 4) ;
    targetType == globalParam.commonLinkType.spark ? dbType = 62 : '';
    targetType > globalParam.commonLinkType.spark ? groups = 1 : '';   //db参数
    if ( !pid )
        return ;
    $.fn.ajaxAPI({
        url: url+'?pid='+pid+'&groups='+groups+'&dbType='+dbType,
        callback: function(data){
            var connHtml = '<option value="" disabled>'+common_js_lang['db.info.selectLink']+'</option>' ;
            targetType == globalParam.commonLinkType.hdfs ? adminConfigData.hdfs.id && (connHtml += '<option value="'+adminConfigData.hdfs.id+'" data-val="'+encodeURIComponent(JSON.stringify(adminConfigData.hdfs))+'">'+adminConfigData.hdfs.connName+'</option>') : '';
            targetType == globalParam.commonLinkType.hive ? adminConfigData.hive.id && (connHtml += '<option value="'+adminConfigData.hive.id+'" data-val="'+encodeURIComponent(JSON.stringify(adminConfigData.hive))+'">'+adminConfigData.hive.connName+'</option>') : '';
            data.model.data.map(function(v){
                connHtml += '<option value="'+v.id+'" data-val="'+encodeURIComponent(JSON.stringify(v))+'">'+v.connName+'</option>' ;
            });
            if ( targetType == globalParam.commonLinkType.hdfs ){   /// / 复现 hdfs 连接参数
                $('.upload-type .column.hive [data-key="hid"]').html(connHtml).val('').find('option').eq(0).text(' ');
            }

            if ( !id )  // case: 新建任务 请求连接
                $('.upload-type .connId').html(connHtml).val('').select2().change();

            // case: 编辑任务情况
            if ( id && globalParam.editJobModel.toType == 8 && targetType == globalParam.commonLinkType.hdfs ) // case: 目标为hdfs
                $('.upload-type .connId').html(connHtml).val(id).select2().change();
            if ( id && [9,13].indexOf(+globalParam.editJobModel.toType) > -1 && targetType != globalParam.commonLinkType.hdfs ) // case: 目标为hive
                $('.upload-type .connId').html(connHtml).val(id).select2().change();
            if ( id && [9,13].indexOf(+globalParam.editJobModel.toType) > -1 && targetType == globalParam.commonLinkType.hdfs )  // case: 目标为hive，但依赖的hdfs返回慢些
                $('.upload-type .connId').val(id).select2().change();
            if ( id && [8,9,13].indexOf(+globalParam.editJobModel.toType) == -1 && targetType > globalParam.commonLinkType.spark ){  // case:目标为db
                $('.upload-type .connId').html(connHtml).val(id).select2().change();
            }
        }
    })
}

$('.upload-type').on('change', '.connId', function() {
    try {
        var val = JSON.parse(decodeURIComponent($(this).find('option:selected').attr('data-val')));
    } catch ( e ){
        return ;
    }
    if( !val.id ) return false;
    var type = $('.upload-type #targetType').val();
    resetDestConn(val, [globalParam.commonLinkType.hive, globalParam.commonLinkType.spark].indexOf(type) > -1? $('.upload-type .column.hive'): type == globalParam.commonLinkType.hdfs ? $('.upload-type .column.hdfs') : $('.upload-type .column.db') ) ;
});

$('.testConnect').on('click', function(){
    var isSource = $(this).parents('.source').length == 1 ;
    $(this).parent().find('.testRes').empty();

    if ( isSource ){
        var fromType = $('.source .connType').val();
        if ( fromType == 1 ){
            var id = $('.linkList').val() || 0;
            if ( id <= 0 ){
                MsgTip('', common_js_lang['db.info.selectSavedLink'], 'info');
                return ;
            }
            testDbConnect({pid:$('#userApp').val(), id: id}, $(this).parent());
        }
        else {
            if ( globalParam.jobId > 0 ){
                testDbConnect({pid:$('#userApp').val(), id: globalParam.editJobModel.fromId}, $(this).parent());
                return ;
            }

            var param = {};
            ['connName', 'url', 'host', 'port', 'dbName', 'userName', 'password', 'dbType'].map(function(v){
                param[v] = ($('.source [data-key="'+v+'"]').val() || '').trim() ;
            });
            var res = checkDbInfo(param);
            if ( !res.res ){
                MsgTip('', common_js_lang['db.info.completeParam'], 'info');
                return false;
            }
            param.connName = param.connName || 'TMP_'+param.host+'_'+param.port+'_'+param.dbName;
            $('.source [data-key="connName"]').val(param.connName);
            param['pid'] = $('#userApp').val();
            param['delFlg'] = -1 ;
            testDbConnect(param, $(this).parent());
        }
    }
    else {
        var targetType = $('#targetType').val();
        var id = $('.typeCon .connId').val() ;
        if ( !id ){
            MsgTip('', common_js_lang['db.info.tarConn'], 'info');
            return ;
        }
        try {
            var val = JSON.parse(decodeURIComponent($('.upload-type .connId').find('option:selected').attr('data-val')));
        } catch ( e ){
            var val = {} ;
        }
        targetType != globalParam.commonLinkType.hdfs && testDbConnect(val, $(this).parent());
        targetType == globalParam.commonLinkType.hdfs && testHdfsConnect(val, $(this).parent());
    }
});

function checkUrl(url, param, curUrl){
    var res = {
        res: false,
        tag: 'e'
    } ;
    try {
        if (curUrl.indexOf(url) == 0) {
            res.res = true;
            return res;
        }

        if ([38, 52, 56].indexOf(+param.dbType) > -1) {
            res.tag = 'type';
            if ( curUrl.slice(0, 13) !== 'jdbc:mysql://' ){
                return res;
            }

            res.tag = 'host' ;
            curUrl = curUrl.substr(13);
            var tmpArr = curUrl.split('/') ;
            var tmpArr1 = tmpArr[0].split(':');

            if ( tmpArr1[0] !== param.host )
                return res;

            res.tag = 'port';
            tmpArr1[1] = tmpArr1.splice(1).join(':');
            if ( tmpArr1[1] !== param.port )
                return res;

            res.tag = 'dbName';
            if ( tmpArr.splice(1).join('/').indexOf( param.dbName ) != 0 )
                return res;
            res.res = true ;
            return res;
        }
        else if ([4, 55, 60].indexOf(+param.dbType) > -1) {
            res.tag = 'type';
            if ( curUrl.slice(0, 18) !== 'jdbc:oracle:thin:@' ){
                return res;
            }

            res.tag = 'host' ;
            curUrl = curUrl.substr(18);
            var tmpArr = curUrl.split(':') ;
            if ( tmpArr[0] !== param.host )
                return res;

            res.tag = 'port';
            if ( tmpArr[1] !== param.port )
                return res;

            res.tag = 'dbName';
            if ( tmpArr.splice(2).join(':').indexOf( param.dbName ) != 0 )
                return res;
            res.res = true ;
            return res;
            //return "jdbc:oracle:thin:@" + param.host + ":" + param.port + ":" + param.dbName;
        }
        else if ([40, 53, 57].indexOf(+param.dbType) > -1) {
            res.tag = 'type';
            if ( curUrl.slice(0, 17) !== 'jdbc:sqlserver://' ){
                return res;
            }

            res.tag = 'host' ;
            curUrl = curUrl.substr(17);
            var tmpArr = curUrl.split(';') ;
            var tmpArr1 = tmpArr[0].split(':');

            if ( tmpArr1[0] !== param.host )
                return res;

            res.tag = 'port';
            tmpArr1[1] = tmpArr1.splice(1).join(':');
            if ( tmpArr1[1] !== param.port )
                return res;

            tmpArr[1] = tmpArr.splice(1).join(';');
            res.tag = 'dbName';
            if ( tmpArr[1].indexOf('DatabaseName='+param.dbName) != 0 )
                return res;

            res.res =true;
            return res ;
            //return "jdbc:sqlserver://" + param.host + ":" + param.port + ";DatabaseName=" + param.dbName;
        }
        else if (param.dbType == 44) {
            res.tag = 'type';
            if ( curUrl.slice(0, 11) !== 'jdbc:db2://' ){
                return res;
            }

            res.tag = 'host' ;
            curUrl = curUrl.substr(11);
            var tmpArr = curUrl.split('/') ;
            var tmpArr1 = tmpArr[0].split(':');

            if ( tmpArr1[0] !== param.host )
                return res;

            res.tag = 'port';
            tmpArr1[1] = tmpArr1.splice(1).join(':');
            if ( tmpArr1[1] !== param.port )
                return res;

            tmpArr[1] = tmpArr.splice(1).join('/');
            res.tag = 'dbName';
            if ( tmpArr[1].indexOf(param.dbName) != 0 )
                return res;

            res.res =true;
            return res ;
            //return "jdbc:db2://" + param.host + ":" + param.port + "/" + param.dbName;
        }
        else if ([24, 54, 58].indexOf(+param.dbType) > -1) {
            res.tag = 'type';
            if ( curUrl.slice(0, 18) !== 'jdbc:postgresql://' ){
                return res;
            }

            res.tag = 'host' ;
            curUrl = curUrl.substr(18);
            var tmpArr = curUrl.split('/') ;
            var tmpArr1 = tmpArr[0].split(':');

            if ( tmpArr1[0] !== param.host )
                return res;

            res.tag = 'port';
            tmpArr1[1] = tmpArr1.splice(1).join(':');
            if ( tmpArr1[1] !== param.port )
                return res;

            tmpArr[1] = tmpArr.splice(1).join('/');
            res.tag = 'dbName';
            if ( tmpArr[1].indexOf(param.dbName) != 0 )
                return res;

            res.res =true;
            return res ;
        }
    } catch(e){
    }
    return res;
}

$('.connType, .linkList, .target-type, .connId').change(function(){
    var container = $(this).parents('.source');
    container.length == 0 ? container = $(this).parents('.upload-type') : '';
    container.find('.testRes').empty();
});

$('.testRes').on('click', '.showTip', function(){
    var data = JSON.parse( decodeURIComponent($(this).attr('data-info')) );
    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
});

function testHdfsConnect(param, parentDom){
    var formData = new FormData();
    formData.append('hid', param.id);

    var loading = setTimeout(function(){
        var loadCon = "<div id='loadCon' style='position:fixed;z-index:99 ;height:100%;width:100%;top:0;left:0; background:rgba(255,255,255, .3);'><div style='width:20%;margin:20% 40%;text-align:center;height:80px;line-height:80px;'><img src='resources/dist/images/loading.gif'></div></div>" ;
        if ( $('#loadCon').length == 0 )
            $('body').append(loadCon);
    }, 2000);

    $.ajax({
        url: 'hdfs/connect',
        type: 'post',
        contentType: false,
        processData: false,
        data: formData,
        success: function(data){
            if ( data.code != 200 ){
                parentDom.find('.testRes').removeClass('right').addClass('err').html('<i class="fail"></i>'+common_js_lang['db.text.testFail']+'<a class="showTip" data-info='+encodeURIComponent(JSON.stringify(data))+'>'+common_js_lang['db.text.errTip']+'</a>');
                return ;
            }
            parentDom.find('.testRes').removeClass('err').addClass('right').html('<i class="suc"></i>'+common_js_lang['db.text.testSuc']);
        },
        complete: function(data) {
            clearInterval(loading);
            $('#loadCon').remove();
        }
    });
}

function testDbConnect(param, parentDom){
    if ( param.delFlg == -1 ) {
        var urlParam = getUrlParam($('.item1 .source [data-key="port"]'));
        var defaultUrl = getlinkUrl(urlParam);
        var checkRes = checkUrl(defaultUrl, urlParam, param.url);

        if (!checkRes.res) {
            MsgTip('', common_js_lang["dbManage.check." + checkRes.tag], 'info');
            return false;
        }
    }

    var loading = setTimeout(function(){
        var loadCon = "<div id='loadCon' style='position:fixed;z-index:99 ;height:100%;width:100%;top:0;left:0; background:rgba(255,255,255, .3);'><div style='width:20%;margin:20% 40%;text-align:center;height:80px;line-height:80px;'><img src='resources/dist/images/loading.gif'></div></div>" ;
        if ( $('#loadCon').length == 0 )
            $('body').append(loadCon);
    }, 2000);

    $.ajax({
        url: 'db/connect',
        type: 'post',
        contentType: 'application/x-www-form-urlencoded',
        data: param.delFlg == -1 ? param : {id: param.id},
        success: function(data){
            if ( data.code != 200 ){
                parentDom.find('.testRes').removeClass('right').addClass('err').html('<i class="fail"></i>'+common_js_lang['db.text.testFail']+'<a class="showTip" data-info='+encodeURIComponent(JSON.stringify(data))+'>'+common_js_lang['db.text.errTip']+'</a>');
                return ;
            }
            parentDom.find('.testRes').removeClass('err').addClass('right').html('<i class="suc"></i>'+common_js_lang['db.text.testSuc']);
        },
        complete: function(data) {
            clearInterval(loading);
            $('#loadCon').remove();
        }
    })
}

function hdfsAuthToggle(index, id){
    var doc = $('.upload-type .column.hdfs') ;
    doc.find('.radio').removeClass('cur').eq(+index-1).addClass('cur');
    doc.find('.kerberos, .normal').addClass('hidden');
    index == 2 ? doc.find('.kerberos').removeClass('hidden') : doc.find('.normal').removeClass('hidden');
    index == 2 && id == adminConfigData.hdfs.id && doc.find('.admin').addClass('hidden');
}

function resetDestConn(data, doc ){
    if ( data.authType ){ //hdfs
        hdfsAuthToggle(data.authType, data.id);
        var columnArr = ['keytab', 'principal', 'connName', 'coreSiteXml', 'hdfsSiteXml', 'krb5Conf'] ;
        data.authType != 2 && (columnArr = ['userName', 'connName', 'coreSiteXml', 'hdfsSiteXml']);
        for (var k in data ){
            if ( columnArr.indexOf(k) == -1 )
                continue ;
            doc.find('[data-key="'+k+'"]').val(data[k]);
        }
        if ( data.authType == 3 ) {
            var pid = $('#userApp').val();
            common_project[pid].proxyUser && (doc.find('[data-key="userName"]').val(common_project[pid].proxyUser));
        }
    }
    else if ( data.hid ) { //hive
        if ( data.ha ){
            data.host = data.host.split(',').map(function(v, i){
                return v.split(':')[0];
            }).join(',');
        }
        for (var k in data ){
            if ( ['connName', 'url', 'host', 'port', 'userName', 'password', 'hid'].indexOf(k) > -1 )
                doc.find('[data-key="'+k+'"]').val(data[k]);
        }
        doc.find('[data-key="host"]').attr('title', data.host);
        doc.find('[data-key="url"]').attr('title', data.url);
        var pid = $('#userApp').val();
        data.id == adminConfigData.hive.id && doc.find('[data-key="userName"]').val(common_project[pid].proxyUser);
        doc.find('[data-key="hid"]').change();
    }
    else {  //db
        for (var k in data ){
            if ( ['dbType', 'dbName', 'connName', 'url', 'host', 'port', 'userName', 'password'].indexOf(k) > -1 )
                doc.find('[data-key="'+k+'"]').val(data[k]);
        }
    }
}
// 编辑
;
(function() {
    if(globalParam.jobId <= 0) return;
    if ( globalParam.editTmpDbParam.delFlg == -1 ){
        $('.source .connType').val('2').change();
        ['connName', 'url', 'host', 'port', 'dbName', 'userName', 'password', 'dbType'].map(function(v){
            if ( v == 'password' ) globalParam.editTmpDbParam[v] = '******';
            $('.source [data-key="'+v+'"]').val(globalParam.editTmpDbParam[v]).prop('disabled', true);
        });
    }
    if(globalParam.editJobModel.toType == 8) { // hdfs
        globalParam.targetType = globalParam.commonLinkType.hdfs;
    } else if(globalParam.editJobModel.toType == 9) { // hive
        $('.typeCon #targetType').val(globalParam.commonLinkType.hive).trigger('change', globalParam.editJobModel.toId);
        globalParam.targetType = globalParam.commonLinkType.hive;
    } else if(globalParam.editJobModel.toType == 13) { // spark
        $('.typeCon #targetType').val(globalParam.commonLinkType.spark).trigger('change', globalParam.editJobModel.toId);
        globalParam.targetType = globalParam.commonLinkType.spark;
    }
    else { // db
        globalParam.editJobModel.toObject && (globalParam.targetType = globalParam.editJobModel.toObject.dbType);
        $('.typeCon #targetType').val(globalParam.targetType).trigger('change', globalParam.editJobModel.toId);
    }
    $('#userApp, .item1 .connType, .item1 .linkList, .item1 #targetType, .item1 .connId').prop('disabled', true);
}());

// 连接url 进入下一步  第一步到第二步
$('.url-info').on('click', '.connect', function() {
    var jobName = ($('.item1 .taskName').val() || '').trim(),
        note = ($('.item1 .taskDes').val() || '').trim();
    if(!jobName) {
        MsgTip('', common_js_lang['local.info.taskNameNone'], 'info');
        return;
    }
    var pid = $('#userApp').val() || 0 ;
    if ( !pid ){
        MsgTip('', common_js_lang['dbManage.title.setApp'], 'info');
        return ;
    }

    var connId = $('.typeCon .connId').val(),
        type = $('.typeCon #targetType').val() ;
    if(connId <= 0) {
        MsgTip('', common_js_lang['db.info.tarConn'], 'info');
        return false;
    }
    var typeChange = type != globalParam.targetType,
        destConnChange = connId != globalParam.connId,
        appIdChange = pid != globalParam.tmpAppId ;

    var fromType = $('.source .connType').val();
    if ( fromType == 1 ){
        if( !$('.source .linkList').val() ) {
            MsgTip('', common_js_lang['db.info.sourceLink'], 'info');
            return false;
        }
        var linkObj = JSON.parse($('.source .linkList').find('option:selected').attr('data-val'));
        var sourceChange = linkObj.id != globalParam.sourceId ;
    }
    else {
        var param = {}, sourceChange = false ;

        ['connName', 'url', 'host', 'port', 'dbName', 'userName', 'password', 'dbType'].map(function(v){
            param[v] = ($('.source [data-key="'+v+'"]').val() || '').trim() ;
            globalParam.tmpDbParam[v] == param[v] ? '' : sourceChange = true ;
        });
        var res = checkDbInfo(param);
        if ( !res.res ){
            MsgTip('', common_js_lang['db.info.completeParam'], 'info');
            return false;
        }
        param['pid']  = $('#userApp').val() ;

        // param.connName = 'TMP_'+param.host+'_'+param.port+'_'+param.dbName;
        // $('.source [data-key="connName"]').val(param.connName);
        globalParam.tmpDbParam['pid'] == param['pid'] ? '' : sourceChange = true ;
        $.extend(globalParam.tmpDbParam, param) ;
    }

    $('#globalLoadCon').css({display:'block'});
    $('.global-ConfigCon .hdfsTab').addClass('hidden');
    $('.global-ConfigCon .dbTab').removeClass('hidden');
    $('.global-batch .hdfsTab').addClass('hidden');
    $('.global-batch .dbTab').removeClass('hidden');

    if ( type == globalParam.commonLinkType.hdfs ) {
        $('.global-ConfigCon .dbTab').addClass('hidden');
        $('.global-ConfigCon .hdfsTab').removeClass('hidden');
        $('.global-batch .dbTab').addClass('hidden');
        $('.global-batch .hdfsTab').removeClass('hidden');
    }

    var clearFunc = function(srcTag, tarTag){
        if ( globalParam.jobId > 0 || !srcTag && !tarTag )  return ;

        if ( srcTag ) {
            globalParam.searchParam.isSearch = false;
            $('.leftSide .keyword').val('');
            $('.leftSide .clear').css({display: 'none'});
        }

        $('.rightSide.targetPath h4 b').html('(0)');
        var mtype = $('.mtype .radio.cur').attr('data-val');
        if ( mtype < 3 ){
            $('.rightSide .target-item').html('<tr class="noDataTr"><td colspan="4" class="tableNoData"><img src="resources/dist/images/noData.png">' + common_js_lang['manage.title.noData'] + '</td></tr>');
        }
        else if ( globalParam.targetType != globalParam.commonLinkType.hdfs ) {
            SQLEditor.setValue('');
            $('.rightSide.sqlQuery .preshow').hide();
            $('.config.sqlQuery #dbName').val('').select2();
            $('.config.sqlQuery #tableName').val('').select2({tags: true});
            $('.config.sqlQuery #partitions').empty().parent().hide();
            SQLeditor.doc.setValue('');
        }
        else {
            SQLEditor.setValue('');
            $('.rightSide.sqlQuery .preshow').hide();
            $('.config.sqlQuery .selectedDir').val('');
            $('.config.sqlQuery .fileName').val('');
        }
    };

    var sourceDefer = $.Deferred(),
        destDefer = $.Deferred() ;
    if ( typeChange || destConnChange || appIdChange ){
        if ( type != globalParam.commonLinkType.hdfs ){
            $('.config.sqlQuery .tableType').val(type == globalParam.commonLinkType.spark ? 1 : 0).prop('disabled', true);
            SQLeditor.doc.setValue('');
            editor.doc.cm.setOption('readOnly', true);

            if ( globalParam.dbList['db_'+connId] ){
                infoHandle( globalParam.dbList['db_'+connId] );
                destDefer.resolve(true);
            }
            else {
                $.ajax({
                    url: 'db/dbs?id=' + connId + '&pid=' + $('#userApp').val(),
                    success: function (data) {
                        if (data.code != 200) {
                            destDefer.reject();
                            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                            return false;
                        }
                        globalParam.dbList['db_' + connId] = data.model;
                        infoHandle(globalParam.dbList['db_' + connId]);
                        destDefer.resolve(true);
                    },
                    error: function () {
                        destDefer.reject();
                    }
                });
            }
            function infoHandle(dbListModel){
                var dbList = '<option value="" disabled>'+common_js_lang['local.option.getDb']+'</option>';
                dbListModel.databases.map(function(v) {
                    dbList += '<option data-catalog="' + (v.catalog || '') + '" data-schema="' + (v.schema || '') + '">' + v.name + '</option>';
                });
                $(".global-ConfigCon #dbName, #batch-dbName, .item2 .config.sqlQuery #dbName").html(dbList).val('').removeClass('error').select2();
                var tableList = '<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option>';
                $('.item2 .config.sqlQuery #tableName').html(tableList).val('').select2({tags:true});
                if ( dbListModel.databases && dbListModel.databases.length <= 0 ){
                    MsgTip('info', common_js_lang['dump.info.dbNone']);
                }
                globalParam.targetType = type;
                globalParam.connId = connId ;
                globalParam.targetId = globalParam.connId;
                globalParam.tmpAppId = pid;
            }
        }
        else {
            var parentDom = $('.hdfsTab .dirDos > .ul');
            $.ajax({
                url: 'hdfs/dir/home',
                data: {hid: connId, pid:$('#userApp').val()},
                success: function(data) {
                    if ( data.code != 200 ){
                        destDefer.reject();
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return false;
                    }
                    data.model = [data.model];
                    var dirHtml = template('template/hdfsDir', {dir: data.model, len: 0});
                    parentDom.html(dirHtml);
                    globalParam.targetType = type;
                    globalParam.connId = connId ;
                    globalParam.targetId = globalParam.connId;
                    globalParam.tmpAppId = pid;
                    destDefer.resolve(true);
                },
                error: function(){
                    destDefer.reject();
                }
            });
        }
    }
    else {
        destDefer.resolve();
    }
    source();
    function source(){
        if ( sourceChange || !globalParam.sourceId ){
            var sourceId = 0 ;
            if ( fromType != 1 ){
                function tmpFunc(){
                    var tmpDefer = $.Deferred();
                    if ( globalParam.jobId > 0 ){
                        sourceId = globalParam.editJobModel.fromId;
                        tmpDefer.resolve();
                        return tmpDefer.promise() ;
                    }
                    $.ajax({
                        url: 'db/tmp/save',
                        contentType: 'application/x-www-form-urlencoded',
                        type: 'post',
                        data: param,
                        success: function(data){
                            if ( data.code != 200 ){
                                tmpDefer.reject();
                                ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                                return ;
                            }
                            sourceId = data.model.id ;
                            globalParam.sourceId = sourceId;
                            tmpDefer.resolve();
                        },
                        error: function(){
                            tmpDefer.reject();
                        }
                    });
                    return tmpDefer.promise() ;
                }
                $.when( tmpFunc() ).done(function(){
                    getSourceData();
                }).fail(function(){
                    sourceDefer.reject();
                });
            }
            else {
                sourceId = linkObj.id ;
                getSourceData();
            }
            function getSourceData(){
                if ( globalParam.dbList['db_'+sourceId] ){
                    globalParam.sourceId = sourceId;
                    var dbHtml = template('template/sourceDb', globalParam.dbList['db_'+sourceId]);
                    $('.item2 .leftSide .tblList > .ul').html(dbHtml);
                    sourceDefer.resolve(true);
                    return ;
                }

                $.ajax({
                    url: 'db/dbs?id=' + sourceId +'&pid='+$('#userApp').val(),
                    success: function(data) {
                        if ( data.code != 200 ){
                            globalParam.sourceId = 0;
                            sourceDefer.reject();
                            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                            return ;
                        }
                        globalParam.dbList['db_'+sourceId] = data.model;
                        globalParam.sourceId = sourceId;
                        var dbHtml = template('template/sourceDb', globalParam.dbList['db_'+sourceId]);
                        $('.item2 .leftSide .tblList > .ul').html(dbHtml);
                        sourceDefer.resolve(true);
                    },
                    error: function(){
                        sourceDefer.reject();
                    }
                });
            }
        }
        else {
            sourceDefer.resolve();
        }
    }

    $.when(sourceDefer, destDefer).done(function(srcTag, tarTag){
        clearFunc(srcTag, tarTag);

        $('.leftSide .allSelected').removeClass('cur');

        var mtype = $('.mtype .radio.cur').attr('data-val');
        if ( mtype < 3 ) {
            $('.item2 .sqlQuery').hide();
            $('.item2 .transfer, .item2 .targetPath').show();
            $('.rightSide thead').html(template('template/thead', {isDb: type != globalParam.commonLinkType.hdfs, type: mtype}));
        }
        else {
            $('.item2 .transfer, .item2 .targetPath').hide();
            $('.item2 .sqlQuery').show();
            $('.item2 .config.sqlQuery .tab').hide();
            globalParam.targetType != globalParam.commonLinkType.hdfs ? $('.item2 .config.sqlQuery .tab.hive').show() : $('.item2 .config.sqlQuery .tab.hdfs').show();
        }
        globalParam.targetType > globalParam.commonLinkType.spark ? $('.hive .formatLine').hide() : $('.hive .tableType').show();

        $('.stepCon').animate({'margin-left': '-100%'}, 250, function(){
            $('.stepCon .item.item1, .stepCon .item.item3').height('200');
            $('.stepCon .item.item2').height('auto');
        });
        $('.processCon .itemCon').removeClass('cur').eq(1).addClass('cur');
        $('html, body').animate({scrollTop:0},200);
        initAct();
    }).always(function(){
        $('#globalLoadCon').css({display:'none'});
    });
});

///////////
// 视图/库表切换 自定义SQL
$('.item2.item').on('click', '.mtype label', function(){
    if ( $(this).find('.radio').hasClass('cur') )
        return ;
    var self = $(this),
        mtype = $('.mtype .radio.cur').attr('data-val'),
        curType = $(this).find('.radio').attr('data-val'),
        type = curType == 1 ? 1 : 2 ;

    var toggleHandle = function(){
        self.parent().find('.radio').removeClass('cur');
        self.find('.radio').addClass('cur');

        $('.leftSide .tbl, .leftSide .view').hide();
        $('.leftSide .keyword').val('');
        $('.leftSide .clear').css({display: 'none'});
        globalParam.searchParam.keyword = '';
        $('.leftSide .check.cur').removeClass('cur');
        $('.leftSide li.cur').removeClass('cur');
        (type == 1 ? $('.tblList .tbl') : $('.tblList .view')).map(function (i, v) {
            matchKeyword($(v));
        });
        $('.leftSide .tblList').scrollTop(0);
        $('.leftSide .tblList .db-item').map(function(i,v){
            noDataShow( $(v), curType );
        });


        if ( curType != 3 ) {
            $('.item2 .sqlQuery').hide();
            $('.item2 .transfer, .item2 .targetPath').show();
            $('.leftSide').removeClass('mtype3');

            $('.rightSide thead').html(template('template/thead', {type: type, isDb: globalParam.targetType != globalParam.commonLinkType.hdfs}));
            $('.rightSide .target-item').empty();
            $('.rightSide.targetPath h4 b').html('(0)');
            $('.rightSide .target-item').append('<tr class="noDataTr"><td colspan="4" class="tableNoData"><img src="resources/dist/images/noData.png">' + common_js_lang['manage.title.noData'] + '</td></tr>');
        }
        else {
            $('.item2 .transfer, .item2 .targetPath').hide();
            $('.leftSide').addClass('mtype3');
            $('.item2 .config.sqlQuery .tab').hide();
            globalParam.targetType != globalParam.commonLinkType.hdfs ? $('.item2 .config.sqlQuery .tab.hive').show() : $('.item2 .config.sqlQuery .tab.hdfs').show();
            $('.item2 .sqlQuery').show();
        }
    } ;

    if ( mtype != 3 && $('.rightSide .target-item .config').length <= 0 || mtype == 3 && !SQLEditor.getValue().trim() ){
        toggleHandle();
    }
    else {
        swal({
            title: "",
            text: common_js_lang['db.option.mtype'],
            type: "info",
            showCancelButton: true
        }, function () {
            toggleHandle();
        });
    }
    return ;
});

function noDataShow(dom, mtype){
    var noTip = dom.find('.noData');

    if ( mtype != 3 && noTip.length > 0 ){
        noTip.show();
    }
    if ( mtype == 3 ){
        if ( noTip.length == 1 ){
            noTip.hide();
        }
        else if ( noTip.length == 2 ){
            noTip.eq(1).hide();
        }
    }
}

//取库表
$('.leftSide').on('click', '.tblList .getTbl', function() {
    var li = $(this).parent(),
        schema = li.data("schema") || '',
        catalog = li.data('catalog') || '';
    var type = $('.mtype .radio.cur').attr('data-val');

    if( $(this).hasClass('got') ) {
        var tbl = type == 3 ? li.find('.tbl, .view') : type != 2 ? li.find('.tbl') : li.find('.view');
        if(tbl.css('display') == 'none') {
            tbl.slideDown();
            $(this).html('-');
        } else {
            tbl.slideUp();
            $(this).html('+');
        }
        return;
    }
    var param = {
        dbId: globalParam.sourceId
    };
    schema && (param['schema'] = schema);
    catalog && (param['catalog'] = catalog);
    var isChecked = $(this).siblings('.dbSelected').hasClass('cur');
    $.fn.ajaxAPI({
        url: 'db/table/tbls',
        data: param,
        callback: function(data) {
            li.find('.getTbl').addClass('got').html('-');
            var tblArr = [], viewArr = [] ;
            data.model.map(function(v){
                if ( v.type === 'TABLE' ){
                    tblArr.push(v);
                    return ;
                }
                viewArr.push(v);
                return ;
            });
            var type = $('.mtype .radio.cur').attr('data-val');
            var tbl = template('template/sourceTbl', {
                model: tblArr,
                isChecked: isChecked
            });
            li.find('.tbl').html(tbl);
            var view = template('template/sourceView', {
                model: viewArr,
                isChecked: isChecked
            });
            li.find('.view').html(view);
            if ( type == 3 ){
                noDataShow( li, 3 );
                li.find('.tbl, .view').slideDown();
                return ;
            }
            type != 2 ? li.find('.tbl').slideDown() : li.find('.view').slideDown() ;
        }
    });
});

/// 左侧 radio
//库选择
$('.leftSide').on('click', '.dbSelected', function() {
    var mtype = $('.mtype .radio.cur').attr('data-val');
    if ( mtype == 3 )
        return false;

    $(this).toggleClass('cur');
    var type = $('.mtype .radio.cur').attr('data-val');
    var isGot = $(this).siblings('.getTbl').hasClass('got');
    var tbls = type != 2 ? $(this).siblings('.tbl') : $(this).siblings('.view');
    var isCheck = $(this).hasClass("cur");
    if(isGot) {
        tbls.find('li:not(".hidden, .noData")').toggleClass('cur', isCheck);
        tbls.find('li:not(".hidden, .noData") .check').toggleClass('cur', isCheck);
        if (tbls.css('display') == 'none') {
            tbls.slideDown();
            $(this).siblings('.getTbl').html('-');
        }
    } else {
        $(this).siblings('.getTbl').click();
    }

    var count = $('.tblList li:not(".hidden") .dbSelected').length;
    var isAll = count == $('.tblList li:not(".hidden") .dbSelected.cur').length;
    $('.leftSide .allSelected').toggleClass('cur', isAll);
    return false;
});
$('.leftSide').on('click', '.db-item > p', function() {
    $(this).siblings('.check').click();
});

//表选择
$('.leftSide').on('click', '.tblSelected', function(e, ctrlKey) {
    var type = $('.mtype .radio.cur').attr('data-val');
    if ( type == 3 ){
        var liDom = $(this).parents('.db-item'),
            dbName = liDom.attr('data-dbname'),
            tblName = $(this).siblings('p').attr('title') ;
        var sql = 'select * from `'+dbName+'`.`'+tblName+'`';
        SQLEditor.setValue(sql);
        return false;
    }

    if ( e.ctrlKey || ctrlKey ){
        if ( !globalParam.batchTblMode ) {
            globalParam.batchTblMode = true;
            $(this).attr('data-batch', 1);
            return false;
        }

        var startTbl = $('.leftSide .tblSelected[data-batch="1"]');
        if ( startTbl.parents('.db-item').attr('data-dbname') !== $(this).parents('.db-item').attr('data-dbname') ){
            globalParam.batchTblMode = false;
            $('.leftSide .tblSelected[data-batch="1"]').attr('data-batch', 0);
            return false;
        }

        var index1 = +startTbl.siblings('b').text(),
            index2 = +$(this).siblings('b').text(),
            tbls = type != 2 ? $(this).parents('.tbl').find('li') : $(this).parents('.view').find('li'),
            start = index1 > index2 ? index2 : index1,
            end = index1 > index2 ? index1 : index2 ;
        for ( var i=start; i<=end; i++ ){
            if ( tbls.eq(i-1).hasClass('hidden') )
                continue ;
            tbls.eq(i-1).addClass('cur');
            tbls.eq(i-1).find('.check').addClass('cur');
        }

        globalParam.batchTblMode = false;
        $('.leftSide .tblSelected[data-batch="1"]').attr('data-batch', 0);

        var tbls = type != 2 ? $(this).parents('.tbl') : $(this).parents('.view') ;
        var count = tbls.find('li:not(".hidden")').length;
        if(tbls.find('.check.cur').length == count) {
            tbls.siblings('.dbSelected').addClass('cur');
        } else {
            tbls.siblings('.dbSelected').removeClass('cur');
        }

        var count = $('.tblList li:not(".hidden") .dbSelected').length;
        var isAll = count == $('.tblList li:not(".hidden") .dbSelected.cur').length;
        $('.leftSide .allSelected').toggleClass('cur', isAll);
        return false;
    }

    globalParam.batchTblMode = false;
    $('.leftSide .tblSelected[data-batch="1"]').attr('data-batch', 0);

    $(this).toggleClass('cur');
    var hasCur = $(this).hasClass('cur');
    $(this).parent().toggleClass('cur', hasCur);
    var tbls = type != 2 ? $(this).parents('.tbl') : $(this).parents('.view'),
        count = tbls.find('li:not(".hidden")').length;

    if(tbls.find('.check.cur').length == count) {
        tbls.siblings('.dbSelected').addClass('cur');
    } else {
        tbls.siblings('.dbSelected').removeClass('cur');
    }

    var count = $('.tblList li:not(".hidden") .dbSelected').length;
    var isAll = count == $('.tblList li:not(".hidden") .dbSelected.cur').length;
    $('.leftSide .allSelected').toggleClass('cur', isAll);
    return false;
});

$('.leftSide').on('click', '.tbl li, .view li', function(e) {
    $(this).find('.check').trigger('click', e.ctrlKey);
});

// 全选
$('.leftSide').on('click', '.allSelected', function() {
    $(this).toggleClass('cur');
    var isCheck = $(this).hasClass('cur');
    $('.tblList li:not(".hidden") .dbSelected').toggleClass('cur', !isCheck);
    if ( $('.tblList li:not(".hidden") .getTbl:not(".got")').length <= 10 )
        $('.tblList li:not(".hidden") .dbSelected').click();
    else {
        $.fn.ajaxAPI({
            url: 'db/search?pid='+$('#userApp').val()+'&keyword=&mtype=1&dbId='+globalParam.sourceId,
            callback: function(data){
                var tbls = $('.tblList li:not(".hidden") .getTbl:not(".got")');
                data.model.databases.map(function(v, i){
                    if ( !tbls.eq(i).hasClass('got') ){
                        tbls.eq(i).addClass('got');

                        var tblArr = [], viewArr = [] ;
                        v.tables.map(function(vv){
                            if ( vv.type === 'TABLE' ){
                                tblArr.push(vv);
                                return ;
                            }
                            viewArr.push(vv);
                            return ;
                        });
                        var tbl = template('template/sourceTbl', {
                            model: tblArr,
                            isChecked: false
                        });
                        tbls.eq(i).siblings('.tbl').css({display:'none'}).html(tbl);
                        var view = template('template/sourceView', {
                            model: viewArr,
                            isChecked: false
                        });
                        tbls.eq(i).siblings('.view').css({display:'none'}).html(view);
                    }
                });
                $('.tblList li:not(".hidden") .dbSelected').click();
            }
        });
    }
    return false;
});

/// radio end

// 编辑
;
(function() {
    if(globalParam.jobId <= 0) return;
    if ( jobOtherParams.srcType > 1 ) {  // 迁移类型
        $('.mtype .radio').removeClass('cur').eq(+jobOtherParams.srcType-1).addClass('cur');
    }

    if ( jobOtherParams.srcType == 3 ){
        return ;
    }

    $('.rightSide .target-item').empty();
    var len = jobOtherParams.fromList.length,
        target = globalParam.editJobModel.toType == 8 ? jobOtherParams.toHdfsList : [9,13].indexOf(+globalParam.editJobModel.toType) > -1 ? jobOtherParams.toHiveList : jobOtherParams.toDbList;
    for(var i = 0; i < len; i++) {
        var dbName = jobOtherParams.fromList[i].name,
            catalog = jobOtherParams.fromList[i].catalog,
            schema = jobOtherParams.fromList[i].schema,
            whereSql = jobOtherParams.fromList[i].whereSql;

        if ( target[i].partition ){
            var partArr = target[i].partition.split(','),
                partObj = {} ;
            partArr.map(function(v){
                var tmpArr = v.split('=');
                partObj[tmpArr[0]] = tmpArr[1].replace(/^\'|\'$/g, '') ;
            });
            target[i].partition = JSON.stringify(partObj) ;
        }

        try {
            var synchParam = JSON.parse(jobOtherParams.fromList[i].synchColumnMap);
        } catch(e){
            var synchParam = {};
        }

        var count = 1,
            tbls = [{
                tbl: jobOtherParams.fromList[i].tableName,
                target: target[i],
                param: JSON.stringify(target[i]),
                filter: JSON.stringify({
                    whereSql: whereSql || '',
                    tarColumn: synchParam.tagSynchColumn ? synchParam.tagSynchColumn : '',
                    srcColumn: synchParam.srcSynchColumn ? synchParam.srcSynchColumn : '',
                    dataTbl: JSON.stringify({catalog:target[i].catalog || '', schema:target[i].schema || '', tableName: target[i].tableName, dbId:globalParam.toId})
                })
            }];
        for(var j = i + 1; j < len; j++) {
            if(jobOtherParams.fromList[j].name == dbName) {
                count++;
                if ( target[j].partition ){
                    var partArr = target[j].partition.split(','),
                        partObj = {} ;
                    partArr.map(function(v){
                        var tmpArr = v.split('=');
                        partObj[tmpArr[0]] = tmpArr[1].replace(/^\'|\'$/g, '') ;
                    });
                    target[j].partition = JSON.stringify(partObj) ;
                }

                try {
                    var synchParam = JSON.parse(jobOtherParams.fromList[j].synchColumnMap);
                } catch(e){
                    var synchParam = {};
                }

                tbls.push({
                    tbl: jobOtherParams.fromList[j].tableName,
                    target: target[j],
                    param: JSON.stringify(target[j]),
                    filter: JSON.stringify({
                        whereSql: jobOtherParams.fromList[j].whereSql || '',
                        tarColumn: synchParam.tagSynchColumn ? synchParam.tagSynchColumn : '',
                        srcColumn: synchParam.srcSynchColumn ? synchParam.srcSynchColumn : '',
                        dataTbl: JSON.stringify({catalog:target[j].catalog || '', schema:target[j].schema || '', tableName: target[j].tableName, dbId:globalParam.toId})
                    })
                });
            } else {
                break;
            }
        }
        i = j - 1;

        var data = {
            catalog: catalog,
            schema: schema,
            dbName: dbName,
            count: count,
            tbls: tbls,
            isDb: 0
        };
        if(globalParam.editJobModel.toType != 8) {
            data.isDb = 1;
            data.srcType = jobOtherParams.srcType;
        }
        $('.rightSide .target-item').append(template('template/targetTbl', data));
    }
    $('.rightSide h4 b').html('('+target.length+')');
}());

// 搜索 db tbl
$('.leftSide').on('input', '.keyword', srcSearch);
// 搜索操作
function srcSearch(){
    var keyword = ($('.leftSide .keyword').val() || '').trim() || '';
    if ( keyword === '' ){
        $('.leftSide .clear').css({display:'none'});
    }
    else {
        $('.leftSide .clear').css({display:'block'});
    }

    globalParam.batchTblMode = false;
    $('.leftSide .tblSelected[data-batch="1"]').attr('data-batch', 0);

    clearInterval(globalParam.searchParam.searchInterval);
    globalParam.searchParam.searchInterval = setTimeout(function(){
        globalParam.searchParam.keyword = keyword;
        globalParam.searchParam.checkedDbNum = 0;
        globalParam.searchParam.tarNum = 0;
        $('.leftSide .check.cur').removeClass('cur');
        $('.leftSide li.cur').removeClass('cur');

        // 取出全部db的信息
        var type = $('.mtype .radio.cur').attr('data-val');
        if ( $('.tblList .getTbl:not(".got")').length <= 10 ) {
            var tbls = $('.tblList .getTbl');
            for (var i = 0, len = tbls.length; i < len; i++) {
                if (tbls.eq(i).hasClass('got')) {
                    matchKeyword(type == 3 ? tbls.eq(i).siblings('.tbl, .view') : type == 1 ? tbls.eq(i).siblings('.tbl') : tbls.eq(i).siblings('.view'));
                } else {
                    queryAndMatch(tbls.eq(i));
                }
            }
        }
        else {
            if ( globalParam.searchParam.isSearch )
                return ;
            globalParam.searchParam.isSearch = true;
            $.fn.ajaxAPI({
                url: 'db/search?pid='+$('#userApp').val()+'&keyword=&mtype=1&dbId='+globalParam.sourceId,
                callback: function(data){
                    var tbls = $('.tblList .getTbl');
                    data.model.databases.map(function(v, i){
                        if ( !tbls.eq(i).hasClass('got') ){
                            tbls.eq(i).addClass('got');

                            var tblArr = [], viewArr = [] ;
                            v.tables.map(function(vv){
                                if ( vv.type === 'TABLE' ){
                                    tblArr.push(vv);
                                    return ;
                                }
                                viewArr.push(vv);
                                return ;
                            });
                            var tbl = template('template/sourceTbl', {
                                model: tblArr,
                                isChecked: false
                            });
                            tbls.eq(i).siblings('.tbl').html(tbl);
                            var view = template('template/sourceView', {
                                model: viewArr,
                                isChecked: false
                            });
                            tbls.eq(i).siblings('.view').html(view);
                        }
                        matchKeyword( type == 3 ? tbls.eq(i).siblings('.tbl, .view') : type == 1 ? tbls.eq(i).siblings('.tbl') : tbls.eq(i).siblings('.view') );
                    });
                }
            });
        }
    }, 300);
}
$('.leftSide').on('click', '.clear', function(){
    $('.leftSide .keyword').val('');
    srcSearch();
});

$('.leftSide').on('keyup', '.keyword', function(e) {
    if (e.which == 13 ) {
        srcSearch();
        return;
    }
});
// 点击搜索图标
$('.leftSide').on('click', '.query', srcSearch);

//查询并匹配
function queryAndMatch(getTbl) {
    var li = getTbl.parent(),
        schema = li.data("schema") || '',
        catalog = li.data('catalog') || '';

    var param = {
        dbId: globalParam.sourceId
    };
    schema && (param['schema'] = schema);
    catalog && (param['catalog'] = catalog);
    var isChecked = false;
    $.fn.ajaxAPI({
        url: 'db/table/tbls',
        data: param,
        callback: function(data) {
            getTbl.addClass('got').html('-');
            var tblArr = [], viewArr = [] ;
            data.model.map(function(v){
                if ( v.type === 'TABLE' ){
                    tblArr.push(v);
                    return ;
                }
                viewArr.push(v);
                return ;
            });
            var type = $('.mtype .radio.cur').attr('data-val');
            var tbl = template('template/sourceTbl', {
                model: tblArr,
                isChecked: false
            });
            li.find('.tbl').html(tbl);
            var view = template('template/sourceView', {
                model: viewArr,
                isChecked: false
            });
            li.find('.view').html(view);
            matchKeyword(type == 3 ? li.find('.tbl, .view') : type != 2 ? li.find('.tbl') : li.find('.view'));
        }
    });
}
// 匹配关键字及展开隐藏
function matchKeyword(tblDom) {
    var tblNames = tblDom.find('p');
    var countTag = 0;
    var reg = RegExp('('+globalParam.searchParam.keyword+')', "ig");

    if ( globalParam.searchParam.keyword === '' ){
        tblDom.slideUp().siblings('.getTbl').html('+');
        var dbName = tblDom.parent().removeClass('hidden').find('> p');
        dbName.html( dbName.text() );
        tblDom.find('li').removeClass('hidden');
        tblNames.map(function(i,v){
            $(v).html( $(v).text() );
        });
        $('.leftSide .tblList > .noData').addClass('hidden');
        return ;
    }

    var dbMatch = false;
    if ( reg.test(tblDom.parent().attr('data-dbname')) ){
        tblDom.siblings('p').html( tblDom.parent().attr('data-dbname').replace(reg, '<span class="red">$1</span>') );
        tblDom.find('li').removeClass('hidden');
        dbMatch = true;
    }
    else {
        tblDom.siblings('p').html( tblDom.parent().attr('data-dbname') );
    }

    for(var i = 0, len = tblNames.length; i < len; i++) {
        if ( dbMatch ){
            tblNames.eq(i).html(tblNames.eq(i).text().replace(reg, '<span class="red">$1</span>'));
            continue ;
        }
        if( reg.test(tblNames.eq(i).text()) ) {
            tblNames.eq(i).parent().removeClass('hidden');
            tblNames.eq(i).html(tblNames.eq(i).text().replace(reg, '<span class="red">$1</span>'));
            countTag++;
        } else {
            tblNames.eq(i).parent().addClass('hidden');
        }
    }

    if(countTag == 0 && !dbMatch ) {
        tblDom.parent().addClass('hidden');
    } else {
        // 展开父元素
        tblDom.slideDown().siblings('.getTbl').html('-');
        tblDom.parent().removeClass('hidden');
        globalParam.searchParam.tarNum ++ ;
    }

    if ( globalParam.searchParam.tarNum ){
        $('.leftSide .tblList > .noData').addClass('hidden');
    }
    globalParam.searchParam.checkedDbNum ++ ;
    if ( globalParam.searchParam.checkedDbNum == $('.tblList .getTbl').length && !globalParam.searchParam.tarNum ){
        // 没搜索到数据
        $('.leftSide .tblList > .noData').removeClass('hidden');
    }
}

// 右移表
$('.transfer').on('click', '.move-right', function() {
    var type = $('.mtype').find('.radio.cur').attr('data-val'),
        tarType = type == 1 ? 'tbl' : 'view' ;
    if ( $('.leftSide .tblList li:not(".hidden") .'+tarType+' .tblSelected.cur').length <= 0 )
        return ;
    var dbs = $('.leftSide .tblList .db-item:not(".hidden")'); //库
    var rightSide = $('.rightSide .target-item');
    rightSide.parent().find('.check').removeClass('cur');

    for(var i = 0, len = dbs.length; i < len; i++) {
        var curDb = dbs.eq(i),
            tbls = curDb.find('.'+tarType+' li:not(".hidden") .tblSelected.cur'), //选中的表
            count = tbls.length;

        if(count == 0)
            continue;
        var catalog = curDb.data('catalog'),
            schema = curDb.data('schema'),
            dbName = curDb.data('dbname');

        var data = {
            catalog: catalog,
            schema: schema,
            dbName: dbName,
            count: count,
            tbls: []
        };
        var rightDb = rightSide.find('.target-path[data-name="'+dbName+'"]');
        if ( rightDb.length > 0 ){  // 右侧已存在库
            var newCount = 0;
            for(var j = 0; j < count; j++) {
                var tblName = tbls.eq(j).siblings('p').text();
                var rightTbl = rightSide.find('[data-name="'+dbName+'"][data-tbl="'+tblName+'"]');
                if ( rightTbl.length == 0 ){
                    var tempObj = {};
                    tempObj['tbl'] = tblName;
                    tempObj['param'] = globalParam.targetType != globalParam.commonLinkType.hdfs ? JSON.stringify({
                        tableName: tempObj['tbl']
                    }) : JSON.stringify({
                        fileName: tempObj['tbl'] + '.txt',
                        tarName: tempObj['tbl'] + '.txt'
                    });
                    data['tbls'].push(tempObj);
                    newCount ++ ;
                }
            }
            data['isDb'] = globalParam.targetType != globalParam.commonLinkType.hdfs;
            data.isDb && (data.srcType = $('.mtype .radio.cur').attr('data-val'));
            var newTblDom = $(template('template/targetTbl', data)).siblings('tr:not(".target-path")');
            rightSide.find('[data-name="'+dbName+'"]').slice(-1).after(newTblDom);
            rightDb.find('b').html(+rightDb.find('b').html() + newCount);
            continue ;
        }

        for(var j = 0; j < count; j++) {
            var tempObj = {};
            tempObj['tbl'] = tbls.eq(j).siblings('p').text();
            tempObj['param'] = globalParam.targetType != globalParam.commonLinkType.hdfs ? JSON.stringify({
                tableName: tempObj['tbl']
            }) : JSON.stringify({
                fileName: tempObj['tbl'] + '.txt',
                tarName: tempObj['tbl'] + '.txt'
            });
            data['tbls'].push(tempObj);
        }
        data['isDb'] = globalParam.targetType != globalParam.commonLinkType.hdfs;
        data.isDb && (data.srcType = $('.mtype .radio.cur').attr('data-val'));
        $('.rightSide .target-item').append(template('template/targetTbl', data));
    }

    $('.leftSide .tbl li, .leftSide i.check.cur').removeClass('cur'); //去掉源的勾选
    $('.rightSide h4 b').html('('+$('.target-item .target-name').length+')');
    $('.rightSide .target-item tr:not(".noDataTr")').length > 0  && $('.rightSide .target-item .noDataTr').remove();
});
// 左移表
$('.transfer').on('click', '.move-left', function() {
    $('.rightSide .target-item .check.cur').parents('tr').remove();
    $('.rightSide .allSelected').removeClass('cur');
    var dbs = $('.rightSide .target-item .target-path');
    var allCount = 0;
    for(var i = 0, len = dbs.length; i < len; i++) {
        var dbName = dbs.eq(i).data('name'),
            count = $('.rightSide .target-item [data-name="' + dbName + '"]:not(".target-path")').length;
        dbs.eq(i).find('td b').html(count);
        allCount += count ;
    }
    $('.rightSide h4 b').html('('+allCount+')');
    $('.rightSide .target-item tr').length == 0 && $('.rightSide .target-item').append('<tr class="noDataTr"><td colspan="4" class="tableNoData"><img src="resources/dist/images/noData.png">'+common_js_lang['manage.title.noData']+'</td></tr>');
});

////// 批量设置
/// 批量设置弹出层
$('.rightSide').on('click', '.batch', function() {
    if($('.rightSide .target-item .target-tbl.cur').length <= 0) {
        MsgTip('', common_js_lang['db.info.tarEmpty'], 'info');
        return;
    }

    if (globalParam.targetType == globalParam.commonLinkType.hdfs) {
        $('.global-batch').removeClass('fixed');
        $('.global-batch .hdfsTab p .check').removeClass('cur');
        $('.global-batch .hdfsTab p .show').removeClass('in');
        $('.global-batch .hdfsTab .ul:not(:first-child)').css({display: 'none'});
        $('.global-batch .hdfsTab .selectedDir').val('').attr('title', '');

        $('.global-batch .hdfsTab').removeClass('hidden');
        $('.global-batch .dbTab').addClass('hidden');

        $('.global-batch .replace-tag .tip').removeClass('hidden');
    }
    else {
        $('.global-batch').addClass('fixed');
        $('.global-batch .hdfsTab').addClass('hidden');
        $('.global-batch .dbTab').removeClass('hidden');
        $('.global-batch #batch-dbName').val('').select2();

        $('.global-batch .replace-tag .tip').addClass('hidden');
    }
    // 初始化启用换行
    $('.global-batch .isReplace .checkbox').addClass('cur');
    $('.global-batch .replacementCon .val').text('1'+common_js_lang['db.text.space']).attr('data-val', ' ').prop('disabled', false);

    $('.global-mask, .global-batch').fadeIn();
});

$.fn.replaceComponent = function(){
    var self = $(this);
    $('body').on('click', '.replacementCon .val',function(){
        var replaceCon = $(this).parent();
        if ( replaceCon.hasClass('show') ){
            replaceCon.removeClass('show');
        }
        else{
            var val = $(this).attr('data-val') || '';
            var items = replaceCon.find('.item').removeClass('cur');
            var tag = false;
            for ( var i=0,len=items.length; i<len; i++ ){
                if ( items.eq(i).attr('data-val') == val ){
                    items.eq(i).addClass('cur');
                    tag = true;
                    break;
                }
            }
            !tag ? replaceCon.find('.inputReplacement').val(val) : replaceCon.find('.inputReplacement').val('');
            replaceCon.addClass('show');
        }
    });
    $('body').on('click', '.replacementCon .item', function(){
        var text = $(this).text(),
            val = $(this).attr('data-val') || '' ;

        replacementUpdateVal(text, val, $(this).parents('.replacementCon'));
        return false;
    });
    $('body').on('click', '.replacementCon button', function(){
        var input = $(this).siblings('.inputReplacement').val() || '';
        var text = input === ''? common_js_lang['db.info.emptyString'] : input.trim() === '' ? input.match(/\s/g).length+common_js_lang['db.text.space'] : input ;
        replacementUpdateVal(text, input, $(this).parents('.replacementCon'));
        return false;
    });
    $('body').on('keyup', '.replacementCon .inputReplacement', function(e){
        if ( e.which == 13 ){
            var input = e.target.value || '';
            var text = input === ''? common_js_lang['db.info.emptyString'] : input.trim() === '' ? input.match(/\s/g).length+common_js_lang['db.text.space'] : input ;
            replacementUpdateVal(text, input, $(this).parents('.replacementCon'));
            return false;
        }
    });
    function replacementUpdateVal(text, val, dom){
        dom.removeClass('show');
        dom.find('.val').text(text).attr('data-val', val);
    }

    $('body').on('click', function(e){
        if ( self.hasClass('show') ){
            if ( $(e.target).parents('.replacementCon').length != 1 && $(e.target).parent('.replacementCon').length != 1 && $(e.target) != self[0] ){
                self.removeClass('show');
            }
        }
    });
}
$('.replacementCon').replaceComponent();

// 启用换行符替换
$('.global-batch, .global-ConfigCon').on('click', '.isReplace .checkbox', function(){
    $(this).toggleClass('cur');
    $(this).parent().find('.val').prop('disabled', !$(this).hasClass('cur'));
    // $(this).parents('.replace-tag').find('.replacementCon').attr('data-disabled', +!$(this).hasClass('cur'));
});

// 必读说明 hover
var hoverInterval = 0;
$('.global-batch .dbTab strong, .new-sql strong').hover(function(){
    var self = $(this);
    hoverInterval = setTimeout(function(){
            self.find('.tip').css({display:'block'});},
        300);
}, function(){
    clearInterval(hoverInterval);
    $(this).find('.tip').css({display:'none'});
});

//批量配置
$('.global-batch').on('click', '.btn-item', function() {
    var replaceEnter = $('.global-batch .isReplace .checkbox').hasClass('cur'),
        replacement = $('.global-batch .replacementCon .val').attr('data-val');
    if(globalParam.targetType == globalParam.commonLinkType.hdfs) {
        var path = $('.global-batch .hdfsTab .selectedDir').val().trim();
        if(!path) {
            MsgTip('', common_js_lang['db.info.batchDir'], 'info');
            return;
        }
        $.fn.ajaxAPI({
            url: 'hdfs/dir/access',
            data:{hdfsId:globalParam.targetId, dir:path, pid:$('#userApp').val()},
            callback: function(data){
                var target = $('.rightSide .target-item .target-tbl.cur'),
                    len = target.length;
                for(var i = 0; i < len; i++) {
                    var defaultName = target.eq(i).parent().text() + '.txt';
                    defaultName = defaultName.slice(0, 60);
                    if ( defaultName.match(/\s+|\\+/g) ){
                        target.eq(i).parent().attr('data-param', JSON.stringify({replaceEnter:replaceEnter, replacement:replacement}));
                        target.eq(i).parent().siblings('.fileName').html('');
                        continue ;
                    }
                    target.eq(i).parent().attr('data-param', JSON.stringify({replaceEnter:replaceEnter,replacement:replacement,fileName:(path+'/'+defaultName).replace(/\/+/g, '\/'), hid: globalParam.targetId, tarDir: path, tarName: defaultName}));
                    target.eq(i).parent().siblings('.fileName').html( (path+'/'+defaultName).replace(/\/+/g, '\/') ).attr('title', (path+'/'+defaultName).replace(/\/+/g, '\/') );
                    target.eq(i).click();
                }
                $('.global-mask, .global-batch').fadeOut();
            }
        });

    }
    else {
        var batchOption = $('#batch-dbName option:selected'),
            batchName = batchOption.val() || '',
            schema = batchOption.data('schema') || '',
            catalog = batchOption.data('catalog') || '';

        if ( !batchName ) {
            MsgTip('info', common_js_lang['client.info.noDb']);
            return;
        }

        var target = $('.rightSide .target-item .target-tbl.cur'),
            tarLen = target.length,
            fromTablesJson = [],
            toTablesJson = [] ;
        for(var i = 0; i < tarLen; i++) {
            var tblName = target.eq(i).parent().text();
            if ( !tblName.match(/^[0-9A-Za-z]\w*$/g) ){
                target.eq(i).parent().attr('data-param', JSON.stringify({
                    name: batchName,
                    catalog: catalog,
                    schema: schema,
                    hid: globalParam.targetId,
                    replaceEnter:replaceEnter,
                    replacement:replacement
                }));
                target.eq(i).parent().siblings('.db').html(batchName);
                target.eq(i).parent().siblings('.tbl').html('');
                continue ;
            }
            else {
                var tr = target.eq(i).parents('tr') ;
                fromTablesJson.push({catalog:tr.attr('data-catalog') || '', schema:tr.attr('data-schema') || '', tableName:tblName, index:i}) ;
                toTablesJson.push({catalog:catalog, schema:schema, tableName:tblName, tableType:globalParam.targetType != globalParam.commonLinkType.spark ? 0:1});
            }
        }

        if ( fromTablesJson.length <= 0 ){
            $('.global-mask, .global-batch').fadeOut();
            $('#waitLoading').css({display:'none'});
            return ;
        }

        $('#waitLoading').find('article').html('<p>'+common_js_lang['loading.info.batchConf'].replace(/\[x\]/, fromTablesJson.length)+'</p><p class="detail"></p>').end().css({display:'block'});
        var errMsg = '',
            errDetail = '',
            errTitle = '',
            succCount = 0,
            failCount = 0 ;
        var init= 0, len=fromTablesJson.length;

        spliceConfig();
        function spliceConfig(){
            if ( init >= len ) {
                $('#waitLoading').css({display:'none'});
                if ( errMsg ) {
                    ErrTip(errTitle, errDetail, common_js_lang['loading.info.confInfo'].replace(/\[x\]/,succCount).replace(/\[y\]/, failCount) +'\n'+errMsg, 'info');
                    return;
                }
                MsgTip({text:common_js_lang['loading.info.allConf'], type:'success'});
                $('.global-batch, .global-mask').fadeOut();
                return;
            }
            var fromJson = JSON.stringify(fromTablesJson.slice(init, init+100)),
                amount = init + 100 <= len ? 100 : len-init,
                toJson = JSON.stringify(toTablesJson.slice(init, init+100)) ;
            $.ajax({
                url: 'db/table/ddl/batch',
                type: 'post',
                contentType: 'application/x-www-form-urlencoded',
                data: {
                    fromId: globalParam.sourceId,
                    toId: globalParam.targetId,
                    pid: $('#userApp').val(),
                    fromTablesJson: fromJson,
                    toTablesJson: toJson
                },
                success: function (data) {
                    if ( data.code != 200 ){
                        failCount += amount ;
                        errTitle ? '' : errTitle = data.i18nMsg.title;
                        errDetail ? '' : errDetail = data.i18nMsg.detail;
                        errMsg += data.msg+'.\n' ;
                    }
                    else {
                        var formatVal = {
                            text: '0',
                            orc: '1',
                            parquet: '2',
                            rcfile: '3',
                            sequencefile: '4'
                        } ;
                        data.model.map(function (v, i) {
                            var index = fromTablesJson[i + init].index;
                            if (v.code != 200) {
                                failCount++;
                                errTitle ? '' : errTitle = v.i18nMsg.title;
                                errDetail ? '' : errDetail = v.i18nMsg.detail;
                                errMsg += '[' + fromTablesJson[i + init].tableName + ']:' + v.msg + '.\n ';
                                return;
                            }
                            if ( v.model.mppTable && globalParam.targetType == globalParam.commonLinkType.hive ){
                                failCount ++ ;
                                errMsg += '[' + fromTablesJson[i + init].tableName + ']:' + common_js_lang['db.tip.hivexspark'] + '.\n ';
                                return ;
                            }
                            if ( !v.model.mppTable && globalParam.targetType == globalParam.commonLinkType.spark ){
                                failCount ++;
                                errMsg += '[' + fromTablesJson[i + init].tableName + ']:' + common_js_lang['db.tip.sparkxhive'] + '.\n ';
                                return ;
                            }

                            succCount ++ ;
                            var tableType = formatVal[v.model.format] || 0;
                            var dom = target.eq(index).parent();
                            dom.attr('data-param', JSON.stringify({
                                createSql: v.msg == 'new' ? v.model.ddl : '',
                                ddl: v.msg == 'show' ? v.model.ddl : '',
                                name: batchName,
                                tableName: fromTablesJson[i + init].tableName,
                                catalog: catalog,
                                schema: schema,
                                dbId: globalParam.targetId,
                                replaceEnter: replaceEnter,
                                replacement: replacement,
                                tableType: tableType
                            }));
                            dom.siblings('.db').html(batchName);
                            dom.find('.check').click();
                        });
                    }
                    $('#waitLoading').find('article .detail').html(common_js_lang['loading.info.confInfo'].replace(/\[x\]/,succCount).replace(/\[y\]/, failCount)) ;
                    init += 100 ;
                    spliceConfig();
                }
            });
        }
    }
});


$('.global-batch').on('click', '.btn-cancel, h4 .cancel', function() {
    $('.global-mask, .global-batch').fadeOut();
});
////////////// 批量设置 end

// 进入 path 配置
$('.rightSide').on('click', '.target-item .config', function() {
    $(this).addClass('active');
    var columnDefer = $.Deferred();
    var maskInterval = setTimeout(function(){ $('#globalLoadCon').css({display:'block'}); },200);
    getSourceColumns($(this), columnDefer);
    getType1Val();
    var targetNameDom = $(this).siblings('.target-name');
    var param = targetNameDom.attr('data-param') ? JSON.parse(targetNameDom.attr('data-param')) : {},
        filter = targetNameDom.attr('data-filter') ? JSON.parse(targetNameDom.attr('data-filter')) : {};
    $.when( columnDefer ).then(function(){
        window.clearInterval(maskInterval);
        $('#globalLoadCon').css({display:'none'});
        resetConfigCon(param, filter);
    }).fail(function(){
        $('#globalLoadCon').css({display:'none'});
    });
    $('.global-mask, .global-ConfigCon').fadeIn();
    editor.refresh();
});
/// 初始化 config 弹出层
function resetConfigCon(param, filter) {
    $('.global-ConfigCon .configCon .configTab a').eq(0).click();
    $('.global-ConfigCon .configCon .configTab a').eq(0).html([common_js_lang['local.option.getDir'], common_js_lang['db.title.scanSql']][+(globalParam.targetType != globalParam.commonLinkType.hdfs)]);
    $('.global-ConfigCon .synch .srcColumn').html(globalParam.columnsOption).select2();
    if(globalParam.targetType == globalParam.commonLinkType.hdfs) {
        hdfsConfig(param);
    } else if( [globalParam.commonLinkType.hive, globalParam.commonLinkType.spark].indexOf( globalParam.targetType ) > -1 ) {
        hiveConfig(param);
    } else {
        dbConfig(param);
    }
    filterModule.resetFilter(filter, param);
}

////  右侧 radio checked
//全选
$('.rightSide').on('click', '.allSelected', function() {
    $(this).toggleClass('cur');
    var isCheck = $(this).hasClass('cur');
    $('.rightSide .target-db, .rightSide .target-tbl').toggleClass('cur', isCheck);
});
// 库选择
$('.rightSide').on('click', '.target-db', function() {
    $(this).toggleClass('cur');
    var isCheck = $(this).hasClass('cur');
    var dbName = $(this).parents('.target-path').data('name');
    $('.rightSide [data-name="' + dbName + '"] .check').toggleClass('cur', isCheck);

    if($('.rightSide .target-db').length == $('.rightSide .target-db.cur').length) {
        $('.rightSide .allSelected').addClass('cur');
    } else {
        $('.rightSide .allSelected').removeClass('cur');
    }
});
// 表选择
$('.rightSide').on('click', '.target-tbl', function() {
    $(this).toggleClass('cur');
    var dbName = $(this).parents('tr').data('name');
    var dbCheck = $('.rightSide [data-name="' + dbName + '"] .target-tbl').length == $('.rightSide [data-name="' + dbName + '"] .target-tbl.cur').length;
    $('.rightSide [data-name="' + dbName + '"] .target-db').toggleClass('cur', dbCheck);

    var allCheck = $('.rightSide .target-tbl').length == $('.rightSide .target-tbl.cur').length;
    $('.rightSide .allSelected').toggleClass('cur', allCheck);
});
//////////////// radio end
///////////////////////////
// 保存配置信息
$('.global-ConfigCon').on('click', '.btn-item', function() {
    var param = saveParamSwitch();
    if(!param) {
        return false;
    }

    var mtype = $('.mtype .radio.cur').data('val');
    if ( mtype == 3 ){
        sqlEdiotrModule.sqlSaveHdfs(param);
        return ;
    }

    var filterParam = filterModule.saveFilterParam();
    if ( !filterParam ){
        return false;
    }
    if ( filterParam.srcColumn ){
        var dom = $('.global-ConfigCon #dbName option:selected'),
            catalog = dom.attr('data-catalog') || '',
            schema = dom.attr('data-schema') || '' ;
        if ( filterParam.dataTbl !== JSON.stringify({catalog:catalog, schema:schema, tableName:param.tableName}) ){
            MsgTip('', common_js_lang['db.info.synchColumn'], 'info');
            return false;
        }
    }
    var activeButton = $('.rightSide .target-item .config.active').removeClass('active');
    activeButton.siblings('.target-name')
        .attr('data-param', JSON.stringify(param))
        .attr('data-filter', JSON.stringify(filterParam));

    if(globalParam.targetType == globalParam.commonLinkType.hdfs) {
        activeButton.siblings('.fileName').html(param.fileName).attr('title', param.fileName);
    } else {
        activeButton.siblings('.db').html(param.name);
        activeButton.siblings('.tbl').html(param.tableName);
    }
    $('.global-mask, .global-ConfigCon').fadeOut();
});
// 取消按钮
$('.global-ConfigCon').on('click', '.btn-cancel, .cancel', function() {
    $('.global-mask, .global-ConfigCon').fadeOut();
    $('.rightSide .target-item .config.active').removeClass('active')
});

///////  hdfs 配置
function getDir(base, isHome) {
    base = base || '';
    var parentDom = base != ''? $('.dirDos [data-base="'+base+'"] > .ul') : $('.hdfsTab .dirDos > .ul');
    $.fn.ajaxAPI({
        url: isHome && 'hdfs/dir/home' || 'hdfs/dir/list',
        data: {base:base, hid: globalParam.connId, pid:$('#userApp').val()},
        loadTime: base == '' ? 0 : 2000,
        callback: function(data) {
            parentDom.parent().find('.show').addClass('in');
            parentDom.fadeIn();
            if ( !isHome && data.model.length == 0 ){
                parentDom.siblings('p').find('.show').addClass('out');
                return false;
            }
            isHome && (data.model = [data.model]);
            var len = base.length;
            var dirHtml = template('template/hdfsDir', {
                dir: data.model,
                len: base.length
            });
            parentDom.html(dirHtml);
        },
        complete: function(){
            parentDom.parent().find('.show').removeClass('got');
        }
    });
}

function hdfsConfig(param) {
    param.replaceEnter === undefined && (param.replaceEnter = true, param.replacement = ' ');
    $('.global-ConfigCon .hdfsTab .isReplace .checkbox').toggleClass('cur', param.replaceEnter);
    var text = param.replacement == ''? common_js_lang['db.info.emptyString']:param.replacement.trim() == '' ? param.replacement.match(/\s/g).length+common_js_lang['db.text.space'] : param.replacement ;
    $('.global-ConfigCon .hdfsTab .replacementCon .val').text(text).attr('data-val', param.replacement).prop('disabled', !param.replaceEnter);

    if ( param.tarName ){    //
        var curPath = param.tarDir || '',
            name = param.tarName || '';
    }
    else {        // 编辑任务的情况， 没有tarName参数
        var curPath = param.fileName || '',
            name = '';
        if(curPath) {
            var name = curPath.split('/').slice(-1).join('/');
            curPath = curPath.split('/').slice(0,-1).join('/') || curPath.match(/\//g) && '/';
        }
    }

    $('.global-ConfigCon .hdfsTab p .check').removeClass('cur');
    $('.global-ConfigCon .hdfsTab p .show').removeClass('in');

    $('.global-ConfigCon .hdfsTab .ul:not(:first-child)').css({display: 'none'});
    $('.global-ConfigCon .hdfsTab .selectedDir').val(curPath).attr('title', curPath);
    $('.global-ConfigCon .hdfsTab .fileName').val(name);

    if(curPath) {
        var target = $('.global-ConfigCon .hdfsTab [data-base="' + curPath + '"]');
        if(target.length == 1) {
            target.find('>p .check').addClass('cur');
            target.parents('.ul').fadeIn().siblings('p').find('.show').addClass('in');
        }
    }
}

// 双击进入下一层级或者收起
$('.hdfsTab').on('click', 'li p .show', function() {
    if ($(this).parent().siblings('ul').find('li').length == 0) {
        if ( $(this).hasClass('got') )
            return false;
        $(this).addClass('got');
        getDir($(this).parents('li').data('base'));
    } else {
        $(this).toggleClass('in');
        $(this).parent().siblings('ul').toggle();
    }
});

// 单击选中路径
$('.hdfsTab').on('click', 'li p .check', function() {
    if($(this).hasClass('cur'))
        return;
    $('.hdfsTab li p .check').removeClass('cur');
    $(this).addClass('cur');
    var base = $(this).parents('li').data('base');
    $('.hdfsTab .selectedDir').val(base).attr('title', base);
});

////////  hdfs 配置 end

/////////// 保存参数
function saveParamSwitch() {
    switch(globalParam.targetType) {
        case globalParam.commonLinkType.hive:
            return saveHiveParam();
        case globalParam.commonLinkType.hdfs:
            return saveHdfsParam();
        case globalParam.commonLinkType.spark:
            return saveHiveParam();
        default:
            return saveDbParam();
    }
}

///  hive db 配置
//// hive config 配置
function hiveConfig(param) {
    var container = $('.global-ConfigCon');

    param.replaceEnter === undefined && (param.replaceEnter = true, param.replacement = ' ');
    container.find('.dbTab .isReplace .checkbox').toggleClass('cur', param.replaceEnter);
    var text = param.replacement == ''? common_js_lang['db.info.emptyString']:param.replacement.trim() == '' ? param.replacement.match(/\s/g).length+common_js_lang['db.text.space'] : param.replacement ;
    container.find('.dbTab .replacementCon .val').text(text).attr('data-val', param.replacement).prop('disabled', !param.replaceEnter);

    globalParam.targetType > globalParam.commonLinkType.spark ? container.find('.hive .tableType').hide() : container.find('.hive .tableType').show() ;
    container.find('.hive .tableType').val( param.tableType || (globalParam.targetType == globalParam.commonLinkType.hive ? 0 : 1) ).prop('disabled', globalParam.targetType == globalParam.commonLinkType.spark ||  param.ddl != '');

    container.find('.hive .infoline.last').hide();
    container.find('#partitions').empty();

    var dbName = param.name || '',
        tableName = param.tableName || '';

    if( dbName ) {
        if ( container.find('#dbName').val() != dbName || (!param.ddl && !param.createSql) ){
            container.find('#dbName').val(dbName).select2();
            hiveModule.getTables(param);
        }
        else {
            container.find('#tableName').val(tableName).select2({tags:true});
            if ( container.find('#tableName').val() != tableName ){
                container.find('#tableName').append('<option value="'+tableName+'">'+tableName+'</option>').val(tableName).select2({tags:true});
            }
        }

        if ( param.ddl ){
            globalParam.targetType > globalParam.commonLinkType.spark ? '' : hiveModule.getPart(param.tableName, param.catalog, param.schema, param.partition);
            editor.doc.cm.setOption('readOnly', true);
            editor.doc.setValue(param.ddl);
            container.find('.new-sql .CodeMirror').addClass('disabled');
        }
        if ( param.createSql ) {
            editor.doc.cm.setOption('readOnly', false);
            editor.doc.setValue(param.createSql);
            container.find('.new-sql .CodeMirror').removeClass('disabled');
        }
    }
    else {
        container.find('#dbName').val('').select2();
        container.find('#tableName').html('<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option><option>' + tableName + '</option>').val(tableName).select2({tags: true});
        container.find('.hive .tableType').val( param.tableType || (globalParam.targetType == globalParam.commonLinkType.hive ? 0 : 1) ).prop('disabled', true);
        editor.doc.cm.setOption('readOnly', true);
        editor.doc.setValue('');
        container.find('.new-sql .CodeMirror').addClass('disabled');
    }
}


function hiveConfigModule(param){
    this.container = param.container ;
    this.newType = param.newType || 0;
    this.editor = this.newType != 4 ? editor : SQLeditor ;
    this.event();
}

hiveConfigModule.prototype = {
    event: function(){
        var _this = this;

        _this.container.on('change', '#dbName', function(){
            var param = _this.getParam();
            if ( !param.name ){
                return ;
            }
            _this.getTables(param);
        });

        _this.container.on('change', '#tableName', function(){
            var param = _this.getParam();

            if ( !param.name || !param.tableName ){
                return ;
            }
            if ( !param.tableName.match(/^[0-9A-Za-z]\w*$/g) ){
                MsgTip('', common_js_lang['db.info.tableName'], 'info');
                _this.container.find('#tableName').val('').select2({tags:true});
                return false;
            }
            _this.getDdlAct(param, _this.newType);
        });

        _this.container.on('change', '.tableType', function(){
            var param = _this.getParam();

            if ( !param.name || !param.tableName ){
                return ;
            }
            if ( !param.tableName.match(/^[0-9A-Za-z]\w*$/g) ){
                MsgTip('', common_js_lang['db.info.tableName'], 'info');
                _this.container.find('#tableName').val('').select2({tags:true});
                return false;
            }
            _this.getDdlAct(param, _this.newType);
        });

    },
    getParam: function(){
        var _this = this;
        var dbDom = _this.container.find("#dbName option:selected");
        var param = {
            dbId: globalParam.targetId,
            name: dbDom.val(),
            catalog: dbDom.attr('data-catalog') || '',
            schema: dbDom.attr('data-schema') || '',
            tableName: _this.container.find('#tableName').val(),
            tableType: _this.container.find('.tableType').val(),
            pid: $('#userApp').val(),
            fromId: globalParam.sourceId,
            toId: globalParam.targetId
        };
        if ( _this.newType == 0 ) {
            param.toTablesJson = JSON.stringify([{
                catalog: param.catalog,
                schema: param.schema,
                tableName: param.tableName,
                tableType: param.tableType
            }]);
            var fromDb = $('.rightSide .target-item .config.active').parent(),
                fromCatalog = fromDb.data('catalog'),
                fromSchema = fromDb.data('schema'),
                fromTbName = $('.rightSide .target-item .config.active').siblings('.target-name').text();
            param.fromTablesJson = JSON.stringify([{catalog: fromCatalog, schema: fromSchema, tableName: fromTbName}]);
            return param;
        }

        var sql = (SQLEditor.getValue()).replace(/\n+/g, ' ').trim();
        param.sql = sql;
        param.format = _this.container.find('.tableType option:selected').text();

        return param;
    },
    getTables: function(param) {
        var _this = this;
        $("#globalLoadCon").show();
        $.when( globalParam.promiseFunc.getTables(param) ).then(function(){
            _this.container.find('.hive .infoline.last').hide();
            _this.container.find('#partitions').empty();

            var tbls = globalParam.tblModel['tbl_'+param.dbId+'_'+param.catalog+'_'+param.schema];
            var tableList = '<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option>';
            tbls.map(function(v) {
                tableList += '<option data-name="' + v.name + '">' + v.name + '</option>';
            });
            _this.container.find("#tableName").html(tableList);

            if ( !param.tableName ){
                if ( tbls.length <= 0 ){
                    _this.container.find('#tableName').val('').select2({tags:true});
                    MsgTip('', common_js_lang['local.option.setTbl']);
                    $("#globalLoadCon").hide();
                    return false;
                }

                var defTbl = tbls[0].name ;
                _this.container.find('#tableName').val(defTbl).select2({tags:true});
                param.tableName = defTbl;
            }

            if ( !param.tableName.match(/^[0-9A-Za-z]\w*$/g) ){
                _this.container.find('#tableName').val('').select2({tags:true});
                MsgTip('', common_js_lang['db.info.tableName'], 'info');
                $("#globalLoadCon").hide();
                return false;
            }

            _this.container.find('#tableName').val(param.tableName).select2({tags:true});
            if ( _this.container.find('#tableName').val() != param.tableName ){
                _this.container.find('#tableName').append('<option>'+param.tableName+'</option>').val(param.tableName).select2({tags:true});
            }

            if( param.tableName ) {
                if ( !param.ddl && !param.createSql )
                    _this.getDdlAct(param, _this.newType);
                else
                    $("#globalLoadCon").hide();
            }
            else {
                _this.editor.doc.cm.setOption('readOnly', 'nocursor'); // 不显示光标
                _this.editor.doc.setValue('');
                _this.container.find('.new-sql .CodeMirror').addClass('disabled');
                _this.container.find('#tableName').val('').select2({tags: true});
                $("#globalLoadCon").hide();
            }
        }).fail(function(){
            $("#globalLoadCon").hide();
        });
    },
    getDdlAct: function(param, type){
        var _this = this;
        $("#globalLoadCon").show();
        var defer = $.Deferred();
        $.when( globalParam.promiseFunc.getDdl(param, type) ).then(function(data){
            if ( data.mppTable && globalParam.targetType == globalParam.commonLinkType.hive ){
                _this.editor.doc.setValue('');
                defer.reject();
                MsgTip('info', common_js_lang['db.tip.hivexspark']);
                return ;
            }
            if ( !data.mppTable && globalParam.targetType == globalParam.commonLinkType.spark ){
                _this.editor.doc.setValue('');
                defer.reject();
                MsgTip('info', common_js_lang['db.tip.sparkxhive']);
                return ;
            }
            _this.editor.doc.setValue(data.ddl);
            if ( data.isShow ){
                _this.editor.doc.cm.setOption('readOnly', 'nocursor');
                _this.container.find('.new-sql .CodeMirror').addClass('disabled');
                var formatVal = {
                    text: '0',
                    orc: '1',
                    parquet: '2',
                    rcfile: '3',
                    sequencefile: '4'
                } ;
                _this.container.find('.tableType').val(formatVal[data.format] || (globalParam.targetType == globalParam.commonLinkType.hive ? 0 : 1)).prop('disabled', true);
                globalParam.targetType > globalParam.commonLinkType.spark ? defer.resolve() : _this.getPart(param.tableName, param.catalog, param.schema, param.partition || '', defer);
            }
            else {
                _this.editor.doc.cm.setOption('readOnly', false);
                _this.container.find('.new-sql .CodeMirror').removeClass('disabled');
                var formatVal = {
                    text: '0',
                    orc: '1',
                    parquet: '2',
                    rcfile: '3',
                    sequencefile: '4'
                } ;
                _this.container.find('.tableType').val(formatVal[data.format] || (globalParam.targetType == globalParam.commonLinkType.hive ? 0 : 1)).prop('disabled', globalParam.targetType == globalParam.commonLinkType.spark || false);
                _this.container.find('#partitions').empty();
                _this.container.find('.hive .infoline.last').hide();
                defer.resolve();
            }
        }).fail(function(){
            _this.container.find('#tableName').val('').select2({tags:true});
            _this.editor.doc.setValue('');
            _this.editor.doc.cm.setOption('readOnly', 'nocursor');
            _this.container.find('.new-sql .CodeMirror').addClass('disabled');
            _this.container.find('.new-sql .tableType').val(0).prop('disabled', true);

            defer.reject();
        });

        $.when( defer).always(function(){
            $("#globalLoadCon").hide();
        });
    },
    getPart: function(tblName, catalog, schema, partitions, defer){
        var _this = this;
        $.when( globalParam.promiseFunc.getPart({dbId:globalParam.targetId,tableName: tblName, catalog:catalog, schema:schema}) )
            .then(function(data){
                _this.partitionShow(data, partitions);
                defer && defer.resolve();
            }).fail(function(){
            defer && defer.reject();
        });
    },
    partitionShow: function(model, partitions){
        var _this = this;
        _this.container.find('#partitions').empty();
        if( !model || model.length == 0) {
            this.container.find('.hive .infoline.last').css({display: 'none'});
        }
        else {
            this.container.find('.hive .infoline.last').css({display: 'block'});

            model.map(function(v, i){
                var _html = '';
                _html += '<div class="item"><input type="text" class="filedName" value="' + v.name + '" disabled>' +
                    '<label>=</label>' +
                    '<select class="select2 filedVal selVal" data-type="' + v.name + '" id="Part_level_' + i + '">';
                v.parts.map(function(vv){
                    _html += '<option value="'+vv.value+'" title="'+vv.name+'">'+vv.value+'</option>';
                });
                _html += globalParam.columnValOption+'</select></div>' ;
                _this.container.find('#partitions').append(_html);
                _this.container.find('#partitions #Part_level_'+i).select2({placeholder: "value",tags: true});
            });

            if(partitions) {
                var partObj = JSON.parse(partitions);
                for (var k in partObj) {
                    if ( _this.container.find('#partitions').find('[data-type="' + k + '"]').find('[value="'+partObj[k]+'"]').length == 1 ){
                        _this.container.find('#partitions').find('[data-type="' + k + '"]').val(partObj[k]).trigger('change');
                    }
                    else {
                        _this.container.find('#partitions').find('[data-type="' + k + '"]').prepend('<option value="'+partObj[k]+'">'+partObj[k]+'</option>').val(partObj[k]).change();
                    }
                }
            }
        }
    }
};

var hiveModule = new hiveConfigModule({container: $('.global-ConfigCon')});
var sqlHiveModule = new hiveConfigModule({container: $('.item2 .config.sqlQuery'), newType:4});


// hive 保存数据
function saveHiveParam() {
    var container = $('.global-ConfigCon');
    var dbName = (container.find('#dbName').val() || '').trim(),
        tabData = {},
        partitions = container.find('#partitions .item .filedVal'),
        selectOption = container.find('#dbName option:selected'),
        catalog = selectOption.attr('data-catalog') || '',
        schema = selectOption.attr('data-schema') || '',
        tblName = container.find('#tableName').val(),
        sql = editor.doc.getValue() || '';

    if( [dbName, tblName, sql].indexOf('') > -1 ) {
        MsgTip('', common_js_lang['local.info.tblErr'], 'info');
        return false;
    }

    var createSql = '', ddl = '' ;

    if ( !editor.doc.cm.isReadOnly() ){
        createSql = sql;
        sql = sql.substring(sql.indexOf("TABLE")+"TABLE".length, sql.indexOf("(")).trim();
        sql = sql.replace(/\"|\'|`|\[|\]/g, '');
        try {
            var sqlArr = sql.split('.');
            if ( !(sqlArr[0] == dbName && sqlArr[1] == tblName) ){
                MsgTip('', common_js_lang['db.info.sqlErr'], 'info');
                return false;
            }
        } catch (e){
            MsgTip('', common_js_lang['db.info.sqlErr'], 'info');
            return false;
        }
    }
    else {
        ddl = sql ;
    }

    var partitionItems = {};
    for(var i = 0, length = partitions.length; i < length; i++) {
        partitionItems[partitions.eq(i).attr('data-type')] = partitions.eq(i).val().trim();
    }
    partitions.length > 0 && (tabData['partition'] = JSON.stringify(partitionItems));
    tabData['dbId'] = globalParam.targetId;
    tabData['tableType'] = container.find('.hive .tableType').val();
    tabData['createSql'] = createSql;
    tabData['ddl'] = ddl;
    tabData['tableName'] = tblName;
    tabData['catalog'] = catalog;
    tabData['schema'] = schema;
    tabData['name'] = dbName;

    var replaceEnter = container.find('.dbTab .isReplace .checkbox').hasClass('cur'),
        replacement = '';
    replacement = container.find('.dbTab .replacementCon .val').attr('data-val');
    tabData['replaceEnter'] = replaceEnter;
    tabData['replacement'] = replacement;
    return tabData;
}

// hdfs 保存数据
function saveHdfsParam() {
    var hdfsPath = $('.global-ConfigCon .hdfsTab .selectedDir').val().trim(),
        hdfsFileName = $('.global-ConfigCon .hdfsTab .fileName').val().trim();
    hdfsFileName = hdfsFileName.slice(0, 60);
    if(!hdfsPath || !hdfsFileName) {
        MsgTip('', common_js_lang['local.info.fileDir'], 'info');
        return false;
    }
    if ( hdfsFileName.match(/\s+|\\+/g) ){
        MsgTip('', common_js_lang['local.info.fileName'], 'info');
        return false;
    }

    var returnData = false;
    $.fn.ajaxAPI({
        url: 'hdfs/dir/access',
        data:{hdfsId:globalParam.targetId, dir:hdfsPath, pid:$('#userApp').val()},
        async: false,
        callback: function(data){
            var replaceEnter = $('.global-ConfigCon .hdfsTab .isReplace .checkbox').hasClass('cur'),
                replacement = $('.global-ConfigCon .hdfsTab .replacementCon .val').attr('data-val');

            returnData = {
                fileName: (hdfsPath +'/' + hdfsFileName).replace(/\/+/g, '\/'),
                replaceEnter: replaceEnter,
                replacement: replacement,
                hid: globalParam.targetId,
                tarDir: hdfsPath,
                tarName: hdfsFileName
            };
        }
    });
    return returnData;
}
// db 保存数据
function saveDbParam() {
    return saveHiveParam();
}

// db init
function dbConfig(param) {
    hiveConfig(param);
}

// config  tab 切换
$('.global-ConfigCon').on('click', '.configTab a', function() {
    if ( $(this).hasClass('cur') )
        return;
    $(this).addClass('cur').siblings().removeClass('cur');
    var index = $(this).index();
    var targetTab = globalParam.targetType == globalParam.commonLinkType.hdfs ? 'hdfsTab' : 'dbTab';
    if ( index == 0 ){
        $('.global-ConfigCon .filterTab').addClass('hidden');
        $('.global-ConfigCon .'+targetTab).removeClass('hidden');
    }
    else {
        if ( globalParam.targetType == globalParam.commonLinkType.hdfs ) {
            $('.global-ConfigCon .filterTab').removeClass('hidden');
            $('.global-ConfigCon .'+targetTab).addClass('hidden');
            $('.global-ConfigCon .filterType').find('label').eq(1).hide();
            filterEditor.refresh();
            return ;
        }
        $('.global-ConfigCon .filterType').find('label').eq(1).show();
        var db = $('.global-ConfigCon #dbName option:selected'),
            catalog = db.attr('data-catalog') || '',
            schema = db.attr('data-schema') || '',
            tableName = $('.global-ConfigCon #tableName').val() || '';
        if ( !db.val() ) {    // 没选择库时 清空目标字段
            $(this).attr('data-tbl', '');
            $('.synch .tarColumn').html('').select2();
        }
        else {
            if ( !editor.doc.cm.isReadOnly() ){  //新表取源表字段
                if ( $(this).attr('data-tbl') !== JSON.stringify({catalog:catalog, schema:schema, tableName:tableName}) ) {
                    $(this).attr('data-tbl', JSON.stringify({catalog: catalog, schema: schema, tableName: tableName}));

                    var columnOption = $('.synch .srcColumn').html();
                    $('.synch .tarColumn').html(columnOption).select2();
                }
            }
            else { // 已存在表 取字段
                if ( $(this).attr('data-tbl') !== JSON.stringify({catalog:catalog, schema:schema, tableName:tableName}) ) {
                    var self = $(this);
                    $('#globalLoadCon').css({display:'block'});
                    $.when( getColumns({dbId: globalParam.targetId, catalog: catalog, schema: schema, tableName: tableName}) )
                        .done( function(data){
                            $('.synch .tarColumn').html(data).select2();
                            self.attr('data-tbl', JSON.stringify({
                                catalog: catalog,
                                schema: schema,
                                tableName: tableName
                            }));
                        }).always( function(){
                        $('#globalLoadCon').css({display:'none'});
                    } );
                }
            }
        }

        $('.global-ConfigCon .filterTab').removeClass('hidden');
        $('.global-ConfigCon .'+targetTab).addClass('hidden');
    }
    $('.synch .srcColumn').select2();
    $('.synch .tarColumn').select2();
    filterEditor.refresh();
});

function getType1Val(){
    if ( globalParam.type1Val )
        return ;
    $.fn.ajaxAPI({
        url:'master/words/list?type=1',
        callback: function(data){
            if ( data.model.length == 0) return ;
            globalParam.type1Val = '<select class="type1Val"><option value="">('+common_js_lang['db.info.emptyString']+')</option>';
            data.model.map(function(v){
                globalParam.type1Val += '<option title="'+(common_i18n_lang == 'zh'? v.name : v.content)+'" value="'+v.content+'">'+v.content+'</option>' ;
            });
            globalParam.type1Val += '</select>';
        }
    });
}

function column2option(model){
    var columnsOption = '';
    model.map(function(v) {
        var type = v.typeName;
        columnsOption += '<option data-obj="'+encodeURIComponent(JSON.stringify(v))+'" data-type="' + v.dataType + '" data-typeName="'+type+'">' +  v.alias  + '</option>';
    });
    return columnsOption;
}

//取字段
function getColumns(param){
    var dbId = param.dbId,
        catalog = param.catalog,
        schema = param.schema,
        tableName = param.tableName ;
    var defer = $.Deferred() ;

    if ( globalParam.columnObjMap['param_'+dbId+'_'+catalog+'_'+schema+'_'+tableName] ){
        var model = globalParam.columnObjMap['param_'+dbId+'_'+catalog+'_'+schema+'_'+tableName],
            options = column2option( model );
        defer.resolve(options);
        return defer.promise() ;
    }

    $.ajax({
        url: 'db/table/columns',
        data: {
            dbId: dbId,
            catalog: catalog,
            schema: schema,
            tableName: tableName
        },
        success: function(data) {
            if ( data.code != 200 ){
                defer.reject();
                ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                return ;
            }

            globalParam.columnObjMap['param_'+dbId+'_'+catalog+'_'+schema+'_'+tableName] = data.model;
            var columnsOption = column2option( data.model );
            defer.resolve(columnsOption);
        },
        error: function(){
            defer.reject();
        }
    });

    return defer.promise();
}

//取源表字段
function getSourceColumns(dom, defer) {
    var tableName = dom.siblings('.target-name').text(),
        targetPath = dom.parents('tr'),
        catalog = targetPath.data('catalog'),
        schema = targetPath.data('schema');

    var param = {
        dbId: globalParam.sourceId,
        catalog: catalog,
        schema: schema,
        tableName: tableName
    };
    $.when( getColumns(param)).done(function(data){
        globalParam.columnsOption = data;
        defer.resolve();
    }).fail(function(){
        defer.reject();
    });
}

function filterConfigModule(){
    this.container = $('.global-ConfigCon .filterTab');
    this.event();
}

filterConfigModule.prototype = {
    event: function(){
        this.getFilterList();
        var _this = this;
        // 增加条件
        _this.container.on('click', '.filter-list .add-filter, .act .add', function() {
            var valDom = '<input type="text" maxlength="30">';
            var columnType = $(globalParam.columnsOption).attr('data-type');
            if ( [-7, -6, -5, 2, 3, 4, 5, 6, 8].indexOf(+columnType) == -1 ){
                valDom = globalParam.type1Val ;
            }
            var filterHtml = '<div class="flex-item filter-item">' +
                '<span class="item"><select  class="filter-column">' + globalParam.columnsOption + '</select></span>' +
                '<span class="item"><select  class="filter-relate">' + globalParam.filtersOption + '</select></span>' +
                '<span class="item">'+valDom + '</span>' +
                '<span class="item"><select class="filter-logic"><option>AND</option><option>OR</option><option>AND NOT</option><option>OR NOT</option></select></span>' +
                '<span class="item act"><i class="add"></i><i class="del"></i></span></div>';

            _this.container.find('.filter-list .noData').hide();
            var newDom = _this.container.find('.filter-list').append(filterHtml).find('.filter-item:last-child');
            newDom.find('select').select2();
            newDom.find('.type1Val').select2({tags:true});
            _this.getFilterSql();
        });

        _this.container.on('change', '.filter-item select', function(){
            _this.getFilterSql()
        });
        _this.container.on('blur', '.filter-item input', function(){
            _this.getFilterSql()
        });
        // 关联条件变更
        _this.container.on('change', '.filter-item .filter-relate', function(e, resetVal) {
            _this.conditionChange( $(this), resetVal );
        });
        // 字段切换,变更
        _this.container.on('change', '.filter-item .filter-column', function() {
            _this.input2select( $(this) );
        });
        //删除条件
        _this.container.on('click', '.filter-item .del', function() {
            $(this).parents('.filter-item').remove();
            _this.getFilterSql();
            _this.container.find('.filter-list .filter-item').length == 0 && _this.container.find('.filter-list .noData').show();
        });

        // 自定义SQL
        _this.container.on('click', '.editSql label', function(){
            var isCheck = $(this).find('.switch.cur').length == 1;
            $(this).find('.switch').toggleClass('cur');
            filterEditor.doc.cm.setOption('readOnly', isCheck ? 'nocursor' : false);
            if ( isCheck ){
                _this.container.find('.filter-list').show();
                _this.container.find('.CodeMirror').addClass('disabled');
            }
            else {
                _this.container.find('.filter-list').hide();
                _this.container.find('.CodeMirror').removeClass('disabled');
            }
        });

        // 设置方式切换
        _this.container.on('click', '.filterType label', function(){
            if ( $(this).find('.radio.cur').length == 1 )
                return ;

            $(this).parent().find('.radio').toggleClass('cur');
            var type = $(this).find('.radio.cur').attr('data-val');
            if ( type == 1 ){
                _this.container.find('.filterSynch').hide();
                _this.container.find('.filterWhere').show();
                filterEditor.refresh();
            }
            else {
                _this.container.find('.filterWhere').hide();
                _this.container.find('.filterSynch').show();
                _this.container.find('.synch .srcColumn').select2();
                _this.container.find('.synch .tarColumn').select2();
            }
        });
    },
    getFilterSql: function() {
        var filterItems = this.container.find('.filter-item');
        var sql = '';
        for(var i = 0, len = filterItems.length; i < len; i++) {
            var item = filterItems.eq(i),
                columnDom = item.find('.filter-column option:selected'),
                column = columnDom.val(),
                columnType = columnDom.data('type'),
                relate = item.find('.filter-relate option:selected'),
                content = relate.data('content'),
                type = relate.data('type'),
                logic = item.find('.filter-logic').val(),
                val = item.find('input').length == 1 ? item.find('input').val() || '' : item.find('.type1Val').val() || '';

            if(type == 0) {
                sql += ' ' + column + ' ' + content;
            } else if(type == 1) {
                if(content.match(/\{1\}/g)){    // sql like 匹配
                    sql += ' ' + column + ' ' + content.replace(/\{1\}/g, val);
                }
                else {
                    if([-7, -6, -5, 2, 3, 4, 5, 6, 8].indexOf(+columnType) == -1)
                        val = "'" + val + "'";
                    else {   // 数字型 默认为 0
                        val = parseInt(val) || 0 ;
                        item.find('input').length == 1 ? item.find('input').val(val) : item.find('.type1Val').find('option:selected').text(val).end().select2();
                    }
                    sql += ' ' + column + ' ' + content + ' ' + val;
                }
            } else if(type == 9) {  // 列表中 IN
                if([-7, -6, -5, 2, 3, 4, 5, 6, 8].indexOf(+columnType) == -1) {   // string
                    val = val.split(',').map(function(v) {
                        return "'" + v + "'"
                    });
                    val = val.join(',');
                }
                else {   //  int
                    val = val.split(',').map(function(v) {
                        return parseInt(v) || 0
                    });
                    val = val.join(',');
                    item.find('input').length == 1 ? item.find('input').val(val) : item.find('.type1Val').find('option:selected').text(val).end().select2();
                }
                sql += ' ' + column + ' ' + content.replace(/\{1\}/g, val);
            } else {   //  between
                var arr = val.split(',');
                var tag = 0;
                if([-7, -6, -5, 2, 3, 4, 5, 6, 8].indexOf(+columnType) == -1){
                    tag = 1;
                    arr[0] === undefined && (arr[0] = '');
                    arr[1] === undefined && (arr[1] = '');
                }
                else {
                    arr[0] = parseInt(arr[0]) || 0;
                    arr[1] = parseInt(arr[1]) || 0;
                }

                val = arr[0]+','+arr[1];
                item.find('input').length == 1 ? item.find('input').val(val) : item.find('.type1Val').find('option:selected').text(val).end().select2();

                content = content.replace(/\{1\}/g, tag == 1 ? "'" + arr[0] + "'" : arr[0]);
                content = content.replace(/\{2\}/g, tag == 1 ? "'" + arr[1] + "'" : arr[1]);
                sql += ' ' + column + ' ' + content;
            }

            if(i < len - 1) {
                sql += ' \n' + logic;
            }
        }

        sql ? sql = 'where '+sql : '';
        filterEditor.doc.setValue(sql);
        return sql;
    },
    input2select: function(self, resetVal){
        var parentDom = self.parents('.filter-item'),
            columnDom = parentDom.find('.filter-column'),
            relateDom = parentDom.find('.filter-relate'),
            type = relateDom.find('option:selected').data('type'),
            columnType = columnDom.find('option:selected').data('type');

        if ( [-7, -6, -5, 2, 3, 4, 5, 6, 8].indexOf(+columnType) == -1 && type == 1 ){
            if ( parentDom.find('.type1Val').length == 0 ){
                var dom = parentDom.find('input').parent();
                dom.html(globalParam.type1Val);
                if ( !resetVal )
                    parentDom.find('.type1Val').select2({tags:true});
                else {
                    parentDom.find('.type1Val').find('[value="'+resetVal+'"]').length == 0 ?
                        parentDom.find('.type1Val').append('<option value="'+resetVal+'">'+resetVal+'</option>') : '';
                    parentDom.find('.type1Val').val(resetVal).select2({tags:true});
                }
            }
        }
        else {
            if ( parentDom.find('.type1Val').length == 1 ){
                var dom = parentDom.find('.type1Val').parent();
                dom.html('<input type="text" maxlength="30">');
            }
        }
    },
    conditionChange: function(dom, resetVal){
        this.input2select( dom, resetVal );
        var option = dom.find('option:selected'),
            content = option.data('content'),
            type = option.data('type');
        if(type > 1) {
            dom.parents('.filter-item').find('input').attr('placeholder', common_js_lang['db.text.seq']).prop('disabled', false);
        } else if(type == 0) {
            dom.parents('.filter-item').find('input').val('').prop('disabled', true);
        } else {
            dom.parents('.filter-item').find('input').attr('placeholder', '').prop('disabled', false);
        }
    },
    getFilterList: function() {
        $.fn.ajaxAPI({
            url: 'master/words/list?type=2',
            callback: function(data) {
                var filtersOption = '';
                data.model.map(function(v) {
                    filtersOption += '<option data-content="' + v.content + '" data-type="' + v.subType1 + '">' + (common_i18n_lang == 'zh'? v.name : v.content) + '</option>';
                });
                globalParam.filtersOption = filtersOption;
            }
        })
    },
    saveFilterList: function() {
        var itemList = this.container.find('.filter-item'),
            len = itemList.length,
            filterParam = [] ;

        for(var i = 0; i < len; i++) {
            var column = itemList.eq(i).find('.filter-column').val(),
                relate = itemList.eq(i).find('.filter-relate').val(),
                input = itemList.eq(i).find('input').length == 1? itemList.eq(i).find('input').val() : itemList.eq(i).find('.type1Val').val(),
                logic = itemList.eq(i).find('.filter-logic').val();
            filterParam.push({column: column, relate: relate, input: input, logic: logic});
        }
        return filterParam;
    },
    saveFilterParam: function(){
        var _this = this;
        var type = this.container.find('.filterType .radio.cur').attr('data-val'),
            param = {};

        if ( type == 1 ){
            if ( this.container.find('.editSql .switch.cur').length == 0 ){
                param.filter = this.saveFilterList();
            }
            param.whereSql = (filterEditor.doc.getValue() || '').trim() ;
            if ( !param.whereSql && this.container.find('.editSql .switch.cur').length == 1 ){
                MsgTip('info', common_js_lang['db.info.sqlEmpty']);
                return false;
            }
        }
        else {
            param.srcColumn = this.container.find('.synch .srcColumn').val();
            param.tarColumn = this.container.find('.synch .tarColumn').val();
            if ( !param.srcColumn || !param.tarColumn ){
                MsgTip('info', common_js_lang['db.tip.columnEmpty']);
                return false;
            }
            param.srcColumn = JSON.parse(decodeURIComponent( _this.container.find('.synch .srcColumn option:selected').attr('data-obj')) );
            param.tarColumn = JSON.parse(decodeURIComponent( _this.container.find('.synch .tarColumn option:selected').attr('data-obj')) );
            param.dataTbl = $('.configTab a').eq(1).attr('data-tbl');
        }
        return param;
    },
    resetFilter: function(filter, param) {
        this.container.find('.filterType .radio').removeClass('cur').eq(0).addClass('cur');
        this.container.find('.editSql .switch.cur').removeClass('cur');
        this.container.find('.filterSynch').hide();
        this.container.find('.filterWhere').show().find('.filter-list').show().find('.filter-item').remove().end().find('.noData').show();
        this.container.find('.CodeMirror').addClass('disabled');
        filterEditor.doc.cm.setOption('readOnly', 'nocursor');
        filterEditor.doc.setValue(filter.whereSql || '');

        if ( filter.whereSql ){  //where过滤
            if ( filter.filter ){  //filter条件
                this.container.find('.filterWhere .noData').hide();
                var filterArr = filter.filter || [],
                    len = filterArr.length;
                for(var i = 0; i < len; i++) {
                    var filterHtml = $('<div class="flex-item filter-item">' +
                        '<span class="item"><select  class="filter-column">' + globalParam.columnsOption + '</select></span>' +
                        '<span class="item"><select  class="filter-relate">' + globalParam.filtersOption + '</select></span>' +
                        '<span class="item"><input type="text" value="' + filterArr[i].input + '"></span>' +
                        '<span class="item"><select class="filter-logic"><option>AND</option><option>OR</option><option>AND NOT</option><option>OR NOT</option></select></span>' +
                        '<span class="item act"><i class="add"></i><i class="del"></i></span></div>');

                    filterHtml.find('.filter-column').val(filterArr[i].column).end()
                        .find('.filter-relate').val(filterArr[i].relate).end()
                        .find('.filter-logic').val(filterArr[i].logic);

                    var dom = this.container.find('.filter-list').append(filterHtml).find('.filter-item:last-child');
                    dom.find('select').select2();
                    dom.find('.type1Val').select2({tags:true});
                    filterModule.conditionChange(dom.find('.filter-relate'), filterArr[i].input);
                }
            }
            else {
                this.container.find('.editSql .switch').addClass('cur');
                this.container.find('.filter-list').hide();
                this.container.find('.CodeMirror').removeClass('disabled');
                filterEditor.doc.cm.setOption('readOnly', false);
            }
        }

        if ( filter.srcColumn ) {   // 同步增量
            this.container.find('.filterType .radio').removeClass('cur').eq(1).addClass('cur');
            this.container.find('.filterWhere').hide();
            this.container.find('.filterSynch').show();
            this.container.find('.synch .srcColumn').val(filter.srcColumn.alias).select2();

            var tag = false;
            if ( $('.configTab a').eq(1).attr('data-tbl') != filter.dataTbl ) {
                tag = true ;
                $('.configTab a').eq(1).attr('data-tbl', filter.dataTbl);
            }
            if ( param.createSql ){  //新表
                if ( tag ) {
                    var columnOption = $('.synch .srcColumn').html();
                    this.container.find('.synch .tarColumn').html(columnOption).val(filter.tarColumn.alias);
                }
                else {
                    this.container.find('.synch .tarColumn').val(filter.tarColumn.alias);
                }

                if ( this.container.find('.synch .tarColumn').val() != filter.tarColumn )
                    this.container.find('.synch .tarColumn').append('<option>'+filter.tarColumn+'</option>').val(filter.tarColumn.alias);
                this.container.find('.synch .tarColumn').select2();
            }
            else {
                if ( tag ) {
                    var dataTbl = JSON.parse(filter.dataTbl);
                    var _this = this;
                    $('#globalLoadCon').css({display:'block'});
                    $.when( getColumns({dbId:globalParam.targetId, catalog:dataTbl.catalog, schema: dataTbl.schema, tableName:dataTbl.tableName}) )
                        .done( function(data){
                            _this.container.find('.synch .tarColumn').html(data).val(filter.tarColumn.alias).select2();
                        }).always( function(){
                        $('#globalLoadCon').css({display:'none'});
                    } );
                }
                else {
                    this.container.find('.synch .tarColumn').val(filter.tarColumn.alias).select2();
                }
            }
        }
    }
};

var filterModule = new filterConfigModule();

//////////////////   db 配置 end

// 第二步 返回 第一步
$('.item2').on('click', '.act .btn-cancel', function() {
    $('.stepCon').animate({'margin-left': '0'}, 250, function(){
        $('.stepCon .item.item2, .stepCon .item.item3').height('200');
        $('.stepCon .item.item1').height('auto');
    });
    $('.processCon .itemCon').removeClass('cur').eq(0).addClass('cur');
    $('html, body').animate({scrollTop:0},200);
});

// 第二步 到 第三步
$('.item2').on('click', '.act .btn-item', function() {
    var mtype = $('.mtype .radio.cur').data('val');
    if ( mtype == 3 ){
        globalParam.targetType == globalParam.commonLinkType.hdfs ?  sqlEdiotrModule.hdfsParamCheck() : sqlEdiotrModule.hiveParamCheck();
        return ;
    }

    var itemArr = $('.rightSide .target-item .target-name'),
        len = itemArr.length;
    if(len <= 0) {
        MsgTip('', common_js_lang['db.info.confTar'], 'info');
        return false;
    }

    var tblViewText = mtype == 1 ? common_js_lang['db.text.tbl'] : common_js_lang['db.text.view'] ;
    var fromJson = [],
        toHdfsJson = [],
        toHiveJson = [],
        toDbJson = [];

    var fromColumnArr = [],
        toColumnArr = [],
        columnDefer = $.Deferred(),   //取字段
        partArr = [],
        partDefer = $.Deferred(),   //分区判断
        existTblArr = [],
        existTblDefer = $.Deferred();  //表存在判断

    $('#waitLoading').find('article').html('<p>'+common_js_lang['db.text.checkWait']+'</p><p class="detail"></p>').end().css({display:'block'});


    for (var i = 0; i < len; i++) {
        var param = itemArr.eq(i).attr('data-param') ? JSON.parse(itemArr.eq(i).attr('data-param')) : {},
            filter = itemArr.eq(i).attr('data-filter') ? JSON.parse(itemArr.eq(i).attr('data-filter')) : {};

        var db = itemArr.eq(i).parent().attr('data-name'),
            tbl = itemArr.eq(i).text(),
            catalog = itemArr.eq(i).parent().attr('data-catalog'),
            schema = itemArr.eq(i).parent().attr('data-schema');

        if ( [globalParam.commonLinkType.hdfs, globalParam.commonLinkType.spark].indexOf(globalParam.targetType) > -1 && param.ddl && !param.partition ) {
            var partArrObj = globalParam.partitionsData['catalog' + param.catalog + '_schema' + param.schema + '_' + param.tableName];
            if ( partArrObj && partArrObj.length > 0 ) {  //已知存在分区但没配置
                MsgTip('', tblViewText + '[' + param.tableName + '] ' + common_js_lang['local.info.hiveParam'] + '\n', 'info');
                return false;
            }

            if ( !partArrObj) {  // 没配置分区，不知是否有分区
                partArr.push(param);
            }
        }

        if(globalParam.targetType == globalParam.commonLinkType.hdfs) { // hdfs
            if( !checkHdfs(param) ) {
                $('#waitLoading').hide();
                MsgTip('', common_js_lang['db.text.db']+'[' + db + '] '+common_js_lang['db.text.tbl']+'[' + tbl + '] '+common_js_lang['dbManage.info.hdfsParamErr']);
                return false;
            }

            fromJson[i] = {
                id: globalParam.sourceId,
                name: db,
                catalog: catalog,
                schema: schema,
                tableName: tbl,
                whereSql: filter.whereSql || ''
            };
            toHdfsJson[i] = param;
        }
        else if( [globalParam.commonLinkType.hive,globalParam.commonLinkType.spark].indexOf(globalParam.targetType) == -1 ) { // db
            if( (!param.name || !param.tableName) || (!param.createSql && (!param.catalog && !param.schema)) ) {
                $('#waitLoading').hide();
                MsgTip('', common_js_lang['db.text.db']+'[' + db + '] '+tblViewText+'[' + tbl + '] '+ common_js_lang['local.info.hiveParam'], 'info');
                return false;
            }

            fromJson[i] = {
                id: globalParam.sourceId,
                name: db,
                catalog: catalog,
                schema: schema,
                tableName: tbl,
                synchColumnMap:{
                    srcSynchColumn: filter.srcColumn || '',
                    tagSynchColumn: filter.tarColumn || ''
                },
                whereSql: filter.whereSql || ''
            };
            if (!globalParam.columnObjMap['param_' + globalParam.sourceId + '_' + catalog + '_' + schema + '_' + tbl]) {
                fromColumnArr.push({catalog: catalog, schema: schema, tableName: tbl});
            }

            toDbJson[i] = param;
            if (param.createSql) {
                toColumnArr.push({ddl:param.createSql,tableName:param.tableName,catalog: param.catalog, schema: param.schema}) ;
            }
            else if (!globalParam.columnObjMap['param_' + param.dbId + '_' + param.catalog + '_' + param.schema + '_' + param.tableName]) {
                toColumnArr.push({catalog: param.catalog, schema: param.schema, tableName: param.tableName});
            }
        }
        else { //hive
            if ((!param.name || !param.tableName) || (!param.createSql && (!param.catalog && !param.schema))) {
                $('#waitLoading').hide();
                MsgTip('', common_js_lang['db.text.db']+'[' + db + '] '+tblViewText+'[' + tbl + '] '+ common_js_lang['local.info.hiveParam'], 'info');
                return false;
            }

            fromJson[i] = {
                id: globalParam.sourceId,
                name: db,
                catalog: catalog,
                schema: schema,
                tableName: tbl,
                synchColumnMap: {
                    srcSynchColumn: filter.srcColumn || '',
                    tagSynchColumn: filter.tarColumn || ''
                },
                whereSql: filter.whereSql || ''
            };
            if (!globalParam.columnObjMap['param_' + globalParam.sourceId + '_' + catalog + '_' + schema + '_' + tbl]) {
                fromColumnArr.push({catalog: catalog, schema: schema, tableName: tbl});
            }

            toHiveJson[i] = param;
            if (param.createSql) {
                toColumnArr.push({ddl:param.createSql,tableName:param.tableName,catalog: param.catalog, schema: param.schema}) ;
            }
            else if (!globalParam.columnObjMap['param_' + param.dbId + '_' + param.catalog + '_' + param.schema + '_' + param.tableName]) {
                toColumnArr.push({catalog: param.catalog, schema: param.schema, tableName: param.tableName});
            }
        }

        if ( globalParam.jobId > 0 && globalParam.targetType != globalParam.commonLinkType.hdfs ) {
            existTblArr.push({dbId:globalParam.sourceId, catalog:catalog, schema:schema, tableName:tbl, name:db});
        }
    }

    if ( partArr.length <= 0 ){
        partDefer.resolve();
    }
    else {
        batchPartCheck();
    }

    $.when ( partDefer).then(function(){
        if ( existTblArr.length <= 0 ){
            existTblDefer.resolve();
        }
        else {
            checkTbl();
        }
    }).fail(function(){
        $('#waitLoading').hide();
    });

    //批量验证partitions
    function batchPartCheck(){
        $.ajax({
            url: 'db/table/partitions/batch',
            data: {dbId: globalParam.targetId, pid:$('#userApp').val(), tablesJsonStr: JSON.stringify(partArr)},
            type: 'post',
            success: function(data){
                var errMsg = '', errTitle = '', errDetail = '';
                if (data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    partDefer.reject();
                    return ;
                }

                data.model.map(function(v){
                    if ( v.code != 200 ){
                        errTitle ? '' : errTitle = v.i18nMsg.title;
                        errDetail ? '' : errDetail = v.i18nMsg.detail;
                        errMsg += v.msg+'.\n';
                        return ;
                    }
                    if ( v.model && v.model.partitions.length > 0 ){
                        errMsg += tblViewText+'[' + v.model.name + '] '+ common_js_lang['local.info.hiveParam']+'\n';
                    }
                });
                if ( errMsg ){
                    ErrTip(errTitle, errDetail, errMsg);
                    partDefer.reject();
                    return ;
                }
                partDefer.resolve();
            },
            error: function(){
                partDefer.reject();
            }
        })
    }

    // 验证表存在
    function checkTbl(){
        var tblLen = existTblArr.length,
            init = 0,
            amount = 0;
        batchCheck();
        function tblExist(param, defer) {
            $.ajax({
                url: 'db/table/exist2',
                data: param,
                success: function (data) {
                    if (data.code != 200) {
                        defer.reject();
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return false;
                    }
                    if (!data.model) {
                        defer.reject();
                        MsgTip('', common_js_lang['db.text.db'] + '[' + param.name + '] ' + tblViewText + '[' + param.tableName + '] ' + common_js_lang['db.text.notInSrc'], 'info');
                        return false;
                    }
                    defer.resolve();
                },
                error: function () {
                    defer.reject();
                }
            });
        }

        function batchCheck(){
            if ( init >= tblLen ){
                existTblDefer.resolve();
                return ;
            }
            amount = init + 100 > tblLen ? tblLen - init : 100 ;
            var defer = [];
            for ( var i= 0; i<amount; i++ ){
                defer[i] = $.Deferred();
                tblExist( existTblArr[i+init], defer[i] )
            }
            $.when.apply($, defer).then(function(){
                init += 100;
                batchCheck();
            }).fail(function(){
                existTblDefer.reject();
            });
        }
    }

    //取源表、目标表字段信息
    $.when( existTblDefer).done(function(){
        if ( globalParam.targetType == globalParam.commonLinkType.hdfs || fromColumnArr.length <= 0 && toColumnArr.length == 0 ){
            columnDefer.resolve();
        }
        else {
            $('#waitLoading').find('article').html('<p>'+common_js_lang['db.tip.waitColumn']+'</p><p class="detail"></p>').end().css({display:'block'});
            $.when( getColumnBatch({dbId:globalParam.sourceId, tablesJsonStr: JSON.stringify(fromColumnArr)}), getColumnBatch({dbId:globalParam.targetId, tablesJsonStr: JSON.stringify(toColumnArr)}) )
                .then(function(data){
                    columnDefer.resolve();
                }).fail(function(){
                $('#waitLoading').hide();
            }) ;

        }
    }).fail(function(){
        $('#waitLoading').hide();
    });


    $.when(columnDefer).done(function() {
        if (globalParam.targetType != globalParam.commonLinkType.hdfs) {
            var preToJson = [globalParam.commonLinkType.hive, globalParam.commonLinkType.spark].indexOf(globalParam.targetType) > -1 ? globalParam.toHiveJson : globalParam.toDbJson,
                nowToJson = [globalParam.commonLinkType.hive, globalParam.commonLinkType.spark].indexOf(globalParam.targetType) > -1 ? toHiveJson : toDbJson ;

            globalParam.curTableColumnsMap = columnMapObj.diffTableColumnsMap({fromJson:globalParam.fromJson, toJson:preToJson}, {fromJson:fromJson, toJson:nowToJson});
            columnMapObj.setSrcList(fromJson, nowToJson);
            columnMapObj.container.find('.srcTbl li').eq(0).click();
        }

        globalParam.fromJson = fromJson;
        globalParam.toHdfsJson = toHdfsJson;
        globalParam.toHiveJson = toHiveJson;
        globalParam.toDbJson = toDbJson;

        if (globalParam.targetType != globalParam.commonLinkType.hdfs) {
            $('.stepCon').animate({'margin-left': '-200%'}, 250, function () {
                $('.stepCon .item.item1, .stepCon .item.item2').height('200');
                $('.stepCon .item.item3').height('auto');
            });
            $('.processCon .itemCon').removeClass('cur').eq(2).addClass('cur');
        }
        else {
            $('.stepCon').animate({'margin-left': '-300%'}, 250, function () {
                $('.stepCon .item.item1, .stepCon .item.item2, .stepCon .item.item3').height('200');
                $('.stepCon .item.item4').height('auto');
            });
            $('.processCon .itemCon').removeClass('cur').eq(3).addClass('cur');
        }

        $('html, body').animate({scrollTop:0},200);
    }).always(function(){
        $('#waitLoading').css({display:'none'});
    }) ;
});

function getColumnBatch(param){
    var defer = $.Deferred(),
        tableArr = JSON.parse( param.tablesJsonStr ) ;
    if ( tableArr.length == 0 ){
        return defer.resolve();
    }

    $.ajax({
        url: 'db/table/columns/batch',
        data: param,
        success: function(data){
            if ( data.code != 200 ){
                ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                defer.reject();
                return ;
            }
            var errMsg = null;
            data.model.map(function(v, i){
                if (v.code != 200 ){
                    errMsg = v ;
                    return ;
                }

                if ( !tableArr[i].ddl )
                    globalParam.columnObjMap['param_'+param.dbId+'_'+ tableArr[i].catalog+'_'+tableArr[i].schema+'_'+tableArr[i].tableName] = v.model;
                else {
                    globalParam.columnObjMap['param_'+tableArr[i].ddl] = v.model;
                }
            });
            if ( errMsg ){
                ErrTip(errMsg.i18nMsg.title, errMsg.i18nMsg.detail, errMsg.msg);
                defer.reject();
            }
            defer.resolve();
        },
        error: function(){
            defer.reject();
        }
    }) ;
    return defer.promise();
}

function checkHdfs(param) {
    var fileName = param.fileName || '';
    if(!fileName || fileName.split('/').length <= 1) {
        return false;
    }
    return true;
}

function sqlEdiotrModule(){
    this.editorContainer = $('.item2 .rightSide.sqlQuery');
    this.configContainer = $('.item2 .config.sqlQuery');
    this.globalConfig = $('.global-ConfigCon');
    this.event();
}
sqlEdiotrModule.prototype = {
    event: function(){
        var _this = this;
        this.editorContainer.on('click', '.preView', function(){
            var sql = (SQLEditor.getValue()).replace(/\n+/g, ' ').trim();
            if ( sql == '' ){
                MsgTip('info', common_js_lang['db.info.sqlEmpty']);
                return ;
            }
            var self = $(this);
            self.prop('disabled', true);

            $('.rightSide.sqlQuery .preshow').show();
            $('.sqlQuery .fieldList').html('<div class="queryMask">'+common_js_lang['db.text.queryMask']+'</div>');

            $.when( _this.sqlPreView({dbId:globalParam.sourceId, pid:$('#userApp').val(), sql:sql})).then(function(data){
                $('.sqlQuery .fieldList').html(template('template/colFields', data.model));
            }).fail(function(){
                $('.rightSide.sqlQuery .preshow').hide();
            }).always(function(){
                self.prop('disabled', false);
            });
        });

        this.configContainer.on('click', '.hdfs .scan', function(){
            var tarDir = _this.configContainer.find('.hdfs .selectedDir').val() || '',
                tarName = _this.configContainer.find('.hdfs .fileName').val() || '' ;
            _this.sqlHdfsConfig({tarDir:tarDir, tarName:tarName});
        });
    },
    hiveParamCheck: function(){
        var toHiveJson = [],
            toDbJson = [],
            fromJson = [];

        var sql = (SQLEditor.getValue()).replace(/\n+/g, ' ').trim();
        if ( sql == '' ){
            MsgTip('info', common_js_lang['db.info.sqlEmpty']);
            return ;
        }
        fromJson.push({id:globalParam.sourceId, sql:sql, mtype:3, tableName:'*'});

        var dbDom = this.configContainer.find("#dbName option:selected"),
            catalog = dbDom.attr('data-catalog') || '',
            schema = dbDom.attr('data-schema') || '',
            name = dbDom.text(),
            tableName = this.configContainer.find('#tableName').val(),
            tableType = this.configContainer.find('.tableType').val(),
            partition = this.savePart(),
            sql = SQLeditor.doc.getValue().trim();
        if ( [name, tableName, sql].indexOf('') > -1 ){
            MsgTip('info', common_js_lang['s3.info.configParam']);
            return ;
        }
        var param = {dbId:globalParam.targetId, name:name, catalog:catalog,schema:schema,tableName:tableName,tableType:tableType};
        SQLeditor.doc.cm.isReadOnly() ? param.ddl = sql : param.createSql = sql;
        partition ? param.partition = JSON.stringify( partition ) : '';
        [globalParam.commonLinkType.hive, globalParam.commonLinkType.spark].indexOf(globalParam.targetType) > -1 ? toHiveJson.push(param) : toDbJson.push(param);

        var _this = this;
        var columnDefer = $.Deferred();
        var _param = param.ddl ? {catalog:param.catalog, schema:param.schema, tableName:param.tableName} : {ddl:param.createSql,tableName:param.tableName} ;
        $('#waitLoading').find('article').html('<p>'+common_js_lang['db.tip.waitColumn']+'</p><p class="detail"></p>').end().css({display:'block'});
        $.when( _this.getSqlColumn({dbId:globalParam.sourceId, sql:fromJson[0].sql, pid:$('#userApp').val()}), getColumnBatch({dbId:globalParam.targetId, tablesJsonStr: JSON.stringify([_param])}) )
            .then(function(data){
                columnDefer.resolve();
            }).fail(function(){
            $('#waitLoading').hide();
        }) ;

        $.when(columnDefer).done(function() {
            var preToJson = [globalParam.commonLinkType.hive, globalParam.commonLinkType.spark].indexOf(globalParam.targetType) > -1 ? globalParam.toHiveJson : globalParam.toDbJson,
                nowToJson = [globalParam.commonLinkType.hive, globalParam.commonLinkType.spark].indexOf(globalParam.targetType) > -1 ? toHiveJson : toDbJson;

            globalParam.curTableColumnsMap = columnMapObj.diffTableColumnsMap({fromJson:globalParam.fromJson, toJson:preToJson}, {fromJson:fromJson, toJson:nowToJson});
            columnMapObj.setSrcList(fromJson, nowToJson);
            columnMapObj.container.find('.srcTbl li').eq(0).click();

            globalParam.fromJson = fromJson;
            globalParam.toHiveJson = toHiveJson;
            globalParam.toDbJson = toDbJson;

            $('.stepCon').animate({'margin-left': '-200%'}, 250, function () {
                $('.stepCon .item.item1, .stepCon .item.item2').height('200');
                $('.stepCon .item.item3').height('auto');
            });
            $('.processCon .itemCon').removeClass('cur').eq(2).addClass('cur');
            $('html, body').animate({scrollTop:0},200);
        }).always(function(){
            $('#waitLoading').css({display:'none'});
        }) ;
    },
    hdfsParamCheck: function(){
        var toHdfsJson = [],
            fromJson = [];

        var sql = (SQLEditor.getValue()).replace(/\n+/g, ' ').trim();
        if ( sql == '' ){
            MsgTip('info', common_js_lang['db.info.sqlEmpty']);
            return ;
        }
        fromJson.push({id:globalParam.sourceId, sql:sql});

        var dir = this.configContainer.find('.hdfs .selectedDir').val().trim() || '',
            name = this.configContainer.find('.hdfs .fileName').val().trim() || '' ;
        name = name.slice(0, 60);
        if(!dir || !name) {
            MsgTip('', common_js_lang['local.info.fileDir'], 'info');
            return false;
        }
        if ( name.match(/\s+|\\+/g) ){
            MsgTip('', common_js_lang['local.info.fileName'], 'info');
            return false;
        }
        var fileName = (dir+'/'+name).replace(/\/+/g, '/');
        toHdfsJson.push({hid:globalParam.targetId, fileName:fileName});

        globalParam.fromJson = fromJson;
        globalParam.toHdfsJson = toHdfsJson;
        $('.stepCon').animate({'margin-left': '-300%'}, 250, function () {
            $('.stepCon .item.item1, .stepCon .item.item2, .stepCon .item.item3').height('200');
            $('.stepCon .item.item4').height('auto');
        });
        $('.processCon .itemCon').removeClass('cur').eq(3).addClass('cur');
        $('html, body').animate({scrollTop:0},200);
    },
    sqlHdfsConfig: function(param){
        this.globalConfig.find('.replace-tag').hide();
        this.globalConfig.find('.configTab a').removeClass('cur').eq(1).hide();
        this.globalConfig.show();
        $('.global-mask').show();

        if ( param.tarName ){    //
            var curPath = param.tarDir || '',
                name = param.tarName || '';
        }
        else {        // 编辑任务的情况， 没有tarName参数
            var curPath = param.fileName || '',
                name = '';
            if(curPath) {
                var name = curPath.split('/').slice(-1).join('/'),
                    curPath = curPath.split('/').slice(0,-1).join('/') || curPath.match(/\//g) && '/';
            }
        }

        this.globalConfig.find('.hdfsTab p .check').removeClass('cur');
        this.globalConfig.find('.hdfsTab p .show').removeClass('in');

        this.globalConfig.find('.hdfsTab .ul:not(:first-child)').hide();
        this.globalConfig.find('.hdfsTab .selectedDir').val(curPath).attr('title', curPath);
        this.globalConfig.find('.hdfsTab .fileName').val(name);

        if(curPath) {
            var target = this.globalConfig.find('.hdfsTab [data-base="' + curPath + '"]');
            if(target.length == 1) {
                target.find('>p .check').addClass('cur');
                target.parents('.ul').fadeIn().siblings('p').find('.show').addClass('in');
            }
        }
    },
    sqlSaveHdfs: function(data){
        this.configContainer.find('.hdfs .selectedDir').val(data.tarDir).attr('title', data.tarDir);
        this.configContainer.find('.hdfs .fileName').val(data.tarName);
        this.globalConfig.hide();
        $('.global-mask').hide();
    },
    sqlPreView: function(param){
        var defer = $.Deferred();
        $.ajax({
            url: 'db/sql/query',
            data: param,
            success: function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    defer.reject();
                    return ;
                }
                defer.resolve(data);
            },
            error: function(){
                defer.reject();
            }
        });

        return defer.promise();
    },
    getSqlColumn: function(param){
        var defer = $.Deferred();
        $.ajax({
            url: 'db/sql/cols',
            data: param,
            success: function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    defer.reject();
                    return ;
                }

                if ( !globalParam.columnObjMap['param_'+param.sql] ){
                    globalParam.columnObjMap['param_'+param.sql] = data.model;
                }
                defer.resolve(data);
            },
            error: function(){
                defer.reject();
            }
        });

        return defer.promise();
    },
    savePart: function(){
        var partitions = this.configContainer.find('#partitions .filedVal'),
            partitionItems = {} ;
        if ( partitions.length <= 0 )
            return '';

        for(var i = 0, length = partitions.length; i < length; i++) {
            partitionItems[partitions.eq(i).attr('data-type')] = partitions.eq(i).val().trim();
        }

        return partitionItems;
    },
    reset: function(param){
        var _this = this;
        $.when( globalParam.promiseFunc.getDb({id:param.dbId, pid:$('#userApp').val()}) ).then(function(data) {
            var dbList = '<option value="" disabled>'+common_js_lang['local.option.getDb']+'</option>';
            data.databases.map(function(v) {
                dbList += '<option data-catalog="' + v.catalog + '" data-schema="' + v.schema + '">' + v.name + '</option>';
            });
            hiveModule.container.find('#dbName').html(dbList).val('').select2();
            sqlHiveModule.container.find('#dbName').html(dbList).val('').select2();
            $("#batch-dbName").html(dbList).val('').select2();

            var tableList = '<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option>';
            globalParam.connId = param.dbId ;
            globalParam.targetId = param.dbId;
            globalParam.tmpAppId = $('#userApp').val();

            _this.configContainer.find('#dbName').val(param.name).select2();
        });
        $.when( globalParam.promiseFunc.getTables(param)).then(function(data){
            var tableList = '<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option>';
            data.map(function(v) {
                tableList += '<option>' + v + '</option>';
            });
            _this.configContainer.find("#tableName").html(tableList).val(param.tableName).select2({tags:true});
        });
        sqlHiveModule.getDdlAct(param, 4);
    }
}

var sqlEdiotrModule = new sqlEdiotrModule();
sqlModuleReset();
function sqlModuleReset() {
    if(globalParam.jobId <= 0) return;

    if (jobOtherParams.srcType == 3) {
        SQLEditor.setValue(jobOtherParams.fromList[0].sql);  //sql
        var target = globalParam.editJobModel.toType == 8 ? jobOtherParams.toHdfsList[0] : [9, 13].indexOf(+globalParam.editJobModel.toType) > -1 ? jobOtherParams.toHiveList[0] : jobOtherParams.toDbList[0];
        if (globalParam.editJobModel.toType == 8) {
            var path = target.fileName.split('/').slice(0, -1).join('/') || '/',
                name = target.fileName.split('/').slice(-1)[0];
            $('.config.sqlQuery .selectedDir').val(path).attr('title', path);
            $('.config.sqlQuery .fileName').val(name);
        }
        else {
            if (target.partition) {
                var partArr = target.partition.split(','),
                    partObj = {};
                partArr.map(function (v) {
                    var tmpArr = v.split('=');
                    partObj[tmpArr[0]] = tmpArr[1].replace(/^\'|\'$/g, '');
                });
                target.partition = JSON.stringify(partObj);
            }
            target.sql = jobOtherParams.fromList[0].sql;
            $('.config.sqlQuery .tableType').val(target.tableType);
            var format = $('.config.sqlQuery .tableType option:selected').text();
            target.format = format;
            globalParam.targetId = target.dbId;
            sqlEdiotrModule.reset(target);
        }
    }
}


function columnMapModule(){
    this.container = $('.stepCon .item.item3');
    this.event();
}

columnMapModule.prototype = {
    event: function() {
        this.columnEvent();
        this.dataDealEvent();
        this.funcItemEvent() ;
    },
    columnEvent: function(){
        var _this = this;
        //表切换
        _this.container.on('click', '.srcTbl li', function(){
            var self = $(this);
            var item = _this.container.find('.column-list .item.cur');
            var columnsMap = item.attr('columnsMap') || '';
            try {
                var existFun = JSON.parse(columnsMap).funList.length > 0;
            } catch(e) {
                var existFun = false;
            }

            if ( !existFun && _this.container.find('.dataDeal').css('display') !== 'none' && _this.container.find('.dataDeal .itemConfig .item-type:not(".src,.tar")').length > 0 ){
                swal({
                    title:'',
                    text: common_js_lang['token.tip.saveAllConfig'],
                    type: 'info',
                    showCancelButton: true
                }, function(isConfirm){
                    if ( isConfirm && _this.saveAllConfig() ) {
                        toggleTbl() ;
                    }
                    if ( !isConfirm ){
                        toggleTbl() ;
                    }
                });
            }
            else {
                toggleTbl() ;
            }

            function toggleTbl() {
                if ( self.hasClass('cur') )
                    return;

                _this.saveCurTblMap(_this.container.find('.srcTbl .cur'));  //保存当前的table配置
                self.addClass('cur').siblings().removeClass('cur');
                _this.container.find('.dataDeal').hide();

                //展示表的默认字段顺序映射
                var srcParam = JSON.parse(self.attr('data-source')),
                    tarParam = JSON.parse(self.attr('data-target'));

                var srcModel = srcParam.mtype == 3 ? globalParam.columnObjMap['param_'+srcParam.sql] : globalParam.columnObjMap['param_' + srcParam.id + '_' + srcParam.catalog + '_' + srcParam.schema + '_' + srcParam.tableName],
                    tarModel = globalParam.columnObjMap['param_' + (tarParam.createSql ? tarParam.createSql : tarParam.dbId + '_' + tarParam.catalog + '_' + tarParam.schema + '_' + tarParam.tableName)];
                _this.setData(srcModel, tarModel);
                _this.indexMapAct();
                _this.resetCurTblMap(self);  //回显当前配置
            }
        });

        //字段清洗配置
        _this.container.on('click', '.column-list .linkDeal, .column-list .right', function() {
            var item = $(this).parent();
            _this.container.find('.dataDeal .itemConfig .funcCon').hide();   //隐藏函数配置框
            var columnsMap = _this.container.find('.column-list .item.cur').attr('columnsMap') || '';
            try {
                var existFun = JSON.parse(columnsMap).funList.length > 0;
            } catch(e) {
                var existFun = false;
            }

            //有函数组件而且当前字段没有保存函数funList
            if ( !existFun && _this.container.find('.dataDeal').css('display') !== 'none' && _this.container.find('.dataDeal .itemConfig .item-type:not(".src,.tar")').length > 0 ){
                swal({
                    title:'',
                    text: common_js_lang['token.tip.saveAllConfig'],
                    type: 'info',
                    showCancelButton: true
                }, function(isConfirm){
                    if ( isConfirm && _this.saveAllConfig() ) {
                        configToggle();
                    }
                    if ( !isConfirm ){
                        configToggle();
                    }
                });
            }
            else {
                configToggle();
            }

            function configToggle() {
                if (!item.hasClass('cur')) {
                    item.addClass('cur').siblings().removeClass('cur');
                    _this.clearSvg();

                    //显示配置
                    var columnsMap = item.attr('columnsMap') || '';
                    var link = item.find('.linkDeal');
                    if (link.hasClass('none')) {   //没有源数据
                        item.find('.left select').val('').change();
                        _this.container.find('.itemConfig').prepend(_this.getItemDom('tar'));
                    }
                    else {
                        if ( !columnsMap ) { //默认源数据，初始显示
                            _this.container.find('.itemConfig').prepend(_this.getItemDom('src'));
                            _this.container.find('.itemConfig').prepend(_this.getItemDom('tar'));
                            var srcDom = _this.container.find('.itemConfig .src .right'),
                                tarDom = _this.container.find('.itemConfig .tar .left');
                            _this.linkPoint(srcDom, tarDom);
                        }
                        else {  //回显配置
                            var columnsMap = JSON.parse(columnsMap),
                                configCon = _this.container.find('.itemConfig');
                            columnsMap.svgParam = columnsMap.svgParam || [];
                            if (columnsMap.svgParam.length == 0) {
                                _this.container.find('.itemConfig').prepend(_this.getItemDom('src'));
                                _this.container.find('.itemConfig').prepend(_this.getItemDom('tar'));
                                var srcDom = _this.container.find('.itemConfig .src .right'),
                                    tarDom = _this.container.find('.itemConfig .tar .left');
                                _this.linkPoint(srcDom, tarDom);
                            }

                            for (var i = 0, len = columnsMap.svgParam.length; i < len; i++) {
                                var svg = columnsMap.svgParam[i],
                                    tar = svg.tar,
                                    src = svg.src,
                                    type = svg.type;

                                var dom = _this.getItemDom(type).css({left: svg.left + 'px', top: svg.top + 'px'});
                                configCon.prepend(dom);
                                if (['src', 'tar'].indexOf(type) == -1) {  //如果是函数组件
                                    dom.show().attr('data-param', JSON.stringify(columnsMap.funList[0]));
                                }

                                if (tar) {
                                    dom.find('.point.' + tar.pos).addClass('link-target').attr('data-link-target', tar.time);
                                }
                                if (src) {
                                    dom.find('.point.' + src.pos).addClass('link-source').attr('data-link-source', src.time);
                                    var srcDom = dom.find('.point.link-source'),
                                        tarDom = configCon.find('.point.link-target[data-link-target="' + src.time + '"]');
                                    _this.linkPoint(srcDom, tarDom, src.time);
                                }
                            }
                        }
                    }
                    _this.container.find('.dataDeal').show();
                }
                else {
                    item.removeClass('cur');
                    _this.container.find('.dataDeal').hide();
                }
            }
        });

        //源字段变化
        var preVal = '' ;
        _this.container.on('select2:open', '.column-list .src', function(e, force){
            preVal = $(this).val() ;
        })
            .on('change', '.column-list .src', function(e, force){
                force = force || false ;
                var self = $(this);
                var columnParam = self.parents('.column-list .item').attr('columnsMap') || '' ;
                if ( !force && columnParam ){
                    swal({
                        title:'',
                        text: common_js_lang['token.tip.changeSrc'],
                        type:'info',
                        showCancelButton: true
                    }, function(isConfirm){
                        if ( isConfirm ){
                            funcAct() ;
                        }
                        else {
                            self.val(preVal).columnSelectFormat();
                        }
                    });
                }
                else {
                    funcAct() ;
                }

                function funcAct() {
                    var option = self.find('option:selected'),
                        val = (option.val() || '').trim(),
                        linkDom = self.parent().siblings('.linkDeal'),
                        type = option.attr('data-typename'),
                        tarType = self.parent().siblings('.right').find('span:last-child').text();
                    var item = self.parents('.column-list .item');
                    item.attr('columnsMap', '');
                    if ( item.hasClass('cur') ){
                        item.removeClass('cur');
                        _this.container.find('.dataDeal').hide();
                    }

                    linkDom.html('');
                    if ( val === '' ) {
                        linkDom.addClass('none');
                    }
                    else if ( type.toLowerCase() != tarType.toLowerCase() ){
                        linkDom.removeClass('none half');
                        self.siblings('.select2').find('.columnInfo span').eq(1).addClass('red');
                    }
                    else {
                        linkDom.removeClass('none half');
                        self.siblings('.select2').find('.columnInfo span').eq(1).removeClass('red');
                    }
                }
            });



        //清空配置  按字段名映射  按顺序映射
        _this.container.on('click', '.topbar .empty', function(){
            swal({
                title:'',
                text: common_js_lang['token.tip.emptyConfig'],
                type:'info',
                showCancelButton: true
            }, function(){
                _this.container.find('.column-list .src').val('').trigger('change', true);
            });
        });

        _this.container.on('click', '.topbar .name', function(){
            _this.container.find('.column-list .item').map(function(i, v){
                var tarName = $(v).find('.right .name').text() ;
                $(v).find('.left select').val( tarName).change() ;
            });
        });

        _this.container.on('click', '.topbar .index', function() {
            _this.indexMapAct();
        });
    },
    dataDealEvent: function(){
        var _this = this;
        _this.container.on('click', '.itemList .type', function(){
            if ( $(this).hasClass('in') ) {
                $(this).removeClass('in');
                $(this).siblings('ul').slideDown();
            }
            else {
                $(this).addClass('in');
                $(this).siblings('ul').slideUp();
            }
        });

        var deleteDom = null;
        $('.mapConfig-delete').on('mouseout', function(){
            $(this).hide();
            deleteDom = null;
        }) ;

        $('.mapConfig-delete').on('click', function(){
            $(this).hide();
            _this.deleteItem( deleteDom );
        });

        //右键点击
        _this.container.on('contextmenu', '.itemConfig .item-type, .itemConfig path', function(e){
            try {
                if (e.target.className.indexOf('src') > -1 || e.target.className.indexOf('tar') > -1) {
                    return false;
                }
            } catch(e){

            }

            $('.mapConfig-delete').css({left:(e.pageX-20)+'px', top:(e.pageY-10)+'px'}).show();
            deleteDom = $(this);
            return false;
        });

        _this.container.on('mouseover', '.itemConfig .item-type, .itemConfig path', function() {
            console.log('mouseover');
            var self = $(this);
            $('body').on('keyup', function(e){
                if ( e.which == 46 ){
                    if ( self.hasClass('src') || self.hasClass('tar') ) {
                        return ;
                    }
                    _this.deleteItem( self );
                    console.log('del');
                }
            });
        });
        _this.container.on('mouseout', '.itemConfig .item-type, .itemConfig path', function(e) {
            $('body').off('keyup');
        });

        _this.container.on('click', '.itemConfig', function(e){
            if ( e.target.nodeName.toLowerCase() === 'svg' ){   //点击空白，收起右侧配置层
                _this.container.find('.funcCon').hide() ;
            }
        });

        //控件列表选择控件
        _this.container.on('mousedown', '.itemList .group [item-type]', function(e){
            $('body').addClass('drag');
            var offsetX = _this.getPageXPad(),
                offsetY = _this.getPageYPad() ;

            var type = $(this).attr('item-type'),
                item = _this.container.find('.itemCon .item-type'+'-'+type) ;
            var x = e.pageX - offsetX,
                y = e.pageY - offsetY ;
            item.css({left: (x-50)+'px', top:(y-20)+'px'}).show();

            $(document).on('mousemove', function(e){
                x = e.pageX - offsetX;
                y = e.pageY - offsetY;
                item.css({left: (x-50)+'px', top:(y-20)+'px'});
            });

            $(document).on('mouseup', function(e){
                $('body').removeClass('drag');
                $(document).off();

                var svgScale = _this.getSvgScale();
                if ( (x-200-50) < -50 || y-20 < 10 || y-20 > svgScale.y-20 || (x-200-50) > svgScale.x-50 ) {  //限定一个有效范围
                    item.hide();
                    return;
                }
                item.css({left: (x-200 - 50)+'px', top:(y-20)+'px'});
                _this.container.find('.itemConfig').prepend( item.clone() );
                item.hide();
            });
        });

        //配置框控件拖拽
        _this.container.on('mousedown', '.itemConfig .item-type', function(e){
            if ( e.which == 3 ){  //过滤鼠标右键click
                return false;
            }
            $('body').addClass('drag');

            //拖拽移动
            var item = $(this),
                left = +item.css('left').slice(0,-2),
                top = +item.css('top').slice(0, -2),
                initX = e.pageX,
                initY = e.pageY ;

            //区分拖拽和click
            var moveCount = 0;  //大于3，认为是拖拽

            $(document).on('mousemove', function(e){
                var x = e.pageX - initX ,
                    y = e.pageY - initY;

                var tempX = left + x,
                    tempY = top + y,
                    svgScale = _this.getSvgScale() ;
                tempX < -50 ? tempX = -50 : '';
                tempX > svgScale.x - 50 ? tempX = svgScale.x - 50 : '';
                tempY < 10 ? tempY = 10 : '';
                tempY > svgScale.y - 20 ? tempY = svgScale.y - 20 : '';
                item.css({left:tempX+'px', top:tempY+'px'});
                moveCount ++ ;

                //连线变动
                var sourcePoint = item.find('.point.link-source'),
                    targetPoint = item.find('.point.link-target') ;
                if ( sourcePoint.length == 1 ){
                    var time = sourcePoint.attr('data-link-source'),
                        tarDom = _this.container.find('.point.link-target[data-link-target="'+time+'"]'),
                        path = _this.container.find('path.'+time) ;
                    var points = _this.calcBezierPoints( _this.getPointXY(sourcePoint), _this.getPointXY(tarDom) );
                    path.attr('d', 'M'+points[0].x+','+points[0].y+' C'+points[1].x+' '+points[1].y+' '+points[2].x+' '+points[2].y+' '+points[3].x+' '+points[3].y);
                }

                if ( targetPoint.length == 1 ){
                    var time = targetPoint.attr('data-link-target'),
                        srcDom = _this.container.find('.point.link-source[data-link-source="'+time+'"]'),
                        path = _this.container.find('path.'+time) ;
                    var points = _this.calcBezierPoints( _this.getPointXY(srcDom), _this.getPointXY(targetPoint) );
                    path.attr('d', 'M'+points[0].x+','+points[0].y+' C'+points[1].x+' '+points[1].y+' '+points[2].x+' '+points[2].y+' '+points[3].x+' '+points[3].y);
                }
            });

            $(document).on('mouseup', function(e){
                $('body').removeClass('drag');
                if ( moveCount > 3 ){  //拖拽
                }
                else {  //click
                    item.addClass('cur').siblings('.item-type').removeClass('cur');
                    if ( !item.hasClass('src') && !item.hasClass('tar') ) {   //回显函数配置
                        var type = item.attr('class').split(' ')[1],
                            funcCon = _this.container.find('.funcCon').show();
                        var param = item.attr('data-param') ? JSON.parse( item.attr('data-param') ) : '';
                        _this.resetItemParam(param, type);
                        funcCon.find('.' + type).addClass('cur').siblings().removeClass('cur');
                    }
                }
                $(document).off();
            });
        });

        //连线
        _this.container.on('mousedown', '.itemConfig .item-type .point', function(e) {
            var item = $(this).parent();

            //组件作为连接源判断
            if ( item.find('.link-source').length == 1 || item.hasClass('tar') ){
                return ;
            }

            $('body').addClass('drag');
            var time = Date.now(),
                svgCon = _this.container.find('.svgCon') ;

            var path = $(document.createElementNS('http://www.w3.org/2000/svg', 'path'));  // svgDom
            path.attr({stroke:'#ccc', fill:'transparent', class:time, 'marker-end':'url(#markerArrow)'});
            svgCon.find('svg').append(path);

            var item = $(this),
                pointXY = _this.getPointXY(item),
                pointX = pointXY.x,
                pointY = pointXY.y,
                initX = e.pageX,
                initY = e.pageY ;

            item.parent().addClass('mousedown');
            $(document).on('mousemove', function(e){
                path.attr('d', 'M'+pointX+','+pointY+' L'+ (e.pageX-initX+pointX)+','+ (e.pageY-initY+pointY));
            });

            _this.container.on('mouseover', '.itemConfig .item-type', function(e) {
                $(this).addClass('link');
            }).on('mouseout', '.itemConfig .item-type', function(e) {
                $(this).removeClass('link');
            });

            $(document).on('mouseup', function(e){
                if ( !$(e.target).hasClass('point') ) {
                    path.remove();
                }
                else {
                    var typeDom = $(e.target).parent(),
                        typeIndex = +typeDom.attr('class').split(' ')[1].slice(-1) || 0;

                    if ( typeDom.find('.link-target').length == 1 || typeDom.hasClass('src') || typeIndex > 5 ){
                        path.remove();
                    }
                    else {
                        var points = _this.calcBezierPoints({x: pointX, y: pointY}, _this.getPointXY($(e.target)));
                        path.attr('d', 'M' + pointX + ',' + pointY + ' C' + points[1].x + ' ' + points[1].y + ' ' + points[2].x + ' ' + points[2].y + ' ' + points[3].x + ' ' + points[3].y);

                        item.addClass('link-source').attr('data-link-source', time);
                        $(e.target).addClass('link-target').attr('data-link-target', time);
                    }
                }

                $('body').removeClass('drag');
                _this.container.find('.item-type.link').removeClass('link');
                _this.container.off('mouseover mouseout', '.itemConfig .item-type');

                item.parent().removeClass('mousedown');
                $(document).off();
            });
            return false;
        });

        //关闭函数框
        _this.container.on('mousedown', '.funcCon .cancel', function(e) {
            _this.container.find('.funcCon').hide();
        });
        //保存函数组件参数
        _this.container.on('mousedown', '.funcCon .save .btn-item', function(e){
            var curItem =_this.container.find('.itemConfig .item-type.cur'),
                type = curItem.attr('class').split(' ')[1] ;
            var param = _this.saveItemParam(type);
            if ( !param ) return ;
            curItem.attr('data-param', JSON.stringify(param));
            _this.container.find('.funcCon').hide();
        });

        //保存整个配置
        _this.container.on('click', '.saveConfig span', function(){
            if ( _this.saveAllConfig() ){
                MsgTip('success', common_js_lang['token.tip.saveSucc']);
            }
        });
    },
    deleteItem: function(deleteDom){
        var _this = this;
        deleteDom.remove();
        if ( deleteDom.hasClass('item-type') ){  //删除控件
            var surDom = deleteDom.find('.point.link-source'),
                tarDom = deleteDom.find('.point.link-target') ;
            if ( surDom.length == 1 ){
                var time = surDom.attr('data-link-source');
                _this.container.find('.point.link-target[data-link-target="'+time+'"]').attr('data-link-target', '').removeClass('link-target') ;
                _this.container.find('path.'+time).remove();
            }

            if ( tarDom.length == 1 ){
                var time = tarDom.attr('data-link-target');
                _this.container.find('.point.link-source[data-link-source="'+time+'"]').attr('data-link-source', '').removeClass('link-source') ;
                _this.container.find('path.'+time).remove();
            }
        }
        else {    //删除连线
            var time = deleteDom.attr('class'),
                surDom = _this.container.find('.point[data-link-source="'+time+'"]'),
                tarDom = _this.container.find('.point[data-link-target="'+time+'"]') ;
            surDom.attr('data-link-source', '').removeClass('link-source');
            tarDom.attr('data-link-target', '').removeClass('link-target');
        }
    },
    saveAllConfig: function() {
        var _this = this;

        //组件连线检查
        var items = _this.container.find('.itemConfig .item-type');
        for ( var i= 0, len=items.length; i<len; i++ ) {
            var item = items.eq(i);
            if ( item.hasClass('src') ) {  //源
                if (item.find('.point.link-source').length <= 0) {
                    MsgTip('info', common_js_lang['token.tip.srcLinkErr']);
                    return false;
                }
            }
            else if ( item.hasClass('tar') ){  //目标
                if ( item.find('.point.link-target').length <= 0 ){
                    MsgTip('info', common_js_lang['token.tip.tarLinkErr']);
                    return false;
                }
            }
            else {
                var type = item.attr('class').split(' ')[1],
                    info = _this.typeMapInfo( type ) ;
                if ( info.type == 'deal' ) {  //dataDeal func
                    if ( item.find('.point.link-source').length <= 0 || item.find('.point.link-target').length <= 0 ){
                        MsgTip('info', common_js_lang['token.tip.handelFuncErr']);
                        return false;
                    }
                }
                else if ( info.type == 'add' ) {  //addData func
                    if (item.find('.point.link-source').length <= 0) {
                        MsgTip('info', common_js_lang['token.tip.addFuncErr']);
                        return false;
                    }
                }
            }
        }

        var srcDom = _this.container.find('.itemConfig .item-type.src'),
            tarDom = _this.container.find('.itemConfig .item-type.tar'),
            time = tarDom.find('.point.link-target').attr('data-link-target'),
            item = _this.container.find('.itemConfig .point[data-link-source="' + time + '"]').parent();
        if ( item.length <= 0 ) {
            MsgTip('info', common_js_lang['token.tip.srcErr']);
            return false;
        }

        var svgParam = [];  //逆序存储
        svgParam.push(_this.getItemSvgParam(tarDom));
        if (item.hasClass('src')) {  //没有清洗组件
            var param = '';
        }
        else {    //清洗组件
            var param = item.attr('data-param') || '';
            if (!param) {
                MsgTip('info', common_js_lang['token.tip.paramErr']);
                return false;
            }
            param = JSON.parse(param);
            svgParam.push(_this.getItemSvgParam(item));
        }
        svgParam.push(_this.getItemSvgParam(srcDom));

        var tarItem = _this.container.find('.column-list .item.cur'),
            srcDom = tarItem.find('.left select'),
            tarDom = tarItem.find('.right');

        if ( param ){ //函数图标
            var type = param.type,
                info = _this.typeMapInfo( type ) ;
            tarItem.find('.linkDeal').html('<span class="item-icon item-icon'+(info.icon.slice(-1))+'"></span>');
        }
        else {
            tarItem.find('.linkDeal').html('');
        }
        var srcObj = srcDom.val() == '' ? '' : JSON.parse(decodeURIComponent(srcDom.find('option:selected').attr('data-obj'))),
            tarObj = JSON.parse(decodeURIComponent(tarDom.attr('data-obj')));
        tarItem.attr('columnsMap', JSON.stringify({srcColumn: srcObj, funList: param ? [param] : [], tarColumn: tarObj, svgParam: svgParam}));
        return true;
    },
    funcItemEvent: function(){
        var _this = this;
        var funcCon = _this.container.find('.dataDeal .funcCon');

        funcCon.on('click', '.item-type-replace a', function(){
            funcCon.find('.item-type-replace tbody').append('<tr><td><input class="old" type="text"></td><td><input class="new" type="text"></td></tr>');
        });

        funcCon.on('click', '.item-type-filterFunc label', function(){
            if ( $(this).find('.radio.cur').length == 1 )
                return ;
            $(this).parent().find('.radio').removeClass('cur');
            $(this).find('.radio').addClass('cur');
        });
    },
    getItemSvgParam: function(item){
        var type = item.attr('class').split(' ')[1],
            left = item.css('left').slice(0, -2),
            top = item.css('top').slice(0, -2),
            tarLink = item.find('.point.link-target'),
            srcLink = item.find('.point.link-source') ;

        var param = {type: type, left:left, top:top} ;
        if ( tarLink.length == 1 ){
            var time = tarLink.attr('data-link-target'),
                pos = tarLink.attr('class').split(' ')[0] ;
            param.tar = {time:time, pos:pos} ;
        }
        if ( srcLink.length == 1 ){
            var time = srcLink.attr('data-link-source'),
                pos = srcLink.attr('class').split(' ')[0] ;
            param.src = {time:time, pos:pos} ;
        }
        return param ;
    },
    saveItemParam: function(type){
        if ( type == 'item-type-replace' ){
            var funcCon = this.container.find('.dataDeal .funcCon'),
                trs = funcCon.find('.item-type-replace tbody tr'),
                params = [] ;

            for ( var i= 0,len=trs.length; i<len; i++ ){
                var oldChar = trs.eq(i).find('.old').val() || '',
                    newChar = trs.eq(i).find('.new').val() || '' ;

                if ( oldChar == '' ) continue ;
                params.push( {oldChar:oldChar, newChar:newChar} );
            }
            if ( params.length <= 0 ){
                MsgTip('info', '请至少填写一对替换字符');
                return ;
            }

            return {
                type: 'item-type-replace',
                name: 'ReplaceString',
                params: params
            }
        }
        else if ( type == 'item-type-replaceEnter' ){
            var contentDom = this.container.find('.funcCon .item-type-replaceEnter');
            return {
                type: 'item-type-replaceEnter',
                name: 'ReplaceEnter',
                params: [{newChar:contentDom.find('select').val()}]
            }
        }
        else if ( type == 'item-type-filterFunc' ){
            var funcStr = JSFilter.getValue() ;
            if ( !funcStr ){
                MsgTip('info', '请填写JavaScript语句');
                return ;
            }

            var contentDom = this.container.find('.funcCon .item-type-filterFunc'),
                validate = contentDom.find('.radio.cur').attr('data-val') ;

            return {
                type: 'item-type-filterFunc',
                name: 'JSValidate',
                params: [{js_codes: funcStr, validate_method:validate}]
            }
        }
    },
    resetItemParam: function(param, type){
        if ( type == 'item-type-replace' ){
            var funcCon = this.container.find('.dataDeal .funcCon'),
                tbody = funcCon.find('.item-type-replace tbody') ;
            tbody.empty();
            try {
                for (var i = 0, len = param.params.length; i < len; i++) {
                    var tr = $('<tr><td><input class="old" type="text"></td><td><input class="new" type="text"></td></tr>');
                    var oldChar = param.params[i].oldChar,
                        newChar = param.params[i].newChar ;
                    tr.find('.old').val(oldChar).end().find('.new').val(newChar);
                    funcCon.find('.item-type-replace tbody').append(tr)
                }
            } catch(e) {

            }
        }
        else if ( type == 'item-type-replaceEnter' ){
            var contentDom = this.container.find('.funcCon .item-type-replaceEnter');
            try {
                contentDom.find('select').val(param.params[0].newChar) ;
            } catch(e) {
            }
        }
        else if ( type == 'item-type-filterFunc' ){
            var initCode = 'result = false; // init result \n if ( content ){ \n  // add filter code \n  result = true; \n }';
            var contentDom = this.container.find('.funcCon .item-type-filterFunc');
            try {
                var str = param.params[0].js_codes || initCode;
                JSFilter.setValue( str );
                contentDom.find('.radio').eq( +param.params[0].validate_method - 1).click();
            } catch(e) {
                JSFilter.setValue(initCode);
                contentDom.find('.radio').eq(0).click();
            }
        }
    },
    typeMapInfo: function(type){
        var map = {
            'item-type-filterFunc': {icon: 'list-icon1', type:'deal'},
            'item-type-replace': {icon: 'list-icon1', type:'deal'},
            'item-type-replaceEnter': {icon: 'list-icon2', type:'deal'},
            'item-type-trim': {icon: 'list-icon3', type:'deal'},
            'item-type-substr': {icon: 'list-icon4', type:'deal'},
            'item-type-delChar': {icon: 'list-icon5', type:'deal'},
            'item-type-timestamp': {icon: 'list-icon6', type:'add'},
            'item-type-const': {icon: 'list-icon7', type:'add'},
            'item-type-null': {icon: 'list-icon8', type:'add'}
        };

        return map[type] ;
    },
    getItemDom: function(type){
        return this.container.find('.itemCon .item-type.'+type).clone() ;
    },
    clearSvg: function(){
        this.container.find('.svgCon svg path[marker-end]').remove();
        this.container.find('.itemConfig .item-type').remove();
    },
    linkPoint: function(srcDom, tarDom, time){
        time = time || Date.now();
        var _this = this,
            svgCon = _this.container.find('.svgCon'),
            startPoint = _this.getPointXY(srcDom),
            endPoint = _this.getPointXY(tarDom) ;

        var path = $(document.createElementNS('http://www.w3.org/2000/svg', 'path'));  //svgDom
        path.attr({stroke:'#ccc', fill:'transparent', class:time, 'marker-end':'url(#markerArrow)'});
        svgCon.find('svg').append(path);

        var points = _this.calcBezierPoints(startPoint, endPoint);
        path.attr('d', 'M' + points[0].x + ',' + points[0].y + ' C' + points[1].x + ' ' + points[1].y + ' ' + points[2].x + ' ' + points[2].y + ' ' + points[3].x + ' ' + points[3].y);
        srcDom.addClass('link-source').attr('data-link-source', time);
        tarDom.addClass('link-target').attr('data-link-target', time);
    },
    calcBezierPoints: function(startPoint, endPoint, pointPercent, pointLength){
        pointLength = pointLength || 1;
        pointPercent = pointPercent || 0;
        if ( pointPercent >= 0.5 || pointPercent < 0 )   //控制点需要0-0.5
            pointPercent = 0 ;
        if ( pointLength <= 0 )        //距离长度，是两点长度的倍数
            pointLength = 1;

        var sx = startPoint.x,
            sy = startPoint.y,
            ex = endPoint.x,
            ey = endPoint.y ;
        var length = Math.sqrt( Math.pow((sx-ex), 2)+Math.pow((sy-ey), 2) ) * pointLength,
            slope = ex == sx ? null : (ey-sy) / (ex-sx) ;

        var d1x = sx + (ex-sx)*pointPercent,
            d2x = sx + (ex-sx)*(1-pointPercent),
            d1y = sy + (ey-sy)*pointPercent,
            d2y = sy + (ey-sy)*(1-pointPercent) ;

        if ( slope === null ){
            var d1 = {x: d1x-length, y:d1y}, d2 = {x:d2x+length, y:d2y} ;
        }
        else if ( slope == 0 ){
            var d1 = {x: d1x, y:d1y-length}, d2 = {x:d2x, y:d2y+length} ;
        }
        else {
            var _slope = -1 / slope,
                xLen = Math.sqrt(Math.pow(length,2)/(1+Math.pow(-1/slope,2))),
                d1 = {x:d1x+xLen, y:d1y-Math.abs(_slope*xLen)},
                d2 = {x:d2x-xLen, y:d2y+Math.abs(xLen*_slope)} ;
            if ( slope < 0 ){
                d1 = {x:d1x+xLen, y:d1y+Math.abs(_slope*xLen)};
                d2 = {x:d2x-xLen, y:d2y-Math.abs(xLen*_slope)} ;
            }
        }
        return [startPoint, d1, d2, endPoint] ;
    },
    getPointXY: function(item){
        var itemX = +item.parent().css('left').slice(0,-2),
            itemY = +item.parent().css('top').slice(0, -2),
            pointX = +item.css('left').slice(0,-2) + itemX + 5,
            pointY = +item.css('top').slice(0, -2) + itemY + 5;
        return {x:pointX, y:pointY} ;
    },
    getPageYPad: function(){
        return 131 + 460 ;   //顶部距离
    },
    getPageXPad: function(){
        //左侧距离
        return ($('body.asideToggle').length == 1 ? 60 : 239) + 20 + 220 ;
    },
    getSvgScale: function(){
        var svgCon = this.container.find('.itemConfig');
        return {x: svgCon.width(), y:svgCon.height()} ;
    },
    setSrcList: function(src, tar){
        src = src.map(function(v, i){
            v.params = JSON.stringify(v) ;
            return v;
        });
        tar = tar.map(function(v, i){
            v.params = JSON.stringify(v) ;
            return v;
        });

        var html = template('template/columnSrc', {src:src, tar:tar});
        this.container.find('.srcTbl').html(html);
    },
    setData: function(src, tar){
        this.srcModel = src;
        this.srcOptions = this.model2option(src);
        this.tarModel = tar;
    },
    addItem: function(src, tar){
        var _this = this;
        var html = $('' +
            '<div class="item">' +
            '<div class="linkDeal"></div>' +
            '<div class="left">' +
            '<select class="src"><option value=""></option>'+_this.srcOptions+'</select>' +
            '</div>' +
            '<div class="right" title="'+tar.name+' '+tar.typeName+'" data-obj='+encodeURIComponent(JSON.stringify(tar))+'>' +
            '<span class="name">'+(tar.pk ? '<i class="pk-icon"></i>':'')+tar.name+'</span>' +
            '<span class="type">'+tar.typeName+'</span>' +
            '</div>' +
            '</div>');
        html.find('.src').val(src.name);
        if ( !src )
            html.find('.linkDeal').addClass('none');

        _this.container.find('.column-list').append(html);
    },
    indexMapAct: function(){
        var _this = this;

        var srcLen =_this.srcModel.length ;
        _this.container.find('.column-list').empty();
        for ( var i= 0,len=_this.tarModel.length; i<len; i++ ){
            _this.addItem( i<srcLen ? _this.srcModel[i]:'', _this.tarModel[i] );
        }
        _this.container.find('.column-list select').columnSelectFormat();
        _this.container.find('.column-list .src').change();
    },
    saveIndexMap: function(src, tar){
        var srcLen = src.length,
            tarLen = tar.length,
            output = [] ;

        for ( var i= 0, len=(srcLen > tarLen ? tarLen : srcLen); i<len; i++ ){
            if ( tar[i].typeName.toLowerCase() === src[i].typeName.toLowerCase() ){
                output.push( {srcColumn: src[i], tarColumn:tar[i], funList:[]} );
            }
        }
        return output ;
    },
    model2option: function(model){
        var columnsOption = '';
        model.map(function(v) {
            var type = v.typeName;
            columnsOption += '<option data-obj="'+encodeURIComponent(JSON.stringify(v))+'" data-type="' + v.dataType + '" data-typeName="'+type+'">' +  v.name  + '</option>';
        });
        return columnsOption;
    },
    saveCurTblMap: function(tblDom){
        var index = tblDom.index();
        if ( index > -1 ) {
            //保存当前表的字段映射
            var items = this.container.find('.column-list .item'),
                outputColumnsMap = [];
            for (var i = 0, len = items.length; i < len; i++) {
                if (items.eq(i).find('.linkDeal').hasClass('none')) {
                    continue;
                }
                var columnsMap = items.eq(i).attr('columnsMap') || '';
                if (columnsMap) {
                    outputColumnsMap.push(JSON.parse(columnsMap));
                }
                else {
                    var src = items.eq(i).find('.left select'),
                        tar = items.eq(i).find('.right');
                    src = JSON.parse(decodeURIComponent(src.find('option:selected').attr('data-obj')));
                    tar = JSON.parse(decodeURIComponent(tar.attr('data-obj')));
                    outputColumnsMap.push({srcColumn: src, tarColumn: tar, funList: []});
                }
            }
            globalParam.curTableColumnsMap[index] = outputColumnsMap;
        }
    },
    resetCurTblMap: function(curTbl){
        var index = curTbl.index(),
            mapIndex = 0,
            items = this.container.find('.column-list .item') ;
        if ( globalParam.curTableColumnsMap[index] ){
            var length = globalParam.curTableColumnsMap[index].length ;
            for ( var i= 0,len=items.length; i<len; i++ ){
                var tarName = items.eq(i).find('.right .name').text();
                if ( mapIndex < length && globalParam.curTableColumnsMap[index][mapIndex].tarColumn.name == tarName ){
                    var srcName = globalParam.curTableColumnsMap[index][mapIndex].srcColumn.name || '';
                    items.eq(i).find('.left select').val(srcName).change();
                    if ( srcName == '' ){
                        items.eq(i).find('.linkDeal').addClass('half');
                    }
                    if ( globalParam.curTableColumnsMap[index][mapIndex].funList.length > 0 ){
                        var typeIndex = globalParam.curTableColumnsMap[index][mapIndex].funList[0].type.slice(-1);
                        items.eq(i).find('.linkDeal').html('<span class="item-icon item-icon'+typeIndex+'"></span>');
                    }
                    items.eq(i).attr('columnsMap', JSON.stringify(globalParam.curTableColumnsMap[index][mapIndex]));
                    mapIndex ++ ;
                }
                else {
                    !items.eq(i).find('.linkDeal').hasClass('none') && items.eq(i).find('.left select').val('').change() ;
                }
            }
        }
    },
    getOutputColumnsMap: function(){
        var _this = this;
        var tbls = this.container.find('.srcTbl li');
        _this.saveCurTblMap( _this.container.find('.srcTbl .cur') ) ; //先保存当前tbl配置
        tbls.map(function(i, v){
            if ( !globalParam.curTableColumnsMap[i] ){
                var src = JSON.parse( $(v).attr('data-source') ),
                    tar = JSON.parse( $(v).attr('data-target') ) ;
                var srcModel = src.mtype == 3 ? globalParam.columnObjMap['param_'+src.sql] : globalParam.columnObjMap['param_'+src.id+'_'+src.catalog+'_'+src.schema+'_'+src.tableName],
                    tarModel = globalParam.columnObjMap['param_'+(tar.createSql ? tar.createSql : tar.dbId+'_'+tar.catalog+'_'+tar.schema+'_'+tar.tableName)] ;
                globalParam.curTableColumnsMap[i] = _this.saveIndexMap(srcModel, tarModel) ;
            }
        });
    },
    diffTableColumnsMap: function(preObj, nowObj){    //比较上一步和这次的from to 参数差别，保存之前一样的表的配置
        var preFrom = preObj.fromJson,
            preTo = preObj.toJson,
            nowFrom = nowObj.fromJson,
            nowTo = nowObj.toJson ;
        var tmpColumnsMap = [];

        if ( +$('.mtype .radio.cur').attr('data-val') > 2 ){  //sql导入类型
            try {
                if (JSON.stringify({id: nowFrom[0].id, sql: nowFrom[0].sql}) === JSON.stringify({
                        id: preFrom[0].id,
                        sql: preFrom[0].sql
                    }) &&
                    JSON.stringify({
                        dbId: nowTo[0].dbId,
                        catalog: nowTo[0].catalog,
                        schema: nowTo[0].schema,
                        createSql: nowTo[0].createSql || ''
                    }) === JSON.stringify({
                        dbId: preTo[0].dbId,
                        catalog: preTo[0].catalog,
                        schema: preTo[0].schema,
                        createSql: preTo[0].createSql || ''
                    })) {
                    tmpColumnsMap[0] = globalParam.curTableColumnsMap[0];
                }
            }  catch(e) {
                return tmpColumnsMap ;
            }
            return tmpColumnsMap ;
        }

        for ( var i= 0,len=nowFrom.length; i<len; i++ ){

            var id = nowFrom[i].id,
                catalog = nowFrom[i].catalog || '',
                schema = nowFrom[i].schema || '',
                tableName = nowFrom[i].tableName ,
                fromParam = id+'_'+catalog+'_'+schema+'_'+tableName ;

            if ( nowTo[i].createSql ) {
                var toParam = nowTo[i].createSql;
            }
            else {
                id = nowTo[i].dbId;
                catalog = nowTo[i].catalog || '';
                schema = nowTo[i].schema || '';
                tableName = nowTo[i].tableName;
                var toParam = id+'_'+catalog+'_'+schema+'_'+tableName ;
            }
            var res = findItem(fromParam, toParam);
            if ( res !== '' ){
                tmpColumnsMap[i] = globalParam.curTableColumnsMap[res] ;
            }
            else {
                tmpColumnsMap[i] = '';
            }
        }
        return tmpColumnsMap ;

        function findItem(fromStr, toStr){
            for ( var i=0,len=preFrom.length; i<len; i++ ){
                if ( preFrom[i].isFindDiff ){
                    continue ;
                }

                var id = preFrom[i].id,
                    catalog = preFrom[i].catalog || '',
                    schema = preFrom[i].schema || '',
                    tableName = preFrom[i].tableName ,
                    fromParam = id+'_'+catalog+'_'+schema+'_'+tableName ;
                if ( fromStr === fromParam ){  //找到源相同的
                    preFrom[i].isFindDiff = true;  //标记已经查询过
                    if ( preTo[i].createSql ){
                        var toParam = preTo[i].createSql;
                    }
                    else {
                        id = preTo[i].dbId;
                        catalog = preTo[i].catalog || '';
                        schema = preTo[i].schema || '';
                        tableName = preTo[i].tableName;
                        var toParam = id + '_' + catalog + '_' + schema + '_' + tableName;
                    }
                    return toStr === toParam ? i : '' ;
                }
            }
            return '';
        }
    },
    initColumnsMap: function(){  //编辑回显，表初始化及配置保存
        globalParam.fromJson = jobOtherParams.fromList;
        [globalParam.commonLinkType.hive, globalParam.commonLinkType.spark].indexOf(globalParam.targetType) > -1 ? globalParam.toHiveJson = jobOtherParams.toHiveList : globalParam.toDbJson = jobOtherParams.toDbList;
        this.setSrcList( globalParam.fromJson, [globalParam.commonLinkType.hive, globalParam.commonLinkType.spark].indexOf(globalParam.targetType) > -1 ? globalParam.toHiveJson : globalParam.toDbJson );
        globalParam.fromJson.map(function(v,i){
            try {
                globalParam.curTableColumnsMap[i] = JSON.parse(v.outputColumnsMap);
            } catch(e) {
                globalParam.curTableColumnsMap[i] = '';   //之前版本不存在字段映射值
            }
        });
    }
};

var columnMapObj = new columnMapModule();

//编辑，配置字段映射table列表
if ( globalParam.targetType != globalParam.commonLinkType.hdfs && globalParam.jobId > 0 ) {
    columnMapObj.initColumnsMap();
}

function columnSelectFormat(selectDom){
    var templateFunc = function(state){
        var dom = $(state.element);
        if ( !dom.attr('data-typeName') )
            return '('+common_js_lang['db.info.emptyString']+')';

        var info = JSON.parse(decodeURIComponent( dom.attr('data-obj') ));
        var pkey = info.pk ? '<i class="pk-icon"></i>' : '';
        var $state = $('<div class="columnInfo" title="'+(dom.text()+' '+dom.attr('data-typeName'))+'"><span>'+pkey+dom.text()+'</span><span>' + dom.attr('data-typeName') + '</span></div>');
        return $state;
    };

    selectDom.select2({templateResult:function(state){
        return templateFunc( state )
    }, templateSelection: function(state){
        return templateFunc( state )
    }});
}
$.fn.extend({
    columnSelectFormat: function(){
        columnSelectFormat(this);
    }
});


/////////
//第三步
$('.item3').on('click', '.act .btn-cancel', function() {
    $('.processCon .itemCon').removeClass('cur').eq(1).addClass('cur');
    $('.stepCon').animate({'margin-left': '-100%'}, 250, function(){
        $('.stepCon .item.item1, .stepCon .item.item3').height('200');
        $('.stepCon .item.item2').height('auto');
    });
    $('html, body').animate({scrollTop:0},200)

});

// 进入第四步
$('.item3').on('click', '.act .btn-item', function() {
    columnMapObj.getOutputColumnsMap();
    $('.processCon .itemCon').removeClass('cur').eq(3).addClass('cur');
    $('.stepCon').animate({'margin-left': '-300%'}, 250, function(){
        $('.stepCon .item.item1, .stepCon .item.item2, .stepCon .item.item3').height('200');
        $('.stepCon .item.item4').height('auto');
    });
    $('html, body').animate({scrollTop:0},200)
});

$('.item4').on('click', '.act .btn-cancel', function() {
    if ( globalParam.targetType != globalParam.commonLinkType.hdfs ) {
        $('.processCon .itemCon').removeClass('cur').eq(2).addClass('cur');
        $('.stepCon').animate({'margin-left': '-200%'}, 250, function () {
            $('.stepCon .item.item1, .stepCon .item.item2').height('200');
            $('.stepCon .item.item3').height('auto');
        });
    }
    else {
        $('.stepCon').animate({'margin-left': '-100%'}, 250, function () {
            $('.stepCon .item.item1, .stepCon .item.item3').height('200');
            $('.stepCon .item.item2').height('auto');
        });
        $('.processCon .itemCon').removeClass('cur').eq(1).addClass('cur');
    }
    $('html, body').animate({scrollTop:0},200) ;
});

//保存任务
$('.item4').on('click', '.act .btn-item', function() {
    var jobName = ($('.item1 .taskName').val() || '').trim(),
        note = ($('.item1 .taskDes').val() || '').trim();
    if(!jobName) {
        MsgTip('', common_js_lang['client.info.taskNameErr'], 'info');
        return;
    }
    var pid = $('#userApp').val() || 0 ;
    if ( !pid ){
        MsgTip('', common_js_lang['dbManage.title.setApp'], 'info');
        return ;
    }

    var cronGlobalParam = cronExport.cronExec($('.group-type .cur').index(), true);
    if ( !cronGlobalParam.cronParam || [0, 1, 2].indexOf(+cronGlobalParam.periodType) == -1 ){
        $('#globalLoadCon').css({display: 'none'});
        return false;
    }

    var btnSelf = $(this);
    btnSelf.prop('disabled', true);

    //fromJson增加columnMap
    if ( globalParam.targetType != globalParam.commonLinkType.hdfs ) {
        globalParam.fromJson.map(function (v, i) {
            globalParam.fromJson[i].outputColumnsMap = globalParam.curTableColumnsMap[i];
        });
    }

    var cronParam = cronGlobalParam;
    var uploadParam = {
        pid: pid,
        jobName: jobName,
        note: note,
        mtype: $('.mtype .radio.cur').attr('data-val'),
        fromJson: JSON.stringify(globalParam.fromJson),
        periodType: cronParam.periodType,
        fromId: globalParam.sourceId,
        toId: globalParam.targetId,
        cronExpression: cronParam.cronParam,
        startTimeStr: cronParam.startTimeStr || '',
        endTimeStr: cronParam.endTimeStr || '',
        groupNo: globalParam.groupNo,
        toType: globalParam.targetType == globalParam.commonLinkType.hdfs ? 8 : globalParam.targetType == globalParam.commonLinkType.hive ? 9 : 13
    };
    globalParam.linkSource2type['1'].indexOf(+globalParam.targetType) > -1 && (uploadParam.toType = 2);
    globalParam.linkSource2type['2'].indexOf(+globalParam.targetType) > -1 && (uploadParam.toType = 6);
    globalParam.linkSource2type['3'].indexOf(+globalParam.targetType) > -1 && (uploadParam.toType = 7);

    if(globalParam.jobId > 0 && !globalParam.urlObj.copy )
        uploadParam.id = globalParam.jobId;

    if(globalParam.targetType == globalParam.commonLinkType.hdfs) {
        uploadParam['toHdfsJson'] = JSON.stringify(globalParam.toHdfsJson);
    }
    else {
        var targetJson = [globalParam.commonLinkType.hive, globalParam.commonLinkType.spark].indexOf(globalParam.targetType) > -1 ? globalParam.toHiveJson : globalParam.toDbJson ;
        var batchDefer = $.Deferred();
        var tablesJson = [];
        for(var i = 0, len = targetJson.length; i < len; i++) {
            if(targetJson[i].createSql) {
                targetJson[i].ddl = targetJson[i].createSql;
                targetJson[i].index = i;
                tablesJson.push(targetJson[i]);
            }
        }
        if ( tablesJson.length >= 1 ){
            var errMsg = '',
                errDetail = '',
                errTitle = '',
                succCount = 0,
                failCount = 0 ;
            var init= 0, len=tablesJson.length;
            $('#waitLoading').find('article').html('<p>'+common_js_lang['loading.info.batchNew'].replace(/\[x\]/, len)+'</p><p class="detail"></p>').end().css({display:'block'});
            createTblBatch();
        }
        else {
            batchDefer.resolve();
        }

        function createTblBatch(){
            if ( init >= len ) {
                if (errMsg) {
                    batchDefer.reject();
                    $('#waitLoading').css({display:'none'});
                    ErrTip(errTitle, errDetail, common_js_lang['loading.info.newInfo'].replace(/\[x\]/, succCount).replace(/\[y\]/, failCount)+'\n'+errMsg);
                    return;
                }
                batchDefer.resolve();
                return;
            }
            var spliceJson = tablesJson.slice(init, init+100),
                amount = init + 100 <= len ? 100 : len-init ;
            $.ajax({
                url: 'db/table/create/batch',
                type: 'post',
                data: {dbId: globalParam.targetId, pid:pid, tablesJsonStr: JSON.stringify(spliceJson)},
                success: function(data){
                    if ( data.code != 200 ){
                        errTitle ? '' : errTitle = data.i18nMsg.title;
                        errDetail ? '' : errDetail = data.i18nMsg.detail;
                        errMsg += data.msg+'\n' ;
                        failCount += amount ;
                    }
                    else {
                        data.model.map(function (v, i) {
                            var index = tablesJson[i+init].index;
                            if (v.code != 200) {
                                failCount ++ ;
                                errTitle ? '' : errTitle = v.i18nMsg.title;
                                errDetail ? '' : errDetail = v.i18nMsg.detail;
                                errMsg += '[' + targetJson[index].tableName + ']:' + v.msg + '.\n';
                                return;
                            }
                            succCount ++ ;
                            targetJson[index].ddl = '';
                            targetJson[index].createSql = '';
                            targetJson[index].tableName = v.model.tableName;
                            targetJson[index].catalog = v.model.catalog;
                            targetJson[index].schema = v.model.schema;
                        });
                    }
                    init += 100 ;
                    $('#waitLoading').find('article .detail').html(common_js_lang['loading.info.newInfo'].replace(/\[x\]/, succCount).replace(/\[y\]/, failCount)) ;
                    createTblBatch();
                }
            })
        }
    }


    globalParam.targetType != globalParam.commonLinkType.hdfs ?
        $.when( batchDefer ).then(function(){
            uploadParam['toHiveJson'] = JSON.stringify(globalParam.toHiveJson);
            uploadParam['toDbJson'] = JSON.stringify(globalParam.toDbJson);
            upload();
        }, function(){
            btnSelf.prop('disabled', false);
        }) : upload() ;

    function upload(){
        $.fn.ajaxAPI({
            url: 'job/db/save',
            type: 'post',
            data: uploadParam,
            contentType: 'application/x-www-form-urlencoded',
            callback: function(data) {
                window.onbeforeunload = function(){return} ;
                location.href = "./success";
            },
            complete: function() {
                btnSelf.prop('disabled', false);
            }
        });
    }
});

/////////

/// 编辑
;(function() {
    if(globalParam.jobId <= 0) return;
    var iframeParam = {
        cronParam: globalParam.editJobModel.cronExpression,
        startTime: globalParam.editJobModel.startTime,
        endTime: globalParam.editJobModel.endTime
    };
    cronExport.resetCron(iframeParam);
}());

window.onbeforeunload = function(){
    if ( $('.taskName').val().trim() || $('.taskDes').val().trim() )
        return common_js_lang['common.info.leavePage'];
};