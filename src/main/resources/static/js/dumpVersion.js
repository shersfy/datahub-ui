//文件大小判定：
function fileSize(size) {
	if(size < 1024) {
		return(size || 0) + "bytes";
	} else if(size < 1024 * 1024) {
		return(size / 1024).toFixed(2) + "KB";
	} else {
		return(size / 1024 / 1024).toFixed(2) + "MB";
	}
}

function getDate(timePoint) {
	var date = new Date(timePoint);
	date = date.toLocaleDateString().replace(/\//g, "-") + " " + date.toTimeString().substr(0, 8);
	return date;
}
template.helper('filSize', function(size) {
		if(size < 1024) {
			return(size || 0) + "bytes";
		} else if(size < 1024 * 1024) {
			return(size / 1024).toFixed(2) + "KB";
		} else {
			return(size / 1024 / 1024).toFixed(2) + "MB";
		}
	})
	// artTemplate 模板 时间格式化
;
template.helper('dateFormat', function(date, format) {

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
	format = format.replace(/([yMdhmsqS])+/g, function(all, t) {
		var v = map[t];
		if(v !== undefined) {
			if(all.length > 1) {
				v = '0' + v;
				v = v.substr(v.length - 2);
			}
			return v;
		} else if(t === 'y') {
			return(date.getFullYear() + '').substr(4 - all.length);
		}
		return all;
	});
	return format;
});

var datepickerLang = common_i18n_lang == 'zh' ? 'zh-cn' : 'en' ;
$('#startDate').on('click', function(){
	WdatePicker({onpicked:vChange,lang:datepickerLang,readOnly:true,isShowClear:false,maxDate:'#F{$dp.$D(\'endDate\')}'});
});
$('#endDate').on('click', function(){
    WdatePicker({onpicked:vChange,lang:datepickerLang,readOnly:true,isShowClear:false,minDate:'#F{$dp.$D(\'startDate\')}'});
});


//dump版本初始化信息：
var versionsMsg = {
		pageNo: 1,
		pageSize: 10,
		likeVer: $(".searchInput").val(),
		startTimeStr: $("#startDate").val(),
		endTimeStr: $("#endDate").val()
	}
	//时间填充：
var curDate = new Date(),
	curYear = curDate.getFullYear(),
	tempMonth = curDate.getMonth() + 1,
	curMonth = tempMonth > 9 ? tempMonth : '0' + tempMonth,
	tempDay = curDate.getDate(),
	curDay = tempDay > 9 ? tempDay : '0' + tempDay;
versionsMsg.startTimeStr = getRecent3month() + '-01';
versionsMsg.endTimeStr = curYear + '-' + curMonth + '-' + curDay;
$("#startDate").val(versionsMsg.startTimeStr);
$("#endDate").val(versionsMsg.endTimeStr);

function getRecent3month() {
	if(curMonth < 3) {
		var lastYear = curYear - 1,
			month = 12 + (curMonth - 2),
			recent3month = lastYear + '-' + month;
	} else
		var recent3month = curYear + '-' + (curMonth - 2);

	return recent3month;
}

function versionInit(versionsMsg) {
    var selfParam = versionsMsg;
    var reqPage = +versionsMsg.pageNo || 1;
    reqPage < 1 ? reqPage = 1 : '' ;
    versionsMsg.pageNo = reqPage ;

	$.ajax({
		url: 'job/dump/version/list',
		data: {
			pageNo: versionsMsg.pageNo,
			pageSize: versionsMsg.pageSize,
			version: versionsMsg.likeVer,
			startTimeStr: versionsMsg.startTimeStr,
			endTimeStr: versionsMsg.endTimeStr
		},
		success: function(data) {
            if ( data.model.totalPage && data.model.totalPage < reqPage ){
                versionsMsg.pageNo = data.model.totalPage;
                versionInit(versionsMsg);
                return ;
            }

			$(".versionTabZone").html(template('template/dumpVersionTotal', {
				data: data.model.data
			}));
			$(".versionTabZone .pager").bootpag({
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
				versionsMsg.pageNo = page;
				versionsMsg.likeVer = $(".searchInput").val();
				versionsMsg.startTimeStr = $("#startDate").val();
				versionsMsg.endTimeStr = $("#endDate").val();
				versionInit(versionsMsg);
			})
		}
	})
}
versionInit(versionsMsg);

$(".versionSearchBtn").click(function() {
	var likeVer = $(".searchInput").val();
	var startT = $("#startDate").val();
	var endT = $("#endDate").val();
	versionsMsg.likeVer = likeVer;
	versionsMsg.startTimeStr = startT;
	versionsMsg.endTimeStr = endT;
	versionInit(versionsMsg);
})
$("#startDate").change(function() {
	var newStartDate = $(this).val();
	versionsMsg.startTimeStr = newStartDate;
	versionInit(versionsMsg);
})
$("#endDate").change(function() {
	var newEndDate = $(this).val();
	versionsMsg.endTimeStr = newEndDate;
	versionInit(versionsMsg);
})
$("body").on("click", ".active", function() {
	$(this).addClass("active").siblings(".active").removeClass("active");
})
$("body").on("click", ".detailBtn", function() {
	var id = $(this).attr("field");
	location.href = "./dumpDetail?id=" + id;
})

function vChange() {
	var startT = $("#startDate").val();
	var endT = $("#endDate").val();
	versionsMsg.startTimeStr = startT;
	versionsMsg.endTimeStr = endT;
	versionInit(versionsMsg);
};