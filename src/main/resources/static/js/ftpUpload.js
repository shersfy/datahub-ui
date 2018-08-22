function businessFn(editData) {
    if ( editData ){  //编辑复制
        $('.configTask .taskName').val(editData.jobName);
        $('.configTask .taskDes').val(editData.note);
        $('#userApp').val(editData.pid).select2();

        //列表配置
        if ( editData.fromList[0].usePattern ){  //匹配
            $('.confType .radio').removeClass('cur').eq(1).addClass('cur');
            $('.leftZone .dbZone .oneDataLi.tabcheck').removeClass('tabcheck');
            $('.dbZone').addClass('dir');
            $('.headTitltTwo .type_2').show();
            $('.headTitltTwo .type_1').hide();
            $('.hdfsBox .matchCon, .hdfsBox .tarDir').show();
            var listData = [];
            editData.fromList.map(function(v, i){
                v.tarRenameFormat = ['' ,'_yyyyMMdd', '_yyyyMMdd_HHmmss'].indexOf(v.tarRenameFormat);
                listData.push({
                    filePath: v.filePath,
                    size: v.size,
                    fileName: editData.toList[i].fileName,
                    pathPattern: v.pathPattern,
                    source: JSON.stringify(v),
                    target: JSON.stringify(editData.toList[i])
                });
            });

            $('.addContentZone .createTab').html(template('template/configList', {data:listData, type:2}));
        }
        else {  //勾选
            var listData = [];
            editData.fromList.map(function(v, i){
                listData.push({
                    filePath: v.filePath,
                    size: v.size,
                    fileName: editData.toList[i].fileName,
                    directory: v.directory == true ? 1 : 0,
                    tarFileHandleType: editData.toList[i].tarFileHandleType
                });
            });
            $('.addContentZone .createTab').html(template('template/configList', {data:listData, type:1}));
        }

        var iframeParam = {
            cronParam: editData.cronExpression,
            startTime: editData.startTime,
            endTime: editData.endTime
        };
        cronExport.resetCron(iframeParam);
        $('#userApp, .uploadFile .connType, .uploadFile .linkList, .uploadFile .connId').prop('disabled', true);
    }

    var userMsg = {},
        pageStatus=true,
        projectVal=$("#userApp").val(),
        publicFn={
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
    //第一页表单内容验证
    function formValit1() {
        var result = {};
        result.flag = false;
        result.msg = "";

        if($(".taskName").val() == "") {
            result.flag = true;
            result.msg = common_js_lang['local.info.taskNameNone'];
            return result;
        }
        else if(!$("#userApp").val()) {
            result.flag = true;
            result.msg = common_js_lang['s3.info.noneApp'];
            return result;
        }
        else if ( !$('.linkList').val() && $('.connType').val() == 1 ){
            result.flag = true;
            result.msg = common_js_lang['ftp.info.srcLink'];
            return result;
        }

        if ( $('.connType').val() == 2 ){  //临时连接
            var host = $('.choose-link').find('[data-key="host"]').val().trim(),
                port = $('.choose-link').find('[data-key="port"]').val().trim(),
                protocol = ($('.choose-link').find('[data-key="protocol"]').val() || '').trim(),
                userName = $('.choose-link').find('[data-key="userName"]').val().trim(),
                password = $('.choose-link').find('[data-key="password"]').val().trim() ;
            if ( !host ){
                result.flag = true;
                result.msg = common_js_lang['ftp.info.host'];
                return result;
            }
            else if ( !port || !port.match(/^[1-9]\d*$/g) ){
                result.flag = true;
                result.msg = common_js_lang['ftp.info.port'];
                return result;
            }
            else if ( !protocol ){
                result.flag = true;
                result.msg = common_js_lang['ftp.info.protocol'];
                return result;
            }
            else if ( !userName ){
                result.flag = true;
                result.msg = common_js_lang['ftp.info.userName'];
                return result;
            }
            else if ( !password ){
                result.flag = true;
                result.msg = common_js_lang['ftp.info.pwd'];
                return result;
            }
        }

        if(!$("#connId").val()) {
            result.flag = true;
            result.msg = common_js_lang['db.info.tarConn'];
        }
        return result;
    }
    //获取buckets
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
    function getConnect(id){
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
                $('#connId').html(connHtml).val(id || '').select2();
            }
        }).fail(function(){
            $('#connId').html("");
        })
    }
    getConnect(editData.toId || 0);
    //获取目录
    function getFtpDir(ftpId,dir, field, $dbName,preIndent,sibs,$this){
        var timer = setTimeout(function () {
            $('.delayTip').show();
        }, 2000);
        $this.prop('disabled', true);
        $.ajax({
            url:'repo/ftp/files',
            type:'post',
            data:{ftpId:ftpId,dir:dir},
            success:function(data){
                if(data.code != -1 && data.code != 200){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                }
                else if(data.code==200){
                    data.model.sort(function(a,b){    //排序， 先按文件类型排序， 再根据文件名
                        if (a.directory != b.directory )
                            return a.directory - b.directory;
                        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
                    });

                    $this.parent().attr("response","ok");
                    $this.hide();
                    sibs.show();
                    var result={};
                    result.field=field;
                    result.preIndent=preIndent;
                    result.model=data.model;
                    var parentPad = $this.parent().css('padding-left').slice(0,-2) || 0,
                        curPad = +parentPad + 18 ;

                    //两个地方增加子目录，然后隐藏非当前操作子目录
                    var tmp = template("template/child",{data:result, pad:curPad});
                    $dbName.map(function(i, v){
                        if ( $(v).find('.childUl').length > 0 )
                            return ;
                        $(v).append( tmp).find('.childUl').hide();
                    });
                    $this.parent().siblings('.childUl').slideDown();

                    $(".uploadFile").hide();
                    $(".choiceRoute").show();
                }
                else if(data.code==-1){
                    publicFn.ajaxFail();
                }
            },
            complete: function() {
                $this.prop('disabled', false);
                clearTimeout(timer);
                $(".delayTip").hide();
            }
        })
    }

    $('.returnRoot').on('click', function(){
        var id = $('.linkList').val(),
            self = $(this);
        $('.delayTip').show();
        $.when( getDir(id)).then(function(data){
            data.model.sort(function(a,b){    //排序， 先按文件类型排序， 再根据文件名
                if (a.directory != b.directory )
                    return a.directory - b.directory;
                return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
            });
            data.field = 0;
            self.siblings(".dbZone").html(template("template/child", {data: data, pad:0}));
            if ( self.parents('.mapRange').length ) {
                $(".addContentZone .createTab").empty();
                $(".checkAllLab").removeClass("checkStatus").children("input").attr("checked", false);
            }
        }).always(function(){
            $('.delayTip').hide();
        });

        function getDir(ftpId){
            var defer = $.Deferred() ;
            $.ajax({
                url: 'repo/ftp/files',
                type: 'post',
                data: {ftpId: ftpId, dir:'/'},
                success: function(data){
                    if ( data.code != 200 ){
                        defer.reject();
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }
                    defer.resolve(data);
                },
                error: function(){
                    defer.reject();
                }
            });
            return defer.promise();
        }
    });

    $("#connId").change(function(){
        var current=$(this).val();
        userMsg.connId=current;
    })
    $("#userApp").change(function(){
        getConnect();
        getFtpList();
        var conDom = $('.uploadFile .choose-link');
        if ( conDom.find('.connType').val() == 1 ){  // 清空源连接 数据
            ['host', 'port', 'protocol', 'userName', 'password'].map(function(v){
                conDom.find('[data-key="'+v+'"]').val('');
            }) ;
        }
    });

    getFtpList(editData || 0);
    function getFtpList(editData){
        if ( !$('#userApp').val() )
            return false;

        $.ajax({
            url: 'repo/ftp/list',
            data: {pageNo:1, pageSize:1000, pid:$('#userApp').val()},
            beforeSend: function() {
                $(".delayTip").show();
            },
            success: function(data){
                data.model.data = data.model.data.map(function(v){
                    v.val = JSON.stringify(v);
                    return v;
                });
                var options = '<option value="" disabled>'+common_js_lang['db.info.dbLinkErr']+'</option>';
                options += template('template/sourceLink', {data: data.model.data});
                $('.source .linkList').html(options).val('').select2();
                try {
                    if ( editData.fromObject.delFlg != -1 ){
                        $('.source .linkList').val( editData.fromId).change();
                    }
                    else {
                        $('.uploadFile .source .connType').val(2);
                        //$('.uploadFile .source .linkList').val('').select2();
                        $('.uploadFile .source .type1show').hide();
                        //$('select[data-key="protocol"] .empty').remove();
                        //$('.uploadFile .source input, select[data-key="protocol"]').prop('disabled', false).val('').removeClass('error');
                        $('.uploadFile .source .type2show').show();
                        ['host', 'port', 'protocol', 'userName', 'password', 'connName'].map(function(v){
                            $('.uploadFile .source').find('[data-key="'+v+'"]').val(editData.fromObject[v]).prop('disabled', true);
                        });
                    }
                } catch(e) {}
            },
            complete: function() {
                $(".delayTip").hide();
            }
        });
    }
    // 填充连接信息
    $('.uploadFile').on('change', '.linkList', function() {
        var val = $(this).val();
        if(!val) return false;

        var obj = JSON.parse( $(this).find('option:selected').attr('data-val') );
        var conDom = $(this).parents('.choose-link');
        conDom.find('[data-key="protocol"]').val(obj.protocol);
        conDom.find('[data-key="host"]').val(obj.host);
        conDom.find('[data-key="port"]').val(obj.port);
        conDom.find('[data-key="userName"]').val(obj.userName);
        conDom.find('[data-key="password"]').val(obj.password);
    });
    // 切换到临时资源
    $('.uploadFile').on('change', '.connType', function(){
        var connType = $(this).val();
        if ( connType == 1 ){
            $('.uploadFile .source .type1show').show();
            $('.uploadFile .source .type2show').hide();
            $('.uploadFile .source input, select[data-key="protocol"]').prop('disabled', true).val('').removeClass('error');
            $('.source .linkList').select2();
        }
        else {
            $('.uploadFile .source .linkList').val('').select2();
            $('.uploadFile .source .type1show').hide();
            $('select[data-key="protocol"] .empty').remove();
            $('.uploadFile .source input, select[data-key="protocol"]').prop('disabled', false).val('').removeClass('error');
            $('.uploadFile .source .type2show').show().find('input').prop('disabled', true);
        }
    });

    $('.choose-link').on('blur', 'input,select', function(){
        var val = $(this).val().trim();
        if ( val === '' ||  $(this).attr('data-key') == 'port' && !val.match(/^[1-9]\d*$/g) ){
            $(this).addClass('error');
            return ;
        }
        $(this).removeClass('error');

        if ( ['host', 'port'].indexOf($(this).attr('data-key')) ){
            var tmpData = {};
            ['host', 'port'].map(function(v){
                tmpData[v] = $('.choose-link').find('[data-key="'+v+'"]').val().trim();
            });
            $('.choose-link').find('[data-key="connName"]').val('TMP_'+tmpData.host+'_'+tmpData.port);
        }
    });

    $('.testRes').on('click', '.showTip', function(){
        var data = JSON.parse( decodeURIComponent($(this).attr('data-info')) );
        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
    });
    $('.connType, .linkList').change(function(){
        var container = $(this).parents('.source');
        container.length == 0 ? container = $(this).parents('.upload-type') : '';
        container.find('.testRes').empty();
    });

    //测试连接
    $('.testConnect').on('click', function(){
        var parentDom = $(this).parent();
        parentDom.find('.testRes').empty();

        if ( $('.connType').val() == 1 ){
            var ftpId = $('.linkList').val();
            if ( !ftpId ) {
                MsgTip('', common_js_lang['db.info.selectSavedLink'], 'info');
                return;
            }
            try {
                var param = JSON.parse($('.linkList option:selected').attr('data-val'));
            } catch(e){
                return ;
            }
            $('.delayTip').show();
            $.ajax({
                url: 'repo/ftp/connect',
                type: 'post',
                data: param,
                success: function(data){
                    if ( data.code != 200 ){
                        parentDom.find('.testRes').removeClass('right').addClass('err').html('<i class="fail"></i>'+common_js_lang['db.text.testFail']+'<a class="showTip" data-info='+encodeURIComponent(JSON.stringify(data))+'>'+common_js_lang['db.text.errTip']+'</a>');
                        return ;
                    }
                    parentDom.find('.testRes').removeClass('err').addClass('right').html('<i class="suc"></i>'+common_js_lang['db.text.testSuc']);
                },
                complete: function(){
                    $('.delayTip').hide();
                }
            });
        }
        else {
            var doc = $('.choose-link.source'),
                tmpLinkData = {},
                tag = true;

            tmpLinkData['pid'] = $('#userApp').val();
            tmpLinkData['delFlg'] = -1;
            ['host', 'port', 'protocol', 'userName', 'password', 'connName'].map(function(v){
                tmpLinkData[v] = (doc.find('[data-key="'+v+'"]').val() || '').trim();
                if ( tmpLinkData[v] === '' ){
                    doc.find('[data-key="'+v+'"]').addClass('error');
                    tag = false;
                }
                else if ( v === 'port' && !tmpLinkData[v].match(/^\d+$/g) ){
                    doc.find('[data-key="'+v+'"]').addClass('error');
                    tag = false;
                }
                else{
                    doc.find('[data-key="'+v+'"]').removeClass('error');
                }
            });

            if ( !tag ) {
                MsgTip('', common_js_lang['db.info.completeParam'], 'info');
                return;
            }

            if (  editData ){
                tmpLinkData.oldpwd = tmpLinkData.password;
            }

            $('.delayTip').show();
            $.ajax({
                url: 'repo/ftp/connect',
                type: 'post',
                data: tmpLinkData,
                success: function(data){
                    if ( data.code != 200 ){
                        parentDom.find('.testRes').removeClass('right').addClass('err').html('<i class="fail"></i>'+common_js_lang['db.text.testFail']+'<a class="showTip" data-info='+encodeURIComponent(JSON.stringify(data))+'>'+common_js_lang['db.text.errTip']+'</a>');
                        return ;
                    }
                    parentDom.find('.testRes').removeClass('err').addClass('right').html('<i class="suc"></i>'+common_js_lang['db.text.testSuc']);
                },
                complete: function(){
                    $('.delayTip').hide();
                }
            });
        }
    });

    //  模式切换
    $('.confType').on('click', 'label', function(){
        if ( $(this).find('.radio.cur').length == 1 )
            return ;

        var self = $(this);
        if ( $('.createTab tr').length > 0 ){
            swal({
                title: '',
                text: common_js_lang['db.option.mtype'],
                type: 'info',
                showCancelButton: true
            }, function(isConfirm){
                if ( isConfirm ){
                    clearHandle();
                }
            });
        }
        else {
            clearHandle();
        }

        function clearHandle(){
            $('.confType .radio').removeClass('cur');
            self.find('.radio').addClass('cur');
            //右侧清理
            $('.createTab').empty();
            $('.checkAllLab.checkStatus').removeClass('checkStatus');
            var type = $('.confType').find('.radio.cur').attr('data-val');
            //左侧清理
            if ( type == 1 ) {
                //左侧清理
                $('.mapRange .leftZone .dbZone .oneResult.tabcheck').removeClass('tabcheck');
                $('.dbZone').removeClass('dir');
                $('.headTitltTwo .type_1').show();
                $('.headTitltTwo .type_2').hide();
                $('.hdfsBox .matchCon, .hdfsBox .tarDir').hide();
                $('.hdfsBox .routeShow .suffixShow, .hdfsBox .routeShow .sameNameAct').show();
            }
            else{
                $('.mapRange .leftZone .dbZone .oneDataLi.tabcheck, .mapRange .leftZone .dbZone .oneResult.tabcheck').removeClass('tabcheck');
                $('.dbZone').addClass('dir');
                $('.headTitltTwo .type_2').show();
                $('.headTitltTwo .type_1').hide();
                $('.hdfsBox .matchCon, .hdfsBox .tarDir').show();
                $('.hdfsBox .routeShow .suffixShow, .hdfsBox .routeShow .sameNameAct').hide();
            }
        }

        return false;
    });

    //文件选中
    $("body").on("click",".oneDataLi",function(){
        var type = $('.confType .radio.cur').attr('data-val');
        if ( type == 1 ) {  //勾选模式下 文件可选
            if ( $(this).hasClass('oneTabLi') ) {
                $(this).toggleClass("tabcheck");
            }
            else {
                $(this).find('>.oneResult').toggleClass("tabcheck");
            }
        }
        else if ( type == 2 && !$(this).hasClass('oneTabLi') ) {
            if ( $(this).parents('.dbZone').hasClass('directory') ){
                $(this).parents('.dbZone').find('.oneResult.tabcheck').removeClass('tabcheck');
                $(this).find('>.oneResult').addClass('tabcheck');
                $('.srcSet .moveDir').val( $(this).find('>.oneResult .aDbName').attr('path') );
            }
            else {
                if ( $(this).parents('.matchCon').length > 0 ){  //通配符源配置
                    $(this).parents('.dbZone').find('.oneResult.tabcheck').removeClass('tabcheck');
                    $(this).find('>.oneResult').addClass("tabcheck");
                    var path = $(this).find('>.oneResult').addClass("tabcheck").find('.aDbName').attr('path');
                    $(this).parents('.matchCon').find('.srcSet .moveDir').val( path).attr('title', path);
                }
                else {
                    $(this).find('>.oneResult').toggleClass("tabcheck");
                }
            }
        }
        return false;
    });

    //第一步到第二步
    $(".FileNext").click(function() {
        if( formValit1().flag ) {
            MsgTip("", formValit1().msg, "info");
            return ;
        }

        var sourceDefer = $.Deferred(),
            targetDefer = $.Deferred() ;

        function sourceData(){
            var sourceType = $('.connType').val();
            if ( userMsg.sourceId != $('.linkList').val() && sourceType == 1 ){
                getDir($('.linkList').val(), sourceDefer);
            }
            else if ( sourceType == 2 ){ //临时连接
                var doc = $('.choose-link.source'),
                    tmpLinkData = {},
                    tag = true;

                tmpLinkData['pid'] = $('#userApp').val();
                tmpLinkData['delFlg'] = -1;
                ['host', 'port', 'protocol', 'userName', 'password', 'connName'].map(function(v){
                    tmpLinkData[v] = doc.find('[data-key="'+v+'"]').val().trim();
                    if ( tmpLinkData[v] === '' ){
                        doc.find('[data-key="'+v+'"]').addClass('error');
                        tag = false;
                    }
                    else if ( v === 'port' && !tmpLinkData[v].match(/^\d+$/g) ){
                        doc.find('[data-key="'+v+'"]').addClass('error');
                        tag = false;
                    }
                    else{
                        doc.find('[data-key="'+v+'"]').removeClass('error');
                    }
                });

                if ( !tag )
                    return ;

                if ( JSON.stringify(tmpLinkData) !== userMsg.tmpData ){
                    $.when( getBuckets( tmpLinkData )).done(function(data){
                        getDir( data, sourceDefer );
                    }).fail(function(){
                        sourceDefer.reject();
                    });
                }
                else {
                    sourceDefer.resolve();
                }
            }
            else {
                sourceDefer.resolve();
            }

            function getDir(ftpId, defer){
                $.ajax({
                    url: 'repo/ftp/home',
                    type: 'post',
                    data: {ftpId: ftpId},
                    success: function(data){
                        if ( data.code != 200 ){
                            defer.reject();
                            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                            return ;
                        }

                        $(".leftZone .dbZone").html(template('template/sMeun', {data: data.model}));
                        userMsg.sourceId = ftpId;
                        defer.resolve();
                        editData.toId ? '' : $(".addContentZone .createTab").empty();
                        $(".checkAllLab").removeClass("checkStatus").children("input").attr("checked",false);
                    },
                    error: function(){
                        defer.reject();
                    }
                });
            }
            function getBuckets(param) {
                var defer = $.Deferred();
                $.ajax({
                    url: 'repo/ftp/save',
                    type: 'post',
                    data: param,
                    success: function(data) {
                        if(data.code == -1) {
                            defer.reject();
                            publicFn.ajaxFail();
                            return ;
                        }

                        if( data.code != 200 ) {
                            defer.reject();
                            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                            return ;
                        }
                        defer.resolve( data.model.id );
                        userMsg.tmpData = JSON.stringify(param);
                    },
                    error: function(){
                        defer.reject();
                    }
                });
                return defer.promise();
            }
        }

        function targetData(){
            if ( userMsg.targetId != $('.connId').val() ){
                dirInit( targetDefer );
            }
            else {
                targetDefer.resolve();
            }

            function dirInit(defer){
                $.ajax({
                    url:'hdfs/dir/home',
                    data:{hid:$("#connId").val(),pid:$("#userApp").val()},
                    success:function(data){
                        if ( data.code != 200 ){
                            defer.reject();
                            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                            return ;
                        }

                        $(".thisRoute.startThis").html(data.model).attr('title', data.model).parent().attr('data-base', data.model);
                        $(".firstM .startLi").children(".allMeun")&&$(".firstM .startLi").children(".allMeun").remove();

                        defer.resolve();
                        userMsg.targetId = $('.connId').val();
                        editData.toId? '' : $(".addContentZone .createTab").empty();
                        $(".checkAllLab").removeClass("checkStatus").children("input").attr("checked",false);
                    }
                })
            }
        }

        $(".delayTip").show();
        sourceData();
        targetData();
        $.when( sourceDefer, targetDefer).done(function(){
            $(".uploadFile").hide();
            $(".choiceRoute").show();
        }).always(function(){
            $(".delayTip").hide();
        });
    });

    //上一页
    $(".prevBtn").click(function() {
        var index = $(this).parents('.upload-tab').index();
        $(this).parents('.upload-tab').hide();
        $('.upload-tab').eq(index-1).show();
        if ( index == 1 ) {
            userMsg.ip = $(".ipSite").val();
            userMsg.port = $(".portVal").val();
            userMsg.username = $(".userName").val();
            userMsg.password = $(".password").val();
            pageStatus = true;
        }
    });
    //第二步到第三步
    $('.nextStep').on('click', function(){
        //check
        if ( $(".tabCheckOne").length <= 0 ){
            MsgTip('', common_js_lang['db.info.confTar'], 'info');
            return false;
        }
        var cFlag = false;
        $(".tabCheckOne").each(function() {
            if($(this).parents('.hdfsTr').find(".hdfsMap").html() == "") {
                cFlag = true;
            }
        });
        if ( cFlag ) {
            MsgTip("", common_js_lang['s3.info.configParam'], "info");
            return ;
        }

        $('.upload-tab.choiceRoute').hide();
        $('.upload-tab.importRule').show();
    });
    //左侧列表请求或展开：
    $("body").on("click",".slideUp",function(){
        if($(this).parent(".oneResult").siblings(".childUl").length){
            $(this).parent(".oneResult").siblings(".childUl").slideDown();
            $(this).hide().siblings(".slideDown").show();
        }
        else{
            var id = $('.linkList').val(),
                pathDir=$(this).siblings('.aDbName').attr("path"),
                field = $(this).parent().parent(".oneDataLi").attr("field"),
                $dbName = $('[path="'+pathDir+'"]').parent().parent(),   //同path，目录
                preIndent=parseInt( $(this).parent().parent(".oneDataLi").css("padding-left"))+18,
                sibs=$(this).siblings(".slideDown"),
                $this=$(this);
            getFtpDir(id, pathDir, field, $dbName,preIndent,sibs,$this);
        }
        return false;
    })

    //左侧闭合
    $("body").on("click",".slideDown",function(){
        $(this).hide().siblings(".slideUp").show();
        $(this).parent(".oneResult").siblings(".childUl").slideUp();
        return false;
    })
    //向右迁移源数据
    function transSources(){
        var sources=[];
        if ( $('.confType .radio.cur').attr('data-val') == 1 ) {
            $(".mapRange .leftZone .oneDataLi.tabcheck, .oneResult.tabcheck").each(function () {
                var source = $(this),
                    onceFlag = true;
                if ($('.hdfsTr .hdfsMap[path="' + $(this).find('.aTabName').attr("path") + '"]').length > 0) {
                    onceFlag = false;
                }
                if (onceFlag) {
                    var one = {};
                    if ( !source.hasClass('oneTabLi') ){
                        one.fileName = source.find(".aDbName").attr("path");
                        one.path = source.find(".aDbName").attr("path");
                        one.size = source.find(".aDbName").attr("size");
                        one.field = source.parent().attr("field");
                        one.directory = 1;
                    }
                    else {
                        one.fileName = source.children(".oneResult").children(".aTabName").html();
                        one.path = source.children(".oneResult").children(".aTabName").attr("path");
                        one.size = source.children(".oneResult").children(".tabSize").attr("size");
                        one.field = source.attr("field");
                        one.directory = 0;
                    }
                    sources.push(one);
                }
            });
        }
        else {
            $(".mapRange .leftZone .oneResult.tabcheck").each(function () {
                var source = $(this),
                    onceFlag = true;
                if ($('.hdfsTr .hdfsMap[path="' + $(this).find('.aDbName').attr("path") + '"]').length > 0) {
                    onceFlag = false;
                }
                if (onceFlag) {
                    var one = {},
                        tarDom = source.find(".aDbName") ;
                    one.fileName = tarDom.text();
                    one.path = tarDom.attr("path");
                    one.size = tarDom.attr("size");
                    one.field = source.parent().attr("field");
                    sources.push(one);
                }
            });
        }

        $('.mapRange .dbZone .oneResult.tabcheck, .mapRange .dbZone .oneTabLi.tabcheck').removeClass('tabcheck');
        return sources;
    }

    $("#pointRight").on("click",function(){
        var type = $('.confType .radio.cur').attr('data-val');
        var data=transSources();

        if( data.length+$(".newTr").length<=1000||!$(".newTr") ){
            if(data.length){
                $(".hdfsTable .createTab").append(template("template/hdfsTr",{data:data, type:type}));
                $(".tabCheckAll").prop("checked",false).parent("label").removeClass("checkStatus");
            }
        }else{
            MsgTip("", common_js_lang['s3.info.limit1000'].replace(/\[x\]/, '['+data.length+']').replace(/\[y\]/, '['+$(".newTr").length+']'),"info");
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
    //配置参数
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

    function alhdfsCell()  {
        if(!checked()) {
            MsgTip("",common_js_lang['dump.info.selectTask'], "info");
        }
        else {
            $(".hdfsBox,.maskCell").show();
            if ( $('.confType .radio.cur').attr('data-val') == 2 ) {
                $('.matchCon .abView').hide();
                $('.matchCon .matchExp').val('');
                $('.matchCon .srcPath').hide();
                $('.matchCon .srcSet .radio').removeClass('cur').eq(0).addClass('cur') ;
                $('.matchCon .srcSet .moveDir').val('').attr('title', '');
                $('.matchCon .leftZone').hide();
                $('.mathRoute .tarFileName .radio').removeClass('cur').eq(0).addClass('cur');
                $('.mathRoute .tarFileName .suffix').val( 1 );
                $('.mathRoute .tarRename .radio').removeClass('cur').eq(0).addClass('cur');
                $('.hdfsBox .routeShow .suffixShow, .hdfsBox .routeShow .sameNameAct').hide();
            }
            else {
                $(".hdfsBox .suffixShow").hide();
                $('.hdfsBox .routeShow .sameNameAct').show();
            }
            $(".keep").attr("field", "all");
            $(".routeLabel").each(function(){
                $(this).removeClass("rCheckIcon").children("input").prop("checked",false);
            });
            $('.defaultRoute').val('').attr('title', '');
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

    $("body").on("click", ".oneConfigure", function() {
        $(".keep").attr({"num": $(this).parent().parent().attr("field"), "field": "one"});
        $(".suffixRoute").attr("name", "OK");

        var directory = $(this).parent().siblings(".hdfsMap").attr('directory') || '' ;
        var hdfsRoute = $(this).parent().siblings(".hdfsMap").attr("route") || '';
        $('.routeLabel').removeClass('rCheckIcon').find('input').prop('checked', false);
        $('.mathRoute .allMeun .oneRoute[data-base="'+hdfsRoute+'"]').siblings('.routeLabel').addClass('rCheckIcon').find('input').prop('checked', true);
        $('.defaultRoute').val(hdfsRoute).attr('title', hdfsRoute);

        $('.suffixShow .optionTitle').hide();
        if ( directory == '1' ){
            $('.suffixShow .optionTitle.title2').show();
        }
        else {
            $('.suffixShow .optionTitle.title1').show();
        }

        if ($('.confType .radio.cur').attr('data-val') == 1) {  //勾选
            $('.hdfsBox .routeShow .suffixShow, .hdfsBox .routeShow .sameNameAct').show();
            $(".hdfsBox,.maskCell").show();
            $(".hdfsBox .suffixShow").show();
            var theFile = $(this).parent().siblings(".hdfsMap").attr("file");
            var tarFileHandleType = $(this).parent().siblings(".hdfsMap").attr("tarFileHandleType") || 4;
            $('.sameNameAct .radio[data-val="'+tarFileHandleType+'"]').click();
            if (theFile) {
                $(".suffixRoute").val(theFile);
            }
            else {
                $(".suffixRoute").val($(this).parent().siblings(".hdfs").children(".parseName").html().substr(0, 99));
            }
        }
        else {   // 通配符
            $('.hdfsBox .routeShow .suffixShow, .hdfsBox .routeShow .sameNameAct').hide();
            $('.matchCon .abView').hide();
            $(".hdfsBox,.maskCell").show();
            $('.matchCon .srcPath').show();
            var infoDom = $(this).parent().siblings(".hdfsMap"),
                path = infoDom.attr("path");

            var sourceInfo = infoDom.attr('data-source') ? JSON.parse(infoDom.attr('data-source')) : '',
                tarInfo = infoDom.attr('data-target') ? JSON.parse(infoDom.attr('data-target')) : '';
            //源信息
            $('.matchCon .srcPath .path').html( path );
            $('.matchCon .matchExp').val(sourceInfo.pathPattern || '');
            $('.matchCon .srcSet .radio').removeClass('cur').eq( sourceInfo.srcFileHandleType ? (sourceInfo.srcFileHandleType == 1 ? 0 : 1) : 0).addClass('cur') ;
            $('.matchCon .leftZone').hide();
            if ( sourceInfo.srcFileHandleType == 4 ){
                $('.matchCon .leftZone').show();
                $('.matchCon .leftZone [path="'+sourceInfo.srcFileMoveDir+'"]').parent().parent().click();
            }
            $('.matchCon .srcSet .moveDir').val(sourceInfo.srcFileMoveDir || '').attr('title', sourceInfo.srcFileMoveDir || '');
            $('.viewMatchType .radio').removeClass('cur').eq( +sourceInfo.recursive || 0).addClass('cur');
            //目标信息
            $('.mathRoute .tarFileName .radio').removeClass('cur').eq( sourceInfo.tarRenameType == 3? 1 : 0).addClass('cur');
            $('.mathRoute .tarFileName .suffix').val( sourceInfo.tarRenameFormat || 1 );
            var tarRename = +tarInfo.tarFileHandleType || 4 ;
            $('.mathRoute .tarRename .radio').removeClass('cur');
            $('.mathRoute .tarRename .radio[data-val="'+tarRename+'"]').addClass('cur');
        }
    });

    //配置保存：
    function hdfsAll() { //批量配置hdfs保存参数
        if ( $('.confType .radio.cur').attr('data-val') == 2 ){
            matchAll();
            return ;
        }

        var allHdfs = $(".defaultRoute").val(),
            d=0;
        var tarFileHandleType = $('.sameNameAct .radio.cur').attr('data-val');
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
                            result="";
                        html = html.slice(0, 60);
                        result = (allHdfs + '/'+ html).replace(/\/+/g, '\/');
                        $(this).html(result).attr("title",result).attr({"route":$(".defaultRoute").val(), "file":html, tarFileHandleType:tarFileHandleType})
                            .parents('.hdfsTr').find('.checkStatus .tabCheckOne').click();
                    }
                })
                $(".maskCell,.hdfsBox").hide();
                $(".defaultRoute").val('').attr('title', '');
            }
        });
    }

    function getMatchParam(){
        var sourceObj = {}, tarObj = {} ;
        sourceObj.pathPattern = $('.matchCon .matchExp').val().trim();
        sourceObj.srcFileHandleType = $('.matchCon .srcSet .radio.cur').attr('data-val');
        sourceObj.srcFileMoveDir= sourceObj.srcFileHandleType == 4 ? $('.matchCon .srcSet .moveDir').val().trim() : '';
        if ( sourceObj.pathPattern == '' ){
            MsgTip('', common_js_lang['ftp.info.enterPattern'], 'info');
            return false;
        }

        try {
            new RegExp(sourceObj.pathPattern);
        } catch(e){
            MsgTip("", common_js_lang['client.info.regularErr'], "info");
            return false;
        }

        if ( sourceObj.srcFileHandleType == 4 && sourceObj.srcFileMoveDir == '' ){
            MsgTip('', common_js_lang['ftp.info.moveDir'], 'info');
            return false;
        }
        var route = $('.mathRoute .defaultRoute').val();
        if ( route === '' ){
            MsgTip('', common_js_lang['ftp.info.tarDir'], 'info');
            return false;
        }
        sourceObj.recursive = $('.viewMatchType .radio.cur').data('val') == 2;
        sourceObj.tarRenameType = $('.mathRoute .tarFileName .radio.cur').attr('data-val');
        sourceObj.tarRenameFormat = sourceObj.tarRenameType == 3 ? $('.mathRoute .tarFileName .suffix').val() : '';
        tarObj.tarFileHandleType = $('.mathRoute .tarRename .radio.cur').attr('data-val');
        return {
            source: sourceObj,
            target: tarObj,
            route:route
        }
    }

    function matchAll(){
        var res = getMatchParam();
        if ( !res ) {return ; }
        var sourceObj = res.source,
            tarObj = res.target,
            route = res.route ;

        $.ajax({
            url: 'hdfs/dir/access',
            data: {hdfsId: $("#connId").val(), dir: route, pid: $('#userApp').val()},
            success: function (data) {
                if (data.code == -1) {
                    publicFn.ajaxFail();
                    return;
                }
                if (data.code != 200) {
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return;
                }

                $('.checkOneLab.checkStatus').each(function(i, v){
                    var tr = $(this).parents('.hdfsTr'),
                        pathPattern = tr.find('.matchExp'),
                        hdfsMap = tr.find('.hdfsMap') ;

                    pathPattern.html(sourceObj.pathPattern);
                    hdfsMap.html(route).attr("title", route).attr("route", route).attr('data-source', JSON.stringify(sourceObj))
                        .attr('data-target', JSON.stringify(tarObj));
                    $(v).find('.tabCheckOne').click();
                });
                $(".maskCell,.hdfsBox").hide();
                $(".defaultRoute").val('');
            }
        });
    }

    function matchSingle(){
        var res = getMatchParam();
        if ( !res ) {return ; }
        var sourceObj = res.source,
            tarObj = res.target,
            route = res.route ;

        $.ajax({
            url: 'hdfs/dir/access',
            data: {hdfsId: $("#connId").val(), dir: route, pid: $('#userApp').val()},
            success: function (data) {
                if (data.code == -1) {
                    publicFn.ajaxFail();
                    return;
                }
                if (data.code != 200) {
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return;
                }

                var dataNum = $(".keep").attr("num"),
                    pathDom = $('.createTab .hdfsTr[field="'+dataNum+'"]');
                pathDom.find('.hdfsMap').attr('data-source', JSON.stringify(sourceObj))
                    .attr('data-target', JSON.stringify(tarObj)).attr({'route':route, title:route}).html(route);
                pathDom.find('.matchExp').html( sourceObj.pathPattern );
                $(".maskCell,.hdfsBox").hide();
                $(".suffixRoute").val('');
            }
        });
    }

    function hdfsSingle() { //单独配置hdfs保存参数
        if ( $('.confType .radio.cur').attr('data-val') == 2 ){
            matchSingle();
            return ;
        }
        if($(".defaultRoute").val() && $(".suffixRoute").val().trim() && $(".suffixRoute").attr("name") == "OK") {
            if($(".suffixRoute").val().trim().match(/\s+/g)){
                MsgTip("", common_js_lang['local.info.fileName'],"info");
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
                    var tarFileHandleType = $('.sameNameAct .radio.cur').attr('data-val');
                    $(".newTr").each(function() {
                        if($(this).attr("field") == dataNum) {
                            $(this).children(".hdfsMap").html(fileName).attr("title", fileName);
                            $(this).children(".hdfsMap").attr({"route":$(".defaultRoute").val(), file:name, tarFileHandleType:tarFileHandleType});
                            $(".maskCell,.hdfsBox").hide();
                            $(".defaultRoute").val('').attr('title', '');
                            $(".suffixRoute").val('');
                        }
                    })
                }
            });
        }
        else if($(".defaultRoute").val() && $(".suffixRoute").val().trim() && $(".suffixRoute").attr("name") == "NO") {
            MsgTip("", common_js_lang['local.info.fileName'], "info");
        }
        else if($(".defaultRoute").val() == "" || $(".suffixRoute").val() == "") {
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
            if($("#uploadSite").val() == 0) {
                hdfsAll();
            }
        } else {
            if($("#uploadSite").val() == 0) {
                hdfsSingle();
            }
        }
    })

    //radio切换
    $('.srcSet, .tarDir, .viewMatchType, .sameNameAct').on('click', 'label', function(){
        if ( $(this).find('.radio.cur').length == 1 )
            return false;

        $(this).parent().find('.radio.cur').removeClass('cur');
        $(this).find('.radio').addClass('cur');

        if ( $(this).find('.moveDir').length == 1 ){
            $('.matchMainCon .leftZone').show();
        }
        else if ( $(this).parents('.srcSet').length == 1 ){
            $('.matchMainCon .leftZone').hide();
        }
    });

    //预览
    $('.preView').on('click', function(){
        var pattern = $('.matchCon .matchExp').val(),
            recursive = $('.matchCon .viewMatchType .radio.cur').data('val') == 2,
            srcPath = $('.srcPath .path').text() || '' ;
        if ( $('.keep').attr('field') === 'all' ){  //批量配置
            var srcPathArr = [];
            $('.createTab .checkOneLab.checkStatus').map(function(i, v){
                srcPathArr.push( $(v).parents('.hdfsTr').find('.hdfs span').attr('title') );
            });
            srcPath = srcPathArr.join(',');
        }

        if ( !pattern ){
            MsgTip('', common_js_lang['ftp.info.enterPattern'], 'info');
            return false;
        }

        var self = $(this),
            param = {dir:srcPath, pattern: pattern, ftpId:userMsg.sourceId, recursive:recursive, type:1};
        if ( self.attr('data-tag') === JSON.stringify(param) ){
            $('.matchCon .abView').show();
            return ;
        }

        var loadingInter = setTimeout(function(){$(".delayTip").show();}, 2000);
        $.ajax({
            url: 'repo/ftp/files',
            data:param,
            success: function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                var dataModel = [],
                    tmpTag = {dir:'', data:[]},
                    maxLen = data.model.length ;
                data.model.map(function(v, i){
                    if (v.directory ) {
                        if ( i == maxLen -1 && tmpTag.dir != '' )
                            dataModel.push(tmpTag);
                        return;
                    }
                    var arr = v.path.split('/'),
                        dir = arr.slice(0,-1).join('/'),
                        name = arr.slice(-1).join('/') ;
                    if ( dir != tmpTag.dir ){
                        if ( tmpTag.dir ){
                            dataModel.push(tmpTag);
                            tmpTag = {dir:'', data:[]};
                        }
                        tmpTag.dir = dir;
                        tmpTag.data = [];
                    }
                    tmpTag.data.push( name );
                    if ( i == maxLen -1 && tmpTag.dir != '' )
                        dataModel.push(tmpTag);
                });

                self.attr('data-tag', JSON.stringify(param));
                $('.matchCon .abView').html( template('template/preView', {data:dataModel})).show();
            },
            complete: function(){
                clearTimeout( loadingInter );
                $('.delayTip').hide();
            }
        });
    });

    $('.abView').on('click', '.main h4', function(){
        var index = $(this).attr('data-index');
        $('.fileList[data-index="'+index+'"]').slideToggle();
        $(this).find('.toggle').html($(this).find('.toggle').html() == '-' ? '+' : '-');
    });
    $('.abView').on('click', '.head .cancel', function() {
        $('.abView').hide();
    });

    //获取hdsf
    function getDir(hid,$this, aRoute, preIndent) {
        var timer = setTimeout(function(){
            $('.delayTip').show();
        }, 2000);

        $.ajax({
            url: 'hdfs/dir/list',
            data: {
                hid:hid,
                base: aRoute,
                pid: $('#userApp').val()
            },
            success: function(data) {
                if(data.code == -1) {
                    publicFn.ajaxFail();
                    return ;
                }
                if(data.code == 200) {
                    $this.addClass('got');
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
                            $('.menuZone .oneRoute[data-base="'+aRoute+'"]').parent().append($ul);
                            var icon = $('.menuZone .oneRoute[data-base="'+aRoute+'"]').find('.turnOff');
                            //图标显示：
                            if($this.attr("field")) {
                                icon.hide().siblings(".turnOn").show();
                            } else {
                                if($this.parent().siblings().length > 0) {
                                    icon.hide().siblings(".turnOn").show();
                                } else {
                                    icon.hide().siblings(".turnOn").hide();
                                }
                            }
                        }
                    }
                    else {
                        var icon = $('.menuZone .oneRoute[data-base="'+aRoute+'"]').find('.turnOff');
                        icon.parent().attr("status","ok");
                        icon.hide();
                        icon.siblings(".turnOn").hide();
                    }
                }
                else {
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                }
            },
            complete:function(){
                $this.removeClass('got');
                clearTimeout(timer);
                $(".delayTip").hide();
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
        if($(this).parent().siblings(".allMeun").length == 0 ) {
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
        $(this).parents('.allMeun').find('.routeLabel.rCheckIcon').removeClass('rCheckIcon');
        $(this).addClass("rCheckIcon");
        var oneRoute = $(this).siblings(".oneRoute").attr('data-base');
        var tarDom = $('.defaultRoute');
        if ( $(this).parents('.menuZone').hasClass('hdfsMoveDir') ){
            tarDom = $('.matchCon .moveDir');
        }
        tarDom.val(oneRoute).attr('title', oneRoute);
    })
    //任务导入：
    $(".startImport").click(function() {
        var cronGlobalParam = cronExport.cronExec($('.group-type .cur').index(), true);
        if ( !cronGlobalParam.cronParam || [0, 1, 2].indexOf(+cronGlobalParam.periodType) == -1 ){
            $(this).prop('disabled', false);
            $('.delayTip').css({display: 'none'});
            return false;
        }

        var taskName = $(".configTask .taskName").val().trim(),
            taskDes = $(".configTask .taskDes").val().trim(),
            pid = $('#userApp').val(),
            hid = $('#connId').val(),
            ftpId = userMsg.sourceId,
            usePattern = $('.confType .radio.cur').attr('data-val') == 2 ;

        var param = {
            pid : pid,
            jobName: taskName,
            note: taskDes,
            toType: 8,
            fromId: ftpId,
            toId: hid,
            periodType: cronGlobalParam.periodType,
            cronExpression: cronGlobalParam.cronParam,
            startTimeStr: cronGlobalParam.startTimeStr || '',
            endTimeStr: cronGlobalParam.endTimeStr || ''
        } ;

        var fromJson = [],
            toHdfsJson=[];
        $(".tabCheckOne").each(function() {
            var dom = $(this).parents('.hdfsTr').find('.hdfsMap');
            var one = {};
            one.ftpId= ftpId;
            one.filePath = dom.attr("path");
            one.size = dom.attr("size");
            one.usePattern = usePattern;
            var directory = dom.attr('directory') || '';
            if ( directory ) {
                one.directory = dom.attr('directory') == '1' ? true : false;
            }
            var two = {};
            two.hid = hid;
            two.fileName = dom.attr('title');
            two.tarFileHandleType = dom.attr('tarFileHandleType');

            if ( usePattern ){
                var sourceObj = JSON.parse(dom.attr('data-source')),
                    tarObj = JSON.parse(dom.attr('data-target'));
                sourceObj.tarRenameFormat = ['' ,'_yyyyMMdd', '_yyyyMMdd_HHmmss'][+sourceObj.tarRenameFormat];
                $.extend(one, sourceObj);
                $.extend(two, tarObj);
            }
            fromJson.push(one);
            toHdfsJson.push(two);
        });
        param.fromJson = JSON.stringify(fromJson);
        param.toHdfsJson = JSON.stringify(toHdfsJson);
        hdfsTask(param);
    });
    //开始任务
    function hdfsTask( param ) {
        $.ajax({
            url: 'job/ftp/save',
            type: 'post',
            data: param,
            beforeSend: function() {
                $(".delayTip").show();
            },
            success: function(data) {
                if (data.code == 200) {
                    window.onbeforeunload = function () {
                        return
                    };
                    location.href = "./success"
                }
                else if (data.code == -1) {
                    publicFn.ajaxFail();
                }
                else {
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                }
            },
            complete: function() {
                $(".delayTip").hide();
            }
        })
    }
    $(".startManage").click(function() {
        var taskName = $("#dTaskName").val().trim(),
            taskDec = $(".taskDescribe").val();
        var fromJson = [],
            toHdfsJson=[];
        $(".tabCheckOne").each(function() {
            var one = {};
            one.ftpId=$(".dbZone").attr("id");
            one.filePath = $(this).parent().parent().siblings(".hdfsMap").attr("path");
            one.size = $(this).parent().parent().siblings(".hdfsMap").attr("size");
            fromJson.push(one);
            var two={};
            two.hid=$("#connId").val();
            two.fileName=$(this).parent().parent().siblings(".hdfsMap").html();
            toHdfsJson.push(two);
        });

        fromJson=JSON.stringify(fromJson);
        toHdfsJson=JSON.stringify(toHdfsJson);
        var pid=$("#userApp").val();
        hdfsTask(pid, taskName, taskDec, fromJson,toHdfsJson);
    });
}

