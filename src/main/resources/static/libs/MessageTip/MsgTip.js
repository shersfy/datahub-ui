/**
 * Created by Administrator on 2017/9/25.
 */

;(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS
        factory(require('jquery'));
    } else {
        // Browser globals
        jQuery ? factory(jQuery) : factory(Zepto);
    }
}(function ($) {
    "use strict";
    $('head').append('<link rel="stylesheet" href="resources/libs/MessageTip/MsgTip.css">');
    function MsgTip(config){
        var defaults = {
            type : 'info',
            text: ' -- ',
            delay: 3000
        };

        if ( arguments.length > 1 ){
            var len = arguments.length;
            config = {
                type: arguments[0],
                text: arguments[1]
            };
            typeof arguments[2] === 'number' ? config.delay = arguments[2] : '';
        }
        var options = $.extend(defaults, config);

        var dom = $('.MsgTip.messageAlert');
        if ( dom.length == 0 ) {
            MsgTip.init();
            dom = $('.MsgTip.messageAlert');
        }
        dom.removeClass('success').addClass(options.type);
        dom.find('.main').html( options.text );
        dom.css({display:'block'});
        if ( options.delay > 0 ) {
            clearTimeout(MsgTip.hideTimer);
            MsgTip.hideTimer = setTimeout(function () {
                dom.hide();
            }, options.delay + 200);
        }
    };

    MsgTip.hideTimer = 0;
    MsgTip.template = function(){
        var template = '<div class="MsgTip messageAlert"><i class="type"></i><span class="main"></span><i class="del"></i></div>';
        return template ;
    }
    MsgTip.init = function(force){
        $('body').append( MsgTip.template() );
        MsgTip.event();
    }
    MsgTip.event = function(){
        var dom = $('.MsgTip.messageAlert');
        dom.on('click', '.del', function(){
            clearTimeout(MsgTip.hideTimer);
            dom.hide();
        });
    }

    window.MsgTip = MsgTip;


    function ErrTip(config){
        var defaults = {
            title: ' -- ',
            detail: ' -- ',
            msg: ' -- '
        };

        if ( arguments.length > 1 ){
            var len = arguments.length;
            config = {
                title: arguments[0],
                detail: arguments[1],
                msg: arguments[2]
            };
        }
        var options = $.extend(defaults, config);

        var dom = $('.ErrTip.messageAlert');
        if ( dom.length == 0 ) {
            ErrTip.init();
            dom = $('.ErrTip.messageAlert');
        }
        else {
            dom.find('.msg').removeClass('show').hide();
            dom.find('.showToggle').html( common_js_lang['common.act.showDetail'] );
        }
        dom.find('.title').html( options.title).end().find('.detail').html( options.detail).end().find('.msg').html(options.msg);
        dom.css({display:'block'});
    };

    ErrTip.template = function(){
        var template = '<div class="ErrTip messageAlert"><div class="head"><i class="del">×</i></div>'+
                '<div class="main"><div class="title"></div><div class="detail"></div><a class="showToggle">'+common_js_lang['common.act.showDetail']+'</a><div class="msg"></div></div>'+
                '<div class="foot"><button class="close">'+common_js_lang['common.btn.close']+'</button></div>';
        return template ;
    }
    ErrTip.init = function(force){
        $('body').append( ErrTip.template() );
        ErrTip.event();
    }
    ErrTip.event = function(){
        var dom = $('.ErrTip.messageAlert');
        dom.on('click', '.del, .close', function(){
            dom.hide();
        });
        dom.on('click', '.showToggle', function(){
           if ( dom.find('.msg').hasClass('show') ){  //隐藏详情
               dom.find('.msg').removeClass('show').slideUp();
               $(this).html( common_js_lang['common.act.showDetail'] );
           }
           else {  // 展示详情
               dom.find('.msg').addClass('show').slideDown();
               $(this).html( common_js_lang['common.act.hideDetail'] );
           }
        });
    }

    window.ErrTip = ErrTip;
}));