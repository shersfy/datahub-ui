// CodeMirror 设置
var editor = CodeMirror.fromTextArea($('.new-sql textarea')[0], {
    lineNumbers: true
});

var tmpParam = {
    fileIndex: 0,
    curTableList: [],
    targetType: 0,
    fileTable: [],
    fileTableChange: false,
    fileCurLength: 0,
    columnSep: '',
    tmpAppId: 0,
    connId: 0,
    hiveParam: [],
    formDataAjax: {}
};
$.extend(globalParam, tmpParam);

$('body').on('click', 'button.index', function(){
    window.location.href = './';
});

// 改变目标位置
$('.configTask').on('change', '#targetType', function(e, appChange){
    getConnect();
});

$('#userApp').change(function(){
    getConnect();
});

getConnect();
function getConnect(){
    var pid = $('#userApp').val(),
        targetType = $('#targetType').val(),
        url = 'db/list',
        dbType = 31,
        groups = '';
    targetType == globalParam.commonLinkType.hdfs ? (url = 'hdfs/list') : (groups = 4) ;
    targetType == globalParam.commonLinkType.spark ? dbType = 62 : '';
    if ( !pid )
        return ;
    $.fn.ajaxAPI({
        url: url+'?pid='+pid+'&groups='+groups+'&dbType='+dbType,
        callback: function(data){
            var connHtml = '<option value="" disabled>'+common_js_lang['db.info.selectLink']+'</option>' ;
            targetType == globalParam.commonLinkType.hdfs ? adminConfigData.hdfs.id && (connHtml += '<option value="'+adminConfigData.hdfs.id+'">'+adminConfigData.hdfs.connName+'</option>') : '';
            targetType == globalParam.commonLinkType.hive ? adminConfigData.hive.id && (connHtml += '<option value="'+adminConfigData.hive.id+'">'+adminConfigData.hive.connName+'</option>') : '';
            data.model.data.map(function(v){
                connHtml += '<option value="'+v.id+'">'+v.connName+'</option>' ;
            });
            $('.configTask .connId').html(connHtml).val('').select2();
        }
    })
}


window.onbeforeunload = function(){
    if ( $('.taskName').val().trim() || $('.taskDes').val().trim() || $('.file-list  tr .progress').length > 0 )
        return common_js_lang['common.info.leavePage'];
    return ;
};

///////////////////////////////////   to HDFS
// hdfs 配置 确认 取消按钮
$('.global-hdfsCon').on('click', '.btn-cancel, h4 .cancel', function(){
    $('.global-mask, .global-hdfsCon').fadeOut();
});

$('.global-hdfsCon').on('click', '.btn-item', function(){
    var param = hdfsModule.saveHdfs();
    if ( !param ){
        return ;
    }

    $.fn.ajaxAPI({
        url: 'hdfs/dir/access',
        data:{hdfsId:globalParam.connId, dir:param.curPath, pid:$('#userApp').val()},
        callback: function(data){
            $('.hdfsCon .path').val(param.curPath).attr('title', param.curPath);
            $('.hdfsCon .filename').val(param.name);
            $('.global-mask, .global-hdfsCon').fadeOut();
        }
    });
});

// 进入hdfs配置层
$('.hdfsCon').on('click', '.hdfs', function(){
    var path = $('.hdfsCon .path').val() || '',
        name = ($('.hdfsCon .filename') || '').val().trim() ;

    hdfsModule.reset({curPath: path, name: name});
    $('.global-mask, .global-hdfsCon').fadeIn();
});

function hdfsConfigModule(param){
    var defaults = { container: $('.global-hdfsCon') } ;
    param = param || {};
    defaults.container = param.container ? param.container : defaults.container;
    defaults.hdfsList = defaults.container.find('.dirDos');
    defaults.path= defaults.container.find('.selectedDir');
    defaults.name= defaults.container.find('.fileName');

    $.extend(this, defaults, param);
    this.event();
}

