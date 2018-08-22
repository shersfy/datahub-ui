
String.prototype.trim = function(){
    try {
        return this.replace(/^\s+|\s+$/g, '');
    } catch(e){
        return '';
    }
}

;$(function(){
    $('body').on('change', 'select', function(){
      $(this).blur();
    });
    $('body').on('click', 'button', function(){
      $(this).blur();
    });
    $('body').on('change', 'input[type="radio"]', function(){
      $(this).blur();
    });
});


function setLocalLang(lang, refresh){
    var loading = setTimeout(function() {
        var loadCon = "<div id='loadCon' style='position:fixed;z-index:99 ;height:100%;width:100%;top:0;left:0; background:rgba(255,255,255, .3);'><div style='width:20%;margin:20% 40%;text-align:center;height:80px;line-height:80px;'><img src='resources/dist/images/loading.gif'></div></div>" ;
        if($('#loadCon').length == 0)
            $('body').append(loadCon);
    }, 2000);

  $.ajax({
    url: 'leapid/language/set',
    type: 'post',
    data: {lang: lang, timestamp:Date.now()},
    success: function(data){
        if ( data.code != 200 ){
            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
          return ;
        }
        refresh && location.reload();
    },
      complete:function(){
          clearTimeout(loading);
          $('#loadCon').remove();
      }
  })
}

var common_js_lang = {};
try{
    common_js_lang = obj_i18nLang[common_i18n_lang];
} catch(e){
   common_js_lang = {};
}

window.swal && swal.setDefaults({confirmButtonText:common_js_lang["common.option.ok"], cancelButtonText: common_js_lang["common.option.cancel"], animation:'slide-from-top'});

