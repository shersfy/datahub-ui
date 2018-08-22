
// CodeMirror 设置
var editor = CodeMirror.fromTextArea($('.new-sql textarea')[0], {
		lineNumbers: true
	});

var tmpParam = {
	jobId: 0,
	editJobModel: {},
	dbConfigParam: {},
	dbConfigParamOption: '',
	dbParamObj: {},
	sourceId: '',
	targetId: '',
	sourceDb: {},
	targetType: 0,
	groupNo: 0,
	urlConnectList: {},
	curTableList: [],
	curHiveParam: {},
	columnsOption: '',
	filtersOption: '',
	fromJson: [],
	toHdfsJson: [],
	toHiveJson: [],
	toDbJson: [],
	linkSource2type: {
		'1': [38, 4, 40, 44, 24],
		'2': [52, 53, 55, 54],
		'3': [56, 57, 60, 58]
	},
	urlObj: {},
	tmpAppId : 0,
	type1Val: '',
	connId: 0,
	tmpDbParam: {},
	editTmpDbParam: {},
	searchParam: {
		searchInterval: '',
		keyword: '',
        checkedDbNum: 0,
        tarNum: 0,
        isSearch: false
	},
    batchTblMode: false,
    columnType: ["bigint", "boolean", "char", "date", "decimal", "double", "float", "int", "smallint", "string", "timestamp", "tinyint", "varchar"],
    columnTypeOption: '',
    partTag: 0,
    editGotPart: false
};

$.extend(globalParam, tmpParam);

function columnType2option(){
    var option = '';
    globalParam.columnType.map(function(v){
        option += '<option>'+v+'</option>' ;
    });
    return option ;
}
globalParam.columnTypeOption = columnType2option();

// 是否是 处于编辑状态
try {
	// 取url参数
	var urlParam = location.search.replace(/^\?|\?$/g, '').split('&');
	for ( var i=0,len=urlParam.length; i<len; i++ ){
		var obj = urlParam[i].split('=');
		globalParam.urlObj[obj[0]] = obj[1] || '' ;
	}
	
	var id = globalParam.urlObj.id || 0;
	if(id <= 0) throw "";
	$.fn.ajaxAPI({
		url: 'job/detail?jobId=' + id,
		async: false,
		callback: function(data) {
            if ( globalParam.urlObj.copy )
                data.model.jobName = (data.model.jobName+'_copy').slice(0,60);
			$('.configTask .taskName').val(data.model.jobName);
			$('.configTask .taskDes').val(data.model.note);
			data.model.pid && $('#userApp').val(data.model.pid).select2();

            if(JSON.parse(data.model.otherParams).fromList) {
                globalParam.jobId = id;
                globalParam.editJobModel = data.model;
                if ( !data.model.fromId )
                    return ;
                if ( data.model.fromObject ) {
                    if (data.model.fromObject.delFlg == -1) {
                        $.extend(globalParam.editTmpDbParam, data.model.fromObject);
                    }
                    globalParam.urlObj.type == 1 && (globalParam.urlObj.dbtype = data.model.fromObject.dbType);
                }
            }

            var delTip = '';
            if ( !data.model.fromObject ){
                delTip += common_js_lang['conf.info.srcNull'];
            }
            if ( !data.model.toObject ){
                delTip += (delTip ? '<br>':'')+common_js_lang['conf.info.tarNull'];
            }
            delTip ? MsgTip('info', delTip, 5000) : '';
		}
	});
} catch(e) {};

$('.item1').on('change', '.connType', function(){
	var connType = $(this).val();
	if ( connType == 1 ){
		$('.item1 .source .type1show').show();
		$('.item1 .source input').prop('disabled', true).val('').removeClass('error');
		$('.source [data-key="hid"]').val('').select2().prop('disabled', true);
		$('.source .linkList').select2();
	}
	else {
		$('.item1 .source .linkList').val('').select2();
		$('.item1 .source .type1show').hide();
		$('.item1 .source input').prop('disabled', false).val('').removeClass('error');		
		$('.source [data-key="hid"]').val('').select2().prop('disabled', false);		
	}
});

var jobOtherParams = '';
if(globalParam.jobId > 0) {
	jobOtherParams = JSON.parse(globalParam.editJobModel.otherParams);
	getConnect(1, globalParam.editTmpDbParam.delFlg == -1 ? 0 : jobOtherParams.fromList[0].id, globalParam.editJobModel.toId);
    getConnect(2, globalParam.editTmpDbParam.delFlg == -1 ? 0 : jobOtherParams.fromList[0].id, globalParam.editJobModel.toId);
} else {
	getConnect(1);
	getConnect(2) ;
}

$('body').on('click', 'button.index', function(){
	window.location.href = './';
});

// init
$('#userApp').change(function(){
	getConnect(1);
	getConnect(2) ;

    ['connName', 'url', 'host', 'port', 'dbName', 'userName', 'hid'].map(function(v){
    	$('.item1').find('[data-key="'+v+'"]').val('');
	});
});

$('.url-info').on('change', '.linkList', function() {
	try {
		var val = JSON.parse(decodeURIComponent($(this).find('option:selected').attr('data-val')));
	} catch ( e ){
		return ;
	}
	if( !val.id ) return false;
	resetDestConn(val, $('.item1 .source') ) ;
});

// input blur 验证
$('.item1 .source').on('blur', 'input', function(){
    var key = $(this).attr('data-key'),
        val = ( $(this).val() || '').trim() ;
    var data = {};
    data[key] = val ;
    if ( key === 'url' && val === '' ){
         var param = getUrlParam($(this));
         $(this).val(getlinkUrl(param)).removeClass('error');
         return false;
    }
    var checkRes = checkDbInfo(data);
    if ( checkRes.res !== true ){   //验证输入合法性
        $(this).addClass('error');
        return false;
    }
    $(this).removeClass('error');

    if ( ['host', 'port', 'dbName'].indexOf(key) > -1 ){
        var param = getUrlParam($(this));        
        $(this).parents('ul').find('[data-key="url"]').val(getlinkUrl(param));
    }
});

function getUrlParam(obj){
    var con = obj.parents('ul') ;
    return {
        dbType: (con.find('[data-key="dbType"]').val() || '').trim(),
        host: (con.find('[data-key="host"]').val() || '').trim(),
        port: (con.find('[data-key="port"]').val() || '').trim(),
        dbName: (con.find('[data-key="dbName"]').val() || '').trim()        
    }
}
function getlinkUrl(param){
	return "jdbc:hive2://"+param.host+":"+param.port+"/"+param.dbName;
}

function checkDbInfo(data){
    for ( key in data ){
        if ( key === 'id' ){
            continue;
        }
        if ( key === 'connName' && data.connName === '' )
            continue;

        if ( key === 'port' && !data.port.match(/^[0-9]+$/g) ){
            return {res:false, key:key};
        }
        
        if ( data[key] === '' ){
            return {res:false, key:key};
        }
    }
    return {res: true};
}

// 目标位置切换
$('.upload-type').on('change', '.typeCon #targetType', function() {
	var type = +$(this).val();
	if ( type == -1 || !type ){
		return ;
	}
	getConnect();
	if([1, 2].indexOf(type) > -1) {
		$('.upload-type .target').css({display: 'none'});
		var columnCon = $(this).parents('.upload-type').find('.column').addClass('hidden');
		type == 1 ? columnCon.eq(1).find('input').val('') : columnCon.eq(0).find('input,select').val('') ;
		type == 1 ? columnCon.eq(1).removeClass('hidden') : columnCon.eq(0).removeClass('hidden') ;
	} else {   // db
		targetTypeChange(type);
	}
});

function targetTypeChange(type, id) {
	$('.upload-type .target').css({
		display: 'block'
	});
	$('.item1 .target .linkList').prop('disabled', false);
	$('.item1 .target li:not(:first-child) input, .item1 .target li:not(:first-child) select').val('');
	var options = '<option value="">'+common_js_lang['db.info.dbLinkErr']+'</option>';
	options += template('template/options', {
		data: globalParam.urlConnectList,
		type: type
	});
	$('.item1 .target .linkList').html(options).select2();
	if(id) {
		$('.item1 .target .linkList').find('[data-id="' + id + '"]').prop('selected', true).trigger('change');
	}
}

function getConnect(type, id, toId){
	var pid = $('#userApp').val(),
		targetType = type || $('#targetType').val(),
		url = 'db/list',
        dbType = 31,
		groups = '';
	targetType == 2 ? (url = 'hdfs/list') : (groups = 4) ;
	if ( !pid )
		return ;
	$.fn.ajaxAPI({
		url: url+'?pid='+pid+'&dbType='+dbType+'&groups='+groups,
		callback: function(data){
			var connHtml = '<option value="" disabled>'+(targetType == 2? ' ':common_js_lang['db.info.selectLink'])+'</option>' ;
			targetType == 2 ? adminConfigData.hdfs.id && (connHtml += '<option value="'+adminConfigData.hdfs.id+'" data-val="'+encodeURIComponent(JSON.stringify(adminConfigData.hdfs))+'">'+adminConfigData.hdfs.connName+'</option>') : adminConfigData.hive.id && (connHtml += '<option value="'+adminConfigData.hive.id+'" data-val="'+encodeURIComponent(JSON.stringify(adminConfigData.hive))+'">'+adminConfigData.hive.connName+'</option>') ;
			data.model.data.map(function(v){
				connHtml += '<option value="'+v.id+'" data-val="'+encodeURIComponent(JSON.stringify(v))+'">'+v.connName+'</option>' ;
			});
            if ( targetType == 2 ){   /// / 复现 hdfs 连接参数
                $('.item1 [data-key="hid"]').html(connHtml).val('');
            }
			targetType != 2 && $('.source .linkList, .typeCon .connId').html(connHtml).val('').select2();
			id && $('.source .linkList').val(id).change();
			toId && $('.typeCon .connId').val(globalParam.editJobModel.toId).change();
			// id == 0 ? '' : $('.source .linkList').trigger('change');   // 临时db编辑 第一次 id=0, 不触发change
		}
	})
}

$('.upload-type').on('change', '.connId', function() {
	try {
		var val = JSON.parse(decodeURIComponent($(this).find('option:selected').attr('data-val')));
	} catch ( e ){
		return ;
	}
	if( !val.id ) return false;
	var type = +$('.upload-type #targetType').val();
	resetDestConn(val, type == 1? $('.upload-type .column.hive'): $('.upload-type .column.hdfs') ) ;
});

$('.testConnect').on('click', function(){
    $(this).parent().find('.testRes').empty();
    var isSource = $(this).parents('.source').length == 1 ;
	if ( isSource ){
		var fromType = $('.source .connType').val();
		if ( fromType == 1 ){
			var id = $('.linkList').val() || 0;
			if ( id <= 0 ){
				MsgTip('', common_js_lang['db.info.selectSavedLink'], 'info');
				return ;
			}
			testConnect({pid:$('#userApp').val(), id: id}, $(this).parent());
		}
		else {
			var param = {};
			['connName', 'host', 'port', 'dbName', 'userName', 'url', 'hid'].map(function(v){
				param[v] = ($('.source [data-key="'+v+'"]').val() || '').trim() ;
			});
			var res = checkDbInfo(param);
			if ( !res.res ){
				MsgTip('', common_js_lang['db.info.completeParam'], 'info');
				return false;
			}
			param.connName = param.connName || param.host+'_'+param.port+'_'+param.dbName;
			$('.source [data-key="connName"]').val(param.connName);
			param['pid'] = $('#userApp').val();
			param['delFlg'] = -1 ;
			param['password'] = '';
			param['dbType'] = 31;
			testConnect(param, $(this).parent());
		}
	}
	else {
		var targetType = $('#targetType').val();
		var id = $('.typeCon .connId').val() ;
        if ( id <= 0 ){
            MsgTip('', common_js_lang['db.info.selectSavedLink'], 'info');
            return ;
        }
		targetType == 1 && testConnect({pid: $('#userApp').val(), id:id}, $(this).parent());
	}
});

$('.connType, .linkList, .target-type, .connId').change(function(){
    var container = $(this).parents('.source');
    container.length == 0 ? container = $(this).parents('.upload-type') : '';
    container.find('.testRes').empty();
});

$('.testRes').on('click', '.showTip', function(){
    var data = JSON.parse( decodeURIComponent($(this).attr('data-info')) );
    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
});

function testConnect(param, parentDom){
    var loading = setTimeout(function(){
        var loadCon = "<div id='loadCon' style='position:fixed;z-index:99 ;height:100%;width:100%;top:0;left:0; background:rgba(255,255,255, .3);'><div style='width:20%;margin:20% 40%;text-align:center;height:80px;line-height:80px;'><img src='resources/dist/images/loading.gif'></div></div>" ;
        if ( $('#loadCon').length == 0 )
            $('body').append(loadCon);
    }, 2000);

	$.ajax({
		url: 'db/connect',
		type: 'post',
		contentType: 'application/x-www-form-urlencoded',
		data: {id: param.id},
		success: function(data){
            if ( data.code != 200 ){
                parentDom.find('.testRes').removeClass('right').addClass('err').html('<i class="fail"></i>'+common_js_lang['db.text.testFail']+'<a class="showTip" data-info='+encodeURIComponent(JSON.stringify(data))+'>'+common_js_lang['db.text.errTip']+'</a>');
                return ;
            }
            parentDom.find('.testRes').removeClass('err').addClass('right').html('<i class="suc"></i>'+common_js_lang['db.text.testSuc']);
        },
        complete: function(data) {
            clearInterval(loading);
            $('#loadCon').remove();
        }
	})
}
function hdfsAuthToggle(index, id){
	var doc = $('.upload-type .column.hdfs') ;
    doc.find('.radio').removeClass('cur').eq(+index-1).addClass('cur');
    doc.find('.kerberos, .normal').addClass('hidden');
	index == 2 ? doc.find('.kerberos').removeClass('hidden') : doc.find('.normal').removeClass('hidden');
    index == 2 && id == adminConfigData.hdfs.id && doc.find('.admin').addClass('hidden');
}

function resetDestConn(data, doc ){
    if ( data.authType ){
		hdfsAuthToggle(data.authType);
		var columnArr = ['keytab', 'principal', 'connName', 'coreSiteXml', 'hdfsSiteXml'] ;
		data.authType != 2 && (columnArr = ['userName', 'connName', 'coreSiteXml', 'hdfsSiteXml']);
		for ( k in data ){
			if ( columnArr.indexOf(k) == -1 )
				continue ;
			doc.find('[data-key="'+k+'"]').val(data[k]);
		}
    }
    else {
        for ( k in data ){
            if ( ['connName', 'url', 'host', 'port', 'userName', 'hid'].indexOf(k) > -1 )
                doc.find('[data-key="'+k+'"]').val(data[k]);
        }
		doc.find('[data-key="hid"]').change();
    }
}
// 编辑
;
(function() {
	if(globalParam.jobId <= 0) return;
	if ( globalParam.editTmpDbParam.delFlg == -1 ){
		$('.source .connType').val('2').change();
		['connName', 'url', 'host', 'port', 'dbName', 'userName', 'password', 'hid'].map(function(v){
			$('.source [data-key="'+v+'"]').val(globalParam.editTmpDbParam[v]);
		});
		$('.source [data-key="hid"]').select2();
	}
	if(globalParam.editJobModel.toType == 8) { // hdfs 
		globalParam.targetType = '2';
	} else if(globalParam.editJobModel.toType == 9) { // hive
		globalParam.targetType = '1';
	}
    //禁止更改源和目标
    $('#userApp, .item1 .linkList, .item1 #targetType, .item1 .connId').prop('disabled', true);
}());

