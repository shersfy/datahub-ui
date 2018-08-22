/**
 * Created by Administrator on 2017/12/18.
 */
/**
 * Created by Administrator on 2017/12/1.
 */

var vm = new Vue({
    el: '.mainCon',
    data: {
        isLoading: true,
        noData: '<img class="noData" src="resources/dist/images/noData.png">'+common_js_lang['manage.title.noData'],
        tokenColumn: [
            {
                title: common_js_lang['manage.title.inApp'],
                key: 'appKey',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.appKey,placement:'top'}}, params.row.appKey)
                }
            },
            {
                title: 'Token',
                key: 'accessToken',
                ellipsis: true,
                render: function(h, params){
                    return h('Tooltip',{props:{content: params.row.accessToken,placement:'top'}}, params.row.accessToken)
                }
            },
            {
                title: common_js_lang['clientList.option.oper'],
                key: 'act',
                className: 'act',
                ellipsis: true,
                render: function(h, params){
                    return h('div',{
                        on:{
                            click: function(){
                                vm.isLoading = true;
                                $.post('token/refresh', {appId: params.row.appId}).then(function(data){
                                    MsgTip('success', common_js_lang['token.act.freshSucc']);
                                    vm.getTokenList() ;
                                }).always(function(){
                                    vm.isLoading = false;
                                });
                            }
                        }
                    }, [h('Icon',{props:{type:'android-refresh'}}), h('span', common_js_lang['token.act.refresh'])])
                }
            }
        ],
        tokenList: [
        ]
    },
    created: function() {
        this.getTokenList();
    },
    methods: {
        getTokenList: function () {
            var _this = this;
            this.isLoading = true;
            $.get('token/list').then(function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                _this.tokenList = data.model ;
            }).always(function(){
                _this.isLoading = false;
            })
        }
    }
});