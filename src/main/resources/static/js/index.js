$(function() {
	$(".dataSourceNav li").click(function() {
		var index = $(this).data("type");
		$(this).addClass("cur").siblings().removeClass("cur");
		$(".dataBox").eq(index).fadeIn(800).siblings().hide();
		if(index) {
			$(".bottomNav").addClass("disNone");
		} else {
			$(".bottomNav").removeClass("disNone");
		}
	})
	$(".IEdataSourceNav li").click(function() {
		var index = $(this).data("type");
		$(this).addClass("cur").siblings().removeClass("cur");
		$(".IEdataBox").eq(index).fadeIn(800).siblings().hide();
		if(index) {
			$(".bottomNav").addClass("disNone");
		} else {
			$(".bottomNav").removeClass("disNone");
		}
	})
	$(".oneSource").on("mouseenter", function() {
		//$(this).children("span").slideDown(400);
		$(this).children(".developing").fadeIn(200);
	}).on("mouseleave", function() {
		//$(this).children("span").slideUp(400);
		$(this).children(".developing").fadeOut(200);
	})
	$(".bottomNav li").click(function() {
		$(this).addClass("cur").siblings().removeClass("cur");
		var index = $(this).index();
		$(".dataBox").each(function() {
			if($(this).hasClass("cur")) {
				$(this).children(".boxPage").eq(index).addClass("cur").siblings().removeClass("cur");
			}
		})
	})
	var navigatorName = "Microsoft Internet Explorer";
	if(navigator.appName == navigatorName||"ActiveXObject" in window||window.attachEvent){
		$(".IEBorwser").show();
		$(".hBorwser").hide();;
	}else{
		$(".IEBorwser").hide();
		$(".hBorwser").show();
	}
})