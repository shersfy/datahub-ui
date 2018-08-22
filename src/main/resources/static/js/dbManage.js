
var tmpParam = {
    dbListParam : { pageSize:10, pageNo: 1, pid:'', dbType:''},
    hdfsListParam: {pageSize:10, pageNo:1},
    ftpListParam: {pageSize:10, pageNo:1},
    dbConfigParam : {},
    dbConfigParamOption: '',
    dbParamObj: {},
    hiveId : 31,
    tmpParamHtml : '',
    defaultPort: {
        38: 3306, 52: 3306, 56: 3306,
        4: 1521, 60: 1521,
        40: 1433, 53: 1433, 57: 1433,
        44: 50000,
        24: 5432, 54: 5432, 58: 5432
    }
} ;
$.extend(globalParam, tmpParam);

globalParam.tmpParamHtml += '<div class="tr thead clearfix"><div class="paramList">'+common_js_lang['dbManage.title.setParam']+'</div><div class="key">'+common_js_lang['dbManage.title.nameParam']+'</div><div class="val">'+common_js_lang['dbManage.title.val']+'</div><div title="'+common_js_lang['clientList.option.del']+'" class="act">'+common_js_lang['clientList.option.oper']+'</div></div>';
for ( var i=0; i<5; i++ )
    globalParam.tmpParamHtml += '<div class="tr clearfix '+(i == 4 ? 'last':'')+'"><div class="paramList"><select></select></div><div class="key"><input maxlength="30" type="text"></div><div class="val"><input maxlength="30" type="text"></div><div title="'+common_js_lang['clientList.option.del']+'" class="act"><a><i class="del"></i></a></div></div>';

$('.global-dbCon .tooltip').tipsy({fade: true,gravity:'s',html:true});

// 顶部 nav 切换
$('nav').on('click', 'a:not(".cur")', function(){
    var index = $(this).index();
    $(this).addClass('cur').siblings().removeClass('cur');
    $('#db-manage-list').empty();
    globalParam.dbListParam.pageNo = 1;
    globalParam.dbListParam.dbType = '';
    [0, 1, 3].indexOf(index) > -1 && getDBList(globalParam.dbListParam,index);
    index == 2 && getHdfsList(globalParam.hdfsListParam);
    index == 4 && getFtpList(globalParam.ftpListParam);
});

// 项目切换
$('#userApp').on('change', function(e, hid){
    if ( ['hive', 'spark'].indexOf($('#seltType')) > -1 && !hid || !$(this).val() )
        return ;
    var pid = $(this).val();
    if ( !pid )
	    return ;
    $.ajax({url:'hdfs/list?pid='+pid})
    .then(function(data){
        if ( data.code != 200 ){
            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
            return ;
        }

        var html = '';
        data.model.data.map(function(v){
            html += '<option value="'+v.id+'" data-authType="'+v.authType+'" data-principal="'+(v.principal || '')+'">'+v.connName+'</option>';
        });
        $('.global-dbCon .hive [data-key="hid"]').val('').html(html);
        hid && $('.global-dbCon .hive [data-key="hid"]').val(hid);            
    });
});

// 资源类型选择
$('.resource-type').on('change', '#seltType', function(e, hid){
    var type = $(this).val();
    $('.global-dbCon .column').addClass('hidden');
    type == 'spark' ? type = 'hive' : '';
    $('.global-dbCon .column.'+type).removeClass('hidden');
    $('.tab span').eq(1).toggleClass('hidden', ['hdfs', 'ftp'].indexOf(type) > -1);
    type == 'hive' && $('#userApp').trigger('change', hid || 0);
    $('.global-dbCon').find('.testRes').empty();
});

// label radio
$('.column.hdfs').on('click', 'label', function(){
    if ( $(this).find('.radio').hasClass('cur') )
        return ;
    
    $('.column.hdfs label .radio').toggleClass('cur');
    $('.column.hdfs .normal, .column.hdfs .kerberos').toggleClass('hidden');

    var index = $(this).find('.radio').data('val');
    var tmp = $('.column.hdfs [data-key="connName"]').val();
    index == 2 && $('.column.hdfs [data-key="connName"]').attr('data-val1', tmp);
    index == 1 && $('.column.hdfs [data-key="connName"]').attr('data-val2', tmp);

    var val = $('.column.hdfs [data-key="connName"]').attr('data-val'+index) || '';
    $('.column.hdfs [data-key="connName"]').val(val).removeClass('error');  
});

// 切换 tab
$('.global-dbCon').on('click', '.tab span', function(){
    if ( $(this).hasClass('cur') )
        return ;
    $(this).addClass('cur').siblings().removeClass('cur');
    if ( [1].indexOf($(this).index()) > -1 ){
        $(this).parents('.formCon').find('.column,.columnTop').addClass('hidden');        
        $('.global-dbCon .param, .global-dbCon .newline').removeClass('hidden');
    }
    else {
        $('.global-dbCon .param, .global-dbCon .newline').addClass('hidden');
        $('.global-dbCon .columnTop').removeClass('hidden');
        var type = $('#seltType').val();
        type == 'spark' ? type = 'hive' : '';
        $('.global-dbCon .column').addClass('hidden');
        $('.global-dbCon .column.'+type).removeClass('hidden');
        return ;
    }

    var seltType = $('#seltType').val();
    if ( ['hive', 'spark'].indexOf(seltType) > -1 ){
        var typeId = globalParam.hiveId ;
    }
    else if ( ['hive', 'db'].indexOf(seltType) > -1 )  {
        var typeId = $(".db-info [data-key='dbType']").val();
        if ( [52,56].indexOf(+typeId) > -1 )
            typeId = 38;
        if ( [53,57].indexOf(+typeId) > -1 )
            typeId = 40;
        typeId == '60' && (typeId = 4);
    }
    if ( !globalParam.dbConfigParam[typeId] ){
        $.fn.ajaxAPI({
            url: 'db/params',
            async: false,
            data:{typeId: typeId},
            callback: function(data){
                globalParam.dbConfigParam[typeId] = data.model;
            }
        });
    }
    updateDbParamList(globalParam.dbConfigParam[typeId]);
});