function eventBind() {

    window.onbeforeunload = function(){
        if ( $('.taskName').val().trim() || $('.mapTaskMsg .taskDescribe').val().trim() || $('.mapTaskMsg .ipSite').val().trim() || $('.mapTaskMsg .portVal').val().trim() || $('.mapTaskMsg .userName').val().trim() || $('.mapTaskMsg .password').val().trim() )
            return common_js_lang['common.info.leavePage'];
        return ;
    };

    //右侧全选
    $(".tabCheckAll").click(function() {
        if($(".addContentZone").children().length == 0) {
            //MsgTip("", "Empty", "info");
            return ;
        } else {
            var allStatus = $(this).prop("checked");
            $(".hdfsTr .tabCheck").prop("checked", allStatus);
            if(allStatus) {
                $(this).parent("label").addClass("checkStatus");
                $(".hdfsTr .tabCheck").parent("label").addClass("checkStatus");
            } else {
                $(this).parent("label").removeClass("checkStatus");
                $(".hdfsTr .tabCheck").parent("label").removeClass("checkStatus");
            }
        }
    })
    $("body").on("click", ".hdfsTr .tabCheck", function() {
        var checkFlag = true;
        $(".hdfsTr .tabCheck").each(function() {
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
    $("body").on("click", ".tabCheckOne", function() {
        var oneStatus = $(this).prop("checked");
        if(oneStatus) {
            $(this).parent("label").addClass("checkStatus");
        } else {
            $(this).parent("label").removeClass("checkStatus");
        }
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
    //取消返回主页
    $(".CancelBtn").click(function(){
        location.href="./";
    })
    $(".createCancel").click(function() {
        $(".maskCell").hide();
        $(".createTabTip").hide();
    })
    //弹窗关闭
    $(".closeMap").click(function() {
        $(".suffixRoute").removeClass("redWord");
        $(".hdfsBox,.maskCell").hide();
    })
    $(".cancelKeep").click(function() {
        $(".suffixRoute").removeClass("redWord");
        $(".hdfsBox,.maskCell").hide();
    })
    $(".createCancel").click(function() {
        $(".maskCell").hide();
        $(".createTabTip").hide();
    })
    $(".password").on("copy paste",function(e){//密码框禁止copy、paste
        e.preventDefault();
    })
    $("#pointLeft,#pointRight").on("mouseenter",function(){
        $(this).children(".lost").hide().siblings(".select").show();
    }).on("mouseleave",function(){
        $(this).children(".lost").show().siblings(".select").hide();
    })
}

function init(data) {
    businessFn(data);
    eventBind();
}
$.when( copyEdit() ).then(function(data){
    init(data);
}).fail(function(){
    init('');
});

function copyEdit() {
    var defer = $.Deferred();

    var globalParam = {
        urlObj: {}
    };
    var urlParam = location.search.replace(/^\?|\?$/g, '').split('&');
    for (var i = 0, len = urlParam.length; i < len; i++) {
        var obj = urlParam[i].split('=');
        globalParam.urlObj[obj[0]] = obj[1] || '';
    }

    if ( globalParam.urlObj.copy && globalParam.urlObj.id > 0 ){
        $('.delayTip').show();
        $.ajax({
            url: 'job/detail?jobId=' + globalParam.urlObj.id,
            success: function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    defer.reject();
                    return ;
                }
                data.model.jobName = (data.model.jobName+'_copy').slice(0,60);

                var delTip = '';
                if ( !data.model.fromObject ){
                    delTip += common_js_lang['conf.info.srcNull'];
                }
                if ( !data.model.toObject ){
                    delTip += (delTip ? '<br>':'')+common_js_lang['conf.info.tarNull'];
                }
                delTip ? MsgTip('info', delTip, 5000) : '';

                defer.resolve(data.model);
            },
            error: function(){
                defer.reject();
            },
            complete:function(){
                $('.delayTip').hide();
            }
        });
    }
    else {
        defer.reject();
    }
    return defer.promise();
}