//IE10 ajax 304 缓存  取消
$.ajaxSetup({
    cache:false,
    error: function(data){
        if ( data.status >= 400 ){
            MsgTip('', 'error code: '+data.status, 'info');
            return false;
        }
    },
    complete: function(data){
      if ( data.status >= 400 ){
          MsgTip('', 'error code: '+data.status, 'info');
        return false;
    }
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
});

;$.fn.ajaxAPI = function(options) {
    var defaults = {
        async: true,
        type: 'get',
        data: {},
        loadTime: 2000,
        url: './',
        contentType: '',
        dataType: 'json',
        error: function() {},
        beforeHandle: function(data) {
            if(data.code == -1) {
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
            if(data.code != 200) {
                ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                return false;
            }
            return true;
        },
        callback: function(data) {},
        complete: function() {}
    };

    options = $.extend({}, defaults, options);
    if(options.loadTime > 0) {
        var loading = setTimeout(function() {
            var loadCon = "<div id='loadCon' style='position:fixed;z-index:99 ;height:100%;width:100%;top:0;left:0; background:rgba(255,255,255, .3);'><div style='width:20%;margin:20% 40%;text-align:center;height:80px;line-height:80px;'><img src='resources/dist/images/loading.gif'></div></div>" ;
            if($('#loadCon').length == 0)
                $('body').append(loadCon);
        }, options.loadTime);
    }

    $.ajax({
        url: options.url,
        type: options.type,
        data: options.data,
        async: options.async,
        dataType: options.dataType,
        contentType: options.contentType,
        success: function(data) {
            if(options.beforeHandle(data)) {
                options.callback(data);
            }
        },
        error: function() {
            options.error();
        },
        complete: function(data) {
            if (options.loadTime > 0) {
                clearTimeout(loading);
                $('#loadCon').remove();
            }
            if (data.status >= 400) {
                MsgTip('', 'error code: ' + data.status, 'info');
                return false;
            }
            options.complete();
        }
    })
};


// sweetalert 增加关闭按钮 及 功能
$('body').on('click', '.sa-custom', function(){
  $('.sa-button-container .cancel').click();
});

function getAppEntry(){
  var appObj = {
    sqlEntry: {name: common_js_lang["common.title.sqlEntry"]},
    procEntry: {name: common_js_lang["common.title.procEntry"]},
    dhubEntry: {name: common_js_lang["common.title.dhubEntry"]},
    mdataEntry: {name: common_js_lang["common.title.mdataEntry"]},
    dataxEntry: {name: common_js_lang["common.title.dataxEntry"]}
  } ;
  var leapidUrl = '';
  $.ajax({
    url: 'leapid/app/list',
    success: function(data){
      if ( data.code != 200 ){
          MsgTip && MsgTip('', common_js_lang['common.info.entry'], 'info');
         return ;
      }
      data.model.map(function(v){
        if ( v.appName == 'leapidEntry' ){
          leapidUrl = v.appUrl ;
          return ;
        }
        appObj[v.appName] && (appObj[v.appName].appUrl = v.appUrl) ;
      });
      appObj.sqlEntry.appUrl &&  $('.header #overview').attr('href', appObj.sqlEntry.appUrl+'/overview.jsp');
      leapidUrl && $('.header #leapidEntry').attr('href', leapidUrl);

      var html = '';
      for (var k in appObj ){
        appObj[k].appUrl && (html += '<a class="header-menu-sep" href="javascript:;"></a><a class="header-menu-item item-l '+(k == 'dhubEntry'? 'cur':'')+'" href="'+appObj[k].appUrl+'">'+appObj[k].name+'</a>');
      } ;
      $('.header #dan-top-menu').html(html);
    }
  });
}
getAppEntry();

function logout() {
    swal({
        title:'',
        text: common_js_lang["common.info.exit"],
        type: 'info',
        showCancelButton:true
    }, function(isConfirm){
      if ( isConfirm ){
          window.onbeforeunload = function(){ return  };
          window.location.href = "./logout";
        return ;
      }
    });
	}
$(document).ready(function(){
    var _tout = null;
		$('#IconUser').hover(function(){
		  	$('#UserExt').show();
		},function(){
		  	_tout = setTimeout(function(){
			  	$('#UserExt').hide();
			},100);
		});

		$("#UserExt").hover(function(){
			clearTimeout(_tout);
		},function(){
		  	$('#UserExt').hide();
		});
    $('#toggleBtn').on('click', function(){
       $('body').toggleClass('asideToggle');
       $('.T-second.cur').toggle();
        var tarDom = $('#userApp, .connId, .linkList');
        tarDom.length > 0 ? tarDom.select2() : '';
    });

    $('#switch-language').on('click', function(){
      if ( $(this).text() === 'English' ){
        setLocalLang('en', true);
        return ;
      }
      setLocalLang('zh', true) ;
    });
});

//// 用户所属应用
var common_project = {};
;(function(){
  $.ajax({
    url: 'leapid/projects',
    async: false,
    success: function(data){
      if ( data.code != 200 ){
          MsgTip && MsgTip('', 'get projects err', 'info');
        return false;
      }
      var appHtml = ''      ;
      for (var k in data.model ){
          var v = data.model[k];
          appHtml += '<option value="'+v.id+'">'+v.name+'</option>';
          common_project[v.id] = v ;
      }
      var appDom = $('select#userApp');
      appDom.length == 1 && appDom.append(appHtml);
      if ( appDom.attr('data-val') ){
        appDom.val( appDom.attr('data-val') );
      }
      $.fn.select2 && appDom.select2();
      if ( appDom.length == 1 && appHtml === '' ){
          MsgTip('',  common_js_lang['common.info.appEmpty'], 'info');
      }
    },
    error: function(){
        window.MsgTip ? MsgTip('', 'get projects err', 'info') : alert("get projects err");
    }
  });
}());

var adminConfigData = {hdfs:0, hive:0, sdc:'http://'};
function getAdminConfig(){
  $.ajax({
    url:'env/hdfs/system/config',
    async:false,
    success: function(data){
      if ( data.code != 200 ){
          MsgTip && MsgTip('', common_js_lang['common.info.config'], 'info');
        return false;
      }
      try{
        adminConfigData = data.model ;
          // HA host 处理
        var host = adminConfigData.hive.host;
          adminConfigData.hive.host = host.split(',').map(function(v, i){
              return v.split(':')[0];
          }).join(',');

        if ( !data.model.hdfs.id || !data.model.hive.id ){
          window.MsgTip ? MsgTip('', common_js_lang['common.info.config'], 'info') : alert( common_js_lang['common.info.config'] );
        }
      } catch ( e ){
      }
    },
    error: function(){
        window.MsgTip ? MsgTip('', common_js_lang['common.info.config'], 'info') : alert( common_js_lang['common.info.config'] );
    }
  });
}
getAdminConfig();

function getSdcInfo(){
    $.ajax({
        url: 'env/sdc/detail',
        async: false,
        success: function(data){
            if ( data.code != 200 ){
                MsgTip && MsgTip('', common_js_lang['common.info.config'], 'info');
                return false;
            }
            try{
                adminConfigData.sdc =  data.model ;
                $('#LeftBox .I-item.entry a').attr('href', adminConfigData.sdc);
            } catch(e){}
        },
        error: function(){
            window.MsgTip ? MsgTip('', common_js_lang['common.info.config'], 'info') : alert( common_js_lang['common.info.config'] );
        }
    })
}
getSdcInfo() ;

var globalParam = {
    columnValOption: '<option title="'+common_js_lang['db.option.year']+'" value="current_year(yyyy)">current_year(yyyy)</option><option title="'+common_js_lang['db.option.month']+'" value="current_month(MM)">current_month(MM)</option><option title="'+common_js_lang['db.option.date']+'" value="current_date(yyyy-MM-dd)">current_date(yyyy-MM-dd)</option>',
    dbList : {},
    tblList: {},
    tblModel: {},
    partitionsData: {},
    promiseFunc: {},
    commonLinkType: {
        hdfs: '1',
        hive: '2',
        spark: '3'
    }
};

globalParam.promiseFunc = {
    newDdlMap: function(type){
        var typeMap = {
            0: 'newDbDdl',
            1: 'newCsvDdl',
            2: 'newExcelDdl',
            3: 'newDumpDdl',
            4: 'newSqlDdl'
        };
        return typeMap[type] ;
    },

    //param: id pid
    getDb: function(param){
        var defer = $.Deferred();
        if ( globalParam.dbList['db_'+param.id] ){
            defer.resolve( globalParam.dbList['db_'+param.id] );
            return defer.promise();
        }

        $.ajax({
            url: 'db/dbs?id=' + param.id + '&pid=' + param.pid,
            success: function (data) {
                if ( data.code != 200 ){
                    defer.reject();
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                defer.resolve(data.model);
            },
            error: function(){
                defer.reject();
            }
        });
        return defer.promise();
    },

    //param: dbId catalog schema pid
    getTables: function(param){
        var defer = $.Deferred();
        if ( globalParam.tblList['tbl_'+param.dbId+'_'+param.catalog+'_'+param.schema] ){
            defer.resolve( globalParam.tblList['tbl_'+param.dbId+'_'+param.catalog+'_'+param.schema] );
            return defer.promise();
        }
        param.pid || ( param.pid = $('#userApp').val() );  //增加pid参数
        $.ajax({
            url: 'db/table/tbls',
            data: param,
            success: function (data) {
                if ( data.code != 200 ){
                    defer.reject();
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                globalParam.tblModel['tbl_'+param.dbId+'_'+param.catalog+'_'+param.schema] = [];
                globalParam.tblList['tbl_'+param.dbId+'_'+param.catalog+'_'+param.schema] = [];
                data.model.map(function(v, i){
                    globalParam.tblList['tbl_'+param.dbId+'_'+param.catalog+'_'+param.schema].push(v.name);
                    globalParam.tblModel['tbl_'+param.dbId+'_'+param.catalog+'_'+param.schema].push( v );
                });
                defer.resolve( globalParam.tblList['tbl_'+param.dbId+'_'+param.catalog+'_'+param.schema] );
            },
            error: function(){
                defer.reject();
            }
        });
        return defer.promise();
    },

    //param: {ddl param}, type:newDdl type
    getDdl: function(param, type){
        type = type || 0;
        var newFunc = this.newDdlMap(type);
        var defer = $.Deferred(),
            _this = this;
        if ( globalParam.tblList['tbl_'+param.dbId+'_'+param.catalog+'_'+param.schema] ) {
            if (globalParam.tblList['tbl_' + param.dbId + '_' + param.catalog + '_' + param.schema].indexOf(param.tableName) > -1) {
                // 已存在 show
                $.when(_this.showDdl(param)).then(function (data) {
                    data.isShow = 1;
                    defer.resolve(data);
                }).fail(function () {
                    defer.reject();
                });
                return defer.promise();
            }
            else {
                var lowerList = globalParam.tblList['tbl_' + param.dbId + '_' + param.catalog + '_' + param.schema].map(function (v, i) {
                    return v.toLowerCase();
                });
                if (lowerList.indexOf(param.tableName.toLowerCase()) == -1) {
                    // 新表
                    $.when(_this[newFunc](param)).then(function (data) {
                        data.isShow = 0;
                        defer.resolve(data);
                    }).fail(function () {
                        defer.reject();
                    });
                    return defer.promise();
                }
            }
        }

        $.when( this.exist(param)).then(function(data){
            if ( data ){  //已存在
                $.when( _this.showDdl(param)).then(function(data){
                    data.isShow = 1;
                    defer.resolve(data);
                }).fail(function(){
                    defer.reject();
                });
            }
            else {
                $.when( _this[newFunc](param)).then(function(data){
                    data.isShow = 0;
                    defer.resolve(data);
                }).fail(function(){
                    defer.reject();
                });
            }
        }).fail(function(){
            defer.reject();
        });

        return defer.promise();
    },

    //param: dbId catalog schema tableName
    showDdl: function(param){
        var defer = $.Deferred();
        $.ajax({
            url: 'db/table/ddl/show',
            data: param,
            success: function(data){
                if ( data.code != 200 ){
                    defer.reject();
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                defer.resolve(data.model);
            },
            error: function(){
                defer.reject();
            }
        });
        return defer.promise();
    },

    //param: this.batchDbDdl param
    newDbDdl: function(param){
        var defer = $.Deferred();
        $.when( this.batchDbDdl(param)).then(function(data){
           if ( data[0].code != 200 ){
               defer.reject();
               ErrTip(data[0].i18nMsg.title, data[0].i18nMsg.detail, data[0].msg);
               return;
           }
            defer.resolve(data[0].model);
        }).fail(function(){
            defer.reject();
        });
        return defer.promise();
    },

    //param: dbId catalog shcema tableName cols colSep
    newCsvDdl: function(param){
        var defer = $.Deferred(),
            colsDefer = $.Deferred();
        param['colSep'] = param.columnSep;

        $.when( this.getCsvCols(param)).then(function(data){
            param['cols'] = data;
            colsDefer.resolve();
        }).fail(function(){
            colsDefer.reject();
        });

        $.when( colsDefer).then(function() {
            $.ajax({
                url: 'db/table/ddl/cols',
                data: param,
                type: 'post',
                success: function (data) {
                    if (data.code != 200) {
                        defer.reject();
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return;
                    }
                    defer.resolve(data.model);
                },
                error: function () {
                    defer.reject();
                }
            });
        }).fail(function(){
            defer.reject();
        });

        return defer.promise();
    },

    //param: dbId catalog shcema tableName cols colSep
    newExcelDdl: function(param){
        var defer = $.Deferred(),
            colsDefer = $.Deferred();
        param['colSep'] = param.columnSep;
        param['cols'] = param.lineNum == 1 ? (param.sourceparam.columnSize || 1) : 0;

        if ( param['cols'] == 0 ){
            $.when( this.getExcelCols(param)).then(function(data){
                param['cols'] = data;
                colsDefer.resolve();
            }).fail(function(){
                colsDefer.reject();
            });
        }
        else {
            colsDefer.resolve();
        }

        $.when( colsDefer).then(function() {
            $.ajax({
                url: 'db/table/ddl/cols',
                data: param,
                type: 'post',
                success: function (data) {
                    if (data.code != 200) {
                        defer.reject();
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return;
                    }
                    defer.resolve(data.model);
                },
                error: function () {
                    defer.reject();
                }
            });
        }).fail(function(){
            defer.reject();
        });

        return defer.promise();
    },

    //param: dbId catalog shcema tableName cols colSep
    newDumpDdl: function(param){
        var defer = $.Deferred();
        $.ajax({
            url: 'db/table/ddl/cols',
            data: param,
            type: 'post',
            success: function(data){
                if ( data.code != 200 ){
                    defer.reject();
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                defer.resolve(data.model);
            },
            error: function(){
                defer.reject();
            }
        });
        return defer.promise();
    },

    //param: dbId sql pid
    newSqlDdl: function(param){
        var defer = $.Deferred();
        if ( !param.sql ){
            MsgTip('info', common_js_lang['db.info.sqlEmpty']);
            defer.reject();
            return defer.promise();
        }
        $.when( this.getSqlColumns({dbId:param.fromId || param.dbId, sql:param.sql, pid: param.pid}))
            .then(function(data){
                if ( !data.model || data.model.length <= 0 ){
                    MsgTip('info', common_js_lang['db.tip.columnEmpty']);
                    defer.reject();
                    return ;
                }
                param.selectedColsJson  = JSON.stringify( data.model );
                param.toId = param.dbId;

                $.ajax({
                    url: 'db/table/ddl/columns',
                    data: param,
                    type: 'post',
                    success: function(data){
                        if ( data.code != 200 ){
                            defer.reject();
                            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                            return ;
                        }
                        defer.resolve(data.model);
                    },
                    error: function(){
                        defer.reject();
                    }
                });
            }).fail(function(){
                defer.reject();
            });

        return defer.promise();
    },

    //param: filePath dataLineNo sheetIndex
    getExcelCols: function(param){
        var defer = $.Deferred();
        $.ajax({
            url: 'job/excel/file/cols',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            data: {filePath:param.sourceparam.filePath, dataLineNo:param.lineNum, sheetIndex: param.sourceparam.index},
            success: function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    defer.reject();
                    return ;
                }
                defer.resolve(data.model);
            },
            error: function(){
                defer.reject();
            }
        });
        return defer.promise();
    },

    //param: filePath dataLineNo columnSep fieldEnClosed
    getCsvCols: function(param){
        var defer = $.Deferred();
        $.ajax({
            url: 'job/csv/file/cols',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            data: {filePath:param.sourceparam.filePath, dataLineNo:param.lineNum, columnSep: param.columnSep, fieldEnClosed:param.fieldEnClosed},
            success: function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    defer.reject();
                    return ;
                }
                defer.resolve(data.model);
            },
            error: function(){
                defer.reject();
            }
        });
        return defer.promise();
    },

    //param: dbId sql pid
    getSqlColumns: function(param){
        var defer = $.Deferred();
        $.ajax({
            url: 'db/sql/cols',
            data: param,
            success: function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    defer.reject();
                    return ;
                }
                defer.resolve(data);
            },
            error: function(){
                defer.reject();
            }
        });

        return defer.promise();
    },

    //param: dbId catalog schema tableName
    exist: function(param){
        var defer = $.Deferred();
        $.ajax({
            url: 'db/table/exist2',
            data: param,
            success: function(data){
                if ( data.code != 200 ){
                    defer.reject();
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                defer.resolve(data.model);
            },
            error: function(){
                defer.reject();
            }
        });
        return defer.promise();
    },

    //param: catalog schema tableName dbId
    getPart: function(param){
        var defer = $.Deferred();
        if ( globalParam.partitionsData['catalog'+param.catalog+'_schema'+param.schema+'_'+param.tableName] ){
            defer.resolve(globalParam.partitionsData['catalog'+param.catalog+'_schema'+param.schema+'_'+param.tableName]);
            return defer.promise();
        }

        $.ajax({
            url: 'db/table/partitions',
            data: param,
            success: function(data) {
                if ( data.code != 200 ){
                    defer.reject();
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                globalParam.partitionsData['catalog'+param.catalog+'_schema'+param.schema+'_'+param.tableName] = data.model ;
                defer.resolve(data.model);
            },
            error:function(){
                defer.reject();
            }
        });

        return defer.promise();
    },

    //param: dbId pid tablesJsonStr:[catalog schema tableName]
    batchPartCheck: function(param) {
        var defer = $.Deferred();
        $.ajax({
            url: 'db/table/partitions/batch',
            data: param,
            type: 'post',
            success: function (data) {
                var errTitle = '', errDetail, errMsg = '';
                if (data.code != 200) {
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    defer.reject();
                    return;
                }

                data.model.map(function (v) {
                    if (v.code != 200) {
                        errTitle += v.i18nMsg.title + '.\n';
                        errDetail += v.i18nMsg.detail + '.\n';
                        errMsg += v.msg + '.\n';
                        return;
                    }
                    if (v.model && v.model.partitions.length > 0) {
                        errMsg += common_js_lang['db.text.tbl'] + '[' + v.model.name + '] ' + common_js_lang['local.info.hiveParam'] + '\n';
                    }
                });
                if (errMsg) {
                    ErrTip(errTitle, errDetail, errMsg);
                    defer.reject();
                    return;
                }
                defer.resolve();
            },
            error: function () {
                defer.reject();
            }
        });

        return defer.promise();
    },

    //param: fromId toId pid fromTablesJson:[catalog schema tableName] toTablesJson:[catalog schema tableName tableType]
    batchDbDdl: function(param){
        var defer = $.Deferred();
        $.ajax({
            url: 'db/table/ddl/batch',
            type: 'post',
            contentType: 'application/x-www-form-urlencoded',
            data: param,
            success: function (data) {
                if (data.code != 200) {
                    defer.reject();
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return;
                }
                defer.resolve(data.model);
            },
            error: function(){
                defer.reject();
            }
        });
        return defer.promise();
    },

    //param: base hid pid
    getDir: function(param){
        var defer = $.Deferred();
        $.ajax({
            url: !param.base ? 'hdfs/dir/home' : 'hdfs/dir/list',
            data: param,
            success: function(data){
                if ( data.code != 200 ){
                    defer.reject();
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                defer.resolve(data.model);
            },
            error: function(){
                defer.reject();
            }
        });
        return defer.promise();
    }
};