hdfsConfigModule.prototype = {
    event: function(){
        var _this = this;

        _this.hdfsList.on('click', 'li i.show', function(){
            if ( $(this).parent().siblings('ul').find('li').length == 0 ){
                if ( $(this).hasClass('got') )
                    return false;
                $(this).addClass('got');
                _this.getDir( $(this).parents('li').data('base') );
            }
            else{
                $(this).toggleClass('in');
                $(this).parent().siblings('ul').toggle();
            }
        });

        _this.hdfsList.on('click', 'li i.check', function(){
            if ( $(this).hasClass('cur') )
                return ;
            _this.hdfsList.find('.check.cur').removeClass('cur');
            $(this).addClass('cur');
            var base = $(this).parents('li').attr('data-base') || '';
            _this.path.val(base).attr('title', base);
        });
    },
    getDir: function(base){
        var _this = this;
        var param = { base: base, hid: this.getHid(), pid: $('#userApp').val()},
            isHome = base == '' ? true : false ;
        var timer = setTimeout(function(){
            $('#globalLoadCon').show();
        }, isHome? 0 : 2000);

        var parentDom = !isHome ? _this.hdfsList.find('[data-base="'+base+'"] > .ul') : _this.hdfsList.find('> .ul');
        $.when( globalParam.promiseFunc.getDir(param) ).then(function(data){
            parentDom.parent().find('.show').addClass('in');
            parentDom.fadeIn();

            if ( !isHome && data.length == 0 ){
                parentDom.siblings('p').find('.show').addClass('out');
                return false;
            }
            isHome && (data = [data]);
            var dirHtml = template('template/hdfsDir', {dir:data, len:base.length});
            parentDom.html(dirHtml);
            isHome && getDataHandle();
        }).always(function(){
            parentDom.parent().find('.show').removeClass('got');
            clearTimeout(timer);
            $('#globalLoadCon').hide();
        });
    },
    getHid: function(){
        return $('.connId').val() ;
    },
    saveHdfs: function(){
        var _this = this;
        var dir = _this.path.val().trim(),
            fileName = _this.name.val().trim() ;

        if ( !dir || !fileName ){
            MsgTip('', common_js_lang['local.info.fileDir'], 'info');
            return false;
        }

        if ( fileName.match(/\s+|\\+/g) ){
            MsgTip('', common_js_lang['local.info.fileName'], 'info');
            return false;
        }

        return {
            curPath: dir,
            name : fileName
        }
    },
    reset: function(param){
        var curPath = param.curPath,
            name = param.name ;

        this.hdfsList.find('i.check').removeClass('cur');
        this.hdfsList.find('i.show').removeClass('in');
        this.hdfsList.find('> .ul .ul').hide();
        this.path.val(curPath).attr('title', curPath);
        this.name.val(name);

        if ( curPath ){
            var target = this.hdfsList.find('[data-base="'+curPath+'"]');
            if ( target.length == 1 ){
                target.find('> p .check').addClass('cur');
                target.parents('.ul').fadeIn().siblings('p').find('.show').addClass('in');
            }
        }
    }
};

var hdfsModule = new hdfsConfigModule();
////////////////////////////////////////////////

////////////////////////////////////////////to Hive