// 连接url 进入下一步  第一步到第二步
$('.url-info').on('click', '.connect', function() {
	var jobName = ($('.item1 .taskName').val() || '').trim(),
		note = ($('.item1 .taskDes').val() || '').trim();
	if(!jobName) {
		MsgTip('', common_js_lang['local.info.taskNameNone'], 'info');
		return;
	}
	var pid = $('#userApp').val() || 0 ;
	if ( !pid ){
		MsgTip('', common_js_lang['dbManage.title.setApp'], 'info');
		return ;
	}

	var connId = $('.typeCon .connId').val(),
		type = $('.typeCon #targetType').val() ;
	if(connId <= 0) {
		MsgTip('', common_js_lang['db.info.tarConn'], 'info');
		return false;
	}
	var typeChange = type != globalParam.targetType,
		destConnChange = connId != globalParam.connId,
		appIdChange = pid != globalParam.tmpAppId ;

	var fromType = $('.source .connType').val();
	if ( fromType == 1 ){
		if( !$('.source .linkList').val() ) {
			MsgTip('', common_js_lang['db.info.sourceLink'], 'info');
			return false;
		}
		var linkObj = JSON.parse( decodeURIComponent($('.source .linkList').find('option:selected').attr('data-val')) );
		var sourceChange = linkObj.id != globalParam.sourceId ;
	}
	else {
		var param = {}, sourceChange = false ;

		['connName', 'url', 'host', 'port', 'dbName', 'userName', 'hid'].map(function(v){
			param[v] = ($('.source [data-key="'+v+'"]').val() || '').trim() ;
			globalParam.tmpDbParam[v] == param[v] ? '' : sourceChange = true ;
		});
		param.connName = param.connName || param.host+'_'+param.port+'_'+param.dbName;
		$('.source [data-key="connName"]').val(param.connName);
		param['pid'] = $('#userApp').val();
		param['delFlg'] = -1 ;
		param['password'] = '';
		param['dbType'] = 31;
		globalParam.tmpDbParam['pid'] == param['pid'] ? '' : sourceChange = true ;
		$.extend(globalParam.tmpDbParam, param) ;
	}

	$('#globalLoadCon').css({display:'block'});
	$('.global-ConfigCon .hdfsTab').addClass('hidden');
	$('.global-ConfigCon .dbTab').removeClass('hidden');
	$('.global-batch .hdfsTab').addClass('hidden');
	$('.global-batch .dbTab').removeClass('hidden');

	if(type == 2) {
		$('.global-ConfigCon .dbTab').addClass('hidden');
		$('.global-ConfigCon .hdfsTab').removeClass('hidden');
		$('.global-batch .dbTab').addClass('hidden');
		$('.global-batch .hdfsTab').removeClass('hidden');
	} else if(type == 1) {
	}

	var sourceDefer = $.Deferred(),
		destDefer = $.Deferred() ;
	if ( typeChange || destConnChange || appIdChange ){
		if ( type == 1 ){
			$.ajax({
				url: 'db/dbs?id=' + connId+'&pid='+$('#userApp').val(),
				success: function(data) {
					if ( data.code != 200 ){
						destDefer.reject();
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
						return false;
					}
					//填充db信息
					var dbList = '<option value="" disabled>'+common_js_lang['local.option.getDb']+'</option>';
					data.model.databases.map(function(v) {
						dbList += '<option data-catalog="' + v.catalog + '" data-schema="' + v.schema + '">' + v.name + '</option>';
					});
					$("#dbName, #batch-dbName").html(dbList).val('').removeClass('error').select2();
                    if ( data.model.databases && data.model.databases.length <= 0 ){
                        MsgTip('info', common_js_lang['dump.info.dbNone']);
                    }

					globalParam.targetType = type;
					globalParam.connId = connId ;
					globalParam.targetId = globalParam.connId;
					globalParam.tmpAppId = pid;
					destDefer.resolve();
				},
				error: function(){
					destDefer.reject();
				}
			})
		}
		else {
			var parentDom = $('.hdfsTab .dirDos > .ul');
			$.ajax({
				url: 'hdfs/dir/home',
				data: {hid: connId, pid:$('#userApp').val(),pid:$('#userApp').val()},
				success: function(data) {
					if ( data.code != 200 ){
						destDefer.reject();
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
						return false;
					}
					data.model = [data.model]; 
					var dirHtml = template('template/hdfsDir', {
						dir: data.model,
						len: 0
					});
					parentDom.html(dirHtml);
					globalParam.targetType = type;
					globalParam.connId = connId ;
					globalParam.targetId = globalParam.connId;
					globalParam.tmpAppId = pid;
					destDefer.resolve();
				},
				error: function(){
					destDefer.reject();
				}
			});
		}
	} 
	else {
		destDefer.resolve();
	}
	source();	
	function source(){
		if ( sourceChange || !globalParam.sourceId || appIdChange ){
			var sourceId = 0 ;
			if ( fromType != 1 ){
				function tmpFunc(){
					var tmpDefer = $.Deferred();
					$.ajax({
						url: 'db/tmp/save',
						contentType: 'application/x-www-form-urlencoded',
						type: 'post',
						data: param,
						success: function(data){
							if ( data.code != 200 ){
								tmpDefer.reject();
                                ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
								return ;
							}
							sourceId = data.model.id ;
							tmpDefer.resolve();
						},
						error: function(){
							tmpDefer.reject();
						}
					});
					return tmpDefer.promise() ;
				}
				$.when( tmpFunc() ).done(function(){
					getSourceData();
				}).fail(function(){
					sourceDefer.reject();
				});
			}
			else {
				sourceId = linkObj.id ;
				getSourceData();
			} ;

			function getSourceData(){
				$.ajax({
					url: 'db/dbs?id=' + sourceId +'&pid='+$('#userApp').val(),
					success: function(data) {
						if ( data.code != 200 ){
							globalParam.sourceId = 0;
							sourceDefer.reject();
                            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
							return ;
						}
						globalParam.sourceId = sourceId;
                        globalParam.searchParam.isSearch = false;
						var dbHtml = template('template/sourceDb', data.model);
						$('.item2 .leftSide .tblList > .ul').html(dbHtml);
						sourceDefer.resolve();
					},
					error: function(){
						sourceDefer.reject();
					}
				});
			}
		}
		else {
			sourceDefer.resolve();
		}
	}
	$.when(sourceDefer, destDefer).done(function(){
		$('.leftSide .allSelected').removeClass('cur');
        var mtype = $('.mtype .radio.cur').attr('data-val');
		$('.rightSide thead').html(template('template/thead', {isDb: type != 2, type:mtype}));
        $.when( editGetParts()).then(function() {
            typeChange || globalParam.jobId <= 0 && (destConnChange || sourceChange) ? $('.rightSide .target-item').html('<tr class="noDataTr"><td colspan="4" class="tableNoData"><img src="resources/dist/images/noData.png">' + common_js_lang['manage.title.noData'] + '</td></tr>') : '';
            $('.stepCon').animate({'margin-left': '-100%'}, 250);
            $('.processCon .itemCon').removeClass('cur').eq(1).addClass('cur');
            $('html, body').animate({scrollTop: 0}, 200)
        });
	}).always(function(){
		$('#globalLoadCon').css({display:'none'});
	})
});

///////////
// 视图/库表切换
$('.item2.item').on('click', '.mtype label', function(){
    if ( $(this).find('.radio').hasClass('cur') )
        return ;
    var self = $(this),
        type = $('.mtype .radio.cur').attr('data-val') == 1 ? 2 : 1;

    if ( $('.rightSide .target-item .config').length <= 0 ){
        $(this).parent().find('.radio').removeClass('cur');
        $(this).find('.radio').addClass('cur');

        $('.leftSide .tbl, .leftSide .view').css({display:'none'});
        $('.leftSide .clear').click();
        $('.rightSide thead').html( template('template/thead',{type:type, isDb: globalParam.targetType != 2}) );
        $('.rightSide .target-item').empty();
        $('.rightSide .target-item').append('<tr class="noDataTr"><td colspan="4" class="tableNoData"><img src="resources/dist/images/noData.png">'+common_js_lang['manage.title.noData']+'</td></tr>');
    }
    else {
        swal({
            title: "",
            text: common_js_lang['db.option.mtype'],
            type: "info",
            showCancelButton: true
        }, function (isConfirm) {
            if ( isConfirm ){
                self.parent().find('.radio').removeClass('cur');
                self.find('.radio').addClass('cur');

                $('.leftSide .tbl, .leftSide .view').css({display: 'none'});
                $('.leftSide .clear').click();
                $('.rightSide thead').html( template('template/thead',{type:type, isDb: globalParam.targetType != 2}) );
                $('.rightSide .target-item').empty();
                $('.rightSide .target-item').append('<tr class="noDataTr"><td colspan="4" class="tableNoData"><img src="resources/dist/images/noData.png">'+common_js_lang['manage.title.noData']+'</td></tr>');
            }
            }
        );
    }
    return ;
});


$('.leftSide').on('click', '.tblList .getTbl', function() {
	var li = $(this).parent(),
		schema = li.data("schema") || '',
		catalog = li.data('catalog') || '';
    var type = $('.mtype .radio.cur').attr('data-val');

	if( $(this).hasClass('got') ) {
		var tbl = type == 1 ? li.find('.tbl') : li.find('.view');
		if(tbl.css('display') == 'none') {
			tbl.slideDown();
			$(this).html('-');
		} else {
			tbl.slideUp();
			$(this).html('+');
		}
		return;
	}
	var param = {
		dbId: globalParam.sourceId
	};
	schema && (param['schema'] = schema);
	catalog && (param['catalog'] = catalog);
	var isChecked = $(this).siblings('.dbSelected').hasClass('cur');
	$.fn.ajaxAPI({
		url: 'db/table/tbls',
		data: param,
		callback: function(data) {
			li.find('.getTbl').addClass('got').html('-');
            var tblArr = [], viewArr = [] ;
            data.model.map(function(v){
                if ( v.type === 'TABLE' ){
                    tblArr.push(v);
                    return ;
                }
                viewArr.push(v);
                return ;
            });
            var type = $('.mtype .radio.cur').attr('data-val');
			var tbl = template('template/sourceTbl', {
				model: tblArr,
				isChecked: isChecked
			});
            li.find('.tbl').html(tbl);
            var view = template('template/sourceView', {
                model: viewArr,
                isChecked: isChecked
            });
            li.find('.view').html(view);

            type == 1 ? li.find('.tbl').slideDown() : li.find('.view').slideDown() ;
        }
	});
});

/// 左侧 radio
//库选择
$('.leftSide').on('click', '.dbSelected', function() {
	$(this).toggleClass('cur');
    var type = $('.mtype .radio.cur').attr('data-val');
    var isGot = $(this).siblings('.getTbl').hasClass('got');
	var tbls = type == 1 ? $(this).siblings('.tbl') : $(this).siblings('.view');
	var isCheck = $(this).hasClass("cur");
	if(isGot) {
		tbls.find('li:not(".hidden")').toggleClass('cur', isCheck);
		tbls.find('li:not(".hidden") .check').toggleClass('cur', isCheck);
	} else {
		$(this).siblings('.getTbl').click();
	}

	var count = $('.tblList li:not(".hidden") .dbSelected').length;
	var isAll = count == $('.tblList li:not(".hidden") .dbSelected.cur').length;
	$('.leftSide .allSelected').toggleClass('cur', isAll);
	return false;
});
$('.leftSide').on('click', '.db-item > p', function() {
    $(this).siblings('.check').click();
});

//表选择
$('.leftSide').on('click', '.tblSelected', function(e, ctrlKey) {
    var type = $('.mtype .radio.cur').attr('data-val');
    if ( e.ctrlKey || ctrlKey ){
        if ( !globalParam.batchTblMode ) {
            globalParam.batchTblMode = true;
            $(this).attr('data-batch', 1);
            return false;
        }

        var startTbl = $('.leftSide .tblSelected[data-batch="1"]');
        if ( startTbl.parents('.db-item').attr('data-dbname') !== $(this).parents('.db-item').attr('data-dbname') ){
            globalParam.batchTblMode = false;
            $('.leftSide .tblSelected[data-batch="1"]').attr('data-batch', 0);
            return false;
        }

        var index1 = +startTbl.siblings('b').text(),
            index2 = +$(this).siblings('b').text(),
            tbls = type == 1 ? $(this).parents('.tbl').find('li') : $(this).parents('.view').find('li'),
            start = index1 > index2 ? index2 : index1,
            end = index1 > index2 ? index1 : index2 ;
        for ( var i=start; i<=end; i++ ){
            if ( tbls.eq(i-1).hasClass('hidden') )
                continue ;
            tbls.eq(i-1).addClass('cur');
            tbls.eq(i-1).find('.check').addClass('cur');
        }

        globalParam.batchTblMode = false;
        $('.leftSide .tblSelected[data-batch="1"]').attr('data-batch', 0);

        var tbls = type == 1 ? $(this).parents('.tbl') : $(this).parents('.view') ;
        var count = tbls.find('li:not(".hidden")').length;
        if(tbls.find('.check.cur').length == count) {
            tbls.siblings('.dbSelected').addClass('cur');
        } else {
            tbls.siblings('.dbSelected').removeClass('cur');
        }

        var count = $('.tblList li:not(".hidden") .dbSelected').length;
        var isAll = count == $('.tblList li:not(".hidden") .dbSelected.cur').length;
        $('.leftSide .allSelected').toggleClass('cur', isAll);
        return false;
    }

    globalParam.batchTblMode = false;
    $('.leftSide .tblSelected[data-batch="1"]').attr('data-batch', 0);

	$(this).toggleClass('cur');
	var hasCur = $(this).hasClass('cur');
	$(this).parent().toggleClass('cur', hasCur);
    var tbls = type == 1 ? $(this).parents('.tbl') : $(this).parents('.view'),
		count = tbls.find('li:not(".hidden")').length;

	if(tbls.find('.check.cur').length == count) {
		tbls.siblings('.dbSelected').addClass('cur');
	} else {
		tbls.siblings('.dbSelected').removeClass('cur');
	}

	var count = $('.tblList li:not(".hidden") .dbSelected').length;
	var isAll = count == $('.tblList li:not(".hidden") .dbSelected.cur').length;
	$('.leftSide .allSelected').toggleClass('cur', isAll);
	return false;
});
$('.leftSide').on('click', '.tbl li, .view li', function(e) {
    $(this).find('.check').trigger('click', e.ctrlKey);
});

// 全选
$('.leftSide').on('click', '.allSelected', function() {
	$(this).toggleClass('cur');
	var isCheck = $(this).hasClass('cur');
	$('.tblList li:not(".hidden") .dbSelected').toggleClass('cur', !isCheck);
    if ( $('.tblList li:not(".hidden") .getTbl:not(".got")').length <= 10 )
	    $('.tblList li:not(".hidden") .dbSelected').click();
    else {
        $.fn.ajaxAPI({
            url: 'db/search?pid='+$('#userApp').val()+'&keyword=&mtype=1&dbId='+globalParam.sourceId,
            callback: function(data){
                var tbls = $('.tblList li:not(".hidden") .getTbl:not(".got")');
                data.model.databases.map(function(v, i){
                    if ( !tbls.eq(i).hasClass('got') ){
                        tbls.eq(i).addClass('got');

                        var tblArr = [], viewArr = [] ;
                        v.tables.map(function(vv){
                            if ( vv.type === 'TABLE' ){
                                tblArr.push(vv);
                                return ;
                            }
                            viewArr.push(vv);
                            return ;
                        });
                        var tbl = template('template/sourceTbl', {
                            model: tblArr,
                            isChecked: false
                        });
                        tbls.eq(i).siblings('.tbl').css({display:'none'}).html(tbl);
                        var view = template('template/sourceView', {
                            model: viewArr,
                            isChecked: false
                        });
                        tbls.eq(i).siblings('.view').css({display:'none'}).html(view);
                    }
                });
                $('.tblList li:not(".hidden") .dbSelected').click();
            }
        });
    }
	return false;
});
/// radio end 

