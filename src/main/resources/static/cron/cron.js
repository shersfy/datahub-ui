;(function($) {
    var cronGlobalParam = {
        cronParam: '',
        periodType: ''
    };

    var datepickerLang = common_i18n_lang == 'zh' ? 'zh-cn' : 'en';
    $('.cronCon .onceDate .date').on('click', function () {
        WdatePicker({readOnly: true, isShowClear: false, lang: datepickerLang, minDate: '%y-%M-%d', onpicked: blurCron})
    });
    $('.cronCon .onceDate .time').on('click', function () {
        WdatePicker({readOnly: true, dateFmt: 'HH:mm:ss', lang: datepickerLang, onpicked: blurCron});
    });
    $('.cronCon .day .time').on('click', function () {
        WdatePicker({readOnly: true, dateFmt: 'HH:mm:ss', lang: datepickerLang, onpicked: blurCron})
    });
    $('.cronCon .week .time').on('click', function () {
        WdatePicker({readOnly: true, dateFmt: 'HH:mm:ss', lang: datepickerLang, onpicked: blurCron})
    });
    $('.cronCon .month .time').on('click', function () {
        WdatePicker({readOnly: true, dateFmt: 'HH:mm:ss', lang: datepickerLang, onpicked: blurCron})
    });
    $('.cronCon #startDate').on('click', function () {
        WdatePicker({
            readOnly: true,
            dateFmt: 'yyyy-MM-dd',
            lang: datepickerLang,
            minDate: '%y-%M-%d',
            maxDate: '#F{$dp.$D(\'endDate\')}',
            onpicked: blurCron
        })
    });
    $('.cronCon #endDate').on('click', function () {
        WdatePicker({
            readOnly: true,
            dateFmt: 'yyyy-MM-dd',
            lang: datepickerLang,
            minDate: '#F{maxInitDate(\'%y-%M-%d\',$dp.$D(\'startDate\'))}',
            onpicked: blurCron
        })
    });

// 顶部 tab 切换
    $('.cronCon .group-type').on('click', 'a', function () {
        if ($(this).hasClass('cur'))
            return;
        $('.cronCon .group-type a').toggleClass('cur');
        blurCron();
        $('.cronCon > .tab').toggle();
    });


// 定时 radio 切换
$('.cronCon .tab').on('click', '.once-type', function(){
    var type = $(this).data('type');
    $(this).parent().parent().find('.radio').removeClass('cur');
    $(this).find('.radio').addClass('cur');
    $('.cronCon .onceDate input').prop('disabled', type == 0);
});

// 周期 select 切换
    $('.cronCon .exec-freq').on('change', '.reg-type', function () {
        var type = +$(this).val();
        $('.cronCon .exec-freq .reg-tab').removeClass('cur').eq(type).addClass('cur');
    });

    $('.cronCon .hour').on('blur', 'input', function () {
        var val = parseInt($(this).val() || '') || 0;
        if (val < 0 || val > 59) {
            val = 0;
        }
        $(this).val(val);
    });

    $('.cronCon .week').on('click', 'label', function () {
        $(this).find('.check').toggleClass('cur');
    });

// 每月 时间选择
    $('.cronCon .month').on('click', 'label', function () {
        var index = +$(this).data('type');
        $('.cronCon .reg-tab.month').find('.radio').removeClass('cur');
        $(this).find('.radio').addClass('cur');
        $('.cronCon .month .date').prop('disabled', index != 0);
    });
    $('.cronCon .month').on('blur', '.date', function () {
        var val = parseInt($(this).val()) || 0;
        if (val <= 1 || val > 31) {
            val = 1;
        }
        $(this).val(val);
    });
    $('.cronCon .date-range').on('click', 'label', function () {
        var index = +$(this).data('type');
        if ($(this).find('.radio').length == 0)
            return;
        $('.cronCon .date-range').find('.radio').removeClass('cur');
        $(this).find('.radio').addClass('cur');
        $('.cronCon .date-range #endDate').prop('disabled', index != 0);
    });

    function cronExec(type, bool) {
        switch (type) {
            case 0:
                execOnce(bool);
                break;
            case 1:
                execRegular(bool);
                break;
        }
        return cronGlobalParam;
    }

// 重复执行的说明
    function regularState(cron) {
        var state = '';
        if (!cron) {
            $('.cronCon .group-state textarea').val(state);
            return;
        }
        if (cron.slice(-5) == '* * ?') {
            state += common_js_lang['cron.text.hourTy'] + ',';
            var arr = cron.split(' ');
            state += common_js_lang['cron.text.timeIs'] + ' [' + arr[1] + common_js_lang['client.text.min'] + arr[0] + common_js_lang['cron.text.sec'] + ']';
        }
        else if (cron.slice(-3) == '* ?') {
            var arr = cron.split(' ');
            state += common_js_lang['cron.text.dayTy'] + ',' + common_js_lang['cron.text.timeIs'] + ' [' + (+arr[2] >= 10 ? arr[2] : '0' + arr[2]) + ':' + (+arr[1] >= 10 ? arr[1] : '0' + arr[1]) + ':' + (+arr[0] >= 10 ? arr[0] : '0' + arr[0]) + ']';
        }
        else if (cron.slice(-1) == '?') {
            var arr = cron.split(' ');
            var d = arr[3];
            state += common_js_lang['cron.text.monthTy'] + ',' + common_js_lang['cron.text.timeIs'] + (d == 'L' ? '[' + common_js_lang['client.text.lastDay'] + ']' : common_js_lang['cron.text.dayNum'].replace(/\[x\]/, "[" + d + "]")) + ' [' + (+arr[2] >= 10 ? arr[2] : '0' + arr[2]) + ':' + (+arr[1] >= 10 ? arr[1] : '0' + arr[1]) + ':' + (+arr[0] >= 10 ? arr[0] : '0' + arr[0]) + ']';
        }
        else {
            var arr = cron.split(' ');
            var w = arr[5].split(','
            );
            state += common_js_lang['cron.text.weekTy'] + ',' + common_js_lang['cron.text.timeIs'] + ' [ ';
            w.map(function (v) {
                state += [common_js_lang['client.text.sun'], common_js_lang['client.text.Mon'], common_js_lang['client.text.Tue'], common_js_lang['client.text.wed'], common_js_lang['client.text.thu'], common_js_lang['client.text.fri'], common_js_lang['client.text.sat']][+v - 1] + ' ';
            });
            state += '] [' + (+arr[2] >= 10 ? arr[2] : '0' + arr[2]) + ':' + (+arr[1] >= 10 ? arr[1] : '0' + arr[1]) + ':' + (+arr[0] >= 10 ? arr[0] : '0' + arr[0]) + '] ';
        }

        if (!cronGlobalParam.endTimeStr)
            state += ' .' + common_js_lang['cron.text.from'] + ' ' + cronGlobalParam.startTimeStr + ' ' + common_js_lang['cron.text.startEff'] + '.';
        else
            state += ' ' + common_js_lang['cron.text.valid'] + ' ' + cronGlobalParam.startTimeStr + ' ' + common_js_lang['client.text.to'] + ' ' + cronGlobalParam.endTimeStr;
        $('.cronCon .group-state textarea').val(state);
    }

    function execRegular(bool) {
        var freqParam = false,
            dateRangeParam = false,
            state = '';

        getFreq(bool) && getDateRange(bool);
        regularState(cronGlobalParam.cronParam);
    }

    function getDateRange(bool) {
        var type = $('.cronCon .date-range .radio.cur').parent().data('type'),
            startDate = $('.cronCon .date-range #startDate').val(),
            endDate = '';

        if (type == 0) {
            endDate = $('.cronCon .date-range #endDate').val();
            if (!endDate) {
                bool && MsgTip('', common_js_lang['client.info.completeTime'], 'info');
                cronGlobalParam = {};
                $('.cronCon .group-state textarea').val('');
                $('.cronCon .btnCon input').val('');
                return false;
            }
            if (endDate < startDate) {
                bool && MsgTip('', common_js_lang['cron.info.endtimeErr'], 'info');
                cronGlobalParam = {};
                $('.cronCon .group-state textarea').val('');
                $('.cronCon .btnCon input').val('');
                return false;
            }
        }
        if (!startDate) {
            bool && MsgTip('', common_js_lang['client.info.completeTime'], 'info');
            cronGlobalParam = {};
            $('.cronCon .group-state textarea').val('');
            $('.cronCon .btnCon input').val('');
            return false;
        }
        cronGlobalParam.startTimeStr = startDate;
        cronGlobalParam.endTimeStr = endDate;
        cronGlobalParam.periodType = 2;
    }

    function getFreq(bool) {
        var type = +$('.cronCon .reg-type').val(),
            tabDom = $('.cronCon .reg-tab').eq(type);

        if (type == 0) {
            var minute = tabDom.find('input').val().trim();
            if (!minute) {
                bool && MsgTip('', common_js_lang['client.info.completeTime'], 'info');
                cronGlobalParam = {};
                $('.cronCon .group-state textarea').val('');
                $('.cronCon .btnCon input').val('');
                return false;
            }
            cronGlobalParam.cronParam = '0 ' + minute + ' /1 * * ?';
        }
        else if (type == 1) {
            if (!tabDom.find('input').val()) {
                bool && MsgTip('', common_js_lang['client.info.completeTime'], 'info');
                cronGlobalParam = {};
                $('.cronCon .group-state textarea').val('');
                $('.cronCon .btnCon input').val('');
                return false;
            }
            var timeArr = tabDom.find('input').val().split(':');
            cronGlobalParam.cronParam = +timeArr[2] + ' ' + (+timeArr[1]) + ' ' + (+timeArr[0]) + ' /1 * ?';
        }
        else if (type == 2) {
            var weekDomArr = tabDom.find('.check.cur'),
                weekArr = [];

            for (var i = 0, len = weekDomArr.length; i < len; i++) {
                weekArr.push(weekDomArr.eq(i).data('val'));
            }

            if (!tabDom.find('.time').val() || weekArr.length <= 0) {
                bool && MsgTip('', common_js_lang['client.info.completeTime'], 'info');
                cronGlobalParam = {};
                $('.cronCon .group-state textarea').val('');
                $('.cronCon .btnCon input').val('');
                return false;
            }
            var timeArr = tabDom.find('.time').val().split(':');
            cronGlobalParam.cronParam = +timeArr[2] + ' ' + (+timeArr[1]) + ' ' + (+timeArr[0]) + ' ? * ' + weekArr.join(',');
        }
        else {
            if (!tabDom.find('.time').val()) {
                bool && MsgTip('', common_js_lang['client.info.completeTime'], 'info');
                cronGlobalParam = {};
                $('.cronCon .group-state textarea').val('');
                $('.cronCon .btnCon input').val('');
                return false;
            }

            var timeArr = tabDom.find('.time').val().split(':'),
                type = tabDom.find('.radio.cur').parent().data('type');

            if (type == 0) {
                var date = tabDom.find('.date').val();
                if (!date) {
                    bool && MsgTip('', common_js_lang['client.info.completeTime'], 'info');
                    cronGlobalParam = {};
                    $('.cronCon .group-state textarea').val('');
                    $('.cronCon .btnCon input').val('');
                    return false;
                }
            }
            else
                var date = 'L';
            cronGlobalParam.cronParam = +timeArr[2] + ' ' + (+timeArr[1]) + ' ' + (+timeArr[0]) + ' ' + date + ' /1 ?';
        }
        return true;
    }


    function execOnce(bool) {
        var type = $('.cronCon .once-type .radio.cur').parent().data('type');
        if (type == 0) {
            cronGlobalParam.cronParam = '* * * * * ?';
            cronGlobalParam.periodType = 0;
            $('.cronCon .group-state textarea').val(common_js_lang['client.option.Immed']);
            return;
        }

        var date = $('.cronCon .onceDate .date').val(),
            time = $('.cronCon .onceDate .time').val();
        if (date == '' || time == '') {
            bool && MsgTip('', common_js_lang['client.info.completeTime'], 'info');
            cronGlobalParam = {};
            $('.cronCon .group-state textarea').val('');
            $('.cronCon .btnCon input').val('');
            return;
        }

        $('.cronCon .group-state textarea').val(common_js_lang['cron.text.exec1'] + ' [' + date + ' ' + time + ']');

        var dateArr = date.split('-'),
            timeArr = time.split(':');

        cronGlobalParam.periodType = 1;
        cronGlobalParam.cronParam = +timeArr[2] + ' ' + (+timeArr[1]) + ' ' + (+timeArr[0]) + ' ' + (+dateArr[2]) + ' ' + (+dateArr[1]) + ' ? ' + (+dateArr[0]);
    }


    $('.cronCon .btnCon').on('click', '.btn-item', function () {
        cronExec($('.group-type .cur').index(), true);
        // $('.cronCon .btnCon input').val(JSON.stringify(cronGlobalParam));
    });

// 实时更新 摘要说明
    $('.cronCon').on('blur', 'input', function () {
        cronExec($('.cronCon .group-type .cur').index());
    });
    $('.cronCon').on('click', 'label', function () {
        cronExec($('.cronCon .group-type .cur').index());
    });

    function blurCron() {
        cronExec($('.cronCon .group-type .cur').index());
    }

    $('.cronCon').on('click', 'button.reset', function (e, param) {
        var cronParam = $('.cronCon .btnCon input').val();
        if (!cronParam || cronParam == '{}')  return;
        resetCron(JSON.parse(cronParam));
    });

    function resetCron(param) {
        var cron = param.cronParam;
        if (cron == '* * * * * ?') {
            ;   //立即执行
            $('.cronCon .group-state textarea').val(common_js_lang['client.option.Immed']);
            return;
        }
        else if (cron.split(' ')[6] > 0) {
            $('.cronCon .once-type').eq(1).click();
            var arr = cron.split(' ');
            var date = arr[6] + '-' + (+arr[4] >= 10 ? arr[4] : '0' + arr[4]) + '-' + (+arr[3] >= 10 ? arr[3] : '0' + arr[3]),
                time = (+arr[2] >= 10 ? arr[2] : '0' + arr[2]) + ':' + (+arr[1] >= 10 ? arr[1] : '0' + arr[1]) + ':' + (+arr[0] >= 10 ? arr[0] : '0' + arr[0]);
            $('.cronCon .onceDate .date').val(date);
            $('.cronCon .onceDate .time').val(time);
            $('.cronCon .group-state textarea').val(common_js_lang['cron.text.exec1'] + ' [' + date + ' ' + time + ']');
            return;
        }

        var arr = cron.split(' ');
        var time = (+arr[2] >= 10 ? arr[2] : '0' + arr[2]) + ':' + (+arr[1] >= 10 ? arr[1] : '0' + arr[1]) + ':' + (+arr[0] >= 10 ? arr[0] : '0' + arr[0]);
        $('.cronCon .group-type a').eq(1).click();

        if (cron.slice(-5) == '* * ?') {
            $('.cronCon .reg-type').val(0);
            $('.cronCon .hour input').val(arr[1]);
        }
        else if (cron.slice(-3) == '* ?') {
            $('.cronCon .reg-type').val(1).trigger('change');
            $('.cronCon .day .time').val(time);
        }
        else if (cron.slice(-1) == '?') {
            $('.cronCon .reg-type').val(3).trigger('change');
            var d = arr[3];
            if (d == 'L') {
                $('.cronCon .month label').eq(1).click();
            }
            else {
                $('.cronCon .month label').eq(0).find('.date').val(d);
            }
            $('.cronCon .month .time').val(time);
        }
        else {
            $('.cronCon .reg-type').val(2).trigger('change');
            var w = arr[5].split(',');
            w.map(function (v) {
                $('.cronCon .week label [data-val="' + v + '"]').addClass('cur');
            });
            $('.cronCon .week .timeCon input').val(time);
        }

        var _startDate = new Date(param.startTime),
            _year = _startDate.getFullYear(),
            _month = _startDate.getMonth() + 1,
            _day = _startDate.getDate();
        _month < 10 && (_month = '0' + _month);
        _day < 10 && (_day = '0' + _day);
        cronGlobalParam.startTimeStr = _year + '-' + _month + '-' + _day;
        $('.cronCon .date-range #startDate').val(_year + '-' + _month + '-' + _day);
        if (!param.endTime) {
            $('.cronCon .date-range label').eq(2).click();
        }
        else {
            var _startDate = new Date(param.endTime),
                _year = _startDate.getFullYear(),
                _month = _startDate.getMonth() + 1,
                _day = _startDate.getDate();
            _month < 10 && (_month = '0' + _month);
            _day < 10 && (_day = '0' + _day);
            var endDate = _year + '-' + _month + '-' + _day;
            if (_year < 3000) {
                $('.cronCon .date-range #endDate').val(endDate);
                cronGlobalParam.endTimeStr = endDate;
            }
            else
                $('.cronCon .date-range label').eq(2).click();
        }

        regularState(param.cronParam);
    };

    window.cronExport = {
        resetCron: resetCron,
        cronExec: cronExec
    };
}(jQuery));