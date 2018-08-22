/**
 * Created by Administrator on 2017/12/5.
 */

var vm = new Vue({
    el: '.mainCon',
    data: {
        isLoading: true,
        loading: false,
        noData: '<img class="noData" src="resources/dist/images/noData.png">'+common_js_lang['manage.title.noData'],
        projectList: common_project,
        pid: '',
        transColumn: [
            {
                title: common_js_lang['manage.title.taskId'],
                key: 'jobId',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.jobId,placement:'top'}}, params.row.jobId)
                }
            },
            {
                title: common_js_lang['dbManage.text.taskName'],
                key: 'jobName',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.jobName,placement:'top'}}, params.row.jobName)
                }
            },
            {
                title: common_js_lang['manage.title.inApp'],
                key: 'projectName',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.projectName,placement:'top'}}, params.row.projectName)
                }
            },
            {
                title: common_js_lang['common.option.alarmSetting'],
                key: 'alarmRule',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: [common_js_lang['rule.option.taskFail'], '', common_js_lang['rule.option.clientOff']][+params.row.alarmRule],placement:'top'}}, [common_js_lang['rule.option.taskFail'], '', common_js_lang['rule.option.clientOff']][+params.row.alarmRule])
                }
            },
            {
                title: common_js_lang['rule.option.alarmUser'],
                key: 'notifyUser',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.notifyUser,placement:'top'}}, params.row.notifyUser)
                }
            },
            {
                title: common_js_lang['rule.option.status'],
                key: 'status',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: [common_js_lang['rule.option.disable'], common_js_lang['rule.option.enable']][+params.row.status],placement:'top'}, class:'s'+params.row.status}, [common_js_lang['rule.option.disable'], common_js_lang['rule.option.enable']][+params.row.status])
                }
            },
            {
                title: common_js_lang['clientList.option.oper'],
                key: 'act',
                width:145,
                className: 'act',
                ellipsis: true,
                render: function(h, params){
                    return h('div',[
                        h('Tooltip',{props:{content:common_js_lang['rule.act.alarmRecord'],placement:'top'}},[
                            h('a', {
                                class: 'log',
                                on: {
                                    click: function () {
                                        vm.record(params.row.id)
                                    }
                                }
                            })
                        ]),
                        h('Tooltip',{props:{content:common_js_lang['rule.act.editRule'],placement:'top'}},[
                            h('a', {
                                class: 'edit',
                                on: {
                                    click: function () {
                                        vm.edit(params.row)
                                    }
                                }
                            })
                        ]),
                        h('Tooltip',{props:{content:params.row.status == 1 ? common_js_lang['rule.option.disable']: common_js_lang['rule.option.enable'],placement:'top'}},[
                            h('a', {
                                class: params.row.status == 1 ? 'disable' : 'enable',
                                on: {
                                    click: function () {
                                        vm.toggleStatus(params.row)
                                    }
                                }
                            })
                        ]),
                        h('Tooltip',{props:{content:common_js_lang['clientList.option.del'],placement:'top'}},[
                            h('a', {
                                class: 'del',
                                on: {
                                    click: function () {
                                        vm.delete(params.row.id)
                                    }
                                }
                            })
                        ])
                    ]);
                }
            }
        ],
        clientColumn: [
            {
                title: common_js_lang['rule.option.ruleType'],
                key: 'alarmType',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: [common_js_lang['alarm.option.clientTask'], common_js_lang['alarm.option.clientStatus']][+params.row.alarmType],placement:'top'}}, [common_js_lang['alarm.option.clientTask'], common_js_lang['alarm.option.clientStatus']][+params.row.alarmType])
                }
            },
            {
                title: common_js_lang['clientList.option.clientName'],
                key: 'clientName',
                ellipsis: true,
                width: 120,
                render: function(h, params){
                    return h('Tooltip',{props:{content: vm.getClientNameById(params.row.clientId),placement:'top'}}, vm.getClientNameById(params.row.clientId))
                }
            },
            {
                title: common_js_lang['manage.title.inApp'],
                key: 'projectName',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.projectName,placement:'top'}}, params.row.projectName)
                }
            },
            {
                title: common_js_lang['manage.title.taskId'],
                key: 'jobId',
                width: 80,
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.jobId,placement:'top'}}, params.row.jobId)
                }
            },
            {
                title: common_js_lang['common.option.alarmSetting'],
                key: 'alarmRule',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: [common_js_lang['rule.option.taskFail'], '', common_js_lang['rule.option.clientOff']][+params.row.alarmRule],placement:'top'}}, [common_js_lang['rule.option.taskFail'], '', common_js_lang['rule.option.clientOff']][+params.row.alarmRule])
                }
            },
            {
                title: common_js_lang['rule.option.alarmUser'],
                key: 'notifyUser',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.notifyUser,placement:'top'}}, params.row.notifyUser)
                }
            },
            {
                title: common_js_lang['rule.option.status'],
                key: 'status',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: [common_js_lang['rule.option.disable'], common_js_lang['rule.option.enable']][+params.row.status],placement:'top'}, class:'s'+params.row.status}, [common_js_lang['rule.option.disable'], common_js_lang['rule.option.enable']][+params.row.status])
                }
            },
            {
                title: common_js_lang['clientList.option.oper'],
                key: 'act',
                width:145,
                className: 'act',
                ellipsis: true,
                render: function(h, params){
                    return h('div',[
                        h('Tooltip',{props:{content:common_js_lang['rule.act.alarmRecord'],placement:'top'}},[
                            h('a', {
                                class: 'log',
                                on: {
                                    click: function () {
                                        vm.record(params.row.id)
                                    }
                                }
                            })
                        ]),
                        h('Tooltip',{props:{content:common_js_lang['rule.act.editRule'],placement:'top'}},[
                            h('a', {
                                class: 'edit',
                                on: {
                                    click: function () {
                                        vm.edit(params.row)
                                    }
                                }
                            })
                        ]),
                        h('Tooltip',{props:{content:params.row.status == 1 ? common_js_lang['rule.option.disable']: common_js_lang['rule.option.enable'],placement:'top'}},[
                            h('a', {
                                class: params.row.status == 1 ? 'disable' : 'enable',
                                on: {
                                    click: function () {
                                        vm.toggleStatus(params.row)
                                    }
                                }
                            })
                        ]),
                        h('Tooltip',{props:{content:common_js_lang['clientList.option.del'],placement:'top'}},[
                            h('a', {
                                class: 'del',
                                on: {
                                    click: function () {
                                        vm.delete(params.row.id)
                                    }
                                }
                            })
                        ])
                    ]);
                }
            }
        ],
        transList: [
        ],
        clientList: [
        ],
        transParam: {jobType:0, pageNo: 1, pageSize:10},
        clientParam: {jobType:1, pageNo: 1, pageSize:10},
        transPager: {total:0, current:0},
        clientPager: {total:0,current:0},

        transType: '1',    //迁移查询方式
        transWord: '',     //查询关键字
        clientType: '2',   //客户端查询类型
        activeName: '0',   //当前活动列表类型
        clientListGot: false,  //客户端列表是否取过
        transListGot: false,

        listTab: 1,      //展示tab，1为列表，否则为规则设置页面
        jobCycle: '',    //报警频率
        alarmCycle: '0', //报警周期
        alarmType: '1', //客户端报警类型

        clientArr: [],        //客户端arr
        clientId: '',         //当前客户端id

        transJob: {},         //缓存 pid 下 的job List
        clientJob: {},        //缓存 job list
        currentJobObj: {},   //当前pid下jobId list
        curJob: '',          //选中的jobId
        jobDetail: '',
        alarmTemplate: '',  //报警模板
        alarmRule: '0',     //报警的规则类型
        notifyUser: '',    //联系人

        editMode: false,   //编辑状态
        editId: 0,        //编辑规则的ID
        editData: {}      //编辑的规则数据
    },
    created: function() {
        var list = this.projectList;
        for ( var k in list ) {
            this.pid = k;
            break;
        }
        this.getTransList();
    },
    methods: {
        typeChange: function(){
            this.transWord = '';
        },
        pidChange: function(){
            if ( this.editMode )  return ;     // 编辑模式下不处理

            this.jobDetail = '';
            if (this.activeName == '0') {
                this.getTransJob();
            }
            else {
                this.getClientJob();
            }
        },
        jobChange: function(id){
            id = id || 0;
            if ( id <= 0 ) return ;
            var info = this.activeName == '0' ? this.transJob[this.pid][id] : this.clientJob[this.pid][id] ;
            this.jobDetail = common_js_lang['dbManage.text.taskName']+': '+info.jobName+'\n'+common_js_lang['rule.text.taskDes']+': '+(info.note || '');
            this.getAlarmDesc();
        },
        getJob: function(type, jobId){
            jobId = jobId || '';
            var _this = this;
            _this.loading = true;
            $.get('job/list?pid='+this.pid).then(function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                _this.transJob[_this.pid] = {};
                _this.clientJob[_this.pid] = {};

                data.model.data.map(function(v) {
                    if (v.groupNo == 3)
                        _this.clientJob[_this.pid][v.id] = v;
                    else
                        _this.transJob[_this.pid][v.id] = v;
                });

                _this.currentJobObj = type != 2 ?
                    _this.transJob[_this.pid] :
                    _this.clientFilter( _this.clientJob[_this.pid] ) ;

                if ( _this.editMode ) {  //编辑模式下， nextTick 填充jobId
                    _this.$nextTick(function () {_this.curJob = jobId; _this.$nextTick(function(){_this.editMode = false});});
                }
                else {       // 新建模式下
                    _this.curJob = jobId;
                    _this.getAlarmDesc();
                }
            }).always(function(){;
                _this.loading = false;
            });
        },
        clientFilter: function(data){
            var obj = {};
            for ( var k in data ){
                if ( data[k].fromId == this.clientId ){
                    obj[k] = data[k] ;
                }
            }
            return obj;
        },
        getTransJob: function(jobId){
            jobId = jobId || '';
            var _this = this;
            if ( _this.transJob[_this.pid] ) {
                _this.currentJobObj = _this.transJob[_this.pid];
                if ( this.editMode ) {   //编辑模式
                    _this.$nextTick(function () {_this.curJob = jobId; _this.$nextTick(function (){_this.editMode = false;});});
                }
                else {     //新建模式
                    _this.curJob = jobId;
                    _this.getAlarmDesc();
                }
            }
            else
                _this.getJob(1, jobId);
        },
        getClientJob: function(jobId){
            jobId = jobId || '';
            var _this = this;
            if ( _this.transJob[_this.pid] ) {
                _this.currentJobObj = _this.clientFilter( _this.clientJob[_this.pid] ) ;
                if ( this.editMode )
                    _this.$nextTick(function () {_this.curJob = jobId; _this.$nextTick(function (){_this.editMode = false;});});
                else {
                    _this.curJob = jobId;
                    _this.getAlarmDesc();
                }
                return ;
            }
            _this.getJob(2, jobId);
        },
        clientChange: function(){
            var _this = this;
            _this.currentJobObj = _this.clientFilter( _this.clientJob[_this.pid] ) ;
            _this.getAlarmDesc();
        },
        getRuleList: function(param){
            return $.get('alarm/rule/list', param)
        },
        listChange: function(name){
            this.activeName = name;
            if ( name == '1' && !this.clientListGot ) {
                var _this = this;
                if ( _this.clientArr.length > 0 ){
                    this.getClientList();
                    return ;
                }

                $.get('online/client/list').then(function(data){
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }
                    _this.clientArr = data.model.data ;
                    _this.getClientList();
                });
            }
        },
        getTransList: function(){
            var _this = this;
            this.isLoading = true;
            this.getRuleList(this.transParam).then(function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                _this.transListGot = true;

                if ( data.model.totalCount && data.model.data.length == 0 ){
                    _this.transParam.pageNo -= 1;
                    _this.getTransList();
                    return ;
                }
                _this.transList = data.model.data;
                _this.transPager.total = data.model.totalCount || 0;
                _this.transPager.current = data.model.currentPage || 0;
            }).always(function(){
                _this.isLoading = false;
            });
        },
        getClientList: function(){
            var _this = this;
            this.isLoading = true;
            this.getRuleList(this.clientParam).then(function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                _this.clientListGot = true;

                if ( data.model.totalCount && data.model.data.length == 0 ){
                    _this.clientParam.pageNo -= 1;
                    _this.getClientList();
                    return ;
                }
                _this.clientList = data.model.data;
                _this.clientPager.total = data.model.totalCount || 0 ;
                _this.clientPager.current = data.model.currentPage || 0;
            }).always(function(){
                _this.isLoading = false;
            });
        },
        transSearch: function(){
            if ( this.transWord.trim() == '' ){
                delete this.transParam.jobName;
                delete this.transParam.jobId;
            }
            else if ( this.transType == '1' ){
                if ( !this.transWord.trim().match(/^\d+$/) ){
                    MsgTip('', common_js_lang['manage.info.taskIdInfo']);
                    return ;
                }
                delete this.transParam.jobName;
                this.transWord = +this.transWord.trim();
                this.transParam.jobId = this.transWord;
            }
            else {
                delete this.transParam.jobId;
                this.transParam.jobName = this.transWord.trim();
            }

            this.transParam.pageNo = 1;
            this.getTransList();
        },
        clientTypeChange: function(){
            if ( this.clientType == '2' )
                delete this.clientParam.alarmType;
            else
                this.clientParam.alarmType = this.clientType;

            this.clientParam.pageNo = 1;
            this.getClientList();
        },
        pagerChange: function(page){
            if ( this.activeName == '0' ){
                this.transParam.pageNo = page;
                this.getTransList();
            }
            else {
                this.clientParam.pageNo = page ;
                this.getClientList();
            }
        },
        record: function(id){
            location.href = './alarm.record?id='+id+'&activeName='+this.activeName ;
        },
        edit: function(data){
            this.editId = data.id;
            this.editData = data ;
            this.editMode = true ;

            this.activeName == '1' && data.alarmType == '1' ? this.alarmRule = '2' : this.alarmRule = '0' ;
            var _this = this;

            if ( this.activeName == '0' ) {
                this.pid = data.pid+'';
                this.jobCycle = data.jobCycle;
                this.alarmCycle = data.alarmCycle+'';
                this.alarmTemplate = data.alarmTemplate;
                this.notifyUser = data.notifyUser;
                _this.getTransJob(data.jobId);
            }
            else {
                this.jobCycle = data.jobCycle;
                this.alarmCycle = data.alarmCycle+'';
                this.alarmTemplate = data.alarmTemplate;
                this.notifyUser = data.notifyUser;
                this.clientId = data.clientId ;
                this.alarmType = data.alarmType;
                if ( data.alarmType == '1' ){
                    this.getClientJob();
                }
                else {
                    this.pid = data.pid+'';
                    this.getClientJob(data.jobId);
                }
            }
            this.listTab = 0;
        },
        toggleStatus: function(data){
            var _this = this;
            _this.isLoading = true;
            var _data = data,
                url = ['alarm/rule/enable', 'alarm/rule/disable'][+data.status],
                param = {id: data.id} ;

            $.post(url, param).then(function(data){
                if (data.code != 200) {
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return;
                }
                MsgTip('success', [common_js_lang['rule.option.enableSuc'], common_js_lang['rule.option.disableSuc']][+_data.status]);
                _this.activeName == '0' ? _this.getTransList() : _this.getClientList() ;
            }).always(function(){
                _this.isLoading = false;
            })
        },
        delete: function(id){
            var _this = this;
            swal({
                title: '',
                text: common_js_lang['rule.tip.deleteRule'],
                type: 'info',
                showCancelButton: true
            }, function(){
                _this.isLoading = true;
                $.post('alarm/rule/delete', {id:id}).then(function(data){
                    if (data.code != 200) {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return;
                    }
                    MsgTip('success', common_js_lang['manage.info.delSucc']);
                    _this.activeName == '0' ? _this.getTransList() : _this.getClientList() ;
                }).always(function(){
                    _this.isLoading = false;
                })
            });
        },
        addRule: function(){
            this.listTab = 0;
            this.editId = 0;
            if ( !this.curJob )
                this.pidChange();
            this.activeName == '1' && this.alarmType == '1' ? this.alarmRule = '2' : this.alarmRule = '0' ;
        },
        addRuleCancel: function(){
            this.listTab = 1;

            this.clientId = '';
            this.curJob = '';
            this.jobDetail = '';
            this.jobCycle = '';
            this.alarmTemplate = '';
            this.notifyUser = '';
        },
        saveRule: function(){
            var param = {notifyType:0, status:0};

            if ( this.editId ) {  //编辑状态下
                param.id = this.editId;
                param.status = this.editData.status ;
            }

            if ( this.activeName == '0' ) {
                param.jobType = 0;
                param.pid = this.pid;
                param.jobId = this.curJob || '';
                param.alarmRule = 0;
                param.jobCycle = this.jobCycle;
                param.alarmCycle = this.alarmCycle;
                param.alarmTemplate = this.alarmTemplate.trim();
                param.notifyUser = this.notifyUser.trim();
                if ( (parseInt(param.jobId) || 0) <= 0 ){
                    MsgTip('info', common_js_lang['rule.tip.jobIdErr']);
                    return ;
                }
                if ( !param.jobCycle ){
                    MsgTip('info', common_js_lang['rule.tip.jobCycleErr']);
                    return ;
                }
            }
            else {
                param.jobType = 1;
                param.clientId = this.clientId ;
                param.alarmCycle = this.alarmCycle;
                param.alarmTemplate = this.alarmTemplate.trim();
                param.notifyUser = this.notifyUser.trim();
                if ( !param.clientId ){
                    MsgTip('info', common_js_lang['rule.tip.clientIdErr']);
                    return ;
                }

                if ( this.alarmType == '1' ){
                    param.pid = 0;
                    param.alarmType = 1 ;
                    param.alarmRule = this.alarmRule;
                }
                else {
                    param.pid = this.pid;
                    param.jobId = this.curJob;
                    param.alarmType = 0 ;
                    param.alarmRule = 0;
                    param.jobCycle = this.jobCycle;

                    if ( (parseInt(param.jobId) || 0) <= 0 ){
                        MsgTip('info', common_js_lang['rule.tip.jobIdErr']);
                        return ;
                    }
                    if ( !param.jobCycle ){
                        MsgTip('info', common_js_lang['rule.tip.jobCycleErr']);
                        return ;
                    }
                }
            }

            if ( !param.alarmTemplate ){
                MsgTip('info', common_js_lang['rule.tip.alarmTemplateErr']);
                return ;
            }

            var users = param.notifyUser.split(','),
                userArr = [] ;
            for ( var i= 0,len=users.length; i<len; i++ ){
                if ( !users[i].trim().match(/^1\d{10}$/) ){
                    MsgTip('info', common_js_lang['rule.tip.notifyUserErr']);
                    return ;
                }
                userArr.push( users[i].trim() ) ;
            }
            param.notifyUser = userArr.join(',');

            var _this = this;
            _this.loading = true;
            $.when( _this.offlineCheck(param)).then( function() {
                $.post('alarm/rule/save', param).then(function (data) {
                    if (data.code != 200) {
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return;
                    }
                    MsgTip('success', param.id ? common_js_lang['dbManage.info.updateSucc'] : common_js_lang['dbManage.info.addSucc']);
                    _this.activeName == '0' ? _this.getTransList() : _this.getClientList();
                    _this.addRuleCancel();
                }).always(function () {
                    _this.loading = false;
                });
            }).fail(function(data){
                _this.loading = false;
            });
        },
        offlineCheck: function(param){
            var defer = $.Deferred();
            if ( param.alarmType != '1' ) {
                defer.resolve();
                return defer.promise();
            }

            var _this = this;
            $.get('alarm/rule/list', {alarmType:param.alarmType, clientId:param.clientId, jobType:1})
                .then(function(data){
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        defer.reject();
                        return ;
                    }
                    var len = data.model.data.length;
                    if ( len == 0 || len == 1 && data.model.data[0].id == _this.editId )
                        defer.resolve();
                    else {
                        MsgTip('info', common_js_lang['rule.tip.offlineCheck']);
                        defer.reject();
                    }
                }).fail(function(data){
                    defer.reject();
                });
            return defer.promise();
        },
        getAlarmDesc: function(){
            if ( this.editMode )    return ;    // editMode下不处理

            if ( this.activeName == '0' ){
                if ( !this.curJob || (parseInt(this.jobCycle) || 0) <= 0 ){
                    this.alarmTemplate = '';
                    return ;
                }
                var jobCycle = parseInt(this.jobCycle) ;
                var jobName = this.transJob[this.pid][this.curJob].jobName;
                this.alarmTemplate = common_js_lang['rule.text.template1']
                                    .replace(/\[x\]/, '['+this.projectList[this.pid].name+']')
                                    .replace(/\[yz\]/, '['+this.curJob+': '+jobName+']')
                                    .replace(/\[n\]/, '['+jobCycle+']') ;
            }
            else {
                if ( this.alarmType == '1' ) {
                    if ( !this.clientId ){
                        this.alarmTemplate = '';
                        return ;
                    }
                    var clientName = this.getClientNameById( this.clientId ) ;
                    this.alarmTemplate = common_js_lang['rule.text.template2'].replace(/\[x\]/, clientName);
                }
                else {
                    if ( !this.curJob || (parseInt(this.jobCycle) || 0) <= 0 ){
                        this.alarmTemplate = '';
                        return ;
                    }
                    var jobCycle = parseInt(this.jobCycle) ;
                    var clientName = this.getClientNameById( this.clientId );
                    var jobName = this.clientJob[this.pid][this.curJob].jobName;
                    this.alarmTemplate = common_js_lang['rule.text.template3']
                                        .replace(/\[c\]/, '['+clientName+']')
                                        .replace(/\[x\]/, '['+this.projectList[this.pid].name+']')
                                        .replace(/\[yz\]/, '['+this.curJob+': '+jobName+']')
                                        .replace(/\[n\]/, '['+jobCycle+']') ;
                }
            }
        },
        getClientNameById: function(id){
            var arr = this.clientArr ;
            for ( var i= 0,len=this.clientArr.length; i<len; i++ ){
                if ( this.clientArr[i].id == id )
                    return this.clientArr[i].clientName ;
            }
        },
        alarmCycleFix: function(){
            this.jobCycle = (parseInt(this.jobCycle) || 0) <= 0 ? '' : parseInt(this.jobCycle);
        },
        alarmTypeChange: function(){
            this.alarmType == '1' ? this.alarmRule = '2' : this.alarmRule = '0' ;
            this.getAlarmDesc();
        }
    }
});