// 编辑
function editGetParts() {
	if(globalParam.jobId <= 0) return;
    if ( globalParam.editGotPart ) return ;
    globalParam.editGotPart = true;

    if ( jobOtherParams.srcType == 2 ) {  // 迁移类型
        $('.mtype .radio').removeClass('cur').eq(1).addClass('cur');
    }

    $('.rightSide .target-item').empty();
	var len = jobOtherParams.fromList.length,
		target = globalParam.editJobModel.toType == 8 ? jobOtherParams.toHdfsList : globalParam.editJobModel.toType == 9 ? jobOtherParams.toHiveList : jobOtherParams.toDbList;
	for(var i = 0; i < len; i++) {
		var dbName = jobOtherParams.fromList[i].name,
			catalog = jobOtherParams.fromList[i].catalog,
			schema = jobOtherParams.fromList[i].schema,
			whereSql = jobOtherParams.fromList[i].whereSql;

        target[i].tarPartHandleType = jobOtherParams.fromList[i].tarPartHandleType ;
        target[i].useSynchronized = jobOtherParams.fromList[i].useSynchronized ;
        target[i].fromIsPart = jobOtherParams.fromList[i].partitionTable;
        target[i].toIsPart = !!target[i].partition || target[i].useSynchronized;
        target[i].fromPart = jobOtherParams.fromList[i].partition;

        if ( target[i].partition ){
            var partArr = JSON.parse(target[i].partition),
                partObj = {};
            if ( !jobOtherParams.fromList[i].partition ) {
                partArr[0].split(',').map(function (v) {
                    var tmpArr = v.split('=');
                    partObj[tmpArr[0]] = tmpArr[1].replace(/^\'|\'$/g, '');
                });
                target[i].partition = JSON.stringify(partObj);
            }
            else {
                var keyArr = JSON.parse(jobOtherParams.fromList[i].partition),
                    part = [],
                    partTag = false;
                partArr.map(function(v, index){
                    var key = keyArr[index].replace(/,/g, '/').replace(/\'/g, ''),
                        val = v.split(',').map(function(vv){
                            !partTag && part.push( vv.split('=')[0] );
                            return vv.split('=')[1].replace(/^\'|\'$/g, '');
                        });
                    partObj[key] = val ;
                    partTag = true;
                });
                target[i].part = JSON.stringify( part );
                target[i].partition = JSON.stringify(partObj);
            }
		}
		var count = 1,
			tbls = [{
				tbl: jobOtherParams.fromList[i].tableName,
				target: target[i],
				param: JSON.stringify(target[i])
			}];
		for(var j = i + 1; j < len; j++) {
			if(jobOtherParams.fromList[j].name == dbName) {
				count++;
                if ( target[j].partition ){
                    var partArr = JSON.parse(target[j].partition),
                        partObj = {};
                    if ( !jobOtherParams.fromList[j].partition ) {
                        partArr[0].split(',').map(function (v) {
                            var tmpArr = v.split('=');
                            partObj[tmpArr[0]] = tmpArr[1].replace(/^\'|\'$/g, '');
                        });
                        target[j].partition = JSON.stringify(partObj);
                    }
                    else {
                        var keyArr = JSON.parse(jobOtherParams.fromList[j].partition),
                            part = [],
                            partTag = false;
                        partArr.map(function(v, index){
                            var key = keyArr[index].replace(/,/g, '/').replace(/\'/g, ''),
                                val = v.split(',').map(function(vv){
                                    !partTag && part.push( vv.split('=')[0] );
                                    return vv.split('=')[1].replace(/^\'|\'$/g, '');
                                });
                            partObj[key] = val ;
                            partTag = true;
                        });
                        target[j].part = JSON.stringify( part );
                        target[j].partition = JSON.stringify(partObj);
                    }
                }

                target[j].tarPartHandleType = jobOtherParams.fromList[j].tarPartHandleType ;
                target[j].useSynchronized = jobOtherParams.fromList[j].useSynchronized ;
                target[j].fromIsPart = jobOtherParams.fromList[j].partitionTable;
                target[j].toIsPart = !!target[j].partition || target[j].useSynchronized;
                target[j].fromPart = jobOtherParams.fromList[j].partition;
                tbls.push({
					tbl: jobOtherParams.fromList[j].tableName,
					target: target[j],
					param: JSON.stringify(target[j])
				});
			} else {
				break;
			}
		}
		i = j - 1;

		var data = {
			catalog: catalog,
			schema: schema,
			dbName: dbName,
			count: count,
			tbls: tbls,
			isDb: 0
		};
		if(globalParam.editJobModel.toType != 8) {
			data.isDb = 1;
		}
		$('.rightSide .target-item').append(template('template/targetTbl', data));
	}
    $('.rightSide h4 b').html('('+target.length+')');

    //取partition
    var tableJson = [];
    for(var i = 0; i < len; i++) {
        if ( jobOtherParams.fromList[i].partitionTable ) {
            tableJson.push( {catalog:jobOtherParams.fromList[i].catalog, schema:jobOtherParams.fromList[i].schema, tableName:jobOtherParams.fromList[i].tableName} );
        }
    }

    var defer = $.Deferred() ;
    if ( tableJson.length > 0 ){
        $('#waitLoading').find('article').html('<p>' + common_js_lang['db.info.searchPart'] + '</p><p class="detail"></p>').end().css({display: 'block'});
        var errMsg = '', errDetail ='', errTitle = '';
        $.ajax({
            url: 'db/table/partitions/batch',
            type: 'post',
            data: {dbId: jobOtherParams.fromList[0].id, pid:globalParam.editJobModel.pid, tablesJsonStr:JSON.stringify(tableJson)},
            success: function(data){
                if (data.code != 200) {
                    defer.reject();
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return;
                }
                data.model.map(function (v, i) {
                    if (v.code != 200) {
                        errTitle ? '' : errTitle = v.i18nMsg.title ;
                        errDetail ? '' : errDetail = v.i18nMsg.detail ;
                        errMsg += v.msg+'\n';
                        return;
                    }
                    var tarDom = $('.target-item [data-catalog="'+ v.model.catalog+'"][data-schema="'+ v.model.schema+'"][data-tbl="'+ v.model.name+'"]');
                    if (v.model.partitions && v.model.partitions.length > 0 ) {
                        tarDom.attr('data-partition', JSON.stringify(v.model.partitions))
                            .find('td').eq(1).html(common_js_lang['db.text.yes']);
                    }
                });
                defer.resolve();
            },
            complete: function(){
                $('#waitLoading').css({display:'none'});
                if ( errMsg ){
                    ErrTip(errTitle, errDetail, errMsg, 'info');
                }
            }
        });
    }
    else {
        defer.resolve();
    }
    return defer.promise();
};

// 搜索 db tbl
$('.leftSide').on('input', '.keyword', srcSearch);
// 搜索操作
function srcSearch(){
    var keyword = ($('.leftSide .keyword').val() || '').trim() || '';
    if ( keyword === '' ){
        $('.leftSide .clear').css({display:'none'});
    }
    else {
        $('.leftSide .clear').css({display:'block'});
    }

    globalParam.batchTblMode = false;
    $('.leftSide .tblSelected[data-batch="1"]').attr('data-batch', 0);

    clearInterval(globalParam.searchParam.searchInterval);
    globalParam.searchParam.searchInterval = setTimeout(function(){
        $('.leftSide .tblList input, .leftSide .allSelected').prop('checked', false); // 勾选 全部清空
        globalParam.searchParam.keyword = keyword;
        globalParam.searchParam.checkedDbNum = 0;
        globalParam.searchParam.tarNum = 0;
        $('.leftSide .check.cur').removeClass('cur');
        $('.leftSide li.cur').removeClass('cur');

        // 取出全部db的信息
        var type = $('.mtype .radio.cur').attr('data-val');
        if ( $('.tblList .getTbl:not(".got")').length <= 10 ) {
            var tbls = $('.tblList .getTbl');
            for (var i = 0, len = tbls.length; i < len; i++) {
                if (tbls.eq(i).hasClass('got')) {
                    matchKeyword(type == 1 ? tbls.eq(i).siblings('.tbl') : tbls.eq(i).siblings('.view'));
                } else {
                    queryAndMatch(tbls.eq(i));
                }
            }
        }
        else {
            if ( globalParam.searchParam.isSearch )
                return ;
            globalParam.searchParam.isSearch = true;
            $.fn.ajaxAPI({
                url: 'db/search?pid='+$('#userApp').val()+'&keyword=&mtype=1&dbId='+globalParam.sourceId,
                callback: function(data){
                    var tbls = $('.tblList .getTbl');
                    data.model.databases.map(function(v, i){
                        if ( !tbls.eq(i).hasClass('got') ){
                            tbls.eq(i).addClass('got');

                            var tblArr = [], viewArr = [] ;
                            v.tables.map(function(vv){
                                if ( vv.type === 'TABLE' ){
                                    tblArr.push(vv);
                                    return ;
                                }
                                viewArr.push(vv);
                                return ;
                            });
                            var tbl = template('template/sourceTbl', {
                                model: tblArr,
                                isChecked: false
                            });
                            tbls.eq(i).siblings('.tbl').html(tbl);
                            var view = template('template/sourceView', {
                                model: viewArr,
                                isChecked: false
                            });
                            tbls.eq(i).siblings('.view').html(view);
                        }
                        matchKeyword( type == 1 ? tbls.eq(i).siblings('.tbl') : tbls.eq(i).siblings('.view') );
                    });

                }
            });
        }
    }, 300);
}
$('.leftSide').on('click', '.clear', function(){
    $('.leftSide .keyword').val('');
    srcSearch();
});

$('.leftSide').on('keyup', '.keyword', function(e) {
    if (e.which == 13 ) {
        srcSearch();
        return;
    }
});
// 点击搜索图标
$('.leftSide').on('click', '.query', srcSearch);

//查询并匹配
function queryAndMatch(getTbl) {
	var li = getTbl.parent(),
		schema = li.data("schema") || '',
		catalog = li.data('catalog') || '';

	var param = {
		dbId: globalParam.sourceId
	};
	schema && (param['schema'] = schema);
	catalog && (param['catalog'] = catalog);
	var isChecked = false;
	$.fn.ajaxAPI({
		url: 'db/table/tbls',
		data: param,
		callback: function(data) {
			getTbl.addClass('got').html('-');
            var tblArr = [], viewArr = [] ;
            data.model.map(function(v){
                if ( v.type === 'TABLE' ){
                    tblArr.push(v);
                    return ;
                }
                viewArr.push(v);
                return ;
            });
            var type = $('.mtype .radio.cur').attr('data-val');
            var tbl = template('template/sourceTbl', {
                model: tblArr,
                isChecked: false
            });
            li.find('.tbl').html(tbl);
            var view = template('template/sourceView', {
                model: viewArr,
                isChecked: false
            });
            li.find('.view').html(view);
			matchKeyword(type == 1 ? li.find('.tbl') : li.find('.view'));
		}
	});
}
// 匹配关键字及展开隐藏
function matchKeyword(tblDom) {
	var tblNames = tblDom.find('p');
	var countTag = 0;
	var reg = RegExp('('+globalParam.searchParam.keyword+')', "ig");

    var dbMatch = false;
    if ( reg.test(tblDom.parent().attr('data-dbname')) ){
        tblDom.siblings('p').html( tblDom.parent().attr('data-dbname').replace(reg, '<span class="red">$1</span>') );
        tblDom.find('li').removeClass('hidden');
        dbMatch = true;
    }
    else {
        tblDom.siblings('p').html( tblDom.parent().attr('data-dbname') );
    }

	for(var i = 0, len = tblNames.length; i < len; i++) {
        if ( dbMatch ){
            tblNames.eq(i).html(tblNames.eq(i).text().replace(reg, '<span class="red">$1</span>'));
            continue ;
        }
		if( reg.test(tblNames.eq(i).text()) ) {
			tblNames.eq(i).parent().removeClass('hidden');
            tblNames.eq(i).html(tblNames.eq(i).text().replace(reg, '<span class="red">$1</span>'));
            countTag++;
		} else {
			tblNames.eq(i).parent().addClass('hidden');
		}
	}

	if(countTag == 0 && !dbMatch ) {
		tblDom.parent().addClass('hidden');
	} else {
        if ( globalParam.searchParam.keyword === '' ){
            tblDom.slideUp().siblings('.getTbl').html('+');
            tblDom.parent().removeClass('hidden');
            tblDom.find('li').removeClass('hidden');
            return ;
        }
		// 展开父元素
		tblDom.slideDown().siblings('.getTbl').html('-');
		tblDom.parent().removeClass('hidden');
        globalParam.searchParam.tarNum ++ ;
	}

    if ( globalParam.searchParam.tarNum ){
        $('.leftSide .tblList > .noData').addClass('hidden');
    }
    globalParam.searchParam.checkedDbNum ++ ;
    if ( globalParam.searchParam.checkedDbNum == $('.tblList .getTbl').length && !globalParam.searchParam.tarNum ){
        // 没搜索到数据
        $('.leftSide .tblList > .noData').removeClass('hidden');
    }
}

// 右移表
$('.transfer').on('click', '.move-right', function() {
    var type = $('.mtype').find('.radio.cur').attr('data-val'),
        tarType = type == 1 ? 'tbl' : 'view' ;
    if ( $('.leftSide .tblList li:not(".hidden") .'+tarType+' .tblSelected.cur').length <= 0 )
		return ;
	var dbs = $('.leftSide .tblList .db-item:not(".hidden")'); //库
	var rightSide = $('.rightSide .target-item');
	rightSide.parent().find('.check').removeClass('cur');
    type == 1 ? $('#waitLoading').find('article').html('<p>' + common_js_lang['db.info.searchPart'] + '</p><p class="detail"></p>').end().css({display: 'block'}) : '';

    var deferArr = [], errMsg = '', errTitle = '', errDetail = '';
	for(var i = 0, len = dbs.length; i < len; i++) {
		var curDb = dbs.eq(i),
			tbls = curDb.find('.'+tarType+' li:not(".hidden") .tblSelected.cur'), //选中的表
			count = tbls.length;
        if (count == 0)
            continue;
        deferArr[i] = $.Deferred();
        move(curDb, tbls, count, deferArr[i]);
    }
    function move(curDb, tbls, count, defer) {
        var catalog = curDb.data('catalog'),
            schema = curDb.data('schema'),
            dbName = curDb.data('dbname');

        var data = {
            catalog: catalog,
            schema: schema,
            dbName: dbName,
            count: count,
            type: type,
            tbls: []
        };
        var partParam = {
            dbId: globalParam.sourceId,
            pid: $('#userApp').val(),
            tablesJsonStr: []
        };

        var rightDb = rightSide.find('.target-path[data-name="' + dbName + '"]');
        if (rightDb.length > 0) {  // 右侧已存在库
            var newCount = 0;
            for (var j = 0; j < count; j++) {
                var tblName = tbls.eq(j).siblings('p').text();
                var rightTbl = rightSide.find('[data-name="' + dbName + '"][data-tbl="' + tblName + '"]');
                if (rightTbl.length == 0) {
                    var tempObj = {};
                    tempObj['tbl'] = tblName;
                    tempObj['param'] = globalParam.targetType != 2 ? JSON.stringify({
                        tableName: tempObj['tbl']
                    }) : JSON.stringify({
                        fileName: tempObj['tbl'] + '.txt',
                        tarName: tempObj['tbl'] + '.txt'
                    });
                    data['tbls'].push(tempObj);
                    newCount++;
                    partParam.tablesJsonStr.push($.extend({tableName: tblName}, {
                        catalog: catalog,
                        schema: schema
                    }));
                }
            }
            if (newCount <= 0) {
                defer.resolve();
                return ;
            }
            if (type == 1) {
                partParam.tablesJsonStr = JSON.stringify(partParam.tablesJsonStr);
                $.ajax({
                    url: 'db/table/partitions/batch',
                    type: 'post',
                    data: partParam,
                    success: function (res) {
                        if (res.code != 200) {
                            defer.reject();
                            ErrTip(res.i18nMsg.title, res.i18nMsg.detail, res.msg);
                            return;
                        }
                        res.model.map(function (v, i) {
                            if (v.code != 200) {
                                data['tbls'].splice(i, 1);
                                newCount--;
                                errMsg += v.msg;
                                return;
                            }
                            data['tbls'][i]['partition'] = v.model.partitions.length == 0 ? '' : JSON.stringify(v.model.partitions);
                        });
                        data['isDb'] = globalParam.targetType != 2;
                        var newTblDom = $(template('template/targetTbl', data)).siblings('tr:not(".target-path")');
                        rightSide.find('[data-name="' + dbName + '"]').slice(-1).after(newTblDom);
                        rightDb.find('b').html(+rightDb.find('b').html() + newCount);
                        defer.resolve();
                    }
                });
            }
            else {
                data['isDb'] = globalParam.targetType != 2;
                var newTblDom = $(template('template/targetTbl', data)).siblings('tr:not(".target-path")');
                rightSide.find('[data-name="' + dbName + '"]').slice(-1).after(newTblDom);
                rightDb.find('b').html(+rightDb.find('b').html() + newCount);
                defer.resolve();
            }
            return ;
        }

        for (var j = 0; j < count; j++) {
            var tempObj = {};
            tempObj['tbl'] = tbls.eq(j).siblings('p').text();
            tempObj['param'] = globalParam.targetType != 2 ? JSON.stringify({
                tableName: tempObj['tbl']
            }) : JSON.stringify({
                fileName: tempObj['tbl'] + '.txt',
                tarName: tempObj['tbl'] + '.txt'
            });
            data['tbls'].push(tempObj);
            partParam.tablesJsonStr.push($.extend({tableName: tempObj['tbl']}, {catalog: catalog, schema: schema}));
        }
        if (type == 1) {
            partParam.tablesJsonStr = JSON.stringify(partParam.tablesJsonStr);
            $.ajax({
                url: 'db/table/partitions/batch',
                type: 'post',
                data: partParam,
                success: function (res) {
                    if (res.code != 200) {
                        defer.reject();
                        ErrTip(res.i18nMsg.title, res.i18nMsg.detail, res.msg);
                        return;
                    }
                    res.model.map(function (v, i) {
                        if (v.code != 200) {
                            data['tbls'].splice(i, 1);
                            count--;
                            errTitle ? '' : errTitle = v.i18nMsg.title ;
                            errDetail ? '' : errDetail = v.i18nMsg.detail ;
                            errMsg += v.msg;
                            return;
                        }
                        data['tbls'][i]['partition'] = v.model.partitions.length == 0 ? '' : JSON.stringify(v.model.partitions);
                    });
                    data['isDb'] = globalParam.targetType != 2;
                    $('.rightSide .target-item').append(template('template/targetTbl', data));
                    defer.resolve();
                }
            });
        }
        else {
            data['isDb'] = globalParam.targetType != 2;
            $('.rightSide .target-item').append(template('template/targetTbl', data));
            defer.resolve();
        }
    }


    $.when.apply($, deferArr).done(function(){
        $('.leftSide .tbl li, .leftSide i.check.cur').removeClass('cur'); //去掉源的勾选
        type == 1 ? $('#waitLoading').css({display:'none'}) : '';
        $('.rightSide h4 b').html('('+$('.target-item .target-name').length+')');
        errMsg && ErrTip(errTitle, errDetail, errMsg, 'info');
        $('.rightSide .target-item tr:not(".noDataTr")').length > 0 && $('.rightSide .target-item .noDataTr').remove();
    }).fail(function(){
        type == 1 ? $('#waitLoading').css({display:'none'}) : '';
    });
});

// 左移表
$('.transfer').on('click', '.move-left', function() {
	$('.rightSide .target-item .check.cur').parents('tr').remove();
	$('.rightSide .allSelected').removeClass('cur');
	var dbs = $('.rightSide .target-item .target-path');
    var allCount = 0;
    for(var i = 0, len = dbs.length; i < len; i++) {
		var dbName = dbs.eq(i).data('name'),
			count = $('.rightSide .target-item [data-name="' + dbName + '"]:not(".target-path")').length;
        dbs.eq(i).find('td b').html(count);
        allCount += count ;
    }
    $('.rightSide h4 b').html('('+allCount+')');
    $('.rightSide .target-item tr').length == 0 && $('.rightSide .target-item').append('<tr class="noDataTr"><td colspan="4" class="tableNoData"><img src="resources/dist/images/noData.png">'+common_js_lang['manage.title.noData']+'</td></tr>');
});

// 必读说明 hover
var hoverInterval = 0;
$('.global-batch .dbTab strong, .global-ConfigCon .dbTab strong').hover(function(){
    var self = $(this);
    hoverInterval = setTimeout(function(){
            self.find('.tip').css({display:'block'});},
        300);
}, function(){
    clearInterval(hoverInterval);
    $(this).find('.tip').css({display:'none'});
});

////// 批量设置
/// 批量设置  弹出层
$('.rightSide').on('click', '.batch', function() {
	if($('.rightSide .target-item .target-tbl.cur').length <= 0) {
		MsgTip('', common_js_lang['db.info.tarEmpty'], 'info');
		return;
	}

	if(globalParam.targetType == 2) {
		$('.global-batch').removeClass('fixed');
		$('.global-batch .hdfsTab p .check').removeClass('cur');
		$('.global-batch .hdfsTab p .show').removeClass('in');
		$('.global-batch .hdfsTab .ul:not(:first-child)').css({
			display: 'none'
		});
		$('.global-batch .hdfsTab .selectedDir').val('');

		$('.global-batch .hdfsTab').removeClass('hidden');
		$('.global-batch .dbTab').addClass('hidden');
	} else {
		$('.global-batch').addClass('fixed');
		$('.global-batch .hdfsTab').addClass('hidden');
		$('.global-batch .dbTab').removeClass('hidden');
		$('.global-batch #batch-dbName').val('').select2();
	}

	$('.global-mask, .global-batch').fadeIn();
});


$('.global-batch').on('click', '.btn-item', function() {
	if (globalParam.targetType == 2) {
		var path = $('.global-batch .hdfsTab .selectedDir').val().trim();
		if(!path) {
			MsgTip('', common_js_lang['db.info.batchDir'], 'info');
			return;
		}
		
		var target = $('.rightSide .target-item .target-tbl.cur'),
			len = target.length;
		for(var i = 0; i < len; i++) {
			var defaultName = target.eq(i).parent().text() + '.txt';
			if ( defaultName.match(/\s+|\\+/g) ){
				target.eq(i).parent().siblings('.fileName').html('');
				continue ;
			}
			target.eq(i).parent().attr('data-param', JSON.stringify({fileName: path + (path != '/'? '/':'') + defaultName}));
			target.eq(i).parent().siblings('.fileName').html(path + (path != '/'? '/':'') + defaultName);
		}
		$('.global-mask, .global-batch').fadeOut();
	} else {		
		var batchOption = $('#batch-dbName option:selected'),
			batchName = batchOption.val(),
			schema = batchOption.data('schema'),
			catalog = batchOption.data('catalog');

		if( !batchName ) {
			MsgTip('', common_js_lang['db.info.dbEmpty'], 'info');
			return;
		}

		var target = $('.rightSide .target-item .target-tbl.cur'),
			tarLen = target.length,
			fromTablesJson = [],
			toTablesJson = [] ;
		for(var i = 0; i < tarLen; i++) {
			var tblName = target.eq(i).parent().text();
			if ( !tblName.match(/^[0-9A-Za-z]\w*$/g) ){
				target.eq(i).parent().attr('data-param', JSON.stringify({
					name: batchName,
					catalog: catalog,
					schema: schema,
					id: globalParam.targetId
				}));
				target.eq(i).parent().siblings('.db').html(batchName);				
				target.eq(i).parent().siblings('.tbl').html('');								
				continue ;
			}
			else {
				var tr = target.eq(i).parents('tr') ;
				fromTablesJson.push({catalog:tr.data('catalog'), schema:tr.data('schema'), tableName:tblName, index:i}) ;
				toTablesJson.push({catalog:catalog, schema:schema, tableName:tblName, tableType:globalParam.targetType == 1? 0:1});
			}
		}
		
		if ( fromTablesJson.length <= 0 ){
			$('.global-mask, .global-batch').fadeOut();
			$('#waitLoading').css({display:'none'});
			return ;
		}

        $('#waitLoading').find('article').html('<p>'+common_js_lang['loading.info.batchConf'].replace(/\[x\]/, fromTablesJson.length)+'</p><p class="detail"></p>').end().css({display:'block'});
		var errMsg = '',
            errTitle = '',
            errDetail = '',
            succCount = 0,
            failCount = 0 ;
        var init= 0, len=fromTablesJson.length;

        spliceConfig();
        function spliceConfig(){
            if ( init >= len ) {
                $('#waitLoading').css({display:'none'});
                if (errMsg) {
                    ErrTip(errTitle, errDetail, common_js_lang['loading.info.confInfo'].replace(/\[x\]/,succCount).replace(/\[y\]/, failCount) +'\n'+errMsg, 'info');
                    return;
                }
                $('.global-batch, .global-mask').fadeOut();
                return;
            }
            var fromJson = JSON.stringify(fromTablesJson.slice(init, init+100)),
                amount = init + 100 <= len ? 100 : len-init,
                toJson = JSON.stringify(toTablesJson.slice(init, init+100)) ;
            $.ajax({
                url: 'db/table/ddl/batch',
                type: 'post',
                contentType: 'application/x-www-form-urlencoded',
                data: {
                    fromId: globalParam.sourceId,
                    toId: globalParam.targetId,
                    pid: $('#userApp').val(),
                    fromTablesJson: fromJson,
                    toTablesJson: toJson
                },
                success: function (data) {
                    if ( data.code != 200 ){
                        failCount += amount ;
                        errTitle ? '' : errTitle = data.i18nMsg.title ;
                        errDetail ? '' : errDetail = data.i18nMsg.detail ;
                        errMsg += data.msg+'\n' ;
                    }
                    else {
                        var formatVal = {
                            text: '0',
                            orc: '1',
                            parquet: '2',
                            rcfile: '3',
                            sequencefile: '4'
                        } ;
                        data.model.map(function (v, i) {
                            var index = fromTablesJson[i + init].index;
                            if (v.code != 200) {
                                failCount++;
                                errTitle ? '' : errTitle = v.i18nMsg.title ;
                                errDetail ? '' : errDetail = v.i18nMsg.detail ;
                                errMsg += '[' + fromTablesJson[i + init].tableName + ']:' + v.msg + '.\n ';
                                return;
                            }
                            succCount++;
                            var tableType = formatVal[v.model.format] || 0;
                            var dom = target.eq(index).parent();
                            dom.attr('data-param', JSON.stringify({
                                createSql: v.msg == 'new' ? v.model.ddl : '',
                                ddl: v.msg == 'show' ? v.model.ddl : '',
                                name: batchName,
                                tableName: fromTablesJson[i + init].tableName,
                                catalog: catalog,
                                schema: schema,
                                dbId: globalParam.targetId,
                                tableType: tableType
                            }));
                            dom.siblings('.db').html(batchName);
                            dom.find('.check').click();
                        });
                    }
                    $('#waitLoading').find('article .detail').html(common_js_lang['loading.info.confInfo'].replace(/\[x\]/,succCount).replace(/\[y\]/, failCount)) ;
                    init += 100 ;
                    spliceConfig();
                }
            });
        }
	}	
});


$('.global-batch').on('click', '.btn-cancel, h4 .cancel', function() {
	$('.global-mask, .global-batch').fadeOut();
});
////////////// 批量设置 end

// 进入 path 配置
$('.rightSide').on('click', '.target-item .config', function() {
	$(this).addClass('active');
    $(this).parent().attr('data-partition') ? globalParam.partTag = true : globalParam.partTag = false ;

	var columnDefer = $.Deferred();
	var maskInterval = setTimeout(function(){ $('#globalLoadCon').css({display:'block'}); },200);
	var targetNameDom = $(this).siblings('.target-name');
	var param = targetNameDom.attr('data-param') ? JSON.parse(targetNameDom.attr('data-param')) : {},
		filter = targetNameDom.attr('data-filter') ? JSON.parse(targetNameDom.attr('data-filter')) : {};
	$.when( columnDefer ).then(function(){
		window.clearInterval(maskInterval);				
		$('#globalLoadCon').css({display:'none'});	
 		resetConfigCon(param, filter);
	});
    columnDefer.resolve();
    $('.global-mask, .global-ConfigCon').fadeIn();
	editor.refresh();
});
/// 初始化 config 弹出层
function resetConfigCon(param, filter) {
	$('.global-ConfigCon .configCon .configTab a').eq(0).click();
	$('.global-ConfigCon .configCon .configTab a').eq(0).html([common_js_lang['local.option.getDir'], common_js_lang['db.title.scanSql']][+(globalParam.targetType != 2)]);

	if(globalParam.targetType == 2) {
		hdfsConfig(param);
	} else if(globalParam.targetType == 1) {
		hiveConfig(param);
	}
}

////  右侧 radio checked
//全选
$('.rightSide').on('click', '.allSelected', function() {
	$(this).toggleClass('cur');
	var isCheck = $(this).hasClass('cur');
	$('.rightSide .target-db, .rightSide .target-tbl').toggleClass('cur', isCheck);
});
// 库选择
$('.rightSide').on('click', '.target-db', function() {
	$(this).toggleClass('cur');
	var isCheck = $(this).hasClass('cur');
	var dbName = $(this).parents('.target-path').data('name');
	$('.rightSide [data-name="' + dbName + '"] .check').toggleClass('cur', isCheck);

	if($('.rightSide .target-db').length == $('.rightSide .target-db.cur').length) {
		$('.rightSide .allSelected').addClass('cur');
	} else {
		$('.rightSide .allSelected').removeClass('cur');
	}
});
// 表选择
$('.rightSide').on('click', '.target-tbl', function() {
	$(this).toggleClass('cur');
	var dbName = $(this).parents('tr').data('name');
	var dbCheck = $('.rightSide [data-name="' + dbName + '"] .target-tbl').length == $('.rightSide [data-name="' + dbName + '"] .target-tbl.cur').length;
	$('.rightSide [data-name="' + dbName + '"] .target-db').toggleClass('cur', dbCheck);

	var allCheck = $('.rightSide .target-tbl').length == $('.rightSide .target-tbl.cur').length;
	$('.rightSide .allSelected').toggleClass('cur', allCheck);
});
//////////////// radio end 
///////////////////////////
function partAllList(src, tar){
    var srcLen =src.length,
        tarLen = tar.length,
        srcArr = [] ;

    var _srcHtml = '<div class="flex-item"><span class="item row-flex"><span class="item check head"><i class="check cur"></i></span>',
        _tarHtml = '<span class="item row-flex">',
        _mainHtml = '';

    var _column = '<div class="item row-flex">',
        _defaultPart = '' ;

    src.map(function(v, i){
        _srcHtml += '<span class="item" title="'+ v.name+'">'+ v.name+'</span>';
        _column += '<span class="item" title="'+ v.name+'">'+ v.name+'</span>';
    });
    _srcHtml += '</span>';
    _column += '</div><div class="item row-flex">';


    var _batchHtml = '';
    tar.map(function(v){
        _tarHtml += '<span class="item" title="'+v+'">'+ v+'</span>';
        _batchHtml += '<div class="clearfix"><span class="key" title="'+v+'">'+v+'</span><span>=</span><span class="val"><select>'+globalParam.columnValOption+'</select></span></div>';
        _column += '<span class="item" title="'+v+'">'+v+'</span>';
    });
    $('.setPart .batchPartCon .batchList').html(_batchHtml).find('select').select2({tags:true});
    _tarHtml += '</span>';
    _mainHtml = _srcHtml + _tarHtml + '</div>';
    _column += '</div>';
    $('.setPart .partType_2 .columnShow .content').html(_column);

    //同部分区配置
    var columnTip = '',
        defaultPart = '';
    if ( srcLen > tarLen ){
        columnTip = common_js_lang['db.info.lostPart'];
    }
    else if ( srcLen < tarLen ){
        columnTip = common_js_lang['db.info.setExpPart'];
        for ( var i=srcLen; i<tarLen; i++ ){
            defaultPart += '<div class="flex-item"><span class="item">'+tar[i]+'</span><span class="item"><select>'+globalParam.columnValOption+'</select></span></div>';
        }
    }
    $('.setPart .defaultPartVal .content').html(defaultPart).find('select').select2({tags:true});
    if ( !defaultPart )
        $('.setPart .defaultPartVal').addClass('hidden');
    else
        $('.setPart .defaultPartVal').removeClass('hidden');

    $('.setPart .partType_2 .tip').html(columnTip);

    var srcDecr = src[0].values;
    for ( var i= 0, len=srcDecr.length; i<len; i++ ){
        _srcHtml = '<div class="flex-item"><span class="item row-flex"><span class="item check"><i class="check cur" data-key="'+srcDecr[i]+'"></i></span>';
        _tarHtml = '<span class="item row-flex tar">';
        var keyVal = srcDecr[i].split('/');
        for ( var j= 0; j<srcLen; j++ ){
            var val = keyVal[j].split('=').slice(1).join('=');
            _srcHtml += '<span class="item" title="'+val+'">'+val+'</span>' ;
            if ( j < tarLen )
                _tarHtml += '<span class="item"><select><option>'+val+'</option>'+globalParam.columnValOption+'</select></span>';
        }
        var diffLen = tarLen - srcLen;
        while ( diffLen > 0 ){
            _tarHtml += '<span class="item"><select>'+globalParam.columnValOption+'</select></span>';
            diffLen -- ;
        }
        _srcHtml += '</span>';
        _tarHtml += '</span>';
        _mainHtml += _srcHtml + _tarHtml + '</div>';
    }
    $('.setPart .partCon').html( _mainHtml ).find('select').select2({tags:true});
}

// 数组笛卡尔
function descartes(arr){
    if ( arr.length == 1 ){
        var newArr = [];
        arr[0].map(function(v){
           var temp = [];
            temp.push(v);
            newArr.push(temp);
        });
        return newArr ;
    }

    var arr1 = arr[0],
        arr2 = arr[1],
        decrArr = [];
    for ( var i= 0,len1=arr1.length; i<len1; i++ ){
        for ( var j=0,len2=arr2.length; j<len2; i++ ){
            var tempArr = [ arr1[i] ];
            tempArr.push(arr2[j]);
            decrArr.push( tempArr );
        }
    }
    arr.splice(0, 2);
    arr.splice(0, 0, decrArr);
    return descartes(arr);
}

// 保存hive配置信息
$('.global-ConfigCon').on('click', '.btn-item', function() {
    if ( $(this).hasClass('next') ){    //下一步配置
        var tarColumn = [],
            tag = false;
        $('#partitions .flex-item:not(".head") .key').map(function(i, v){
            if ( $(v).parent().hasClass('new') ) {
                var input = $(v).find('input').val().trim();
                if ( !input.match(/^(\w|_|-|\(|\))+$/g) ){
                    tag = true ;
                    $(v).find('input').addClass('error');
                    return ;
                }
                $(v).find('input').removeClass('error');
                tarColumn.push(input);
            }
            else
                tarColumn.push( $(v).text() ) ;
        });
        if ( tag ) {
            MsgTip('', common_js_lang['db.info.partChars'], 'info');
            return;
        }

        $('.global-ConfigCon .dbTab').addClass('hidden');
        $('.global-ConfigCon .setPart').removeClass('hidden');
        if ( JSON.stringify(tarColumn) !== $(this).attr('data-part') ) {
            var srcPart = JSON.parse($('.config.active').parent().attr('data-partition'));
            partAllList(srcPart, tarColumn);
            $(this).attr('data-part', JSON.stringify(tarColumn));
            $(this).html(common_js_lang['db.text.save']).removeClass('next');
            $(this).siblings('.prev').removeClass('hidden');
            return ;
        }

        $(this).html(common_js_lang['db.text.save']).removeClass('next');
        $(this).siblings('.prev').removeClass('hidden');
        return ;
    }

	var param = saveParamSwitch();
	if(!param) {
		return false;
	}
    if ( globalParam.partTag && param.noPart ){   // 没配置分区
        swal({
            title: '',
            text: common_js_lang['db.text.lostPartSure'],
            type: 'info',
            showCancelButton: true,
            confirmButtonText: common_js_lang['db.text.returnCheck'],
            cancelButtonText: common_js_lang['db.text.confirm']
        }, function(isConfirm){
            if ( isConfirm ){
                return ;
            }
            else {
                handle();
            }
        });
    }
    else if ( globalParam.partTag && !param.partAll && !param.useSynchronized ){  //分区不是全部勾选
        swal({
            title: '',
            text: common_js_lang['db.text.transPart'],
            type: 'info',
            showCancelButton: true,
            confirmButtonText: common_js_lang['db.text.allTrans'],
            cancelButtonText: common_js_lang['db.text.yes']
        }, function(isConfirm){
            if ( isConfirm ){
                $('.setPart .partCon .item.head .check').click();
                return ;
            }
            else {
                handle();
            }
        });
    }
    else {
        handle();
    }
    function handle() {
        var activeButton = $('.rightSide .target-item .config.active').removeClass('active');
        activeButton.siblings('.target-name')
            .attr('data-param', JSON.stringify(param));

        if (globalParam.targetType == 2) {
            activeButton.siblings('.fileName').html(param.fileName);
        } else {
            activeButton.siblings('.db').html(param.name);
            activeButton.siblings('.tbl').html(param.tableName);
        }
        $('.global-mask, .global-ConfigCon').fadeOut();
    }
});

// 取消按钮
$('.global-ConfigCon').on('click', '.btn-cancel, .cancel', function() {
	$('.global-mask, .global-ConfigCon').fadeOut();
	$('.rightSide .target-item .config.active').removeClass('active')
});

//同步增量勾选
$('.setPart').on('click', '.useSynch .pop', function() {
    if ( $(this).find('.check').length == 1 ){
        var tar = $(this).find('.check');
        tar.toggleClass('cur');
        tar.hasClass('cur') ? $('.setPart .head, .setPart .main').addClass('hidden') : $('.setPart .head, .setPart .main').removeClass('hidden');
    }
    else if ( $(this).find('.radio').length == 1 ){
        $(this).parent().find('.radio').removeClass('cur');
        $(this).find('.radio').addClass('cur');
    }
});

// 分区配置上一步
$('.global-ConfigCon').on('click', '.prev', function() {
    $('.global-ConfigCon .setPart').addClass('hidden');
    $('.global-ConfigCon .dbTab').removeClass('hidden');

    $(this).siblings('.btn-item').html(common_js_lang['db.text.next']).addClass('next');
    $(this).addClass('hidden');
});
// 分区勾选
$('.setPart').on('click', '.item.check', function(){
    var tar = $(this).find('i.check');
    if ( $(this).hasClass('head') ){  // 全选
        if ( tar.hasClass('cur') ){
            $('.setPart .main i.check.cur').removeClass('cur');
        }
        else {
            $('.setPart .main i.check').addClass('cur');
        }
        return ;
    }

    if ( tar.hasClass('cur') ){
        tar.removeClass('cur');
        $('.setPart .main .item.head i.check').removeClass('cur');
    }
    else {
        tar.addClass('cur');
        var isAll = $('.setPart .main .item:not(".head") i.check').length === $('.setPart .main .item:not(".head") i.check.cur').length;
        isAll ?  $('.setPart .main .item.head i.check').addClass('cur') : '';
    }
    return;
});

// 批量配置分区
$('.setPart').on('click', '.batchPart', function(){
    if ( $('.setPart .partCon .check.cur').length > 0 )
        $('.batchPartCon').removeClass('hidden');
});
$('.setPart').on('click', '.batchCancel', function() {
    $('.batchPartCon').addClass('hidden');
});
$('.setPart').on('click', '.batchSave', function() {
    var batchDiv = $('.setPart .batchList > div');
    var batchVal = [];
    for ( var i= 0,len=batchDiv.length; i<len; i++ ){
        var val = batchDiv.eq(i).find('.val select').val().trim();
        if ( val === '' || !val.match(/^(\w|_|-|\(|\))+$/g) ){
            MsgTip('', common_js_lang['db.info.partChars'], 'info');
            return ;
        }
        batchVal.push(val);
    }
    var checkIndex = $('.setPart .partCon .item:not(".head") .check.cur'),
        tarPartDom = $('.setPart .partCon .row-flex.tar') ;
    for ( var i= 0,len=checkIndex.length; i<len; i++ ){
        var tarSelect = checkIndex.eq(i).parents('.flex-item').find('.row-flex.tar select');
        tarSelect.map(function(i, v){
           if ( $(v).val( batchVal[i] ) !== batchVal[i] ) {
               $(v).prepend('<option value="'+batchVal[i]+'">'+batchVal[i]+'</option>');
           }
            $(v).select2({tags:true});
        });
    }
    $('.batchPartCon').addClass('hidden');
});

//分区方式
$('.setPart').on('click', '.partType label', function(){
    if ( $(this).find('.radio.cur').length )
        return ;
    $(this).parent().find('.radio.cur').removeClass('cur');
    $(this).find('.radio').addClass('cur');

    var type = $(this).find('.radio').data('val');
    $('.setPart .partTypeTab').addClass('hidden');
    $('.setPart .partType_'+type).removeClass('hidden');
});

/////////// 保存参数  
function saveParamSwitch() {
	switch(globalParam.targetType) {
		case '1':
			return saveHiveParam();
		case '2':
			return saveHdfsParam();
	}
}

///////  hdfs 配置
function getDir(base, isHome) {
	base = base || '';
	var parentDom = base != '' ? $('.dirDos [data-base="' + base + '"] > .ul') : $('.hdfsTab .dirDos > .ul');
	$.fn.ajaxAPI({
        url: isHome && 'hdfs/dir/home' || 'hdfs/dir/list',
        data: {base:base, hid: globalParam.connId, pid:$('#userApp').val()},
		loadTime: base == '' ? 0 : 2000,
		callback: function(data) {
			if ( !isHome && data.model.length == 0 ){
				parentDom.siblings('p').find('.show').addClass('out');
				return false;
			}
			isHome && (data.model = [data.model]); 
			var len = base.length;
			var dirHtml = template('template/hdfsDir', {
				dir: data.model,
				len: base.length
			});
			parentDom.html(dirHtml);
		}
	});
}

function hdfsConfig(param) {
	if ( param.tarName ){    //
		var curPath = param.tarDir || '',
			name = param.tarName || '';
	}
	else {        // 编辑任务的情况， 没有tarName参数
		var curPath = param.fileName || '',
			name = '';
		if(curPath) {
			var name = curPath.split('/').slice(-1).join('/');
			curPath = curPath.split('/').slice(0,-1).join('/') || curPath.match(/\//g) && '/';
		}
	}

	$('.global-ConfigCon .hdfsTab p .check').removeClass('cur');
	$('.global-ConfigCon .hdfsTab p .show').removeClass('in');

	$('.global-ConfigCon .hdfsTab .ul:not(:first-child)').css({display: 'none'});
	$('.global-ConfigCon .hdfsTab .selectedDir').val(curPath);
	$('.global-ConfigCon .hdfsTab .fileName').val(name);

	if(curPath) {
		var target = $('.global-ConfigCon .hdfsTab [data-base="' + curPath + '"]');
		if(target.length == 1) {
			target.find('>p .check').addClass('cur');
			target.parents('.ul').fadeIn().siblings('p').find('.show').addClass('in');
		}
	}
}

// 双击进入下一层级或者收起
$('.hdfsTab').on('click', 'li p .show', function() {
	if($(this).parent().siblings('ul').find('li').length == 0) {
		getDir($(this).parents('li').data('base'));
		$(this).toggleClass('in');
		$(this).parent().siblings('.ul').fadeIn();
	} else {
		$(this).toggleClass('in');
		$(this).parent().siblings('ul').toggle();
	}
});

// 单击选中路径
$('.hdfsTab').on('click', 'li p .check', function() {
	if($(this).hasClass('cur'))
		return;
	$('.hdfsTab li p .check').removeClass('cur');
	$(this).addClass('cur');
	var base = $(this).parents('li').data('base');
	$('.hdfsTab .selectedDir').val(base);
});

////////  hdfs 配置 end

///  hive db 配置
//// hive config 配置
function hiveConfig(param) {
    var container = $('.global-ConfigCon');
    var dbName = param.name || '',
        tableName = param.tableName || '',
		partition = param.partition || '',
		nextPartTag = false;

    globalParam.partTag && param.partAll && partition == '' ? nextPartTag = true : '';  //自定义分区 全选
    globalParam.partTag && param.useSynchronized ? nextPartTag = true : '';  //启用字段同步
    console.log(param);

    container.find('.hive .infoline.last').hide();
    container.find('#partitions').empty();

    $('.global-ConfigCon .hive .tableType').val( param.tableType || 0).prop('disabled', param.ddl != '');
    //配置框 初始化
    $('.global-ConfigCon .dbTab').removeClass('hidden');
    $('.global-ConfigCon .newPart').css({display:'none'});

    $('.global-ConfigCon .setPart').addClass('hidden');
    $('.global-ConfigCon .btn-item').attr('data-part', '').removeClass('next').html(common_js_lang['db.text.save']);
    $('.global-ConfigCon .prev').addClass('hidden');

    $('.global-ConfigCon .partType label').eq(param.useSynchronized? 1:0).click();
    $('.global-ConfigCon .useSynch .radio').eq(0).click();
    $('.global-ConfigCon .setPart .batchPartCon').addClass('hidden');

    if ( param.tarPartHandleType ) {
        $('.global-ConfigCon .useSynch .pop .radio.cur').removeClass('cur');
        $('.global-ConfigCon .useSynch .pop[data-val="' + param.tarPartHandleType + '"] .radio').addClass('cur');
    }

    if(dbName) {
        if ( container.find('#dbName').val() != dbName || (!param.ddl && !param.createSql) ){
			$('#dbName').val(dbName).select2();
            hiveModule.getTables(param);
		}
		else {
            container.find('#tableName').val(tableName).select2({tags:true});
            if ( container.find('#tableName').val() != tableName ){
                container.find('#tableName').append('<option value="'+tableName+'">'+tableName+'</option>').val(tableName).select2({tags:true});
            }

			if ( param.createSql){  //新表
                if ( !partition && !nextPartTag ) {
                    $('.global-ConfigCon .newPart').css({display:'block'});
                }
                else {
                    // 新建分区
                    if ( !globalParam.partTag ) {  //源表为非分区表
                        var format = partFormat(1);
                        var _html = format.head;
                        $('.global-ConfigCon .newPart').css({display: 'none'});
                        $('#partitions').html(_html).parent().css({display: 'block'});
                        var partitionObj = JSON.parse(partition);
                        for (var k in partitionObj) {
                            var v = partitionObj[k];
                            var item = $('#partitions').append(format.item).find('.flex-item.new:last-child');
                            item.find('.type select').val(v.type);
                            item.find('.key input').val(k);
                            var itemVal = item.find('.val select');
                            itemVal.val(v.value);
                            if (itemVal.val() != v.value) {
                                itemVal.prepend('<option value="' + v.value + '">' + v.value + '</option>');
                            }
                            itemVal.select2({tags: true});
                        }
                    }
                    else {  // 源表为分区表
                        var newPart = JSON.parse(param.newPart) ;
                        var format = partFormat(2);
                        $('.global-ConfigCon .newPart').css({display: 'none'});
                        $('#partitions').html(format.head).parent().css({display: 'block'});

                        var srcPart = JSON.parse($('.config.active').parent().attr('data-partition')),
                            tarColumn = [] ;

                        for ( var k in newPart ){   //新建分区展示
                            tarColumn.push(k);
                            var v = newPart[k];
                            var item = $('#partitions').append(format.item).find('.flex-item.new:last-child');
                            item.find('.type select').val(v.type);
                            item.find('.key input').val(k);
                        }
                        var partitions = param.partition || '';
                        globalParam.partTag && param.partAll && partitions == '' ? partitions = true : '';
                        globalParam.partTag && param.useSynchronized ? partitions = true : '';
                        partitionReshow(partitions, param, srcPart, tarColumn );
                    }
                };
            }
		}
		if ( param.ddl ){
            hiveModule.getPart(param.tableName, param.catalog, param.schema, param.partition, param);
            editor.doc.cm.setOption('readOnly', true);
			$('.new-sql .CodeMirror').addClass('disabled');
			editor.doc.setValue(param.ddl); 
		} 
		if ( param.createSql ) {
			editor.doc.cm.setOption('readOnly', false);
			$('.new-sql .CodeMirror').removeClass('disabled');
            editor.doc.setValue(param.createSql);
		}
	}
    else {
		$('#dbName').val('').select2();
		$('#tableName').html('<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option><option>' + tableName + '</option>').val(tableName).select2({tags: true});
		editor.doc.cm.setOption('readOnly', true);
		$('.new-sql .CodeMirror').addClass('disabled');
		editor.doc.setValue('');
		$('.hive .infoline.last').css({display: 'none'});
	}
}

function partitionReshow(partition, param, srcPart, tarColumn){
    partAllList(srcPart, tarColumn);
    $('.global-ConfigCon .btn-item').attr('data-part', JSON.stringify(tarColumn)).addClass('next').html(common_js_lang['db.text.next']);
    if ( param.useSynchronized && param.partitionExpDefault ){  //分区默认值
        var sets = JSON.parse(param.partitionExpDefault);
        $('.defaultPartVal .content select').map(function(i, v){
            if ( $(v).val(sets[i].value) != sets[i].value ){
                $(v).prepend('<option value="'+sets[i].value+'">'+sets[i].value+'</option>');
            }
            $(v).select2({tasg:true});
        });
    }
    if ( partition !== true ) {
        // 取选中的分区配置
        var sourcePart = $('.setPart .partCon .item.check:not(".head")');
        $('.setPart .partCon .check.cur').removeClass('cur');

        var partitionObj = JSON.parse(partition);
        for (var k in partitionObj) {
            var dom = sourcePart.find('.check[data-key="'+k+'"]');
            dom.click();
            var items = dom.parents('.flex-item').find('.row-flex.tar .item');
            items.map(function (i, v) {
                var select = $(v).find('select');
                select.val(partitionObj[k][i]);
                if (select.val() !== partitionObj[k][i]) {
                    select.prepend('<option value="' + partitionObj[k][i] + '">' + partitionObj[k][i] + '</option>');
                }
                select.select2({tags: true});
            });
        }
    }
}

function hiveConfigModule(param){
    this.container = param.container ;
    this.newType = param.newType || 0;
    this.editor = this.newType != 4 ? editor : SQLeditor ;
    this.event();
}

hiveConfigModule.prototype = {
    event: function(){
        var _this = this;

        _this.container.on('change', '#dbName', function(){
            var param = _this.getParam();
            if ( !param.name ){
                return ;
            }
            _this.getTables(param);
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
            _this.getDdlAct(param, _this.newType);
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
            //_this.getDdlAct(param, _this.newType);
            $("#globalLoadCon").show();
            $.when( globalParam.promiseFunc.newDbDdl(param)).then(function(data){
                _this.editor.doc.setValue(data.ddl);
                var formatVal = {
                    text: '0',
                    orc: '1',
                    parquet: '2',
                    rcfile: '3',
                    sequencefile: '4'
                } ;
                _this.container.find('.tableType').val(formatVal[data.format] || 0).prop('disabled', false);
                partDdl();
            }).always(function(){
                $("#globalLoadCon").hide();
            });
        });

    },
    getParam: function(){
        var _this = this;
        var dbDom = _this.container.find("#dbName option:selected");
        var param = {
            dbId: globalParam.targetId,
            name: dbDom.val(),
            catalog: dbDom.attr('data-catalog') || '',
            schema: dbDom.attr('data-schema') || '',
            tableName: _this.container.find('#tableName').val(),
            tableType: _this.container.find('.tableType').val(),
            pid: $('#userApp').val(),
            fromId: globalParam.sourceId,
            toId: globalParam.targetId
        };
        if ( _this.newType == 0 ) {
            param.toTablesJson = JSON.stringify([{
                catalog: param.catalog,
                schema: param.schema,
                tableName: param.tableName,
                tableType: param.tableType
            }]);
            var fromDb = $('.rightSide .target-item .config.active').parent(),
                fromCatalog = fromDb.data('catalog'),
                fromSchema = fromDb.data('schema'),
                fromTbName = $('.rightSide .target-item .config.active').siblings('.target-name').text();
            param.fromTablesJson = JSON.stringify([{catalog: fromCatalog, schema: fromSchema, tableName: fromTbName}]);
            return param;
        }

        var sql = (SQLEditor.getValue()).replace(/\n+/g, ' ').trim();
        param.sql = sql;
        param.format = _this.container.find('.tableType option:selected').text();

        return param;
    },
    getTables: function(param) {
        var _this = this;
        $("#globalLoadCon").show();
        $.when( globalParam.promiseFunc.getTables(param) ).then(function(){
            _this.container.find('.hive .infoline.last').hide();
            _this.container.find('#partitions').empty();

            var tbls = globalParam.tblModel['tbl_'+param.dbId+'_'+param.catalog+'_'+param.schema];
            var tableList = '<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option>';
            tbls.map(function(v) {
                tableList += '<option data-name="' + v.name + '">' + v.name + '</option>';
            });
            _this.container.find("#tableName").html(tableList);

            if ( !param.tableName || !param.tableName.match(/^[0-9A-Za-z]\w*$/g) ){
                _this.container.find('#tableName').val('').select2({tags:true});
                MsgTip('', common_js_lang['db.info.tableName'], 'info');
                $("#globalLoadCon").hide();
                return false;
            }

            _this.container.find('#tableName').val(param.tableName).select2({tags:true});
            if ( _this.container.find('#tableName').val() != param.tableName ){
                _this.container.find('#tableName').append('<option>'+param.tableName+'</option>').val(param.tableName).select2({tags:true});
            }

            $('.global-ConfigCon .text-right .btn-item').removeClass('next').html(common_js_lang['db.text.save']);

            if( param.tableName ) {
                if ( param.ddl ){
                    _this.getPart(param.tableName, param.catalog, param.schema, param.partition, param);
                    $("#globalLoadCon").hide();
                    return ;
                }
                if ( param.createSql ){    //复现新建表分区
                    if ( !globalParam.partTag ) {  //源表为非分区表
                        var format = partFormat(1);
                        var _html = format.head;
                        $('.global-ConfigCon .newPart').css({display: 'none'});
                        $('#partitions').html(_html).parent().css({display: 'block'});
                        var partitionObj = JSON.parse(param.partition);
                        for (var k in partitionObj) {
                            var v = partitionObj[k];
                            var item = $('#partitions').append(format.item).find('.flex-item.new:last-child');
                            item.find('.type select').val(v.type);
                            item.find('.key input').val(k);
                            var itemVal = item.find('.val select');
                            itemVal.val(v.value);
                            if (itemVal.val() != v.value) {
                                itemVal.prepend('<option value="' + v.value + '">' + v.value + '</option>');
                            }
                            itemVal.select2({tags: true});
                        }
                    }
                    else if ( globalParam.partTag && param.newPart ) {  // 源表为分区表
                        var newPart = JSON.parse(param.newPart) ;
                        var format = partFormat(2);
                        $('.global-ConfigCon .newPart').css({display: 'none'});
                        $('#partitions').html(format.head).parent().css({display: 'block'});

                        var srcPart = JSON.parse($('.config.active').parent().attr('data-partition')),
                            tarColumn = [] ;

                        for ( var k in newPart ){   //新建分区展示
                            tarColumn.push(k);
                            var v = newPart[k];
                            var item = $('#partitions').append(format.item).find('.flex-item.new:last-child');
                            item.find('.type select').val(v.type);
                            item.find('.key input').val(k);
                        }
                        var partitions = param.partition || '';
                        globalParam.partTag && param.partAll && partitions == '' ? partitions = true : '';
                        globalParam.partTag && param.useSynchronized ? partitions = true : '';
                        partitionReshow(partitions, param, srcPart, tarColumn );
                    }
                    else {
                        $('.hive .newPart').css({display:'block'});
                    }
                    $("#globalLoadCon").hide();
                    return ;
                }
                if ( !param.ddl && !param.createSql )
                    _this.getDdlAct(param, _this.newType);
                else
                    $("#globalLoadCon").hide();
            }
            else {
                _this.editor.doc.cm.setOption('readOnly', 'nocursor'); // 不显示光标
                _this.editor.doc.setValue('');
                _this.container.find('.new-sql .CodeMirror').addClass('disabled');
                _this.container.find('#tableName').val('').select2({tags: true});
                $("#globalLoadCon").hide();
            }
        }).fail(function(){
            $("#globalLoadCon").hide();
        });
    },
    getDdlAct: function(param, type){
        var _this = this;
        $("#globalLoadCon").show();
        var defer = $.Deferred();
        $.when( globalParam.promiseFunc.getDdl(param, type) ).then(function(data){
            _this.editor.doc.setValue(data.ddl);
            if ( data.isShow ){
                _this.editor.doc.cm.setOption('readOnly', 'nocursor');
                _this.container.find('.CodeMirror').addClass('disabled');
                var formatVal = {
                    text: '0',
                    orc: '1',
                    parquet: '2',
                    rcfile: '3',
                    sequencefile: '4'
                } ;
                _this.container.find('.tableType').val(formatVal[data.format] || 0).prop('disabled', true);
                _this.getPart(param.tableName, param.catalog, param.schema, param.partition, param || '', defer);
                $('.hive .newPart').css({display:'none'});
            }
            else {
                _this.editor.doc.cm.setOption('readOnly', false);
                _this.container.find('.CodeMirror').removeClass('disabled');
                var formatVal = {
                    text: '0',
                    orc: '1',
                    parquet: '2',
                    rcfile: '3',
                    sequencefile: '4'
                } ;
                _this.container.find('.tableType').val(formatVal[data.format] || 0).prop('disabled', false);
                _this.container.find('#partitions').empty();
                _this.container.find('.hive .infoline.last').hide();
                $('.hive .newPart').css({display:'block'});
                if ( globalParam.partTag ){
                    var partitions = JSON.parse( $('.rightSide .config.active').parent().attr('data-partition') ) ;
                    var format = partFormat(2);
                    $('.hive .newPart').css({display: 'none'});
                    $('.hive .infoline.last').css({display: 'block'});
                    $('#partitions').html(format.head);
                    partitions.map(function(v,i){
                        $('#partitions').append(format.item);
                        $('#partitions .flex-item:last-child').find('.type select').val(v.column.typeName.toLowerCase())
                            .end().find('.key input').val(v.name);
                        if ( ['varchar', 'char'].indexOf(v.column.typeName.toLowerCase()) > -1 ){
                            $('#partitions .flex-item:last-child').find('.type select option:selected').attr('data-len', v.column.columnSize);
                        }
                    });
                    $('.global-ConfigCon .text-right .btn-item').addClass('next').html(common_js_lang['db.text.next']);
                }
                defer.resolve();
            }
        }).fail(function(){
            _this.container.find('#tableName').val('').select2({tags:true});
            _this.editor.doc.setValue('');
            _this.editor.doc.cm.setOption('readOnly', 'nocursor');
            _this.container.find('.CodeMirror').addClass('disabled');
            _this.container.find('.tableType').val(0).prop('disabled', true);

            defer.reject();
        });

        $.when( defer).always(function(){
            $("#globalLoadCon").hide();
        });
    },
    getPart: function(tblName, catalog, schema, partitions, param, defer){
        var _this = this;
        $.when( globalParam.promiseFunc.getPart({dbId:globalParam.targetId,tableName: tblName, catalog:catalog, schema:schema}) )
            .then(function(data){
                _this.partitionShow(data, partitions, param);
                defer && defer.resolve();
            }).fail(function(){
                defer && defer.reject();
            });
    },
    partitionShow: function(model, partitions, param){
        var _this = this;
        $('#partitions').empty();
        if( !model || model.length == 0) {
            $('.hive .infoline.last').css({display: 'none'});
            if ( globalParam.partTag ){
                $('.global-ConfigCon .text-right .btn-item').removeClass('next').html(common_js_lang['db.text.save']);
            }
        }
        else {
            $('.hive .infoline.last').css({display: 'block'});
            if ( globalParam.partTag ){
                $('.global-ConfigCon .text-right .btn-item').addClass('next').html(common_js_lang['db.text.next']);
            }
            var format = partFormat(globalParam.partTag ? 3: 4) ;
            var _html = format.head;
            $('#partitions').append(_html);
            model.map(function(v, i){
                _html = '';
                if ( !globalParam.partTag ) {
                    _html += '<div class="flex-item"><span class="type item">' + v.column.typeName + '</span><span class="key item">' + v.name + '</span>'
                    + '<span class="item val"><select class="select2 filedVal selVal" id="Part_level_' + i + '" data-key="' + v.name + '">';
                    v.parts.map(function (vv) {
                        _html += '<option value="' + vv.value + '" title="' + vv.name + '">' + vv.value + '</option>';
                    });
                    _html += globalParam.columnValOption+'</select></span></div>';
                }
                else {
                    _html += '<div class="flex-item"><span class="type item">' + v.column.typeName + '</span><span class="key item">' + v.name + '</span></div>';
                }
                $('#partitions').append(_html);
                $('#partitions #Part_level_'+i).select2({tags: true});
            });

            globalParam.partTag && param.partAll && partitions == '' ? partitions = true : '';
            globalParam.partTag && param.useSynchronized ? partitions = true : '';

            if(partitions) {
                if ( !globalParam.partTag ) {  //源表为非分区表，复现partition
                    var partObj = JSON.parse(partitions);
                    for (var k in partObj) {
                        if ($('#partitions').find('[data-key="' + k + '"]').find('[value="' + partObj[k] + '"]').length == 1) {
                            $('#partitions').find('[data-key="' + k + '"]').val(partObj[k]).trigger('change');
                        }
                        else {
                            $('#partitions').find('[data-key="' + k + '"]').prepend('<option value="' + partObj[k] + '">' + partObj[k] + '</option>').val(partObj[k]).change();
                        }
                    }
                }
                else {  //源表为分区表
                    var srcPart = JSON.parse($('.config.active').parent().attr('data-partition')),
                        tarColumn = [] ;

                    model.map(function(v, i){
                        tarColumn.push(v.name);
                    });

                    partitionReshow( partitions, param, srcPart, tarColumn );
                }
            }
        }
    }
};

var hiveModule = new hiveConfigModule({container: $('.global-ConfigCon')});

// partition展示格式
function partFormat(type){
    var head = '',
        item = '' ;
    type = type || globalParam.partTag ;
    if ( type == 1 ){
        head = '<span class="type item">'+common_js_lang['db.text.type']+'</span><span class="key item">'+common_js_lang['db.text.column']+'</span><span class="val item">'+common_js_lang['dbManage.title.val']+'</span><span class="act item">'+common_js_lang['clientList.option.oper']+'</span>' ;
        item = '<div class="flex-item new"><span class="type item"><select>'+globalParam.columnTypeOption+'</select></span><span class="key item"><input type="text" placeholder="'+common_js_lang['db.info.enterColumn']+'"></span><span class="val item"><select>'+globalParam.columnValOption+'</select></span><span class="act item"><a class="add"></a><a class="del"></a></span></div>';
    }
    else if ( type == 2 ){
        head = '<span class="type item">'+common_js_lang['db.text.type']+'</span><span class="key item">'+common_js_lang['db.text.column']+'</span><span class="act item">'+common_js_lang['clientList.option.oper']+'</span>' ;
        item = '<div class="flex-item new"><span class="type item"><select>'+globalParam.columnTypeOption+'</select></span><span class="key item"><input type="text" placeholder="'+common_js_lang['db.info.enterColumn']+'"></span><span class="act item"><a class="add"></a><a class="del"></a></span></div>';
    }
    else if ( type == 3 ){
        head = '<span class="type item">'+common_js_lang['db.text.type']+'</span><span class="key item">'+common_js_lang['db.text.column']+'</span>' ;
        item = '<div class="flex-item"><span class="type item"><select>'+globalParam.columnTypeOption+'</select></span><span class="key item"><input type="text" placeholder="'+common_js_lang['db.info.enterColumn']+'"></span></div>';
    }
    else if ( type == 4 ){
        head = '<span class="type item">'+common_js_lang['db.text.type']+'</span><span class="key item">'+common_js_lang['db.text.column']+'</span><span class="val item">'+common_js_lang['dbManage.title.val']+'</span>' ;
        item = '<div class="flex-item"><span class="type item"><select>'+globalParam.columnTypeOption+'</select></span><span class="key item"><input type="text" placeholder="'+common_js_lang['db.info.enterColumn']+'"></span><span class="val item"><select>'+globalParam.columnValOption+'</select></span></div>';
    }
    head = '<div class="flex-item head">' + head + '</div>' ;
    return {
        head: head,
        item: item
    }
}

$('.hive').on('click', '.newPart', function(){
    $(this).css({display:'none'});
    $('.infoline.last').css({display:'block'});
    var format = partFormat(globalParam.partTag? 2 : 1);
    var _html = format.head;
    $('#partitions').append(_html);
    _html = format.item;
    $('#partitions').append(_html).find('.flex-item.new:last-child .val select').select2({tags:true});
    globalParam.partTag ? $('.global-ConfigCon .btn-item').addClass('next').html(common_js_lang['db.text.next']) : '';
});

$('.hive').on('click', 'a.add', function() {
    var format = partFormat(globalParam.partTag? 2 : 1);
    var _html = format.item;
    $(_html).find('.val select').select2({tags:true});
    $('#partitions').append(_html).find('.flex-item.new:last-child .val select').select2({tags:true});
});

$('.hive').on('click', 'a.del', function() {
    $(this).parents('.flex-item').remove();
    if ( $('#partitions .flex-item:not(".head")').length == 0 ){
        $('.infoline.last').css({display:'none'});
        $('#partitions').empty();
        $('.hive .newPart').css({display:'block'});
        globalParam.partTag ? $('.global-ConfigCon .btn-item').removeClass('next').html(common_js_lang['db.text.save']) : '';
    }
    partDdl();
});
$('.hive').on('change', '.flex-item.new select', function(){
    partDdl();
});
$('.hive').on('blur', '.flex-item.new input', function() {
    partDdl();
});

function partDdl(){
    var curDdl = editor.doc.getValue().trim() ;
    var partArr = $('#partitions .flex-item.new'),
        ddlArr = [] ;
    for ( var i= 0,len=partArr.length; i<len; i++ ){
        var type = partArr.eq(i).find('.type select').val(),
            key = partArr.eq(i).find('.key input').val().trim() ;
        if ( key ){
            if ( ['varchar', 'char'].indexOf(type) > -1 ){
                var clen = partArr.eq(i).find('.type select option:selected').attr('data-len');
                !clen || clen <= 0 ? clen = 255 : '';
                var lenStr = '('+clen+')';
            }
            else {
                lenStr = '';
            }
            ddlArr.push( '`'+key+'` '+type + lenStr );
        }
    }
    var newPartDdl = ddlArr.length > 0 ? 'PARTITIONED BY (\n' + ddlArr.join(',\n') + '\n) \n' : '';

    var partIndex = curDdl.indexOf('PARTITIONED BY'),
        partEnd = curDdl.indexOf("ROW FORMAT"),
        storeAs = curDdl.indexOf('STORED AS');

    if ( partEnd == -1 && storeAs > -1 ){
        partEnd = storeAs;
    }
    partIndex == -1 ? partIndex = partEnd : '';

    if ( partEnd == -1 && storeAs == -1 ){
        partEnd = partIndex = 1;
    }

    var strLeft = curDdl.substring(0, partIndex),
        strRight = curDdl.substring(partEnd);

    editor.doc.setValue( strLeft+newPartDdl+strRight );
}

// hive 保存数据
function saveHiveParam() {
	var dbName = ($('#dbName').val() || '').trim(),
		tabData = {},
		selectOption = $('#dbName option:selected'),
		catalog = selectOption.attr('data-catalog') || '',
		schema = selectOption.attr('data-schema') || '',
		tblName = $('#tableName').val(),
        sql = editor.doc.getValue() || '' ;

	if( [dbName, tblName, sql].indexOf('') > -1 ) {
		MsgTip('', common_js_lang['local.info.tblErr']+'!', 'info');
		return false;
	}

	var partitionItems = {},  fromPart = [];

    if ( !globalParam.partTag ) {  // 源表为非分区表
        tabData['fromIsPart'] = false;
        var partitions = $('#partitions .flex-item:not(".head")');
        for (var i = 0, length = partitions.length; i < length; i++) {
            if ( partitions.eq(i).hasClass('new') ) {
                var key = partitions.eq(i).find('.key input').val().trim();
                if ( !key.match(/^(\w|_|-|\(|\))+$/g) ) {
                    partitions.eq(i).find('.key input').addClass('error');
                    return false;
                }
                partitions.eq(i).find('.key input').removeClass('error');
                partitionItems[key] = {value:partitions.eq(i).find('.val select').val().trim(), type:partitions.eq(i).find('.type select').val()};
            }
            else {
                partitionItems[partitions.eq(i).find('.key').text().trim()] = partitions.eq(i).find('.val select').val().trim();
            }
        }
        partitions.length > 0 ? tabData['toIsPart'] = true : tabData['toIsPart'] = false;
    }
    else {   // 源表为分区表
        tabData['fromIsPart'] = true;
        var partitions = $('#partitions .flex-item:not(".head")');
        if ( partitions.length <= 0 ){     //没分区的表
            tabData['noPart'] = true ;
            tabData['toIsPart'] = false;
        }
        else{
            tabData['toIsPart'] = true;
            if ( partitions.eq(0).hasClass('new') ){   //新表有分区
                var tarArr = {};
                partitions.map(function(i, v){
                   var key = $(v).find('.key input').val().trim(),
                       type = $(v).find('.type select').val() ;
                   tarArr[key] = {type:type} ;
                });
                tabData['newPart'] = JSON.stringify(tarArr) ;
            }
            else {      // 已存在表有分区
                var tarArr = [];
                partitions.map(function(i, v) {
                    tarArr.push($(v).find('.key').text());
                });
                tabData['part'] = JSON.stringify(tarArr);
            }
            if ( $('.partType .radio.cur').attr('data-val') == 2 ){  //启用字段同步
                tabData['useSynchronized'] = true;
                tabData['tarPartHandleType'] = $('.useSynch .radio.cur').parent().attr('data-val');

                var partitionExpDefault = [];
                var defaultSet =  $('.defaultPartVal .content .flex-item');
                for ( var i= 0,len=defaultSet.length; i<len; i++ ){
                    var items = defaultSet.eq(i).find('.item'),
                        name = items.eq(0).text(),
                        value = items.eq(1).find('select').val().trim() ;
                    if ( !value.match(/^(\w|_|-|\(|\))+$/g) ) {
                        MsgTip('', common_js_lang['db.info.partChars'], 'info');
                        return false;
                    }
                    partitionExpDefault.push({name: name, value: value});
                }
                if ( partitionExpDefault.length > 0 )
                    tabData['partitionExpDefault'] = JSON.stringify(partitionExpDefault);
            }
            else {   //自定义分区
                tabData['useSynchronized'] = false;
                tabData['tarPartHandleType'] = $('.useSynch .radio.cur').parent().attr('data-val');
                tabData['partAll'] = $('.setPart .partCon .item.head .check.cur').length == 1;

                // 取选中的分区配置
                var tarCharTag = true;
                var sourcePart = $('.setPart .partCon .item.check:not(".head") .check.cur');
                var fromPartitions = JSON.parse($('.rightSide .config.active').parent().attr('data-partition'));
                sourcePart.map(function (i, v) {
                    var tempArr = [],
                        fromKey = [];
                    $(v).parent().siblings().map(function (ii, vv) {
                        tempArr.push(fromPartitions[ii].name + '=' + $(vv).text());
                    });

                    fromKey = tempArr.join('/');
                    fromPart.push( fromKey );
                    partitionItems[fromKey] = [];
                    var items = $(v).parents('.flex-item').find('.row-flex.tar .item');
                    items.map(function (ii, vv) {
                        var vvVal = $(vv).find('select').val().trim();
                        if ( !vvVal.match(/^(\w|_|-|\(|\))+$/g) ){
                            tarCharTag = false;
                        }
                        partitionItems[fromKey].push( vvVal );
                    });
                });

                if ( sourcePart.length <= 0) {
                    MsgTip('', common_js_lang['db.info.alertPart'], 'info');
                    return false;
                }

                if ( !tarCharTag ){
                    MsgTip('', common_js_lang['db.info.partChars'], 'info');
                    return false;
                }
            }
        }
    }
	
	var createSql = '' , ddl = '' ;
	if ( !editor.doc.cm.isReadOnly() ){
		createSql = sql;
        sql = sql.substring(sql.indexOf("TABLE")+"TABLE".length, sql.indexOf("(")).trim();
        sql = sql.replace(/\"|\'|`|\[|\]/g, '');
        try {
            var sqlArr = sql.split('.');
            if ( !(sqlArr[0] == dbName && sqlArr[1] == tblName) ){
                MsgTip('', common_js_lang['db.info.sqlErr'], 'info');
                return false;
            }
        } catch (e){
            MsgTip('', common_js_lang['db.info.sqlErr'], 'info');
            return false;
        }
	}
	else {
		ddl = sql ;
        if ( ddl.indexOf( 'CLUSTERED BY' ) > -1 &&
            ddl.indexOf( 'org.apache.hadoop.hive.ql.io.orc.OrcSerde' ) > -1 &&
            ddl.indexOf( "'transactional'='true'" ) > -1 ){
            MsgTip('info', common_js_lang['db.tip.hivexspark']);
            return false;
        }
    }

    tabData['dbId'] = globalParam.targetId;
    tabData['tableType'] = $('.global-ConfigCon .hive .tableType').val();
	tabData['createSql'] = createSql;
	tabData['ddl'] = ddl;
    fromPart.length > 0 ? tabData['fromPart'] = JSON.stringify( fromPart ) : '' ;
	JSON.stringify(partitionItems) != '{}' && (tabData['partition'] = JSON.stringify(partitionItems));
	tabData['tableName'] = tblName;
	tabData['catalog'] = catalog;
	tabData['schema'] = schema;
	tabData['name'] = dbName;

    //验证分区ddl
    if ( createSql && !globalParam.partTag ){  //源表为非分区表
        if ( !checkPartDdl( createSql,  tabData['partition'] ) ){
            return false;
        }
    }
    else if ( createSql && globalParam.partTag ){   //源表为分区表
        if ( !checkPartDdl( createSql,  tabData['newPart'] ) ){
            return false;
        }
    }

	return tabData;
}

// 验证分区ddl匹配
function checkPartDdl(ddl, partition){
    var curDdl = ddl ;
    var partObj = partition ? JSON.parse(partition) : '',
        ddlArr = [] ;
    console.log(ddl, partition);
    var partIndex = curDdl.indexOf('PARTITIONED BY'),
        partEnd = curDdl.indexOf("ROW FORMAT"),
        storeAs = curDdl.indexOf('STORED AS');
    if ( partEnd == -1 && storeAs > -1 )
        partEnd = storeAs;

    if ( partIndex  > -1 && !partition || partIndex == -1 && partition ){
        MsgTip('', common_js_lang['db.info.alertDdl'], 'info');
        return false;
    }
    if ( partIndex == -1 && !partition ){
        return true;
    }
    try {
        var partitionDdl = curDdl.substring(partIndex + "PARTITIONED BY".length, partEnd).trim().replace(/^\(|\)$/g, '').trim();
        var partArr = partitionDdl.replace(/\s+/g, ' ').split(',');
        var columnArr = [];
        partArr.map(function(v, i){
            var arr = v.trim().split(' ');
            columnArr.push( arr[0].replace(/^`|`$/g, '') );
        });
        var len = columnArr.length ;
        for ( var k in partObj ){
            if ( columnArr.indexOf(k) == -1 ){
                MsgTip('', common_js_lang['db.info.alertDdl'], 'info');
                return false;
            }
            len -- ;
        }
        if ( len != 0 ){
            MsgTip('', common_js_lang['db.info.alertDdl'], 'info');
            return false;
        }
        return true;
    } catch(e){
        MsgTip('', common_js_lang['db.info.alertDdl'], 'info');
        return false;
    }
}

// hdfs 保存数据
function saveHdfsParam() {
	var hdfsPath = $('.global-ConfigCon .hdfsTab .selectedDir').val().trim(),
		hdfsFileName = $('.global-ConfigCon .hdfsTab .fileName').val().trim();
	if(!hdfsPath || !hdfsFileName) {
		MsgTip('', common_js_lang['local.info.fileDir'], 'info');
		return false;
	}
	if ( hdfsFileName.match(/\s+|\\+/g) ){ 
		MsgTip('', common_js_lang['local.info.fileName'], 'info');
		return false;
	}

	var isTag = !!hdfsFileName.match(/^\//);
    isTag && (hdfsFileName = '/'+hdfsFileName.replace(/^\/+/g, '')) ;

	return {
		fileName: hdfsPath + (isTag ? '' : '/') + hdfsFileName,
		tarDir: hdfsPath,
		tarName: hdfsFileName
	};
}

// 第二步 返回 第一步
$('.item2').on('click', '.act .btn-cancel', function() {
	$('.stepCon').animate({
		'margin-left': 0
	}, 250);
	$('.processCon .itemCon').removeClass('cur').eq(0).addClass('cur');
	$('html, body').animate({scrollTop:0},200);
});

// 第二步 到 第三步
$('.item2').on('click', '.act .btn-item', function() {
	var itemArr = $('.rightSide .target-item .target-name'),
		len = itemArr.length;
	if(len <= 0) {
		MsgTip('', common_js_lang['db.info.confTar'], 'info');
		return false;
	}
	var fromJson = [],
		toHdfsJson = [],
		toHiveJson = [],
		toDbJson = [];

	var deferArr = [],
		partArr = [],
		partDefer = $.Deferred() ;
	$('#globalLoadCon').css({display:'block'});
	for(var i = 0; i < len; i++) {
		var param = itemArr.eq(i).attr('data-param') ? JSON.parse(itemArr.eq(i).attr('data-param')) : {},
			filter = itemArr.eq(i).attr('data-filter') ? JSON.parse(itemArr.eq(i).attr('data-filter')) : {};

		var db = itemArr.eq(i).parent().data('name'),
			tbl = itemArr.eq(i).text(),
			catalog = itemArr.eq(i).parent().data('catalog'),
			schema = itemArr.eq(i).parent().data('schema');

        var ddl = param.ddl || '';
        if ( ddl && ddl.indexOf( 'CLUSTERED BY' ) > -1 &&
            ddl.indexOf( 'org.apache.hadoop.hive.ql.io.orc.OrcSerde' ) > -1 &&
            ddl.indexOf( "'transactional'='true'" ) > -1 ){
            MsgTip('info', common_js_lang['db.text.db']+'[' + db + '] '+common_js_lang['db.text.tbl']+'[' + tbl + '] '+common_js_lang['db.tip.hivexspark']);
            return false;
        }

        if ( param.ddl && !param.partition && !param.useSynchronized && !param.partAll ) {
            var partArrObj = globalParam.partitionsData['catalog' + param.catalog + '_schema' + param.schema + '_' + param.tableName];
            if ( partArrObj && partArrObj.length > 0 ) {  //已知存在分区但没配置
                MsgTip('', common_js_lang['db.text.tbl'] + '[' + param.tableName + '] ' + common_js_lang['local.info.hiveParam'] + '\n', 'info');
                return false;
            }

            if ( !partArrObj) {  // 没配置分区，不知是否有分区
                partArr.push(param);
            }
        }
		checkParam(param, filter, db, tbl, catalog, schema, i);
	}
	deferArr[len] = partDefer;	
	partArr.length > 0 ? batchPartCheck() : partDefer.resolve();
	//批量验证partitions
	function batchPartCheck(){
		$.ajax({
			url: 'db/table/partitions/batch',
			data: {dbId: globalParam.targetId, pid:$('#userApp').val(), tablesJsonStr: JSON.stringify(partArr)},
			type: 'post',
			success: function(data){
				var errMsg = '', errTitle = '', errDetail = '';
				if (data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
					partDefer.reject();
					return ;
				}
			
				data.model.map(function(v){
					if ( v.code != 200 ){
                        errTitle ? '' : errTitle = v.i18nMsg.title ;
                        errDetail ? '' : errDetail = v.i18nMsg.detail ;
						errMsg += v.msg+'.\n';
						return ;
					}
					if ( v.model && v.model.partitions.length > 0 ){
						errMsg += common_js_lang['db.text.tbl']+'[' + v.model.name + '] '+ common_js_lang['local.info.hiveParam']+'\n';
					}
				});
				if ( errMsg ){
					ErrTip(errTitle, errDetail, errMsg, 'info');
					partDefer.reject();
					return ;
				}
				partDefer.resolve();
			},
			error: function(){
				partDefer.reject();
			}
		})
	}
	// 验证参数
	function checkParam(param, filter, db, tbl, catalog, schema, index){
		deferArr[index] = $.Deferred();
		if ( globalParam.jobId > 0 ){
			$.ajax({
				url: 'db/table/exist2',
				data: {dbId:globalParam.sourceId, catalog:catalog, schema:schema, tableName:tbl},
				success: function(data) {
					if ( data.code != 200 ){
						deferArr[index].reject();
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
						return false;
					}
					if( !data.model ) {
						deferArr[index].reject();
						MsgTip('', common_js_lang['db.text.db']+'['+db+'] '+common_js_lang['db.text.tbl']+'['+tbl+'] '+common_js_lang['db.text.notInSrc'], 'info');
						return false;
					}
					else {
						paramHandle();
					}
				},
				error: function(){
					deferArr[index].reject();
				}
			});
		}
		else {
			paramHandle() ;
		}

		function paramHandle(){
		if(globalParam.targetType == 2) { // hdfs
			if(!checkHdfs(param)) {
				deferArr[index].reject();
				MsgTip('', common_js_lang['db.text.db']+'[' + db + '] '+common_js_lang['db.text.tbl']+'[' + tbl + '] '+common_js_lang['dbManage.info.hdfsParamErr'], 'info');
				return false;
			}

			fromJson[index] = {
				id: globalParam.sourceId,
				name: db,
				catalog: catalog,
				schema: schema,
				tableName: tbl,
				whereSql: filter.whereSql || ''
			};
			toHdfsJson[index] = param;
			deferArr[index].resolve();
		}
        else { //hive
			if( (!param.name || !param.tableName) || (!param.createSql && (!param.catalog && !param.schema)) ) {
				deferArr[index].reject();
				MsgTip('', common_js_lang['db.text.db']+'[' + db + '] '+common_js_lang['db.text.tbl']+'[' + tbl + '] '+ common_js_lang['local.info.hiveParam'], 'info');
				return false;
			}

			fromJson[index] = {
				id: globalParam.sourceId,
				name: db,
				catalog: catalog,
				schema: schema,
				tableName: tbl,
                partition: param.fromPart || '',
                partitionTable: param.fromIsPart,
                useSynchronized: param.useSynchronized || false,
                tarPartHandleType: param.tarPartHandleType
			};
			toHiveJson[index] = param;
            toHiveJson[index].partitionTable = param.toIsPart;
            if ( param.fromPart ){   //源表为分区表
                if ( param.newPart ){  //新建表
                    var newpart = JSON.parse( param.newPart),
                        newpartColumn = [];
                    for (var k in newpart ){
                        newpartColumn.push( k ) ;
                    }
                    var tarPart = JSON.parse( param.partition),
                        tarPartArr = [] ;
                    for (var k in tarPart ){
                        var arr = tarPart[k],
                            tmpArr = [] ;
                        arr.map(function(v, i){
                            tmpArr.push( newpartColumn[i]+'='+v );
                        });
                        tarPartArr.push( tmpArr.join('/') );
                    }
                }
                else if ( param.part ) {  //已存在表
                    var tarPartColumn = JSON.parse( param.part );
                    var tarPart = JSON.parse( param.partition),
                        tarPartArr = [] ;
                    for (var k in tarPart ) {
                        var tmpArr = [];
                        tarPart[k].map(function(v,i){
                            tmpArr.push( tarPartColumn[i]+'='+v );
                        });
                        tarPartArr.push( tmpArr.join('/') );
                    }
                }
                toHiveJson[index]['partition'] = JSON.stringify( tarPartArr );
            }
            else if ( param.partition ) {  //源表为非分区表
                var partObj = JSON.parse( param.partition );
                var tarPart = [];
                for (var k in partObj ){
                    var tmpVal = partObj[k];
                    if ( tmpVal.value )   //新建分区
                        tmpVal = tmpVal.value ;
                    tarPart.push( k+'='+tmpVal);
                }
                toHiveJson[index]['partition'] = JSON.stringify( [tarPart.join('/')] );
            }
			deferArr[index].resolve();
		}
		}
	}
	$.when.apply($, deferArr).done(function(){
		var paramLengthCheck = [];
		Array.prototype.push.call(paramLengthCheck, fromJson, toHdfsJson, toHiveJson, toDbJson);
		globalParam.fromJson = fromJson;
		globalParam.toHdfsJson = toHdfsJson;
		globalParam.toHiveJson = toHiveJson;
		globalParam.toDbJson = toDbJson;

		$('.stepCon').animate({'margin-left': '-200%'}, 250);
		$('.processCon .itemCon').removeClass('cur').eq(2).addClass('cur');
		$('html, body').animate({scrollTop:0},200);
	}).always(function(){
		$('#globalLoadCon').css({display:'none'});
	}) ;
});

function checkHdfs(param) {
	var fileName = param.fileName || '';
	if(!fileName || fileName.split('/').length <= 1) {
		return false;
	}
	return true;
}

/////////
$('.item3').on('click', '.act .btn-cancel', function() {
	$('.processCon .itemCon').removeClass('cur').eq(1).addClass('cur');
	$('.stepCon').animate({'margin-left': '-100%'}, 250);
	$('html, body').animate({scrollTop:0},200)

});

$('.item3').on('click', '.act .btn-item', function() {
	$(this).prop('disabled', true);
	var jobName = ($('.item1 .taskName').val() || '').trim(),
		note = ($('.item1 .taskDes').val() || '').trim();
	if(!jobName) {
		$(this).prop('disabled', false);
		MsgTip('', common_js_lang['client.info.taskNameErr'], 'info');
		return;
	}
	var pid = $('#userApp').val() || 0 ;
	if ( !pid ){
		$(this).prop('disabled', false);		
		MsgTip('', common_js_lang['dbManage.title.setApp'], 'info');
		return ;
	}

    var cronGlobalParam = cronExport.cronExec($('.group-type .cur').index(), true);
    if ( !cronGlobalParam.cronParam || [0, 1, 2].indexOf(+cronGlobalParam.periodType) == -1 ){
		$(this).prop('disabled', false);
		$('#globalLoadCon').css({display: 'none'});
		return false;
	}

	var btnSelf = $(this);
	var cronParam = cronGlobalParam;
	var uploadParam = {
		pid: pid,
		jobName: jobName,
		note: note,
        mtype: $('.mtype .radio.cur').attr('data-val'),
		fromJson: JSON.stringify(globalParam.fromJson),
		periodType: cronParam.periodType,
		fromId: globalParam.sourceId,
		toId: globalParam.targetId,
		cronExpression: cronParam.cronParam,
		startTimeStr: cronParam.startTimeStr || '',
		endTimeStr: cronParam.endTimeStr || '',
		groupNo: globalParam.groupNo,
		toType: globalParam.targetType == 2 ? 8 : 9
	};
	globalParam.linkSource2type['1'].indexOf(+globalParam.targetType) > -1 && (uploadParam.toType = 2);
	globalParam.linkSource2type['2'].indexOf(+globalParam.targetType) > -1 && (uploadParam.toType = 6);
	globalParam.linkSource2type['3'].indexOf(+globalParam.targetType) > -1 && (uploadParam.toType = 7);

	if (globalParam.jobId > 0 && !globalParam.urlObj.copy)
		uploadParam.id = globalParam.jobId;

	if (globalParam.targetType == 2) {
		uploadParam['toHdfsJson'] = JSON.stringify(globalParam.toHdfsJson);
	}
    else if(globalParam.targetType == 1) {
		var batchDefer = $.Deferred();
		var tablesJson = [];
		for(var i = 0, len = globalParam.toHiveJson.length; i < len; i++) {
			if(globalParam.toHiveJson[i].createSql) {
				globalParam.toHiveJson[i].ddl = globalParam.toHiveJson[i].createSql;
				globalParam.toHiveJson[i].index = i;
				tablesJson.push(globalParam.toHiveJson[i]);
			}
		}
		if ( tablesJson.length >= 1 ){
            var errMsg = '',
                errTitle = '',
                errDetail ='',
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
                $('#waitLoading').css({display:'none'});
                if (errMsg) {
                    batchDefer.reject();
                    ErrTip(errTitle, errDetail, common_js_lang['loading.info.newInfo'].replace(/\[x\]/, succCount).replace(/\[y\]/, failCount)+'\n'+errMsg, 'info');
                    return;
                }
                MsgTip({type:'success', text:common_js_lang['loading.info.allNew']});
                batchDefer.resolve();
                return;
            }
            var spliceJson = tablesJson.slice(init, init+100),
                amount = init + 100 <= len ? 100 : len-init ;
            $.ajax({
                url: 'db/table/create/batch',
                type: 'post',
                data: {dbId: globalParam.targetId, pid:pid, tablesJsonStr: JSON.stringify(spliceJson)},
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
                                errMsg += '[' + globalParam.toHiveJson[index].tableName + ']:' + v.msg + '.\n';
                                return;
                            }
                            succCount ++ ;
                            globalParam.toHiveJson[index].ddl = '';
                            globalParam.toHiveJson[index].createSql = '';
                            globalParam.toHiveJson[index].tableName = v.model.tableName;
                            globalParam.toHiveJson[index].catalog = v.model.catalog;
                            globalParam.toHiveJson[index].schema = v.model.schema;
                        });
                    }
                    init += 100 ;
                    $('#waitLoading').find('article .detail').html(common_js_lang['loading.info.newInfo'].replace(/\[x\]/, succCount).replace(/\[y\]/, failCount)) ;
                    createTblBatch();
                }
            })
        }
	}

	globalParam.targetType == 1 ?
	$.when( batchDefer ).then(function(){
		uploadParam['toHiveJson'] = JSON.stringify(globalParam.toHiveJson);	
		upload();
	}, function(){
		btnSelf.prop('disabled', false);
	}) : upload() ;

	function upload(){
		$.fn.ajaxAPI({
			url: 'job/hive/save',
			type: 'post',
			data: uploadParam,
			contentType: 'application/x-www-form-urlencoded',
			callback: function(data) {
                window.onbeforeunload = function(){return} ;
                location.href = "./success";
			},
			complete: function() {
				$('.item3 .act .btn-item').prop('disabled', false);
			}
		});
	}
});


function checkTableExist(param) {
	var existDefer = $.Deferred();
	$.ajax({
		url: 'db/table/exist2',
		data: param,
		success: function(data) {
			if ( data.code != 200 ){
				existDefer.reject();
				return ;
			}
			if(data.model) {
				existDefer.resolve(data.model);
			}
		},
		error: function(){
			existDefer.reject();
		}
	});
	return existDefer.promise();
}
/////////

/// 编辑
;(function() {
	if(globalParam.jobId <= 0) return;
	var iframeParam = {
		cronParam: globalParam.editJobModel.cronExpression,
		startTime: globalParam.editJobModel.startTime,
		endTime: globalParam.editJobModel.endTime
	};
    cronExport.resetCron(iframeParam);
}());

window.onbeforeunload = function(){
    if ( $('.taskName').val().trim() || $('.taskDes').val().trim() )
        return common_js_lang['common.info.leavePage'];
    return ;
};