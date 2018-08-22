$(function(){
    Array.prototype.distinct = function () {
        for (var b = 0, f = this.length, a, c, d = {}, e = []; b < f; b++) a = this[b], c = typeof a, "undefined" == typeof d[a + c] && (d[a + c] = 1, e.push(a));
        return e
    };

    function getDB(){
        $.ajax({
            url: 'hive/dbs',
            success: function(data){
                if(data.data.length == 0){
                    $("#dbName, #tableName, #partitions").html('').addClass('error').select2();
                    swal('ERROR', '未查询到database!', 'error');
                    return false;
                }

                //填充db信息
                var dbList = '';
                data.data.map(function(v){
                    dbList += '<option>'+v.dbName+'</option>';
                });
                $("#dbName").html(dbList).removeClass('error').select2();
                globalAppName = $('#apps').val();    //更新appName
                getTables(data.data[0].dbName);
            },
            error: function(){
                swal('ERROR', 'Ajax get data fail', 'error');
            }
        })
    }
    
    // 选择表
    // 当obj不为falsy时，是切换tab的填充操作
    function getTables(dbName, obj){
        $.ajax({
            url: 'hive/tbls',
            data: {dbName: dbName},
            success: function(data){
                if(data.data.length == 0){
                    $("#tableName, #partitions").html('').addClass('error').select2();
                    swal('ERROR', '未查询到table信息!', 'error');   
                    return false;
                }
                
                var tableList = '';
                data.data.map(function(v){
                    tableList += '<option>'+v.tblName+'</option>';
                });
                $("#tableName").html(tableList).removeClass('error').select2();

                if ( obj ){
                    $('#tableName').val(obj['tblName']);  //填充tblName
                    getPart(obj['tblName'], obj);         //传入data到getPart
                }
                else
                    getPart(data.data[0].tblName);
            },
            error: function(){
                swal('ERROR', 'Ajax get data fail', 'error');
            }
        })
    }
    
    // 选择分区
    // 存在传入的obj时，执行填充操作
    function getPart(tblName, obj){
        $.ajax({
            url: 'hive/partitions',
            data: {dbName: $('#dbName').val(), tblName: tblName},
            success: function(data){
                if(data.data.cols.length == 0){
                    $('.dest .infoline').eq(2).addClass('hidden');
                    $('#partitions').html('');
                }
                else{
                    $('.dest .infoline').eq(2).removeClass('hidden');

                    if(data.data.vals.length > 0){
                        
                        var _data = [];
                        var _selData = {};

                        $.each(data.data.vals, function(k, v){
                            var _item = [];
                            var _d = v.split('/');
                            $.each(_d, function(key, val){
                                _item.push(val.split('=')[1]);
                            })
                            _data.push(_item);
                        })
                        
                        var _html = '';
                        $.each(data.data.cols, function(k, v){
                            _html += '<div class="item">'
                                        +'<input type="text" class="filedName" value="'+v+'" disabled>'
                                        +'<label>=</label>'
                                        +'<select class="select2 filedVal selVal" data-type="'+v+'" id="Part_level_'+ k +'"></select>'
                                    +'</div>'
                        })
                        
                        $('#partitions').html(_html);
                        
                        var _selData = [];
                        function getNextData(data, level, sel){
                            var _result = [];
                            $.each(data, function(k, v){
                                var _has = true;
                                for(var i = 0; i < level; i++){
                                    if(v[i] != _selData[i]){
                                        _has = false;
                                        break;
                                    }
                                }
                                if(_has){
                                    _result.push(v[level]);
                                }
                            })
                            _result = _result.distinct();
                            _selData[level] = _result[0];
                            return _result;
                        }
                        
                        $.each(data.data.cols, function(k, v){
                            $('#Part_level_' + k).html('').data('level', k).select2({
                                placeholder: "value",
                                data: getNextData(_data, k, _selData[k]),
                                tags: true,
                                searchPlaceholder: 'search or input new'
                            })
                            
                            $('#Part_level_' + k).change(function(){
                                _selData[k] = $('#Part_level_' + k).val();
                                
                                for(var i = k; i < data.data.cols.length; i++){
                                    $('#Part_level_' + (i+1)).html('').select2({
                                        placeholder: "value",
                                        data: getNextData(_data, i+1),
                                        tags: true,
                                        searchPlaceholder: 'search or input new'
                                    })
                                }
                            })
                        })
                    }
                    else{
                        var _html = '';
                        $.each(data.data.cols, function(k, v){
                            _html += '<div class="item"><input type="text" class="filedName" value="'+v+'" disabled>'
                                        +'<label>=</label>'
                                    +'<input type="text" class="filedVal" value="value" data-type="'+v+'"></div>'
                        });
                        
                        $('#partitions').html(_html);
                    }

                    if (  obj ){    //填充操作
                        partitions = $('#partitions .item .filedVal') || $('#partitions .item select');
                        for (var i=0, length=partitions.length; i<length; i++){
                            partitions.eq(i).val(obj['partitions'][i]['value']);
                        }
                    }
                }
            },
            error: function(){
                swal('ERROR', 'Ajax get data fail', 'error');
            }
        })
    }
    
    // 事件绑定
    function bindEvent(){

        // 项目配置 tab 切换
        $('.tab-con').on('click', '.nav input', function(){
            if ( $(this).parent().hasClass('cur') )
                return false;
            $(this).parent().addClass('cur').siblings().removeClass('cur');
            $(this).parents('.tab-con').find('.tab').toggle();
        });
        
        $("#dbName").on("change", function(data, container) {
            getTables($("#dbName").val());
        });
        
        $("#tableName").on("change", function(data, container) {
            getPart($("#tableName").val());
        });


        //切换任务tab
        $('section.task-tab').on('click', '.task:not(.cur)', function(){
            var data = checkTaskTab();
            if ( !data ){
                return false;
            }
            //update 或 insert 当前任务的数据
            globalTasks[+$('section.task-tab .task.cur').attr('data-index')] = data;

            var index = +$(this).attr('data-index');
            $(this).addClass('cur').siblings().removeClass('cur');
            changeTask(index);
        });

        //切换任务 并填充数据
        function changeTask(index){
            var data = globalTasks[index];
            if ( data['type'] === 'toHdfs' ){  //file 数据填充
                tabToggle(0);
                $('section.dest .file-info input').val(data['hdfsDir']);
            }
            else{                // db 数据
                tabToggle(1);
                $('#dbName').val(data['dbName']);
                data['overwrite'] && $('#OVERRIDE').prop('checked', true) || $('#APPEND').prop('checked', true);
                getTables(data['dbName'], data);  //填充table part数据
            }
            //填充客户机信息
            fillCustomData(data);
        }

        function fillCustomData(data){
            $('section.custom-info #localFolder').val(data['monitorDir']);
            $('section.custom-info #backupFolder').val(data['moveDir']);
        }

        // 新增任务
        $('section.task-tab').on('click', '.add', function(){
            var data = checkTaskTab();
            if ( !data ){
                swal('WARNING', '当前任务请填写完整!', 'warning');
                return false;
            }
            globalTasks[+$('section.task-tab .task.cur').attr('data-index')] = data;

            globalTaskAmount ++ ;
            newTab();
        });

         function tabToggle(index){
            $('.dest').find('.nav label').eq(index).addClass('cur').siblings().removeClass('cur');
            $('.dest .tab').eq(index).css({display:'block'}).siblings('.tab').css({display:'none'});
        }
        function newTab(){
           $('section.task-tab .task').removeClass('cur');
           $('section.task-tab').prepend('<div class="task cur" data-index="'+globalTabIndex+'">task-'+(++globalTabIndex)+'<i class="task-del">×</i></div>');
           tabToggle(0);
           $('.dest .file-info input, .custom-info input').val('');
        }

        $('.tab').on('blur', 'input[type="text"]', function(){
            var _val = $(this).val().trim();
            if ( _val === '' ){
                $(this).addClass('error');
                return false;
            }
            
            $(this).removeClass('error');
        });

        // 检查当前tab的必要数据是否填充
        function checkTaskTab(){
            var taskTab = $('.upload-main > .tab'),
                tabData = {},
                index = taskTab.find('.dest .nav label.cur').index();

            if (  index == 0 ){
                var hdfsDir = taskTab.find('section.dest #hdfs').val().trim(),
                    type = 'toHdfs';

                if ( hdfsDir === '' ){
                    taskTab.find('section.dest .file-info input').addClass('error');
                    return false;
                }
                tabData['hdfsDir'] = hdfsDir;
                tabData['type'] = type;
            }
            else{
                var dbName = taskTab.find('#dbName').val().trim(),
                    type = 'toHive',
                    partitions = $('#partitions .item .filedVal') || $('#partitions .item select');
                    overwrite = Boolean(+taskTab.find('.upload-way input:checked').attr('data-checked')),
                    tblName = taskTab.find('#tableName').val().trim();

                if ( dbName === '' || tblName === '' ){
                    swal('ERROR', 'Database info is not complete!', 'error');
                    return false;
                }

                tabData['partitions'] = [];
                for (var i=0, length=partitions.length; i<length; i++){
                    var temp = {};
                    temp['value'] = partitions.eq(i).val().trim();
                    if ( !temp['value'] ){
                        $('#partitions .item .filedVal').eq(i).addClass('error');
                        return false;
                    }
                    temp['field'] = partitions.eq(i).attr('data-type');
                    tabData['partitions'].push(temp);
                }
                tabData['dbName'] = dbName;
                tabData['tblName'] = tblName;
                tabData['overwrite'] = overwrite;
            }

            var monitorDir = taskTab.find('section.custom-info #localFolder').val().trim(),
                moveDir = taskTab.find('section.custom-info #backupFolder').val().trim();

            if ( monitorDir === '' ){
                taskTab.find('section.custom-info #localFolder').addClass('error');
                return false;
            }
            if ( moveDir === '' ){
                taskTab.find('section.custom-info #backupFolder').addClass('error');
                return false;
            }

            tabData['monitorDir'] = monitorDir;
            tabData['moveDir'] = moveDir;
            tabData['type'] = type;
            return tabData;
        }

        //删除任务功能
        $('section.task-tab').on('click', '.task .task-del', function(e){
            if ( globalTaskAmount <= 1 ){
                swal('WARNING', 'Please keep at least one task!', 'warning');
                return false;
            }

            var index = $(this).parent().attr('data-index') || '';
            swal({  title: "确定要删除这项任务吗 ?",   
                type: "warning",   
                showCancelButton: true,   
                closeOnConfirm: true 
                }, 
                function(){
                    taskDel(index);
                }
            );
        });

        function taskDel(index){
            delete globalTasks[index];
            var taskTab = $('section.task-tab .task[data-index="'+index+'"]');
            taskTab.fadeOut();

            if (  taskTab.hasClass('cur') ){
                for ( var i=globalTasks.length-1; i>=0; i-- ){
                    if ( globalTasks[i] ){
                        $('section.task-tab .task[data-index="'+i+'"]').addClass('cur');
                        changeTask(i);
                        break;
                    }
                }
            }
            globalTaskAmount--;
        }

        //下载
        var downClick = false;
        $('section.user-act').on('click', '.download', function(){
            if ( downClick ){
                return false;
            }
            downClick = true;

            var data = checkTaskTab();
            if ( !data ){
                downClick = false;
                return false;
            }
            globalTasks[+$('section.task-tab .task.cur').attr('data-index')] = data;
            globalSendData['fileMustMatch'] = $('#filePattern').val() || '.+\\.sink';
            globalSendData['ignoreLastModifyFile'] = Boolean(+$('section.app input:checked').attr('data-checked'));
            globalSendData['tasks'] = globalTasks.filter(function(v){ return v !== 'undefined'});
            
            // location.href = "./client/download?appName="+globalAppName+"&data="+JSON.stringify(globalSendData);
            post('client/download', {data:JSON.stringify(globalSendData)});
            downClick = false;
        });
    }
   function post(URL, PARAMS) { 
       var temp = document.createElement("form"); 
       temp.action = URL; 
       temp.method = "post"; 
       temp.style.display = "none"; 
       for (var x in PARAMS) { 
           var opt = document.createElement("textarea"); 
           opt.name = x; 
           opt.value = PARAMS[x]; 
           temp.appendChild(opt); 
        } 
        document.body.appendChild(temp); 
        temp.submit(); 
        return temp; 
    } 
    
    function init(){
        getDB();
        bindEvent();
    }
    
    var globalTasks = [],
        globalSendData = {},
        globalTaskAmount = 1,
        globalAppName = '',
        globalTabIndex = 1;

    init();
});

