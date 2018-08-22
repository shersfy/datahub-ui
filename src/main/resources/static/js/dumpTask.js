	var progress = [],
		index = 0,
		parseResult = [],
		wirteVal = [];

    var editor = CodeMirror.fromTextArea($('.fieldMap .sqlSentence')[0], {
            lineNumbers: true
        });

	function taskFn() {
		var singleDb = ''; //单独配置库字符
		var singleTab = ''; //单独配置表字符
		var singleCols = ''; //单独配置字段列数
		var singleColSep = '' //单独配置分隔符
		var dbSchemas = []; //获取db schemas
		var dbCatalog = []; //获取db catalog
		var tabName = "";
		var projectVal=$("#userApp").val();
		var userMsg={};
		userMsg.newFail=[];
		userMsg.newSuccess=0;
		userMsg.tmpAppId = 0;
		var publicFn={
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
		};
		//上传时文件信息填充：
		function fileMsg(file) {
			var tr = "<tr field='" + (index - 1) + "'><td class='fileName fileName" + (index - 1) + "' title='"+file.name+"'>" + file.name + "</td><td class='fileSize fileSize" + (index - 1) + "'>" + publicFn.fileSize(file.size) + "</td><td class='uploadParse uploadParse" + (index - 1) + "'><div class='fileProgress fileProgress" + (index - 1) + "'><p class='fileProgressBar fileProgressBar" + (index - 1) + "'></p></div><p class='progressTip progressTip" + (index - 1) + "'>"+common_js_lang['dump.info.wait']+"</p></td><td class='parseStatus parseStatus" + (index - 1) + "'><p class='parsfailTip parsfailTip" + (index - 1) + "'>"+common_js_lang['local.info.upFail']+"</p><p class='parsingTip parsingTip" + (index - 1) + "'>"+common_js_lang['local.info.pausing']+"</p><p class='parseTipTwo parseTipTwo" + (index - 1) + "'><span class='parseOk'>"+common_js_lang['local.info.upOver']+"</span></p></td><td class='last'><a title='"+common_js_lang['clientList.option.del']+"' field='" + (index - 1) + "' class='del delTask delTask" + (index - 1) + "'" + "><i></i></a></td></tr>";
			$("#fileuploadTbody").append(tr);
			if($("#fileuploadTbody #noData")){
				$("#fileuploadTbody #noData").hide();
			}
		}
		//第二页左侧填充
		function createLi(tab, i, columnSep, size, srcPath, filePath, cols, tableName) {
			var tablist = '';
			for(var j = 0; j < tab.length; j++) {
				tablist += '<li class="tabName" name="' + tableName[j] + '" cols="' + cols[j] + '" filePath="' + filePath[j] + '" srcPath="' + srcPath[j] + '" columnSep="' + columnSep[j] + '" field="' + i + j + '" size="'+size[j]+'"><label class="aLabel"><img src="resources/images/parseDump.png" class="fileIcon"/><input type="checkbox" field=' + i + ' class="acheck check check' + i + '"/><span class="name" title="'+tab[j] +'  '+ publicFn.fileSize(size[j])+'">' + tab[j] + '</span><span class="size">' + publicFn.fileSize(size[j]) + '</span></label></li>';
			}
			return tablist;
		}
		function createList(json) {
			var db = json; 
			var dbBox = '';
			for(var i = 0; i < db.length; i++) {
				if(db[i].tab.length>0){
					dbBox = '<div class="dbBox"><p class="dbName" field="' + i + '"><img src="resources/images/oneDump.png" class="cataLogIcon"/><span class="name" title="'+db[i].name+'">' + db[i].name + '</span></p><ul class="tabList tabList' + i + '">';
					if(db[i].tab) {
						dbBox += createLi(db[i].tab, i, db[i].columnSep, db[i].size, db[i].srcPath, db[i].filePath, db[i].cols, db[i].tableName);
						dbBox += '</ul><span class="iconBtn"><span class="closeBtn"><img src="resources/images/toHide.png"/></span><span class="openBtn"><img src="resources/images/toShow.png"/></span></span><label class="fileCheck"><input type="checkbox" class="leftOneCheck leftOneCheck' + i + ' check" field="' + i + '"/></label></div>';
					} else {
						dbBox += '</ul><span class="iconBtn"><span class="closeBtn"><img src="resources/images/toHide.png"/></span><span class="openBtn"><img src="resources/images/toShow.png"/></span></span><label class="fileCheck"><input type="checkbox" class="leftOneCheck leftOneCheck' + i + ' check" field="' + i + '"/></label></div>';
					}
					$(".dbZone").append(dbBox);
				}
			}
		}
		//文件上传、解析：
		$("#fileupload").fileupload({
				url: 'job/dump/file/upload',
				autoUpload: false
		}).on("fileuploadadd", function(e, data) {
				if($("#fileuploadTbody").children().length < 6) {
					var current = data["files"][0].name;
                    if ( current.length > 60 ){
                        MsgTip('', common_js_lang['s3.info.fileName100']);
                        return ;
                    }
                    var formatCheck = false;
                    try {
                        if (['sql', 'txt', 'gz', 'zip'].indexOf(current.split('.').slice(-1)[0].toLowerCase()) > -1) {
                            formatCheck = true ;
                        }
                    } catch(e){}
                    if ( !formatCheck ){
                        MsgTip('', common_js_lang['dump.info.fileType'], 'info');
                        return ;
                    }

                    index++;
                    fileMsg(data["files"][0]); //文件信息填充
                    data.index = index - 1;
                    data.submit();

				} else {
					MsgTip("", common_js_lang['dump.info.limit5'], "info");
				}
			}).on("fileuploadprogress", function(e, data) {
				progress[data.index] = parseInt(data.loaded / data.total * 100, 10);
				$(".fileProgressBar" + data.index).css('width', progress[data.index] + '%');
				if(progress[data.index] < 100) {
					$(".progressTip" + data.index).html(progress[data.index] + '%');
					$(".progressTip" + data.index).attr("uploadFinished", "no");
				} else {
					$(".progressTip" + data.index).html('100%');
					$(".progressTip" + data.index).attr("uploadFinished", "ok");
					$(".parsingTip" + data.index).show().attr("status","true");
				}
			}).on("fileuploaddone", function(e, data) {
				var res = JSON.parse(data.jqXHR.responseText);
				if(res.code == -1) {
					publicFn.ajaxFail();
				} else if(res.code !== 200) {
					$(".parsfailTip" + data.index).show().attr('title', res.msg);
					$(".parsingTip" + data.index).hide().attr("status","false");
				} else if(res.code == 200) {
					$(".parsingTip" + data.index).hide().attr("status","false");
					$(".parsfailTip" + data.index).hide();
					$(".parseTipTwo" + data.index).show().parent().addClass("success");
					$(".delTask" + data.index).attr("status", "ok");
					var oneFile = {};
					oneFile.index = data.index;
					oneFile.columnSep = [];
					oneFile.size = [];
					oneFile.srcPath = [];
					oneFile.filePath = [];
					oneFile.tab = [];
					oneFile.cols = [];
					oneFile.tableName = [];
					for(var d = 0; d < res.model.length; d++) {
						oneFile.tab.push(publicFn.reg(res.model[d].filePath));
						oneFile.columnSep.push(res.model[d].columnSep);
						oneFile.size.push(res.model[d].size);
						oneFile.srcPath.push(res.model[d].srcPath);
						oneFile.filePath.push(res.model[d].filePath);
						oneFile.cols.push(res.model[d].cols);
						oneFile.tableName.push(res.model[d].tableName);
					}
					var newFile = JSON.parse(JSON.stringify(oneFile));
					recompse(newFile, oneFile);
					//parseResult.concat(recompse(newFile,oneFile)); //获得解析后的所有文件信息
				}
			})
		//分析解析后数据的srcPath并在不同srcPath时拆解成多组对象
		function recompse(newParse, oneParse) {
			for(var p = 0; p < newParse.srcPath.length; p++) {
				var oneCompse = {};
				oneCompse.index = 0;
				oneCompse.name = "";
				oneCompse.columnSep = [];
				oneCompse.size = [];
				oneCompse.srcPath = [];
				oneCompse.filePath = [];
				oneCompse.tab = [];
				oneCompse.cols = [];
				oneCompse.tableName = [];
				var oneFlag = true;
				for(var r = 0; r < oneParse.srcPath.length; r++) {
					if(newParse.srcPath[p] == oneParse.srcPath[r]) {
						oneFlag = false;
						//添加到新数组
						oneCompse.index = oneParse.index;
						oneCompse.name = publicFn.reg(oneParse.srcPath[r]);
						oneCompse.columnSep.push(oneParse.columnSep[r]);
						oneCompse.size.push(oneParse.size[r]);
						oneCompse.srcPath.push(oneParse.srcPath[r]);
						oneCompse.filePath.push(oneParse.filePath[r]);
						oneCompse.tab.push(oneParse.tab[r]);
						oneCompse.cols.push(oneParse.cols[r]);
						oneCompse.tableName.push(oneParse.tableName[r]);
						//删除旧数组的值
						delete oneParse.columnSep[r];
						delete oneParse.size[r];
						delete oneParse.srcPath[r];
						delete oneParse.filePath[r];
						delete oneParse.tab[r];
						delete oneParse.cols[r];
						delete oneParse.tableName[r];
					}
				}
				parseResult.push(oneCompse);
			}
		}
		//文件删除：
		var delArr=[];//定义文件正在上传中删除的文件号index
		$("body").on("click", ".delTask", function() {
			var fileNum = $(this).attr("field"),
                $this = $(this) ;
            swal({
                title: '',
                text: common_js_lang['local.info.delFile'],
                type: 'info',
                showCancelButton: true
            }, function() {
                if( $this.attr("status") ) {
                    for(var i = 0; i < parseResult.length; i++) {
                        if(parseResult[i].index == fileNum) {
                            parseResult.splice(i--, 1);
                        }
                    }
                    $this.parent().parent().remove();
                    $(".addContentZone").empty();
                    $(".checkAllLab.checkStatus").removeClass("checkStatus").find('input').prop('checked', false);
                }
                else if ( !$this.attr("status") && $this.parent().siblings(".uploadParse").children(".progressTip").attr("uploadfinished")=="no"  )  {
                    $this.parent().parent().remove();
                    delArr.push(fileNum);
                }
                else if( !$this.attr("status") && $this.parent().siblings(".uploadParse").children(".progressTip").attr("uploadfinished")=="ok" && $this.parent().siblings(".parseStatus").children(".parsingTip").attr("status")=="true" ){
                    $this.parent().parent().remove();
                    delArr.push(fileNum);
                }
                else {
                    $this.parent().parent().remove();
                }

                if($("#fileuploadTbody tr").length==1){
                    $("#fileuploadTbody #noData").show();
                }
            });
		});

		$(".dumpCancelBtn").click(function() {
			location.href = "./";
		});
		
			//下一页：
		$(".dumpFileNext").click(function() {
			if($("#dTaskName").val() == "") {
				MsgTip('', common_js_lang['local.info.taskNameNone'], 'info');
				return ;
			}

			if(!$("#userApp").val()) {
				MsgTip("", common_js_lang['s3.info.noneApp'],"info");
				return false;
			}
			if(!$("#connId").val()){
				MsgTip("", common_js_lang['db.info.tarConn'],"info");
				return false;
			}

            //从数据队列中清理已删除的文件数据：
            for(var p=0;p<parseResult.length;p++){
                for(var d=0;d<delArr.length;d++){
                    if(parseResult[p].index==parseInt(delArr[d])){
                        parseResult.splice(p--, 1);
                    }
                }
            }
            if ( parseResult.length <= 0 ){
                MsgTip('', common_js_lang['local.info.tblNone'], 'info');
                return false;
            }

            var tmpArr = $(".parsingTip");
            for ( var i= 0,len=tmpArr.length; i<len; i++ ){
                if ( tmpArr.eq(i).attr("status")=="true" || !tmpArr.eq(i).attr("status") ){
                    MsgTip('', common_js_lang['local.info.upUncomplete'].replace(/\[x\]/g, '['+(i+1)+']'), 'info');
                    return false;
                }
            }


            $("#checkAllDb").prop("checked", false);
            $("#checkAllDb").parent("label").removeClass("checkStatus");

            $(".dbBox").remove();
            createList(parseResult);
            if(userMsg.connId!=$(".dumpFileNext").attr("connId") || typeof $(".dumpFileNext").attr("connId")=='undefined' || userMsg.type!=$('#uploadSite').val() || userMsg.tmpAppId != $('#userApp').val() ){
                if($("#uploadSite").val() == globalParam.commonLinkType.hdfs){
                    dirInit();
                }
                else{
                    getDB();
                }
            }
            else {
                $(".uploadFile").hide().siblings(".choiceRoute").show();
                $(window).scrollTop(0);
            }
            return false;
		})
		$(".dumpPreStep").click(function() {
			$(".choiceRoute").hide().siblings(".uploadFile").show();
		})
		//第二页：
		$("body").on("click", ".iconBtn", function() { //左侧交互
			$(this).siblings(".tabList").slideToggle();
			$(this).children(".closeBtn").toggle().siblings(".openBtn").toggle();
		})
		$("#checkAllDb").click(function() { //左侧全选：
			var checkStatus = $(this).prop("checked");
			$(".check").prop("checked", checkStatus);
			if(checkStatus) {
				$(this).parent(".checkAllDb").addClass("checkStatus");
				$(".iconBtn").siblings(".tabList").slideDown();
				$(".tabName").addClass("tabcheck");
				$(".aLabel").each(function() {
					$(this).addClass("checkStatus");
				})
				$(".fileCheck").each(function() {
					$(this).siblings(".dbName").addClass("checkStatus");
				})
				$(".closeBtn").each(function() {
					$(this).hide();
				})
				$(".openBtn").each(function() {
					$(this).show();
				})
			} else {
				$(this).parent(".checkAllDb").removeClass("checkStatus");
				$(".iconBtn").siblings(".tabList").slideUp();
				$(".tabName").removeClass("tabcheck");
				$(".aLabel").each(function() {
					$(this).removeClass("checkStatus");
				})
				$(".fileCheck").each(function() {
					$(this).siblings(".dbName").removeClass("checkStatus");
				})
				$(".closeBtn").each(function() { //显示、隐藏按钮
					$(this).show();
				})
				$(".openBtn").each(function() { //显示、隐藏按钮
					$(this).hide();
				})
			}
		})
		$("body").on("click", ".check", function() {
			if($(this).prop("checked")) {
				$(this).parent().addClass("tabcheck");
				$(this).parent("label").siblings(".dbName").addClass("checkStatus");
			} else {
				$(this).parent().removeClass("tabcheck");
				$(this).parent("label").siblings(".dbName").removeClass("checkStatus");
			}
			var checkFlag = true;
			$(".check").each(function() {
				if($(this).prop("checked") == false) {
					checkFlag = false;
				}
				if(checkFlag) {
					$("#checkAllDb").prop("checked", true);
					$(".checkAllDb").addClass("checkStatus");
				} else {
					$("#checkAllDb").prop("checked", false);
					$(".checkAllDb").removeClass("checkStatus");
				}
			})
		})
			//左侧单项全选
		$("body").on("click", ".leftOneCheck", function() {
			var num = $(this).attr("field");
			var oneStatus = $(this).prop("checked");
			$(".check" + num).prop("checked", oneStatus);
			if(oneStatus) {
				$(this).parent(".fileCheck").siblings("dbName").addClass("checkStatus");
				$(".check" + num).parent(".aLabel").each(function() {
					$(this).addClass("checkStatus");
				})
				$(".check" + num).parent(".aLabel").parent(".tabName").each(function() {
					$(this).addClass("tabcheck");
				})
			} else {
				$(this).parent(".fileCheck").siblings("dbName").removeClass("checkStatus");
				$(".check" + num).parent(".aLabel").each(function() {
					$(this).removeClass("checkStatus");
				})
				$(".check" + num).parent(".aLabel").parent(".tabName").each(function() {
					$(this).removeClass("tabcheck");
				})
			}
			var cFlag = true;
			$(".leftOneCheck").each(function() {
				if($(this).prop("checked") == false) {
					cFlag = false;
				}
				if(cFlag) {
					$("#checkAllDb").prop("checked", true);
					$(".checkAllDb").addClass("checkStatus");
				} else {
					$("#checkAllDb").prop("checked", false);
					$(".checkAllDb").removeClass("checkStatus");
				}
			})
		})
		$("body").on("click", ".acheck", function() {
			if($(this).prop("checked")) {
				$(this).parent().parent().addClass("tabcheck");
				$(this).parent(".aLabel").addClass("checkStatus");
			} else {
				$(this).parent().parent().removeClass("tabcheck");
				$(this).parent(".aLabel").removeClass("checkStatus");
			}
			var checkFlag = true,
				allStatus = true,
				num = $(this).attr("field");
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
					$(".leftOneCheck" + num).prop("checked", true);
					$(".leftOneCheck" + num).parent(".fileCheck").siblings(".dbName").addClass("checkStatus");

				} else {
					$(".leftOneCheck" + num).prop("checked", false);
					$(".leftOneCheck" + num).parent(".fileCheck").siblings(".dbName").removeClass("checkStatus");
				}
			})
		})
			//右侧全选
		$(".tabCheckAll").click(function() {
			var allStatus = $(this).prop("checked");
			if($(".addContentZone").children().length == 0) {
				MsgTip("", common_js_lang['dbManage.info.confNone'], "info");
			} else {
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
			var checkAllFlag = true;
			$(".tabCheckOne").each(function() {
				if($(this).prop("checked") == false) {
					checkAllFlag = false;
				}
				if(checkAllFlag) {
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
			if ($("#uploadSite").val() != globalParam.commonLinkType.hdfs) {
				for(var t = 0; t < tabList.length; t++) {
					trList += '<tr size="'+tabList[t][7]+'" dbName="' + dbName + '" class="newTr" tabName="' + tabList[t][6] + '" cols="' + tabList[t][5] + '" filePath="' + tabList[t][4] + '" srcPath="' + tabList[t][3] + '" columnSep="' + tabList[t][2] + '" field="' + tabList[t][1] + '"><td><label class="checkOneLab"><input type="checkbox" field="' + dbNum + '" class="tabCheckOne tabCheckOne' + dbNum + ' tabCheck"/></label></td><td class="parse" title="'+tabList[t][0]+'"><img src="resources/images/parseDump.png"/><span class="parseName">' + tabList[t][0] + '</span></td><td class="oneDbName"></td><td class="map"title="'+tabList[t][6]+'"><img src="resources/images/parseDump.png"/><span class="targetTab">' + tabList[t][6] + '</span></td><td><span class="oneConfigure"><img src="resources/images/mapData.png" class="mapImg"/><b class="mapTip">'+common_js_lang['local.option.config']+'</b></span></td></tr>';
				}
			} else {
				for(var t = 0; t < tabList.length; t++) {
					trList += '<tr size="'+tabList[t][7]+'" dbName="' + dbName + '" class="newTr" tabName="' + tabList[t][6] + '" cols="' + tabList[t][5] + '" filePath="' + tabList[t][4] + '" srcPath="' + tabList[t][3] + '" columnSep="' + tabList[t][2] + '" field="' + tabList[t][1] + '"><td><label class="checkOneLab"><input type="checkbox" field="' + dbNum + '" class="tabCheckOne tabCheckOne' + dbNum + ' tabCheck"/></label></td><td class="hdfs" type="hdfs" title="'+tabList[t][0]+'"><img src="resources/images/parseDump.png"/><span class="parseName">' + tabList[t][0] + '</span></td><td class="map hdfsMap" type="hdfs"></td><td><span class="oneConfigure" field="hdfs"><img src="resources/images/mapData.png" class="mapImg"/><b class="mapTip">'+common_js_lang['local.option.config']+'</b></span></td></tr>';
				}
			}
			return trList;
		}
		//单库表文件数量统计
		function fileNum(){
			$(".fileNum").each(function(){
				$(this).html($(this).parent().parent().parent().siblings("tbody").children(".newTr").length);
			})
		}
		$("#pointRight").click(function() {
            $('.checkAllLab.checkStatus').removeClass('checkStatus');
			$(".tabCheckAll").prop("checked", false);
			$(".dbName").each(function() {
				var oneFlag = false;
				var dbId = $(this).attr("field");
				var oneList = [];
				var dbName = $(this).children(".name").html();
				$(this).siblings(".tabList").children().each(function() {
					var oneTr = [];
					var trField = $(this).attr("field");
					if($(this).children(".aLabel").children(".check").prop("checked")) {
						oneFlag = true;
						oneTr.push($(this).children(".aLabel").children(".name").html());
						oneTr.push($(this).attr("field"));
						oneTr.push($(this).attr("columnSep"));
						oneTr.push($(this).attr("srcPath"));
						oneTr.push($(this).attr("filePath"));
						oneTr.push($(this).attr("cols"));
						if( $("#uploadSite").val() != globalParam.commonLinkType.hdfs &&!$(this).attr("name").match(/^[\w_]+$/g)){
							oneTr.push("");	
						}else{
							oneTr.push($(this).attr("name"));
						}
                        oneTr.push($(this).attr("size"));
                        oneList.push(oneTr);
						if(mathdb(dbId, $('.createTab')) == false && mathLi(trField, $(".newTr"))) {
							if($("#uploadSite").val() != globalParam.commonLinkType.hdfs) {
								var single = '<tr class="newTr" size="'+$(this).attr('size')+'" dbName="' + dbName + '" tabName="' + $(this).attr("name") + '" filePath="' + $(this).attr("filePath") + '" srcPath="' + $(this).attr("srcPath") + '" columnSep="' + $(this).attr("columnSep") + '" field="' + $(this).attr("field") + '"><td><label class="checkOneLab"><input type="checkbox" field="' + dbId + '" class="tabCheckOne tabCheckOne' + dbId + ' tabCheck"/></label></td><td class="parse" title="'+$(this).children(".aLabel").children(".name").html()+'"><img src="resources/images/parseDump.png"/><span class="parseName">' + $(this).children(".aLabel").children(".name").html() + '</span></td><td class="oneDbName"></td><td class="map" title="'+$(this).attr("name")+'"><img src="resources/images/parseDump.png"/><span class="targetTab">' + $(this).attr("name") + '</span></td><td><span class="oneConfigure"><img src="resources/images/mapData.png" class="mapImg"/><b class="mapTip">'+common_js_lang['local.option.config']+'</b></span></td></tr>';
							} else {
								var single = '<tr class="newTr" size="'+$(this).attr('size')+'" dbName="' + dbName + '" tabName="' + $(this).attr("name") + '" filePath="' + $(this).attr("filePath") + '" srcPath="' + $(this).attr("srcPath") + '" columnSep="' + $(this).attr("columnSep") + '" field="' + $(this).attr("field") + '"><td><label class="checkOneLab"><input type="checkbox" field="' + dbId + '" class="tabCheckOne tabCheckOne' + dbId + ' tabCheck"/></label></td><td class="hdfs" type="hdfs" title="'+$(this).children(".aLabel").children(".name").html()+'"><img src="resources/images/parseDump.png"/><span class="parseName">' + $(this).children(".aLabel").children(".name").html() + '</span></td><td class="map hdfsMap" type="hdfs"></td><td><span class="oneConfigure" field="hdfs"><img src="resources/images/mapData.png" class="mapImg"/><b class="mapTip">'+common_js_lang['local.option.config']+'</b></span></td></tr>';
							}
							$(".createTab" + dbId).append(single);
							$(".createTab" + dbId).siblings("thead").children().eq(0).children().eq(0).children("label").removeClass("checkStatus");
							$(".createTab" + dbId).siblings("thead").children().eq(0).children().eq(0).children("label").children(".fileCheck").prop("checked", false);
							$(".checkAllLab").removeClass("checkStatus").children(".tabCheckAll").prop("checked", false);
						}
					}
				})
				if($(".addContentZone").children().length == 0 && oneFlag) { //右侧为空
					var oneTabH = "<table class='newTable'><thead><tr><th><label class='fileCheckLab'><input type='checkbox' field='" + dbId + "' class='tabCheck rFileCheck fileCheck fileCheck" + dbId + "'/></label></th><th colspan='2'><img src='resources/images/oneDump.png'/><span class='dbFile'>" + dbName + "</span> "+common_js_lang['dbManage.text.have']+" <span class='fileNum'></span> "+common_js_lang['db.text.tblNum']+"</th><th class='noLine'></th><th></th></tr></thead><tbody class='createTab createTab" + dbId + "' field='" + dbId + "'>";
					var inTr = createTab(dbId, oneList, dbName);
					var oneTabF = "</tbody></table>";
					var oneTab = oneTabH + inTr + oneTabF;
					$('.addContentZone').append(oneTab);
				}
				if(mathdb(dbId, $('.createTab')) && oneFlag) { //右侧不为空，无该表格
					var oneTabH = "<table class='newTable'><thead><tr><th><label class='fileCheckLab'><input type='checkbox' field='" + dbId + "' class='tabCheck rFileCheck fileCheck fileCheck" + dbId + "'/></label></th><th colspan='2'><img src='resources/images/oneDump.png'/><span class='dbFile'>" + dbName + "</span> "+common_js_lang['dbManage.text.have']+" <span class='fileNum'></span> "+common_js_lang['db.text.tblNum']+"</th><th class='noLine'></th><th></th></tr></thead><tbody class='createTab createTab" + dbId + "' field='" + dbId + "'>";
					var inTr = createTab(dbId, oneList, dbName);
					var oneTabF = "</tbody></table>";
					var oneTab = oneTabH + inTr + oneTabF;
					$('.addContentZone').append(oneTab);
				}
			})

            $('.leftZone .tabName.tabcheck .check').click();
			fileNum();
		})
			//向左删除
		$("#pointLeft").click(function() {
			$(".tabCheckOne").each(function() {
				if($(this).prop("checked")) {
					if($(this).parent().parent().parent().parent().children().length == 1) {
						$(this).parent().parent().parent().parent().parent().remove();
					} else {
						$(this).parent().parent().parent().remove();
					}
					if($(".newTable").length == 0) {
						$(".tabCheckAll").prop("checked", false);
						$(".tabCheckAll").parent("label").removeClass("checkStatus");
					}
				}
			})
			fileNum();
		})

		function getDB() {
            $('#globalLoadCon').show();
			$.ajax({
				url: 'db/dbs',
				data: {
					pid:$("#userApp").val(),
					id: userMsg.connId
				},
				success: function(data) {
					if( data.code == 200 ) {
						dbSchemas=[];
						dbCatalog=[];
                        var dbList = '<option value="" disabled>'+common_js_lang['local.option.getDb']+'</option>';
                        data.model.databases.map(function(v, i) {
							dbList += '<option catalog="' + v.catalog + '" schema="' + v.schema + '" value="'+ v.dbName+'">' + v.dbName + '</option>';
							dbSchemas.push(v.schema);
							dbCatalog.push(v.catalog);
						});
						$("#dbName").html(dbList).val("").select2();
                        if ( data.model.databases && data.model.databases.length <= 0 ){
                            MsgTip('info', common_js_lang['dump.info.dbNone']);
                        }

                        $('.choiceRoute h3.tip i').html(common_js_lang['csv.text.hiveNote']);
                        $(".dumpFileNext").attr("connId",userMsg.connId);
                        userMsg.type = $('#uploadSite').val();
                        userMsg.tmpAppId = $('#userApp').val();
                        $(".addContentZone").empty();
                        $(".checkAllLab").removeClass("checkStatus").children("input").attr("checked",false);
                        $(".uploadFile").hide().siblings(".choiceRoute").show();
                        $(window).scrollTop(0);
					}else if(data.code == 0) {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					}else if(data.code == -1) {
						publicFn.ajaxFail();
					}
				},
                complete: function(){
                    $('#globalLoadCon').hide();
                }
			})
		}

		//批量配置
		function checked() { //check有无勾选项
			var noCheck = true;
			$(".tabCheckOne").each(function() {
				if($(this).prop("checked")) {
					noCheck = false;
				}
			})
			return noCheck;
		}

		function alHiveCell() {
			if(checked()) {
				MsgTip("", common_js_lang['dump.info.selectTask'], "info");
				return false;
			}
			$(".maskCell,.contentBox,.mathRoute.hiveH,.contentBox .bottomBtn,.fieldMap, .hiveH .batchTitle").show();
			$(".mathRoute.hdfsH,.contentBox .bakBtnZ,.tabMsg,.tab,.part,.fieldMap, .formatType").hide();
			$(".keep").attr("field", "all");
		}

		function alHdfsCell() {
			if(checked()) {
				MsgTip("", common_js_lang['dump.info.selectTask'], "info");
			} else {
				$(".maskCell").show();
				$(".contentBox").show();
				$(".keep").attr("field", "all");
				$(".mathRoute.hiveH").hide();
				$(".mathRoute.hdfsH").show();
                $('.mathRoute.hdfsH .routeTitle').hide();
                $('.hdfsH .batchTitle').show();
                $(".contentBox .bakBtnZ").hide();
				$(".contentBox .bottomBtn").show();
				$(".fieldMap").hide();
				$(".hdfsRoute").val("");
				$(".suffixShow").hide();
                $('.routeLabel.rCheckIcon').removeClass("rCheckIcon").children("input").prop("checked",false);
                $(".defaultRoute").val('').attr('title', '');
			}
		}
		$(".allConfigure").click(function() {
			if($(".addContentZone").children().length == 0) {
				MsgTip("", common_js_lang['dump.info.addConfig'], "info");
			} else {
				if($("#uploadSite").val() != globalParam.commonLinkType.hdfs) {
					alHiveCell(); //弹出层
				} else {
					alHdfsCell(); //弹出层
				}
			}
		});

        // 必读说明 hover
        var hoverInterval = 0;
        $('.contentBox strong').hover(function(){
            var self = $(this);
            hoverInterval = setTimeout(function(){
                    self.find('.tip').css({display:'block'});},
                300);
        }, function(){
            clearInterval(hoverInterval);
            $(this).find('.tip').css({display:'none'});
        });

		//遍历展开所勾选的路径
	 	function sildeR(route){
	 		var oneMenu=route.parent().parent();
	 		oneMenu.show();
	 		oneMenu.siblings(".oneRoute").children(".turnOn").show();
	 		oneMenu.siblings(".oneRoute").children(".turnOff").hide();
	 		if(!oneMenu.hasClass("firstM")){
	 			sildeR(oneMenu);
	 		}
	 	}

        // 打开配置框 回显
		$("body").on("click", ".oneConfigure", function() {
            var paramStr = $(this).parents('tr').attr('data-param') || '',
                param = paramStr ? JSON.parse( paramStr ) : '' ;

			$(".maskCell, .contentBox").show();
			$(".contentBox .bakBtnZ").hide();
			$(".contentBox .bottomBtn").show();
			var dataNum = $(this).parents('.newTr').attr("field");
			$(".keep").attr({"num":dataNum, field:'one'});
            $('.mathRoute .titleBatch').hide();
			if($("#uploadSite").val() != globalParam.commonLinkType.hdfs) {
                $(".mathRoute.hiveH").show();
				$(".mathRoute.hdfsH, .hiveH .batchTitle").hide();
				$(".fieldMap, .tabMsg, .tab, .fieldMap, .formatType").show();
				$(".part").hide();
				$('.partition').empty();

                $('.contentBox .hiveH .tableType').val( param.tableType || ($("#uploadSite").val() == globalParam.commonLinkType.hive ? 0 : 1) ).prop('disabled', $("#uploadSite").val() == globalParam.commonLinkType.spark || param.ddl? true : false);
                var dbName = param.name || '',
                    tableName = param.tableName || $(this).parents('.newTr').attr('tabname');

                if( dbName ) {
                    if ( $('#dbName').val() != dbName ){
                        $('#dbName').val(dbName).select2();
                        hiveModule.getTables(param);
                    }
                    else {
                        $('#tableName').val(tableName).select2({tags:true});
                        if ( $('#tableName').val() != tableName ){
                            $('#tableName').append('<option value="'+tableName+'">'+tableName+'</option>').val(tableName).select2({tags:true});
                        }
                    }

                    if ( param.ddl ){
                        hiveModule.getPart(param.tableName, param.catalog, param.schema, param.partition);
                        editor.doc.cm.setOption('readOnly', true);
                        editor.doc.setValue(param.ddl);
                        $('.fieldMap .CodeMirror').addClass('disabled');
                    }
                    if ( param.createSql ) {
                        editor.doc.cm.setOption('readOnly', false);
                        editor.doc.setValue(param.createSql);
                        $('.fieldMap .CodeMirror').removeClass('disabled');
                    }
                }
                else {
                    $('#dbName').val('').select2();
                    $('#tableName').html('<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option><option>' + tableName + '</option>').val(tableName).select2({tags: true});
                    $('.contentBox .hiveH .tableType').val($("#uploadSite").val() == globalParam.commonLinkType.hive ? 0 : 1).prop('disabled', true);
                    editor.doc.cm.setOption('readOnly', true);
                    editor.doc.setValue('');
                    $('.fieldMap .CodeMirror').addClass('disabled');
                }
			}
            else {
				$(".mathRoute.hiveH, .fieldMap, .hdfsH .batchTitle").hide();
				$(".mathRoute.hdfsH, .suffixShow, .mathRoute.hdfsH .routeTitle").show();

				var hdfsRoute = param.curPath || '';
				var theFile = param.name || '';
				if( hdfsRoute ){
					$(".defaultRoute").val(hdfsRoute).attr('title', hdfsRoute);
					$(".routeLabel").each(function(){
						if($(this).siblings(".oneRoute").attr('data-base')==hdfsRoute){
							$(this).addClass("rCheckIcon").children("input").prop("checked",true);
							$this=$(this);
						}else{
							$(this).removeClass("rCheckIcon").children("input").prop("checked",false);
						}
					})
					sildeR($this);
				}
                else{
                    $('.routeLabel.rCheckIcon').removeClass("rCheckIcon").children("input").prop("checked",false);
                    $(".defaultRoute").val('').attr('title', '');
				}

				if(theFile) {
					$(".suffixRoute").val(theFile);
				}
                else {
					$(".suffixRoute").val($(this).parent().siblings(".hdfs").children(".parseName").html().substr(0,99));
				}
			}
		});


        function hiveConfigModule(param){
            this.container = param.container ;
            this.event();
        }
        hiveConfigModule.prototype = {
            event: function(){
                var _this = this;

                _this.container.on('change', '#dbName', function(){
                    if ($(".keep").attr("field") == "one") {
                        var param = _this.getParam();
                        if (!param.name) {
                            return;
                        }
                        _this.getTables(param);
                    }
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
                    _this.getDdlAct(param, 3, _this.container, editor);
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
                    _this.getDdlAct(param, 3, _this.container, editor);
                });
            },
            getParam: function(){
                var dataNum = $('.keep').attr('num'),
                    trDom = $('.newTr[field="'+dataNum+'"]'),
                    cols = trDom.attr('cols'),
                    columnsep = trDom.attr('columnsep');

                var _this = this;
                var dbDom = _this.container.find("#dbName option:selected");
                return {
                    dbId: userMsg.connId,
                    name: dbDom.val(),
                    pid: $('#userApp').val(),
                    catalog: dbDom.attr('catalog') || '',
                    schema: dbDom.attr('schema') || '',
                    tableName: _this.container.find('#tableName').val(),
                    tableType: _this.container.find('.tableType').val(),
                    format: _this.container.find('.tableType option:selected').text(),
                    cols: cols,
                    colSep: columnsep
                }
            },
            getTables: function(param) {
                var _this = this;
                $("#globalLoadCon").show();
                $.when( globalParam.promiseFunc.getTables(param)).then(function(){
                    $('#part .partition').html('');
                    $('#part').css({display: 'none'});

                    var tbls = globalParam.tblModel['tbl_'+param.dbId+'_'+param.catalog+'_'+param.schema];
                    var tableList = '<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option>';
                    tbls.map(function(v) {
                        tableList += '<option data-name="' + v.name + '">' + v.name + '</option>';
                    });
                    $("#tableName").html(tableList);

                    if ( !param.tableName || !param.tableName.match(/^[0-9A-Za-z]\w*$/g) ){
                        $('#tableName').val('').select2({tags:true});
                        MsgTip('', common_js_lang['db.info.tableName'], 'info');
                        $("#globalLoadCon").hide();
                        return false;
                    }

                    $('#tableName').val(param.tableName).select2({tags:true});
                    if ( $('#tableName').val() != param.tableName ){
                        $('#tableName').append('<option>'+param.tableName+'</option>').val(param.tableName).select2({tags:true});
                    }

                    if( param.tableName ) {
                        if ( !param.ddl && !param.createSql )
                            hiveModule.getDdlAct(param, 3, _this.container ,editor);
                        else
                            $("#globalLoadCon").hide();
                    }
                    else {
                        editor.doc.cm.setOption('readOnly', 'nocursor'); // 不显示光标
                        editor.doc.setValue('');
                        $('.fieldMap .CodeMirror').addClass('disabled');
                        $('#tableName').val('').select2({tags: true});
                        $("#globalLoadCon").hide();
                    }
                }).fail(function(){
                    $("#globalLoadCon").hide();
                });
            },
            getDdlAct: function(param, type, conDom, editor){
                conDom = conDom || this.container ;
                var _this = this;
                $("#globalLoadCon").show();
                var defer = $.Deferred();
                $.when( globalParam.promiseFunc.getDdl(param, type) ).then(function(data){
                    if ( data.mppTable && $("#uploadSite").val() == globalParam.commonLinkType.hive ){
                        editor.doc.setValue('');
                        defer.reject();
                        MsgTip('info', common_js_lang['db.tip.hivexspark']);
                        return ;
                    }
                    if ( !data.mppTable && $("#uploadSite").val() == globalParam.commonLinkType.spark ){
                        editor.doc.setValue('');
                        defer.reject();
                        MsgTip('info', common_js_lang['db.tip.sparkxhive']);
                        return ;
                    }

                    editor.doc.setValue(data.ddl);
                    if ( data.isShow ){
                        editor.doc.cm.setOption('readOnly', 'nocursor');
                        conDom.find('.CodeMirror').addClass('disabled');
                        var formatVal = {
                            text: '0',
                            orc: '1',
                            parquet: '2',
                            rcfile: '3',
                            sequencefile: '4'
                        } ;
                        conDom.find('.tableType').val(formatVal[data.format] || 0).prop('disabled', true);
                        _this.getPart(param.tableName, param.catalog, param.schema, param.partition || '', defer);
                    }
                    else {
                        editor.doc.cm.setOption('readOnly', false);
                        conDom.find('.CodeMirror').removeClass('disabled');
                        var formatVal = {
                            text: '0',
                            orc: '1',
                            parquet: '2',
                            rcfile: '3',
                            sequencefile: '4'
                        } ;
                        conDom.find('.tableType').val(formatVal[data.format] || ($("#uploadSite").val() == globalParam.commonLinkType.hive ? 0 : 1)).prop('disabled', $("#uploadSite").val() == globalParam.commonLinkType.spark || false);
                        $('#part .partition').html('');
                        $('#part').css({display: 'none'});
                        defer.resolve();
                    }
                }).fail(function(){
                    conDom.find('#tableName').val('').select2({tags:true});
                    editor.doc.setValue('');
                    editor.doc.cm.setOption('readOnly', 'nocursor');
                    conDom.find('.CodeMirror').addClass('disabled');
                    conDom.find('.tableType').val(0).prop('disabled', true);

                    defer.reject();
                });

                $.when( defer).always(function(){
                    $("#globalLoadCon").hide();
                });
            },
            getPart: function(tblName, catalog, schema, partitions, defer){
                var _this = this;
                $.when( globalParam.promiseFunc.getPart({dbId:userMsg.connId,tableName: tblName, catalog:catalog, schema:schema}) )
                    .then(function(data){
                        _this.partitionShow(data, partitions);
                        defer && defer.resolve();
                    }).fail(function(){
                        defer && defer.reject();
                    });
            },
            partitionShow: function(model, partitions){
                $('#partitions').empty();
                $('.partition').html('');
                if( !model || model.length == 0) {
                    $("#part").hide();
                }
                else {
                    $("#part").show();
                    model.map(function(v, i){
                        var _html = '';
                        _html += '<div class="item"><input type="text" class="filedName" value="' + v.name + '" disabled>' +
                        '<label>=</label>' +
                        '<select class="select2 filedVal selVal" data-type="' + v.name + '" id="Part_level_' + i + '">';
                        v.parts.map(function(vv){
                            _html += '<option value="'+vv.value+'" title="'+vv.name+'">'+vv.value+'</option>';
                        });
                        _html += globalParam.columnValOption+'</select></div>' ;
                        $('.partition').append(_html);
                        $('.partition #Part_level_'+i).select2({placeholder: "value",tags: true});
                    });

                    if(partitions) {
                        var partObj = JSON.parse(partitions);
                        for(var k in partObj) {
                            if ( $('.partition').find('[data-type="' + k + '"]').find('[value="'+partObj[k]+'"]').length == 1 ){
                                $('.partition').find('[data-type="' + k + '"]').val(partObj[k]).trigger('change');
                            }
                            else {
                                $('.partition').find('[data-type="' + k + '"]').prepend('<option value="'+partObj[k]+'">'+partObj[k]+'</option>').val(partObj[k]).change();
                            }
                        }
                    }
                }
            }
        };
        var hiveModule = new hiveConfigModule({container: $('.contentBox')});

        function configParam(){
            this.listContainer = $('.rightZone .dbContainer');
            this.configContainer = $('.contentBox');
            this.event();
        }
        configParam.prototype = {
            event: function(){
                var _this = this;
                _this.configContainer.on('click', '.keep', function(){
                    if ( $(this).attr("field") == "all" ){
                        if ( $("#uploadSite").val() != globalParam.commonLinkType.hdfs )
                            _this.hiveBatchAct();
                        else {
                            _this.hdfsBatchAct();
                        }
                    }
                    else {
                        if ( $("#uploadSite").val() != globalParam.commonLinkType.hdfs )
                            _this.hiveSingleAct();
                        else {
                            _this.hdfsSingleAct();
                        }
                    }
                });
            },
            hdfsBatchAct: function(){
                var allHdfs = $(".defaultRoute").val() || '';
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

                        $('.newTable .checkOneLab.checkStatus').each(function(){
                            var tr = $(this).parents('.newTr'),
                                name = tr.find('.hdfs').attr('title') ;
                            name = name.slice(0, 60);
                            var fileName = (allHdfs + '/' + name).replace(/\/+/g, '\/');
                            tr.attr('data-param', JSON.stringify({fileName:fileName, curPath:allHdfs, name:name, hid:userMsg.connId}))
                                .find('.hdfsMap').html(fileName).attr('title', fileName);
                            $(this).find('.tabCheckOne').click();
                        });
                        $(".maskCell").hide();
                        $(".contentBox").hide();
                        $(".defaultRoute").val('').attr('title', '');
                    }
                });
            },
            hdfsSingleAct: function(){
                var name = $('.suffixRoute').val().trim() || '',
                    curPath = $('.defaultRoute').val().trim() || '' ;

                if (!curPath || !name) {
                    MsgTip('', common_js_lang['local.info.fileDir'], 'info');
                    return false;
                }
                if ( name.match(/\s+|\\+/g) ){
                    MsgTip('', common_js_lang['local.info.fileName'], 'info');
                    return false;
                }
                name = name.slice(0, 60);
                var _this = this;
                $.ajax({
                    url: 'hdfs/dir/access',
                    data:{hdfsId:$("#connId").val(), dir:curPath, pid:$('#userApp').val()},
                    success: function(data){
                        if ( data.code == -1 ){
                            publicFn.ajaxFail();
                            return ;
                        }
                        if ( data.code != 200 ){
                            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                            return ;
                        }
                        var dataNum = _this.configContainer.find('.keep').attr('num'),
                            fileName = curPath + '/' + name ;
                        fileName = fileName.replace(/\/+/g, '\/');
                       var tarTr = $('.newTr[field="'+dataNum+'"]');
                        tarTr.find(".hdfsMap").html(fileName).attr("title",fileName);
                        tarTr.attr('data-param', JSON.stringify({fileName:fileName, curPath:curPath, name:name, hid:userMsg.connId}));
                        $(".maskCell").hide();
                        $(".contentBox").hide();
                        $(".defaultRoute").val('').attr('title', '');
                        $(".suffixRoute").val('');
                    }
                });
            },
            hiveBatchAct: function(){
                var dbDom = $("#dbName option:selected"),
                    batchName = dbDom.val(),
                    catalog = dbDom.attr('catalog') || '',
                    schema = dbDom.attr('schema') || '' ;

                if ( !batchName ){
					MsgTip('info', common_js_lang['client.info.noDb']);
                    return false;
                }
                var target = $('.newTable .checkOneLab.checkStatus'),
                    tarLen = target.length,
                    deferArr = [];
                $('#waitLoading').find('article').html('<p>' + common_js_lang['loading.info.batchConf'].replace(/\[x\]/, tarLen) + '</p><p class="detail"></p>').end().css({display: 'block'});

                var tblDefer = $.Deferred();
                var param = {dbId:userMsg.connId, catalog:catalog, schema:schema};
                $.when( globalParam.promiseFunc.getTables(param) ).then( function(){
                    var tbls = globalParam.tblModel['tbl_'+userMsg.connId+'_'+catalog+'_'+schema];
                    var tableList = '<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option>';
                    tbls.map(function(v) {
                        tableList += '<option data-name="' + v.name + '">' + v.name + '</option>';
                    });
                    $("#tableName").html(tableList).val('').select2({tags:true});
                    tblDefer.resolve();
                }).fail(function(){
                    tblDefer.reject();
                    $('#waitLoading').hide();
                });

                $.when( tblDefer).then(function() {
                    for (var i = 0; i < tarLen; i++) {
                        var tr = target.eq(i).parents('.newTr'),
                            cols = tr.attr('cols'),
                            columnsep = tr.attr('columnsep'),
                            tblName = tr.attr('tabname');

                        deferArr[i] = $.Deferred();
                        if (!tblName.match(/^[0-9A-Za-z]\w*$/g)) {
                            tr.attr('data-param', JSON.stringify({
                                dbId: userMsg.connId,
                                name: batchName,
                                catalog: catalog,
                                schema: schema
                            }));
                            tr.find('.map').attr('title', '').find('.targetTab').html('');
                            deferArr[i].resolve();
                            continue;
                        }
                        else {
                            var param = {
                                dbId: userMsg.connId,
                                name: batchName,
                                catalog: catalog,
                                schema: schema,
                                tableName: tblName,
                                cols: cols,
                                colSep: columnsep,
                                tableType: $('#uploadSite').val() == globalParam.commonLinkType.hive ? 0 : 1,
                                format: $('#uploadSite').val() == globalParam.commonLinkType.hive ? 'text' : 'orc'
                            };
                            handle(param, deferArr[i], tr);
                        }
                    }

                    function handle(param, defer, tr) {
                        $.when(globalParam.promiseFunc.getDdl(param, 3)).then(function (data) {
                            if ( data.mppTable && $("#uploadSite").val() == globalParam.commonLinkType.hive ){
                                defer.reject();
                                MsgTip('info', common_js_lang['db.tip.hivexspark']);
                                return ;
                            }
                            if ( !data.mppTable && $("#uploadSite").val() == globalParam.commonLinkType.spark ){
                                defer.reject();
                                MsgTip('info', common_js_lang['db.tip.sparkxhive']);
                                return ;
                            }

                            var formatVal = {
                                text: '0',
                                orc: '1',
                                parquet: '2',
                                rcfile: '3',
                                sequencefile: '4'
                            };
                            var tableType = formatVal[data.format] || 0;
                            param.tableType = tableType;
                            data.isShow ? param.ddl = data.ddl : param.createSql = data.ddl;
                            tr.attr('data-param', JSON.stringify(param));
                            tr.find('.oneDbName').html(param.name);
                            tr.find('.map').attr('title', param.tableName).find('.targetTab').html(param.tableName);
                            tr.find('.tabCheckOne').click();
                            defer.resolve();
                        }).fail(function () {
                            defer.reject();
                        });
                    }

                    $.when.apply($, deferArr).then(function () {
                        $(".maskCell, .contentBox, #waitLoading").hide();
                    }).fail(function () {
                        $('#waitLoading').hide();
                    });
                });
            },
            hiveSingleAct: function(){
                var param = this.saveHiveParam();
                if ( !param )
                    return ;

                var dataNum = this.configContainer.find('.keep').attr('num'),
                    trDom = this.listContainer.find('.newTr[field="'+dataNum+'"]');
                trDom.children(".oneDbName").html(param.name).attr("title",param.name);
                trDom.children(".map").children(".targetTab").html(param.tableName).attr("title",param.tableName);
                trDom.attr('data-param', JSON.stringify(param));
                $(".maskCell").hide();
                $(".contentBox").hide();
            },
            saveHiveParam: function(){
                var dbDom = this.configContainer.find('#dbName option:selected'),
                    dbName = dbDom.val(),
                    catalog = dbDom.attr('catalog') || '',
                    schema = dbDom.attr('schema') || '',
                    tableName = this.configContainer.find('#tableName').val(),
                    tableType = this.configContainer.find('.tableType').val(),
                    partition = this.savePart(),
                    sql = editor.doc.getValue(),    //editor
                    dataNum = $('.keep').attr('num'),
                    trDom = $('.newTr[field="'+dataNum+'"]'),
                    cols = trDom.attr('cols'),
                    columnsep = trDom.attr('columnsep');

                if ( [dbName, tableName, sql].indexOf('') > -1 ){
                    MsgTip('', common_js_lang['local.info.tblErr'], 'info');
                    return false;
                }

                var ddl = '', createSql = '';
                if ( !editor.doc.cm.isReadOnly() ) {
                    createSql = sql;
                    sql = sql.substring(sql.indexOf("TABLE") + "TABLE".length, sql.indexOf("(")).trim();
                    sql = sql.replace(/\"|\'|`|\[|\]/g, '');
                    try {
                        var sqlArr = sql.split('.');
                        if (!(sqlArr[0] == dbName && sqlArr[1] == tableName)) {
                            MsgTip('', common_js_lang['db.info.sqlErr'], 'info');
                            return false;
                        }
                    } catch (e) {
                        MsgTip('', common_js_lang['db.info.sqlErr'], 'info');
                        return false;
                    }
                }
                else {
                    ddl = sql;
                }

                var param = {
                    dbId: userMsg.connId,
                    name: dbName,
                    catalog: catalog,
                    schema: schema,
                    tableName: tableName,
                    tableType: tableType,
                    ddl: ddl,
                    createSql: createSql,
                    cols: cols,
                    colSep: columnsep
                } ;
                partition ? param.partition = JSON.stringify( partition ) : '';
                return param;
            },
            savePart: function(){
                var partitions = this.configContainer.find('#part .filedVal'),
                    partitionItems = {} ;
                if ( partitions.length <= 0 )
                    return '';

                for(var i = 0, length = partitions.length; i < length; i++) {
                    partitionItems[partitions.eq(i).attr('data-type')] = partitions.eq(i).val().trim();
                }

                return partitionItems;
            }
        };
        var configObj = new configParam();

		//执行任务
		function taskHive(data) {
            $('#globalLoadCon').show();
			$.ajax({
				url: 'job/dump/save',
				type: 'post',
				data:data,
				success: function(data) {
					if(data.code == 200) {
                        window.onbeforeunload = function(){return} ;
                        location.href="./success";
					} else if(data.code==0){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					}else if(data.code == -1) {
						publicFn.ajaxFail();
					}
				},
                complete:function(){
                    $('#globalLoadCon').hide();
                }
			})
		};

		function taskHdfs(data) {
            $('#globalLoadCon').show();
			$.ajax({
				url: 'job/dump/save',
				type: "post",
				data: data,
				success: function(data) {
					if(data.code == 200) {
                        window.onbeforeunload = function(){return} ;
						location.href="./success";
					}else if(data.code == -1) {
                        publicFn.ajaxFail();
                    }
                    else {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					}
				},
                complete:function(){
                    $('#globalLoadCon').hide();
                }
			})
		};

		$(".startImport").click(function() {
            if ( $(".tabCheckOne").length <= 0 ){
                MsgTip('', common_js_lang['db.info.confTar'], 'info');
                return false;
            }

			if ($("#uploadSite").val() != globalParam.commonLinkType.hdfs) {
                var trs = $('.newTable .newTr'),
                    fromJson = [],
                    toHiveJson = [],
                    tablesJson = [],
                    batchPartTables = [],
                    partDefer = $.Deferred(),
                    batchDefer = $.Deferred();

                for ( var i= 0,len=trs.length; i<len; i++ ){
                    var paramStr = trs.eq(i).attr('data-param') || '';
                    if ( !paramStr ){
                        MsgTip('info', common_js_lang['local.info.hiveParam']);
                        return false;
                    }
                    var fromObj = {
                        tableName: trs.eq(i).attr('tabname'),
                        srcPath: trs.eq(i).attr('srcpath'),
                        filePath: trs.eq(i).attr('filepath'),
                        columnSep: trs.eq(i).attr('columnsep'),
                        size: trs.eq(i).attr('size')
                    };
                    fromJson.push( fromObj );
                    var toObj = JSON.parse(paramStr);
                    toHiveJson.push( toObj );
                    if ( toObj.createSql ){  //新建表
                        tablesJson.push({catalog:toObj.catalog, schema: toObj.schema, tableName:toObj.tableName, ddl:toObj.createSql, index:i});
                    }

                    if ( toObj.ddl && !toObj.partition ) {
                        var partArrObj = globalParam.partitionsData['catalog' + toObj.catalog + '_schema' + toObj.schema + '_' + toObj.tableName];
                        if ( partArrObj && partArrObj.length > 0 ) {  //已知存在分区但没配置
                            MsgTip('', common_js_lang['db.text.tbl'] + '[' + toObj.tableName + '] ' + common_js_lang['local.info.hiveParam'] + '\n', 'info');
                            return false;
                        }

                        if ( !partArrObj) {  // 没配置分区，不知是否有分区
                            batchPartTables.push(toObj);
                        }
                    }
                }

                if ( batchPartTables.length >= 1 ){
                    $('#waitLoading').find('article').html('<p>'+common_js_lang['db.text.checkWait']+'</p><p class="detail"></p>').end().css({display:'block'});
                    $.when( globalParam.promiseFunc.batchPartCheck({dbId: userMsg.connId, pid:$('#userApp').val(), tablesJsonStr:JSON.stringify(batchPartTables)}) )
                        .then(function(){
                            partDefer.resolve();
                        }).fail(function(){
                            partDefer.reject();
                        })
                }
                else {
                    partDefer.resolve();
                }

                $.when( partDefer).then(function(){
                    if ( tablesJson.length >= 1 ){
                        var errMsg = '',
                            errTitle = '',
                            errDetail = '',
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
                            data: {dbId: userMsg.connId, pid:$('#userApp').val(), tablesJsonStr: JSON.stringify(spliceJson)},
                            success: function(data){
                                if ( data.code != 200 ){
                                    errTitle ? '' : errTitle = data.i18nMsg.title ;
                                    errDetail ? '' : errDetail = data.i18nMsg.detail ;
                                    errMsg += data.msg+'\n' ;
                                    failCount += amount ;
                                }
                                else {
                                    data.model.map(function (v, i) {
                                        var index = tablesJson[i+init].index;
                                        if (v.code != 200) {
                                            failCount ++ ;
                                            errTitle ? '' : errTitle = v.i18nMsg.title ;
                                            errDetail ? '' : errDetail = v.i18nMsg.detail ;
                                            errMsg += '[' + tablesJson[i+init].tableName + ']:' + v.msg + '.\n';
                                            return;
                                        }
                                        succCount ++ ;
                                        toHiveJson[index].ddl = v.model.ddl;
                                        toHiveJson[index].createSql = '';
                                        toHiveJson[index].tableName = v.model.tableName;
                                        toHiveJson[index].catalog = v.model.catalog;
                                        toHiveJson[index].schema = v.model.schema;
                                        trs.eq(index).attr('data-param', JSON.stringify(toHiveJson[index])); // dom参数更新
                                    });
                                }
                                init += 100 ;
                                $('#waitLoading').find('article .detail').html(common_js_lang['loading.info.newInfo'].replace(/\[x\]/, succCount).replace(/\[y\]/, failCount)) ;
                                createTblBatch();
                            }
                        })
                    }
                }).fail(function(){
                    batchDefer.reject();
                });

                $.when( batchDefer).then(function(){
                    var param = {
                        pid: $("#userApp").val(),
                        jobName: $("#dTaskName").val().trim(),
                        note: $(".taskDescribe").val(),
                        toType: $("#uploadSite").val() == globalParam.commonLinkType.hive ? 9 : 13,
                        toId: userMsg.connId,
                        fromJson: JSON.stringify( fromJson ),
                        toHiveJson: JSON.stringify( toHiveJson )
                    };
                    taskHive(param);
                    return false;
                }).always(function(){
                    $('#waitLoading').hide();
                    return false;
                });
            }
            else {  // hdfs
				var trs = $('.newTable .newTr'),
                    fromJson = [],
                    toHdfsJson = [];
                for ( var i= 0,len=trs.length; i<len; i++ ){
                    var paramStr = trs.eq(i).attr('data-param') || '';
                    if ( !paramStr ){
                        MsgTip('info', common_js_lang['dbManage.info.hdfsParamErr']);
                        return false;
                    }
                    var fromObj = {
                        tableName: trs.eq(i).attr('tabname'),
                        srcPath: trs.eq(i).attr('srcpath'),
                        filePath: trs.eq(i).attr('filepath'),
                        columnSep: trs.eq(i).attr('columnsep'),
                        size: trs.eq(i).attr('size')
                    };
                    fromJson.push(fromObj);
                    toHdfsJson.push( JSON.parse(paramStr) );
                }

                var param = {
                    pid: $("#userApp").val(),
                    jobName: $("#dTaskName").val().trim(),
                    note: $(".taskDescribe").val(),
                    toType: 8,
                    toId: userMsg.connId,
                    fromJson: JSON.stringify( fromJson ),
                    toHdfsJson: JSON.stringify( toHdfsJson )
                };
                taskHdfs(param);
                return false;
            }
		});

		$("body").on("click", ".routeLabel", function() {
			$(".routeLabel").each(function() {
				$(this).removeClass("rCheckIcon");
			});
			$(this).addClass("rCheckIcon");

            var oneRoute = $(this).siblings(".oneRoute").attr('data-base');
			$(".defaultRoute").val(oneRoute).attr('title', oneRoute);
		})
		//刷新目标连接
		function getConnect(){
	        var pid = $('#userApp').val(),
	            targetType = $('#uploadSite').val(),
	            url = 'db/list',
                dbType = 31,
	            groups = '';
            targetType == globalParam.commonLinkType.hdfs ? (url = 'hdfs/list') : (groups = 4) ;
            targetType == globalParam.commonLinkType.spark ? dbType = 62 : '';
			if ( !pid )
				return ;
	        $.ajax({
                url: url+'?pid='+pid+'&groups='+groups+'&dbType='+dbType,
	            success: function(data){
	               var connHtml = '<option value="" disabled>'+common_js_lang['db.info.selectLink']+'</option>' ;
                    targetType == globalParam.commonLinkType.hdfs ? adminConfigData.hdfs.id && (connHtml += '<option value="'+adminConfigData.hdfs.id+'">'+adminConfigData.hdfs.connName+'</option>') : '';
                    targetType == globalParam.commonLinkType.hive ? adminConfigData.hive.id && (connHtml += '<option value="'+adminConfigData.hive.id+'">'+adminConfigData.hive.connName+'</option>') : '';
                    data.model.data.map(function(v){
	                    connHtml += '<option value="'+v.id+'">'+v.connName+'</option>' ;
	                });
	                $('#connId').html(connHtml).val('').select2();
	            }
	        }).fail(function(){
	        	$('#connId').html("");
	        })
	   }
		getConnect();		
		$("#uploadSite").change(function(e){
			var $target=$(e.target);
			getConnect();
			if($(this).val() != globalParam.commonLinkType.hdfs ) {
				$(".headTitle").show();
				$(".headTitltTwo").hide();
				return false;
			}
			$(".headTitle").hide();
			$(".headTitltTwo").show();
		})
		$("#userApp").change(function(){			
			getConnect();
		})
		$("#connId").change(function(e){
			var $target=$(e.target);
			userMsg.connId=$(this).val();
		})

		//hdfs根目录获取：
		function dirInit(){
            $('#globalLoadCon').show();
			$.ajax({
				url:'hdfs/dir/home',
				data:{hid:userMsg.connId,pid:$("#userApp").val()},
				success:function(data){
					if(data.code==200&&data.model.length>0){
						$(".allMeun.firstM").show();
                        $(".thisRoute.startThis").html(data.model).parent().attr('data-base', data.model);
                        $(".thisRoute.startThis").parent().find(".turnOff").show();
                        $(".thisRoute.startThis").parent().find(".turnOn").hide();
						$(".firstM .startLi").children(".allMeun")&&$(".firstM .startLi").children(".allMeun").remove();
						var $this=$(".routeStart .turnOff");
						if($this){
							var aRoute = $this.siblings(".thisRoute").html(),
							preIndent = parseInt($this.parent().parent().css("text-indent"));
						}
                        $('.choiceRoute h3.tip i').html(common_js_lang['csv.text.hdfsNote']);
                        $(".dumpFileNext").attr("connId",userMsg.connId);
                        userMsg.type = $('#uploadSite').val();
                        userMsg.tmpAppId = $('#userApp').val();
                        $(".addContentZone").empty();
                        $(".checkAllLab").removeClass("checkStatus").children("input").attr("checked",false);
                        $(".uploadFile").hide().siblings(".choiceRoute").show();
                        $(window).scrollTop(0);
					}else if(data.code==-1){
						publicFn.ajaxFail();
					}else{
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
						$(".thisRoute.startThis").html("");
						$(".firstM .startLi").children(".allMeun").remove();
						$(".allMeun.firstM").hide();
					}
				},
                complete:function(){
                    $('#globalLoadCon').hide();
                }
			})
		}
		//次级目录资源获取：
		function getDir(hid,$this, aRoute, preIndent) {
            var timer = setTimeout(function(){
                $('#globalLoadCon').show();
            }, 2000);

			$.ajax({
				url: 'hdfs/dir/list',
				data: {
					hid:hid,
					base: aRoute,
                    pid: $('#userApp').val()
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
					}
                    else {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    }
				},
				complete: function() {
                    $this.removeClass('got');
                    clearTimeout(timer);
                    $("#globalLoadCon").hide();
				}
			})
		}
		$("body").on("click", ".turnOn", function() {
			var $this = $(this);
			$this.hide().siblings(".turnOff").show();
			$this.parent().siblings(".allMeun").hide();
		})
		$("body").on("click", ".turnOff", function() {
			var $this = $(this);
            var aRoute = $(this).parent().attr('data-base');
			var preIndent = parseInt($(this).parent().parent().css("text-indent"));
			if ($(this).parent().siblings(".allMeun").length == 0) {
                if ( $this.hasClass('got') )
                    return false;
                $this.addClass('got');
				getDir(userMsg.connId,$this, aRoute, preIndent);
			} else {
				$this.parent().siblings(".allMeun").show();
				$this.hide().siblings(".turnOn").show();
			}
		})
		$(".closeMap").click(function() {
			$(".sqlSentence").empty();
			$(".maskCell").hide();
			$(".contentBox").hide();
			$(".suffixRoute").removeClass("redWord");
		})
		$(".copyNameBtn").click(function() {
			var status = $(this).prop("checked");
			if(status) {
				$(this).parent("label").removeClass("copyNoCheck").addClass("copyOk");
				$(".routeLabel").each(function() {
					$(this).removeClass("rCheckIcon");
				});
			}else{
				$(this).parent("label").addClass("copyNoCheck").removeClass("copyOk");
			}
		})
		$(".cancelKeep").click(function() {
			$(".sqlSentence").empty();
			$(".maskCell").hide();
			$(".contentBox").hide();
			$(".suffixRoute").removeClass("redWord");
		})

        window.onbeforeunload = function(){
            if ( $('#dTaskName').val().trim() || $('.mapTaskMsg .taskDescribe').val().trim() || $('#fileuploadTbody .fileName').length > 0 )
                return common_js_lang['common.info.leavePage'];
            return ;
        };

		$("#copyName").click(function() {
			var checkCopy=$(this).val();
			if($(".copyNameBtn").prop("checked")) {
				$(".maskCell,.contentBox,.mathRoute.hdfsH").show();
				$(".keep").attr("field", "all");
				$(".mathRoute.hiveH,.fieldMap,.suffixShow,.contentBox .bottomBtn").hide();				
				$(".hdfsWrite,.contentBox .bakBtnZ").show();
				$(".hdfsRoute").val("");
				if(checkCopy){
					$(".defaultRoute").val(checkCopy).attr('title', checkCopy);
					$(".routeLabel").each(function(){
						if($(this).siblings(".oneRoute").children(".thisRoute").html()==checkCopy){
							$(this).addClass("rCheckIcon").children("input").prop("checked",true);
							$this=$(this);
						}else{
							$(this).removeClass("rCheckIcon").children("input").prop("checked",false);
						}
					})
					sildeR($this);
				}else{
					$(".routeLabel").each(function(){
						if($(this).hasClass("rCheckIcon")){
                            var hdfs = $(this).siblings(".oneRoute").children(".thisRoute").html();
							$(".defaultRoute").val(hdfs).attr('title', hdfs);
						}
					})
				}
			}
		});
		$(".bakRouteOk").click(function() {
			if($(".defaultRoute").val()) {
				$(".maskCell,.contentBox").hide();
				$(".contentBox .bakBtnZ").hide();
				$(".contentBox .bottomBtn").show();
				$("#copyName").val($(".defaultRoute").val());
				return false;
			}
			MsgTip("", common_js_lang['dump.info.bakPath'], "info");
		})
		$(".suffixRoute").blur(function() {
			var str = $(this).val().trim();
			if(str.match(/\s+/g)||str.match(/\\/g)){
				$(".suffixRoute").addClass("redWord");
			}else{
				$(".suffixRoute").removeClass("redWord");
			}
		})
		$("#pointLeft,#pointRight").on("mouseenter",function(){
			$(this).children(".lost").hide().siblings(".select").show();
		}).on("mouseleave",function(){
			$(this).children(".lost").show().siblings(".select").hide();
		})
	}

	function init() {
		taskFn();
	}
	init();