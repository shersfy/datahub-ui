
    // CodeMirror 设置
    var editor = CodeMirror.fromTextArea($('.new-sql textarea')[0], {
        lineNumbers: true
    });

    var tmpParam = {
        fileIndex: 0,
        targetType: 0,
        fileTable: [],
        fileTableChange: false,
        fileCurLength: 0,
        columnSep: '\t',
        tmpAppId: 0,
        connId: 0,
        hiveParam: [],
        formDataAjax: {},
        batchTblMode: false
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
    // 取 hdfs下级目录
function getDir(base){
    base = base || '';
    var isHome = base == '' ? true : false ;
    var parentDom = base != ''? $('.dirDos [data-base="'+base+'"] > .ul') : $('.hdfsTab .dirDos > .ul');
    $.fn.ajaxAPI({
        url: isHome && 'hdfs/dir/home' || 'hdfs/dir/list',
        data: {base:base, hid: $('.connId').val(), pid:$('#userApp').val()},
        loadTime: isHome ? 10 : 2000,
        callback: function(data){
            parentDom.parent().find('.show').addClass('in');
            parentDom.fadeIn();
            if ( !isHome && data.model.length == 0 ){
                parentDom.siblings('p').find('.show').addClass('out');
                return false;
            }
            isHome && (data.model = [data.model]);
            var len = base.length;
            var dirHtml = template('template/hdfsDir', {dir:data.model, len:base.length});
            parentDom.html(dirHtml);
            isHome && getDataHandle();
        },
        complete: function(){
            parentDom.parent().find('.show').removeClass('got');
        }
    });
}

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
        if ( file[i].name.slice(-4).toLowerCase() != '.xls' && ['.xlsx'].indexOf(file[i].name.slice(-5).toLowerCase()) == -1 ){
            alertTag && MsgTip({title:'', text:common_js_lang['local.info.excleType'], type:'info', timer:2000});
            alertTag = false;
            continue ;
        }

        if ( file[i].size > 100*1024*1024 ){
            MsgTip('', common_js_lang['local.info.excelSize'], 'info');
            continue ;
        }

        if ( file[i].name && file[i].name.length > 60 ){
            MsgTip('', common_js_lang['s3.info.fileName100']);
            continue ;
        }

        var formData = new FormData();
        var indexTag = listFile(file[i]);
        formData.append('file', file[i]);
        globalParam.formDataAjax[indexTag] = $.ajax({
            url: 'job/excel/file/upload',
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
                    v.fileType = fileTitle.slice(-4) == '.xls' ? '.xls' : fileTitle.slice(-5) ;
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
        if ($('.configFilePath tbody tr').length <= 0) {
            $('.configFilePath tbody').append('<tr><td colspan="5" class="tableNoData"><img src="resources/dist/images/noData.png">' + common_js_lang['manage.title.noData'] + '</td></tr>');
        }

        if (tag.indexOf('uploaded') > -1) {  //上传完毕的文件，删除表信息
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
    var taskName = $('.item1 .taskName').val().trim(),
        taskDes =  $('.configTask .taskDes').val().trim();
    if ( !taskName ){
        MsgTip('', common_js_lang['local.info.taskNameNone'], 'info');
        return false;
    }

    var pid = $('#userApp').val() || 0 ;
    if ( !pid ){
        MsgTip('', common_js_lang['dbManage.title.setApp'], 'info');
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

    configList();
});

function configList(){
    var change = false;
    var typeChange = +$('.configTask #targetType').val() != globalParam.targetType ;
    var connChange = globalParam.connId != +$('.configTask .connId').val() ;
    var appIdChange = globalParam.tmpAppId != $('#userApp').val() ;
    if ( typeChange || connChange || appIdChange ){
        change = true;
        $('.item.item2 h3 i').html([common_js_lang['csv.text.hdfsNote'], common_js_lang['csv.text.hiveNote'], common_js_lang['csv.text.hiveNote']][+$('.configTask #targetType').val()-1]);
        +$('.configTask #targetType').val() == globalParam.commonLinkType.hdfs ? getDir('') : getDB();
    }
    else {
        dataHandle(change);
    }
}

function dataHandle(change){
    if ( change || globalParam.fileTableChange ){
        globalParam.fileTable = globalParam.fileTable.map(function(v, i){
            if ( globalParam.targetType == globalParam.commonLinkType.hdfs ){
                v.param = JSON.stringify({fileName: v.tableName, tarName:v.tableName});
                v.sourceParam = JSON.stringify({filePath:v.filePath, srcPath:v.srcPath, tableName: v.tableName});
            } else {
                v.sheets = v.sheets.map(function(vv){
                    vv.param = JSON.stringify({tableName: vv.name});
                    vv.sourceParam = JSON.stringify({filePath:v.filePath, srcPath:v.srcPath, tableName: v.tableName, name:vv.name, totalRowSize: v.totalRowSize , rowSize:vv.rowSize, index:vv.index, columnSize: (vv.header && vv.header.columnSize || 1), fileTag:i});
                    return vv;
                })
            }
            return v;
        });
        globalParam.fileTableChange = false;

        $('.rightSide h4 b').html('(0)');
        if ( globalParam.targetType != globalParam.commonLinkType.hdfs ) {
            $('.leftSide .allSelected.cur').removeClass('cur');
            $('.leftSide, .transfer').show();
            $('.rightSide').removeClass('all');
            $('.rightSide thead').html(template('template/thead', {isDb: true}));
            $('.rightSide .target-item').html('<tr class="noDataTr"><td colspan="4" class="tableNoData"><img src="resources/dist/images/noData.png">' + common_js_lang['manage.title.noData'] + '</td></tr>');
            $('.item2 .tblList > .ul').html(template('template/source', {
                data: globalParam.fileTable,
                type: globalParam.targetType
            }));
        }
        else {
            $('.rightSide h4 b').html('('+globalParam.fileTable.length+')');
            $('.leftSide, .transfer').hide();
            $('.rightSide').addClass('all');
            $('.rightSide thead').html(template('template/thead', {isDb: false}));
            $('.rightSide .target-item').html(template('template/hdfsList', {files:globalParam.fileTable}));
        }
    }

    $('.stepCon').animate({'margin-left': '-100%'}, 250, function(){
        $('.stepCon .item1').height(200);
        $('.stepCon .item2').height('auto');
        //globalParam.targetType != 1 ? editor.refresh() : '';
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
$('.new-sql strong').hover(function(){
    var self = $(this);
    hoverInterval = setTimeout(function(){
            self.find('.tip').css({display:'block'});},
        300);
}, function(){
    clearInterval(hoverInterval);
    $(this).find('.tip').css({display:'none'});
});

//////////   上一步
$('.item2').on('click', '.prevStep', function(){
    $('.stepCon').animate({'margin-left': '0'}, 250, function(){
        $('.stepCon .item1').height('auto');
        $('.stepCon .item2').height('200');
    });
    $('.processCon .itemCon').removeClass('cur').eq(0).addClass('cur');
});

function checkBoxSelect(param){
    var container = $('.leftSide.sourceTbl');
    this.container = param.container ? param.container : container ;
    this.event();
}

checkBoxSelect.prototype = {
    event: function(){
        var _this = this;

        this.container.on('click', '.getTbl', function() {
            var tbl = $(this).parent().find('.tbl');
            if(tbl.css('display') == 'none') {
                tbl.slideDown();
                $(this).html('-');
            } else {
                tbl.slideUp();
                $(this).html('+');
            }
            return;
        });

        this.container.on('click', '.dbSelected', function() {
            $(this).toggleClass('cur');
            var tbls = $(this).siblings('.tbl');
            var isCheck = $(this).hasClass("cur");
            tbls.find('li').toggleClass('cur', isCheck);
            tbls.find('li .check').toggleClass('cur', isCheck);

            var count = _this.container.find('li .dbSelected').length;
            var isAll = count == _this.container.find('li .dbSelected.cur').length;
            _this.container.find('.allSelected').toggleClass('cur', isAll);
            return false;
        });

        this.container.on('click', '.tblSelected', function(e, ctrlKey) {
            if ( e.ctrlKey || ctrlKey ){
                if ( !globalParam.batchTblMode ) {
                    globalParam.batchTblMode = true;
                    $(this).attr('data-batch', 1);
                    return false;
                }

                var startTbl = $('.leftSide .tblSelected[data-batch="1"]');
                if ( startTbl.parents('.db-item').attr('data-dbname') !== $(this).parents('.db-item').attr('data-dbname') ){
                    globalParam.batchTblMode = false;
                    _this.container.find('.tblSelected[data-batch="1"]').attr('data-batch', 0);
                    return false;
                }

                var index1 = +startTbl.siblings('b').text(),
                    index2 = +$(this).siblings('b').text(),
                    tbls = $(this).parents('.tbl').find('li'),
                    start = index1 > index2 ? index2 : index1,
                    end = index1 > index2 ? index1 : index2 ;
                for ( var i=start; i<=end; i++ ){
                    if ( tbls.eq(i-1).hasClass('hidden') )
                        continue ;
                    tbls.eq(i-1).addClass('cur');
                    tbls.eq(i-1).find('.check').addClass('cur');
                }

                globalParam.batchTblMode = false;
                _this.container.find('.tblSelected[data-batch="1"]').attr('data-batch', 0);

                var tbls = $(this).parents('.tbl') ;
                var count = tbls.find('li').length;
                if(tbls.find('.check.cur').length == count) {
                    tbls.siblings('.dbSelected').addClass('cur');
                } else {
                    tbls.siblings('.dbSelected').removeClass('cur');
                }

                var count = _this.container.find('li .dbSelected').length;
                var isAll = count == _this.container.find('li .dbSelected.cur').length;
                _this.container.find('.allSelected').toggleClass('cur', isAll);
                return false;
            }

            globalParam.batchTblMode = false;
            _this.container.find('.tblSelected[data-batch="1"]').attr('data-batch', 0);

            $(this).toggleClass('cur');
            var hasCur = $(this).hasClass('cur');
            $(this).parent().toggleClass('cur', hasCur);
            var tbls = $(this).parents('.tbl'),
                count = tbls.find('li').length;

            if(tbls.find('.check.cur').length == count) {
                tbls.siblings('.dbSelected').addClass('cur');
            } else {
                tbls.siblings('.dbSelected').removeClass('cur');
            }

            var count = _this.container.find('.dbSelected').length;
            var isAll = count == _this.container.find('.dbSelected.cur').length;
            _this.container.find('.allSelected').toggleClass('cur', isAll);
            return false;
        });

        this.container.on('click', '.tbl li', function(e) {
            $(this).find('.check').trigger('click', e.ctrlKey);
        });

        this.container.on('click', '.allSelected', function() {
            $(this).toggleClass('cur');
            var isCheck = $(this).hasClass('cur');
            _this.container.find('.dbSelected, .tblSelected').toggleClass('cur', isCheck);
            return false;
        });
    }
};

var leftCheckBox = new checkBoxSelect({container:$('.leftSide.sourceTbl')});

$('.rightSide.targetPath').on('click', '.target-db', function(){
    $(this).toggleClass('cur');
    var isCheck = $(this).hasClass('cur');
    var index = $(this).parents('.target-path').attr('data-index');
    $('.rightSide [data-index="' + index + '"] .check').toggleClass('cur', isCheck);

    if($('.rightSide .target-db').length == $('.rightSide .target-db.cur').length) {
        $('.rightSide .allSelected').addClass('cur');
    } else {
        $('.rightSide .allSelected').removeClass('cur');
    }
});
$('.rightSide.targetPath').on('click', '.tblSelected', function(){
    $(this).toggleClass('cur');
    var index = $(this).parents('tr').attr('data-index');
    var dbCheck = $('.rightSide .isdb[data-index="' + index + '"] .tblSelected').length == $('.rightSide .isdb[data-index="' + index + '"] .tblSelected.cur').length;
    $('.rightSide .target-path[data-index="' + index + '"] .target-db').toggleClass('cur', dbCheck);

    var allCheck = $('.rightSide .tblSelected').length == $('.rightSide .tblSelected.cur').length;
    $('.rightSide .allSelected').toggleClass('cur', allCheck);
});
$('.rightSide.targetPath').on('click', '.allSelected', function(){
    $(this).toggleClass('cur');
    var isCheck = $(this).hasClass('cur');
    $('.target-item').find('.tblSelected, .target-db').toggleClass('cur', isCheck);
    return ;
});

// 右移表
$('.transfer').on('click', '.move-right', function() {
    if ( $('.leftSide .tblList .tblSelected.cur').length <= 0 )
        return ;
    var dbs = $('.leftSide .tblList .db-item'); //库
    var rightSide = $('.rightSide .target-item');
    rightSide.parent().find('.check').removeClass('cur');

    for(var i = 0, len = dbs.length; i < len; i++) {
        var curDb = dbs.eq(i),
            tbls = curDb.find('.tblSelected.cur'), //选中的表
            count = tbls.length;

        if(count == 0)
            continue;

        var index = curDb.attr('data-index'),
            dbName = curDb.find('> p').text() ;
        var data = {
            index: index,
            count: count,
            dbName: dbName,
            tbls: []
        };
        var rightDb = rightSide.find('.target-path[data-index="'+index+'"]');

        if ( rightDb.length > 0 ){  // 右侧已存在库
            var newCount = 0;
            for(var j = 0; j < count; j++) {
                var tblName = tbls.eq(j).siblings('p').text();
                var rightTbl = rightSide.find('[data-index="'+index+'"][data-tbl="'+tblName+'"]');
                if ( rightTbl.length == 0 ){
                    var tempObj = {};
                    tempObj['tbl'] = tblName;
                    tempObj['param'] = tbls.eq(j).parent().attr('data-param');
                    tempObj['sourceparam'] = tbls.eq(j).parent().attr('data-sourceparam');
                    data['tbls'].push(tempObj);
                    newCount ++ ;
                }
            }
            var newTblDom = $(template('template/targetTbl', data)).siblings('tr:not(".target-path")');
            rightSide.find('[data-index="'+index+'"]').slice(-1).after(newTblDom);
            rightDb.find('b').html(+rightDb.find('b').html() + newCount);
            continue ;
        }

        for(var j = 0; j < count; j++) {
            var tempObj = {};
            tempObj['tbl'] = tbls.eq(j).siblings('p').text();
            tempObj['param'] = tbls.eq(j).parent().attr('data-param');
            tempObj['sourceparam'] = tbls.eq(j).parent().attr('data-sourceparam');
            data['tbls'].push(tempObj);
        }
        $('.rightSide .target-item').append(template('template/targetTbl', data));
    }

    $('.leftSide .tbl li, .leftSide i.check.cur').removeClass('cur'); //去掉源的勾选
    $('.rightSide h4 b').html('('+$('.target-item .target-name').length+')');
    $('.rightSide .target-item tr:not(".noDataTr")').length > 0  && $('.rightSide .target-item .noDataTr').remove();
});

// 左移表
$('.transfer').on('click', '.move-left', function() {
    $('.rightSide .target-item .check.cur').parents('tr').remove();
    $('.rightSide .allSelected').removeClass('cur');
    var dbs = $('.rightSide .target-item .target-path');
    var allCount = 0;
    for (var i = 0, len = dbs.length; i < len; i++) {
        var index = dbs.eq(i).attr('data-index'),
            count = $('.rightSide .target-item [data-index="' + index + '"]:not(".target-path")').length;
        dbs.eq(i).find('td b').html(count);
        if ( count <= 0 ){
            dbs.eq(i).remove();
        }
        allCount += count ;
    }
    $('.rightSide h4 b').html('('+allCount+')');
    $('.rightSide .target-item tr').length == 0 && $('.rightSide .target-item').append('<tr class="noDataTr"><td colspan="4" class="tableNoData"><img src="resources/dist/images/noData.png">'+common_js_lang['manage.title.noData']+'</td></tr>');
});

function configParam(){
    this.listContainer = $('.rightSide');
    this.configContainer = $('.global-ConfigCon');
    this.mask = $('.global-mask');
    this.newType = 2;
    this.editor = editor;
    this.event();
}
configParam.prototype = {
    event: function(){
        var _this = this;
        _this.configContainer.on('click', '.btn-item', function(){
            if ( $(this).attr("data-type") == "all" ){
                if ( globalParam.targetType != globalParam.commonLinkType.hdfs )
                    _this.hiveBatchAct();
                else {
                    _this.hdfsBatchAct();
                }
            }
            else {
                if ( globalParam.targetType != globalParam.commonLinkType.hdfs )
                    _this.hiveSingleAct();
                else {
                    _this.hdfsSingleAct();
                }
            }
        });

        _this.listContainer.on('click', '.batch', function(){
            if ( _this.listContainer.find('.check.cur').length <= 0 ){
                MsgTip('', common_js_lang['db.info.tarEmpty'], 'info');
                return ;
            }
            _this.configContainer.find('.btn-item').attr('data-type', 'all');
            _this.mask.show();
            _this.configContainer.show();
            if ( globalParam.targetType != globalParam.commonLinkType.hdfs ){
                _this.configContainer.find('.hdfsTab').hide();
                _this.configContainer.find('.dbTab').show();

                _this.configContainer.find('.infoline:not(".first,:last-child")').hide();
                _this.configContainer.find('.new-sql').hide();
                _this.configContainer.find('.lineNum').val(1);
            }
            else {
                _this.configContainer.find('.dbTab').hide();
                _this.configContainer.find('.hdfsTab').show();

                _this.configContainer.find('.hdfsTab p .check').removeClass('cur');
                _this.configContainer.find('.hdfsTab .selectedDir').val('').attr('title', '');

                _this.configContainer.find('.hdfsTab .res label').eq(1).hide();
                _this.configContainer.find('.hdfsTab .fileName').hide();
            }
        });

        _this.listContainer.on("click", ".config", function() {
            $(this).addClass('active');
            _this.configContainer.find('.btn-item').attr('data-type', '');

            var paramStr = $(this).parent().attr('data-param') || '',
                param = paramStr ? JSON.parse( paramStr ) : '' ;

            _this.mask.show();
            _this.configContainer.show();
            if( globalParam.targetType != globalParam.commonLinkType.hdfs ) {
                _this.configContainer.find('.hdfsTab').hide();
                _this.configContainer.find('.dbTab').show();

                _this.configContainer.find('.infoline:not(".first,:last-child")').show();
                _this.configContainer.find('.new-sql').show();

                _this.configContainer.find(".infoline.last").hide();
                _this.configContainer.find('#partitions').empty();

                _this.configContainer.find('.tableType').val( param.tableType || (globalParam.targetType == globalParam.commonLinkType.hive ? 0 : 1)).prop('disabled', globalParam.targetType == globalParam.commonLinkType.spark || param.ddl != '');
                _this.configContainer.find('.lineNum').val( (param.dataRowIndex || 0)+1 );

                var dbName = param.name || '',
                    tableName = param.tableName || $(this).siblings('.tbl').text();

                if( dbName ) {
                    if ( $('#dbName').val() != dbName ){
                        $('#dbName').val(dbName).select2();
                        _this.getTables(param);
                    }
                    else {
                        $('#tableName').val(tableName).select2({tags:true});
                        if ( $('#tableName').val() != tableName ){
                            $('#tableName').append('<option value="'+tableName+'">'+tableName+'</option>').val(tableName).select2({tags:true});
                        }
                    }

                    if ( param.ddl ){
                        _this.getPart(param.tableName, param.catalog, param.schema, param.partition);
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
                    _this.configContainer.find('.tableType').val(globalParam.targetType == globalParam.commonLinkType.hive ? 0 : 1).prop('disabled', true);
                    editor.doc.cm.setOption('readOnly', true);
                    editor.doc.setValue('');
                    $('.new-sql .CodeMirror').addClass('disabled');
                }
            }
            else {
                _this.configContainer.find('.dbTab').hide();
                _this.configContainer.find('.hdfsTab').show();

                _this.configContainer.find('.hdfsTab .res label').eq(1).show();
                _this.configContainer.find('.hdfsTab .fileName').show();

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

                _this.configContainer.find('.hdfsTab p .check').removeClass('cur');
                _this.configContainer.find('.hdfsTab p .show').removeClass('in');

                _this.configContainer.find('.hdfsTab .selectedDir').val(curPath).attr('title', curPath);
                _this.configContainer.find('.hdfsTab .fileName').val(name);

                if(curPath) {
                    var target = _this.configContainer.find('.hdfsTab [data-base="' + curPath + '"]');
                    if(target.length == 1) {
                        target.find('>p .check').addClass('cur');
                        target.parents('.ul').fadeIn().siblings('p').find('.show').addClass('in');
                    }
                }
            }
        });

        _this.configContainer.on('change', '#dbName', function(){
            if ( _this.configContainer.find('.btn-item').attr('data-type') == 'all' ){
                return ;
            }
            var param = _this.getParam();
            if ( !param.name ){
                return ;
            }
            _this.getTables(param);
        });

        _this.configContainer.on('change', '#tableName', function(){
            var param = _this.getParam();
            if ( !param.name || !param.tableName ){
                return ;
            }
            if ( !param.tableName.match(/^[0-9A-Za-z]\w*$/g) ){
                MsgTip('', common_js_lang['db.info.tableName'], 'info');
                _this.configContainer.find('#tableName').val('').select2({tags:true});
                return false;
            }
            _this.getDdlAct(param, _this.newType);
        });

        _this.configContainer.on('change', '.tableType', function(){
            var param = _this.getParam();
            if ( !param.name || !param.tableName ){
                return ;
            }
            if ( !param.tableName.match(/^[0-9A-Za-z]\w*$/g) ){
                MsgTip('', common_js_lang['db.info.tableName'], 'info');
                _this.configContainer.find('#tableName').val('').select2({tags:true});
                return false;
            }
            _this.getDdlAct(param, _this.newType);
        });

        _this.configContainer.on('blur', '.lineNum', function(){
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
                _this.configContainer.find('#tableName').val('').select2({tags:true});
                return false;
            }
            _this.getDdlAct(param, _this.newType);
        });

        _this.configContainer.on('click', '.btn-cancel, .cancel', function(){
            _this.closeConfig();
        });

        _this.configContainer.on('click', '.hdfsTab li p .show', function(){
            if ( $(this).parent().siblings('ul').find('li').length == 0 ){
                if ( $(this).hasClass('got') )
                    return false;
                $(this).addClass('got');
                getDir($(this).parents('li').data('base'));
            }
            else{
                $(this).toggleClass('in');
                $(this).parent().siblings('ul').toggle();
            }
        });

        _this.configContainer.on('click', '.hdfsTab li p .check', function(){
            if ( $(this).hasClass('cur') )
                return ;

            _this.configContainer.find('.hdfsTab .check.cur').removeClass('cur');
            $(this).addClass('cur');
            var base = $(this).parents('li').data('base');
            _this.configContainer.find('.selectedDir').val(base).attr('title', base);
        });
    },
    getParam: function(){
        var _this = this;
        var dbDom = _this.configContainer.find("#dbName option:selected");
        return {
            dbId: globalParam.connId,
            name: dbDom.val(),
            pid: $('#userApp').val(),
            catalog: dbDom.attr('data-catalog') || '',
            schema: dbDom.attr('data-schema') || '',
            tableName: _this.configContainer.find('#tableName').val(),
            sourceparam: JSON.parse($('.config.active').parent().attr('data-sourceparam')),
            tableType: _this.configContainer.find('.tableType').val(),
            format: _this.configContainer.find('.tableType option:selected').text(),
            lineNum: _this.configContainer.find('.lineNum').val(),
            columnSep:globalParam.columnSep
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
                _this.configContainer.find('.CodeMirror').addClass('disabled');
                var formatVal = {
                    text: '0',
                    orc: '1',
                    parquet: '2',
                    rcfile: '3',
                    sequencefile: '4'
                } ;
                _this.configContainer.find('.tableType').val(formatVal[data.format] || 0).prop('disabled', true);
                _this.getPart(param.tableName, param.catalog, param.schema, param.partition || '', defer);
            }
            else {
                _this.editor.doc.cm.setOption('readOnly', false);
                _this.configContainer.find('.CodeMirror').removeClass('disabled');
                var formatVal = {
                    text: '0',
                    orc: '1',
                    parquet: '2',
                    rcfile: '3',
                    sequencefile: '4'
                } ;
                _this.configContainer.find('.tableType').val(formatVal[data.format] || (globalParam.targetType == globalParam.commonLinkType.hive ? 0 : 1)).prop('disabled', globalParam.targetType == globalParam.commonLinkType.spark || false);
                _this.configContainer.find('#partitions').empty();
                _this.configContainer.find('.hive .infoline.last').hide();
                defer.resolve();
            }
        }).fail(function(){
            _this.configContainer.find('#tableName').val('').select2({tags:true});
            _this.editor.doc.setValue('');
            _this.editor.doc.cm.setOption('readOnly', 'nocursor');
            _this.configContainer.find('.CodeMirror').addClass('disabled');
            _this.configContainer.find('.tableType').val(0).prop('disabled', true);

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
    },
    hdfsBatchAct: function(){
        var _this = this;
        var curPath = _this.configContainer.find('.hdfsTab .selectedDir').val().trim() || '' ;
        if ( curPath == '' ){
            MsgTip('', common_js_lang['db.info.batchDir'], 'info');
            return ;
        }

        $.ajax({
            url: 'hdfs/dir/access',
            data:{hdfsId:globalParam.connId, dir:curPath, pid:$('#userApp').val()},
            success: function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }

                _this.listContainer.find('.target-item .check.cur').map(function(i, v){
                   var trDom = $(v).parents('tr'),
                       name = trDom.find('.target-name').text() ;
                    if ( name.match(/\s+|\\+/g) ){
                        trDom.attr('data-param', JSON.stringify({tarName:''}));
                        trDom.find('.fileName').html('').attr('title', '');
                        return ;
                    }
                    name = name.slice(0, 60);
                    var fileName = (curPath + '/' + name).replace(/\/+/g, '/');
                    trDom.attr('data-param', JSON.stringify({tarName:name, tarDir:curPath, fileName:fileName}));
                    trDom.find('.fileName').html(fileName).attr('title', fileName);
                    $(v).click();
                });

                _this.closeConfig();
            }
        });
    },
    hdfsSingleAct: function(){
        var _this = this;

        var name = _this.configContainer.find('.hdfsTab .fileName').val().trim() || '',
            curPath = _this.configContainer.find('.hdfsTab .selectedDir').val().trim() || '' ;

        if (!curPath || !name) {
            MsgTip('', common_js_lang['local.info.fileDir'], 'info');
            return false;
        }
        if ( name.match(/\s+|\\+/g) ){
            MsgTip('', common_js_lang['local.info.fileName'], 'info');
            return false;
        }

        $.ajax({
            url: 'hdfs/dir/access',
            data:{hdfsId:globalParam.connId, dir:curPath, pid:$('#userApp').val()},
            success: function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                name = name.slice(0, 60);
                var fileName = curPath + '/' + name ;
                fileName = fileName.replace(/\/+/g, '\/');
                var trDom = _this.listContainer.find('.config.active').parent();
                trDom.find(".fileName").html(fileName).attr("title",fileName);
                trDom.attr('data-param', JSON.stringify({fileName:fileName, tarDir:curPath, tarName:name}));
                _this.closeConfig();
            }
        });
    },
    hiveBatchAct: function(){
        var _this = this;
        var dbDom = $("#dbName option:selected"),
            name = dbDom.val(),
            catalog = dbDom.attr('data-catalog') || '',
            schema = dbDom.attr('data-schema') || '',
            tableType = globalParam.targetType == globalParam.commonLinkType.hive ? 0 : 1,
            format = globalParam.targetType == globalParam.commonLinkType.hive ? 'text' : 'orc',
            lineNum = $('.lineNum').val();

        if ( !name ){
            MsgTip('info', common_js_lang['client.info.noDb']);
            return ;
        }

        var target = _this.listContainer.find('.target-item .isdb .check.cur'),
            tarLen = target.length,
            deferArr = [];
        $('#waitLoading').find('article').html('<p>' + common_js_lang['loading.info.batchConf'].replace(/\[x\]/, tarLen) + '</p><p class="detail"></p>').end().css({display: 'block'});

        var tblDefer = $.Deferred();
        var param = {dbId:globalParam.connId, catalog:catalog, schema:schema};
        $.when( globalParam.promiseFunc.getTables(param) ).then( function(){
            var tbls = globalParam.tblModel['tbl_'+globalParam.connId+'_'+catalog+'_'+schema];
            var tableList = '<option value="" disabled>'+common_js_lang['local.option.setTbl']+'</option>';
            tbls.map(function(v) {
                tableList += '<option data-name="' + v.name + '">' + v.name + '</option>';
            });
            $("#tableName").html(tableList).val('').select2({tags:true});
            tblDefer.resolve();
        }).fail(function(){
            tblDefer.reject();
            $('#waitLoading').hide();
        });

        $.when( tblDefer).then(function() {
            for (var i = 0; i < tarLen; i++) {
                var trDom = target.eq(i).parents('tr'),
                    sourceparam = JSON.parse(trDom.attr('data-sourceparam')),
                    tableName = trDom.attr('data-tbl');

                deferArr[i] = $.Deferred();
                if (!tableName.match(/^[0-9A-Za-z]\w*$/g)) {
                    trDom.attr('data-param', JSON.stringify({
                        dbId: globalParam.connId,
                        name: name,
                        catalog: catalog,
                        schema: schema,
                        tableName: '',
                        tableType: tableType,
                        dataRowIndex: lineNum - 1
                    }));
                    trDom.find('.tbl').attr('title', '').html('');
                    deferArr[i].resolve();
                    continue;
                }
                else {
                    var param = {
                        dbId: globalParam.connId,
                        name: name,
                        catalog: catalog,
                        schema: schema,
                        tableName: tableName,
                        tableType: tableType,
                        format: format,
                        sourceparam: sourceparam,
                        lineNum: lineNum
                    };

                    handle(param, deferArr[i], trDom);
                }
            }

            function handle(param, defer, tr) {
                $.when(globalParam.promiseFunc.getDdl(param,2)).then(function (data) {
                    if ( data.mppTable && globalParam.targetType == globalParam.commonLinkType.hive ){
                        defer.reject();
                        MsgTip('info', common_js_lang['db.tip.hivexspark']);
                        return ;
                    }
                    if ( !data.mppTable && globalParam.targetType == globalParam.commonLinkType.spark ){
                        defer.reject();
                        MsgTip('info', common_js_lang['db.tip.sparkxhive']);
                        return ;
                    }

                    var formatVal = {
                        text: '0',
                        orc: '1',
                        parquet: '2',
                        rcfile: '3',
                        sequencefile: '4'
                    };
                    var tableType = formatVal[data.format] || 0;
                    param.tableType = tableType;
                    data.isShow ? param.ddl = data.ddl : param.createSql = data.ddl;
                    param.dataRowIndex = param.lineNum - 1;

                    tr.attr('data-param', JSON.stringify(param));
                    tr.find('.db').html(param.name);
                    tr.find('.tbl').attr('title', param.tableName).html(param.tableName);
                    tr.find('.check.cur').click();
                    defer.resolve();
                }).fail(function () {
                    defer.reject();
                });
            }

            $.when.apply($, deferArr).then(function () {
                $("#waitLoading").hide();
                _this.closeConfig();
            }).fail(function () {
                $('#waitLoading').hide();
            });
        });
    },
    hiveSingleAct: function(){
        var param = this.saveHiveParam();
        if ( !param )
            return ;

        var trDom = this.listContainer.find('.config.active').parent();
        trDom.find(".db").html(param.name).attr("title",param.name);
        trDom.find(".tbl").html(param.tableName).attr("title",param.tableName);
        trDom.attr('data-param', JSON.stringify(param));
        this.closeConfig();
    },
    saveHiveParam: function(){
        var dbDom = this.configContainer.find('#dbName option:selected'),
            dbName = dbDom.val(),
            catalog = dbDom.attr('data-catalog') || '',
            schema = dbDom.attr('data-schema') || '',
            tableName = this.configContainer.find('#tableName').val(),
            tableType = this.configContainer.find('.tableType').val(),
            partition = this.savePart(),
            lineNum = $('.lineNum').val() - 1,
            sql = editor.doc.getValue();    //editor

        if ( [dbName, tableName, sql].indexOf('') > -1 ){
            MsgTip('', common_js_lang['local.info.tblErr'], 'info');
            return false;
        }

        var ddl = '', createSql = '';
        if ( !editor.doc.cm.isReadOnly() ) {
            createSql = sql;
            sql = sql.substring(sql.indexOf("TABLE") + "TABLE".length, sql.indexOf("(")).trim();
            sql = sql.replace(/\"|\'|`|\[|\]/g, '');
            try {
                var sqlArr = sql.split('.');
                if (!(sqlArr[0] == dbName && sqlArr[1] == tableName)) {
                    MsgTip('', common_js_lang['db.info.sqlErr'], 'info');
                    return false;
                }
            } catch (e) {
                MsgTip('', common_js_lang['db.info.sqlErr'], 'info');
                return false;
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
            dataRowIndex: lineNum,
            ddl: ddl,
            createSql: createSql
        } ;
        partition ? param.partition = JSON.stringify( partition ) : '';
        return param;
    },
    savePart: function(){
        var partitions = this.configContainer.find('#partitions .filedVal'),
            partitionItems = {} ;
        if ( partitions.length <= 0 )
            return '';

        for(var i = 0, length = partitions.length; i < length; i++) {
            partitionItems[partitions.eq(i).attr('data-type')] = partitions.eq(i).val().trim();
        }

        return partitionItems;
    },
    closeConfig: function(){
        this.configContainer.hide();
        this.mask.hide();
        this.listContainer.find('.config.active').removeClass('active');
    }
};
    new configParam();

    // 上传
$('button.upload').on('click', function(){
    var jobName = ($('.taskName').val() || '').trim(),
        note = ($('.taskDes').val() || '').trim(),
        pid = $('#userApp').val() || 0 ;

    var uploadParam = { jobName: jobName, note: note, pid:pid, toId: globalParam.connId, fromJson:[], toHiveJson:[], toHdfsJson:[]};
    uploadParam.toType = [8,9,13][+globalParam.targetType-1] ;

    var trs = $('.target-item tr:not(".target-path")'),
        len = trs.length;

    if ( $('.target-item .config').length <= 0 ){
        MsgTip('', common_js_lang['db.info.confTar'], 'info');
        return ;
    }

    $(this).prop('disabled', true);

    var batchPartTables = [],
        tablesJson = [] ;
    var partDefer = $.Deferred(),
        batchDefer = $.Deferred() ;

    for ( var i=0; i<len; i++ ){
        var param = JSON.parse(trs.eq(i).attr('data-param')),
            sourceParam = JSON.parse(trs.eq(i).attr('data-sourceparam')) ;

        if ( globalParam.targetType == globalParam.commonLinkType.hdfs ){
            if ( !param.tarDir || !param.tarName ){
                MsgTip('info', common_js_lang['local.info.hdfsParam'].replace(/\[x\]/, '['+(i+1)+']'));
                $('.upload.btn-item').prop('disabled', false);
                return ;
            }
            uploadParam['fromJson'].push(sourceParam);
            uploadParam['toHdfsJson'].push({fileName: param.fileName, hid:globalParam.connId});
        }
        else {
            if ( !param.name || !param.tableName ){
                MsgTip('info', common_js_lang['local.info.hiveParam']);
                $('.upload.btn-item').prop('disabled', false);
                return ;
            }
            sourceParam.dataRowIndex = param.dataRowIndex;
            var fileIndex = trs.eq(i).attr('data-index');
            sourceParam.fileIndex = fileIndex;
            uploadParam['fromJson'].push(sourceParam);
            uploadParam['toHiveJson'].push(param);

            if ( param.createSql ){  //新建表
                tablesJson.push({catalog:param.catalog, schema: param.schema, tableName:param.tableName, ddl:param.createSql, index:i});
            }


            if ( param.ddl && !param.partition ) {
                var partArrObj = globalParam.partitionsData['catalog' + param.catalog + '_schema' + param.schema + '_' + param.tableName];
                if ( partArrObj && partArrObj.length > 0 ) {  //已知存在分区但没配置
                    MsgTip('', common_js_lang['db.text.tbl'] + '[' + param.tableName + '] ' + common_js_lang['local.info.hiveParam'] + '\n', 'info');
                    return false;
                }

                if ( !partArrObj) {  // 没配置分区，不知是否有分区
                    batchPartTables.push(param);
                }
            }
        }
    }

    if ( batchPartTables.length >= 1 ){
        $('#waitLoading').find('article').html('<p>'+common_js_lang['db.text.checkWait']+'</p><p class="detail"></p>').end().css({display:'block'});
        $.when( globalParam.promiseFunc.batchPartCheck({dbId: globalParam.connId, pid:$('#userApp').val(), tablesJsonStr:JSON.stringify(batchPartTables)}) )
            .then(function(){
                partDefer.resolve();
            }).fail(function(){
                partDefer.reject();
            })
    }
    else {
        partDefer.resolve();
    }

    $.when( partDefer).then(function(){
        if ( tablesJson.length >= 1 ){
            var errMsg = '',
                errDetail = '',
                errTitle = '',
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
                if (errMsg) {
                    batchDefer.reject();
                    $('#waitLoading').css({display:'none'});
                    ErrTip(errTitle, errDetail, common_js_lang['loading.info.newInfo'].replace(/\[x\]/, succCount).replace(/\[y\]/, failCount)+'\n'+errMsg);
                    return;
                }
                batchDefer.resolve();
                return;
            }
            var spliceJson = tablesJson.slice(init, init+100),
                amount = init + 100 <= len ? 100 : len-init ;
            $.ajax({
                url: 'db/table/create/batch',
                type: 'post',
                data: {dbId: globalParam.connId, pid:$('#userApp').val(), tablesJsonStr: JSON.stringify(spliceJson)},
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
                                errMsg += '[' + tablesJson[i+init].tableName + ']:' + v.msg + '.\n';
                                return;
                            }
                            succCount ++ ;
                            uploadParam.toHiveJson[index].ddl = v.model.ddl;
                            uploadParam.toHiveJson[index].createSql = '';
                            uploadParam.toHiveJson[index].tableName = v.model.tableName;
                            uploadParam.toHiveJson[index].catalog = v.model.catalog;
                            uploadParam.toHiveJson[index].schema = v.model.schema;
                            trs.eq(index).attr('data-param', JSON.stringify(uploadParam.toHiveJson[index])); // dom参数更新
                        });
                    }
                    init += 100 ;
                    $('#waitLoading').find('article .detail').html(common_js_lang['loading.info.newInfo'].replace(/\[x\]/, succCount).replace(/\[y\]/, failCount)) ;
                    createTblBatch();
                }
            })
        }
    }).fail(function(){
        batchDefer.reject();
    });

    $.when( batchDefer ).then(function(){
        if ( globalParam.targetType != globalParam.commonLinkType.hdfs ){
            var res = paramTrans(uploadParam.fromJson, uploadParam.toHiveJson);
            uploadParam.fromJson = res.src;
            uploadParam.toHiveJson = res.tar;
        }
        uploadParam.fromJson = JSON.stringify(uploadParam.fromJson);
        globalParam.targetType == globalParam.commonLinkType.hdfs ? uploadParam['toHdfsJson'] = JSON.stringify(uploadParam['toHdfsJson']) : uploadParam['toHiveJson'] = JSON.stringify(uploadParam['toHiveJson']);
        $.fn.ajaxAPI({
            url: 'job/excel/save',
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
            }
        });
    }).always(function(){
        $('.upload.btn-item').prop('disabled', false);
        $('#waitLoading').css({display:'none'});
    });
});

function paramTrans(sourceParam, tarParam){
    var fileTag = '',
        source = [],
        tar = [],
        curIndex = -1;

    for ( var i= 0, len=sourceParam.length; i<len; i++ ){
        if ( sourceParam[i].fileIndex === fileTag ){
            source[curIndex].sheets.push(sourceParam[i]);
            tar[curIndex][sourceParam[i].index] = tarParam[i];
        }
        else {
            fileTag = sourceParam[i].fileIndex ;
            curIndex = source.length;
            source[curIndex] = {
                srcPath: sourceParam[i].srcPath,
                filePath: sourceParam[i].filePath,
                tableName: sourceParam[i].tableName,
                totalRowSize: sourceParam[i].totalRowSize,
                sheets: [sourceParam[i]]
            };
            tar[curIndex] = {};
            tar[curIndex][sourceParam[i].index] = tarParam[i];
        }
    }

    return {src: source, tar: tar} ;
}
