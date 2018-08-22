var tmpParam = {
        fileList: [],
        curTableList: [],
        curHiveParam: {},
        tmpAppId: '',
        fileIndex: 0,
        connId: 0,
        formDataAjax: {}
    };
    $.extend(globalParam, tmpParam);

    $('body').on('click', 'button.index', function(){
        window.location.href = './';
    });

    getConnect();
    function getConnect(){
        var pid = $('#userApp').val(),
            targetType = globalParam.commonLinkType.hdfs,
            url = 'db/list',
            groups = '';
        targetType == globalParam.commonLinkType.hdfs ? (url = 'hdfs/list') : (groups = 4) ;
        if ( !pid )
		    return ;
        $.fn.ajaxAPI({
            url: url+'?pid='+pid+'&groups='+groups,
            callback: function(data){
                var connHtml = '<option value="" disabled>'+common_js_lang['db.info.selectLink']+'</option>' ;
                targetType == globalParam.commonLinkType.hdfs ? adminConfigData.hdfs.id && (connHtml += '<option value="'+adminConfigData.hdfs.id+'">'+adminConfigData.hdfs.connName+'</option>') : adminConfigData.hive.id && (connHtml += '<option value="'+adminConfigData.hive.id+'">'+adminConfigData.hive.connName+'</option>') ;
                data.model.data.map(function(v){
                    connHtml += '<option value="'+v.id+'">'+v.connName+'</option>' ;
                });
                $('.configTask .connId').html(connHtml).val('').select2();
                globalParam.connId = '';
            }
        })
    }