getDBList(globalParam.dbListParam, 0);
function getDBList(data, index){
    index != 0 ? (data['groups'] = 4, index == 1 ? data.dbType = 31 : data.dbType = 62) : data['groups'] = '1,2,3';
    var selfParam = data;
    var reqPage = +data.pageNo || 1;
    reqPage < 1 ? reqPage = 1 : '' ;
    data.pageNo = reqPage ;

    $.fn.ajaxAPI({
        url: 'db/list', 
        data: data,
        callback: function(data){
            if ( data.model.totalPage && data.model.totalPage < reqPage ){
                selfParam.pageNo = data.model.totalPage;
                getDBList(selfParam, $('nav a.cur').index());
                return ;
            }
            data.model.data = data.model.data.map(function(v){
                v.val = JSON.stringify(v);
                return v;
            });

            $('#db-manage-list').html(template( (!index? 'template/dbList' : 'template/hiveList'), data.model));
            $('#db-manage-list .pager').bootpag({
                total: data.model.totalPage,
                page:data.model.currentPage,
                maxVisible:10,
                leaps: false,
                firstLastUse: true,
                prev: '<i>〈</i>',
                next: '<i>〉</i>',
                first: '<i>《</i>',
                last: '<i>》</i>'
            }).off().on('page', function(e, page){
                globalParam.dbListParam.pageNo = page;
                $('#db-manage-list tbody').empty();                
                getDBList(globalParam.dbListParam, $('nav a.cur').index());                
            });  
        }
    });
}

function getHdfsList(data){
    var selfParam = data;
    var reqPage = +data.pageNo || 1;
    reqPage < 1 ? reqPage = 1 : '' ;
    data.pageNo = reqPage ;

    $.fn.ajaxAPI({
        url: 'hdfs/list', 
        data: data,
        callback: function(data){
            if ( data.model.totalPage && data.model.totalPage < reqPage ){
                selfParam.pageNo = data.model.totalPage;
                getHdfsList(selfParam);
                return ;
            }

            data.model.data = data.model.data.map(function(v){
                v.val = JSON.stringify(v);
                return v;
            });

            $('#db-manage-list').html(template('template/hdfsList', data.model));
            $('#db-manage-list .pager').bootpag({
                total: data.model.totalPage,
                page:data.model.currentPage,
                maxVisible:10,
                leaps: false,
                firstLastUse: true,
                prev: '<i>〈</i>',
                next: '<i>〉</i>',
                first: '<i>《</i>',
                last: '<i>》</i>'
            }).off().on('page', function(e, page){
                globalParam.hdfsListParam.pageNo = page;
                $('#db-manage-list tbody').empty();                                
                getHdfsList(globalParam.hdfsListParam);
            });  
        }
    });
}

function getFtpList(data){
    var selfParam = data;
    var reqPage = +data.pageNo || 1;
    reqPage < 1 ? reqPage = 1 : '' ;
    data.pageNo = reqPage ;

    $.fn.ajaxAPI({
        url: 'repo/ftp/list',
        data: data,
        callback: function(data){
            if ( data.model.totalPage && data.model.totalPage < reqPage ){
                selfParam.pageNo = data.model.totalPage;
                getFtpList(selfParam);
                return ;
            }

            data.model.data = data.model.data.map(function(v){
                v.val = JSON.stringify(v);
                return v;
            });

            $('#db-manage-list').html(template('template/ftpList', data.model));
            $('#db-manage-list .pager').bootpag({
                total: data.model.totalPage,
                page:data.model.currentPage,
                maxVisible:10,
                leaps: false,
                firstLastUse: true,
                prev: '<i>〈</i>',
                next: '<i>〉</i>',
                first: '<i>《</i>',
                last: '<i>》</i>'
            }).off().on('page', function(e, page){
                globalParam.ftpListParam.pageNo = page;
                $('#db-manage-list tbody').empty();
                getFtpList(globalParam.ftpListParam);
            });
        }
    });
}

// input blur 验证
$('.db-info').on('blur', 'input', function(){
    if ( $(this).parents('.column').find('.authType').length == 1 || $(this).parents('.column').hasClass('ftp') )
        return ;

    var key = $(this).attr('data-key'),
        val = ( $(this).val() || '').trim() ;

    var data = {};
    data[key] = val ;
    if ( key === 'url' && val === '' ){
         var param = getUrlParam($(this));
         $(this).parents('.column').find('[data-key="url"]').val(getlinkUrl(param)).removeClass('error');
         return false;
    }
    var checkRes = checkDbInfo(data);
    if ( checkRes.res !== true ){   //验证输入合法性
        $(this).addClass('error');
        return false;
    }

    $(this).removeClass('error');
    if ( $(this).parents('.column').hasClass('ftp') ){
        return ;
    }

    if ( ['host', 'port', 'dbName', 'zkhost', 'zkport', 'zooKeeperNamespace'].indexOf(key) > -1 ){
        var param = getUrlParam($(this));
        var container = '';
        if ( $(this).parents('.column').hasClass('hdfs') )
            container = '.normal';
        $(this).parents('.column').find(container+' [data-key="url"]').val(getlinkUrl(param)).removeClass('error');
    }
});

// dbType 变化
$('.db-info').on('change', '[data-key="dbType"]', function(){
    var key = $(this).attr('data-key'),
        val = $(this).val() ;
    
    var portDom = $('.column.db [data-key="port"]');
    portDom.val( globalParam.defaultPort[val] );
    var param = getUrlParam($(this));
    $(this).parents('.column').find('[data-key="url"]').val(getlinkUrl(param)).removeClass('error');
    return false;
});

// 模式切换
$('.column.hive').on('change', '[data-key="mode"]', function(){
    if ( $(this).val() == '0' ){
        $('.column.hive').find('.mode').show();
        $('.column.hive').find('.mode.ha').hide();
    }
    else {
        $('.column.hive').find('.mode').hide();
        $('.column.hive').find('.mode.ha').show();
    }
    var param = getUrlParam($(this));
    $(this).parents('.column').find('[data-key="url"]').val(getlinkUrl(param)).removeClass('error');
});

//增加ZK节点
$('.column.hive').on('click', '.add', function(){
    var zkArr = $('.column.hive').find('.ha.zk'),
        len = zkArr.length,
        lastChild = zkArr.eq( len -1),
        newDom = lastChild.clone();
    newDom.find('.add').removeClass('add').addClass('del').text(common_js_lang['clientList.option.del']);
    lastChild.after( newDom );
    var param = getUrlParam( $('.column.hive').find('[data-key="mode"]') );
    $('.column.hive').find('[data-key="mode"]').parents('.column').find('[data-key="url"]').val(getlinkUrl(param)).removeClass('error');
});

$('.column.hive').on('click', '.del', function() {
    $(this).parent().remove();
    var param = getUrlParam( $('.column.hive').find('[data-key="mode"]') );
    $('.column.hive').find('[data-key="mode"]').parents('.column').find('[data-key="url"]').val(getlinkUrl(param)).removeClass('error');
});

// hdfs 变化
$('.column.hive').on('change', '[data-key="hid"]', function(){
    var param = getUrlParam($(this));
    $(this).parents('.column').find('[data-key="url"]').val(getlinkUrl(param)).removeClass('error');
});

