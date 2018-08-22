$(function() {
	/*var dbSchemas = []; //获取db schemas
	var dbCatalog = []; //获取db catalog*/

	var onecols = ''; //单独配置获取解析文件cols,以请求ddl
	var onecolSep = ''; //单独配置获取解析文件colSep,以请求ddl
	var tabName = ''; //单独配置获取当前表名

	var creatDdl = []; //将创建ddl的配置信息
	var haveTab = []; //已经存在表的任务信息

	/*var singleDb = ''; //单独配置库字符
	var singleTab = ''; //单独配置表字符
	var singleCols = ''; //单独配置字段列数
	var singleColSep = '' //单独配置分隔符*/
	var ddls = []; //批量创建时批量获取ddl
	var aLDbName=[];//批量设置前dbName的数组

	var progress = [],
		index = 0,
		parseResult = [];
	function eventBind() {
		/*function createLi(tab, i, columnSep, size, srcPath, filePath, cols, tableName) {
			var tablist = '';
			for(var j = 0; j < tab.length; j++) {
				tablist += '<li class="tabName" name="' + tableName[j] + '" cols="' + cols[j] + '" filePath="' + filePath[j] + '" srcPath="' + srcPath[j] + '" columnSep="' + columnSep[j] + '" field="' + i + j + '"><label class="aLabel"><img src="resources/images/parseDump.png" class="fileIcon"/><input type="checkbox" field=' + i + ' class="acheck check check' + i + '"/>&emsp;&emsp;<span class="name">' + tab[j] + '</span><span class="size">' + size[j] + '</span></label></li>';
			}
			return tablist;
		}

		function createList(json) {
			var db = json; //接口好了后要修改
			var dbBox = '';
			for(var i = 0; i < db.length; i++) {
				dbBox = '<div class="dbBox"><p class="dbName" field="' + i + '"><img src="resources/images/oneDump.png" class="cataLogIcon"/><span class="name">' + db[i].name + '</span></p><ul class="tabList tabList' + i + '">';
				if(db[i].tab) {
					dbBox += createLi(db[i].tab, i, db[i].columnSep, db[i].size, db[i].srcPath, db[i].filePath, db[i].cols, db[i].tableName);
					dbBox += '</ul><span class="iconBtn"><span class="closeBtn">+</span><span class="openBtn">—</span></span><label class="fileCheck"><input type="checkbox" class="leftOneCheck leftOneCheck' + i + ' check" field="' + i + '"/></label></div>';
				} else {
					dbBox += '</ul><span class="iconBtn"><span class="closeBtn">+</span><span class="openBtn">—</span></span><label class="fileCheck"><input type="checkbox" class="leftOneCheck leftOneCheck' + i + ' check" field="' + i + '"/></label></div>';
				}
				$(".dbZone").append(dbBox);
			}
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
		//文件名获取：
		function reg(str) {
			str = str.replace(/\\/g, "/");
			var reg = /([^\/]+)$/g;
			str = str.replace(reg, 'd$1');
			return RegExp.$1;
		}
		//文件上传、解析：
		$("#fileupload").fileupload({
				url: 'job/dump/file/upload',
				autoUpload: false
			}).on("fileuploadadd", function(e, data) {
				if($("#fileuploadTbody").children().length < 5) {
					var current = data["files"][0].name;
					var flag = true;
					$(".fileName").each(function() {
						if($(this).html() == current) {
							flag = false;
							swal({
									title: "Are you sure?",
									text: "发现重名文件，请确认是否继续上传该文件？",
									type: "warning",
									showCancelButton: true,
									confirmButtonColor: "#DD6B55",
									confirmButtonText: "确认",
									closeOnConfirm: true
								},
								function() {
									index++;
									fileMsg(data["files"][0]); //文件信息填充
									data.index = index - 1;
									data.submit();
								});
						}
					})
					if(flag) {
						index++;
						fileMsg(data["files"][0]); //文件信息填充
						data.index = index - 1;
						data.submit();
					}
				} else {
					swal("ERROR", "一次性上传文件数量不能超过5个", "error");
				}
			}).on("fileuploadprogress", function(e, data) {
				progress[data.index] = parseInt(data.loaded / data.total * 100, 10);
				$(".fileProgressBar" + data.index).css('width', progress[data.index] + '%');
				if(progress[data.index] < 100) {
					$(".progressTip" + data.index).html(progress[data.index] + '%');
				} else {
					$(".progressTip" + data.index).html("已完成");
					$(".progressTip" + data.index).attr("uploadFinished", "ok");
					$(".parsingTip" + data.index).show();
				}
			}).on("fileuploaddone", function(e, data) {
				var res = JSON.parse(data.jqXHR.responseText);
				if(res.code == -1) {
					location.href = '/login?returnUrl=' + location.pathname + location.search;
				} else if(res.code !== 200) {
					$(".parsfailTip" + data.index).show();
					$(".parsingTip" + data.index).hide();
				} else if(res.code == 200) {
					$(".parsingTip" + data.index).hide();
					$(".parsfailTip" + data.index).hide();
					$(".parseTipTwo" + data.index).show();
					$(".delTask" + data.index).attr("status", "ok");
					var oneFile = {};
					oneFile.name = reg(res.model[0].srcPath);
					oneFile.index = data.index;
					oneFile.columnSep = [];
					oneFile.size = [];
					oneFile.srcPath = [];
					oneFile.filePath = [];
					oneFile.tab = [];
					oneFile.cols = [];
					oneFile.tableName = [];
					for(var d = 0; d < res.model.length; d++) {
						oneFile.tab.push(reg(res.model[d].filePath));
						oneFile.columnSep.push(res.model[d].columnSep);
						oneFile.size.push(fileSize(res.model[d].size));
						oneFile.srcPath.push(res.model[d].srcPath);
						oneFile.filePath.push(res.model[d].filePath);
						oneFile.cols.push(res.model[d].cols);
						oneFile.tableName.push(res.model[d].tableName);
					}
					parseResult.push(oneFile); //获得解析后的所有文件信息
				}
			})
			//文件删除：
		$("body").on("click", ".delTask", function() {
				if($(this).attr("status")) {
					var fileNum = $(this).attr("field");
					for(var i = 0; i < parseResult.length; i++) {
						if(parseResult[i].index == fileNum) {
							parseResult.splice(i, 1);
						}
					}
					$(this).parent().parent().remove();
				} else {
					$(this).parent().parent().remove();
				}
			})
			//文件信息填充：
		function fileMsg(file) {
			var tr = "<tr field='" + (index - 1) + "'><td class='fileName fileName" + (index - 1) + "'>" + file.name + "</td><td class='fileSize fileSize" + (index - 1) + "'>" + fileSize(file.size) + "</td><td class='uploadParse uploadParse" + (index - 1) + "'><div class='fileProgress fileProgress" + (index - 1) + "'><p class='fileProgressBar fileProgressBar" + (index - 1) + "'></p></div><p class='progressTip progressTip" + (index - 1) + "'>等待</p></td><td class='parseStatus parseStatus" + (index - 1) + "'><p class='parsfailTip parsfailTip" + (index - 1) + "'>解析失败，</br>请重新上传！</p><p class='parsingTip parsingTip" + (index - 1) + "'>正在解析...</p><p class='parseTipTwo parseTipTwo" + (index - 1) + "'><img class='parseIcon' src='resources/dist/images/dumpUpload/selectTip.png'/><span class='parseOk'>解析完成</span></p></td><td><span field='" + (index - 1) + "' class='delTask delTask" + (index - 1) + "'" + "></span></td></tr>";
			$("#fileuploadTbody").append(tr);
		}
		$(".dumpCancelBtn").click(function() {
			location.href = "./";
		})
		$("#uploadSite").on("change", function() {
				if($(".addContentZone").children().length == 0) {
					if($(this).val()) {
						$(".headTitltTwo").hide();
						$(".headTitle").show();
					} else {
						$(".headTitltTwo").hide();
						$(".headTitle").show();
					}
				} else {
					var thisVal = $(this).val();
					swal({
							title: "Are you sure?",
							text: "该操作将失去当前已配置参数，请确认是否继续？",
							type: "warning",
							showCancelButton: true,
							confirmButtonColor: "#DD6B55",
							confirmButtonText: "确认",
							closeOnConfirm: true
						},
						function() {
							$(".addContentZone").empty();
							$(".tabCheckAll").prop("checked", false);
							$(".tabCheckAll").parent("label").removeClass("checkStatus");
						});
				}
			})
			//下一页：
		$(".dumpFileNext").click(function() {
			var parseFlag = false;
			$(".delTask").each(function() {
				if($(this).attr("status")) {
					parseFlag = true;
				}
			})
			if(parseFlag) {
				if($("#dTaskName").val()) {
					$("#checkAllDb").prop("checked", false);
					$("#checkAllDb").parent("label").removeClass("checkStatus");
					$(".dbBox").remove();
					createList(parseResult);
					$(".uploadFile").hide().siblings(".choiceRoute").show();
					$(window).scrollTop(0);
					if($("#uploadSite").val() == 1) {
						$(".headTitle").show();
						$(".headTitltTwo").hide();
					} else {
						$(".headTitle").hide();
						$(".headTitltTwo").show();
					}
				} else {
					swal("ERROR", "请填写任务名称", "error");
				}
			} else {
				swal("ERROR", "解析数据为空", "error");
			}
		})
		$(".dumpPreStep").click(function() {
			$(".choiceRoute").hide().siblings(".uploadFile").show();
		})*/

		//dump第二页
		/*$("body").on("click", ".iconBtn", function() { //左侧交互
			$(this).siblings(".tabList").slideToggle();
			$(this).children(".closeBtn").toggle();
			$(this).children(".openBtn").toggle();
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
					$(this).addClass("checkStatus");

				})
				$(".closeBtn").each(function() {
					$(this).addClass("displayNone");
				})
				$(".openBtn").each(function() {
					$(this).addClass("displayInline");
				})
			} else {
				$(this).parent(".checkAllDb").removeClass("checkStatus");
				$(".iconBtn").siblings(".tabList").slideUp();
				$(".tabName").removeClass("tabcheck");
				$(".aLabel").each(function() {
					$(this).removeClass("checkStatus");
				})
				$(".fileCheck").each(function() {
					$(this).removeClass("checkStatus");

				})
				$(".closeBtn").each(function() {
					$(this).addClass("displayInline");
				})
				$(".openBtn").each(function() {
					$(this).addClass("displayNone");
				})
			}
		})
		$("body").on("click", ".check", function() {
				if($(this).prop("checked")) {
					$(this).parent().addClass("tabcheck");
					$(this).parent("label").addClass("checkStatus");
				} else {
					$(this).parent().removeClass("tabcheck");
					$(this).parent("label").removeClass("checkStatus");
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
				$(this).parent(".fileCheck").addClass("checkStatus");
				$(".check" + num).parent(".aLabel").each(function() {
					$(this).addClass("checkStatus");
				})
				$(".check" + num).parent(".aLabel").parent(".tabName").each(function() {
					$(this).addClass("tabcheck");
				})
			} else {
				$(this).parent(".fileCheck").removeClass("checkStatus");
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
						$(".leftOneCheck" + num).prop("checked", true);
						$(".leftOneCheck" + num).parent(".fileCheck").addClass("checkStatus");

					} else {
						$(".leftOneCheck" + num).prop("checked", false);
						$(".leftOneCheck" + num).parent(".fileCheck").removeClass("checkStatus");
					}
				})
			})
			//右侧全选
		$(".tabCheckAll").click(function() {
			var allStatus = $(this).prop("checked");
			$(".tabCheck").prop("checked", allStatus);
			if(allStatus) {
				$(this).parent("label").addClass("checkStatus");
				$(".tabCheck").parent("label").addClass("checkStatus");
			} else {
				$(this).parent("label").removeClass("checkStatus");
				$(".tabCheck").parent("label").removeClass("checkStatus");
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
		$("body").on("click", ".fileCheck", function() {
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
			//向左删除
		$("#pointLeft").click(function() {
				$(".tabCheckOne").each(function() {
					if($(this).prop("checked")) {
						if($(this).parent().parent().parent().children().parent().length == 1) {
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

		function createTab(dbNum, tabList) {
			var trList = '';
			if($("#uploadSite").val() == 1) {
				for(var t = 0; t < tabList.length; t++) {
					trList += '<tr class="newTr" tabName="' + tabList[t][6] + '" cols="' + tabList[t][5] + '" filePath="' + tabList[t][4] + '" srcPath="' + tabList[t][3] + '" columnSep="' + tabList[t][2] + '" field="' + tabList[t][1] + '"><td><label class="checkOneLab"><input type="checkbox" field="' + dbNum + '" class="tabCheckOne tabCheckOne' + dbNum + ' tabCheck"/></label></td><td class="parse"><img src="resources/images/parseDump.png"/><span class="parseName">' + tabList[t][0] + '</span></td><td class="oneDbName"></td><td class="map"><img src="resources/images/parseDump.png"/><span class="targetTab">' + tabList[t][6] + '</span></td><td><span class="oneConfigure"><img src="resources/images/mapData.png" class="mapImg"/><b class="mapTip">配置</b></span></td></tr>';
				}
			} else {
				for(var t = 0; t < tabList.length; t++) {
					trList += '<tr class="newTr" cols="' + tabList[t][5] + '" filePath="' + tabList[t][4] + '" srcPath="' + tabList[t][3] + '" columnSep="' + tabList[t][2] + '" field="' + tabList[t][1] + '"><td><label class="checkOneLab"><input type="checkbox" field="' + dbNum + '" class="tabCheckOne tabCheckOne' + dbNum + ' tabCheck"/></label></td><td class="hdfs" type="hdfs"><img src="resources/images/parseDump.png"/><span class="parseName">' + tabList[t][0] + '</span></td><td class="map hdfsMap" type="hdfs"></td><td><span class="oneConfigure" field="hdfs"><img src="resources/images/mapData.png" class="mapImg"/><b class="mapTip">配置</b></span></td></tr>';
				}
			}
			return trList;
		}
		$("#pointRight").click(function() {
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
							oneTr.push($(this).attr("name"));
							oneList.push(oneTr);
							if(mathdb(dbId, $('.createTab')) == false && mathLi(trField, $(".newTr"))) {
								if($("#uploadSite").val() == 1) {
									var single = '<tr class="newTr" tabName="' + $(this).attr("name") + '" filePath="' + $(this).attr("filePath") + '" srcPath="' + $(this).attr("srcPath") + '" columnSep="' + $(this).attr("columnSep") + '" field="' + $(this).attr("field") + '"><td><label class="checkOneLab"><input type="checkbox" field="' + dbId + '" class="tabCheckOne tabCheckOne' + dbId + ' tabCheck"/></label></td><td class="parse"><img src="resources/images/parseDump.png"/><span class="parseName">' + $(this).children(".aLabel").children(".name").html() + '</span></td><td class="oneDbName"></td><td class="map"><img src="resources/images/parseDump.png"/><span class="targetTab">' + $(this).attr("name") + '</span></td><td><span class="oneConfigure"><img src="resources/images/mapData.png" class="mapImg"/><b class="mapTip">配置</b></span></td></tr>';
								} else {
									var single = '<tr class="newTr" filePath="' + $(this).attr("filePath") + '" srcPath="' + $(this).attr("srcPath") + '" columnSep="' + $(this).attr("columnSep") + '" field="' + $(this).attr("field") + '"><td><label class="checkOneLab"><input type="checkbox" field="' + dbId + '" class="tabCheckOne tabCheckOne' + dbId + ' tabCheck"/></label></td><td class="hdfs" type="hdfs"><img src="resources/images/parseDump.png"/><span class="parseName">' + $(this).children(".aLabel").children(".name").html() + '</span></td><td class="map hdfsMap" type="hdfs"></td><td><span class="oneConfigure" field="hdfs"><img src="resources/images/mapData.png" class="mapImg"/><b class="mapTip">配置</b></span></td></tr>';
								}
								$(".createTab" + dbId).append(single);
							}
						}
					})
					if($(".addContentZone").children().length == 0 && oneFlag) { //右侧为空
						var oneTabH = "<table class='newTable'><thead><tr><th><label class='fileCheckLab'><input type='checkbox' field='" + dbId + "' class='tabCheck fileCheck fileCheck" + dbId + "'/></label></th><th><img src='resources/images/oneDump.png'/><span class='dbFile'>" + dbName + "</span></th><th class='noLine'></th><th></th><th></th></tr></thead><tbody class='createTab createTab" + dbId + "' field='" + dbId + "'>";
						var inTr = createTab(dbId, oneList);
						var oneTabF = "</tbody></table>";
						var oneTab = oneTabH + inTr + oneTabF;
						$('.addContentZone').append(oneTab);
					}
					if(mathdb(dbId, $('.createTab')) && oneFlag) { //右侧不为空，无该表格
						var oneTabH = "<table class='newTable'><thead><tr><th><label class='fileCheckLab'><input type='checkbox' field='" + dbId + "' class='tabCheck fileCheck fileCheck" + dbId + "'/></label></th><th><img src='resources/images/oneDump.png'/><span class='dbFile'>" + dbName + "</span></th><th class='noLine'></th><th></th><th></th></tr></thead><tbody class='createTab createTab" + dbId + "' field='" + dbId + "'>";
						var inTr = createTab(dbId, oneList);
						var oneTabF = "</tbody></table>";
						var oneTab = oneTabH + inTr + oneTabF;
						$('.addContentZone').append(oneTab);
					}
				})
			})
			//备份：
		$(".copyNameBtn").click(function() {
				var status = $(this).prop("checked");
				if(status) {
					$(this).parent("label").removeClass("copyNoCheck").addClass("copyOk");
					$("#copyName").prop("disabled", false);
				} else {
					$(this).parent("label").addClass("copyNoCheck").removeClass("copyOk");
					$("#copyName").prop("disabled", true);
				}
			})*/
			/*//db数据方法：
		var initIndex = 0;
		function getDB(one) {
			$.ajax({
				url: 'db/dbs',
				data: {
					id: 1
				},
				success: function(data) {
					//填充db信息
					var dbList = '';
					dbSchemas = [];
					dbCatalog = [];
					dbCols = [];
					dbcolSep = [];
					data.model.databases.map(function(v, i) {
						dbList += '<option value="' + i + '">' + v.dbName + '</option>';
						dbSchemas.push(v.schema);
						dbCatalog.push(v.catalog);
					});
					if(one) {
						getTables("one");
					}
					$("#dbName").html(dbList);
				}
			})
		}*/
		/*//新建表sql获取：
		function newSql(dbId, catalog, schema, tableName, cols, colSep) {
			$(".delayTip").show();
			$.ajax({
				url: 'db/table/ddl/cols',
				type:"post",
				data: {
					dbId: dbId,
					catalog: catalog,
					schema: schema,
					tableName: tableName,
					cols: cols,
					colSep: colSep
				},
				success: function(data) {
					if(data.code == 200) {
						var sqlArr1 = data.model.split("\n");
						var sqlArr2 = [];
						for(var q = 0; q < sqlArr1.length; q++) {
							sqlArr2.push(sqlArr1[q]);
						}
						var sqlRow = '';
						for(s = 0; s < sqlArr2.length; s++) {
							sqlRow += '<p class="oneLineSql"><input  type="text" class="sqlWrite" value="' + sqlArr2[s] + '"/><span class="lineIndex">' + (s + 1) + '</span></p>';
						}
						$(".sqlSentence").empty().append(sqlRow);
					}
				},
				complete:function(){
					$(".delayTip").hide();
				}
			})
		}
		//显示已有表的sql
		function haveSql(dbId, catalog, schema, tableName) {
			$.ajax({
				url: 'db/table/ddl/show',
				data: {
					dbId: dbId,
					catalog: catalog,
					schema: schema,
					tableName: tableName
				},
				success: function(data) {
					if(data.code == 200) {
						var sqlArr1 = data.model.split("\n");
						var sqlArr2 = [];
						for(var q = 0; q < sqlArr1.length; q++) {
							sqlArr2.push(sqlArr1[q]);
						}
						var sqlRow = '';
						for(s = 0; s < sqlArr2.length; s++) {
							sqlRow += '<p class="oneLineSql"><input  type="text" class="sqlWrite" value="' + sqlArr2[s] + '" disabled/><span class="lineIndex">' + (s + 1) + '</span></p>';
						}
						$(".sqlSentence").empty().append(sqlRow);
					}
				}
			})
		}*/
		/*//表
		function getTables(hiveTable) {
			$(".delayTip").show();
			$.ajax({
				url: 'db/table/tbls',
				data: {
					dbId: 1,
					schema: dbSchemas[$("#dbName").val()],
					catalog: dbCatalog[$("#dbName").val()]
				},
				success: function(data) {
					initIndex++;
					var tableList = '';
					data.model.map(function(v) {
						tableList += '<option schema="' + v.schema + '" catalog="' + v.catalog + '">' + v.name + '</option>';
					});
					$("#tableName").empty();
					var tabs = $("#tableName").html() + tableList;
					$("#tableName").html(tabs);
					if($("#tableName option").length > 0) {
						var tabFlag = true;
						$("#tableName option").each(function() {
							if($(this).text() == tabName) {
								tabFlag = false;
								$(this).selected;
							}
						})
						if(tabFlag && hiveTable == "one") {
							var currentTab = "<option identify='new' value='" + tabName + "'>" + tabName + "</option>";
							$("#tableName").prepend(currentTab);
							newSql(1, dbCatalog[$("#dbName").val()], dbSchemas[$("#dbName").val()], tabName, onecols, onecolSep);
						} else if(!tabFlag) {
							haveSql(1, dbCatalog[$("#dbName").val()], dbSchemas[$("#dbName").val()], tabName);
						}
					}
					if(hiveTable && hiveTable !== 'one') {
						$('#tableName').val(hiveTable).select2({
							tags: true
						});
						getPart(hiveTable, partitions);
					} else {
						$('#tableName').select2({
							tags: true
						});
						getPart(data.model[0].tblName);
					}
				},
				complete: function() {
					$(".delayTip").hide();
				}
			})
		}
		//分区：
		function getPart(tblName, partitions) {
			$.ajax({
				url: 'hive/partitions',
				data: {
					dbName: $('#dbName').val(),
					tblName: tblName
				},
				success: function(data) {
					if(data.model.cols.length == 0) {
						$(".partition").hide();
					} else {
						$(".partition").show();
						if(data.model.vals.length > 0) {
							var _data = [];
							var _selData = {};
							$.each(data.model.vals, function(k, v) {
								var _item = [];
								var _d = v.split('/');
								$.each(_d, function(key, val) {
									_item.push(val.split('=')[1]);
								})
								_data.push(_item);
							})
							var _html = '';
							$.each(data.model.cols, function(k, v) {
								_html += '<div class="item">' +
									'<input type="text" class="filedName" value="' + v + '" disabled>' +
									'<label>=</label>' +
									'<select class="select2 filedVal selVal" data-type="' + v + '" id="Part_level_' + k + '"></select>' +
									'</div>'
							})
							$('#partitions').html(_html);
							var _selData = [];

							function getNextData(data, level, sel) {
								var _result = [];
								$.each(data, function(k, v) {
									var _has = true;
									for(var i = 0; i < level; i++) {
										if(v[i] != _selData[i]) {
											_has = false;
											break;
										}
									}
									if(_has) {
										_result.push(v[level]);
									}
								})
								_result = _result.distinct();
								_selData[level] = _result[0];
								return _result;
							}
							$.each(data.model.cols, function(k, v) {
								$('#Part_level_' + k).html('').data('level', k).select2({
									placeholder: "value",
									data: getNextData(_data, k, _selData[k]),
									tags: true,
									searchPlaceholder: 'search or input new'
								})
								$('#Part_level_' + k).change(function() {
									_selData[k] = $('#Part_level_' + k).val();
									for(var i = k; i < data.model.cols.length; i++) {
										$('#Part_level_' + (i + 1)).html('').select2({
											placeholder: "value",
											data: getNextData(_data, i + 1),
											tags: true,
											searchPlaceholder: 'search or input new'
										})
									}
								})
							})
						} else {
							var _html = '';
							$.each(data.model.cols, function(k, v) {
								_html += '<div class="item"><input type="text" class="filedName" value="' + v + '" disabled>' +
									'<label>=</label>' +
									'<input type="text" class="filedVal" placeholder="value" data-type="' + v + '"></div>'
							});
							$('#partitions').html(_html);
						}
						if(partitions) {
							var partObj = JSON.parse(partitions);
							for(k in partObj) {
								$('#partitions').find('[data-type="' + k + '"]').val(partObj[k]);
							}
						}
					}
				}
			})
		}*/
		/*//hdfs路径
		function getRoute(aroute) {
			$.ajax({
				url: 'hdfs/dir/list',
				data: {
					base: aroute
				},
				success: function(data) {
					if(data.code == 200) {
						var routes = data.model;
					}
				}
			})
			return routes;
		}

		$("body").on("dblclick", ".oneRoute", function() {
			var oneRoute = $(this).children(".thisRoute").html();
			$(".defaultRoute").val(oneRoute);
			return false;
		})
		$("body").on("click", ".turnOn", function() {
			var $this = $(this);
			setTimeout(function() {
				$this.hide().siblings(".turnOff").show();
				$this.parent().siblings(".allMeun").remove();
			}, 300)
		})
		$("body").on("click", ".turnOff", function() {
			var $this = $(this);
			var aRoute = $(this).siblings(".thisRoute").html();
			var preIndent = parseInt($(this).parent().parent().css("text-indent"));
			$.ajax({
				url: 'hdfs/dir/list',
				data: {
					base: aRoute
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
								var $li = $("<li class='newRoute'><h3 class='oneRoute'><img class='turnOn' src='resources/images/routeOn.png'/><img class='turnOff' src='resources/images/routeOff.png'/><span class='thisRoute'>" + routes[r] + "</span></h3></li>");
								$li.css("text-indent", currentIndent + 'px');
								$ul.append($li);
							}
							if($li && $li.length > 0 && $this.parent().siblings().length < 1) {
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
							$this.hide();
							$this.siblings(".turnOn").hide();
						}
					}
				}
			})
		})
		$(".closeMap").click(function() {
			$(".sqlSentence").empty();
			$(".maskCell").hide();
			$(".contentBox").hide();
		})
		$(".copyNameBtn").attr("disabled", false);
		$(".copyNameBtn").click(function() {
			var status = $(this).prop("checked");
			if(status) {
				$(this).parent("label").removeClass("copyNoCheck").addClass("copyOk");
				$("#copyName").prop("disabled", false);
			} else {
				$(this).parent("label").addClass("copyNoCheck").removeClass("copyOk");
				$("#copyName").prop("disabled", true);
			}
		})
		$(".cancelKeep").click(function() {
				$(".sqlSentence").empty();
				$(".maskCell").hide();
				$(".contentBox").hide();
			})*/
			//单独配置时，

		/*//获取psrtition数据
		function getPartition() {
			var partitions = $('#partitions .item .filedVal') || $('#partitions .item select');

			var partitionItems = [];
			for(var i = 0, length = partitions.length; i < length; i++) {
				var partitionJson = {};
				partitionJson.field = partitions.eq(i).attr('data-type');
				partitionJson.value = partitions.eq(i).val().trim();
				partitionItems.push(partitionJson);
			}
			partitionItems = JSON.stringify(partitionItems);
			return partitionItems;
		}*/

		function tabStatus() {//批量时划分出新表和旧表	
			$(".oneDbName").each(function() {
				var allDb = $("#dbName option:selected").text();
				$(this).html(allDb);
			})
			var currentCatalog = dbCatalog[$("#dbName").val()];
			var currentSchema = dbSchemas[$("#dbName").val()];
			var currentdbId = 1;
			creatDdl = [];
			haveTab = [];
			$(".targetTab").each(function(index, e) { //划分出新表和旧表
				var $tabThis = $(this),
					tabIndex = index;
				var flag = false;
				$("#tableName option").each(function() {
					if($tabThis.html() == $(this).text()) {
						var hasTab = {};
						hasTab.tableName = $tabThis.html();
						hasTab.name = $("#dbName option:selected").text();
						hasTab.catalog = $(this).attr("catalog");
						hasTab.schema = $(this).attr("schema");
						hasTab.partition = getPartition();
						$tabThis.attr("status", "old");
						haveTab.push(hasTab); //得到已存在表的任务信息
						flag = true;
					}
				})
				if(!flag) {
					var oneTMsg = {};
					oneTMsg.index = tabIndex;
					oneTMsg.dbId = 1;
					oneTMsg.catalog = dbCatalog[$("#dbName").val()];
					oneTMsg.schema = dbSchemas[$("#dbName").val()];
					oneTMsg.cols = $tabThis.parent().parent().attr("cols");
					oneTMsg.colSep = $tabThis.parent().parent().attr("columnsep");
					oneTMsg.tabName = $tabThis.html();
					oneTMsg.dbName = $("#dbName option:selected").text();
					$tabThis.attr("status", "new");
					creatDdl.push(oneTMsg); //得到批量获取ddl的数据
				}

			});
		}

		/*function getHdfs() {//批量时获取hdfs路径并填充到页面
			if($(".defaultRoute").val()) {
				var allHdfs = $(".defaultRoute").val();
				var failFile = [];
				$(".hdfsMap").each(function() {
					var html = $(this).siblings(".hdfs").children(".parseName").html();
					html = allHdfs + '/' + html;
					$(this).html(html);
					$.ajax({
						url: 'hdfs/file/exist',
						data: {
							fileName: html
						},
						success: function(data) {
							if(data.code == 200) {
								failFile.push(data.model);
							}
						}
					})
				})
				if(failFile.length > 0) {
					swal("ERROR", "有已存在的路径，请单独配置", "error");
				}
				$(".hdfsMap").each(function() {
					var html = $(this).html();
					for(var h = 0; h < failFile.length; h++) {
						if(html == failFile[h]) {
							$(this).html("");
						}
					}
				})
				$(".maskCell").hide();
				$(".contentBox").hide();
				$(".defaultRoute").val('');
			} else {
				swal("ERROR", "请选择要上传的路径", "error");
			}
		}*/
		function ddlChange(){//判断库名更改后去除页面tab的ddl绑定
			var choiceDb=$("#dbName option:selected").text();
			var dFlag=false;
			for(var a=0;a<aLDbName.length;a++){
				if(choiceDb!==aLDbName[a]){
					dFlag=true;
				}
			}
			if(dFlag){
				$(".targetTab").each(function(){
					$(this).attr("ddl","");
				})
			}
		}
		/*$("#tableName").change(function(){
			if($("#tableName option:selected").attr("data-select2-tag")){
				var tableName=$("#tableName option:selected").text()
				newSql(1, dbCatalog[$("#dbName").val()], dbSchemas[$("#dbName").val()], tableName, onecols, onecolSep);
			}
			
		})*/
		/*$(".keep").click(function() {
				if($(this).attr("field") == "all") {
					if($("#uploadSite").val() == 1) {
						tabStatus(); //划分出新表和旧表
						ddlChange();//判断库名更改后去除页面tab的ddl绑定
						$(".maskCell").hide();
						$(".contentBox").hide();
					} else {
						getHdfs();//获取hdfs路径并填充到页面
					}
				} else {
					if($("#uploadSite").val() == 1) {
						var aDbName = $("#dbName option:selected").text();
						var aTable = $("#tableName option:selected").text();
						var dataNum = $(this).attr("num");
						$(".newTr").each(function() { //遍历判断，定义新旧并填值到tab
							$this = $(this);
							if($(this).attr("field") == dataNum) {
								var same = 0;
								$(".targetTab").each(function() {
									if($(this).html() == aTable && $(this).parent().siblings(".oneDbName").html() == aDbName) {
										same++;
									}
								})
								if(same > 1) {
									sawl("ERROR", "任务队列中存在重名", "error");
								} else {
									$this.children(".oneDbName").html(aDbName);
									$this.children(".map").children(".targetTab").html(aTable);
									if(singleDb == aDbName && singleTab == aTable) {
										if($("#tableName option:selected").attr("identify") || $("#tableName option:selected").attr("data-select2-tag")) {
											$(this).children(".map").children(".targetTab").attr("status", "new");
										} else {
											$(this).children(".map").children(".targetTab").attr("status", "old");
										}
									} else {
										if($("#tableName option:selected").attr("identify") || $("#tableName option:selected").attr("data-select2-tag")) {
											$(this).children(".map").children(".targetTab").attr("status", "new");

											//保存自定义ddl
											if($(".sqlWrite").length > 0 && $(".sqlWrite").val()) {
												var mapSql = '';
												$(".sqlWrite").each(function() {
													mapSql += $(this).val();
												})
												$(this).children(".map").children(".targetTab").attr("ddl", mapSql);
											}
											//将新表ddl创建信息保存起来，并替换掉之前的保存数据，之前队列没有的进行添加***
											var newMsg = {};
											newMsg.dbId = 1;
											newMsg.catalog = dbCatalog[$("#dbName").val()];
											newMsg.schema = dbSchemas[$("#dbName").val()];
											newMsg.tabName = aTable;
											newMsg.cols = singleCols;
											newMsg.colSep = singleColSep;
											newMsg.dbName = $("#dbName option:selected").text();
											creatDdl.push(newMsg); //添加
											//删除:
											var delNum = 0;
											for(var d = 0; d < creatDdl.length; d++) {
												if(creatDdl[d].dbName == singleDb && creatDdl[d].tabName == singleTab) {
													delNum = d;
												}
											}
											creatDdl.slice(delNum, 1);

										} else {
											$(this).children(".map").children(".targetTab").attr("status", "old");
											//将已存在表的catalog和schema、tableName、partition保存起来并替换掉之前保存数据，，之前队列没有的进行添加***
											var hasMsg = {};
											hasMsg.catalog = $("#tableName option:selected").attr("catalog");
											hasMsg.schema = $("#tableName option:selected").attr("schema");
											hasMsg.tableName = aTable;
											hasMsg.name = aDbName;
											hasMsg.partition = getPartition();
											haveTab.push(hasMsg);
											var dIndex = 0;
											for(var h = 0; h < haveTab.length; h++) {
												if(haveTab[h].name == singleDb && haveTab[h].tableName == singleTab) {
													dIndex = h;
												}
											}
											haveTab.slice(dIndex, 1);
										}
									}
									singleCols = '';
									singleColSep = '';
									singleDb = '';
									singleTab = '';
								}

							}
						})
						$(".sqlSentence").empty();
						$(".maskCell").hide();
						$(".contentBox").hide();
					} else {
						if($(".defaultRoute").val() && $(".suffixRoute").val()) {
							var dataNum = $(this).attr("num");
							var fileName = $(".defaultRoute").val() + '/' + $(".suffixRoute").val();
							var vFlag = false;
							$.ajax({
								url: 'hdfs/file/exist',
								data: {
									fileName: fileName
								},
								success: function(data) {
									if(data.code == 200) {
										vFlag = true;
									}
								}
							})
							if(vFlag) {
								swal("ERROR", "该路径已存在请重新配置", "error");
							} else {
								$(".newTr").each(function() {
									if($(this).attr("field") == dataNum) {
										$(this).children(".hdfsMap").html(fileName);
									}
								})
								$(".maskCell").hide();
								$(".contentBox").hide();
								$(".defaultRoute").val('');
								$(".suffixRoute").val('');
							}
						} else {
							swal("ERROR", "请选择要上传的路径", "error");
						}
					}
				}
			})*/
			/*//sql语句编辑：
		$("body").on("keydown", ".sqlWrite", function(e) {
			if(e.keyCode == 13) {
				if($(this).val()) {
					var num = parseInt($(this).siblings(".lineIndex").html()) + 1;
					var newLine = '<p class="oneLineSql"><input  type="text" class="sqlWrite"/><span class="lineIndex">' + num + '</span></p>';
					$(this).parent().after(newLine);
					$(this).parent().next().children(".sqlWrite").focus();
					var newIndex = 0;
					$(".lineIndex").each(function() {
						newIndex++;
						$(this).html(newIndex);
					})
				} else {
					swal("ERROR", "请输入需要编辑的sql语句", "error");
				}
			}
		})
		$("body").on("keydown", ".sqlWrite", function(e) {
			if(e.keyCode == 8) {
				if($(this).val() == "") {
					e.preventDefault();
					$(this).parent().prev().children(".sqlWrite").focus();
					$(this).parent().remove();
					var newIndex = 0;
					$(".lineIndex").each(function() {
						newIndex++;
						$(this).html(newIndex);
					})
				}
			}
		})*/

		//库、表、分区
		$("#dbName").change(function() {
				var dbName = $(this).val();
				getTables(dbName);
			})
			/*//批量配置
		function alHiveCell() {
			$(".maskCell").show();
			$(".contentBox").show();
			$(".keep").attr("field", "all");
			$(".hiveWrite").show();
			$(".fieldMap").show();
			$('.routeMapHeader').show();
			$(".hiveCloseMap").hide();
			$(".hdfsWrite").hide();
			$(".routeShow").hide();
			$('.mapRouteTit').removeClass("clsPadding");
			$(".tabMsg").hide();
			$('.tab').hide();
			$(".fieldMap").hide();
			getDB();
			setTimeout(function() {
				getTables();
				$(".delayTip").hide();
			}, 2000);
		}

		function alHdfsCell() {
			$(".maskCell").show();
			$(".contentBox").show();
			$(".keep").attr("field", "all");
			$(".hiveWrite").hide();
			$(".fieldMap").hide();
			$('.routeMapHeader').hide();
			$(".hiveCloseMap").show();
			$('.mapRouteTit').addClass("clsPadding");
			$(".hdfsWrite").show();
			$(".hdfsRoute").val("");
			$(".routeShow").show();
			$(".suffixShow").hide();
		}
		function dbNameGet(){
			var nFlag=false;
			$(".oneDbName").each(function(){
				if($(this).html()){
					nFlag=true;
				}
			})
			if(nFlag){
				$(".oneDbName").each(function(){
					aLDbName.push($(this).html());
				})
			}
		}
		$(".allConfigure").click(function() {
			if($(".addContentZone").children().length == 0) {
				swal("ERROR", "无配置任务，请添加", "error");
			} else {
				if($("#uploadSite").val() == 1) {
					dbNameGet();//记录当前页面所有dbName
					var obj = {}; //验证重名
					$(".targetTab").each(function() {
						var item = $(this).html();
						if(obj[item] == null) {
							obj[item] = 1;
						} else {
							obj[item] = 2;
						}
					})
					var b = 0;
					for(a in obj) {
						b++
					}
					if(b < $(".targetTab").length) {
						swal("error", "目标表名存在重名，请修改后进行批量配置", "error");
					} else {
						alHiveCell(); //弹出层
					}
				} else {
					alHdfsCell(); //弹出层
				}
			}
		})*/

		/*//单个配置
		$("body").on("click", ".oneConfigure", function() {
			$(".maskCell").show();
			$(".contentBox").show();
			var dataNum = $(this).parent().parent().attr("field");
			$(".keep").attr("num", dataNum);
			$(".keep").attr("field", "one");
			if($("#uploadSite").val() == 1) {
				$(".hiveWrite").show();
				$(".fieldMap").show();
				$(".hdfsWrite").hide();
				$(".mapRouteTit").hide();
				$(".routeShow").hide();
				tabName = $(this).parent().parent().children(".map").children(".targetTab").html();
				onecols = $(this).parent().parent().attr("cols");
				onecolSep = $(this).parent().parent().attr("colSep");
				if($(this).parent().siblings(".oneDbName").html()) {
					var dbName = $(this).parent().parent().children(".oneDbName").html();
					$("#dbName option").each(function() {
						if($(this).text() == dbName) {
							$(this).selected;
						}
					})
					getTables();
				} else {
					getDB('one');
				}
				//判断是否配置过，再判断是否是新建
				singleDb = $(this).parent().siblings(".oneDbName").html();
				singleTab = $(this).parent().siblings(".map").children(".targetTab").html();
				singleCols = $(this).parent().parent().attr("cols");
				singleColSep = $(this).parent().parent().attr("columnsep");

				if($(this).parent().siblings(".oneDbName").html()) {
					if($(this).parent().siblings(".map").children(".targetTab").attr("status") == "new") {

					} else {

					}
				} else {

				}
			} else {
				$(".hiveWrite").hide();
				$(".fieldMap").hide();
				$(".hdfsWrite").show();
				$(".suffixShow").show();
				var hdfsRoute = $(this).parent().siblings(".hdfsMap").html();
				var theFile = reg(hdfsRoute);
				var defaultRoute = hdfsRoute.replace('/' + theFile, '');
				$(".defaultRoute").val(defaultRoute);
				$(".suffixRoute").val(theFile);
			}
		})*/

		/*$(".startImport").click(function() {
			if(creatDdl.length > 0) {
				$(".maskCell").show();
				$(".createTabTip").show();
				$(".createTabTip .newSuccess").hide();
				$(".createTabTip .newFail").hide();
			}
		})
		$(".cancelnewTab").click(function() {
			$(".maskCell").show();
			$(".createTabTip").hide();
		})*/
		var flag = true,
			failNew = [],
			succNew = [];

		/*function createTabs(n, ddl, catalog, schemal, tableName, dbName) {
			$.ajax({
				url: 'db/table/create',
				type: "post",
				data: {
					dbId: 1,
					ddl: ddl,
					catalog: catalog,
					schemal: schemal,
					tableName: tableName
				},
				success: function(data) {
					if(data.code == 200) {
						var success = {};
						success.name = dbName;
						success.tableName = data.model.name;
						success.catalog = data.model.catalog;
						success.schemal = data.model.schemal;
						success.partition = [];
						succNew.push(success);

					} else if(data.code == 0) {
						flag = false;
						failNew.push(n);
						swal("ERROR", data.msg + "建表失败请重新配置", "error");
					}
				}
			})
		}*/

		/*//批量创建时批量获取ddl
		function ddlBatch(dbId, catalog, schema, tableName, cols, colSep, db, tab) {

			$.ajax({
				url: 'db/table/ddl/cols',
				data: {
					dbId: dbId,
					catalog: catalog,
					schema: schema,
					tableName: tableName,
					cols: cols,
					colSep: colSep
				},
				success: function(data) {
					if(data.code == 200) {
						var one = {};
						one.db = db;
						one.tab = tab;
						one.catalog = catalog;
						one.schema = schema;
						one.tableName = tableName;
						one.val = data.model;
						ddls.push(one);

					}
				}
			})
		}*/
		/*$(".nextNewTab").click(function() {
			//批量创建ddl:
			if(creatDdl.length > 0) {
				for(var d = 0; d < creatDdl.length; d++) {
					ddlBatch(creatDdl[d].dbId, creatDdl[d].catalog, creatDdl[d].schema, creatDdl[d].tabName, creatDdl[d].index, creatDdl[d].cols, creatDdl[d].colSep, creatDdl[d].dbName, creatDdl[d].tabName);
				}
			}
			setTimeout(function() {
				//添加用户自定义ddl:
				$(".targetTab").each(function() {
						if($(this).attr("ddl")) {
							var db = $(this).parent().siblings(".oneDbName").html(),
								tab = $(this).html(),
								aDdl = $(this).attr("ddl"),
								dNum = 0;
							for(var c = 0; c < ddls.length; c++) {
								if(ddls[c].db == db && ddls[c].tab == tab) {
									dNum = c;
								}
							}
							ddls[dNum].val = aDdl;
						}
					})
					//批量建表：
				for(var n = 0; n < ddls.length; n++) {
					createTabs(n, ddls[n].val, ddls[n].catalog, ddls[n].schemal, ddls[n].tableName, ddls[n].db);
				}
				if(failNew.length > 0) { //扩充失败提醒
					$(".maskCell").show();
					$(".createTabTip").show();
					$(".createTabTip .tipCon").hide();
					$(".createTabTip .bBtnZone").hide();
					$(".createTabTip .newFail").show();
					$(".createTabTip .newSuccess").hide();
				} else {
					ddls = [];
					$(".maskCell").show();
					$(".createTabTip").show();
					$(".createTabTip .tipCon").hide();
					$(".createTabTip .bBtnZone").hide();
					$(".createTabTip .newFail").hide();
					$(".createTabTip .newSuccess").show();
				}
			}, 2000)
		})*/
		/*$(".createCancel").click(function() {
			$(".maskCell").hide();
			$(".createTabTip").hide();
		})*/

		function taskStart(jobName, note, toType, isBak, bakDir, fromJson, toHiveJson) {
			$.ajax({
				url: 'job/dump/save',
				type: 'post',
				data: {
					jobName: jobName,
					note: note,
					toType: toType,
					isBak: isBak,
					bakDir: bakDir,
					fromJson: fromJson,
					toHiveJson: toHiveJson
				},
				success: function(data) {
					if(data.code == 200) {
						swal("INFO", "任务创建成功", "info");
						$(".maskCell").hide();
						$(".createTabTip").hide();
					} else {
						swal("error", "任务导入失败：" + data.msg, "error");
					}
				}
			})
		}

		$(".startManage").click(function() { //dump save开始任务执行
			var fromJson = [];
			var mapArr = [];
			$(".targetTab").each(function() { //由上到下组合fromJson,及toJson的顺序参照数组
					var oneJson = {},
						mapJson = {};
					oneJson.srcPath = $(this).parent().parent().attr("srcPath");
					oneJson.filePath = $(this).parent().parent().attr("filePath");
					oneJson.tableName = $(this).parent().parent().attr("tabName");
					oneJson.columnSep = $(this).parent().parent().attr("columnSep");
					mapJson.dbName = $(this).parent().siblings(".oneDbName").html();
					mapJson.tabName = $(this).html();
					fromJson.push(oneJson);
					mapArr.push(mapJson);
				})
				//遍历参照数据排序：
			var toJson = succNew.concat(haveTab);

			var toHiveJson = [];
			for(var m = 0; m < mapArr.length; m++) {
				for(var s = 0; s < toJson.length; s++) {
					if(toJson[s].name == mapArr[m].dbName && toJson[s].tableName == mapArr[m].tabName) {
						toHiveJson.push(toJson[s]);
					}
				}
			}
			var jobName = $("#dTaskName").val(),
				note = $(".taskDescribe").val(),
				toType = "HIVE",
				isBak = false,
				bakDir = "",
				fromJson = JSON.stringify(fromJson),
				toHiveJson = JSON.stringify(toHiveJson);
			if($(".copyNameBtn").prop("checked")) {
				isBak = true;
				bakDir = ("#copyName").val();
			}
			//执行任务：
			taskStart(jobName, note, toType, isBak, bakDir, fromJson, toHiveJson);

		})
	}

	function init() {
		eventBind();
	}
	init();
})