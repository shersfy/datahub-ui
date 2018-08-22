$(function() {
	function dumpDetail() {
		//辅助方法：
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
		}
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
		//查询方法
		function versionInit(id) {
			$.ajax({
				url: 'job/dump/version',
				data: {
					id: id
				},
				success: function(data) {
					if(data.code==-1){
						location.href='./';
						return false;
					}
					if(data.code == 200) {
						var tr1 = "<tr><td>" + data.model.version + "</td><td>" + getDate(data.model.createTime) + "</td>";
						if(data.model.toType == 8) {
							var tr2 = "<td>" + "HDFS" + "</td>";
						} else if(data.model.toType == 9) {
							var tr2 = "<td>" + "HIVE" + "</td>";
						} else if(data.model.toType == 2) {
							var tr2 = "<td>" + "database" + "</td>";
						}

						var tr3 = "<td>" + data.model.dumpList.length + "</td><td>" + fileSize(data.model.totalSize) + "</td></tr>";
					}
					$("#versionTb").append(tr1 + tr2 + tr3);
					var one = "";
					for(var f = 0; f < data.model.dumpList.length; f++) { //填充所导入的数据表
						one += '<div class="oneMsg" bakPath="' + data.model.dumpList[f].bakPath.replace(/\\/g, "/") + '" desPath="' + data.model.dumpList[f].destPath + '" tableName="' + data.model.dumpList[f].tableName + '" field="' + data.model.dumpList[f].id + '"><span class="index">' + (f + 1) + '</span><p class="fileMsg"><span class="tabName" title="'+data.model.dumpList[f].tableName+"  "+fileSize(data.model.dumpList[f].size)+'">' + data.model.dumpList[f].tableName + '</span><span class="size">' + fileSize(data.model.dumpList[f].size) + '</span></p></div>';
					}
					$(".versionDb").html(one);
					try {
					var initId = data.model.dumpList[0].id;
					$("#aDumpTask").html(data.model.dumpList[0].tableName);
					$(".siteImport").html(data.model.dumpList[0].destPath);
					$(".bakSite").html(data.model.dumpList[0].bakPath.replace(/\\/g, "/"));
					$(".oneMsg").eq(0).addClass("clickStyle");
					seekLine(initId, 100);
					} catch(e){
						
					}
				}
			})
		}

		function seekLine(id, lines) {
			$.ajax({
				url: 'job/dump/file/detail',
				data: {
					id: id,
					lines: lines
				},
				success: function(data) {
					if(data.code==-1){
						location.href='./';
						return false;
					}
					if(data.code == 200) {
						var line = "";
						var msgList = data.model.split("\n");

						for(var l = 0; l < msgList.length; l++) {
							line += '<p><span class="time">' + msgList[l] + '</span><span>' + '</span></p>';
						}
					} else if(data.code == 0) {
						line = '<p style="color:#f00;">' + data.msg + '</p>';
					}
					$(".someRecord").html(line);
				}
			})
		}
		versionInit(GetRequest().id)
			//事件
		$("body").on("mouseover", ".oneMsg", function() {
			$(this).addClass("oneMsgHover").siblings().removeClass("oneMsgHover");
			$(this).children(".index").addClass("indexHover");
			$(this).siblings().children(".index").removeClass("indexHover");
			$(this).children(".fileMsg").children(".tabName").addClass("hoverTab");
			$(this).siblings().children(".fileMsg").children(".tabName").removeClass("hoverTab");
		})
		$("body").on("click", ".oneMsg", function() {
			$(this).addClass("clickStyle").siblings().removeClass("clickStyle");
			$("#aDumpTask").html($(this).attr("tableName"));
			$(".siteImport").html($(this).attr("desPath"));
			$(".bakSite").html($(this).attr("bakPath"));
		})
		$("body").on("click", ".oneMsg", function() {
			var id = $(this).attr("field");
			var lines = 100;
			seekLine(id, lines);
		})
		$(".oneMsg").eq(0).addClass("clickStyle");
	}

	function init() {
		dumpDetail();
	}
	init();
})