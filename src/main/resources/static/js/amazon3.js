$(function() {
	$.ajaxSetup({
		cache: false
	})

	function businessFn() {
		var userMsg = {},
			pageStatus = true,
			projectVal=$("#userApp").val();
		//第一页：
		function valiForm() { //验证表单填写
			var result = {};
			result.flag = false;
			result.msg = "";
			if($("#dTaskName").val() == "") {
				result.flag = true;
				result.msg = common_js_lang['local.info.taskNameNone'];
			}
			if($("#dTaskName").hasClass("redWord")) {
				result.flag = true;
				result.msg = common_js_lang['local.info.taskNameChar'];
			}
			if(!$("#userApp").val()) {
				result.flag = true;
				result.msg = common_js_lang['s3.info.noneApp'];
			}
			if($(".accKey").val() == "") {
				result.flag = true;
				result.msg = common_js_lang['s3.info.accekey'];
			}
			if($(".accKey").hasClass("redWord")) {
				result.flag = true;
				result.msg = common_js_lang['s3.info.accKey'];
			}
			if($(".secKey").val() == "") {
				result.flag = true;
				result.msg = common_js_lang['s3.info.scrtKey'];
			}
			return result;
		};
		function getRen(){
			$.ajax({
				url:'repo/s3/regions',
				success:function(data){
					if(data.code==200){
						var options="";
						for(var i=0;i<data.model.length;i++){
							options+="<option value="+data.model[i].name+">"+data.model[i].alias+"</option>"
						}
						$("#Regions").append(options).select2();
					}else if(data.code==0){
						swal("", common_js_lang['s3.info.regionFail'],"info");
					}else{
						
					}
				}
			})
		}
		getRen();
		function getBucket() {
			$.ajax({
				url: 'repo/s3/save',
				type: 'post',
				data: {
					accessKey: $(".accKey").val(),
					secretKey: $(".secKey").val(),
					region: $("#Regions").val()
				},
				/*data: {
					access: 'AKIAP4MOVNBFMWGNR4IA',
					secert: 'jK4m+JaNHft4HKCO7EqSl1lMAq5CkSwoDtoOrgAj',
					region: 'CN_NORTH_1'
				},*/
				beforeSend: function() {
					$(".delayTip").show();
				},
				success: function(data) {
					if(data.code == 0) {
						swal("ERROR", common_js_lang['s3.info.s3Fail'], "error");
						$(".delayTip").hide();
					} else if(data.code == 200) {
						$(".dbZone").attr("id", data.model.id);
						getFirstDir(data.model.id);
					} else if(data.code == -1) {
						swal({
							title:'',
							text: common_js_lang["manage.info.timeout"],
							type: 'info',
							showCancelButton:true,
							confirmButtonText: common_js_lang['manage.info.newdow'],
							cancelButtonText: common_js_lang['manage.info.tologin']
						}, function(isConfirm){
							if ( !isConfirm )
								location.href = './' ;
							else
								window.open('./', '_blank');
						});
						return false; 
					}
				}
			}).fail(function(){
				$(".delayTip").hide();
			})
		}
		//获取一级目录
		function getFirstDir(s3Id){
			$.ajax({
				url:'repo/s3/buckets',
				type:'post',
				data:{s3Id:s3Id},
				beforeSend: function() {
					$(".delayTip").show();
				},
				success:function(data){
					if(data.code==0){
						swal("ERROR", common_js_lang['s3.info.s3Fail'], "error");
					}else if(data.code==200){
						$(".dbZone").html(template('template/amazons3Bucket', {
							data: data.model
						}));
						$(".uploadFile").hide();
						$(".choiceRoute").show();
					}else if(data.code==-1){
						swal({
							title:'',
							text: common_js_lang["manage.info.timeout"],
							type: 'info',
							showCancelButton:true,
							confirmButtonText: common_js_lang['manage.info.newdow'],
							cancelButtonText: common_js_lang['manage.info.tologin']
						}, function(isConfirm){
							if ( !isConfirm )
								location.href = './' ;
							else
								window.open('./', '_blank');
						});
						return false;
					}
				},
				complete: function() {
					$(".delayTip").hide();
				}
			})
		}
		$(".FileNext").click(function() { //下一页事件驱动
			if(valiForm().flag) {
				swal("ERROR", valiForm().msg, "error");
			} else {
				if(userMsg.regions == $("#Regions").val() && userMsg.accKey == $(".accKey").val() && userMsg.secKey == $(".secKey").val()) {
					$(".uploadFile").hide();
					$(".choiceRoute").show();
				} else {
					getBucket();
					$(".addContentZone").empty();
					$(".tabCheckAll").prop("checked", false).parent().removeClass("checkStatus");
				}
				pageStatus = false;
			}
		})
		$("body").on("keydown", function(e) {
			if(valiForm().flag && pageStatus && e.keyCode == 13) {
				swal("ERROR", valiForm().msg, "error");
			} else {
				if(e.keyCode == 13 && pageStatus) {
					if(userMsg.regions == $("#Regions").val() && userMsg.accKey == $(".accKey").val() && userMsg.secKey == $(".secKey").val()) {
						$(".uploadFile").hide();
						$(".choiceRoute").show();
					} else {
						getBucket();
						$(".addContentZone").empty();
						$(".tabCheckAll").prop("checked", false).parent().removeClass("checkStatus");						
					}
					pageStatus = false;
				}
			}
		})
		$(".accKey").blur(function(){
			var str=$(this).val().trim();
			if(str.match(/\s+/g)){
				$(this).addClass("redWord");
			}else{
				$(this).removeClass("redWord");
			}
		})
		$(".prevBtn").click(function() {
			$(".uploadFile").show();
			$(".choiceRoute").hide();
			userMsg.regions = $("#Regions").val();
			userMsg.accKey = $(".accKey").val().trim();
			userMsg.secKey = $(".secKey").val().trim();
			pageStatus = true;
		})
			//第二页：
			//左侧动态获取资源：
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
		//文件名获取：
		function reg(str) {
			str = str.replace(/\\/g, "/");
			var reg = /([^\/]+)$/g;
			str = str.replace(reg, 'd$1');
			return RegExp.$1;
		}
		template.helper('fileSize', function(size) {
			if(size < 1024) {
				return(size || 0) + "bytes";
			} else if(size < 1024 * 1024) {
				return(size / 1024).toFixed(2) + "KB";
			} else {
				return(size / 1024 / 1024).toFixed(2) + "MB";
			}
		})
		function getObjList(id, bucket, filed, $dbName,$this,preIndent,parent) {
			$.ajax({
				url: 'repo/s3/bucket/objects',
				data: {
					s3Id: id,
					bucketName: bucket,
					parent:parent
				},
				type: 'post',
				beforeSend: function() {
					setTimeout(function() {
						if($dbName.siblings(".tabList").length == 0) {
							$(".loadingTip").show();
						}
					}, 300)
				},
				success: function(data) {
					if(data.code == 0) {
						swal("ERROR", data.msg, "error");
					} else if(data.code == 200 && data.model.length > 0) {
						var $ul = $('<ul style="margin-left:'+preIndent+'px" class="oneMeun childUl tabList tabList' + filed + '"></ul>');
						var li = "";
						var datas={};
						datas.field=filed;
						datas.preIndent=preIndent;
						datas.value=data.model;
						datas.bucket=bucket;
						$ul.html(template('template/child',{data:datas}));
						if($dbName.siblings(".tabList").length == 0||!$dbName.siblings(".tabList")) {
							$dbName.after($ul);
						}
						$dbName.siblings(".iconBox").children(".closeBtn").hide().siblings(".openBtn").show();
						$ul.slideDown();
					} else if(data.code == 200 && data.model.length == 0) {
						swal("",  common_js_lang['s3.info.resErr'], "info")
					} else if(data.code == -1) {
						swal({
							title:'',
							text: common_js_lang["manage.info.timeout"],
							type: 'info',
							showCancelButton:true,
							confirmButtonText: common_js_lang['manage.info.newdow'],
							cancelButtonText: common_js_lang['manage.info.tologin']
						}, function(isConfirm){
							if ( !isConfirm )
								location.href = './' ;
							else
								window.open('./', '_blank');
						});
						return false;
					}
				},
				complete: function() {
					$(".loadingTip").hide();
				}
			})
		}
		$("body").on("click", ".closeBtn", function() { //左侧展开			
			if($(this).parent().siblings(".fileCheck").siblings(".dbName").hasClass("checkStatus")) {
				if($(this).parent().siblings(".tabList").length == 0 && !$(this).parent().siblings(".fileCheck").children("input").attr("request") == "Y") {
					swal("", common_js_lang['s3.info.getResing'], "info");
				} else if($(this).parent().siblings(".tabList").length == 0 && $(this).parent().siblings(".fileCheck").children("input").attr("request") == "Y") {
					swal("", common_js_lang['s3.info.resErr'], "info");
				} else if($(this).parent().siblings(".tabList").length == 0 && $(this).parent().siblings(".fileCheck").children("input").attr("request") == "N") {
					swal("", common_js_lang['s3.info.resEmpty'], "info");
				} else if($(this).parent().siblings(".tabList").length > 0) {
					$(this).parent().siblings(".tabList").slideDown();
					$(this).hide().siblings(".openBtn").show();
				}
			} else {
				if($(this).parent().siblings(".tabList").length == 0) {
					var id = $(".dbZone").attr("id"),
						bucket='',
						parent=null,
						filed = $(this).parent().siblings(".dbName").attr("field"),
						$dbName = $(this).parent().siblings(".dbName"),
						$this=$(this),
						preIndent=parseInt( $(this).parent().parent(".oneDataLi").css("margin-left"))+18;
						if(!preIndent){
							preIndent=18;
						}
						if($(this).parent().hasClass("second")){
							bucket = $(this).parent().siblings(".aDbName").attr("bucketName");
							parent=$(this).parent().siblings(".aDbName").attr("path");
							$dbName=$(this).parent().siblings(".aDbName");
						}else{
							bucket = $(this).parent().siblings(".dbName").children(".name").html();
						}
					getObjList(id, bucket, filed, $dbName,$this,preIndent,parent);
				} else {
					$(this).parent().siblings(".tabList").slideDown();
					$(this).hide().siblings(".openBtn").show();
				}
			}
		})
		$("body").on("click", ".openBtn", function() { //左侧收起
			$(this).hide();
			$(this).siblings(".closeBtn").show();
			$(this).parent().siblings(".tabList").slideUp();
		})
			//向右添加：
		function mathLi(tabId, liList) { //判断右侧是否有该子项
			var liMath = true;
			liList.each(function() {
				if($(this).attr("field") == tabId) {
					liMath = false;
				}
			})
			return liMath;
		}

		function mathdb(dbNum, dbList) {
			var dbMath = true;
			dbList.each(function() {
				if($(this).attr("field") == dbNum) {
					dbMath = false;
				}
			})
			return dbMath;
		}

		function createTab(dbNum, tabList, dbName) {
			var trList = '';
			if($("#uploadSite").val() == 1) {
				for(var t = 0; t < tabList.length; t++) {
					trList += '<tr dbName="' + dbName + '" class="newTr" tabName="' + tabList[t][6] + '" cols="' + tabList[t][5] + '" filePath="' + tabList[t][4] + '" srcPath="' + tabList[t][3] + '" columnSep="' + tabList[t][2] + '" field="' + tabList[t][1] + '"><td><label class="checkOneLab"><input type="checkbox" field="' + dbNum + '" class="tabCheckOne tabCheckOne' + dbNum + ' tabCheck"/></label></td><td class="parse"><img src="resources/images/parseDump.png"/><span class="parseName">' + tabList[t][0] + '</span></td><td class="oneDbName"></td><td class="map"><img src="resources/images/parseDump.png"/><span class="targetTab">' + tabList[t][6] + '</span></td><td><span class="oneConfigure"><img src="resources/images/mapData.png" class="mapImg"/><b class="mapTip">'+common_js_lang['local.option.config']+'</b></span></td></tr>';
				}
			} else {
				for(var t = 0; t < tabList.length; t++) {
					trList += '<tr dbName="' + dbName + '" class="newTr" field="' + tabList[t][1] + '"><td><label class="checkOneLab"><input type="checkbox" field="' + dbNum + '" class="tabCheckOne tabCheckOne' + dbNum + ' tabCheck"/></label></td><td class="hdfs" type="hdfs" title="' + tabList[t][0] + '"><img src="resources/images/parseDump.png"/><span class="parseName">' + tabList[t][0] + '</span></td><td class="map hdfsMap" type="hdfs"  key="'+tabList[t][2]+'" size="'+tabList[t][3]+'" bucket="'+tabList[t][4]+'"></td><td><span class="oneConfigure" field="hdfs"><img src="resources/images/mapData.png" class="mapImg"/><b class="mapTip">'+common_js_lang['local.option.config']+'</b></span></td></tr>';
				}
			}
			return trList;
		}
		//向右迁移前源数据加载验证：
		function befTrans() {
			var result = {},
				request = true,
				get = true;
			result.rFlag = true;
			result.gFlag = true;
			result.msg = "";
			$(".leftOneCheck").each(function() {
				if(!$(this).attr("request") && $(this).prop("checked")) {
					request = false;
				} else if($(this).attr("request") == "N" && $(this).prop("checked")) {
					get = false;
					result.msg += $(this).parent().siblings("dbName").children("name").html() + ",";
				}
			})
			if(request && !get) {
				result.rFlag = true;
				result.gFlag = false;
			} else if(!request) {
				result.rFlag = false;
				result.gFlag = false;
			}
			return result;
		}
		//向右迁移源数据
		$("body").on("click",".oneTabLi",function(){
			$(this).children(".oneResult").toggleClass("tabcheck");
		})
		function transSources(){
			var sources=[];
			$(".oneTabLi").each(function(){
				if($(this).children(".oneResult").hasClass("tabcheck")){
					var source=$(this),
					onceFlag=true;
					$(".hdfsTr").each(function(){
						if(source.attr("field")==$(this).attr("field")){
							onceFlag=false;
						}
					})
					if(onceFlag){
						var one={};
						one.fileName=source.children(".oneResult").children(".aTabName").html();
						one.path=source.children(".oneResult").children(".aTabName").attr("path");
						one.size=source.children(".oneResult").children(".tabSize").attr("size");
						one.bucket=$(this).attr("bucket");
						one.field=source.attr("field");
						sources.push(one);
					}
				}
			})
			return sources;
		}
		$("#pointRight").on("click",function(){
			if(transSources().length+$(".newTr").length<=1000||!$(".newTr")){
				var data=transSources();
				if(data.length){
					$(".addContentZone").append(template("template/hdfsTr",{data:data}));
					$(".tabCheckAll").prop("checked",false).parent("label").removeClass("checkStatus");
				}
			}else{
				swal("", common_js_lang['s3.info.limit1000'].replace(/\[x\]/, '['+transSources().length+']').replace(/\[y\]/, '['+$(".newTr").length+']'),"info");
				return false;
			}
			if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/9./i) == "9.") {
				var screenW=window.screen.width;
				$(".createTab").each(function(){
					$(this).children(".newTr").each(function(){
						$(this).children().eq(0).css("width","6%");				
						$(this).children().eq(3).css("text-align","center");
						$(this).children().eq(1).children(".parseName").css("max-width","100px");
					})
				})
			}
		})
		//向左删除
		$("#pointLeft").click(function() {
			$(".tabCheckOne").each(function() {
				if($(this).prop("checked")) {
					if($(this).parent().parent().parent().parent().children().length == 1) {
						$(this).parent().parent().parent().remove();
					} else {
						$(this).parent().parent().parent().remove();
					}
					if($(".newTr").length == 0) {
						$(".tabCheckAll").prop("checked", false);
						$(".tabCheckAll").parent("label").removeClass("checkStatus");
					}
				}
			})
		})
			//批量配置
		function checked() { //check有无勾选项
			var noCheck = true;
			$(".tabCheckOne").each(function() {
				if(!$(this).prop("checked")) {
					noCheck = false;
				}
			})
			return noCheck;
		}

		function alhdfsCell() {
			if(!checked()) {
				swal("ERROR", common_js_lang['s3.info.selectAll'], "error");
			} else {
				$(".hdfsBox,.maskCell").show();
				$(".hdfsBox .suffixShow").hide();
				$(".keep").attr("field", "all");
				$(".routeLabel").each(function() {
					$(this).removeClass("rCheckIcon").children("input").prop("checked", false);
				})
			}
		}
		$(".allConfigure").click(function() {
			if($(".addContentZone").children().length == 0) {
				swal("ERROR", common_js_lang['s3.info.noneConfig'], "error");
			} else {
				if($("#uploadSite").val() == 1) {
						//alHiveCell(); //弹出层
				} else {
					alhdfsCell();
				}
			}
		})
			//单独配置：
			//遍历展开所勾选的路径
		function sildeR(route) {
			var oneMenu = route.parent().parent();
			oneMenu.show();
			oneMenu.siblings(".oneRoute").children(".turnOn").show();
			oneMenu.siblings(".oneRoute").children(".turnOff").hide();
			if(!oneMenu.hasClass("firstM")) {
				sildeR(oneMenu);
			}
		}
		$("body").on("click", ".oneConfigure", function() {
			$(".keep").attr({
				"num": $(this).parent().parent().attr("field"),
				"field": "one"
			});
			$(".suffixRoute").attr("name", "OK");
			if($("#uploadSite").val() == 1) {

			} else {
				$(".hdfsBox,.maskCell").show();
				$(".hdfsBox .suffixShow").show();
				var hdfsRoute = $(this).parent().siblings(".hdfsMap").attr("route");
				var theFile = $(this).parent().siblings(".hdfsMap").attr("file");
				var $this = {};
				if(hdfsRoute) {
					$(".defaultRoute").val(hdfsRoute);
					$(".routeLabel").each(function() {
						if($(this).siblings(".oneRoute").children(".thisRoute").html() == hdfsRoute) {
							$(this).addClass("rCheckIcon").children("input").prop("checked", true);
							$this = $(this);
						} else {
							$(this).removeClass("rCheckIcon").children("input").prop("checked", false);
						}
					})
					sildeR($this);
				} else {
					$(".routeLabel").each(function() {
						if($(this).hasClass("rCheckIcon")) {
							$(".defaultRoute").val($(this).siblings(".oneRoute").children(".thisRoute").html());
						}
					})
				}
				if(theFile) {
					$(".suffixRoute").val(theFile);
				} else {
					$(".suffixRoute").val($(this).parent().siblings(".hdfs").children(".parseName").html().substr(0, 99));
					if($(this).parent().siblings(".hdfs").children(".parseName").html().length > 100) {
						swal("", common_js_lang['s3.info.tbl100'], "info");
					}
				}
			}
		})
			//配置保存：
		function hdfsAll() { //批量配置hdfs保存参数
			if($(".defaultRoute").val()) {
				var allHdfs = $(".defaultRoute").val(),
					d = 0;
					if(allHdfs=="/"){
						allHdfs="";
					}
				$(".hdfsMap").each(function() { //填充hdfs路径
					if($(this).parent().children().eq(0).children("label").children(".tabCheckOne").prop("checked")) {
						var html = $(this).siblings(".hdfs").children(".parseName").html(),
							result = "";
						result = allHdfs + '/' + html;
						if(html.length > 100) {
							d++;
						}
						$(this).html(result).attr("title", result).attr("route", $(".defaultRoute").val()).attr("file", html.substr(0, 99));
					}
				})
				$(".maskCell,.hdfsBox").hide();
				$(".defaultRoute").val('');
				if(d > 0) {
					swal("", common_js_lang['s3.info.tbl100Char'].replace(/\[x\]/, '['+d+']'), "info");
				}
			} else {
				swal("ERROR", common_js_lang['s3.info.dir'], "error");
			}
		}

		function hdfsSingle() { //单独配置hdfs保存参数
			if($(".defaultRoute").val() && $(".suffixRoute").val().trim() && $(".suffixRoute").attr("name") == "OK") {
				if($(".suffixRoute").val().trim().match(/\s+/g)){
					swal("", common_js_lang['local.info.fileName'],"info");
					$(".suffixRoute").addClass("redWord");
					return false;
				}
				if($(".suffixRoute").val().trim().match(/\\/g)){
					swal("", common_js_lang['local.info.fileName'],"info");
					return false;
				}
				var dataNum = $(".keep").attr("num");
				if($(".defaultRoute").val()!=="/"){
					var fileName = $(".defaultRoute").val() + '/' + $(".suffixRoute").val().trim();
				}else{
					var fileName ='/' + $(".suffixRoute").val().trim();
				}
				var flag =true;
				if(!flag) {
					$(".suffixRoute").attr("name", "NO").addClass("redWord");
				} else {
					$(".suffixRoute").attr("name", "OK").removeClass("redWord");
					$(".newTr").each(function() {
						if($(this).attr("field") == dataNum) {
							$(this).children(".hdfsMap").html(fileName).attr("title", fileName);
							$(this).children(".hdfsMap").attr("route", $(".defaultRoute").val()).attr("file", $(".suffixRoute").val().trim());
							$(".maskCell,.hdfsBox").hide();
							$(".defaultRoute").val('');
							$(".suffixRoute").val('');
						}
					})
				}
			} else if($(".defaultRoute").val() && $(".suffixRoute").val().trim() && $(".suffixRoute").attr("name") == "NO") {
				swal("ERROR", common_js_lang['local.info.fileName'], "error");
				return false;
			} else if($(".defaultRoute").val() == "" || $(".suffixRoute").val() == "") {
				swal("ERROR", common_js_lang['s3.info.dir'], "error");
			}
		}
		$(".suffixRoute").blur(function() { //hdsf文件名验证
			var str = $(this).val().trim();
			if(str.match(/\s+/g)||str.match(/\\/g)){
				$(".suffixRoute").addClass("redWord");
				return false;
			}else{
				$(".suffixRoute").removeClass("redWord");
			}
			if(str.length > 100) {
				swal("ERROR", common_js_lang['s3.info.fileName100'], "error");
				$(this).attr("name", "NO").addClass("redWord");
			} else {
				$(this).attr("name", "OK").removeClass("redWord");
			}
		})
		$(".keep").on("click", function() {
			if($(this).attr("field") == "all") {
				if($("#uploadSite").val() == 1) {

				} else {
					hdfsAll();
				}
			} else {
				if($("#uploadSite").val() == 1) {

				} else {
					hdfsSingle();
				}
			}
		})
		//根目录获取：
		function dirInit(){
			$.ajax({
				url:'hdfs/dir/home',
				data:{hid:adminConfigData['hdfsId'],pid:$("#userApp").val()},
				success:function(data){
					if(data.code==200&&data.model.length>0){
						$(".thisRoute.startThis").html(data.model);
						$(".firstM .startLi").children(".allMeun")&&$(".firstM .startLi").children(".allMeun").remove();
						var $this=$(".routeStart .turnOff");
						if($this){
							var aRoute = $this.siblings(".thisRoute").html(),
							preIndent = parseInt($this.parent().parent().css("text-indent"));
						}
						if($this&&$this.parent().siblings(".allMeun").length == 0)
							getDir(adminConfigData['hdfsId'],$this, aRoute, preIndent);
							return false;
					}else if(data.code==-1){
						swal({
							title:'',
							text: common_js_lang["manage.info.timeout"],
							type: 'info',
							showCancelButton:true,
							confirmButtonText: common_js_lang['manage.info.newdow'],
							cancelButtonText: common_js_lang['manage.info.tologin']
						}, function(isConfirm){
							if ( !isConfirm )
								location.href = './' ;
							else
								window.open('./', '_blank');
						});
						return false;
					}else{
						swal("", common_js_lang['client.info.hdfsInitErr'],"info");
						$(".thisRoute.startThis").html("");
						$(".firstM .startLi").children(".allMeun")&&$(".firstM .startLi").children(".allMeun").remove();
					}
				}
			})
		}
		dirInit();
			//获取hdsf
		function getDir(hid,$this, aRoute, preIndent) {
			$.ajax({
				url: 'hdfs/dir/list',
				type:'post',
				data: {
					base: aRoute,
					hid:hid,
					pid:$("#userApp").val()
				},
				beforeSend: function() {
					setTimeout(function(){
						if($this&&$this.parent().siblings(".allMeun").length==0&&!$this.parent().attr("status")){
							$(".delayTip").show();
						}
					},3000)
				},
				success: function(data) {
					if(data.code == 200) {
						if(data.model.length) {
							$this.children(".turnOn").show();
							$this.children(".turnOff").hide();
							var routes = data.model;
							var $ul = $("<ul class='allMeun'></ul>");
							var currentIndent = preIndent + 10;
							for(var r = 0; r < routes.length; r++) {
								var $li = $("<li class='newRoute'><label class='routeLabel'><input type='checkbox' class='routeChoiceBtn' name='route'/></label><h5 class='oneRoute'><img class='turnOn' src='resources/images/routeOn.png'/><img class='turnOff' src='resources/images/routeOff.png'/><span class='thisRoute' title='" + routes[r] + "'>" + routes[r] + "</span></h5></li>");
								$li.css("padding-left", currentIndent + 'px');
								$ul.append($li);
							}
							if($li && $li.length > 0 && $this.parent().siblings().length <= 1) {
								$this.parent().parent().append($ul);
								//图标显示：
								if($this.attr("field")) {
									$this.hide().siblings(".turnOn").show();
								} else {
									if($this.parent().siblings().length > 0) {
										$this.hide().siblings(".turnOn").show();
									} else {
										$this.hide().siblings(".turnOn").hide();
									}
								}
							}
						} else {
							$this.parent().attr("status","ok");
							$this.hide();
							$this.siblings(".turnOn").hide();
						}
					} else if(data.code == 0) {
						swal("ERROR",  common_js_lang['client.info.resGetErr'], "error");
					} else if(data.code == -1) {
						swal({
							title:'',
							text: common_js_lang["manage.info.timeout"],
							type: 'info',
							showCancelButton:true,
							confirmButtonText: common_js_lang['manage.info.newdow'],
							cancelButtonText: common_js_lang['manage.info.tologin']
						}, function(isConfirm){
							if ( !isConfirm )
								location.href = './' ;
							else
								window.open('./', '_blank');
						});
						return false;
					}
				},
				complete: function() {
					$(".delayTip").hide();
				}
			})
		}
		//项目切换刷新库：
		$("#userApp").change(function(){
			var $this=$(this);
			if($(".newTr").length==0){
				//getDB();
				dirInit();
				projectVal=$this.val();
				return false;
			}else{
				if($("#uploadSite").val()==0){
					swal({
			            title:'',
						text: common_js_lang["manage.info.timeout"],
						type: 'info',
						showCancelButton:true,
						confirmButtonText: common_js_lang['manage.info.newdow'],
						cancelButtonText: common_js_lang['manage.info.tologin']
			        }, function(isConfirm){
			            if (isConfirm ){
			            	projectVal=$this.val();
			                //getDB();
			                $(".addContentZone").empty();
			                dirInit();
			                $(".checkAllLab").removeClass("checkStatus").children("input").attr("checked",false);
			            }else{
			            	$("#userApp").val(projectVal).trigger("change");
			            }    
			        })
					return false;
				}
				swal({
		            title:'',
		            text: common_js_lang['local.info.changeApp'],
		            type: 'warning',
		            showCancelButton:true,
		            confirmButtonText: common_js_lang['manage.info.newdow'],
					cancelButtonText: common_js_lang['manage.info.tologin']
		        }, function(isConfirm){
		            if (isConfirm ){
		            	projectVal=$this.val();
		                //getDB();
		                $(".addContentZone").empty();
		            }else{
		            	$("#userApp").val(projectVal).trigger("change");
		            }    
		        })
			}
		})
		$("body").on("click", ".turnOn", function() {
			var $this = $(this);
			$this.hide().siblings(".turnOff").show();
			$this.parent().siblings(".allMeun").hide();
		})
		$("body").on("click", ".turnOff", function() {
			var $this = $(this);
			var aRoute = $(this).siblings(".thisRoute").html();
			var preIndent = parseInt($(this).parent().parent().css("text-indent"));
			if($(this).parent().siblings(".allMeun").length == 0) {
				getDir(adminConfigData['hdfsId'],$this, aRoute, preIndent);
			} else {
				$this.parent().siblings(".allMeun").show();
				$this.hide().siblings(".turnOn").show();
			}
		})
		$("body").on("click", ".routeLabel", function() {
			$(".routeLabel").each(function() {
				$(this).removeClass("rCheckIcon");
			});
			$(this).addClass("rCheckIcon");
			var oneRoute = $(this).siblings(".oneRoute").children(".thisRoute").html();
			$(".defaultRoute").val(oneRoute);
		})
			//任务导入：
		$(".startImport").click(function() {
			if($("#uploadSite").val() == 1) { //hive导入

			} else { //hdfs导入
				var cFlag = false;
				$(".tabCheckOne").each(function() {
					if($(this).parent().parent().siblings(".hdfsMap").html() == "") {
						cFlag = true;
					}
				})
				if(cFlag) {
					swal("ERROR", common_js_lang['s3.info.configParam'], "error");
				} else {
					$(".maskCell,.createTabTip").show();
					$(".createTabTip .tipCon").hide();
					$(".createTabTip .successTip").hide();
					$(".createTabTip .bBtnZone").hide();
					$(".createTabTip .newFail").hide();
				}
			}
		})
			//开始任务
		function hdfsTask(pid, taskName, taskDec, fromJson,toHdfsJson) {
			$.ajax({
				url: 'job/s3/save',
				type: 'post',
				data: {
					toType:8,
					pid:pid,
					jobName: taskName,
					note: taskDec,
					fromJson:fromJson,
					toHdfsJson:toHdfsJson
				},
				success: function(data) {
					if(data.code == 200) {
						location.href = './success';
					} else if(data.code == 0) {
						swal("", common_js_lang['s3.info.taskFail']+":"+data.msg, "info");
					} else if(data.code == -1) {
						swal({
							title:'',
							text: common_js_lang["manage.info.timeout"],
							type: 'info',
							showCancelButton:true,
							confirmButtonText: common_js_lang['manage.info.newdow'],
							cancelButtonText: common_js_lang['manage.info.tologin']
						}, function(isConfirm){
							if ( !isConfirm )
								location.href = './' ;
							else
								window.open('./', '_blank');
						});
						return false;
					}
				}
			})
		}
		$(".startManage").click(function() {
			var taskName = $("#dTaskName").val(),
				taskDec = $(".taskDescribe").val();
			if($("#uploadSite").val() == 1) {

			} else {
				var fromJson=[],
					toHdfsJson=[];
				$(".tabCheckOne").each(function() {
					var one = {};
					one.hid=adminConfigData['hdfsId'];
					one.fileName = $(this).parent().parent().siblings(".hdfsMap").html();
					toHdfsJson.push(one);
					var two={};
					two.s3Id=$(".dbZone").attr("id");
					two.bucketName=$(this).parent().parent().siblings(".hdfsMap").attr("bucket");
					two.key=$(this).parent().parent().siblings(".hdfsMap").attr("key");
					two.size=$(this).parent().parent().siblings(".hdfsMap").attr("size");
					fromJson.push(two);
				})
				fromJson=JSON.stringify(fromJson);
				toHdfsJson=JSON.stringify(toHdfsJson);
				var pid=$("#userApp").val();
				hdfsTask(pid, taskName, taskDec, fromJson,toHdfsJson)
			}
		})
	}

	function eventBind() {
		//左侧展开滚动时firstUl宽度自适应：
		var initWidth=320,
		scrollArr=[];
		$(".dbZone").scroll(function(){
			if($(this).scrollLeft()>Math.max.apply(null,scrollArr)&&$(".firstUl").width()<1300){
				scrollArr.push($(this).scrollLeft());
				//$(".dbBox").css("width",parseInt(initWidth+Math.max.apply(null,scrollArr))+'px');
			}
		})
		$("#dTaskName").blur(function() {
			var str = $(this).val();
			var $this = $(this);
			var result = str.match(/^[\u4E00-\u9FA5a-zA-Z0-9_]{0,30}$/);
			if( str == "") {
				swal('ERROR', common_js_lang['local.info.taskNameNone'], 'error');
				return ;
			}
			if(!result) {
				swal("ERROR", common_js_lang['local.info.taskNameChar'], "error");
				$(this).addClass("redWord");
			} else {
				$(this).removeClass("redWord");
			}
		})
			//右侧全选
		$(".tabCheckAll").click(function() {
			if($(".addContentZone").children().length == 0) {
				swal("", "Empty", "info");
			} else {
				var allStatus = $(this).prop("checked");
				$(".tabCheck").prop("checked", allStatus);
				if(allStatus) {
					$(this).parent("label").addClass("checkStatus");
					$(".tabCheck").parent("label").addClass("checkStatus");
				} else {
					$(this).parent("label").removeClass("checkStatus");
					$(".tabCheck").parent("label").removeClass("checkStatus");
				}
			}
		})
		$("body").on("click", ".tabCheck", function() {
			var checkFlag = true;
			$(".tabCheck").each(function() {
				if($(this).prop("checked") == false) {
					checkFlag = false;
				}
				if(checkFlag) {
					$(".tabCheckAll").prop("checked", true);
				} else {
					$(".tabCheckAll").prop("checked", false);
				}
			})
		})
		$("body").on("click", ".fileCheck", function() {
			var fileStatus = $(this).prop("checked");
			var num = $(this).attr("field");
			$(".tabCheckOne" + num).prop("checked", fileStatus);
			if(fileStatus) {
				$(this).parent("label").addClass("checkStatus");
				$(".tabCheckOne" + num).parent("label").addClass("checkStatus");
			} else {
				$(this).parent("label").removeClass("checkStatus");
				$(".tabCheckOne" + num).parent("label").removeClass("checkStatus");
			}

		})
		$("body").on("click", ".tabCheckOne", function() {
			var fileNum = $(this).attr("field");
			var checkFlag = true;
			var oneStatus = $(this).prop("checked");
			if(oneStatus) {
				$(this).parent("label").addClass("checkStatus");
			} else {
				$(this).parent("label").removeClass("checkStatus");
			}
			$(".tabCheckOne" + fileNum).each(function() {
				if($(this).prop("checked") == false) {
					checkFlag = false;
				}
				if(checkFlag) {
					$(".fileCheck" + fileNum).prop("checked", true);
					$(".fileCheck" + fileNum).parent("label").addClass("checkStatus");
				} else {
					$(".fileCheck" + fileNum).prop("checked", false);
					$(".fileCheck" + fileNum).parent("label").removeClass("checkStatus");
				}
			})
		})
		$("body").on("click", ".tabCheckOne", function() {
			var checkFlag = true;
			$(".tabCheckOne").each(function() {
				if($(this).prop("checked") == false) {
					checkFlag = false;
				}
				if(checkFlag) {
					$(".tabCheckAll").prop("checked", true);
					$(".tabCheckAll").parent("label").addClass("checkStatus");
				} else {
					$(".tabCheckAll").prop("checked", false);
					$(".tabCheckAll").parent("label").removeClass("checkStatus");
				}
			})
		})
		$("body").on("click", ".rFileCheck", function() {
			var checkFlag = true;
			var oneStatus = $(this).prop("checked");
			if(oneStatus) {
				$(this).parent("label").addClass("checkStatus");
			} else {
				$(this).parent("label").removeClass("checkStatus");
			}
			$(".fileCheck").each(function() {
				if($(this).prop("checked") == false) {
					checkFlag = false;
				}
				if(checkFlag) {
					$(".tabCheckAll").prop("checked", true);
					$(".tabCheckAll").parent("label").addClass("checkStatus");
				} else {
					$(".tabCheckAll").prop("checked", false);
					$(".tabCheckAll").parent("label").removeClass("checkStatus");
				}
			})
		})

		$("#uploadSite").change(function() {
			var method = $(this).val();
			$(".mapMethod").eq(method).show().siblings().hide();
		})
		$("body").on("click", ".acheck", function() { //同一库下的单个表选择
			if($(this).prop("checked")) {
				$(this).parent().parent().addClass("tabcheck");
				$(this).parent(".aLabel").addClass("checkStatus");
			} else {
				$(this).parent().parent().removeClass("tabcheck");
				$(this).parent(".aLabel").removeClass("checkStatus");
			}
			var checkFlag = true;
			var allStatus = true;
			var num = $(this).attr("field");
			$(".acheck").each(function() {
				if($(this).prop("checked") == false) {
					allStatus = false;
				}
				if(allStatus) {
					$("#checkAllDb").prop("checked", true);
					$(".checkAllDb").addClass("checkStatus");
				} else {
					$("#checkAllDb").prop("checked", false);
					$(".checkAllDb").removeClass("checkStatus");
				}
			})
			$(".check" + num).each(function() {
				if($(this).prop("checked") == false) {
					checkFlag = false;
				}
				if(checkFlag) {
					$(".leftOneCheck" + num).prop("checked", true).attr("request", "Y");
					$(".leftOneCheck" + num).parent(".fileCheck").siblings(".dbName").addClass("checkStatus");
				} else {
					$(".leftOneCheck" + num).prop("checked", false);
					$(".leftOneCheck" + num).parent(".fileCheck").siblings(".dbName").removeClass("checkStatus");
				}
			})
		})
			//弹窗关闭
		$(".closeMap").click(function() {
			$(".suffixRoute").removeClass("redWord");
			$(".hdfsBox,.maskCell").hide();
		})
		$(".cancel").click(function() {
			$(".hdfsBox,.maskCell").hide();
		})
		$(".cancelKeep").click(function() {
			$(".suffixRoute").removeClass("redWord");
			$(".hdfsBox,.maskCell").hide();
		})
		$(".CancelBtn").click(function() {
			location.href = "./";
		})
		$(".createCancel").click(function() {
			$(".maskCell").hide();
			$(".createTabTip").hide();
		})
		$(".secKey").on("copy paste",function(e){//密码框禁止copy、paste
			//e.preventDefault();
		})
		$("#pointLeft,#pointRight").on("mouseenter",function(){
			$(this).children(".lost").hide().siblings(".select").show();
		}).on("mouseleave",function(){
			$(this).children(".lost").show().siblings(".select").hide();
		})
	}

	function init() {
		//hiveId和hdfsId验证:
		// if(typeof(adminConfigData)=="undefined"){
		// 	swal("ERROR","必要上传配置获取失败，页面即将自动刷新","error");
		// 	setTimeout(function(){location.reload()},3000);
		// }
		businessFn();
		eventBind();
		if(window.screen.availHeight < 820) {
			$(".contentBox .mathRoute .routeChoice").addClass("hdfsRouH");
		} else if(window.screen.availHeight < 820 && window.screen.availHeight > 700) {
			$(".contentBox .mathRoute .routeChoice").addClass("hdfsRouH");
		} else if(window.screen.availHeight < 760) {
			$(".contentBox").addClass("positionTrans");
		}
	}
	init();
})