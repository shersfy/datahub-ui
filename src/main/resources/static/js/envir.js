;$(function() {
    $('.setUpData .tooltip').tipsy({fade: true,gravity:'s',html:true});

    function configModule(param){
        this.container = param.container;
        this.event();
        this.getHdfsType();
    }
    configModule.prototype = {
        event: function(){
            var _this = this;
            _this.container.on('change', '.linkType', function(){
                var type = _this.container.find(".linkType option:selected").text();
                _this.container.find(".setUpData .data").hide();
                _this.container.find(".setUpData ." + type).show();
                _this.container.find(".setUpData .connName").show();
                if ( !adminConfigData.ha ){
                    var hiveUrl = _this.container.find('.hiveUrl.editB'),
                        field = hiveUrl.attr('field');
                    if ( type == 'kerberos' ){
                        hiveUrl.val(field+';principal=hive/_HOST@LEAP.COM').attr('title', field+';principal=hive/_HOST@LEAP.COM');
                    }
                    else {
                        hiveUrl.val(field).attr('title', field);
                    }
                }
            });

            //url改动input的title属性
            _this.container.find(".hiveUrl").on("input propertychange", function() {
                $(this).attr("title", $(this).val().trim())
            })
            _this.container.find(".simple.url .editB").on("input propertychange", function() {
                $(this).attr("title", $(this).val().trim())
            })
            _this.container.find(".sentry.url .editB").on("input propertychange", function() {
                $(this).attr("title", $(this).val().trim())
            })

            _this.container.find("input.editB").on("blur", function() {
                if($(this).val().trim().match(/\s+/g)) {
                    $(this).addClass("errorBack");
                } else {
                    $(this).removeClass("errorBack");
                }
            })
            _this.container.find("input.hiveUrl,input.hiveUser").on("blur", function() {
                if($(this).val().trim().match(/\s+/g)) {
                    $(this).addClass("errorBack");
                } else {
                    $(this).removeClass("errorBack");
                }
            });

            _this.container.find(".editBtn").click(function() {
                var type = _this.container.find(".linkType option:selected").text();
                _this.container.find(".setUpData .editB").attr("readonly", false);
                _this.container.find(".setUpData .row .editB").removeClass("displayNone");
                _this.container.find(".setUpData ." + type).children(".editB").eq(0).focus();
                _this.container.find(".hiveUrl").show().attr("readonly", false);
                _this.container.find(".hiveUser").show().attr("readonly", false);
                _this.container.find(".setUpData .row.btnZone").show();
                _this.container.find(".setUpData .row .show").addClass("displayNone");
            })

            //取消设置：
            _this.container.find(".cancelSet").click(function() {
                var type = $(this).attr("field");
                _this.container.find(".setUpData .data").hide();
                _this.container.find(".setUpData .row." + type).show().children(".show").removeClass("displayNone");
                _this.container.find(".setUpData .connName").show();
                _this.container.find(".setUpData .row .editB").each(function() {
                    $(this).addClass("displayNone");
                    if($(this).attr("field")) {
                        $(this).val($(this).attr("field"));
                    } else {
                        $(this).val("");
                    }
                });
                _this.container.find(".hiveUrl").attr('title', $('.hiveUrl').attr('field') ).hide().siblings(".show").removeClass("displayNone");
                _this.container.find(".hiveUser").hide().siblings(".show").removeClass("displayNone");
                var value = 0;
                if(type == "kerberos") {
                    value = 2;
                } else if(type == "sentry") {
                    value = 3;
                } else {
                    value = 1;
                }
                _this.container.find(".setUpData .row.all .linkType").val(value).siblings(".show").removeClass("displayNone");
                _this.container.find(".setUpData .row.btnZone").hide();
            });

            _this.container.find(".keepData").click(function() {
                if(!_this.container.find(".hiveUrl").val().trim()) {
                    MsgTip("", common_js_lang['dbManage.info.hiveurlErr'], "info");
                    return false;
                }
                if(!_this.container.find(".hiveUser").val().trim()) {
                    MsgTip("", common_js_lang['dbManage.info.hiveuserErr'], "info");
                    return false;
                }
                if(_this.container.find(".hiveUrl").val().trim().match(/\s+/g) || _this.container.find(".hiveUser").val().trim().match(/\s+/g)) {
                    MsgTip("", common_js_lang['dbManage.info.spaceErr'], "info");
                    return false;
                }
                var authType = _this.container.find(".linkType").val(),
                    hiveUrl = _this.container.find(".hiveUrl").val().trim(),
                    proxyUser = _this.container.find(".hiveUser").val().trim();
                if(authType == 2) {
                    var keytab = _this.container.find(".keytabPath .editB").val().trim(),
                        krb5Path = _this.container.find(".krb5Path .editB").val().trim(),
                        principal = _this.container.find(".kerberos.port .editB").val().trim(),
                        hdfsSiteXml = _this.container.find(".kerberos.url .editB").val().trim(),
                        coreSiteXml = _this.container.find(".kerberos.core .editB").val().trim();
                    if(krb5Path.match(/\s+/g) || keytab.match(/\s+/g) || principal.match(/\s+/g) || hdfsSiteXml.match(/\s+/g) || coreSiteXml.match(/\s+/g)) {
                        MsgTip("", common_js_lang['dbManage.info.spaceErr'], "info");
                        return false;
                    }
                    if(krb5Path && keytab && principal && hdfsSiteXml && coreSiteXml) {
                        var dataA={};
                        dataA.authType=authType;
                        dataA.krb5Conf = krb5Path;
                        dataA.keytab=keytab;
                        dataA.principal=principal;
                        dataA.hiveUrl=hiveUrl;
                        dataA.proxyUser=proxyUser;
                        dataA.hdfsSiteXml=hdfsSiteXml;
                        dataA.coreSiteXml=coreSiteXml;
                        dataA.password = _this.container.find('.pwd.editB').val().trim();
                        dataA.oldpwd = _this.container.find('.pwd.editB').attr('old-pwd') || '';
                        _this.save(dataA);
                    } else if(!keytab) {
                        MsgTip("", common_js_lang['dbManage.info.keytabErr'], "info");
                        return false;
                    } else if(!userName) {
                        MsgTip("", common_js_lang['dbManage.info.kerberosErr'], "info");
                        return false;
                    } else if(!hdfsSiteXml) {
                        MsgTip("", "kerberos "+common_js_lang['dbManage.info.hdfsErr'], "info");
                        return false;
                    } else if(!coreSiteXml) {
                        MsgTip("", "kerberos "+common_js_lang['dbManage.info.coresiteErr'], "info");
                        return false;
                    }
                    return false;
                } else if(authType == 3) {
                    var hdfsSiteXml = _this.container.find(".sentry.url .editB").val().trim(),
                        coreSiteXml = _this.container.find(".sentry.core .editB").val().trim();
                    if(hdfsSiteXml.match(/\s+/g) || coreSiteXml.match(/\s+/g)) {
                        MsgTip("", common_js_lang['dbManage.info.spaceErr'], "info");
                        return false;
                    }
                    if(hdfsSiteXml && coreSiteXml) {
                        var dataB={};
                        dataB.authType=authType;
                        dataB.hiveUrl=hiveUrl;
                        dataB.proxyUser=proxyUser;
                        dataB.hdfsSiteXml=hdfsSiteXml;
                        dataB.coreSiteXml=coreSiteXml;
                        dataB.password = _this.container.find('.pwd.editB').val().trim();
                        dataB.oldpwd = _this.container.find('.pwd.editB').attr('old-pwd') || '';
                        _this.save(dataB);
                    } else if(!hdfsSiteXml) {
                        MsgTip("", "sentry "+common_js_lang['dbManage.info.hdfsErr'], "info");
                        return false;
                    } else if(!coreSiteXml) {
                        MsgTip("", "sentry "+common_js_lang['dbManage.info.coresiteErr'], "info");
                        return false;
                    }
                    return false;
                } else {
                    var hdfsSiteXml = _this.container.find(".simple.url .editB").val().trim(),
                        coreSiteXml = _this.container.find(".simple.core .editB").val().trim(),
                        userName = _this.container.find(".simple.userName .editB").val().trim();
                    if(hdfsSiteXml.match(/\s+/g) || userName.match(/\s+/g) || coreSiteXml.match(/\s+/g)) {
                        MsgTip("", common_js_lang['dbManage.info.spaceErr'], "info");
                        return false;
                    }
                    if(hdfsSiteXml && coreSiteXml && userName) {
                        var dataC={};
                        dataC.authType=authType;
                        dataC.userName=userName;
                        dataC.hiveUrl=hiveUrl;
                        dataC.proxyUser=proxyUser;
                        dataC.hdfsSiteXml=hdfsSiteXml;
                        dataC.coreSiteXml=coreSiteXml;
                        dataC.password = _this.container.find('.pwd.editB').val().trim();
                        dataC.oldpwd = _this.container.find('.pwd.editB').attr('old-pwd') || '';
                        _this.save(dataC);
                    } else if(!hdfsSiteXml) {
                        MsgTip("", "simple "+common_js_lang['dbManage.info.hdfsErr'], "info");
                        return false;
                    } else if(!coreSiteXml) {
                        MsgTip("", "simple "+common_js_lang['dbManage.info.coresiteErr'], "info");
                        return false;
                    } else if(!userName) {
                        MsgTip("", "HDFS"+common_js_lang['dbManage.info.userErr'], "info");
                    }
                }
            })
        },
        save: function(data) {
            $.ajax({
                url: 'env/hdfs/system/save',
                data:data,
                beforeSend: function() {
                    $(".delayTip").show();
                },
                type: 'post',
                success: function(data) {
                    if(data.code == 200) {
                        $(".setUpData .row.btnZone").hide();
                        location.reload();
                    }
                    else if ( data.code == -1 ) {
                        swal({
                            title: '',
                            text: common_js_lang["manage.info.timeout"],
                            type: 'info',
                            showCancelButton: true,
                            confirmButtonText: common_js_lang['manage.info.newdow'],
                            cancelButtonText: common_js_lang['manage.info.tologin']
                        }, function(isConfirm) {
                            if(!isConfirm)
                                location.href = './';
                            else
                                window.open('./', '_blank');
                        });
                        return false;
                    }
                    else {
                        data.msg.length>0 ? ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg) : MsgTip("", common_js_lang['dbManage.info.saveErr'], "info");
                    }
                },
                complete: function() {
                    $(".delayTip").hide();
                }
            })
        },
        getHdfsType: function(){
            var _this = this;
            $.ajax({
                url: 'env/hdfs/system/auth/types',
                success:function(data){
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        _this.getMsgH();
                        return ;
                    }
                    var typeHtml = '';
                    data.model.map(function(v,i){
                        var type = JSON.parse( v );
                        typeHtml += '<option value="'+ type.index+'">'+ type.alias+'</option>';
                    });
                    _this.container.find('.setUpData .linkType').html(typeHtml);
                    _this.getMsgH();
                }
            });
        },
        getMsgH: function(){
            if ( adminConfigData ){
                adminConfigData.hdfs.krb5Conf = adminConfigData.hdfs.krb5Conf || '/etc/krb5.conf';
                adminConfigData.hdfs.keytab = adminConfigData.hdfs.keytab || '/etc/krb5.conf';
                adminConfigData.hdfs.principal = adminConfigData.hdfs.principal || 'datahub@LEAP.COM';

                this.hdfsShow( adminConfigData.hdfs );
                this.hiveShow( adminConfigData.hive );
            }
            else {
                MsgTip("", common_js_lang['dbManage.info.confNone'], "info");
            }
        },
        hdfsShow: function(data) {
            var _this = this;
            _this.container.find(".setUpData .row.all").show();
            _this.container.find(".setUpData .connName").show();
            _this.container.find(".setUpData .url").children(".editB").val(data.hdfsSiteXml).attr("field", data.hdfsSiteXml).siblings(".show").html(data.hdfsSiteXml).attr("title", data.hdfsSiteXml);
            _this.container.find(".setUpData .core").children(".editB").val(data.coreSiteXml).attr("field", data.coreSiteXml).siblings(".show").html(data.coreSiteXml).attr("title", data.coreSiteXml);

            _this.container.find(".setUpData .kerberos.krb5Path").children(".editB").val(data.krb5Conf).attr("field", data.krb5Conf).siblings(".show").html(data.krb5Conf).attr("title", data.krb5Conf);
            _this.container.find(".setUpData .kerberos.keytabPath").children(".editB").val(data.keytab).attr("field", data.keytab).siblings(".show").html(data.keytab).attr("title", data.keytab);
            _this.container.find(".setUpData .kerberos.port").children(".editB").val(data.principal).attr("field", data.principal).siblings(".show").html(data.principal).attr("title", data.principal);

            _this.container.find(".setUpData .connName").children(".conName").html(data.connName).attr("title", data.connName);

            if(data.authType == 2) {
                _this.container.find(".setUpData .row.all .linkType").val(2);
                _this.container.find(".setUpData .row.all .show").html("kerberos");
                _this.container.find(".cancelSet").attr("field", "kerberos");
                _this.container.find(".setUpData .row.kerberos").show();
            } else if(data.authType == 3) {
                _this.container.find(".setUpData .row.all .linkType").val(3);
                _this.container.find(".setUpData .row.all .show").html("sentry");
                _this.container.find(".cancelSet").attr("field", "sentry");
                _this.container.find(".setUpData .row.sentry").show();
                _this.container.find(".setUpData .sentry.userName").children(".editB").val(data.userName).attr("field", data.userName).siblings(".show").html(data.userName).attr("title", data.userName);
            } else if(data.authType == 1) {
                _this.container.find(".setUpData .row.all .linkType").val(1);
                _this.container.find(".setUpData .row.all .show").html("simple");
                _this.container.find(".cancelSet").attr("field", "simple");
                _this.container.find(".setUpData .row.simple").show();
                _this.container.find(".setUpData .simple.userName").children(".editB").val(data.userName).attr("field", data.userName).siblings(".show").html(data.userName).attr("title", data.userName);
            }
            _this.container.find(".setUpData .row .editB").addClass("displayNone");
        },
        hiveShow: function(data) {
            var _this = this;
            if(data.url) {
                _this.container.find(".hUrl .hiveUrl").val(data.url).attr("field", data.url).attr("title", data.url).siblings(".show").html(data.url).attr("title", data.url);
            }
            if(data.userName) {
                _this.container.find(".hUser .hiveUser").val(data.userName).attr("field", data.userName).siblings(".show").html(data.userName).attr("title", data.userName);
            }

            if ( data.password ){
                _this.container.find(".hivePwd .pwd").val(data.password).attr({"field":data.password, 'old-pwd':data.password}).siblings(".show").html('');
            }
            if(data.connName) {
                _this.container.find(".hconn .hiveConn").html(data.connName).attr("title", data.connName);
            }
            _this.container.find(".setUpData .row.hive").show();
        }
}
    new configModule({container:$('.upload-tab.uploadFile')});


    $('nav').on('click', '.tab', function(){
        if ( $(this).hasClass('cur') )
            return false;
        var index = $(this).index();
        $(this).addClass('cur').siblings('.tab').removeClass('cur');
        $('.upload-tab').hide().eq(index).show();
    });

    function smsModule(param){
        this.container = param.container;
        this.event();
        this.getServer();
    }

    smsModule.prototype = {
        event: function(){
            var _this = this;
            //案例
            _this.container.on('click', '.example', function(){
                _this.container.find('.exampleCon').show();
            });

            _this.container.on('click', '.exampleCon .close', function() {
                _this.container.find('.exampleCon').hide();
            });

            _this.container.on('click', '.editBtn', function(){
                _this.container.find(".content.setUpData .row.btnZone, .addParam").show();
                _this.container.find(".content.setUpData .row .show").addClass("displayNone");
                _this.container.find(".content.setUpData .row .editB").show();
                _this.container.find('.content .params input').prop('disabled', false);
            });

            //取消操作-还原数据
            _this.container.find(".cancelSet").click(function() {
                _this.container.find(".content.setUpData .row .show").removeClass("displayNone");
                ['url', 'phoneNumberKey', 'contentKey'].map(function(v){
                    var input = _this.container.find('[data-key="'+v+'"]'),
                        field = input.siblings('.show').attr('field') || '';
                    input.val(field);
                    input.hide();
                });
                var params = _this.container.find('.params').attr('field');
                _this.setParams(params);
                _this.container.find(".content.setUpData .row.btnZone, .content .addParam").hide();
            });

            _this.container.on('click', '.addParam', function(){
                $(this).siblings('.flex').append(_this.paramItem());
            });

            //保存配置
            _this.container.on('click', '.keepData', function() {
                var data = _this.getData();
                if ( !data ){
                    return ;
                }
                _this.save(data);
            });

            _this.container.on('click', '.testConnect', function() {
                testPhone.testShow();
            });
        },
        getData: function(){
            var _this = this;
            var data = {providerType: 0};
            ['url', 'phoneNumberKey', 'contentKey'].map(function(v){
                var val = _this.container.find('[data-key="'+v+'"]').val().trim() || '';
                if ( !val ){
                    MsgTip('', common_js_lang['envir.tip.keyErr']);
                    return ;
                }
                data[v] = val;
            });

            var paramDom = _this.container.find('.content .params input'),
                params = {},
                tag = 0;
            for ( var i= 0,len=paramDom.length; i<len; i+=2 ){
                var key = paramDom.eq(i).val().trim(),
                    val = paramDom.eq(i+1).val().trim() ;
                if ( [key].indexOf('') > -1 ){
                    continue ;
                }
                params[key] = val ;
                tag ++ ;
            }
            if ( !tag ){
                MsgTip('', common_js_lang['envir.tip.keyErr']);
                return ;
            }
            data.params = JSON.stringify(params);
            return data;
        },
        save: function(data){
            $(".delayTip").show();
            $.ajax({
                url: 'env/sms/save',
                data: data,
                success: function(data){
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }
                    location.reload();
                },
                complete: function(){
                    $(".delayTip").hide();
                }
            })
        },
        getServer: function(){
            var _this = this;
            $.ajax({
               url: 'env/sms/server',
                success: function(data){
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }

                    ['url', 'phoneNumberKey', 'contentKey'].map(function(v){
                        var field = data.model[v] || '';
                        var input = _this.container.find('[data-key="'+v+'"]');
                        input.val(field);
                        input.siblings('.show').html(field).attr('field', field);
                    });
                    _this.container.find(".content .addParam").hide();
                    _this.container.find('.content .params').attr('field', data.model.paramsJson ? JSON.stringify(data.model.paramsJson) : '' );
                    _this.setParams(JSON.stringify(data.model.paramsJson));
                }
            });
        },
        setParams: function(params){
            var _this = this;
            if ( params ){
                var params = JSON.parse( params );
                var html = _this.paramHead();
                for ( var k in params ){
                    html += _this.paramItem(k, params[k]);
                }
                _this.container.find('.content .params .flex').html(html);
            }
            else {
                var init = _this.paramHead() + _this.paramItem() ;
                _this.container.find('.content .params .flex').html(init);
            }
            _this.container.find('.content .params input').prop('disabled', true);
        },
        paramHead: function(){
            return '<div class="head flex-item">' +
                '<span class="item">key</span>' +
                '<span class="item">'+common_js_lang['dbManage.title.val']+'</span>' +
                '</div>';
        },
        paramItem: function(key, val){
            key = key || '';
            val = val || '';
            return '<div class="flex-item">' +
            '<span class="item"><input type="text" value="'+key+'" /></span>' +
            '<span class="item"><input type="text" value="'+val+'" /></span>' +
            '</div>' ;
        }
    }

    var sms = new smsModule({container:$('.upload-tab.smsConfig')});

    function testPhoneModule(){
        this.container = $('.globalCon');
        this.event();
    }

    testPhoneModule.prototype = {
        event: function(){
            var _this = this;

            _this.container.on('click', '.cancel', function(){
                _this.container.hide();
                _this.container.find('input').val('');
            });

            _this.container.on('click', '.btn-item', function() {
                var data = sms.getData();
                if ( !data ){
                    return ;
                }
                var testPhone = _this.container.find('input').val().trim();
                if ( !testPhone.match(/^1[0-9]{10}$/) ){
                    MsgTip('info', common_js_lang['rule.tip.notifyUserErr']);
                    return ;
                }

                data.testPhone = testPhone;
                $(".delayTip").show();
                $.ajax({
                    url: 'env/sms/save',
                    data: data,
                    success: function(data){
                        if ( data.code != 200 ){
                            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                            return ;
                        }

                        MsgTip('success', common_js_lang['db.text.testSuc']);

                        _this.container.hide();
                        _this.container.find('input').val('');
                    },
                    complete: function(){
                        $(".delayTip").hide();
                    }
                })
            });
        },
        testShow: function(){
            this.container.show();
        }
    };

    var testPhone = new testPhoneModule();

    function streamSets(param){
        this.container = param.container ;
        this.event() ;
        this.init() ;
    }
    streamSets.prototype = {
        event: function(){
            var _this = this;
            _this.container.on('click', '.editBtn', function(){
                _this.container.find(".setUpData .row.btnZone").show();
                _this.container.find(".setUpData .row .show").addClass("displayNone");
                _this.container.find(".setUpData .row .editB").show();
                _this.container.find('.params input').prop('disabled', false);
            });

            //取消操作-还原数据
            _this.container.find(".cancelSet").click(function() {
                _this.container.find(".setUpData .row .show").removeClass("displayNone");
                var input = _this.container.find('input.editB'),
                    field = input.siblings('.show').attr('field') || '';
                input.val(field);
                input.hide();
                _this.container.find(".setUpData .row.btnZone").hide();
            });

            //保存配置
            _this.container.on('click', '.keepData', function() {
                var input = _this.container.find('input.editB'),
                    field = (input.val() || '').trim();
                if ( !field ){
                    return ;
                }
                _this.save({url:field});
            });
        },
        init: function(){
            var _this = this,
                input = _this.container.find('input.editB'),
                field =  adminConfigData.sdc;
            input.val(field);
            input.siblings('.show').html(field).attr('field', field);
        },
        save: function(data){
            $(".delayTip").show();
            $.ajax({
                url: 'env/sdc/save',
                data: data,
                type: 'post',
                success: function(data){
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }
                    location.reload();
                },
                complete: function(){
                    $(".delayTip").hide();
                }
            })
        }
    }
    new streamSets({container: $('.upload-tab.streamSets')})
});