function getUrlParam(obj){
    var con = obj.parents('.column') ;
    return {
        dbType: con.find('[data-key="dbType"]').val(),
        host: con.find('[data-key="host"]').val().trim(),
        port: con.find('[data-key="port"]').val().trim(),
        dbName: (con.find('[data-key="dbName"]').val() || '').trim(),
        hidDom: con.find('[data-key="hid"] option:selected'),
        mode: con.find('[data-key="mode"]').val()
    }
}


function getlinkUrl(param){
    if ( param.mode == 1 ){  //HA模式
        var con = $('.column.hive'),
            hostArr = con.find('[data-key="zkhost"]'),
            portArr = con.find('[data-key="zkport"]'),
            serviceDiscoveryMode = con.find('[data-key="serviceDiscoveryMode"]').val(),
            zooKeeperNamespace = con.find('[data-key="zooKeeperNamespace"]').val().trim() ;

        var tmpArr = [];
        hostArr.map(function(i, v){
            tmpArr.push( $(v).val().trim()+':'+portArr.eq(i).val().trim() );
        });
        return 'jdbc:hive2://'+tmpArr.join(',')+'/;serviceDiscoveryMode='+serviceDiscoveryMode+';zooKeeperNamespace='+zooKeeperNamespace ;
    }

    if ( !param.dbType ){
        if ( $('#seltType').val() == 'hdfs' )
            return "hdfs://"+param.host+':'+param.port;
        if ( param.hidDom.attr('data-authType') == 2 ){
            return "jdbc:hive2://"+param.host+":"+param.port+'/;principal='+param.hidDom.attr('data-principal');
        }
        return "jdbc:hive2://"+param.host+":"+param.port+'/';
    }

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

        if ( ['port', 'zkport'].indexOf(key) > -1 && !data[key].match(/^[1-9]\d*$/g) ){
            return {res:false, key:key};
        }
        
        if ( data[key] === '' ){
            return {res:false, key:key};
        }
    }
    return {res: true};
}


// 更新连接配置参数
function updateDbParamList(data){
    var paramList = '<option value="0">'+common_js_lang['dbManage.option.param']+'</option>';
    globalParam.dbParamObj = {};
    data.map(function(v){
        paramList += '<option value="'+v.id+'" data-name="'+v.name+'" data-defValue="'+v.defValue+'">'+(common_i18n_lang == 'zh' ? v.meaning : v.name)+'</option>';
        globalParam.dbParamObj[v.name] = v.id;
    });
    globalParam.dbConfigParamOption = paramList ;
    $('.global-dbCon .paramList select').html(paramList);

    var trs = $('.db-info .param .tr'),
        len = trs.length ;
    for ( var i=0; i<len; i++ ){
        var key = trs.eq(i).find('.key input').val();        
        trs.eq(i).find('.key input').prop('readOnly', false);        
        if ( !key ){
            continue;
        }
        var select = trs.eq(i).find('.paramList select');
        if ( globalParam.dbParamObj[key] ){
            select.val(globalParam.dbParamObj[key]);
            trs.eq(i).find('.key input').prop('readOnly', true);            
        }
    }
}

// 参数栏 新增一行
$('.global-dbCon').on('focus', '.last .key', function(){
    $(this).parent('.tr').removeClass('last');
    $(this).parents('.param').append('<div class="tr clearfix last"><div class="paramList"><select>'+globalParam.dbConfigParamOption+'</select></div><div class="key"><input maxlength="30" type="text"></div><div class="val"><input maxlength="30" type="text"></div><div title="'+common_js_lang['clientList.option.del']+'" class="act"><a><i class="del"></i></a></div></div>');
});

$('.global-dbCon').on('click', '.newline', function(){
    $('.global-dbCon .param').find('.tr.last').removeClass('last');
    $('.global-dbCon .param').append('<div class="tr clearfix last"><div class="paramList"><select>'+globalParam.dbConfigParamOption+'</select></div><div class="key"><input maxlength="30" type="text"></div><div class="val"><input maxlength="30" type="text"></div><div title="'+common_js_lang['clientList.option.del']+'" class="act"><a><i class="del"></i></a></div></div>');
});

// 功能参数改变
$('.global-dbCon').on('change', '.paramList select', function(){
    var paramId = +$(this).val() || 0;
    if ( paramId ){
        var tr = $(this).parents('.tr'),
            option = $(this).find('option:selected') ;
        tr.find('.key input').val(option.data('name')).prop('readOnly', true);
        tr.find('.val input').val(option.data('defvalue'));        
    }
    else {
        var tr = $(this).parents('.tr');
        tr.find('.key input').prop('readOnly', false);
        tr.find('.key input, .val input').val('');
    }
});

// 参数删除
$('.global-dbCon').on('click', '.param .del', function(){
    var self = $(this).parents('.tr'),
        paramCon = self.parent() ;
    swal({
        title:'',
        text: common_js_lang['dbManage.info.delParam'],
        type: 'info',
        showCancelButton:true
    }, function(){
        if ( self.hasClass('last') ){
            if (  paramCon.find('.tr').length == 2 ){  //最后一行，则不删除 只是清空
                self.find('input').val('');
            }
            else{
                self.remove();                        
                paramCon.find('.tr:last-child').addClass('last');
            }
        }
        else
            self.remove();        
    });
});
$('.global-dbCon').on('focus', '.param .val input', function(){
    if ( !$(this).parents('.tr').find('.key input').val().trim() ){
        MsgTip('', common_js_lang['dbManage.info.paramName'],'info');
        $(this).blur();
        return false;
    }
});

