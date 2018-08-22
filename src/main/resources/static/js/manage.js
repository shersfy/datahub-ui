
// artTemplate 模板 时间格式化
;template.helper('dateFormat', function (date, format) {
    date = new Date(date);
    var map = {
        "M": date.getMonth() + 1, //月份 
        "d": date.getDate(), //日 
        "h": date.getHours(), //小时 
        "m": date.getMinutes(), //分 
        "s": date.getSeconds(), //秒 
        "q": Math.floor((date.getMonth() + 3) / 3), //季度 
        "S": date.getMilliseconds() //毫秒 
    };
    format = format.replace(/([yMdhmsqS])+/g, function(all, t){
        var v = map[t];
        if(v !== undefined){
            if(all.length > 1){
                v = '0' + v;
                v = v.substr(v.length-2);
            }
            return v;
        }
        else if(t === 'y'){
            return (date.getFullYear() + '').substr(4 - all.length);
        }
        return all;
    });
    return format;
});


var datepickerLang = common_i18n_lang == 'zh' ? 'zh-cn' : 'en' ;
$('#startDate').on('click', function(){
    WdatePicker({readOnly:true,lang:datepickerLang,isShowClear:false,maxDate:'#F{$dp.$D(\'endDate\')}'});
});
$('#endDate').on('click', function(){
    WdatePicker({readOnly:true,lang:datepickerLang,isShowClear:false,minDate:'#F{$dp.$D(\'startDate\')}'});
});

var tmpParam = {
    listSendData : {pageNo:1, pageSize:10, groups: '1,2,4,5,6,7,8,9,10,11,12'},
    allUserOption: '',
    dbtype: {
        38: 'MySQL', 52: 'AliMySQL', 56: 'AwsMySQL',
        4: 'Oracle', 60: 'AwsOracle',
        40: 'SQL Server', 53: 'AliSQLServer', 57: 'AwsSQLServer',
        44: 'DB2',
        24: 'PostgreSQL', 54: 'AliPostgreSQL', 58: 'AwsPostgreSQL'
    }
};
$.extend(globalParam, tmpParam);

function getUsers(pids){
    if ( !pids && globalParam.allUserOption ){
        $('#taskUser').html(globalParam.allUserOption);
        return ;
    }
    $.fn.ajaxAPI({
        url: 'job/users',
        data: {pids: pids || ''},
        callback: function(data){
            var userHtml = '<option value="">'+common_js_lang['manage.info.allOwner']+'</option>';
            data.model.map(function(v){
                userHtml += '<option value="'+v.id+'">'+v.userName+'</option>';
            });
            $('#taskUser').html(userHtml);
            !pids && (globalParam.allUserOption = userHtml) ;
        }
    })
}
getUsers();    // 取创建人信息
list();

function list(){
    var reqPage = +globalParam.listSendData.pageNo || 1;
    reqPage < 1 ? reqPage = 1 : '' ;
    globalParam.listSendData.pageNo = reqPage ;
    $.fn.ajaxAPI({
        url: 'job/list',
        data: globalParam.listSendData,
        callback: function(data){
            if ( data.model.totalPage && data.model.totalPage < reqPage ){
                globalParam.listSendData.pageNo = data.model.totalPage;
                list();
                return ;
            }

            var nowTime = Date.now();
            data.model.data = data.model.data.map(function(v){
                if ( v.endTime && v.endTime < nowTime ){
                    v.isEnd = true;
                }
                v.groupName = v.fromObject ? globalParam.dbtype[v.fromObject.dbType] : common_js_lang[v.groupName];
                v.periodStr = common_js_lang[v.periodStr];
                return v;
            });
            $('.listCon .list').html(template('template/taskTable', data.model));
            $('.listCon .list .pager').bootpag({
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
                globalParam.listSendData.pageNo = page;
                list();
            });  
        }
    });
}

