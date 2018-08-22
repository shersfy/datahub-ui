//禁止ie的ajax缓存
 $.ajaxSetup({ cache:false }); 
//url连接参数获取：
function GetRequest() {
	var url = location.search; //获取url中"?"符后的字串   
	var theRequest = new Object();
	if(url.indexOf("?") != -1) {
		var str = url.substr(1);
		strs = str.split("&");
		for(var i = 0; i < strs.length; i++) {
			theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
		}
	}
	return theRequest;
};
template.helper('cronParse', function(cron) {
	var type = '';
	var cronArr = [];
	if(cron == "* * * * * ?") {
		type = "atOnce";
	} else {
		cronArr = cron.split(" ");
		if(cronArr.length == 7) {
			type = "onceTime";
		} else {
			if(parseInt(cronArr[0]) == 0 && parseInt(cronArr[1]) && cronArr[2] == '*') {
				type = "hour";
			} else if(parseInt(cronArr[1]) && parseInt(cronArr[2]) && cronArr[3] == "*" && cronArr[4] == "*") {
				type = "day";
			} else if(parseInt(cronArr[1]) && parseInt(cronArr[2]) && cronArr[3] == "?" && cronArr[4] == "*") {
				type = "week";
			} else {
				type = "month";
			}
		}
	}
	return type;
});
template.helper('getDate', function(timePoint) {
	var date = new Date(timePoint);
	date = date.toLocaleDateString().replace(/\//g, "/");
	return date;
})
var taskData = {};
taskData.pageNo = 1;
taskData.pageSize = 5;
taskData.fromId = GetRequest().id;
//分页信息
function taskMsg() {
    var selfParam = {pageNo: taskData.pageNo};
    selfParam.pageNo = +selfParam.pageNo || 1;
    selfParam.pageNo < 0 ? selfParam.pageNo = 1 : '' ;
    taskData.pageNo = selfParam.pageNo ;
	$.ajax({
		url: 'online/client/job/list',
		data: {
			pageNo: taskData.pageNo,
			pageSize: taskData.pageSize,
			fromId: taskData.fromId
		},
		success: function(data) {
            if ( data.model.totalPage && data.model.totalPage < selfParam.pageNo ){
                taskData.pageNo = data.model.totalPage ;
                taskMsg();
                return ;
            }

            data.model.data = data.model.data.map(function(v){
                v.periodStr = common_js_lang[v.periodStr] + (['job.period.PeriodOnceOntime', 'job.period.PeriodOnceImmed'].indexOf(v.periodStr) == -1 ? common_js_lang['client.text.exec'] : '');
                return v;
            });

            $(".dispatchList").html(template('template/task', {
				data: data.model.data
			}));
			$(".dispatchList .pager").bootpag({
				total: data.model.totalPage,
				page: data.model.currentPage,
				maxVisible: 5,
				leaps: false,
				firstLastUse: true,
				prev: '<i>〈</i>',
				next: '<i>〉</i>',
				first: '<i>《</i>',
				last: '<i>》</i>'
			}).off().on('page', function(e, page) {
				taskData.pageNo = page;
				taskMsg();
			})
		}
	})
}
taskMsg();
setInterval("taskMsg()",10000);
function eventBind() {
	//新建任务跳转：
	$(".newTask").click(function() {
		location.href = "./client.task?clientId=" + GetRequest().id;
	})
	$("body").on("click", ".watchRecord", function() {
		var taskId = $(this).attr("jobid");
		location.href = "./task.detail?jobId=" + taskId+"&pid=0";
	})
	$("body").on("mouseenter", ".watchRecord", function(e) {
		var pTip = "<p class='nameTip' style='color:#999;box-shadow:2px 3px #888;background-image:linear-gradient(to bottom,#fff,#eee);position:fixed;top:" + parseInt(e.clientY+20) + "px;left:" + parseInt(e.clientX-40) + "px;line-height:20px;padding-left:8px;padding-right:8px;background:#FFF;border-radius:3px;width:auto;border:1px solid #e1e1e1;z-index:30;'>"+common_js_lang['clientM.title.viewRunLog']+"</p>";
		$("body").append(pTip);
	})
	$("body").on("mouseleave", ".watchRecord", function(e) {
		$(".nameTip").remove();
	})
	$("body").on("click", ".taskEdit", function() {
		var taskId = $(this).attr("field"),
			jobId=$(this).attr("jobid");
		location.href = "./client.task?clientId=" + GetRequest().id +"&jobId="+jobId;
	})
	$("body").on("mouseenter", ".taskEdit", function(e) {
		var pTip = "<p class='nameTip' style='color:#999;box-shadow:2px 3px #888;background-image:linear-gradient(to bottom,#fff,#eee);position:fixed;top:" + parseInt(e.clientY+10) + "px;left:" + parseInt(e.clientX-30) + "px;line-height:20px;padding-left:8px;padding-right:8px;background:#FFF;border-radius:3px;width:auto;border:1px solid #e1e1e1;z-index:30;'>"+common_js_lang['clientM.title.editTask']+"</p>";
		$("body").append(pTip);
	})
	$("body").on("mouseleave", ".taskEdit", function(e) {
		$(".nameTip").remove();
	});

    $('body').on('click', '.del', function(){
        var id = $(this).parents('.taskExplain').attr('field'),
            self = $(this) ;

        swal({
            title: "",
            text: common_js_lang['manage.info.isDelTask']+"["+id+"]?",
            type: "info",
            showCancelButton: true
        }, function(){
            $.ajax({
                url: 'job/delete',
                type: 'post',
                contentType: 'application/x-www-form-urlencoded',
                data: {id: id},
                success: function(data){
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }
                    MsgTip({title:'SUCCESS', text: common_js_lang['manage.info.delSucc'], type:'success', timer:2000});
                    taskMsg();
                }
            });
        });
    });
}
function init() {
	eventBind();
}
init();