// 取消
$('.global-dbCon').on('click', '.btn-cancel, .cancel', function(){
    $('.global-dbCon, .global-mask').fadeOut();        
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

        if (!param.dbType) {
            res.tag = 'type';
            if ( curUrl.slice(0, 13) !== 'jdbc:hive2://' ){
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

            if (param.hidDom.attr('data-authType') == 2) {
                res.tag = 'principal';
                if (  tmpArr.splice(1).join('/').indexOf(";principal=") == -1 )
                    return res;
                res.res = true;
                return res;
            }

            res.res =true;
            return res ;
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
            //return "jdbc:postgresql://" + param.host + ":" + param.port + "/" + param.dbName;
        }
    } catch(e){
    }
    return res;
}

// 新增 、 更新
$('.global-dbCon').on('click', '.save', function(){
    var seltType = $('#seltType').val();
    seltType == 'spark' ? seltType = 'hive' : '';
    if ( seltType == 'hdfs' ){
        hdfsUpdate();
        return ;
    }
    if ( seltType == 'ftp' ){
        ftpUpdate();
        return ;
    }
    var data = {pid: $('.global-dbCon [data-key="pid"]').val()};
    if ( !data.pid ){
        MsgTip('', common_js_lang['db.info.selectApp'], 'info');
        return false;
    }

    if ( $('#seltType').val() == 'db' ){
        data.dbType = $('.global-dbCon .'+seltType+' [data-key="dbType"]').val() ;
        data.host = $('.global-dbCon .'+seltType+' [data-key="host"]').val().trim();
        data.port = $('.global-dbCon .'+seltType+' [data-key="port"]').val().trim();
        data.dbName =  $('.global-dbCon .'+seltType+' [data-key="dbName"]').val().trim();
        data.userName = $('.global-dbCon .'+seltType+' [data-key="userName"]').val().trim();
        data.password = ($('.global-dbCon .'+seltType+' [data-key="password"]').val() || '').trim() ;    // 补充pwd参数
    }
    else {
        data['dbType'] = $('#seltType').val() == 'hive'? globalParam.hiveId : 62;
        if ( $('.global-dbCon .'+seltType+' [data-key="mode"]').val() == 1 ){  //HA模式
            var con = $('.column.hive'),
                hostArr = con.find('[data-key="zkhost"]'),
                portArr = con.find('[data-key="zkport"]'),
                serviceDiscoveryMode = con.find('[data-key="serviceDiscoveryMode"]').val(),
                zooKeeperNamespace = con.find('[data-key="zooKeeperNamespace"]').val().trim() ;

            var tmpArr = [];
            for ( var i= 0,len=hostArr.length; i<len; i++ ){
                var _host = hostArr.eq(i).val().trim(),
                    _port = portArr.eq(i).val().trim() ;
                if ( !_host ){
                    hostArr.eq(i).addClass('error');
                    return false;
                }

                if ( !_port.match(/^[1-9]\d*$/g) ){
                    portArr.eq(i).addClass('error');
                    return false;
                }
                tmpArr.push( _host+':'+_port );
            }

            data.host =  tmpArr.join(',') ;
            data.port = portArr.eq(0).val().trim();
            data.serviceDiscoveryMode = serviceDiscoveryMode;
            data.zooKeeperNamespace = zooKeeperNamespace;

            data['hid'] =  $('.global-dbCon .'+seltType+' [data-key="hid"]').val() || '';
            data.userName = $('.global-dbCon .'+seltType+' [data-key="userName"]').val().trim();
        }
        else {
            data['hid'] =  $('.global-dbCon .'+seltType+' [data-key="hid"]').val() || '';
            data.host = $('.global-dbCon .'+seltType+' [data-key="host"]').val().trim();
            data.port = $('.global-dbCon .'+seltType+' [data-key="port"]').val().trim();
            data.userName = $('.global-dbCon .'+seltType+' [data-key="userName"]').val().trim();
        }
    }

    data.url = $('.global-dbCon .'+seltType+' [data-key="url"]').val().trim();
    data.connName = $('.global-dbCon .'+seltType+' [data-key="connName"]').val().trim();

    data.connName = data.connName || data.host+'_'+data.port+ (data.dbName? '_'+data.dbName : '');
    $('.global-dbCon .'+seltType+' [data-key="connName"]').val(data.connName);

    var checkRes = checkDbInfo(data);
    $('.global-dbCon input').removeClass('error');

    if ( seltType != 'db' ){      // hive条件下 验证后增加pwd参数
        data.password = ($('.global-dbCon .'+seltType+' [data-key="password"]').val() || '').trim() ;    // 补充pwd参数
        data.dbName = '';
    }
    if ( checkRes.res !== true ){
        $('.global-dbCon .'+seltType+' [data-key="'+checkRes.key+'"]').addClass('error');
        return false;
    }

    var urlParam = getUrlParam(  $('.global-dbCon .'+seltType+' [data-key="port"]') );
    var defaultUrl = getlinkUrl( urlParam );
    var checkRes = checkUrl( defaultUrl, urlParam, data.url );
    if ( !checkRes.res  ){
        MsgTip('', common_js_lang["dbManage.check."+checkRes.tag], 'info');
        return false;
    }

    var params = $('.global-dbCon .param .tr:not(".thead")'),
        length = params.length,
        paramObj = {} ;
    for ( var i=0; i<length; i++ ){
        var key = params.eq(i).find('.key input').val().trim();
        var val = params.eq(i).find('.val input').val().trim();
        if ( !key && val ){
            MsgTip('', common_js_lang['dbManage.info.nameNone'], 'info');
            return false;
        }        
        if ( key ){
            if ( paramObj[key] !== undefined ){
                MsgTip('', '['+key+']'+common_js_lang['dbManage.info.sameKey'], 'info');
                return false;
            }
            paramObj[key] = val;
        }
    }
    data.params = JSON.stringify(paramObj);

    $('#waitLoading').find('article').html(common_js_lang['dbManage.text.saveLink'] ).end().css({display:'block'});
    var hiveDefer = $.Deferred();
    if ( $('#seltType').val() != 'db' ){
        $.ajax({
            url: 'db/hive/check/cluster',
            data: {hiveHost: data.host,hdfsId: data.hid},
            success: function(data){
                if ( [-1, 200].indexOf(data.code) == -1 ){
                    if ( data.code != -2 ){
                        ErrTip( data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        hiveDefer.reject();
                        return ;
                    }

                    swal({
                        title: "",
                        text: data.i18nMsg.detail,
                        type: "info",
                        confirmButtonText: common_js_lang['dbManage.btn.continue'],
                        showCancelButton: true
                    }, function(isConfirm){
                        if ( isConfirm ){
                            hiveDefer.resolve();
                        }
                        else
                            hiveDefer.reject();
                    });
                    return ;
                }
                if ( data.code == 200 )
                    hiveDefer.resolve();
            },
            error: function(){
                hiveDefer.reject();
            }
        });
    }
    else{
        hiveDefer.resolve();
    }

    var self = $(this);
    $.when( hiveDefer).done( function() {
        if ( !self.attr('data-id') ) {
            $.ajax({
                url: 'db/add',
                type: 'post',
                contentType: 'application/x-www-form-urlencoded',
                data: data,
                success: function (data) {
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }
                    MsgTip({title: 'SUCCESS', text: common_js_lang['dbManage.info.addSucc'], type: 'success', timer: 2000});
                    $('.global-dbCon, .global-mask').toggle();
                    [0,1,3].indexOf(+$('nav a.cur').index()) > -1 && getDBList(globalParam.dbListParam, $('nav a.cur').index());
                },
                complete: function(data){
                    $('#waitLoading').css({display:'none'});
                }
            });
        }
        else {
            data.id = self.attr('data-id');
            updateLink(data);
        }
    }).fail(function(){
        $('#waitLoading').css({display:'none'});
    });
});

$('.testRes').on('click', '.showTip', function(){
    var data = JSON.parse( decodeURIComponent($(this).attr('data-info')) );
    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
});

//  测试连接
$('.global-dbCon').on('click', '.testConnect', function(){
    var seltType = $('#seltType').val();
    seltType == 'spark'? seltType = 'hive' : '';
    if ( seltType == 'hdfs' ){
        hdfsUpdate(true);   // 测试连接
        return ;
    }
    if ( seltType == 'ftp' ){
        ftpUpdate(true);
        return ;
    }
    var data = {pid: $('.global-dbCon [data-key="pid"]').val()};
    if ( !data.pid ){
        MsgTip('', common_js_lang['db.info.selectApp'], 'info');
        return false;
    }

    if ( $('#seltType').val() == 'db' ){
        data.dbType = $('.global-dbCon .'+seltType+' [data-key="dbType"]').val() ;
        data.host = $('.global-dbCon .'+seltType+' [data-key="host"]').val().trim();
        data.port = $('.global-dbCon .'+seltType+' [data-key="port"]').val().trim();
        data.dbName =  $('.global-dbCon .'+seltType+' [data-key="dbName"]').val().trim();
        data.userName = $('.global-dbCon .'+seltType+' [data-key="userName"]').val().trim();
        data.password = ($('.global-dbCon .'+seltType+' [data-key="password"]').val() || '').trim() ;    // 补充pwd参数
    }
    else {
        data['dbType'] = $('#seltType').val() == 'hive'? globalParam.hiveId : 62;
        if ( $('.global-dbCon .'+seltType+' [data-key="mode"]').val() == 1 ){  //HA模式
            var con = $('.column.hive'),
                hostArr = con.find('[data-key="zkhost"]'),
                portArr = con.find('[data-key="zkport"]'),
                serviceDiscoveryMode = con.find('[data-key="serviceDiscoveryMode"]').val(),
                zooKeeperNamespace = con.find('[data-key="zooKeeperNamespace"]').val().trim() ;

            var tmpArr = [];
            for ( var i= 0,len=hostArr.length; i<len; i++ ){
                var _host = hostArr.eq(i).val().trim(),
                    _port = portArr.eq(i).val().trim() ;
                if ( !_host ){
                    hostArr.eq(i).addClass('error');
                    return false;
    }

                if ( !_port.match(/^[1-9]\d*$/g) ){
                    portArr.eq(i).addClass('error');
                    return false;
                }
                tmpArr.push( _host+':'+_port );
            }

            data.host =  tmpArr.join(',') ;
            data.port = portArr.eq(0).val().trim();
            data.serviceDiscoveryMode = serviceDiscoveryMode;
            data.zooKeeperNamespace = zooKeeperNamespace;

            data['hid'] =  $('.global-dbCon .'+seltType+' [data-key="hid"]').val() || '';
            data.userName = $('.global-dbCon .'+seltType+' [data-key="userName"]').val().trim();
        }
        else {
            data['hid'] =  $('.global-dbCon .'+seltType+' [data-key="hid"]').val() || '';
            data.host = $('.global-dbCon .'+seltType+' [data-key="host"]').val().trim();
            data.port = $('.global-dbCon .'+seltType+' [data-key="port"]').val().trim();
            data.userName = $('.global-dbCon .'+seltType+' [data-key="userName"]').val().trim();
        }
    }

    data.url = $('.global-dbCon .'+seltType+' [data-key="url"]').val().trim();
    data.connName = $('.global-dbCon .'+seltType+' [data-key="connName"]').val().trim();

    data.connName = data.connName || data.host+'_'+data.port+ (data.dbName? '_'+data.dbName : '');
    $('.global-dbCon .'+seltType+' [data-key="connName"]').val(data.connName);

    var checkRes = checkDbInfo(data);
    $('.global-dbCon input').removeClass('error');
    if ( seltType != 'db' ){      // hive条件下 验证后增加pwd参数
        data.password = ($('.global-dbCon .'+seltType+' [data-key="password"]').val() || '').trim() ;    // 补充pwd参数
        data.dbName = '';
    }
    if ( checkRes.res !== true ){
        $('.global-dbCon .'+seltType+' [data-key="'+checkRes.key+'"]').addClass('error');
        return false;
    }

    var urlParam = getUrlParam(  $('.global-dbCon .'+seltType+' [data-key="port"]') );
    var defaultUrl = getlinkUrl( urlParam );
    var checkRes = checkUrl( defaultUrl, urlParam, data.url );
    if ( !checkRes.res  ){
        MsgTip('', common_js_lang["dbManage.check."+checkRes.tag], 'info');
        return false;
    }

    var params = $('.global-dbCon .param .tr:not(".thead")'),
        length = params.length,
        paramObj = {} ;
    for ( var i=0; i<length; i++ ){
        var key = params.eq(i).find('.key input').val().trim();
        var val = params.eq(i).find('.val input').val().trim();
        if ( !key && val ){
            MsgTip('', common_js_lang['dbManage.info.nameNone'], 'info');
            return false;
        }        
        if ( key ){
            if ( paramObj[key] !== undefined ){
                MsgTip('', '['+key+']'+common_js_lang['dbManage.info.sameKey'], 'info');
                return false;
            }
            paramObj[key] = val;
        }
    }
    data.params = JSON.stringify(paramObj);
    var id = $('.global-dbCon .save').attr('data-id') || '';
    id  ? data['oldpwd'] = $('.global-dbCon .'+seltType+' [data-key="password"]').attr('data-pwd') : data['oldpwd'] = '' ;
    var self = $(this);

    $('#waitLoading').find('article').html( common_js_lang['dbManage.text.checkLink'] ).end().css({display:'block'});
    var hiveDefer = $.Deferred();
    if ( $('#seltType').val() != 'db' ){
        $.ajax({
            url: 'db/hive/check/cluster',
            data: {hiveHost: data.host,hdfsId: data.hid},
            success: function(data){
                if ( [-1, 200].indexOf(data.code) == -1 ){
                    if ( data.code != -2 ){
                        ErrTip( data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        hiveDefer.reject();
                        return ;
                    }

                    swal({
                        title: "",
                        text: data.i18nMsg.detail,
                        type: "info",
                        confirmButtonText: common_js_lang['dbManage.btn.continue'],
                        showCancelButton: true
                    }, function(isConfirm){
                        if ( isConfirm ){
                            hiveDefer.resolve();
                        }
                        else
                            hiveDefer.reject();
                    });
                    return ;
                }

                if ( data.code == 200 )
                    hiveDefer.resolve();
            },
            error: function(){
                hiveDefer.reject();
            }
        });
    }
    else{
        hiveDefer.resolve();
    }

    $.when( hiveDefer).done( function(code) {
        var parentDom = self.parent();
        parentDom.find('.testRes').empty();
        $.ajax({
            url: 'db/connect',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            data: data,
            success: function (data) {
                if ( data.code != 200 ){
                    parentDom.find('.testRes').removeClass('right').addClass('err').html('<i class="fail"></i>'+common_js_lang['db.text.testFail']+'<a class="showTip" data-info='+encodeURIComponent(JSON.stringify(data))+'>'+common_js_lang['db.text.errTip']+'</a>');
                    return ;
                }
                parentDom.find('.testRes').removeClass('err').addClass('right').html('<i class="suc"></i>'+common_js_lang['db.text.testSuc']);
            },
            complete: function () {
                $('#waitLoading').css({display:'none'});
            }
        });
    }).fail(function(){
        $('#waitLoading').css({display:'none'});
    });
});


function hdfsUpdate(delFlg){
    var doc = $('.global-dbCon .hdfs') ;
    var data = {
        pid: $('.global-dbCon [data-key="pid"]').val() || '',
        authType: doc.find('.authType .radio.cur').data('val')
    }

    if ( !data.pid ){
        MsgTip('', common_js_lang['db.info.selectApp'], 'info');
        return false;
    }

    var authType = doc.find('.authType .radio.cur').data('val');
    if ( authType == 1 ){
        ['userName', 'coreSiteXml', 'hdfsSiteXml'].map(function(v){
            data[v] = doc.find('[data-key="'+v+'"]').val().trim();
        });
        data['connName'] = doc.find('[data-key="connName"]').val().trim() ;
        data['connName'] = data['connName'] || 'hdfs_simple';
        doc.find('[data-key="connName"]').val(data['connName']);
    }
    else {
        ['principal','coreSiteXml', 'hdfsSiteXml', 'keytab', 'krb5Conf'].map(function(v){
            data[v] = doc.find('[data-key="'+v+'"]').val().trim();
        });
        data['connName'] = doc.find('[data-key="connName"]').val().trim() ;
        data['connName'] = data['connName'] || 'hdfs_kerberos' ;
        doc.find('[data-key="connName"]').val(data['connName']);
    }

    var checkRes = checkDbInfo(data);
    $('.global-dbCon input').removeClass('error');
    if ( checkRes.res !== true ){
        MsgTip('', common_js_lang['dbManage.info.hdfsParamErr'], 'info');
        return false;
    }

    // 测试连接下 不传 id
    !delFlg && $('.global-dbCon .save').attr('data-id') && (data.hid = $('.global-dbCon .save').attr('data-id'));
    var formData = new FormData();
    formData.append('delFlg', delFlg ? -1 : 0 ) ;
    for ( k in data ) {
        formData.append(k, data[k]);
    }
    if ( authType == 1 ){
        ['coreSiteFile', 'hdfsSiteFile'].map(function(v){
            var fileObj = doc.find('.file.'+v)[0].files[0];
            fileObj && formData.append(v, fileObj);
        })
    }
    else {
        ['keytabFile', 'coreSiteFile', 'hdfsSiteFile', 'krb5File'].map(function(v){
            var fileObj = doc.find('.file.'+v)[0].files[0];
            fileObj && formData.append(v, fileObj);
        })
    }

    $('#waitLoading').find('article').html(delFlg? common_js_lang['dbManage.text.checkLink'] : common_js_lang['dbManage.text.saveLink']).end().css({display:'block'});
    $.ajax({
        url: delFlg && 'hdfs/connect' || 'hdfs/user/save',
        type: 'post',
        contentType: false,
        processData: false,        
        data: formData, 
        success: function(data){
            if ( delFlg ) {
                if (data.code != 200) {
                    $('.global-dbCon').find('.testRes').removeClass('right').addClass('err').html('<i class="fail"></i>' + common_js_lang['db.text.testFail'] + '<a class="showTip" data-info=' + encodeURIComponent(JSON.stringify(data)) + '>' + common_js_lang['db.text.errTip'] + '</a>');
                    return;
                }
                $('.global-dbCon').find('.testRes').removeClass('err').addClass('right').html('<i class="suc"></i>' + common_js_lang['db.text.testSuc']);
            }
            else {
                if (data.code != 200) {
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return;
                }
                if (delFlg) {
                    MsgTip({title: 'SUCCESS', text: common_js_lang['dbManage.info.linkSucc'], type: 'success', timer: 2000});
                    return;
                }
                MsgTip({title: 'SUCCESS', text: common_js_lang['manage.title.succ'], type: 'success', timer: 2000});
                $('.global-dbCon, .global-mask').toggle();
                $('nav a.cur').index() == 2 && getHdfsList(globalParam.hdfsListParam);
            }
        },
        complete: function(data){
            $('#waitLoading').css({display:'none'});
        }
    });
}

function ftpUpdate(delFlg){
    var doc = $('.global-dbCon .ftp') ;
    var data = {
        pid: $('.global-dbCon [data-key="pid"]').val() || '',
        delFlg:0
    } ;

    if ( !data.pid ){
        MsgTip('', common_js_lang['db.info.selectApp'], 'info');
        return false;
    }

    ['host', 'port', 'protocol', 'userName', 'password', 'connName'].map(function(v){
        data[v] = doc.find('[data-key="'+v+'"]').val().trim();
    });
    data['connName'] = data['connName'] || ['', 'FTP', 'SFTP'][data['protocol']]+'_'+data['host']+'_'+data['port'] ;
    doc.find('[data-key="connName"]').val(data['connName']);

    var checkRes = checkDbInfo(data);
    $('.global-dbCon input').removeClass('error');
    if ( checkRes.res !== true ){
        MsgTip('', common_js_lang['dbManage.info.ftpParamErr'], 'info');
        return false;
    }

    // 测试连接下 不传 id
    !delFlg && $('.global-dbCon .save').attr('data-id') && (data.id = $('.global-dbCon .save').attr('data-id'));
    if ( delFlg ){   //测试连接传oldpwd参数
        $('.global-dbCon .save').attr('data-id') ? data['oldpwd'] = doc.find('[data-key="password"]').attr('data-pwd') : data['oldpwd'] = '';
    }

    $('#waitLoading').find('article').html(delFlg? common_js_lang['dbManage.text.checkLink'] : common_js_lang['dbManage.text.saveLink']).end().css({display:'block'});
    $.ajax({
        url: delFlg && 'repo/ftp/connect' || 'repo/ftp/save',
        type: 'post',
        data: data,
        success: function(data){
            if ( delFlg ) {
                if (data.code != 200) {
                    $('.global-dbCon').find('.testRes').removeClass('right').addClass('err').html('<i class="fail"></i>' + common_js_lang['db.text.testFail'] + '<a class="showTip" data-info=' + encodeURIComponent(JSON.stringify(data)) + '>' + common_js_lang['db.text.errTip'] + '</a>');
                    return;
                }
                $('.global-dbCon').find('.testRes').removeClass('err').addClass('right').html('<i class="suc"></i>' + common_js_lang['db.text.testSuc']);
            }
            else {
                if (data.code != 200) {
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return;
                }
                if (delFlg) {
                    MsgTip({title: 'SUCCESS', text: common_js_lang['dbManage.info.linkSucc'], type: 'success', timer: 2000});
                    return;
                }
                MsgTip({title: 'SUCCESS', text: common_js_lang['manage.title.succ'], type: 'success', timer: 2000});
                $('.global-dbCon, .global-mask').toggle();
                $('nav a.cur').index() == 4 && getFtpList(globalParam.ftpListParam);
            }
        },
        complete: function(data){
            $('#waitLoading').css({display:'none'});
        }
    });
}

//上传文件
$('.global-dbCon').on('change', '.column.hdfs input:file', function(e){
    var fileName = $(this)[0].files[0].name;
    $(this).parents('.upload').find('> input').val(fileName).attr('title', fileName);
});

$('.column.ftp').on('change', '[data-key="protocol"]', function(){
    if ( $(this).val() == 1 ){
        $('.column.ftp [data-key="port"]').val(21);
    }
    else {
        $('.column.ftp [data-key="port"]').val(22);
    }
});


// 进入新增连接状态
$('.innerCon nav').on('click', '.add-link', function(){
    $('.global-dbCon h4 .title').html(common_js_lang['dbManage.title.newRes']);
    $('.global-dbCon input').val('').removeClass('error');
    $('.db.column [data-key="dbType"]').change();
    $('.db-info .save').attr('data-id', '');
    $('.column.hdfs [data-key="connName"]').attr('data-val1', '').attr('data-val2', ''); 
    $('.global-dbCon #seltType').prop('disabled',false);
         
    $('.global-dbCon .param .tr:not(".thead")').remove();
    $('.global-dbCon .param').html(globalParam.tmpParamHtml);
    $('.global-dbCon .tab span').eq(0).click();

    var type = $('nav a.cur').data('type');
    $('#seltType').val(type).change();
    $('.column.ftp [data-key="protocol"]').change();
    $('.column.hive .ha.zk .del').parent().remove();
    $('.global-dbCon, .global-mask').fadeIn();
    $('#userApp').select2();
    $('.global-dbCon').find('.testRes').empty();
});

// 进入编辑状态
$('.db-manage').on('click', 'a.edit', function(){
    $('.global-dbCon input').val('').removeClass('error');
    $('.column.hive .ha.zk .del').parent().remove();
    $('.column.hdfs [data-key="connName"]').attr('data-val1', '').attr('data-val2', '');
    $('.global-dbCon #seltType').prop('disabled', true);
    var tr = $(this).parents('tr').data("val");
    var data = {
        id: tr.id,
        pid: tr.pid,
        hid: tr.hid,
        authType: tr.authType,
        password: tr.password,
        userName: tr.userName,
        host: tr.host,
        port: tr.port,
        dbType: tr.dbType,
        dbName: tr.dbName || '',
        url: tr.url,
        connName: tr.connName,
        keytab: tr.keytab,
        principal: tr.principal,
        coreSiteXml: tr.coreSiteXml,
        hdfsSiteXml: tr.hdfsSiteXml,
        krb5Conf: tr.krb5Conf,
        protocol: tr.protocol,
        ha: tr.ha
    };

    $('.columnTop #userApp').val(data.pid).select2();

    if ( data.authType ){
        $('.global-dbCon #seltType').val('hdfs').change();
        var doc = $('.global-dbCon .column.hdfs');
        doc.find('.authType [data-val="'+data.authType+'"]').click();

        var columnArr = ['keytab', 'principal', 'connName', 'coreSiteXml', 'hdfsSiteXml', 'krb5Conf'] ;
        data.authType == 1 && (columnArr = ['userName', 'connName', 'coreSiteXml', 'hdfsSiteXml']);
        for ( k in data ){
            if ( columnArr.indexOf(k) == -1 )
                continue ;
            doc.find('[data-key="'+k+'"]').val(data[k]);
        }
        ['keytab', 'coreSiteXml', 'hdfsSiteXml', 'krb5Conf'].map(function(v){
            doc.find('[data-key="'+v+'"]').attr('title', data[v])
        }) ;
    }
    else if ( data.protocol ){
        $('.global-dbCon #seltType').val('ftp').change();
        var doc = $('.global-dbCon .column.ftp');
        ['host', 'port', 'protocol', 'userName', 'password', 'connName'].map(function(v){
            doc.find('[data-key="'+v+'"]').val(data[v]);
        });
        doc.find('[data-key="password"]').attr('data-pwd', data['password']);
    }
    else {
        if ( data.dbType == globalParam.hiveId ){
            $('.global-dbCon #seltType').val('hive').trigger('change', data.hid);
        }
        else if ( data.dbType == 62 ){
            $('.global-dbCon #seltType').val('spark').trigger('change', data.hid);
        }
        else {
            $('.global-dbCon #seltType').val('db').change();            
            var doc = $('.global-dbCon .column.db');            
        }

        if ( [globalParam.hiveId, 62].indexOf(+data.dbType) > -1 ){
            var doc = $('.global-dbCon .column.hive');
            if ( data.ha ){   //HA模式
                doc.find('[data-key="mode"]').val('1').change();
            }
            else {
                doc.find('[data-key="mode"]').val('0').change();
            }
        }

        if ( data.ha ){   //HA模式
            data.serviceDiscoveryMode = tr.haParams.serviceDiscoveryMode || '';
            data.zooKeeperNamespace = tr.haParams.zooKeeperNamespace || '';
        for (var k in data ){
                if (['connName', 'url', 'userName', 'serviceDiscoveryMode', 'zooKeeperNamespace'].indexOf(k) > -1)
                    doc.find('[data-key="' + k + '"]').val(data[k]);
            }
            try {
                var hostArr = data.host.split(','),
                    hostLen = hostArr.length ;
                for ( var i= 0; i<hostLen; i++ ){
                    var hostStr = hostArr[i].split(':'),
                        _host = hostStr.slice(0, -1).join(':'),
                        _port = hostStr.slice(-1)[0] ;

                    if ( i == 0 ){
                        doc.find('[data-key="zkhost"]').val(_host);
                        doc.find('[data-key="zkport"]').val(_port);
                        continue ;
                    }

                    var zkArr = $('.column.hive').find('.ha.zk'),
                        len = zkArr.length,
                        lastChild = zkArr.eq( len -1),
                        newDom = lastChild.clone();
                    newDom.find('.add').removeClass('add').addClass('del').text(common_js_lang['clientList.option.del']);
                    newDom.find('[data-key="zkhost"]').val(_host);
                    newDom.find('[data-key="zkport"]').val(_port);
                    lastChild.after( newDom );
                }
            } catch(e) {}
        }
        else {
            for (var k in data) {
            if ( ['connName', 'url', 'host', 'port', 'dbName', 'userName', 'password', 'dbType'].indexOf(k) > -1 )
                doc.find('[data-key="'+k+'"]').val(data[k]);
        }
        doc.find('[data-key="password"]').attr('data-pwd', data['password']);
        }

        $('.global-dbCon .param .tr:not(".thead")').remove();
        var params = tr.params,
            paramList = [],
            length = 0 ;
        for (var k in params ){
            length ++ ;
        }
        var paramHtml = '';
        if ( length == 0 ){
            for ( var i=0; i<5; i++ )
                paramHtml += '<div class="tr clearfix '+(i == 4 ? 'last':'')+'"><div class="paramList"><select></select></div><div class="key"><input maxlength="30" type="text"></div><div class="val"><input maxlength="30" type="text"></div><div title="'+common_js_lang['clientList.option.del']+'" class="act"><a><i class="del"></i></a></div></div>';
        }
        else {
            for ( k in params ){
                length -- ;
                paramHtml += '<div class="tr clearfix '+(length == 0 ? 'last':'')+'"><div class="paramList"><select></select></div><div class="key"><input maxlength="30" type="text" value="'+k+'"></div><div class="val"><input maxlength="30" type="text" value="'+params[k]+'"></div><div title="'+common_js_lang['clientList.option.del']+'" class="act"><a><i class="del"></i></a></div></div>';
            }
        }
        $('.global-dbCon .param .thead').after(paramHtml); 
    }
    $('.global-dbCon h4 .title').html(common_js_lang['dbManage.title.resEdit']);
    $('.global-dbCon .tab span').eq(0).click();
    $('.global-dbCon .save').attr('data-id', data.id);   // 保存 id
    $('.global-dbCon, .global-mask').fadeIn();
    $('#userApp').select2();
    $('.global-dbCon').find('.testRes').empty();
});

//保存
function updateLink(data){
    $.ajax({
        url: 'db/update',
        type: 'post',
        contentType: 'application/x-www-form-urlencoded',
        data: data,
        success:function(data){
            if ( data.code != 200 ){
                ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                return ;
            }
            $('.global-dbCon, .global-mask').toggle();
            MsgTip({title:'SUCCESS', text: common_js_lang['dbManage.info.updateSucc'], type:'success', timer:2000});
            getDBList(globalParam.dbListParam, $('nav a.cur').index());
        },
        complete: function(){
            $('#waitLoading').css({display:'none'});
        }
    });
}

//删除数据
$('.db-manage').on('click', 'a.del', function(){
    var self = $(this);
    var id = self.parents('tr').attr('data-id');    
    var relyTip = '';
    
        if ( self.hasClass('db') || self.hasClass('hive') ){
            relyTip += '<div class="tip">'+common_js_lang['dbManage.info.del2Task']+':</div>';
            $.fn.ajaxAPI({
                url: 'db/rely/jobs?dbId='+id,
                async: false,
                callback: function(data){
                    relyTip += '<div class="tip">'+common_js_lang['dbManage.text.have']+'['+data.model.length+']'+common_js_lang['dbManage.text.task']+'</div>';
                    data.model.map(function(v){
                        relyTip += '<div class="tip-item">[id:'+v.id+' -> '+common_js_lang['dbManage.text.taskName']+':'+v.jobName+']</div>' ;
                    });
                }
            })
        } 
        else if ( self.hasClass('hdfs') ){
            relyTip += '<div class="tip">'+common_js_lang['dbManage.info.del2hive']+':</div>';            
            $.fn.ajaxAPI({
                url: 'hdfs/rely/hives?hdfsId='+id,
                async: false,
                callback: function(data){
                    relyTip += '<div class="tip">'+common_js_lang['dbManage.text.have']+'['+data.model.length+']'+common_js_lang['dbManage.text.hiveMount']+'</div>';
                    data.model.map(function(v){
                        relyTip += '<div class="tip-item">[id:'+v.id+' -> '+common_js_lang['dbManage.option.connName']+':'+v.connName+']</div>' ;
                    });
                }
            });

            relyTip += '<div class="tip">'+common_js_lang['dbManage.info.del2Task']+':</div>';
            $.fn.ajaxAPI({
                url: 'hdfs/rely/jobs?hdfsId='+id,
                async: false,
                callback: function(data){
                    relyTip += '<div class="tip">'+common_js_lang['dbManage.text.have']+'['+data.model.length+']'+common_js_lang['dbManage.text.task']+'</div>';
                    data.model.map(function(v){
                        relyTip += '<div class="tip-item">[id:'+v.id+' -> '+common_js_lang['dbManage.text.taskName']+':'+v.jobName+']</div>' ;
                    });
                }
            });
        }
        else if ( self.hasClass('ftp')){
            relyTip += '<div class="tip">'+common_js_lang['dbManage.info.del2Task']+':</div>';
            $.fn.ajaxAPI({
                url: 'repo/ftp/rely/jobs?ftpId='+id,
                async: false,
                callback: function(data){
                    relyTip += '<div class="tip">'+common_js_lang['dbManage.text.have']+'['+data.model.length+']'+common_js_lang['dbManage.text.task']+'</div>';
                    data.model.map(function(v){
                        relyTip += '<div class="tip-item">[id:'+v.id+' -> '+common_js_lang['dbManage.text.taskName']+':'+v.jobName+']</div>' ;
                    });
                }
            })
        }
    swal({ 
        html: true,
        title: "",
        text: common_js_lang['dbManage.info.isDelLink']+ ' '+relyTip,   
        type: "info",
        showCancelButton: true   
        },
        function(){
            var url = 'db/delete' ,
                param = {id:id} ;
            self.hasClass('hdfs') && (url = 'hdfs/user/delete', param={hdfsId:id}) ;
            self.hasClass('ftp') && (url = 'repo/ftp/delete', param={ftpId:id});
            $.fn.ajaxAPI({
                url: url,
                type: 'post',
                contentType: 'application/x-www-form-urlencoded',
                data: param,
                callback: function(){
                    MsgTip({title:'SUCCESS', text:common_js_lang['manage.info.delSucc'], type:'success', timer:2000});
                    if ( $('#db-manage-list tbody tr').length <= 1 ){
                        globalParam.dbListParam.pageNo = globalParam.dbListParam.pageNo - 1 || 1;
                        globalParam.hdfsListParam.pageNo = globalParam.hdfsListParam.pageNo - 1 || 1;
                        globalParam.ftpListParam.pageNo = globalParam.ftpListParam.pageNo - 1 || 1;
                    }
                },
                complete: function(){
                    [0,1,3].indexOf(+$('nav a.cur').index()) > -1 && getDBList(globalParam.dbListParam, $('nav a.cur').index());
                    $('nav a.cur').index() == 2 && getHdfsList(globalParam.hdfsListParam);
                    $('nav a.cur').index() == 4 && getFtpList(globalParam.ftpListParam);
                }
            });
        });
    
});