function hiveConfigModule(param){
    this.container = param.container ;
    this.newType = param.newType || 1;
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
            _this.getDdlAct(param, _this.newType);
        });

        _this.container.on('blur', '.lineNum', function(){
            var lineNo = parseInt($(this).val()) || 1,
                oldVal = $(this).attr('data-val') ;
            lineNo < 1 && (lineNo = 1);
            $(this).val(lineNo).attr('data-val', lineNo);
            if ( editor.doc.cm.isReadOnly() )
                return ;
            if ( oldVal == lineNo )
                return ;

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
    },
    getParam: function(){
        var _this = this;
        var dbDom = _this.container.find("#dbName option:selected");
        return {
            dbId: globalParam.connId,
            name: dbDom.val(),
            pid: $('#userApp').val(),
            catalog: dbDom.attr('data-catalog') || '',
            schema: dbDom.attr('data-schema') || '',
            tableName: _this.container.find('#tableName').val(),
            sourceparam: JSON.parse($('.sourceCon li.cur').attr('data-sourceparam')),
            tableType: _this.container.find('.tableType').val(),
            format: _this.container.find('.tableType option:selected').text(),
            lineNum: _this.container.find('.lineNum').val(),
            columnSep:globalParam.columnSep,
            fieldEnClosed: globalParam.fieldEnClosed
        }
    },
    getTables: function(param) {
        var _this = this;
        $("#globalLoadCon").show();
        $.when( globalParam.promiseFunc.getTables(param) ).then(function(){
            $('.infoline.last').hide();
            $('#partitions').empty();

            var tbls = globalParam.tblModel['tbl_'+param.dbId+'_'+param.catalog+'_'+param.schema];
            var tableList = '<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option>';
            tbls.map(function(v) {
                tableList += '<option data-name="' + v.name + '">' + v.name + '</option>';
            });
            $("#tableName").html(tableList);

            if ( !param.tableName || !param.tableName.match(/^[0-9A-Za-z]\w*$/g) ){
                $('#tableName').val('').select2({tags:true});
                MsgTip('', common_js_lang['db.info.tableName'], 'info');
                $("#globalLoadCon").hide();
                return false;
            }

            $('#tableName').val(param.tableName).select2({tags:true});
            if ( $('#tableName').val() != param.tableName ){
                $('#tableName').append('<option>'+param.tableName+'</option>').val(param.tableName).select2({tags:true});
            }

            if( param.tableName ) {
                if ( !param.ddl && !param.createSql )
                    _this.getDdlAct(param, _this.newType);
                else
                    $("#globalLoadCon").hide();
            }
            else {
                editor.doc.cm.setOption('readOnly', 'nocursor'); // 不显示光标
                editor.doc.setValue('');
                $('.new-sql .CodeMirror').addClass('disabled');
                $('#tableName').val('').select2({tags: true});
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
            if ( data.mppTable && globalParam.targetType == globalParam.commonLinkType.hive ){
                _this.editor.doc.setValue('');
                defer.reject();
                MsgTip('info', common_js_lang['db.tip.hivexspark']);
                return ;
            }
            if ( !data.mppTable && globalParam.targetType == globalParam.commonLinkType.spark ){
                _this.editor.doc.setValue('');
                defer.reject();
                MsgTip('info', common_js_lang['db.tip.sparkxhive']);
                return ;
            }

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
                _this.getPart(param.tableName, param.catalog, param.schema, param.partition || '', defer);
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
                _this.container.find('.tableType').val(formatVal[data.format] || (globalParam.targetType == globalParam.commonLinkType.hive ? 0 : 1)).prop('disabled', globalParam.targetType == globalParam.commonLinkType.spark || false);
                _this.container.find('#partitions').empty();
                _this.container.find('.hive .infoline.last').hide();
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
    getPart: function(tblName, catalog, schema, partitions, defer){
        var _this = this;
        $.when( globalParam.promiseFunc.getPart({dbId:globalParam.connId,tableName: tblName, catalog:catalog, schema:schema}) )
            .then(function(data){
                _this.partitionShow(data, partitions);
                defer && defer.resolve();
            }).fail(function(){
                defer && defer.reject();
            });
    },
    partitionShow: function(model, partitions){
        $('#partitions').empty();
        if( !model || model.length == 0) {
            $('.hive .infoline.last').css({display: 'none'});
        }
        else {
            $('.hive .infoline.last').css({display: 'block'});

            model.map(function(v, i){
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
                for(k in partObj) {
                    if ( $('#partitions').find('[data-type="' + k + '"]').find('[value="'+partObj[k]+'"]').length == 1 ){
                        $('#partitions').find('[data-type="' + k + '"]').val(partObj[k]).trigger('change');
                    }
                    else {
                        $('#partitions').find('[data-type="' + k + '"]').prepend('<option value="'+partObj[k]+'">'+partObj[k]+'</option>').val(partObj[k]).change();
                    }
                }
            }
        }
    }
};

var hiveModule = new hiveConfigModule({container: $('.hiveCon')});

function getDB(){
    $('#globalLoadCon').show();
    $.when( globalParam.promiseFunc.getDb( {id: $('.connId').val(), pid:$('#userApp').val()}) ).then(function(data){
        var dbList = '<option value="" disabled="disabled">'+common_js_lang['local.option.getDb']+'</option>';
        data.databases.map(function(v){
            dbList += '<option data-catalog="'+v.catalog+'" data-schema="'+v.schema+'" data-name="'+v.name+'">'+v.name+'</option>';
        });
        $("#dbName").html(dbList).val('').select2();
        if ( data.databases && data.databases.length <= 0 ){
            MsgTip('info', common_js_lang['dump.info.dbNone']);
        }
        getDataHandle();
    }).always(function(){
        $('#globalLoadCon').hide();
    });
}

////////////////////////////////////////////

// formData 上传
$('.file-btn').on('change', '#fileupload', function(e){
    var file = $(this)[0].files ? $(this)[0].files : {name:$(this).val().split('\\').slice(-1)[0]};
    var alertTag = true;
    for ( var i=0,len=file.length; i<len; i++ ){
        if ( $('.file-list tbody tr').length >= 5 ){
            MsgTip('', common_js_lang['dump.info.limit5'], 'info');
            break ;
        }
        if ( ['.csv', '.txt'].indexOf(file[i].name.slice(-4).toLowerCase()) == -1 ){
            alertTag && MsgTip({title:'', text: common_js_lang['local.info.csvType'], type:'info', timer:2000});
            alertTag = false;
            continue ;
        }

        if ( file[i].size > 800*1024*1024 ){
            MsgTip('', common_js_lang['local.info.csvSize'], 'info');
            continue ;
        }
        if ( file[i].name && file[i].name.length > 60 ){
            MsgTip('', common_js_lang['s3.info.fileName100']);
            continue ;
        }

        var formData = new FormData();
        var indexTag = listFile(file[i]);
        formData.append('file', file[i]);
        globalParam.formDataAjax[indexTag] =  $.ajax({
            url: 'job/csv/file/upload',
            type:'post',
            data: formData,
            class: indexTag,
            fileTitle: file[i].name,
            contentType: false,
            processData: false,
            xhr: function()
            {
                var indexTag = this.class ;
                var xhr = new XMLHttpRequest();
                xhr.upload.addEventListener("progress", function(evt){
                    if (evt.lengthComputable) {
                        var percentComplete = parseInt(evt.loaded * 100 / evt.total);
                        $('.file-list .'+indexTag+' .process-slider').css({width:percentComplete+'%'});
                        $('.file-list .'+indexTag+' .process-res').html(percentComplete+'%');
                        if ( percentComplete == 100 ){
                            $('.file-list .'+indexTag+' .res').html('<div>'+common_js_lang['local.info.pausing']+'</div>');
                        }
                    }
                }, false);
                return xhr ;
            },
            success: function(data){
                if ( data.code != 200 ){
                    $('.file-list .'+this.class+' .res').html('<div style="color:red" title="'+data.msg+'">'+common_js_lang['local.info.upFail']+'</div>');
                    return ;
                }
                var tag = this.class,
                    fileTitle = this.fileTitle ;
                data.model = data.model.map(function(v, i){
                    i == 0 && (v.firstTitle = fileTitle);
                    v.indexTag = tag ;
                    v.fileType = fileTitle.slice(-4);
                    return v;
                });
                Array.prototype.push.apply(globalParam.fileTable, data.model);
                globalParam.fileTableChange = true;
                // 解析完成
                $('.file-list .'+this.class).addClass('uploaded');
                $('.file-list .'+this.class+' .res').addClass('ok').html(common_js_lang['local.info.upOver']);
            },
            error: function(){
                $('.file-list .'+this.class+' .process-slider').animate({width:'100%'}, 5);
                $('.file-list .'+this.class+' .process-res').html('100%');
                $('.file-list .'+this.class+' .res').addClass('error').html(common_js_lang['local.info.upErr']);
            }
        });
    }

    var newDom = $(this).clone().val('');
    $(this).remove();
    $('.file-btn').append(newDom);
});

// 列表信息
function listFile(file){
    var size = '<td> -- </td>',
        path = '<td class="progress"><span class="process-sliderCon"><div class="process-slider" style="width:0"></div></span><span class="process-res"></span></td>',
        res = '<td class="res">'+common_js_lang['local.info.uping']+'</td>' ;

    if ( file.size >= 0 ){
        size = '<td>'+convertFileSize(file.size)+'</td>';
    }
    globalParam.fileIndex ++ ;
    $('.configFilePath .file-list .tableNoData').parent().remove();
    $('.configFilePath .file-list tbody').append('<tr class="f'+globalParam.fileIndex+'"><td title="'+file.name+'">'+file.name+'</td>'+size+path+res+'<td><a class="del" title="'+common_js_lang['clientList.option.del']+'"><i></i></a></td></tr>');
    return 'f'+globalParam.fileIndex ;
}

function convertFileSize(byte){
    if ( byte < 1024 )
        return (byte || 0)+' bytes';
    else if ( byte / 1024 < 1024 )
        return (byte/1024).toFixed(2)+' KB';
    else
        return (byte/1024/1024).toFixed(2)+' MB';
}

/// 删除操作
$('.configFilePath').on('click', '.del', function(){
    var self = $(this);
    swal({
        title: '',
        text: common_js_lang['local.info.delFile'],
        type: 'info',
        showCancelButton: true
    }, function() {
        globalParam.fileTableChange = true;
        var tag = self.parents('tr').attr('class');
        self.parents('tr').remove();
        if ( $('.configFilePath tbody tr').length <= 0 ){
            $('.configFilePath tbody').append('<tr><td colspan="5" class="tableNoData"><img src="resources/dist/images/noData.png">'+common_js_lang['manage.title.noData']+'</td></tr>');
        }
        if ( tag.indexOf('uploaded') > -1 ) {  //上传完毕的文件，删除表信息
            globalParam.fileTable = globalParam.fileTable.filter(function (v) {
                return tag.indexOf(v.indexTag) == -1
            });
        }
        else {  //正在上传的文件， ajax abort
            swal.close();
            globalParam.formDataAjax[tag].abort();
        }
    });
});

// 下一步
$('.item1').on('click', '.nextStep', function(){
    var taskName = $('.configTask .taskName').val().trim(),
        taskDes =  $('.configTask .taskDes').val().trim();

    if ( !taskName ){
        MsgTip('', common_js_lang['local.info.taskNameNone'], 'info');
        return false;
    }

    var pid = $('#userApp').val() || 0 ;
    if ( !pid ){
        MsgTip('', common_js_lang['db.info.selectApp'], 'info');
        return ;
    }

    var connId = $('.connId').val() || '';
    if ( !connId ){
        MsgTip('', common_js_lang['db.info.selectLink'], 'info');
        return ;
    }

    if ( globalParam.fileTable.length <= 0 ){
        MsgTip('', common_js_lang['local.info.tblNone'], 'info');
        return false;
    }
    var fileInfo = $('.file-list tbody tr');
    for ( var i=0,len=fileInfo.length; i<len; i++ ){
        if ( !fileInfo.eq(i).hasClass('uploaded') ){
            MsgTip('', common_js_lang['local.info.upUncomplete'].replace(/\[x\]/g, '['+(i+1)+']'), 'info');
            return false;
        }
    }

    if ( +$('.configTask #targetType').val() != globalParam.commonLinkType.hdfs ){
        $('.global-mask, .global-columnSep').fadeIn();
    }
    else {
        configList();
    }
});

function configList(){
    var change = false;
    var typeChange = +$('.configTask #targetType').val() != globalParam.targetType ;
    var connChange = globalParam.connId != +$('.configTask .connId').val() ;
    var appIdChange = globalParam.tmpAppId != $('#userApp').val() ;
    if ( typeChange || connChange || appIdChange ){
        change = true;
        $('.item.item2 h3 i').html([common_js_lang['csv.text.hdfsNote'], common_js_lang['csv.text.hiveNote'], common_js_lang['csv.text.hiveNote']][+$('.configTask #targetType').val()-1]);
        +$('.configTask #targetType').val() == globalParam.commonLinkType.hdfs ? hdfsModule.getDir('') : getDB();
    }
    else {
        dataHandle(change);
    }
}

function dataHandle(change){
    if ( change || globalParam.fileTableChange ){
        globalParam.fileTable = globalParam.fileTable.map(function(v){
            if ( globalParam.targetType == globalParam.commonLinkType.hdfs ){
                v.param = JSON.stringify({fileName: v.tableName+ v.fileType, tarName:v.tableName+v.fileType});
            } else {
                v.param = JSON.stringify({tableName: v.tableName});
            }
            v.sourceParam = JSON.stringify({filePath:v.filePath, srcPath:v.srcPath, tableName: v.tableName});
            return v;
        });
        globalParam.fileTableChange = false;
        editor.doc.cm.setOption('readOnly', true);
        editor.doc.setValue('');

        $('.sourceCon').html(template('template/source', {data: globalParam.fileTable, type:globalParam.targetType}));
        $('.sourceCon li:not(.fileTitle)').eq(0).click();
    }

    $('.targetCon .targetType').css({display: 'none'});
    $('.targetCon .'+['hdfsCon', 'hiveCon', 'hiveCon'][globalParam.targetType-1]).fadeIn();
    $('.stepCon').animate({'margin-left': '-100%'}, 250, function(){
        $('.stepCon .item2').show();
        if ( globalParam.targetType != 1 ) {
            editor.refresh();
            $('.hiveCon .tableType').val(globalParam.targetType == globalParam.commonLinkType.hive ? 0 : 1);
        }
    });
    $('.processCon .itemCon').removeClass('cur').eq(1).addClass('cur');
}

function getDataHandle(){
    globalParam.targetType = +$('.configTask #targetType').val();
    globalParam.connId = +$('.configTask .connId').val();
    globalParam.tmpAppId = $('#userApp').val() ;
    dataHandle(true);
}

// 必读说明 hover
var hoverInterval = 0;
$('.hiveCon strong').hover(function(){
    var self = $(this);
    hoverInterval = setTimeout(function(){
            self.find('.tip').css({display:'block'});},
        300);
}, function(){
    clearInterval(hoverInterval);
    $(this).find('.tip').css({display:'none'});
});


//////////////////  分隔符

$.fn.replaceComponent = function(){
    var self = $(this);
    $('body').on('click', '.replacementCon .val',function(){
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
    $('body').on('click', '.replacementCon .item', function(){
        var text = $(this).text(),
            val = $(this).attr('data-val') || '' ;
        replacementUpdateVal(val, $(this).parents('.replacementCon'));
        return false;
    });
    $('body').on('click', '.replacementCon button', function(){
        var input = $(this).siblings('.inputReplacement').val(),
            text = input ;
        if ( $(this).parents('.replacementCon.fieldEnClosed').length == 1 && input.length != 1 ){ //限定符
            MsgTip('', common_js_lang['csv.text.fieldEnClosed']);
            return false;
        }
        if ( $(this).parents('.replacementCon.columnSep').length == 1 && input.length <= 0 ) {    //列分隔符
            MsgTip('', common_js_lang['csv.text.columnSep']);
            return false;
        }
        replacementUpdateVal(input, $(this).parents('.replacementCon'));
        return false;
    });
    $('body').on('keyup', '.replacementCon .inputReplacement', function(e){
        if ( e.which == 13 ){
            var input = e.target.value,
                text = input ;
            if ( $(this).parents('.replacementCon.fieldEnClosed').length == 1 && input.length != 1 ){
                MsgTip('', common_js_lang['csv.text.fieldEnClosed']);
                return false;
            }
            if ( $(this).parents('.replacementCon.columnSep').length == 1 && input.length <= 0 ) {    //列分隔符
                MsgTip('', common_js_lang['csv.text.columnSep']);
                return false;
            }
            replacementUpdateVal(input, $(this).parents('.replacementCon'));
            return false;
        }
    });

    function replacementUpdateVal(val, dom){
        dom.removeClass('show');
        var text = val;
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

    $('body').on('click', function(e){
        if ( self.hasClass('show') ){
            if ( $(e.target).parents('.replacementCon').length != 1 && $(e.target).parent('.replacementCon').length != 1 && $(e.target) != self[0] ){
                self.removeClass('show');
            }
        }
    });
}
$('.replacementCon').replaceComponent();


$('.global-columnSep').on('click', '.item label', function(){
    if ( $(this).find('.radio').hasClass('cur') )
        return ;
    $(this).parent().find('.radio').removeClass('cur');
    var curVal = $(this).find('.radio').addClass('cur').attr('data-val');
    curVal == '0' ? $('.global-columnSep .item.last').addClass('hidden') : $('.global-columnSep .item.last').removeClass('hidden');
});

$('.global-columnSep').on('click', '.btn-item', function(){
    var columnSep = $('.global-columnSep .columnSep .val').attr('data-val');

    var isRemained = $('.global-columnSep .isRemained .radio.cur').attr('data-val') === '0',
        fieldEnClosed = $('.global-columnSep .fieldEnClosed .val').attr('data-val').trim();
    isRemained ? fieldEnClosed = '' : '';  //fieldEnClosed

    if ( !columnSep ){
        MsgTip('', common_js_lang['local.info.setSeq'], 'info');
        return ;
    }
    if ( columnSep != globalParam.columnSep || fieldEnClosed != globalParam.fieldEnClosed ){
        globalParam.columnSep = columnSep;
        globalParam.fieldEnClosed = fieldEnClosed ;
        updateCreateSql();
    }
    $('.global-mask, .global-columnSep').css({display:'none'});
    configList();
});

$('.global-columnSep').on('click', '.btn-cancel, .cancel', function(){
    $('.global-mask, .global-columnSep').css({display:'none'});
});

function updateCreateSql(){
    $('#globalLoadCon').show();
    var deferArr = [];
    var lis = $('.sourceCon li:not(.fileTitle)');
    for ( var i=0, len=lis.length; i<len; i++ ){
        var param = JSON.parse(lis.eq(i).attr('data-param'));
        if ( param.createSql ){  // 更改新建ddl的换行符
            var sourceParam = JSON.parse(lis.eq(i).attr('data-sourceparam'));
            deferArr.push( updateDdl(sourceParam, param, lis.eq(i)) );
        }
    }

    $.when.apply( $, deferArr).then(function(){

    }).always(function(){
       $('#globalLoadCon').hide();
    });
}

function updateDdl(sourceParam, param, tarDom){
    var defer = $.Deferred();
    param['dbId'] = globalParam.connId;
    param['columnSep'] = globalParam.columnSep;
    param['fieldEnClosed'] = globalParam.fieldEnClosed;
    param['lineNum'] = param.dataLineNo;
    param['cols'] = 0;
    param.format = 'text';
    param.sourceparam = sourceParam ;

    globalParam.promiseFunc.newCsvDdl(param)
        .then(function(data){
            param.createSql = data.ddl;
            tarDom.attr('data-param', JSON.stringify(param));
            if ( tarDom.hasClass('cur') ){
                editor.doc.setValue( param.createSql );
            }
            defer.resolve();
        }).fail(function(){
            defer.reject();
        });

    return defer.promise();
}
///////////////////////////// 分隔符 end


//////////   上一步
$('.item2').on('click', '.prevStep', function(){
    $('.stepCon').animate({'margin-left': '0'}, 250, function(){
        $('.stepCon .item2').hide();
    });
    $('.processCon .itemCon').removeClass('cur').eq(0).addClass('cur');
    $('.sourceCon li.cur').click();
});

// 选择表
$('.sourceCon').on('click', 'li:not(.fileTitle)', function(){
    var prevSource = $('.sourceCon li.cur');
    prevSource.length == 1 && (globalParam.targetType == globalParam.commonLinkType.hdfs? saveHdfsParam(prevSource) : saveHiveParam(prevSource)) ;
    !$(this).hasClass('cur') && (globalParam.targetType == globalParam.commonLinkType.hdfs? resetHdfs($(this)) : resetHive( $(this) ));
    $(this).addClass('cur').siblings().removeClass('cur');
});

//////  hive 数据保存
function saveHiveParam(sourceDom, bool){
    var dbDom = $('.hiveCon').find('#dbName option:selected'),
        dbName = dbDom.val() || '',
        catalog = dbDom.attr('data-catalog') || '',
        schema = dbDom.attr('data-schema') || '',
        tableName = $('.hiveCon').find('#tableName').val(),
        tableType = $('.hiveCon').find('.tableType').val(),
        partition = savePart(),
        lineNum = $('.lineNum').val(),
        sql = editor.doc.getValue();    //editor

    var paramRes = {
        complete: true,
        msg: ''
    } ;

    if ( [dbName, tableName, sql].indexOf('') > -1 ){
        paramRes.complete = false;
        paramRes.msg = common_js_lang['local.info.tblErr'];
        if ( bool ){
            sourceDom.addClass('error');
            MsgTip('', common_js_lang['local.info.tblErr'], 'info');
            return false;
        }
    }


    var createSql = '' ,  ddl = '' ;
    if ( !editor.doc.cm.isReadOnly() ) {
        createSql = sql;
        sql = sql.substring(sql.indexOf("TABLE") + "TABLE".length, sql.indexOf("(")).trim();
        sql = sql.replace(/\"|\'|`|\[|\]/g, '');
        try {
            var sqlArr = sql.split('.');
            if (!(sqlArr[0] == dbName && sqlArr[1] == tableName)) {
                paramRes.complete = false;
                if ( bool ) {
                    sourceDom.addClass('error');
                    MsgTip('', common_js_lang['db.info.sqlErr'], 'info');
                    return false;
                }
            }
        } catch (e) {
            paramRes.complete = false;
            if ( bool ) {
                sourceDom.addClass('error');
                MsgTip('', common_js_lang['db.info.sqlErr'], 'info');
                return false;
            }
        }
    }
    else {
        ddl = sql;
    }

    var param = {
        dbId: globalParam.connId,
        name: dbName,
        catalog: catalog,
        schema: schema,
        tableName: tableName,
        tableType: tableType,
        dataLineNo: lineNum,
        ddl: ddl,
        createSql: createSql,
        paramRes: paramRes
    } ;
    partition ? param.partition = JSON.stringify( partition ) : '';

    paramRes.complete ? sourceDom.removeClass('error') : sourceDom.addClass('error');
    sourceDom.attr('data-param', JSON.stringify(param));
    return true;
}

function savePart(){
    var partitions = $('.hiveCon').find('#partitions .filedVal'),
        partitionItems = {} ;
    if ( partitions.length <= 0 )
        return '';

    for(var i = 0, length = partitions.length; i < length; i++) {
        partitionItems[partitions.eq(i).attr('data-type')] = partitions.eq(i).val().trim();
    }

    return partitionItems;
}

///////  hive 数据填充
function resetHive(sourceDom){
    var param = JSON.parse(sourceDom.attr('data-param')) || '';
    var dbName = param.name || '',
        tableName = param.tableName || '';
    var lineNum = param.lineNum || 1;

    $('.hiveCon .infoline.last').hide();
    $('.hiveCon #partitions').empty();
    $('.hiveCon .lineNum').val(lineNum).attr('data-val', lineNum);
    $('.hiveCon .tableType').val( param.tableType || (globalParam.targetType == globalParam.commonLinkType.hive ? 0 : 1)).prop('disabled', globalParam.targetType == globalParam.commonLinkType.spark || param.ddl != '');

    if( dbName ) {
        if ( $('#dbName').val() != dbName ){
            $('#dbName').val(dbName).select2();
            hiveModule.getTables(param);
        }
        else {
            $('#tableName').val(tableName).select2({tags:true});
            if ( $('#tableName').val() != tableName ){
                $('#tableName').append('<option value="'+tableName+'">'+tableName+'</option>').val(tableName).select2({tags:true});
            }
        }

        if ( param.ddl ){
            hiveModule.getPart(param.tableName, param.catalog, param.schema, param.partition);
            editor.doc.cm.setOption('readOnly', true);
            editor.doc.setValue(param.ddl);
            $('.new-sql .CodeMirror').addClass('disabled');
        }
        if ( param.createSql ) {
            editor.doc.cm.setOption('readOnly', false);
            editor.doc.setValue(param.createSql);
            $('.new-sql .CodeMirror').removeClass('disabled');
        }
    }
    else {
        $('#dbName').val('').select2();
        $('#tableName').html('<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option><option>' + tableName + '</option>').val(tableName).select2({tags: true});
        $('.hiveCon').find('.tableType').val(globalParam.targetType == globalParam.commonLinkType.hive ? 0 : 1).prop('disabled', true);
        editor.doc.cm.setOption('readOnly', true);
        editor.doc.setValue('');
        $('.new-sql .CodeMirror').addClass('disabled');
    }
}
/// hdfs 数据保存
function saveHdfsParam(sourceDom, bool){
    var curPath = $('.hdfsCon .path').val() || '',
        name = $('.hdfsCon .filename').val().trim() || '';
    var paramRes = {
        complete : true,
        msg : ''
    };
    if ( !curPath || !name ){
        paramRes.complete = false;
        paramRes.msg = common_js_lang['dbManage.info.hdfsParamErr'];
        if ( bool ) {
            sourceDom.addClass('error');
            MsgTip('', paramRes.msg, 'info');
            return false;
        }
    }
    name = name.slice(0, 60);
    paramRes.complete ? sourceDom.removeClass('error') : sourceDom.addClass('error');
    sourceDom.attr('data-param', JSON.stringify({hid: globalParam.connId, fileName: (curPath+'/'+name).replace(/\/+/g, '\/'), tarDir:curPath, tarName:name, paramRes:paramRes}));
    return paramRes.complete;
}
/// hdfs 数据填充
function resetHdfs(sourceDom){
    var curPath = JSON.parse(sourceDom.attr('data-param')).tarDir || '',
        name = JSON.parse(sourceDom.attr('data-param')).tarName || '' ;
    $('.hdfsCon .path').val(curPath).attr('title', curPath);
    $('.hdfsCon .filename').val(name);
}

// 上传
$('button.upload').on('click', function(){
    var jobName = ($('.taskName').val() || '').trim(),
        note = ($('.taskDes').val() || '').trim() ;
    if ( !jobName ){
        MsgTip('', common_js_lang['client.info.taskNameErr'], 'info');
        return ;
    }

    var pid = $('#userApp').val() || 0 ;
    if ( !pid ){
        MsgTip('', common_js_lang['dbManage.title.setApp'], 'info');
        return ;
    }

    $(this).prop('disabled', true);
    $('#globalLoadCon').css({display:'block'});

    var uploadParam = { jobName: jobName, note: note, pid:pid, toId:globalParam.connId, fromJson:[], toHiveJson:[], toHdfsJson:[]};
    uploadParam.toType = [8,9,13][+globalParam.targetType-1] ;

    var _curRes = globalParam.targetType == globalParam.commonLinkType.hdfs? saveHdfsParam($('.sourceCon li.cur'), true) : saveHiveParam($('.sourceCon li.cur'), true) ;
    if ( !_curRes ){
        $('.upload.btn-item').prop('disabled', false);
        $('#globalLoadCon').css({display:'none'});
        return false;
    }

    var tbls = $('.sourceCon li:not(.fileTitle)'),
        len = tbls.length ;
    var errorTag = false;
    var isRemained = $('.global-columnSep .isRemained .radio.cur').attr('data-val') === '0',
        fieldEnClosed = $('.global-columnSep .fieldEnClosed .val').attr('data-val').trim();

    for ( var i=0; i<len; i++ ){
        var param = JSON.parse(tbls.eq(i).attr('data-param')),
            sourceParam = JSON.parse(tbls.eq(i).attr('data-sourceParam')) ;
        if ( !param.paramRes || !param.paramRes.complete ){
            errorTag = true;
            tbls.eq(i).addClass('error');
            continue;
        }
        tbls.eq(i).removeClass('error');
        var otherParam = {columnSep: globalParam.columnSep, dataLineNo: param.dataLineNo, isRemained: isRemained};
        if ( !otherParam.isRemained && fieldEnClosed ){
            otherParam.fieldEnClosed = fieldEnClosed;
        }
        uploadParam.fromJson.push($.extend({}, sourceParam, otherParam));
    }
    if ( errorTag ){
        $('.upload.btn-item').prop('disabled', false);
        $('#globalLoadCon').css({display:'none'});
        MsgTip('', common_js_lang['file.info.errorConf'], 'info');
        return ;
    }

    var deferArr = [] ;
    globalParam.hiveParam = [];
    var batchDefer = $.Deferred();
    var tablesJson = [];
    for ( var i=0; i<len; i++ ){
        var param = JSON.parse(tbls.eq(i).attr('data-param')),
            sourceParam = JSON.parse(tbls.eq(i).attr('data-sourceParam')) ;
        if ( globalParam.targetType == globalParam.commonLinkType.hdfs ){
            uploadParam['toHdfsJson'].push({fileName: param.fileName, hid: globalParam.connId});
        }
        else {
            if(param.createSql) {
                param.ddl = param.createSql;
                param.index = i;
                tablesJson.push(param);
            }
            globalParam.hiveParam[i] = $.extend({}, param);
        }
    }

    if ( tablesJson.length >= 1 ){
        createTblBatch({dbId: globalParam.connId, pid:pid, tablesJsonStr: JSON.stringify(tablesJson)}, batchDefer);
    }
    else {
        batchDefer.resolve();
    }

    $.when( batchDefer ).then(function(){
        uploadParam.fromJson = JSON.stringify(uploadParam.fromJson);
        globalParam.targetType == globalParam.commonLinkType.hdfs ? uploadParam['toHdfsJson'] = JSON.stringify(uploadParam['toHdfsJson']) : uploadParam['toHiveJson'] = JSON.stringify(globalParam.hiveParam);

        $.fn.ajaxAPI({
            url: 'job/csv/save',
            type: 'post',
            loadTime: 0,
            data: uploadParam,
            contentType: 'application/x-www-form-urlencoded',
            callback: function(data){
                window.onbeforeunload = function(){return} ;
                location.href = "./success";
            },
            complete: function(){
                $('.upload.btn-item').prop('disabled', false);
                $('#globalLoadCon').css({display:'none'});
            }
        });
    }).always(function(){
        $('.upload.btn-item').prop('disabled', false);
        $('#globalLoadCon').css({display:'none'});
    });
});

function createTblBatch(param, batchDefer){
    var tablesJson = JSON.parse(param.tablesJsonStr);
    var errMsg = '', errTitle = '', errDetail = '';
    var tbls = $('.sourceCon li:not(.fileTitle)');
    $.ajax({
        url: 'db/table/create/batch',
        type: 'post',
        data: param,
        success: function(data){
            if ( data.code != 200 ){
                ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                batchDefer.reject();
                return ;
            }
            data.model.map(function(v, i){
                var index = tablesJson[i].index;
                if ( v.code != 200 ){
                    errTitle ? '' : errTitle = v.i18nMsg.title;
                    errDetail ? '' : errDetail = v.i18nMsg.detail;
                    errMsg += '['+globalParam.hiveParam[index].tableName+']:'+v.msg+'.\n';
                    return ;
                }
                globalParam.hiveParam[index].ddl = '';
                globalParam.hiveParam[index].createSql = '';
                globalParam.hiveParam[index].tableName = v.model.tableName;
                globalParam.hiveParam[index].catalog = v.model.catalog;
                globalParam.hiveParam[index].schema = v.model.schema;
                var dom = tbls.eq(index);
                var dataParam = JSON.parse(dom.attr('data-param'));
                dataParam.catalog = v.model.catalog;
                dataParam.schema = v.model.schema;
                dataParam.tableName = v.model.tableName;
                dataParam.ddl = v.model.ddl;
                dataParam.createSql = '';
                dom.attr('data-param', JSON.stringify(dataParam));
            });
            if ( errMsg ){
                ErrTip(errTitle, errDetail, errMsg);
                batchDefer.reject();
                return ;
            }
            batchDefer.resolve();
        },
        error: function(){
            batchDefer.reject();
        }
    })
}