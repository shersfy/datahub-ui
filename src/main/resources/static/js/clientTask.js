$(function() {
		function GetRequest() {
			var url = location.search; //获取url中"?"符后的字串   
			var theRequest = new Object();
			if(url.indexOf("?") != -1) {
				var str = url.substr(1),
				    strs = str.split("&");
				for(var i = 0; i < strs.length; i++) {
					theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
				}
			}
			return theRequest;
		}
        var editor = CodeMirror.fromTextArea($('.new-sql textarea')[0], {
            lineNumbers: true
        });

		//调度全局变量
		var tmpParam = {
            tableType: 0,
            cronGlobalParam: {}
        };
        $.extend(globalParam, tmpParam);

		var taskList = {};
		taskList.hiveTable='';
		taskList.partitions='';
		var publicFn={
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
		//task数据打包：
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
		}
		var dpt = {};
		function dataPacket() {
			dpt.taskName = $("#taskName").val();
			dpt.taskDes = $(".tastDes").val();
			dpt.myClientId = GetRequest().clientId;
			dpt.autoCompressToGz = false;
			dpt.srcPath = $("#fileRouteMsg").val();
			dpt.bakDump = false;
			dpt.dumpBakName = "";
            dpt.srcColumnSep = $('.columnSep .val').attr('data-val');
			if ( $(".configTask .bCheckType.boxCheck").length == 1 ) {
				dpt.isSubdirSupport = true;
			} else {
				dpt.isSubdirSupport = false;
			}
			if( $(".fileFilterType .radio.cur").attr('data-val') == 1 ) {
                var fileType = $(".multipleSelect").val() || [];
                $(".addFileFilter").val().trim() ? fileType.push( $(".addFileFilter").val().trim() ) : '';
                fileType = fileType.join(',');
                if ( !fileType ){
                    MsgTip('info', common_js_lang['client.info.filterType']);
                    return ;
                }
                var type = $("#fileTypeChoice").val();
                dpt.ignorePattern = type == 1 ? fileType : '' ;
                dpt.matchPattern = type == 0 ? fileType : '';
			}
            else {
				dpt.matchPattern = "";
				dpt.ignorePattern = "";
			}

            var setType = $('.configTask .line .radio.cur').attr('data-val');

			if( setType == 0 ) {
				dpt.finishActionType = 0;
				dpt.finishActionParam = "";
			} else if( setType == 1 ) {
				dpt.finishActionType = 1;
				dpt.finishActionParam = $("#suffixContent").val();
			} else if( setType == 2 ) {
				dpt.finishActionType = 2;
				dpt.finishActionParam = $("#moveSite").val();
			}

			if($(".fileRouteChoice").val() == globalParam.commonLinkType.hdfs) {
				dpt.hdfsDir = $(".desDirHdfs").val();
				dpt.dbName = "";
				dpt.tblName = "";
				dpt.partitions = "";
			} else {
				dpt.hdfsDir = "";
				dpt.dbName = $("#dbName option:selected").text();
				dpt.tblName = $("#tableName option:selected").text();
                dpt.tableType = globalParam.tableType;
				dpt.partitions = getPartition();
			}
            dpt.overwrite = false;
            dpt.periodType = globalParam.cronGlobalParam.periodType;
            dpt.cronExpression = globalParam.cronGlobalParam.cronParam;
            dpt.startTimeStr = globalParam.cronGlobalParam.startTimeStr || '';
            dpt.endTimeStr = globalParam.cronGlobalParam.endTimeStr || '';
			return dpt;
		}
		//任务提交：
		function taskAddH() {
			dataPacket();
			$.ajax({
				url: "online/client/job/save",
				type: "post",
				data: {
					hid:$('.connId').val(),
					toType:8,
                    pid: $('#userApp').val(),
                    startTimeStr: dpt.startTimeStr,
					endTimeStr: dpt.endTimeStr,
					myClientId: dpt.myClientId,
					srcPath: dpt.srcPath,
					subdirSupport: dpt.isSubdirSupport,
					autoCompressToGz: dpt.autoCompressToGz,
					matchPattern: dpt.matchPattern,
					ignorePattern: dpt.ignorePattern,
					hdfsDir: dpt.hdfsDir,
					dbName: dpt.dbName,
					tblName: dpt.tblName,
					overwrite: dpt.overwrite,
					partitions: dpt.partitions,
					cronExpression: dpt.cronExpression,
					periodType: dpt.periodType,
					bakDump: dpt.bakDump,
					dumpBakName: dpt.dumpBakName,
					finishActionType: dpt.finishActionType,
					finishActionParam: dpt.finishActionParam,
					taskName: dpt.taskName,
					note: dpt.taskDes,
                    tableType: dpt.tableType
				},
				beforeSend: function() {
					$(".delayTip").show();
				},
				success: function(data) {
					if(data.code == -1) {
						publicFn.ajaxFail();
					} else if(data.code == 200) {
                        window.onbeforeunload = function(){return} ;
                        $(".maskCell").show();
						$(".contentBox").show();
						//location.href="./clientManage?id="+GetRequest().clientId;
					} else {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					}
				},
				complete: function() {
					$(".delayTip").hide();
				}
			})
		}
		function taskAddD() {
			dataPacket();
			$.ajax({
				url: "online/client/job/save",
				type: "post",
				data: {
					dbId:$('.connId').val(),
                    srcColumnSep: dpt.srcColumnSep,
					toType: $('.fileRouteChoice').val() == globalParam.commonLinkType.hive ? 9 : 13,
                    pid: $('#userApp').val(),
                    startTimeStr: dpt.startTimeStr,
					endTimeStr: dpt.endTimeStr,
					myClientId: dpt.myClientId,
					srcPath: dpt.srcPath,
					subdirSupport: dpt.isSubdirSupport,
					autoCompressToGz: dpt.autoCompressToGz,
					matchPattern: dpt.matchPattern,
					ignorePattern: dpt.ignorePattern,
					hdfsDir: dpt.hdfsDir,
					dbName: dpt.dbName,
					tblName: dpt.tblName,
					overwrite: dpt.overwrite,
					partitions: dpt.partitions,
					cronExpression: dpt.cronExpression,
					periodType: dpt.periodType,
					bakDump: dpt.bakDump,
					dumpBakName: dpt.dumpBakName,
					finishActionType: dpt.finishActionType,
					finishActionParam: dpt.finishActionParam,
					taskName: dpt.taskName,
					note: dpt.taskDes,
                    tableType: dpt.tableType
                },
				beforeSend: function() {
					$(".delayTip").show();
				},
				success: function(data) {
					if(data.code == -1) {
						publicFn.ajaxFail();
					} else if(data.code == 200) {
                        window.onbeforeunload = function(){return} ;
                        $(".maskCell").show();
						$(".contentBox").show();
						//location.href="./clientManage?id="+GetRequest().clientId;
					} else {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					}
				},
				complete: function() {
					$(".delayTip").hide();
				}
			})
		}
		//任务编辑
		function taskUpdataH() {
			dataPacket();
			var jobId=GetRequest().jobId;
			$.ajax({
				url: "online/client/job/save",
				type: "post",
				data: {
					jobId:jobId,
					hid:$('.connId').val(),
                    pid: $('#userApp').val(),
					toType:8,
					startTimeStr: dpt.startTimeStr,
					endTimeStr: dpt.endTimeStr,
					myClientId: dpt.myClientId,
					srcPath: dpt.srcPath,
					subdirSupport: dpt.isSubdirSupport,
					autoCompressToGz: dpt.autoCompressToGz,
					matchPattern: dpt.matchPattern,
					ignorePattern: dpt.ignorePattern,
					hdfsDir: dpt.hdfsDir,
					dbName: dpt.dbName,
					tblName: dpt.tblName,
					overwrite: dpt.overwrite,
					partitions: dpt.partitions,
					cronExpression: dpt.cronExpression,
					periodType: dpt.periodType,
					bakDump: dpt.bakDump,
					dumpBakName: dpt.dumpBakName,
					finishActionType: dpt.finishActionType,
					finishActionParam: dpt.finishActionParam,
					taskName: dpt.taskName,
					note: dpt.taskDes,
                    tableType: dpt.tableType
                },
				success: function(data) {
					if(data.code == -1) {
						publicFn.ajaxFail();
					} else if(data.code == 200) {
                        window.onbeforeunload = function(){return} ;
                        $(".maskCell").show();
						$(".contentBox").show();
					} else {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					}
				}
			})
		}
		function taskUpdataD() {
			dataPacket();
			var jobId=GetRequest().jobId;
			$.ajax({
				url: "online/client/job/save",
				type: "post",
				data: {
					jobId:jobId,
					dbId:$('.connId').val(),
                    srcColumnSep: dpt.srcColumnSep,
                    pid: $('#userApp').val(),
                    toType: $('.fileRouteChoice').val() == globalParam.commonLinkType.hive ? 9 : 13,
					startTimeStr: dpt.startTimeStr,
					endTimeStr: dpt.endTimeStr,
					myClientId: dpt.myClientId,
					srcPath: dpt.srcPath,
					subdirSupport: dpt.isSubdirSupport,
					autoCompressToGz: dpt.autoCompressToGz,
					matchPattern: dpt.matchPattern,
					ignorePattern: dpt.ignorePattern,
					hdfsDir: dpt.hdfsDir,
					dbName: dpt.dbName,
					tblName: dpt.tblName,
					overwrite: dpt.overwrite,
					partitions: dpt.partitions,
					cronExpression: dpt.cronExpression,
					periodType: dpt.periodType,
					bakDump: dpt.bakDump,
					dumpBakName: dpt.dumpBakName,
					finishActionType: dpt.finishActionType,
					finishActionParam: dpt.finishActionParam,
					taskName: dpt.taskName,
					note: dpt.taskDes,
                    tableType: dpt.tableType
                },
				success: function(data) {
					if(data.code == -1) {
						publicFn.ajaxFail();
					} else if(data.code == 200) {
                        window.onbeforeunload = function(){return} ;
                        $(".maskCell").show();
						$(".contentBox").show();
					} else {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					}
				}
			})
		}

		//任务编辑信息填充：
		function taskMsg(taskId) {
			$.ajax({
				url: 'online/client/job/detail',
				data: {
					jobId: taskId
				},
				async: false,
				success: function(data) {
					if(data.code == -1) {
						publicFn.ajaxFail();
					} else if(data.code !== 200) {
						MsgTip("", common_js_lang['client.info.getDataErr'], "info");
					} else {
                        $('#userApp').val( data.model.pid ).select2();

                        if ( GetRequest().copy ) {
                            data.model.jobName = (data.model.jobName+'_copy').slice(0,60);
                        }
                        $("#taskName").val(data.model.jobName).attr('title', GetRequest().detail == 1? data.model.jobName : '');
                        $(".tastDes").val(data.model.note || '');

						$("#fileRouteMsg").val(data.model.clientParams.srcPath);

						if(data.model.clientParams.isSubdirSupport) {
                            $(".configTask .bCheckType").addClass('boxCheck');
						}

						if( data.model.clientParams.matchPattern || data.model.clientParams.ignorePattern ) {
                            $('.fileFilterType .radio').removeClass('cur').eq(1).addClass('cur');
                            $('.configTask .filter').show();
                            $(".multipleSelect").select2({tags:true,placeholder: common_js_lang['client.info.fileType']});

                            var patArr = [];
                            var initArr = ['.+\\.txt', '.+\\.csv', '.+\\.sql', '.+\\.xls', '.+\\.xlsx'];

							if(data.model.clientParams.matchPattern) {
								patArr = data.model.clientParams.matchPattern.split(",");
								$("#fileTypeChoice").val(0);
							}
                            else {
								patArr = data.model.clientParams.ignorePattern.split(",");
								$("#fileTypeChoice").val(1);
							}

                            var defArr = [];
                            var selfArr = [];
							for(var p = 0; p < patArr.length; p++) {
								if ( initArr.indexOf(patArr[p]) > -1 ){
                                    defArr.push( patArr[p] );
                                }
                                else {
                                    selfArr.push( patArr[p] );
                                }
							}

							if (selfArr.length > 0) {
                                $(".addFileFilter").val(selfArr.join("|"));
							}

							if (defArr.length > 0) {
								$(".multipleSelect").val(defArr).change(); //渲染select2s
							}

						}
						if(data.model.clientParams.finishActionType == 0) {

						} else if(data.model.clientParams.finishActionType == 1) {
							$('.choiceTypeTip .line .radio').removeClass('cur').eq(0).addClass('cur');
							$("#suffixContent").prop("disabled", false).val(data.model.clientParams.finishActionParam);
						} else {
                            $('.choiceTypeTip .line .radio').removeClass('cur').eq(1).addClass('cur');
							$("#moveSite").prop("disabled", false).val(data.model.clientParams.finishActionParam);
						}

						if(data.model.clientParams.hdfsDir) {
							$(".fileRouteChoice").val(globalParam.commonLinkType.hdfs );
							getConnect(data.model.clientParams.hid);
							dirInit(data.model.clientParams.hid);
							$(".desDirHdfs").val(data.model.clientParams.hdfsDir);
						}
                        else {
                            data.model.toType == 9 ? $(".fileRouteChoice").val(globalParam.commonLinkType.hive) : $(".fileRouteChoice").val(globalParam.commonLinkType.spark);
							$(".hdfsChoice").hide();
							$(".dbChoice, .colSepRow").show();
							$(".dataTab, .new-sql").show();
							$(".sameNameZone, .formatType").show();
							taskList.hiveTable = data.model.clientParams.tblName;
							taskList.partitions = data.model.clientParams.partitions;
							if ( taskList.partitions ){
								var partArr = taskList.partitions.split(','),
									partObj = {} ;
								partArr.map(function(v){
									var tmpArr = v.split('=');
									partObj[tmpArr[0]] = tmpArr[1].replace(/^\'|\'$/g, '') ;
								});
								taskList.partitions = JSON.stringify(partObj) ;
							}
							getConnect(data.model.clientParams.dbId);
							hiveId = data.model.clientParams.dbId;
							getDB(data.model.clientParams.dbName);

                            var columnSep = data.model.clientParams.srcColumnSep || '';
                            var dom = $('.replacementCon'),
                                items = dom.find('.item').removeClass('cur'),
                                text = columnSep,
                                tag = false;
                            for ( var i=0,len=items.length; i<len; i++ ){
                                if ( items.eq(i).attr('data-val') == columnSep ){
                                    text = items.eq(i).text();
                                    tag = true;
                                    break;
                                }
                            }
                            !tag ? (text = text.trim() === '' ? text.match(/\s/g).length+common_js_lang['db.text.space'] : text) : '';
                            dom.find('.val').text(text).attr({'data-val':columnSep, title:columnSep});
						}

						//if(!data.model.clientParams.overwrite) {
						//	$(".addBtn").prop("checked", true);
						//	$(".addLabel").addClass("radioOk").removeClass("radioNo");
						//	$(".coverBtn").prop("checked", false);
						//	$(".coverLabel").addClass("radioNo").removeClass("radioOk");
						//}
                        //else{
						//	$(".addBtn").prop("checked", false);
						//	$(".addLabel").removeClass("radioOk").addClass("radioNo");
						//	$(".coverBtn").prop("checked", true);
						//	$(".coverLabel").addClass("radioOk").removeClass("radioNo");
						//}

                        var iframeParam = {
                            cronParam: data.model.cronExpression,
                            startTime: data.model.startTime,
                            endTime: data.model.endTime
                        };
                        cronExport.resetCron(iframeParam);
					}
				}
			})
		}

		//获取库
		var hiveId=$('.connId').val();
		function getDB(hiveDb) {
            var timer = setTimeout(function(){
                $('.delayTip').show();
            }, 2000);
			$.ajax({
				url: 'db/dbs',
				data: {id: hiveId, pid:$('#userApp').val()},
				success: function(data) {
					if( data.code==200 ){
						//填充db信息
						var dbList = '';
						data.model.databases.map(function(v, i) {
							dbList += '<option catalog="' + v.catalog + '" schema="' + v.schema + '" value="' + v.dbName + '">' + v.dbName + '</option>';
						});
						$("#dbName").html(dbList);
                        if ( data.model.databases && data.model.databases.length <= 0 ){
                            MsgTip('info', common_js_lang['dump.info.dbNone']);
                        }

						if(hiveDb) {
							$('#dbName').val(hiveDb).select2();
							getTables(hiveDb,taskList.hiveTable);
						} else {
							$('#dbName').select2();
                            data.model.databases.length ? getTables(data.model.databases[0].dbName) : '';
						}
					}
                    else if(data.code == -1){
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
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					}
				},
				complete: function() {
                    clearTimeout(timer);
					$(".delayTip").hide();
				}
			})
		}
		//获取表：
		function getTables(dbName, hiveTable) {
			$.ajax({
				url: 'db/table/tbls',
				data: {
                    pid: $('#userApp').val(),
					dbId: hiveId,
					schema:$("#dbName option:selected").attr("schema"),
					catalog:$("#dbName option:selected").attr("catalog")
				},
				beforeSend: function() {
					$(".delayTip").show();
				},
				success: function(data) {
					if(data.code==200){
						$("#tableName").html("");
						if(data.model.length>0){
							var tableList = '';
							data.model.map(function(v) {
								tableList += '<option schema="'+v.schema+'" catalog="'+v.catalog+'">' + v.name + '</option>';
							});
							$("#tableName").html(tableList);
							var catalog=$("#tableName option:selected").attr("catalog"),
							schema=$("#tableName option:selected").attr("schema");
							if(hiveTable) {
								$('#tableName').val(hiveTable).select2();
								getPart(catalog,schema,hiveTable, taskList.partitions);
							} else {
								$('#tableName').select2();
								getPart(catalog,schema,data.model[0].name);
							}
                            var tableName = $('#tableName').val();
                            getDdl({catalog: catalog, schema: schema, tableName: tableName, pid:$('#userApp').val()});
						}
						else{
							MsgTip('info', common_js_lang['dump.info.dbNone']);
							//swal("","所选库的表数量为零","info");
						}
					}else if(data.code==-1){
						publicFn.ajaxFail();
					}else{
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					}
				},
				complete: function() {
					$(".delayTip").hide();
				}
			})
		}
		//分区
		function getPart(catalog,schema,tableName,partitions) {
			$.ajax({
				url: 'db/table/partitions',
				data:{dbId:hiveId,catalog:catalog,schema:schema,tableName:tableName},
				beforeSend: function() {
					$(".delayTip").show();
				},
				success: function(data) {
					$('#partitions').html('');
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }
					if(!data.model || data.model.length == 0) {
						$(".partitionZone").hide();
					}
                    else {
						$(".partitionZone").show();
                        data.model.map(function(v, i){
                            var _html = '';
                            _html += '<div class="item"><input type="text" class="filedName" value="' + v.name + '" disabled>' +
                            '<label>=</label>' +
                            '<select class="select2 filedVal selVal" data-type="' + v.name + '" id="Part_level_' + i + '">';
                            v.parts.map(function(vv){
                                _html += '<option value="'+vv.value+'" title="'+vv.name+'">'+vv.value+'</option>';
                            });
                            _html += globalParam.columnValOption+'</select></div>' ;
                            $('#partitions').append(_html);
                            $('#partitions #Part_level_'+i).select2({placeholder: "value",tags: true});
                        });
		
						if(partitions) {
							var partObj = JSON.parse(partitions);
							for(var k in partObj ) {
								if ( $('#partitions').find('[data-type="' + k + '"]').find('[value="'+partObj[k]+'"]').length == 1 )
									$('#partitions').find('[data-type="' + k + '"]').val(partObj[k]).trigger('change');
								else {
									$('#partitions').find('[data-type="' + k + '"]').prepend('<option value="'+partObj[k]+'">'+partObj[k]+'</option>').val(partObj[k]).trigger('change');
								}
							}
                            if ( isDetailStatus ){
                                $('#partitions select').prop('disabled', true);
                            }
						}
					}
				},
				complete: function(data) {
					$(".delayTip").hide();
					if ( data.responseJSON.code == -1 ){
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
        // 获取ddl
        function getDdl(param) {
            param.dbId = hiveId;
            $.ajax({
                url: 'db/table/ddl/show',
                data: param,
                success: function(data) {
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }

                    if ( data.mppTable && globalParam.targetType == globalParam.commonLinkType.hive ){
                        editor.doc.setValue('');
                        MsgTip('info', common_js_lang['db.tip.hivexspark']);
                        return ;
                    }
                    if ( !data.mppTable && globalParam.targetType == globalParam.commonLinkType.spark ){
                        editor.doc.setValue('');
                        MsgTip('info', common_js_lang['db.tip.sparkxhive']);
                        return ;
                    }

                    var formatVal = {
                        text: '0',
                        orc: '1',
                        parquet: '2',
                        rcfile: '3',
                        sequencefile: '4'
                    } ;
                    globalParam.tableType = formatVal[data.model.format];
                    $('.mapRouteMsg .tableType').val(globalParam.tableType);
                    editor.doc.setValue(data.model.ddl);
                    editor.doc.cm.setOption('readOnly', 'nocursor');
                    $('.new-sql .CodeMirror').addClass('disabled');
                }
            });
        }

		function eventBind() {

            function taskConfigModule(){
                this.container = $('.upload-tab.mapData');
                this.init();
                GetRequest().detail == 1 ? '' : this.event();
            }
            taskConfigModule.prototype = {
                init: function(){
                    var _this = this;
                    _this.container.find(".cancel").click(function() {
                        location.href = "./client.taskm?id="+GetRequest().clientId;
                    });
                    var fileTypes = ['.+\\.txt', '.+\\.csv', '.+\\.sql', '.+\\.xls', '.+\\.xlsx'];
                    _this.container.find(".multipleSelect").select2({
                        placeholder: common_js_lang['client.info.fileType'],
                        data: fileTypes,
                        tags: true
                    });
                    _this.container.find('.tooltip').tipsy({fade: true,gravity:'s'});

                    _this.container.find(".dataNextStep").click(function() {
                        var taskName = $('#taskName').val().trim();

                        if( taskName == "") {
                            MsgTip('', common_js_lang['local.info.taskNameNone'], 'info');
                            return ;
                        }

                        if ( !$("#fileRouteMsg").val() ){
                            MsgTip("", common_js_lang['client.info.fileSrc'], "info");
                            return ;
                        }

                        if ( $(".fileFilterType .radio.cur").attr("data-val") == 1 ){  //文件过滤
                            var filter = _this.container.find(".addFileFilter").val().trim();
                            if ( !$(".multipleSelect").val() && !filter ){
                                MsgTip("", common_js_lang['client.info.filterType'], "info");
                                return ;
                            }

                            if ( filter ){
                                try {
                                    new RegExp(filter);
                                } catch(e){
                                    MsgTip("", common_js_lang['client.info.regularErr'], "info");
                                    return ;
                                }
                            }
                        }

                        var fileType = _this.container.find(".line .radio.cur");
                        if ( fileType.length == 0 ){
                            MsgTip("", common_js_lang['client.info.upedDealType'], "info");
                            return ;
                        }

                        if ( fileType.find('input').length == 1 ){
                            if ( !fileType.find('input').val().trim() ){
                                MsgTip("", common_js_lang['client.info.upedDealType'], "info");
                                return ;
                            }
                        }

                        $(".mapData").hide().siblings(".mapRoute").show();
                        editor.refresh();
                    });

                },
                event: function(){
                    var _this = this;

                    _this.container.find('.bCheckType').on('click', function(){
                        $(this).toggleClass('boxCheck');
                    });

                    _this.container.find('.fileFilterType').on('click', '.radio', function(){
                        if ( $(this).hasClass('cur') )
                            return ;
                        $(this).addClass('cur').siblings('.radio').removeClass('cur');
                        if ( $(this).attr('data-val') == 1 ){
                            _this.container.find('.filter').show();
                            $(".multipleSelect").select2({tags:true,placeholder: common_js_lang['client.info.fileType']});
                        }
                        else {
                            _this.container.find('.filter').hide();
                        }
                    });

                    _this.container.find('.choiceTypeTip').on('click', '.line', function(){
                       if ( $(this).find('.radio.cur').length == 1 )
                           return false;
                        _this.container.find('.line .radio.cur').removeClass('cur').find('input').prop('disabled', true);
                        $(this).find('.radio').addClass('cur').find('input').prop('disabled', false);
                    });


                }
            };
            new taskConfigModule();

            function replaceComponentModule(param){
                param = param || {};
                this.container = param.container || $('body');
                GetRequest().detail == 1 ? this.container.find('.replacementCon').addClass('disabled') : this.event();
            }
            replaceComponentModule.prototype = {
                event: function(){
                    var _this = this;
                    _this.container.on('click', '.replacementCon .val',function(){
                        var replaceCon = $(this).parent();
                        if ( +replaceCon.attr('data-disabled') == 1 ){
                            return false;
                        }
                        if ( replaceCon.hasClass('show') ){
                            replaceCon.removeClass('show');
                        }
                        else{
                            var val = $(this).attr('data-val') || '';
                            var items = replaceCon.find('.item').removeClass('cur');
                            var tag = false;
                            for ( var i=0,len=items.length; i<len; i++ ){
                                if ( items.eq(i).attr('data-val') == val ){
                                    items.eq(i).addClass('cur');
                                    tag = true;
                                    break;
                                }
                            }
                            !tag ? replaceCon.find('.inputReplacement').val(val) : replaceCon.find('.inputReplacement').val('');
                            replaceCon.addClass('show');
                        }
                    });

                    _this.container.on('click', '.replacementCon .item', function(){
                        var text = $(this).text(),
                            val = $(this).attr('data-val') || '' ;
                        _this.replacementUpdateVal(text, val);
                        return false;
                    });

                    _this.container.on('click', '.replacementCon button', function(){
                        var input = $(this).siblings('.inputReplacement').val() || '';
                        if ( input.length <= 0 ) {    //列分隔符
                            MsgTip('', common_js_lang['csv.text.columnSep']);
                            return false;
                        }
                        var text = input === ''? common_js_lang['db.info.emptyString'] : input.trim() === '' ? input.match(/\s/g).length+common_js_lang['db.text.space'] : input ;
                        _this.replacementUpdateVal(text, input);
                        return false;
                    });

                    _this.container.on('keyup', '.replacementCon .inputReplacement', function(e){
                        if ( e.which == 13 ){
                            var input = e.target.value || '';
                            if ( input.length <= 0 ) {    //列分隔符
                                MsgTip('', common_js_lang['csv.text.columnSep']);
                                return false;
                            }
                            var text = input === ''? common_js_lang['db.info.emptyString'] : input.trim() === '' ? input.match(/\s/g).length+common_js_lang['db.text.space'] : input ;
                            _this.replacementUpdateVal(text, input);
                            return false;
                        }
                    });

                    $('body').on('click', function(e){
                        var self = _this.container.find('.replacementCon');
                        if ( self.hasClass('show') ){
                            if ( $(e.target).parents('.replacementCon').length != 1 && $(e.target).parent('.replacementCon').length != 1 && $(e.target) != self[0] ){
                                self.removeClass('show');
                            }
                        }
                    });
                },
                replacementUpdateVal: function(text, val){
                    var dom = this.container.find('.replacementCon');
                    dom.removeClass('show');
                    var items = dom.find('.item').removeClass('cur');
                    var tag = false;
                    for ( var i=0,len=items.length; i<len; i++ ){
                        if ( items.eq(i).attr('data-val') == val ){
                            text = items.eq(i).text();
                            tag = true;
                            break;
                        }
                    }
                    !tag ? (text = val.trim() === '' ? val.match(/\s/g).length+common_js_lang['db.text.space'] : text) : '';
                    dom.find('.val').text(text).attr({'data-val':val, title:val});
                }
            };
            var replaceComponent = new replaceComponentModule();


            $('.tooltip').tipsy({fade: true,gravity:'s'});

			$(".mapRouteNextStep").click(function() {
				if($(".fileRouteChoice").val() == globalParam.commonLinkType.hdfs) {
					if(!$(".desDirHdfs").val()) {
						MsgTip("", common_js_lang['client.info.hdfsTarPath'], "info");
					} else {
                        if ( GetRequest().jobId && !GetRequest().detail ){
                            $.ajax({
                                url: 'hdfs/dir/access',
                                data: {hdfsId: $('.connId').val(), dir:$(".desDirHdfs").val(), pid:$('#userApp').val()},
                                success:function(data){
                                    if ( data.code != 200 ){
                                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                                        return ;
                                    }
                                    $(".mapRoute").hide().siblings(".importRule").show();
                                }
                            });
                        }
                        else {
                            $(".mapRoute").hide().siblings(".importRule").show();
                        }
					}
				}
                else {
					if(!$("#dbName").val()){
						MsgTip("", common_js_lang['client.info.noDb'],"info");
						return false;
					}
					if(!$("#tableName").val()){
						MsgTip("", common_js_lang['client.info.noTbl'], "info");
						return false;
					}
                    var type = $(".fileRouteChoice").val(),
                        ddl = editor.doc.getValue();
					$(".mapRoute").hide().siblings(".importRule").show();
				}
			})

			$(".mapRoutePreStep").click(function() {
				$(".mapRoute").hide().siblings(".mapData").show();
			})


			$(".coverBtn").click(function() {
				if($(this).prop("checked")) {
					$(this).parent("label").removeClass("radioNo").addClass("radioOk");
					$(".addLabel").removeClass("radioOk").addClass("radioNo");
				}
			})
			$(".addBtn").click(function() {
				if($(this).prop("checked")) {
					$(this).parent("label").removeClass("radioNo").addClass("radioOk");
					$(".coverLabel").removeClass("radioOk").addClass("radioNo");
				}
			}) ;
			$(".fileRouteChoice").change(function() {
				getConnect();
				cleanDestConfig( $(this).val() );				
				if( $(this).val() == globalParam.commonLinkType.hdfs ) {
					$(".dbChoice, .colSepRow").hide();
					//$(".sameNameZone").hide();
					$(".hdfsChoice").show();
					$(".partitionZone").hide();
					$(".dataTab, .new-sql, .formatType").hide();
				} else {
					$(".dbChoice, .colSepRow").show();
					//$(".sameNameZone").show();
					$(".hdfsChoice").hide();
					$(".dataTab, .new-sql, .formatType").show();
				}
			}) ;

			$('.connId').on('change', function(){
				hiveId = $(this).val() ;
				//// 清理数据
				if ( $('.fileRouteChoice').val() == globalParam.commonLinkType.hdfs ){
					cleanDestConfig(0);
                    dirInit();
				}
				else {
					cleanDestConfig(1);					
					getDB() ;
				}
			});

            $('#userApp').change(function(){
                if ( $('.fileRouteChoice').val() == globalParam.commonLinkType.hdfs ){
                    cleanDestConfig(0);
                }
                else {
                    cleanDestConfig(1);
                }
                getConnect();
            });

			//// 清理选择的配置参数
			function cleanDestConfig(type){
				if ( type == 0 ){
					$('.desDirHdfs, .defaultRoute').val('').attr('title', '');
                    $(".thisRoute.startThis").parent().find(".turnOff").show();
                    $(".thisRoute.startThis").parent().find(".turnOn").hide();
                    $('.hdfsRouteBox .startLi .routeLabel.rCheckIcon').removeClass('rCheckIcon');
					$('.hdfsRouteBox .startLi > .allMeun').remove();
				}
				else {
                    editor.doc.setValue('');
					$('#dbName, #tableName').html('').select2();
				}
			}

			$(".cancelSBtn").click(function() {
				$(".maskCell").hide();
				$(".contentBox").hide();
			})
			$(".delSIcon").click(function() {
				$(".maskCell").hide();
				$(".contentBox").hide();
			})
			$("body").on("change", "#dbName", function() {
				var dbName = $(this).val();
				if(dbName) {
					getTables(dbName);
				}
			})
			$("body").on("change", "#tableName", function() {
				var tableName = $(this).val(),
				catalog=$("#tableName option:selected").attr("catalog"),
				schema=$("#tableName option:selected").attr("schema");
				if(tableName) {
                    getDdl({catalog: catalog, schema: schema, tableName: tableName, pid:$('#userApp').val()});
					getPart(catalog,schema,tableName)
				}
			})
			$(".lastPreStep").click(function() {
				$(".mapRoute").show().siblings(".importRule").hide();
			})

			//用户hdfs路径选择弹
			$("body").on("click", ".routeLabel", function() {
				$(".routeLabel").each(function() {
					$(this).removeClass("rCheckIcon");
				});
				$(this).addClass("rCheckIcon");

                var oneRoute = $(this).siblings(".oneRoute").attr('data-base');
				$(".defaultRoute").val(oneRoute).attr('title', oneRoute);
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
					getDir($('.connId').val(),$this,aRoute,preIndent);
				}else{
					$this.parent().siblings(".allMeun").show();
					$this.hide().siblings(".turnOn").css({display:'block'});
				}
			})
			$(".closeMap").click(function() {
				$(".sqlSentence").empty();
				$(".maskCell").hide();
				$(".hdfsRouteBox").hide();
			})
			function sildeR(route) {
				var oneMenu = route.parent().parent();
				oneMenu.show();
				oneMenu.siblings(".oneRoute").children(".turnOn").show();
				oneMenu.siblings(".oneRoute").children(".turnOff").hide();
				if(!oneMenu.hasClass("firstM")) {
					sildeR(oneMenu);
				}
			}
			$(".desDirHdfs").click(function() {
				if ( !$('.connId').val() ){
					MsgTip('', common_js_lang['db.info.selectLink'], 'info');
					return false ;
				}
				$(".maskCell").show();
				$(".hdfsRouteBox").show();
				var hdfsRoute=$(this).val();
				if($(this).val()){
					$(".defaultRoute").val($(this).val()).attr('title', $(this).val());
					$(".routeLabel").each(function() {
						if($(this).siblings(".oneRoute").attr('data-base') == hdfsRoute) {
							$(this).addClass("rCheckIcon").children("input").prop("checked", true);
							var $this = $(this);
						} else {
							$(this).removeClass("rCheckIcon").children("input").prop("checked", false);
						}
					})
					if(typeof $this!=="undefined"){
						sildeR($this);
					}
				}
			})
			$(".bakRouteOk").click(function() {
				if($(".defaultRoute").val()) {
					$.ajax({
					url: 'hdfs/dir/access',
					data:{hdfsId:$('.connId').val(), dir:$(".defaultRoute").val(), pid:$('#userApp').val()},
					success: function(data){
						if ( data.code == -1 ){
							publicFn.ajaxFail();
							return ;
						}
						if ( data.code != 200 ){
                            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
							return ;
						}
						$(".desDirHdfs").val($(".defaultRoute").val()).attr('title', $(".defaultRoute").val());
						$(".maskCell").hide();
						$(".hdfsRouteBox").hide();
					}
					});
				} else {
					MsgTip("", common_js_lang['client.info.tarPath'], "info");
				}
			})
		}

		//根目录获取：
		function dirInit(id){
            var timer = setTimeout(function(){
               $('.delayTip').show();
            }, 2000);
			$.ajax({
				url:'hdfs/dir/home',
				data:{hid: id || $('.connId').val(), pid:$('#userApp').val()},
				success:function(data){
					if(data.code==200&&data.model.length>0){
                        $(".thisRoute.startThis").html(data.model).parent().attr('data-base', data.model);
						$(".firstM .startLi").children(".allMeun")&&$(".firstM .startLi").children(".allMeun").remove();
						var $this=$(".routeStart .turnOff");
						if($this){
							var aRoute = $this.siblings(".thisRoute").html(),
							preIndent = parseInt($this.parent().parent().css("text-indent"));
						}
					}else if(data.code==-1){
						publicFn.ajaxFail();
					}else{
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
						//MsgTip("", common_js_lang['client.info.hdfsInitErr'],"info");
						$(".thisRoute.startThis").html("");
						$(".firstM .startLi").children(".allMeun")&&$(".firstM .startLi").children(".allMeun").remove();
					}
				},
                complete: function(){
                    clearTimeout(timer);
                    $('.delayTip').hide();
                }
			})
		}
		
		function getDir(hid,$this,aRoute,preIndent,start) {
            var timer = setTimeout(function(){
                $('.delayTip').show();
            }, 2000);
			$.ajax({
				url: 'hdfs/dir/list',
				data: {hid:hid, base: aRoute, pid:$('#userApp').val()},
				success: function(data) {
					if(data.code == 200) {
                        if(data.model.length) {
							$this.children(".turnOn").css({display:'block'});
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
							setTimeout(function(){
								$(".delayTip").hide();
							},400)
							if($this.parent().hasClass("routeStart")){
								$(".defaultRoute").val($(".startThis").html()).attr('title', $(".startThis").html());
							}
						}
					} else if(data.code == -1) {
						publicFn.ajaxFail();
					}else {
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

		function getConnect(id){
			var pid = $('#userApp').val() || '',
				targetType = $('.fileRouteChoice').val(),
				url = 'db/list',
                dbType = 31,
				groups = '';
			targetType == globalParam.commonLinkType.hdfs ? (url = 'hdfs/list') : (groups = 4) ;
            targetType == globalParam.commonLinkType.spark ? dbType = 62 : '';
			$.ajax({
				url: url+'?pid='+pid+'&groups='+groups+'&dbType='+dbType,
				success: function(data){
                    if ( data.code != 200 ) {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }
					var connHtml = '<option value="" disabled>'+common_js_lang['db.info.selectLink']+'</option>' ;
					targetType == globalParam.commonLinkType.hdfs ? adminConfigData.hdfs.id && (connHtml += '<option value="'+adminConfigData.hdfs.id+'">'+adminConfigData.hdfs.connName+'</option>') : '';
                    targetType == globalParam.commonLinkType.hive ? adminConfigData.hive.id && (connHtml += '<option value="'+adminConfigData.hive.id+'">'+adminConfigData.hive.connName+'</option>') : '';
					data.model.data.map(function(v){
						connHtml += '<option value="'+v.id+'">'+v.connName+'</option>' ;
					});
					$('.mapRouteMsg .connId').html(connHtml).val(id? id : '').select2();
				}
			})
		} 

		function init() {
			eventBind();
			$("#autoTipMsg").val(common_js_lang['client.option.Immed']) //调度初始化
			if(GetRequest().jobId) {
				taskMsg(GetRequest().jobId);
			}else{
				getConnect();
			}
			$('.contentBox .clientM').attr('href', "./client.taskm?id="+GetRequest().clientId);
		}
		init();
		//任务分类执行
		function taskImport(){
			if( GetRequest().jobId && !GetRequest().copy ) {
				if ( $(".fileRouteChoice").val() == globalParam.commonLinkType.hdfs ){
					taskUpdataH();
				}else{
					taskUpdataD();
				}
				return false;
			} else {
				if ( $(".fileRouteChoice").val() == globalParam.commonLinkType.hdfs ){
					taskAddH();
				}else{
					taskAddD();
				}
			}
		}

		//导航返回任务管理：
		$(".runToPre").click(function(){
			location.href="./client.taskm?id="+GetRequest().clientId;
		})
		//结束返回任务管理：
		$(".goToClient").click(function(){
			location.href="./client.taskm?id="+GetRequest().clientId;
		})
		$('.btnCon').on('click', '.startImport', function() {
            var cronGlobalParam = cronExport.cronExec($('.group-type .cur').index(), true);
            if ( !cronGlobalParam.cronParam || [0, 1, 2].indexOf(+cronGlobalParam.periodType) == -1 ){
                return false;
            }
            globalParam.cronGlobalParam = cronGlobalParam;
            taskImport();
		});

		var isDetailStatus = GetRequest().detail == 1 ;
		if ( isDetailStatus ){
            $('h2.title span').html(common_js_lang['common.option.taskDetail']);
            $('.radio').css({cursor: 'not-allowed'});
			$('input, select, textarea').prop('disabled', true);
			$('input[type="button"]').prop('disabled', false);
			$('.cronCon').addClass('disabled');

            //增加title
            ['#fileRouteMsg', '#suffixContent', '#moveSite', '.desDirHdfs', '#taskName'].map(function(v){
               $(v).attr('title', $(v).val());
            });

            // 退出按钮
			$('.startImport').html(common_js_lang['client.act.exit']);
            $('.btnCon').off('click').on('click', '.startImport', function(){
				window.location.href = "./client.taskm?id="+GetRequest().clientId;
				return ;
			});

            //去掉验证 直接进入下一步
            $('.mapRouteNextStep').off('click').on('click', function(){
                $(".mapRoute").hide().siblings(".importRule").show();
            });
		}
        else{
            $('h2.title span').html(common_js_lang['index.title.newTask']);
        }

        window.onbeforeunload = function(){
            if ( isDetailStatus )
                return ;
            if ( $('#fileRouteMsg').val().trim() || $('.addFileFilter').val().trim() || $('.multipleSelect').val() )
                return common_js_lang['common.info.leavePage'];
            return ;
        };
	})