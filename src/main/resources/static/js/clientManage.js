$(function() {
	var delFlag = '';
	//获取客户端配置信息并渲染至客户端：
	function getClientList() {
		var tr = '';
		$.ajax({
			url: 'client/list',
			data: {
				userId: 1
			},
			success: function(data) {
				if(data.code == 200) {
					for(var i = 0; i < data.model.length; i++) {
						var tdC = '';
						var tdA = "<tr field=" + data.model[i].id + "><td><input type='text' class='clientName' value=" + data.model[i].clientName + " readOnly='true'><i class='icon editIcon'></i><div class='point'></div><div class='tipMsg'>重命名</div></td>";
						var tdB = "<td>" + data.model[i].clientIp + "</td>";
						if(data.model[i].status == 2) {
							tdC = "<td><i class='icon stateIcon start'></i><span class='state'>运行中</span></td>";
						} else if(data.model[i].status == 1) {
							tdC = "<td><i class='icon stateIcon stop'></i><span class='state'>空闲</span></td>";
						}
						var tdD = "<td><span class='icon setBtn'></span><span class='icon delBtn'></span><div class='pointTask'></div><a href='./clientManage' class='tipMsgTask'>任务管理</a><div class='pointDel'></div><div class='tipMsgDel'>删除</div></td></tr>";
						tr += tdA + tdB + tdC + tdD;
						document.getElementById("client-tbody").innerHTML = tr;

					}
				} else if(data.code == -2) {
					location.href = '/login?returnUrl=' + location.pathname + location.search;
				}
			}
		})
	}
	//客户端名编辑：
	function edit(id, clientname) {
		$.ajax({
			url: 'client/update',
			data: {
				id: id,
				clientName: clientname
			},
			success: function(data) {
				if(data.code == 200) {
					getClientList();
				} else if(data.code == -1) {
					location.href = '/login?returnUrl=' + location.pathname + location.search;
				} else {
					alert("客户端名编辑失败！");
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
			url: 'client/delete',
			data: {
				clientId: id
			},
			success: function(data) {
				if(data.code == 200) {
					getClientList();
				} else if(data.code == -1) {
					location.href = '/login?returnUrl=' + location.pathname + location.search;
				} else {
					swal('ERROR', '删除失败' + data.msg, 'error');
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
					console.log(data);
				} else {
					alert("下载失败")
				}
			}
		})
	}
	var taskListValue = {
		pageNo: 1,
		pageSize: 10
	};

	function getTaskList() {
		$.ajax({
			url: 'ctask/list',
			data: taskListValue,
			success: function(data) {
				$(".dispatchList").html(template("client/task", data.model));
				$('.dispatchList .pager').bootpag({
					total: data.model.totalPage,
					page: data.model.currentPage,
					maxVisible: 5,
					leaps: false,
					firstLastUse: true,
					prev: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
					next: '<i class="fa fa-angle-right" aria-hidden="true"></i>',
					first: '<i class="fa fa-angle-double-left" aria-hidden="true"></i>',
					last: '<i class="fa fa-angle-double-right" aria-hidden="true"></i>'
				}).off().on('page', function(e, page) {
					taskListValue.pageNo = page;
					getTaskList();
				});
			}
		})
	}
	//事件绑定：
	function bindEvent() {
		//tab中hover事件：
		$("body").on("mouseover", ".editIcon", function() {
			console.log("111");
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
		$("body").on("click", ".editIcon", function() {
			var clientName = $(this).siblings("input").val();
			$(this).hide().siblings("input").attr("readonly", false).css({
				"width": "100%",
				"height": "100%",
				"padding-left": "20px"
			}).focus().val("").parent().css("padding", "0")
			$(this).siblings("input").val(clientName);
		})
		$("body").on("blur", ".clientName", function() {
				$(this).css({
					"padding": "0",
					"height": "100%",
					"width": "200px"
				}).parent().css("padding-left", "24px")
				$(this).siblings(".editIcon").show().css("display", "inline-block");
			})
			//tab中删除事件：
		$("body").on("click", ".delBtn", function() {
				delFlag = $(this).parent().parent().attr("field");
				console.log(delFlag)
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
				var field = $(this).parent().parent().attr("field");
				location.href = "./clientManage?id=" + field;
			})
			//tab中编辑事件：
		$("body").on("change", ".clientName", function(id, username) {
			var field = $(this).parent().parent().attr("field");
			var username = $(this).val();
			$(".clientName").each(function() {
				if($(this).val() == username) {
					swal('ERROR', '客户端姓名不能相同' + data.msg, 'error');
				} else {
					edit(field, username);
				}
			})
		})
	}

	function init() {
		bindEvent();
		getClientList();
	}
	init();

});