// 查询
$('.act').on('click', '.query', function(){
    var taskId = $('#taskId').val().trim(),
        taskName = $('#taskName').val().trim(),
        taskStatus = $('#taskStatus').val().trim(),
        startDate = $('#startDate').val().trim(),
        endDate = $('#endDate').val().trim(),
        pids = $('#userApp').val(),
        taskUser = ($('#taskUser').val() || '').trim() ;
 
    if ( taskId != '' && !taskId.match(/^[0-9]+$/) ){
        MsgTip('', common_js_lang["manage.info.taskIdInfo"], 'info');
        return ;
    }

    if ( taskId != '' ) {
        taskId = +taskId;
        if ( taskId <= 0 ){
            MsgTip('', common_js_lang['manage.info.taskIdInfo'], 'info');
            return false;
        }
        $('#taskId').val(taskId);
    }

    globalParam.listSendData = {
        pageNo : 1,
        pageSize : 10,
        id: taskId,
        jobName: taskName, 
        status: taskStatus,
        startTimeStr: startDate,
        endTimeStr: endDate,
        userId: taskUser,
        groups: '1,2,4,5,6,7,8,9,10,11,12',
        pids: pids
    } ;
    if ( !pids ){
        delete globalParam.listSendData.pids ;
    }
    list();
});


// 应用 改变， 创建人跟随变化
$('body').on('change', '#userApp', function(){
    var pids = $(this).val();
    $('.search-form .myTask i').removeClass('checked');
    getUsers(pids);
});


$('body').on('keyup', '.search input', function(e){
    if ( e.keyCode == 13 ){
        $('.act .query').click();
    }
});

// 重置
$('.act').on('click', '.reset', function(){
    $('.search-form input, .search-form select').val("").prop('checked', false);
    $('.search-form select').change();
});

// 选中我为创建人
$('.myTask').on('click', function(){
    var icon = $(this).find('i');
    if ( !icon.hasClass('checked') ){
        var myId = icon.addClass('checked').data('id');
    }
    else {
        icon.removeClass('checked');
        var myId = '';
    }
    $('#taskUser').val(myId);    
});
$('#taskUser').on('change', function(){
    if ( $(this).val() == $('.myTask i').data('id') ){
        $('.myTask i').addClass('checked');
    } 
    else {
        $('.myTask i').removeClass('checked');        
    }
});


// 启动 停止
$('.list').on('click', '.enable', function(){
    var id = $(this).parent().data('id'),
        self = $(this) ;

    $.fn.ajaxAPI({
        url: 'job/enable',
        type: 'post',
        contentType: 'application/x-www-form-urlencoded',        
        data: {id: id},
        callback: function(data){
            MsgTip({title:'SUCCESS', text:common_js_lang['manage.info.taskEnable'], type:'success', timer:2000});
            list();
        }
    });
});

$('.list').on('click', '.disable', function(){
    var id = $(this).parent().data('id'),
        self = $(this) ;

    $.fn.ajaxAPI({
        url: 'job/disable',
        type: 'post',
        contentType: 'application/x-www-form-urlencoded',        
        data: {id: id, once:false},
        callback: function(data){
            MsgTip({title:'SUCCESS', text: common_js_lang['manage.info.taskDisable'], type:'success', timer:2000});
            list();
        }
    });
});

$('.list').on('click', '.del', function(){
    var id = $(this).parent().data('id'),
        self = $(this) ;
    
    swal({
        title: "",   
        text: common_js_lang['manage.info.isDelTask']+"["+id+"]?",   
        type: "info",   
        showCancelButton: true
    }, function(){
        $.fn.ajaxAPI({
            url: 'job/delete',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',        
            data: {id: id},
            callback: function(data){
                MsgTip({title:'SUCCESS', text: common_js_lang['manage.info.delSucc'], type:'success', timer:2000});
                if ( $('.list tbody tr').length <= 1 ){
                    globalParam.listSendData.pageNo = globalParam.listSendData.pageNo - 1 || 1;
                }
                list();
            }
        });
    });
    
});

$('.list').on('click', '.edit', function(){
    if ( $(this).siblings('.enable').length != 1 ){
        MsgTip('', common_js_lang['manage.info.editNote'], 'info');
        return ;
    }
    location.href = $(this).data('href');
});

$('.list').on('click', '.copy', function(){
    location.href = $(this).data('href');
});