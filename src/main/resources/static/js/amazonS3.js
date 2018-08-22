$(function() {
	function businessFn() {
		var userMsg = {},
			pageStatus = true,
			projectVal=$("#connId").val(),
			publicFn={
				fileSize:function(size){
					if(size < 1024) {
						return(size || 0) + "bytes";
					} else if(size < 1024 * 1024) {
						return(size / 1024).toFixed(2) + "KB";
					}else if(!size){
						return "--"
					} else {
						return(size / 1024 / 1024).toFixed(2) + "MB";
					}
				},
				reg:function(str){
					str = str.replace(/\\/g, "/");
					var reg = /([^\/]+)$/g;
					str = str.replace(reg, 'd$1');
					return RegExp.$1;
				},
				ajaxFail:function(){
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
		//第一页：
		function valiForm() { //验证表单填写
			var result = {};
			result.flag = false;
			result.msg = "";

			if($("#dTaskName").val() == "") {
				result.flag = true;
				result.msg = common_js_lang['local.info.taskNameNone'];
                return result ;
			}
			if(!$("#userApp").val()) {
				result.flag = true;
				result.msg = common_js_lang['s3.info.noneApp'];
                return result ;
            }
			if($(".accKey").val() == "") {
				result.flag = true;
				result.msg = common_js_lang['s3.info.accekey'];
                return result ;
            }
			if($(".accKey").hasClass("redWord")) {
				result.flag = true;
				result.msg = common_js_lang['s3.info.accKey'];
                return result ;
            }
			if($(".secKey").val() == "") {
				result.flag = true;
				result.msg = common_js_lang['s3.info.scrtKey'];
                return result ;
            }
			if(!$("#connId").val()) {
				result.flag = true;
				result.msg = common_js_lang['db.info.tarConn'];
                return result ;
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
						MsgTip("", common_js_lang['s3.info.regionFail'],"info");
					}else{
						
					}
				}
			})
		}
		getRen();
		function getBucket(defer) {
			$.ajax({
				url: 'repo/s3/save',
				type: 'post',
				data: {
					accessKey: $(".accKey").val(),
					secretKey: $(".secKey").val(),
					region: $("#Regions").val(),
					pid: $('#userApp').val()
				},
				success: function(data) {
					if(data.code == 0) {
                        defer.reject();
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					} else if(data.code == 200) {
						$(".dbZone").attr("id", data.model.id);
						getFirstDir(data.model.id, defer);
					} else if(data.code == -1) {
                        defer.reject();
                        publicFn.ajaxFail();
					}
				}
			}).fail(function(){
				$(".delayTip").hide();
			})
		}
		//获取一级目录
		function getFirstDir(s3Id, defer){
			$.ajax({
				url:'repo/s3/buckets',
				type:'post',
				data:{s3Id:s3Id},
				success:function(data){
					if(data.code==0){
                        defer.reject();
						MsgTip("", common_js_lang['s3.info.s3Fail'], "info");
					}else if(data.code==200){
						$(".dbZone").html(template('template/amazons3Bucket', {
							data: data.model
						}));
                        defer.resolve();
                    }else if(data.code==-1){
                        defer.reject();
                        publicFn.ajaxFail();
					}
				}
			})
		}
		$(".FileNext").click(function() { //下一页事件驱动
			if(valiForm().flag) {
				MsgTip("", valiForm().msg, "info");
			} else {
                $(".delayTip").show();
                var srcDefer = $.Deferred(), tarDefer = $.Deferred() ;

				if(userMsg.regions == $("#Regions").val() && userMsg.accKey == $(".accKey").val() && userMsg.secKey == $(".secKey").val()) {
                    srcDefer.resolve();
                } else {
					getBucket(srcDefer);
					$(".addContentZone").empty();
					$(".tabCheckAll").prop("checked", false).parent().removeClass("checkStatus");
				}
				if(userMsg.connId!=$(".FileNext").attr("connId")||typeof $(".FileNext").attr("connId")=='undefined'||userMsg.app!=$("#userApp").val()||typeof userMsg.app=="undefined"){
					userMsg.app=$("#userApp").val();
                    $.when(srcDefer).done(function(){dirInit(tarDefer)});
                }
                else {
                    tarDefer.resolve();
                }

                $.when( srcDefer, tarDefer).done(function(){
                    $(".uploadFile").hide();
                    $(".choiceRoute").show();
                    $(".delayTip").hide();
                }).fail(function(){
                    $(".delayTip").hide();
                });
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
		})
		//第二页：
		template.helper('fileSize', function(size) {
			if(size < 1024) {
				return(size || 0) + "bytes";
			} else if(size < 1024 * 1024) {
				return(size / 1024).toFixed(2) + "KB";
			} else {
				return(size / 1024 / 1024).toFixed(2) + "MB";
			}
		})
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
            var timer = setTimeout(function(){
                $('.loadingTip').show();
            }, 2000);
            $this.prop('disabled', true);

            $.ajax({
				url: 'repo/s3/bucket/objects',
				data: {
					s3Id: id,
					bucketName: bucket,
					parent:parent
				},
				type: 'post',
				success: function(data) {
                    if ( data.code == -1 ) {
                        publicFn.ajaxFail();
                    }
					else if(data.code != 200) {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					}
                    else {
						var $ul = $('<ul style="margin-left:'+preIndent+'px" class="oneMeun childUl tabList tabList' + filed + '"></ul>');
						var li = "";
						var datas={};
						datas.field=filed;
						datas.preIndent=preIndent;
						datas.value=data.model;
						datas.bucket=bucket;
                        var parentPad = $this.parent().css('padding-left').slice(0,-2) || 0,
                            curPad = +parentPad + 18 ;
						$dbName.append(template('template/child',{data:datas, pad:curPad}));
                        $this.hide();
                        $this.siblings('img').show();
					}
				},
				complete: function() {
                    $this.prop('disabled', false);
                    clearTimeout(timer);
					$(".loadingTip").hide();
				}
			})
		}

        $("body").on("click",".slideUp",function(){
            if($(this).parent(".oneResult").siblings(".childUl").length){
                $(this).parent(".oneResult").siblings(".childUl").show();
                $(this).hide().siblings(".slideDown").show();
            }else{
                var id = $(".dbZone").attr("id"),
                    bucket = $(this).siblings(".aDbName").attr("bucketName") || $(this).siblings(".aDbName").attr('title'),
                    parent = $(this).siblings(".aDbName").attr("path") || '',
                    field = $(this).parent().parent(".oneDataLi").attr("field"),
                    $dbName = $(this).parent().parent(".oneDataLi"),
                    preIndent=parseInt( $(this).parent().parent(".oneDataLi").css("margin-left"))+18,
                    $this=$(this);
                getObjList(id, bucket, field, $dbName,$this,preIndent,parent);
            }
        });

        //左侧闭合
        $("body").on("click",".slideDown",function(){
            $(this).hide().siblings(".slideUp").show();
            $(this).parent(".oneResult").siblings(".childUl").hide();
        });

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
            var data=transSources();
            if(data.length+$(".newTr").length<=1000||!$(".newTr")){
				if(data.length){
					$(".addContentZone").append(template("template/hdfsTr",{data:data}));
					$(".tabCheckAll").prop("checked",false).parent("label").removeClass("checkStatus");
                    $('.oneResult.tabcheck').removeClass('tabcheck');
				}
			}else{
				MsgTip("", common_js_lang['s3.info.limit1000'].replace(/\[x\]/, '['+transSources().length+']').replace(/\[y\]/, '['+$(".newTr").length+']'),"info");
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
			var noCheck = false;
			$(".tabCheckOne").each(function() {
				if($(this).prop("checked")) {
					noCheck = true;
				}
			})
			return noCheck;
		}

		function alhdfsCell() {
			if(!checked()) {
				MsgTip("", common_js_lang['dump.info.selectTask'], "info");
			} else {
				$(".hdfsBox,.maskCell").show();
				$(".hdfsBox .suffixShow").hide();
				$(".keep").attr("field", "all");
                $('.routeLabel.rCheckIcon').removeClass("rCheckIcon").children("input").prop("checked",false);
                $(".defaultRoute").val('').attr('title', '');
			}
		}
		$(".allConfigure").click(function() {
			if($(".addContentZone").children().length == 0) {
				MsgTip("", common_js_lang['s3.info.noneConfig'], "info");
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
					$(".defaultRoute").val(hdfsRoute).attr('title', hdfsRoute);
					$(".routeLabel").each(function() {
						if($(this).siblings(".oneRoute").attr('data-base') == hdfsRoute) {
							$(this).addClass("rCheckIcon").children("input").prop("checked", true);
							$this = $(this);
						} else {
							$(this).removeClass("rCheckIcon").children("input").prop("checked", false);
						}
					})
					sildeR($this);
				} else {
                    $('.routeLabel.rCheckIcon').removeClass("rCheckIcon").children("input").prop("checked",false);
                    $(".defaultRoute").val('').attr('title', '');
				}
				if(theFile) {
					$(".suffixRoute").val(theFile);
				} else {
					$(".suffixRoute").val($(this).parent().siblings(".hdfs").children(".parseName").html().substr(0, 99));
				}
			}
		})
			//配置保存：
		function hdfsAll() { //批量配置hdfs保存参数
            var allHdfs = $(".defaultRoute").val() || '',
                d = 0;
            if ( allHdfs == '' ){
                MsgTip('', common_js_lang['db.info.batchDir'], 'info');
                return ;
            }
            $.ajax({
                url: 'hdfs/dir/access',
                data:{hdfsId:$("#connId").val(), dir:allHdfs, pid:$('#userApp').val()},
                success: function(data){
                    if ( data.code == -1 ){
                        publicFn.ajaxFail();
                        return ;
                    }
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }

                    if(allHdfs == "/") {
                        allHdfs = "";
                    }
                    $(".hdfsMap").each(function() { //填充hdfs路径
                        if($(this).parent().children().eq(0).children("label").children(".tabCheckOne").prop("checked")) {
                            var html = $(this).siblings(".hdfs").children(".parseName").html(),
                                result = "";
                            html = html.slice(0, 60);
                            result = (allHdfs + '/'+ html).replace(/\/+/g, '\/');
                            $(this).html(result).attr("title", result).attr("route", $(".defaultRoute").val()).attr("file", html)
                                .parents('.hdfsTr').find('.tabCheckOne').click();
                        }
                    })
                    $(".maskCell,.hdfsBox").hide();
                    $(".defaultRoute").val('').attr('title', '');
                }
            });
		}

		function hdfsSingle() { //单独配置hdfs保存参数
			if($(".defaultRoute").val() && $(".suffixRoute").val().trim() && $(".suffixRoute").attr("name") == "OK") {
				if($(".suffixRoute").val().trim().match(/\s+/g)){
					MsgTip("", common_js_lang['local.info.fileName'],"info");
					$(".suffixRoute").addClass("redWord");
					return false;
				}
				if($(".suffixRoute").val().trim().match(/\\/g)){
					MsgTip("", common_js_lang['local.info.fileName'],"info");
					return false;
				}
                var name = $(".suffixRoute").val().trim();
                name = name.slice(0, 60);
				$.ajax({
					url: 'hdfs/dir/access',
					data:{hdfsId:$("#connId").val(), dir:$(".defaultRoute").val(), pid:$('#userApp').val()},
					success: function(data){
						if ( data.code == -1 ){
							publicFn.ajaxFail();
							return ;
						}
						if ( data.code != 200 ){
                            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
							return ;
						}
						var dataNum = $(".keep").attr("num");
						if($(".defaultRoute").val()!=="/"){
							var fileName = $(".defaultRoute").val() + '/' + name;
						}else{
							var fileName ='/' + name;
						}
                        fileName = fileName.replace(/\/+/g, '\/');
                        $(".newTr").each(function() {
                            if($(this).attr("field") == dataNum) {
                                $(this).children(".hdfsMap").html(fileName).attr("title", fileName);
                                $(this).children(".hdfsMap").attr("route", $(".defaultRoute").val()).attr("file", name);
                                $(".maskCell,.hdfsBox").hide();
                                $(".defaultRoute").val('').attr('title', '');
                                $(".suffixRoute").val('');
                            }
                        })
					}
				});
			} else if($(".defaultRoute").val() && $(".suffixRoute").val().trim() && $(".suffixRoute").attr("name") == "NO") {
				MsgTip("", common_js_lang['local.info.fileName'], "info");
				return false;
			} else if($(".defaultRoute").val() == "" || $(".suffixRoute").val() == "") {
				MsgTip("", common_js_lang['s3.info.dir'], "info");
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
		});
		//根目录获取：
		function dirInit(defer){
			$.ajax({
				url:'hdfs/dir/home',
				data:{hid:$("#connId").val(),pid:$("#userApp").val()},
				success:function(data){
					if(data.code==200&&data.model.length>0){
                        $(".thisRoute.startThis").html(data.model).parent().attr('data-base', data.model);
                        $(".thisRoute.startThis").parent().find(".turnOff").show();
                        $(".thisRoute.startThis").parent().find(".turnOn").hide();
						$(".firstM .startLi").children(".allMeun")&&$(".firstM .startLi").children(".allMeun").remove();
						var $this=$(".routeStart .turnOff");
						if($this){
							var aRoute = $this.siblings(".thisRoute").html(),
							preIndent = parseInt($this.parent().parent().css("text-indent"));
						}
                        $(".FileNext").attr("connId",userMsg.connId);
                        $(".addContentZone").empty();
                        $(".checkAllLab").removeClass("checkStatus").children("input").attr("checked",false);
                        defer.resolve();
                    }
                    else if(data.code==-1){
                        defer.reject();
                        publicFn.ajaxFail();
					}
                    else{
                        defer.reject();
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					}
				},
                error: function(){
                    defer.reject();
                }
			})
		}

		//获取hdsf
		function getConnect(){
	        var pid = $('#userApp').val(),
	            targetType = globalParam.commonLinkType.hdfs,
	            url = 'db/list',
	            groups = '';
	        targetType == globalParam.commonLinkType.hdfs ? (url = 'hdfs/list') : (groups = 4) ;
			if ( !pid )
				return ;
	        $.ajax({
	            url: url+'?pid='+pid+'&groups='+groups,
	            success: function(data){
	                var connHtml = '<option value="" disabled>'+common_js_lang['db.info.selectLink']+'</option>' ;
					targetType == globalParam.commonLinkType.hdfs ? adminConfigData.hdfs.id && (connHtml += '<option value="'+adminConfigData.hdfs.id+'">'+adminConfigData.hdfs.connName+'</option>') : adminConfigData.hive.id && (connHtml += '<option value="'+adminConfigData.hive.id+'">'+adminConfigData.hive.connName+'</option>') ;
					data.model.data.map(function(v){
						connHtml += '<option value="'+v.id+'">'+v.connName+'</option>' ;
					});
	                $('#connId').html(connHtml).val('').select2();
	            }
	        }).fail(function(){
				MsgTip('', 'get connection error', 'info');
	        	$('#connId').html("");
	        })
	    }
		getConnect();
		function getDir(hid,$this, aRoute, preIndent) {
            var timer = setTimeout(function(){
                $('.delayTip').show();
            }, 2000);

			$.ajax({
				url: 'hdfs/dir/list',
				type:'post',
				data: {
					base: aRoute,
					hid:hid,
					pid:$("#userApp").val()
				},
				success: function(data) {
					if(data.code == 200) {
						if(data.model.length) {
							$this.children(".turnOn").show();
							$this.children(".turnOff").hide();
							var routes = data.model;
							var $ul = $("<ul class='allMeun'></ul>");
                            var currentIndent = preIndent + 10,
                                dirLen = aRoute.length ;
                            for(var r = 0; r < routes.length; r++) {
                                var $li = $("<li class='newRoute'><label class='routeLabel'><input type='checkbox' class='routeChoiceBtn' name='route'/></label><h5 class='oneRoute' data-base='"+routes[r]+"'><img class='turnOn' src='resources/images/routeOn.png'/><img class='turnOff' src='resources/images/routeOff.png'/><span class='thisRoute' title='"+routes[r].slice(dirLen)+"'>" + routes[r].slice(dirLen) + "</span></h5></li>");
                                $li.css("padding-left", 20 + 'px');
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
					} else if(data.code == -1) {
						publicFn.ajaxFail();
					} else {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    }
				},
				complete: function() {
                    $this.removeClass('got');
                    clearTimeout(timer);
                    $(".delayTip").hide();
				}
			})
		}
		//项目切换刷新库：
		$("#connId").change(function(){
			var current=$(this).val();
			userMsg.connId=current;			
		})
		$("#userApp").change(function(){
			getConnect();
		})
		$("body").on("click", ".turnOn", function() {
			var $this = $(this);
			$this.hide().siblings(".turnOff").show();
			$this.parent().siblings(".allMeun").hide();
		})
		$("body").on("click", ".turnOff", function() {
			var $this = $(this);
            var aRoute = $(this).parent().attr('data-base');
			var preIndent = parseInt($(this).parent().parent().css("text-indent"));
			if($(this).parent().siblings(".allMeun").length == 0) {
                if ( $this.hasClass('got') )
                    return false;
                $this.addClass('got');
				getDir($("#connId").val(),$this, aRoute, preIndent);
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
            var oneRoute = $(this).siblings(".oneRoute").attr('data-base');
			$(".defaultRoute").val(oneRoute).attr('title', oneRoute);
		})
			//任务导入：
		$(".startImport").click(function() {
            if ( $(".tabCheckOne").length <= 0 ){
                MsgTip('', common_js_lang['db.info.confTar'], 'info');
                return false;
            }

			if($("#uploadSite").val() == 1) { //hive导入

			} else { //hdfs导入
				var cFlag = false;
				$(".tabCheckOne").each(function() {
					if($(this).parent().parent().siblings(".hdfsMap").html() == "") {
						cFlag = true;
					}
				})
				if(cFlag) {
					MsgTip("", common_js_lang['s3.info.configParam'], "info");
				} else {
					$(".maskCell").show();
					$(".createTabTip").show();
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
					fromId: $(".dbZone").attr("id"),
					toId: $("#connId").val(),
					fromJson:fromJson,
					toHdfsJson:toHdfsJson
				},
				success: function(data) {
                    if (data.code == 200) {
                        window.onbeforeunload = function () {
                            return
                        };
                        location.href = './success';
                    }
                    else if (data.code == -1) {
                        publicFn.ajaxFail();
                    }
                    else {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
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
					one.hid=$("#connId").val();
					one.fileName = $(this).parent().parent().siblings(".hdfsMap").html();
					toHdfsJson.push(one);
					var two={};
					two.s3Id=$(".dbZone").attr("id");
					two.bucketName=$(this).parent().parent().siblings(".hdfsMap").attr("bucket");
					two.key=$(this).parent().parent().siblings(".hdfsMap").attr("key");
					two.size=$(this).parent().parent().siblings(".hdfsMap").attr("size");
					fromJson.push(two);
				});

				fromJson=JSON.stringify(fromJson);
				toHdfsJson=JSON.stringify(toHdfsJson);
				var pid=$("#userApp").val();
				hdfsTask(pid, taskName, taskDec, fromJson,toHdfsJson)
			}
		});
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

        window.onbeforeunload = function(){
            if ( $('#dTaskName').val().trim() || $('.taskDescribe').val().trim() || $('.accKey').val().trim() || $('.secKey').val().trim() )
                return common_js_lang['common.info.leavePage'];
            return ;
        };

			//右侧全选
		$(".tabCheckAll").click(function() {
			if($(".addContentZone").children().length == 0) {
				MsgTip("", "Empty", "info");
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