
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

;template.helper('timeCount', function (time) {
    time = +time || 0;
    var second = parseInt(time / 1000),
        hour = parseInt(second / (60*60)) ,
        minute = parseInt(second % (60*60) / 60),
        s = parseInt(second % 60) ;
    hour < 10 && (hour = '0'+hour);
    minute < 10 && (minute = '0'+minute);
    s < 10 && (s = '0'+s);

    return hour+':'+minute+':'+s;
});

var datepickerLang = common_i18n_lang == 'zh' ? 'zh-cn' : 'en' ;
$('#startDate').on('click', function(){
    WdatePicker({readOnly:true,lang:datepickerLang,isShowClear:false,maxDate:'#F{$dp.$D(\'endDate\')}'})
});
$('#endDate').on('click', function(){
    WdatePicker({readOnly:true,lang:datepickerLang,isShowClear:false,minDate:'#F{$dp.$D(\'startDate\')}'})
});

var tmpParam = {
    listSendData : {
        pageNo : 1,
        pageSize : 10,
        jobId: '',
        jobName: '',
        status: '',
        startTimeStr: '',
        endTimeStr: '',
        userId: '',
        pids: ''
    },
    urlObj: {},
    logInterval: 0,
    allUserOption: ''
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

try{
    // 取url参数
	var urlParam = location.search.replace(/^\?|\?$/g, '').split('&');
	for ( var i=0,len=urlParam.length; i<len; i++ ){
		var obj = urlParam[i].split('=');
		globalParam.urlObj[obj[0]] = obj[1] || '' ;
	}

    if ( globalParam.urlObj.jobId ){
        globalParam.listSendData.jobId = globalParam.urlObj.jobId ;
        $('#taskId').val(globalParam.urlObj.jobId);
        if ( globalParam.urlObj.groups == 3 ){
            globalParam.listSendData.groups = 3;
            globalParam.listSendData.fromId = globalParam.urlObj.fromId ;
        }
    }
}
catch(e){

};
list();

function list(){
    var reqPage = +globalParam.listSendData.pageNo || 1;
    reqPage < 1 ? reqPage = 1 : '' ;
    globalParam.listSendData.pageNo = reqPage ;

    $.fn.ajaxAPI({
        url: 'job/log/list',
        data: globalParam.listSendData,
        callback: function(data){
            if ( data.model.totalPage && data.model.totalPage < reqPage ){
                globalParam.listSendData.pageNo = data.model.totalPage;
                list();
                return ;
            }

            data.model.data = data.model.data.map(function(v){
                v.jobInfoVo.periodStr = common_js_lang[v.jobInfoVo.periodStr];
                if ( v.jobInfoVo.projName === 'job.log.project.client' )
                    v.jobInfoVo.projName = common_js_lang['job.log.project.client'];
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
        jobIdLike: taskId,
        jobName: taskName,
        status: taskStatus,
        startTimeStr: startDate,
        endTimeStr: endDate,
        userId: taskUser,
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

// 运行记录
$('.list').on('click', '.log', function(){
    var id = $(this).parent().data('id'),
        jobId = $(this).parent().data('jobid');

    $.fn.ajaxAPI({
        url: 'job/log/detail',
        data: {jobId:jobId, logId: id},
        callback: function(data){
            $('.global-log h4 .title').html(common_js_lang['manage.info.task']+'['+jobId+'] '+ common_js_lang['manage.info.instance'] +'['+id+'] '+common_js_lang['manage.info.log']);
            data.model = data.model || '';
            data.model = data.model.replace(/(\[ERROR\].*(?=\n))/g, '<span>$1</span>');
            data.model = data.model.replace(/\n/g, '<br />');
            data.model = data.model.replace(/\t/g, '&emsp;&emsp;');
            // $('.global-log .detail').html(data.model);
            $('.global-log .detail').html('');
            sliceLog(data.model);
            $.fn.ajaxAPI({
                url: 'hdfs/data/list',
                data: {jobId:jobId, logId: id},
                callback: function(data){
                    if ( data.model && data.model.length > 0 ){
                        $('.log .download').show().find('a').attr('href', 'hdfs/data/download?jobId='+jobId+'&logId='+id);
                    }
                    else {
                        $('.log .download').hide();
                    }
                    $('.global-mask, .global-log').fadeIn();
                    $('.global-log .detail').scrollTop(0);
                }
            });
        }
    });
});

function sliceLog(data){
    var sliceLength = 10000;
    if ( data.length <= 0 )
        return ;
    $('.global-log .detail').append(data.slice(0, sliceLength));
    data = data.slice(sliceLength);
    globalParam.logInterval = setTimeout(function(){sliceLog(data)}, 100);
}

// 关闭日志
$('.global-log').on('click', '.cancel', function(){
    $('.global-mask, .global-log').fadeOut();
    clearInterval( globalParam.logInterval );
});

$('.list').on('click', '.disable', function(){
    var id = $(this).parent().data('jobid');
    swal({
        title: '',
        text: common_js_lang['manage.tip.disableJob'],
        type: 'info',
        showCancelButton: true
    }, function(isConfirm){
        if ( isConfirm ){
            $.fn.ajaxAPI({
                url: 'job/disable',
                data: {id: id, once:true},
                type: 'post',
                contentType: 'application/x-www-form-urlencoded',
                callback: function(data){
                    MsgTip('success', common_js_lang['manage.info.taskDisable']);
                    list();
                }
            });
        }
        else {
            swal.close();
        }
    });
});