window.onbeforeunload = function(){
    if ( $('.taskName').val().trim() || $('.taskDes').val().trim() || $('.file-list  tr .progress').length > 0 )
        return common_js_lang['common.info.leavePage'];
    return ;
};
    ///////////////////////////////////   to HDFS
    $('#userApp').change(function(){
        getConnect();
    });

    $('.connId').on('change', function(){
        globalParam.connId = $(this).val() ;
        $('.dirDos .ul').empty();
        getDir('', true);
        $('.file-list .path input').val('').attr('data-dir', '') ;
    });
    // 取 hdfs下级目录
    function getDir(base, isHome){
        if ( !globalParam.connId ){
            MsgTip('', common_js_lang['db.info.selectLink'], 'info');
            return ;
        }
        base = base || '';
        var parentDom = base != ''? $('.dirDos [data-base="'+base+'"] > .ul') : $('.hdfsTab .dirDos > .ul');
        $.fn.ajaxAPI({
            url: isHome && 'hdfs/dir/home' || 'hdfs/dir/list',
            data: {base:base, hid: globalParam.connId, pid:$('#userApp').val()},
            loadTime: base == '' ? 0 : 2000,
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
            },
            complete: function(){
                parentDom.parent().find('.show').removeClass('got');
            }
        });
    }

    // 双击 进入下一层级 或者 收起
    $('.global-hdfsCon').on('click', 'li p .show', function(){
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

    // 单击 选中 路径
    $('.global-hdfsCon').on('click', 'li p .check', function(){
        if ( $(this).hasClass('cur') )
            return ;
        $('.global-hdfsCon li p .check').removeClass('cur');
        $(this).addClass('cur');
        var base = $(this).parents('li').data('base');
        $('.global-hdfsCon .selectedDir').val(base).attr('title', base);
    });

    // hdfs 配置 确认 取消按钮
    $('.global-hdfsCon').on('click', '.btn-cancel, h4 .cancel', function(){
        $('.global-mask, .global-hdfsCon').fadeOut();
        $('.file-list .hdfs.active').removeClass('active');        
    });
    $('.global-hdfsCon').on('click', '.btn-item', function(){
        var dir = $('.global-hdfsCon .selectedDir').val().trim(),
            fileName = $('.global-hdfsCon .fileName').val().trim() ;
        if ( !dir || !fileName ){
            MsgTip('', common_js_lang['local.info.fileDir'], 'info');
            return false;
        }
        if ( fileName.match(/\s+|\\+/g) ){ 
            MsgTip('', common_js_lang['local.info.fileName'], 'info');
            return false;
        }

        fileName = fileName.slice(0,60);
        $.fn.ajaxAPI({
            url: 'hdfs/dir/access',
            data:{hdfsId:globalParam.connId, dir:dir,pid:$('#userApp').val()},
            callback: function(data){
                $('.file-list .hdfs.active').removeClass('active').siblings('input').val( (dir+'/'+fileName).replace(/\/+/g, '\/')).attr('title', (dir+'/'+fileName).replace(/\/+/g, '\/')).attr('data-dir', dir).attr('data-fileName', fileName);
                $('.global-mask, .global-hdfsCon').fadeOut();  
            }
        }); 
    });

    // 进入hdfs配置层
    $('.file-list').on('click', '.hdfs', function(){
        if ( !globalParam.connId ){
            MsgTip('', common_js_lang['db.info.selectLink'], 'info');
            return ;
        }
        $(this).addClass('active');
        var curPath = $(this).siblings('input').attr('data-dir'),
            name = $(this).siblings('input').attr('data-fileName') ;

        name || (name = $(this).parents('tr').find('td').eq(0).text());
        $('.global-hdfsCon p .check').removeClass('cur');
        $('.global-hdfsCon p .show').removeClass('in');        
        $('.global-hdfsCon .ul:not(:first-child)').css({display:'none'});
        $('.global-hdfsCon .selectedDir').val(curPath).attr('title', curPath);
        $('.global-hdfsCon .fileName').val(name);        

        if ( curPath ){
            var target = $('.global-hdfsCon [data-base="'+curPath+'"]');
            if ( target.length == 1 ){
                target.find('> p .check').addClass('cur');
                target.parents('.ul').fadeIn().siblings('p').find('.show').addClass('in');
            }
        }
        $('.global-mask, .global-hdfsCon').fadeIn();
    });


   
    $('.file-btn').on('change', '#fileupload', function(e){
        var file = $(this)[0].files ? $(this)[0].files : {name:$(this).val().split('\\').slice(-1)[0]};

        for ( var i=0,len=file.length; i<len; i++ ){
            if ( $('.file-list tbody tr').length >= 5 ){
                MsgTip('', common_js_lang['dump.info.limit5'], 'info');
                break ;
            }
            if ( file[i].name && file[i].name.length > 60 ){
                swal('', common_js_lang['s3.info.fileName100'], 'info');
                continue ;
            }

	        globalParam.fileList.push(file[i]);
            var indexTag = listFile(file[i]);                
            var formData = new FormData();
            formData.append('file', file[i]);
            globalParam.formDataAjax[indexTag] = $.ajax({
                url: 'job/local/file/upload',
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
                    // 解析完成
                    $('.file-list .'+this.class).addClass('uploaded').attr('data-name', data.model.path);
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
            path = '<td class="progress"><span class="process-sliderCon"><div class="process-slider" style="width:0;"></div></span><span class="process-res"></span></td>',
            res = '<td class="res">'+common_js_lang['local.info.uping']+'</td>' ;
        var act = '<td class="path"><input type="text" placeholder="'+common_js_lang['local.option.getDir']+'" disabled><button class="hdfs" >'+common_js_lang['local.option.config']+'</button><button class="del">'+common_js_lang['clientList.option.del']+'</button></td>';
        if ( file.size >= 0 ){
            size = '<td>'+convertFileSize(file.size)+'</td>';                
        }
        globalParam.fileIndex ++ ;
        $('.configFilePath .file-list .tableNoData').parent().remove();
        $('.configFilePath .file-list tbody').append('<tr class="f'+globalParam.fileIndex+'"><td title="'+file.name+'">'+file.name+'</td>'+size+path+res+act+'</tr>');
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

    // 删除文件
    $('.file-list').on('click', '.del', function(){
        var self = $(this);
        swal({
            title: '',
            text: common_js_lang['local.info.delFile'],
            type: 'info',
            showCancelButton: true
        }, function(){
            var index = self.parents('tr').index();
            var tag = self.parents('tr').attr('class');
            self.parents('tr').remove();
            if ( $('.configFilePath tbody tr').length <= 0 ){
                $('.configFilePath tbody').append('<tr class="trNoData"><td colspan="5" class="tableNoData"><img src="resources/dist/images/noData.png">'+common_js_lang['manage.title.noData']+'</td></tr>');
            }
            globalParam.fileList.splice(index, 1); //删除列表及数据
            if ( tag.indexOf('uploaded') == -1 ) {
                swal.close();
                globalParam.formDataAjax[tag].abort();
            }
        });
    });

    // 上传
    $('button.upload').on('click', function(){
        var taskName = $('.configTask .taskName').val().trim();
        if ( !taskName ){
            MsgTip('', common_js_lang['local.info.taskNameNone'], 'info');
            return false;
        }
        var taskDes =  $('.configTask .taskDes').val().trim();
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

        var fileInfo = $('.file-list tbody tr:not(".trNoData")');
        if ( fileInfo.length <= 0 ){
            MsgTip('', common_js_lang['local.info.fileNone'], 'info');
            return ;
        }
        for ( var i=0,len=fileInfo.length; i<len; i++ ){
            if ( !fileInfo.eq(i).hasClass('uploaded') ){
                MsgTip('', common_js_lang['local.info.upUncomplete'].replace(/\[x\]/g, '['+(i+1)+']'), 'info');
                return false;
            }
        }

        var paths = $('.file-list td.path'),
            len = paths.length,
            paramArr = {jobName:taskName, note:taskDes, pid:pid, toId:globalParam.connId, toType:8, fromJson:[], toHdfsJson: []},
            type = 1,
            url = 'job/local/save';   

        for ( var i=0; i<len; i++ ){
            if ( type == 1 ){
                var dir = paths.eq(i).find('input').val();
                if ( !dir ){
                    MsgTip('', common_js_lang['local.info.hdfsParam'].replace(/\[x\]/, '['+(i+1)+']'), 'info');
                    return ;
                }
                paramArr.toHdfsJson.push({fileName: dir, hid:globalParam.connId});
                paramArr.fromJson.push(paths.eq(i).parent().data('name'));
            }
            else {
                var temp = {};                            
                temp['dbName'] = paths.eq(i).find('.dbName').val();
                temp['tblName'] = paths.eq(i).find('.tblName').val();
                if ( !temp['dbName'] || !temp['tblName'] ){
                    MsgTip('', common_js_lang['local.info.hiveParam'], 'info');
                    return ;
                }
                var parts = paths.eq(i).find('.tblName').attr('data-parts') || '{}';                
                                
                var sql = paths.eq(i).find('.tblName').attr('data-sql');
                sql && (temp['sql'] = sql);

                paramArr.param.push(temp);
                paramArr.parts.push(parts);
            }
        }

       paramArr.fromJson = JSON.stringify(paramArr.fromJson);
       paramArr.toHdfsJson = JSON.stringify(paramArr.toHdfsJson);
       
       var self = $(this);
       self.prop('disbaled', true);
        $.fn.ajaxAPI({
            url: url,
            type:'post',
            data: paramArr,
            contentType: 'application/x-www-form-urlencoded',            
            callback: function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                window.onbeforeunload = function(){return} ;
                location.href = "./success";
            },
            complete: function(data){
                self.prop('disbaled', false);                
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
    });