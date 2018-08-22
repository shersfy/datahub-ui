$(function(){
	function getToken(appId){
		$.ajax({
			url:'token/refresh',
			data:{appId:appId},
			success:function(data){
				if(data.code==200){
					$("#tokenValue").val(data.model.accessToken);
					$("#appKey").val(data.model.appKey);
				}
			}
		})
	}
	var appId="";
	function initToken(){
		$.ajax({
			url:'token/get',
			async:false,
			success:function(data){
				if(data.code==200){
					appId=data.model.appId;
					$("#tokenValue").val(data.model.accessToken);
					$("#appKey").val(data.model.appKey);
				}else if(data.code==0){
					swal("ERROR",data.msg,"error");
				}else if(data.code==-1){
					swal({
						title:'',
						text: '登录已过期',
						type: 'info',
						showCancelButton:true,
						confirmButtonText: '新开窗口进行登录操作',
						cancelButtonText: '直接跳转登录页'
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
		return appId;
	}
	initToken();
	$("#tokenBtn").click(function(){
		var id="";
		appId ? id=appId : id=1;
        getToken(id);
	})
})