/**
 * Created by Administrator on 2017/12/1.
 */

var vm = new Vue({
    el: '.mainCon',
    data: {
        isLoading: true,
        noData: '<img class="noData" src="resources/dist/images/noData.png">'+common_js_lang['manage.title.noData'],
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
                title: common_js_lang['rule.option.alarmContent'],
                key: 'alarmContent',
                className: 'content',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.alarmContent,placement:'top'}}, params.row.alarmContent)
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
                title: common_js_lang['alarm.option.createTime'],
                key: 'createTime',
                width: 155,
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: vm.time2str(params.row.createTime), placement:'top'}}, vm.time2str(params.row.createTime))
                }
            }
        ],
        clientColumn: [
            {
                title: common_js_lang['rule.option.ruleType'],
                key: 'alarmType',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.alarmType,placement:'top'}}, params.row.alarmType)
                }
            },
            {
                title: common_js_lang['clientList.option.clientName'],
                key: 'clientName',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.clientName,placement:'top'}}, params.row.clientName)
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
                title: common_js_lang['rule.option.alarmContent'],
                key: 'alarmContent',
                className: 'content',
                width: 140,
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.alarmContent,placement:'top'}}, params.row.alarmContent)
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
                title: common_js_lang['alarm.option.createTime'],
                key: 'createTime',
                width: 155,
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: vm.time2str(params.row.createTime), placement:'top'}}, vm.time2str(params.row.createTime))
                }
            }
        ],
        transList: [
        ],
        clientList: [
        ],
        transType: '1',    //迁移查询方式
        transWord: '',     //查询关键字
        clientType: '2',   //客户端查询类型
        activeName: '0',   //当前活动列表类型
        clientListGot: false,  //客户端列表是否取过
        transListGot: false,

        transParam: {jobType:0, pageNo: 1, pageSize:10},
        clientParam: {jobType:1, pageNo: 1, pageSize:10},
        transPager: {total:0, current:0},
        clientPager: {total:0,current:0}
    },
    created: function() {
        var urlObj = {};
        var urlParam = location.search.replace(/^\?|\?$/g, '').split('&');
        for ( var i=0,len=urlParam.length; i<len; i++ ){
            var obj = urlParam[i].split('=');
            urlObj[obj[0]] = obj[1] || '' ;
        }
        if ( urlObj.activeName == '0' ){
            this.transParam.ruleId = urlObj.id ;
            this.getTransList();
        }
        else if ( urlObj.activeName == '1' ){
            this.getTransList();
            this.clientParam.ruleId = urlObj.id ;
            this.listChange('1');
        }
        else
            this.getTransList();
    },
    methods: {
        typeChange: function(){
            this.transWord = '';
        },
        time2str: function(time){
            var date = new Date(time);
            var map = {
                'y': date.getFullYear(),
                "M": date.getMonth() + 1, //月份
                "d": date.getDate(), //日
                "h": date.getHours(), //小时
                "m": date.getMinutes(), //分
                "s": date.getSeconds() //秒
            };
            for ( var k in map ){
                if (k !== 'y' && +map[k] < 10){
                    map[k] = '0' + map[k];
                }
            }
            return map.y+'-'+map.M+'-'+map.d+' '+map.h+':'+map.m+':'+map.s ;
        },
        getaAlarmList: function(param){
            return $.get('alarm/history/list', param)
        },
        listChange: function(name){
            this.activeName = name;
            if ( name == '1' && !this.clientListGot ) {
                this.getClientList();
            }
        },
        getTransList: function(){
            var _this = this;
            this.isLoading = true;
            this.getaAlarmList(this.transParam).then(function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                _this.transListGot = true;

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
            this.getaAlarmList(this.clientParam).then(function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                _this.clientListGot = true;

                _this.clientList = data.model.data;
                _this.clientList.total = data.model.totalCount || 0 ;
                _this.clientList.current = data.model.currentPage || 0;
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
                    MsgTip('info', common_js_lang['manage.info.taskIdInfo']);
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
            delete this.transParam.ruleId;
            this.transParam.pageNo = 1;
            this.getTransList();
        },
        clientTypeChange: function(){
            if ( this.clientType == '2' )
                delete this.clientParam.alarmType;
            else
                this.clientParam.alarmType = this.clientType;

            delete this.transParam.ruleId;
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
        }
    }
});