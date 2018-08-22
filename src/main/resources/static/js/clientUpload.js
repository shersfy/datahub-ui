$(function() {
	//禁止ie的ajax缓存
 	$.ajaxSetup({ cache:false }); 
	var delFlag = '';
	//获取客户端配置信息并渲染至客户端：
	function getClientList() {
		$.ajax({
			url: 'online/client/list',
			data: {
				//userId: 1
			},
			success: function(data) {
				if(data.code == 200) {
					var tr = '';
					for(var i = 0; i < data.model.data.length; i++) {
						var tdC = '';
						var tdA = "<tr field='" + data.model.data[i].id + "' class='oneClient'><td><input type='text' maxlength='30'  readOnly='true' class='clientName' title='"+data.model.data[i].clientName+"' value='" + data.model.data[i].clientName + "'><i class='icon editIcon'></i><div class='point'></div><div class='tipMsg'>"+common_js_lang['clientList.info.rename']+"</div></td>";
						var tdB = "<td class='clientIp'>" + data.model.data[i].clientIp + "</td>";
						if(data.model.data[i].onLine == 1) {
							tdC = "<td class='status' field='"+data.model.data[i].onLine+"'><i class='icon stateIcon stop'></i><span class='state'>"+common_js_lang['clientList.info.online']+"</span></td>";
						} else if(data.model.data[i].onLine == 0) {
							tdC = "<td class='status' field='"+data.model.data[i].onLine+"'><i class='icon stateIcon start'></i><span class='state'>"+common_js_lang['clientList.info.offline']+"</span></td>";
						}
						var tdD = "<td><span class='icon setBtn'></span><span class='icon delBtn'></span><div class='pointTask'></div><a href='./clientManage' class='tipMsgTask'>"+common_js_lang['clientList.info.titleM']+"</a><div class='pointDel'></div><div class='tipMsgDel'>"+common_js_lang['clientList.option.del']+"</div></td></tr>";
						tr += tdA + tdB + tdC + tdD;
					}
					if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/9./i) == "9.") {
						//setTBodyInnerHTML(document.getElementById("client-tbody"), tr);
						var div = document.createElement('div');
						div.innerHTML = '<table>' + tr + '<table>';
						document.getElementById("client-tbody").parentNode.replaceChild(div.firstChild.firstChild, document.getElementById("client-tbody"));
					} else {
						document.getElementById("client-tbody").innerHTML = tr;
					}
					if(data.model.data.length==0){
						var tr='<tr><td colspan="4" style="text-align:center;padding:10px 0;font-size:16px;"><img src="resources/dist/images/noData.png" /></br>'+common_js_lang['manage.title.noData']+'</td></tr>';
						$("#client-tbody").html(tr);
					}
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
	getClientList();
	//定时局部刷新：
	function freshPart(){
		$.ajax({
			url:'online/client/list',
			data: {
				//userId: 1
			},
			success:function(data){
				if(data.code==200&&data.model.data.length>0&&data.model.data.length==$(".oneClient").length){
					for(var d in data.model.data){
						$(".oneClient").each(function(){
							if(data.model.data[d].id==$(this).attr("field")){
								$(this).children(".clientIp").html(data.model.data[d].clientIp);
								if($(this).children(".status").attr("field")!==data.model.data[d].onLine){
									$(this).children(".status").attr("field",data.model.data[d].onLine);
									if(data.model.data[d].onLine==1){
										$(this).children(".status").children(".stateIcon").removeClass("start").addClass("stop");
										$(this).children(".status").children(".state").html(common_js_lang['clientList.info.online']);
									}else{
										$(this).children(".status").children(".stateIcon").removeClass("stop").addClass("start");
										$(this).children(".status").children(".state").html(common_js_lang['clientList.info.offline']);
									}
								}
								if($(this).children().eq(0).children("input").attr("title")!==data.model.data[d].clientName&&!$(this).children().eq(0).children("input").is(':focus')){
									$(this).children().eq(0).children("input").attr("title",data.model.data[d].clientName).val(data.model.data[d].clientName);
								}
							}
						})
					}
				}else if(data.code==200&&data.model.data.length>0&&data.model.data.length>$(".oneClient").length){
					getClientList();
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
			}
		})
	}
	var clientFresh=setInterval(function(){freshPart()},10000);
	function setTBodyInnerHTML(tbody, html) {
		var div = document.createElement('div');
		div.innerHTML = '<table>' + html + '<table>';
		tbody.parentNode.replaceChild(div.firstChild.firstChild, tbody)
	}

	//客户端名编辑：
	function edit(id, clientname) {
		$.ajax({
			url: 'online/client/save',
			data: {
				id: id,
				clientName: clientname
			},
			success: function(data) {
				if(data.code == 200) {
					getClientList();
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
				} else if(data.code==0) {
					MsgTip("", common_js_lang['clientList.info.nameEditFail'],"info");
				}
			}
		})
	}

	//删除客户端：
	function delClient(id) {
		$.ajax({
			async: true,
			type: 'get',
			contentType: 'application/x-www-form-urlencoded',
			url: 'online/client/delete',
			data: {
				clientId: id
			},
			success: function(data) {
				if(data.code == 200) {
					getClientList();
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
				} else if(data.code==0) {
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
				}
			}
		})
	}
	//客户端下载：
	function clientDownload() {
		$.ajax({
			url: "client/download",
			success: function(data) {
				if(data.code == -1) {
					location.href = '/login?returnUrl=' + location.pathname + location.search;
				} else if(data.code == 200) {

				} else if(data.code==0) {
					alert(common_js_lang['clientList.info.downFail'])
				}
			}
		})
	}
	//事件绑定：
	function bindEvent() {
		//tab中hover事件：
		$("body").on("mouseover", ".editIcon", function() {
			$(this).css({
				"background-color": "#e5e5e5",
				"background-position": "-16px -32px"
			});
			$(this).siblings(".tipMsg").show();
			$(this).siblings(".point").show();
		});
		$("body").on("mouseout", ".editIcon", function() {
			$(this).css({
				"background-color": "#fff",
				"background-position": "0px -32px"
			});
			$(this).siblings(".tipMsg").hide();
			$(this).siblings(".point").hide();
		});
		$("body").on("mouseover", ".setBtn", function() {
			$(this).css({
				"background-color": "#e5e5e5",
				"background-position": "-16px -64px"
			});
			$(this).siblings(".pointTask,.tipMsgTask").show()
		});
		$("body").on("mouseout", ".setBtn", function() {
			$(this).css({
				"background-color": "#fff",
				"background-position": "0px -64px"
			});
			$(this).siblings(".pointTask,.tipMsgTask").hide()
		})

		$("body").on("mouseover", ".delBtn", function() {
			$(this).css({
				"background-color": "#e5e5e5",
				"background-position": "-16px -48px"
			});
			$(this).siblings(".pointDel,.tipMsgDel").show()
		});
		$("body").on("mouseout", ".delBtn", function() {
			$(this).css({
				"background-color": "#fff",
				"background-position": "0px -48px"
			});
			$(this).siblings(".pointDel,.tipMsgDel").hide()
		})

		//tab中编辑事件：
		var clientName = "";
		$("body").on("click", ".editIcon", function() {
			clientName = $(this).siblings("input").val();
			$(this).hide().siblings("input").attr("readonly", false);
			$(this).siblings("input").val(clientName).focus();
		})
			//tab中删除事件：
		$("body").on("click", ".delBtn", function() {
			delFlag = $(this).parent().parent().attr("field");
			$(".coverTip").show();
			$(".tipContent").show();
		})
			//遮罩层删除判定事件：
		$(".delOk").click(function() {
			$(".coverTip").hide();
			$(".tipContent").hide();
			delClient(delFlag);
			delFlag = "";
			return false;
		})
		$(".delCancel").click(function() {
			$(".coverTip").css('display', 'none');
			$(".tipContent").hide();
			return false;
		})
		$(".cancelIcon").click(function() {
			$(".coverTip").hide();
			$(".tipContent").hide();
		})
			//tab中任务管理跳转：
		$("body").on("click", ".setBtn", function() {
			clearInterval("clientFresh");
			var field = $(this).parent().parent().attr("field"),
				user=$(this).parent().parent().children().eq(0).children(".clientName").val();
			location.href = "./client.taskm?id=" + field+"&user="+user;
		})
		$("body").on("blur", ".clientName", function() {
            if ( $(this).siblings('.editIcon').css('display') != 'none' )
                return ;

			$(this).siblings(".editIcon").show().css("display", "inline-block");
            $(this).attr("readonly", true);
			//命名check
			var nStr = $(this).val().trim(),
				nFlag = nStr.match(/.{1,30}/),
                title = $(this).attr('title') ;
            if ( title === nStr ) return ;
			if( nStr == "" ) {
				$(this).val(clientName);
			} else if( nStr && !nFlag) {
				swal("", common_js_lang['clientList.info.clinetNameChar'], "info");
				$(this).val(clientName);
			} else if( nStr && nFlag) { //匹配后查重再编辑或刷新。
				var field = $(this).parent().parent().attr("field"),
					username = $(this).val().trim(),
					sign = 0;
				$(".clientName").each(function() {
					if($(this).val() == username) {
						sign++;
					}
				})
				if(sign > 1) {
					MsgTip('', common_js_lang['clientList.info.nameErr'], 'info');
					getClientList();
				} else {
					edit(field, username);
					//getClientList();
				}
			}
		})
	}

	function init() {
		bindEvent();
	}
	init();
});