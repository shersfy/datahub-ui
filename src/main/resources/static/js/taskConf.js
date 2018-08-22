var vm = new Vue({
    el: '.detailCon',
    data: {
        sourceInfo: {},
        targetInfo: {},
        maskShow: false,
        globalParam: {
            urlObj: {}
        },
        jobInfo: {
        },
        otherParams: {
        },
        keyLang: {
            groupNo: common_js_lang['manage.title.srcType'],
            ip: common_js_lang['clientList.option.ip'],
            port: common_js_lang['dbManage.option.port'],
            host: common_js_lang['dbManage.option.addr'],
            userName: common_js_lang['dbManage.option.userName'],
            accessKey: common_js_lang['s3.option.keyId'],
            region: common_js_lang['s3.option.region'],
            libType: common_js_lang['db.option.resourceType'],
            connName: common_js_lang['dbManage.option.connName'],
            dbType: common_js_lang['dbManage.option.dbType'],
            dbName: common_js_lang['dbManage.option.dbName'],
            url: common_js_lang['dbManage.option.link']+' URL',
            hdfs: common_js_lang['dbManage.title.setHdfsLink'],
            hive: common_js_lang['dbManage.title.hiveUser'],
            tarType: common_js_lang['local.title.tarDir'],
            authType: common_js_lang['dbManage.title.authType'],
            coreSite: 'core-site.xml '+common_js_lang['dbManage.option.path'],
            hdfsSite: 'hdfs-site.xml '+common_js_lang['dbManage.option.path'],
            srcType: common_js_lang['conf.text.srcType'],
            sourcePath: common_js_lang['conf.option.srcPath'],
            sourceFile: common_js_lang['conf.option.srcFileName'],
            tarFile: common_js_lang['conf.option.tarFileName'],
            tarPath: common_js_lang['conf.option.tarPath'],
            size: common_js_lang['conf.option.size'],
            sourceDbName: common_js_lang['dump.option.sourceDb'],
            sourceTblName: common_js_lang['dump.option.sourceTbl'],
            tarDbName: common_js_lang['db.option.tarDb'],
            tarTblName: common_js_lang['dump.option.tarTbl'],
            tarPart: common_js_lang['dump.option.tarPart'],
            ddl: common_js_lang['local.option.tarSql'],
            whereSql: common_js_lang['conf.option.whereSql'],
            replacement: common_js_lang['db.option.replaceMent'],
            tip: common_js_lang['clientList.note.mark'],
            columnSep: common_js_lang['conf.option.columnSep'],
            fieldEnClosed: common_js_lang['conf.option.fieldEnClosed'],
            krb5Conf: 'krb5.conf '+common_js_lang['dbManage.option.path'],
            keytab: 'Keytab '+common_js_lang['dbManage.option.path'],
            principal: common_js_lang['conf.option.kerberos'],
            pattern: common_js_lang['conf.option.pattern'],
            srcFileHandleType: common_js_lang['conf.option.srcSet'],
            tarRenameType: common_js_lang['conf.option.nuptial'],
            sourceView: common_js_lang['conf.option.srcView'],
            protocol: common_js_lang['conf.option.protocol'],
            fromIsPart:common_js_lang['conf.option.isPart'],
            toIsPart: common_js_lang['conf.option.isPart'],
            hivePartConf: common_js_lang['conf.option.partSet'],
            sqlQuery: common_js_lang['db.option.sqlQuery']
        },
        detailTitle: [],
        detailInfo: [],
        detailHeadClass: '',
        dbtype: {
            38: 'MySQL', 52: 'AliMySQL', 56: 'AwsMySQL',
            4: 'Oracle', 60: 'AwsOracle',
            40: 'SQL Server', 53: 'AliSQLServer', 57: 'AwsSQLServer',
            44: 'DB2',
            24: 'PostgreSQL', 54: 'AliPostgreSQL', 58: 'AwsPostgreSQL'
        },
        ddlShow: [false],
        whereSqlShow: [false],
        codeMirrorItems: [],
        partShow: [false],
        gotPart: [false],
        expPartDefer: [],
        ddlAjaxHandle: [false],
        y:[0],
        toType: {
            8: 'HDFS',
            9: 'HIVE',
            13: 'Spark MPP',
            2: 'Database',
            6: 'Aliyun RDS',
            7: 'Amazon RDS'
        }
    },
    created: function(){
        var urlParam = location.search.replace(/^\?|\?$/g, '').split('&');
        for ( var i=0,len=urlParam.length; i<len; i++ ){
            var obj = urlParam[i].split('=');
            this.globalParam.urlObj[obj[0]] = obj[1] || '' ;
        }

        var self = this ;
        self.maskShow = true;
        $.ajax({
            url: 'job/detail?jobId='+this.globalParam.urlObj.id,
            success: function(data){
                if ( data.code != 200 ){
                    ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                    return ;
                }
                try{
                    console.log(data.model);

                    // 基本信息
                    var jobInfo = {};
                    jobInfo = $.extend({},data.model) ;
                    jobInfo.pid = common_project[jobInfo.pid].name;
                    jobInfo.cronExpression = self.regularState(jobInfo);
                    jobInfo.createTime = self.dateFormat(jobInfo.createTime, 'yyyy/MM/dd hh:mm:ss');
                    self.jobInfo = jobInfo;
                    var errMsg = '';
                    // 源信息
                    var sourceInfo = {};
                    var hdfsAsync = false;
                    if ( [1,4,10,11].indexOf(+jobInfo.groupNo) > -1 ){  // local dump excel csv
                        sourceInfo['groupNo'] = common_js_lang[jobInfo.groupName] ;
                    }
                    else if ( jobInfo.groupNo == 12 ){  // ftp
                        sourceInfo['groupNo'] = common_js_lang['job.group.ftp'];
                        if ( jobInfo.fromObject ) {
                            sourceInfo['libType'] = jobInfo.fromObject.delFlg == -1 ? common_js_lang['conf.text.tmpConn'] : common_js_lang['conf.text.savedConn'];
                            sourceInfo['ip'] = jobInfo.fromObject.host;
                            sourceInfo['port'] = jobInfo.fromObject.port;
                            sourceInfo['protocol'] = ['FTP - '+common_js_lang['conf.text.ftp'], 'SFTP- SSH'+common_js_lang['conf.text.ftp'] ][+jobInfo.fromObject.protocol-1];
                            sourceInfo['userName'] = jobInfo.fromObject.userName;
                            sourceInfo['connName'] = jobInfo.fromObject.connName;
                        }
                        else {
                            errMsg += common_js_lang['conf.info.srcNull'];
                        }
                    }
                    else if ( jobInfo.groupNo == 5 ){  // s3
                        sourceInfo['groupNo'] = common_js_lang['job.group.s3'];
                        sourceInfo['accessKey'] = jobInfo.fromObject.accessKey;    
                        sourceInfo['region'] = jobInfo.fromObject.regionStr;                                                                    
                    }
                    else if ( [2,6,7].indexOf(+jobInfo.groupNo) > -1 ){ // db ali aws
                        if ( !jobInfo.fromObject ) {
                            errMsg += common_js_lang['conf.info.srcNull'];
                        }
                        else {
                            sourceInfo['groupNo'] = self.dbtype[jobInfo.fromObject.dbType];
                            sourceInfo['libType'] = jobInfo.fromObject.delFlg == -1 ? common_js_lang['conf.text.tmpConn'] : common_js_lang['conf.text.savedConn'];
                            sourceInfo['connName'] = jobInfo.fromObject.connName;
                            sourceInfo['dbType'] = self.dbtype[jobInfo.fromObject.dbType];
                            sourceInfo['host'] = jobInfo.fromObject.host;
                            sourceInfo['port'] = jobInfo.fromObject.port;
                            sourceInfo['dbName'] = jobInfo.fromObject.dbName;
                            sourceInfo['userName'] = jobInfo.fromObject.userName;
                            sourceInfo['url'] = jobInfo.fromObject.url;
                        }
                    }
                    else {     // hive 2 hive
                        if ( !jobInfo.fromObject ){
                            errMsg += common_js_lang['conf.info.srcNull'];
                        }
                        else {
                            sourceInfo['groupNo'] = common_js_lang['job.group.hive'];
                            sourceInfo['connName'] = jobInfo.fromObject.connName;
                            sourceInfo['hdfs'] = jobInfo.fromObject.hid;
                            sourceInfo['host'] = jobInfo.fromObject.host;
                            sourceInfo['hive'] = jobInfo.fromObject.userName;
                            sourceInfo['url'] = jobInfo.fromObject.url;
                            if (sourceInfo['hdfs'] == adminConfigData.hdfs.id) {
                                sourceInfo['hdfs'] = adminConfigData.hdfs.connName;
                            }
                            else {
                                hdfsAsync = true;
                                $.ajax({
                                    url: 'hdfs/list?pid=' + data.model.pid,
                                    success: function (data) {
                                        if (data.code != 200) {
                                            ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                                            self.sourceInfo = sourceInfo;
                                            return;
                                        }
                                        var hdfsArr = data.model.data;
                                        for (var i = 0, len = hdfsArr.length; i < len; i++) {
                                            if (hdfsArr[i].id == sourceInfo['hdfs']) {
                                                sourceInfo['hdfs'] = hdfsArr[i].connName;
                                                break;
                                            }
                                        }
                                        self.sourceInfo = sourceInfo;
                                    }
                                });
                            }
                        }
                    }

                    !hdfsAsync ? self.sourceInfo = sourceInfo : '';


                    // 目标信息
                    if ( !jobInfo.toObject ){
                        errMsg += (errMsg ? '\n' : '')+common_js_lang['conf.info.tarNull'];
                    }
                    else {
                        var targetInfo = {};
                        targetInfo['tarType'] = self.toType[+jobInfo.toType];
                        targetInfo['connName'] = jobInfo.toObject.connName;
                        targetInfo['authType'] = jobInfo.toObject.authType && ['simple', 'kerberos', 'sentry'][+jobInfo.toObject.authType - 1];
                        targetInfo['coreSite'] = jobInfo.toObject.coreSiteXml;
                        targetInfo['hdfsSite'] = jobInfo.toObject.hdfsSiteXml;
                        targetInfo['krb5Conf'] = jobInfo.toObject.krb5Conf;
                        targetInfo['keytab'] = jobInfo.toObject.keytab;
                        targetInfo['principal'] = jobInfo.toObject.principal;
                        targetInfo['userName'] = [9,13].indexOf(+jobInfo.toType) > -1 ? '' : jobInfo.toObject.userName;
                        targetInfo['hdfs'] = jobInfo.toObject.hid;
                        targetInfo['host'] = jobInfo.toObject.host;
                        targetInfo['dbName'] = [9,13].indexOf(+jobInfo.toType) > -1 ? '' : jobInfo.toObject.dbName;
                        targetInfo['hive'] = [9,13].indexOf(+jobInfo.toType) > -1 ? jobInfo.toObject.userName : '';
                        targetInfo['url'] = jobInfo.toObject.url;

                        if ( jobInfo.toObject.authType == 3 ) {
                            common_project[data.model.pid].proxyUser && (targetInfo.userName = common_project[data.model.pid].proxyUser);
                        }
                        if ( !jobInfo.toObject.authType ) {
                            data.model.toObject.id == adminConfigData.hive.id && (targetInfo.hive = common_project[data.model.pid].proxyUser);
                        }

                        if (!targetInfo['hdfs']) {
                            self.targetInfo = targetInfo;
                        }
                        else if (targetInfo['hdfs'] == adminConfigData.hdfs.id) {
                            targetInfo['hdfs'] = adminConfigData.hdfs.connName;
                            self.targetInfo = targetInfo;
                        }
                        else {
                            $.ajax({
                                url: 'hdfs/list?pid=' + data.model.pid,
                                success: function (data) {
                                    if (data.code != 200) {
                                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                                        self.targetInfo = targetInfo;
                                        return;
                                    }
                                    var hdfsArr = data.model.data;
                                    for (var i = 0, len = hdfsArr.length; i < len; i++) {
                                        if (hdfsArr[i].id == targetInfo['hdfs']) {
                                            targetInfo['hdfs'] = hdfsArr[i].connName;
                                            break;
                                        }
                                    }
                                    self.targetInfo = targetInfo;
                                }
                            });
                        }
                    }

                    if ( errMsg ) {
                        MsgTip('', errMsg, '');
                    }

                    // 迁移详情
                    var detailInfo = [],
                        detailTitle = [];
                    if ( [5,12].indexOf(+jobInfo.groupNo) > -1 ){   // ftp s3 到hdfs
                        if ( !jobInfo.fromList[0].usePattern ) {
                            detailTitle = ['sourcePath', 'sourceFile', 'tarPath', 'tarFile', 'size'];
                            jobInfo.groupNo == 12 ? detailTitle.unshift('srcType') : '';
                            jobInfo.fromList.map(function (v, i) {
                                detailInfo[i] = {
                                    srcType: v.directory ? common_js_lang['conf.text.dirType'] : common_js_lang['conf.text.fileType'],
                                    sourcePath: v.directory ? v.filePath : v.bucketName || v.filePath.replace(/\\/g, '/').split('/').slice(0, -1).join('/'),
                                    sourceFile: v.directory ? '' : v.key || v.filePath.replace(/\\/g, '/').split('/').slice(-1).join('/'),
                                    tarPath: v.directory ? jobInfo.toList[i].fileName : jobInfo.toList[i].fileName.split('/').slice(0, -1).join('/'),
                                    tarFile: v.directory ? '' : jobInfo.toList[i].fileName.split('/').slice(-1).join('/'),
                                    size: v.directory ? '' : self.convertFileSize(v.size)
                                };
                            });
                        }
                        else{
                            detailTitle = ['sourcePath', 'pattern', 'srcFileHandleType', 'tarPath', 'tarFile', 'tarRenameType'];
                            jobInfo.fromList.map(function (v, i) {
                                detailInfo[i] = {
                                    sourcePath: v.filePath,
                                    pattern: v.pathPattern,
                                    srcFileHandleType: [common_js_lang['conf.option.notChangeFile'], common_js_lang['conf.option.delFile'], common_js_lang['conf.option.moveFile']][+v.srcFileHandleType == 1? 0:+v.srcFileHandleType-2]+(+v.srcFileHandleType == 4? v.srcFileMoveDir:''),
                                    tarPath: jobInfo.toList[i].fileName,
                                    tarFile: [common_js_lang['conf.option.srcFile'], common_js_lang['conf.option.srcFileAdd']][+v.tarRenameType == 3 ? 1:0]+(+v.tarRenameType == 3? (v.tarRenameFormat === '_yyyyMMdd'? common_js_lang['conf.option.importDate']:common_js_lang['conf.option.importTime']):''),
                                    tarRenameType: [common_js_lang['conf.option.override'], common_js_lang['conf.option.append'], common_js_lang['conf.option.ignore'], common_js_lang['conf.option.addNumber']][+jobInfo.toList[i].tarFileHandleType-1]
                                };
                            });
                        }
                    }
                    else if ( [2,6,7].indexOf(+jobInfo.groupNo) > -1 ){  // db
                        var mtype = JSON.parse(jobInfo.otherParams).srcType,
                            tbl = ['', 'sourceTblName', 'sourceView'][+mtype];
                        if ( mtype == 3 ){
                            if ( jobInfo.toType != 8 ) {
                                detailTitle = ['sqlQuery', 'tarDbName', 'tarTblName', 'tarPart', 'ddl'];
                                jobInfo.fromList.map(function (v, i) {
                                    detailInfo[i] = {
                                        sqlQuery: v.sql,
                                        tarDbName: jobInfo.toList[i].name,
                                        tarTblName: jobInfo.toList[i].tableName,
                                        tarPart: (jobInfo.toList[i].partition || '').replace(/,/g, '<br>'),
                                        ddl: '<a>' + common_js_lang['conf.act.viewSql'] + '</a>',
                                        schema: jobInfo.toList[i].schema,
                                        catalog: jobInfo.toList[i].catalog,
                                        dbId: jobInfo.toList[i].dbId
                                    }
                                });
                            }
                            else {
                                detailTitle = ['sqlQuery', 'tarPath', 'tarFile'];
                                jobInfo.fromList.map(function (v, i) {
                                    detailInfo[i] = {
                                        sqlQuery: v.sql,
                                        tarFile: jobInfo.toList[i].fileName.split('/').slice(-1).join('/'),
                                        tarPath: jobInfo.toList[i].fileName.split('/').slice(0, -1).join('/')
                                    };
                                });
                            }
                        }
                        else if ( jobInfo.toType != 8 ){  //hive  db
                            detailTitle = ['sourceDbName', tbl, 'tarDbName', 'tarTblName', 'tarPart', 'ddl', 'whereSql', 'replacement'];
                            jobInfo.fromList.map(function(v, i){
                                try{
                                    var synch = JSON.parse(v.synchColumnMap),
                                        synchStr = synch.srcSynchColumn ? synch.srcSynchColumn.alias+' --> '+synch.tagSynchColumn.alias : '' ;
                                } catch(e) {
                                    var synchStr = '';
                                }

                                detailInfo[i] = {
                                    sourceDbName: v.name,
                                    //sourceTblName: v.tableName,
                                    tarDbName: jobInfo.toList[i].name,
                                    tarTblName: jobInfo.toList[i].tableName,
                                    tarPart: (jobInfo.toList[i].partition || '').replace(/,/g, '<br>'),
                                    ddl: '<a>'+common_js_lang['conf.act.viewSql']+'</a>',                                
                                    whereSql: v.whereSql || synchStr,
                                    replacement: jobInfo.toList[i].replaceEnter ? '<b>\'</b>'+jobInfo.toList[i].replacement+'<b>\'</b>'+self.str2tip(jobInfo.toList[i].replacement) : common_js_lang['conf.type.disable'] ,
                                    replacementStr: jobInfo.toList[i].replaceEnter ? '\''+jobInfo.toList[i].replacement+'\'' : common_js_lang['conf.type.disable'] ,
                                    dbId: jobInfo.toList[i].dbId,
                                    schema: jobInfo.toList[i].schema,
                                    catalog: jobInfo.toList[i].catalog
                                };
                                detailInfo[i][tbl] = v.tableName;
                            });
                        }
                        else { // hdfs
                            detailTitle = ['sourceDbName', tbl, 'tarPath', 'tarFile', 'whereSql', 'replacement'];
                            jobInfo.fromList.map(function(v, i){
                                detailInfo[i] = {
                                    sourceDbName: v.name,
                                    //sourceTblName: v.tableName,
                                    tarFile: jobInfo.toList[i].fileName.split('/').slice(-1).join('/'),
                                    tarPath: jobInfo.toList[i].fileName.split('/').slice(0,-1).join('/'),
                                    whereSql: v.whereSql,
                                    replacement: jobInfo.toList[i].replaceEnter ? '<b>\'</b>'+jobInfo.toList[i].replacement+'<b>\'</b>'+self.str2tip(jobInfo.toList[i].replacement) : common_js_lang['conf.type.disable'],
                                    replacementStr: jobInfo.toList[i].replaceEnter ? '\''+jobInfo.toList[i].replacement+'\'' : common_js_lang['conf.type.disable']
                                };
                                detailInfo[i][tbl] = v.tableName;
                            });
                        }
                    }
                    else if ( jobInfo.groupNo == 1 ){   // local
                        detailTitle = ['sourceFile', 'tarPath', 'tarFile', 'size'];
                        jobInfo.fromList.map(function(v, i){
                            detailInfo[i] = {
                                sourceFile: v.filePath.replace(/\\/g, '/').split('/').slice(-1).join('/'),
                                tarFile: jobInfo.toList[i].fileName.split('/').slice(-1).join('/'),
                                tarPath: jobInfo.toList[i].fileName.split('/').slice(0,-1).join('/'),
                                size: v.size && self.convertFileSize(v.size)
                            };
                        });
                    }
                    else if ( [10,11].indexOf(+jobInfo.groupNo) > -1 ){ // csv excel
                        if ( jobInfo.toType == 8 ){
                            detailTitle = ['sourceFile', 'tarFile', 'tarPath'];                            
                            jobInfo.fromList.map(function(v, i){
                                detailInfo[i] = {
                                    sourceFile: v.srcPath.replace(/\\/g, '/').split('/').slice(-1).join('/'),
                                    tarFile: jobInfo.toList[i].fileName.split('/').slice(-1).join('/'),
                                    tarPath: jobInfo.toList[i].fileName.split('/').slice(0,-1).join('/'),
                                    size: v.size && self.convertFileSize(v.size)                                    
                                };
                            });
                        }
                        else if ( jobInfo.groupNo == 10 ) {   // csv hive
                            detailTitle = ['sourceFile', 'tarDbName', 'tarTblName', 'tarPart', 'ddl', 'columnSep', 'fieldEnClosed', 'tip'];
                            jobInfo.fromList.map(function(v, i){
                                detailInfo[i] = {
                                    sourceFile: v.srcPath.replace(/\\/g, '/').split('/').slice(-1).join('/'),
                                    tarDbName: jobInfo.toList[i].name,
                                    tarTblName: jobInfo.toList[i].tableName,
                                    tarPart: (jobInfo.toList[i].partition || '').replace(/,/g, '<br>'),
                                    ddl: '<a>'+common_js_lang['conf.act.viewSql']+'</a>',
                                    columnSep: '<b>\'</b>'+ v.columnSep+'<b>\'</b>'+self.str2tip(v.columnSep),
                                    columnSepStr: '\''+ v.columnSep+'\'',
                                    fieldEnClosed: v.fieldEnClosed || '',
                                    tip: common_js_lang['conf.text.dataLineNo'].replace(/\[x\]/, '['+v.dataLineNo+']'),
                                    dbId: jobInfo.toList[i].dbId,
                                    schema: jobInfo.toList[i].schema,
                                    catalog: jobInfo.toList[i].catalog
                                };
                            });
                        }
                        else {   // excel hive
                            detailTitle = ['sourceFile', 'sourceTblName', 'tarDbName', 'tarTblName', 'tarPart', 'ddl', 'tip'];
                            var excelIndex = 0;
                            jobInfo.fromList.map(function(v, i){
                                v.sheets.map(function(vv, ii){
                                    detailInfo[excelIndex] = {
                                        sourceFile: v.srcPath.replace(/\\/g, '/').split('/').slice(-1).join('/'),
                                        sourceTblName: vv.name,
                                        tarDbName: jobInfo.toList[i][vv.index].name,
                                        tarTblName: jobInfo.toList[i][vv.index].tableName,
                                        tarPart: (jobInfo.toList[i][vv.index].partition || '').replace(/,/g, '<br>'),
                                        ddl: '<a>'+common_js_lang['conf.act.viewSql']+'</a>',                               
                                        tip: common_js_lang['conf.text.dataLineNo'].replace(/\[x\]/, '['+(+vv.dataRowIndex+1)+']'),
                                        dbId: jobInfo.toList[i][vv.index].dbId,
                                        schema: jobInfo.toList[i][vv.index].schema,
                                        catalog: jobInfo.toList[i][vv.index].catalog
                                    };
                                    excelIndex ++ ;
                                });
                            });                           
                        }
                    }
                    else if ( jobInfo.groupNo == 4 ){ //dump
                        if ( jobInfo.toType == 8 ){
                            detailTitle = ['sourceFile', 'sourceTblName', 'tarPath', 'tarFile', 'size'];
                            jobInfo.fromList.map(function(v, i){
                                detailInfo[i] = {
                                    // sourcePath: v.srcPath.replace(/\\/g, '/').split('/').slice(0,-1).join('/'),
                                    sourceFile: v.srcPath.replace(/\\/g, '/').split('/').slice(-1).join('/'),
                                    sourceTblName: v.tableName,
                                    tarPath: jobInfo.toList[i].fileName.split('/').slice(0,-1).join('/'),                                
                                    tarFile: jobInfo.toList[i].fileName.split('/').slice(-1).join('/'),
                                    size: self.convertFileSize(v.size)
                                };
                            });
                        }
                        else {
                            detailTitle = ['sourceFile', 'sourceTblName', 'tarDbName', 'tarTblName', 'tarPart', 'ddl'];                            
                            jobInfo.fromList.map(function(v, i){
                                detailInfo[i] = {
                                    // sourcePath: v.srcPath.replace(/\\/g, '/').split('/').slice(0,-1).join('/'),
                                    sourceFile: v.srcPath.replace(/\\/g, '/').split('/').slice(-1).join('/'),
                                    sourceTblName: v.tableName,
                                    tarDbName: jobInfo.toList[i].name,                                
                                    tarTblName: jobInfo.toList[i].tableName,
                                    tarPart: (jobInfo.toList[i].partition || '').replace(/,/g, '<br>'),
                                    ddl: '<a>'+common_js_lang['conf.act.viewSql']+'</a>',                               
                                    dbId: jobInfo.toList[i].dbId,
                                    schema: jobInfo.toList[i].schema,
                                    catalog: jobInfo.toList[i].catalog
                                };
                            });
                        }
                    }
                    else {  //hive 2 hive
                        var mtype = JSON.parse(jobInfo.otherParams).srcType,
                            tbl = ['', 'sourceTblName', 'sourceView'][+mtype];
                        detailTitle = ['sourceDbName', tbl, 'fromIsPart', 'tarDbName', 'tarTblName', 'ddl', 'toIsPart', 'hivePartConf'];
                        self.detailInfo = $.extend({}, detailInfo);
                        jobInfo.fromList.map(function(v, i){
                            detailInfo[i] = {
                                sourceDbName: v.name,
                                fromIsPart: v.partitionTable ? common_js_lang['db.text.yes']:common_js_lang['conf.text.no'],
                                toIsPart: jobInfo.toList[i].partitionTable ? common_js_lang['db.text.yes']:common_js_lang['conf.text.no'],
                                isViewPart: jobInfo.toList[i].partitionTable? 1: 0,
                                tarDbName: jobInfo.toList[i].name,
                                tarTblName: jobInfo.toList[i].tableName,
                                ddl: '<a>'+common_js_lang['conf.act.viewSql']+'</a>',
                                hivePartConf: jobInfo.toList[i].partition || '',
                                dbId: jobInfo.toList[i].dbId,
                                schema: jobInfo.toList[i].schema,
                                catalog: jobInfo.toList[i].catalog,
                                useSynchronized: v.useSynchronized,
                                tarPartHandleType: v.tarPartHandleType
                            };
                            detailInfo[i][tbl] = v.tableName;
                            if ( jobInfo.toList[i].partition ){
                                var tarPart = JSON.parse(jobInfo.toList[i].partition),
                                    tarPartArr = [];
                                if ( !v.partitionTable ) {  //源表为非分区表
                                    tarPart[0].split(',').map(function (vv, ii) {
                                        var arr = vv.split('='),
                                            key = arr[0],
                                            val = arr.slice(1).join('=');
                                        tarPartArr.push({key: key, val: val});
                                    });
                                    detailInfo[i].hivePartConf = {tarPart:tarPartArr};
                                }
                                else {    //源表为分区表
                                    var fromPart = JSON.parse(v.partition);
                                    var tarArr = tarPart[0].split(','),
                                        fromArr = fromPart[0].split(','),
                                        tarColumn = [],
                                        fromColumn = [];
                                    tarArr.map(function(vv, ii){
                                        tarColumn.push( vv.split('=')[0] );
                                    });
                                    fromArr.map(function(vv, ii){
                                        fromColumn.push( vv.split('=')[0] );
                                    });
                                    detailInfo[i].hivePartConf = {tarColumn:tarColumn, fromPart:fromPart, tarPart:tarPart};
                                }
                            }

                            //if ( v.useSynchronized ){  //增量同步 case
                            //    self.getExpPart(jobInfo, i);
                            //}
                        });
                    }
                    self.detailTitle = detailTitle;
                    self.detailInfo = detailInfo;
                    self.detailHeadClass = detailInfo.length > 10 ? 'scroll' : '' ;
                    Vue.nextTick(function(){
                        $('.infoCon [rel=tipsy]').tipsy({fade: true,gravity:'n',html:true});
                        var srcSql = $('.detailCon #detail .infoCon .showDdl .srcSql textarea');
                        srcSql.length > 0 && CodeMirror.fromTextArea(srcSql[0], {
                            lineNumbers: true
                        });
                    });
                } catch (e){
                     ErrTip('', e, '');
                }
            },
            complete: function(){
                self.maskShow = false;
            }
        })
    },
    computed: {
    },
    methods: {
        srcSql : function($event){
            console.log('refresh');
          $(this.$refs.area).find('.CodeMirror')[0].CodeMirror.refresh();
        },
        getExpPart: function(jobInfo, i){
            this.gotPart[i] = true;
            this.maskShow = true;
            var expPart = JSON.parse(jobInfo.toList[i].partitionExpDefault);
            var tarColumn = [], srcColumn = [],
                tarDefer = $.Deferred(), srcDefer = $.Deferred() ;
            $.ajax({
                url: 'db/table/partitions',
                type: 'post',
                data: {dbId: jobInfo.fromId, catalog:jobInfo.fromList[i].catalog, schema:jobInfo.fromList[i].schema, tableName: jobInfo.fromList[i].tableName},
                success: function(data){
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }
                    srcColumn = data.model.map(function(vv, ii){
                        return vv.name;
                    });
                },
                complete: function(){
                    srcDefer.resolve();
                }
            });
            $.ajax({
                url: 'db/table/partitions',
                type: 'post',
                data: {dbId: jobInfo.toId, catalog:jobInfo.fromList[i].catalog, schema:jobInfo.toList[i].schema, tableName: jobInfo.toList[i].tableName},
                success: function(data){
                    if ( data.code != 200 ){
                        ErrTip(data.i18nMsg.title, data.i18nMsg.detail, data.msg);
                        return ;
                    }
                    tarColumn = data.model.map(function(vv, ii){
                        return vv.name;
                    });
                },
                complete: function(){
                    tarDefer.resolve();
                }
            });
            var self = this;
            $.when( srcDefer, tarDefer).then(function(){
                self.detailInfo[i].hivePartConf = { tarColumn:tarColumn, srcColumn: srcColumn, expPart:expPart };
                Vue.set(self.detailInfo, i, self.detailInfo[i]);
            }).always(function(){
                self.maskShow = false;
                Vue.set(self.partShow, i, true);
            });
        },
        str2tip: function(str){
            if ( str === '' ){
                return '('+common_js_lang['db.info.emptyString']+')' ;
            }
            if ( str.match(/^\s+$/) ){
                return '('+(str.match(/\s/g).length+common_js_lang['db.text.space'])+')';
            }
            return '';
        },
        time2str: function(time){
            if ( !time )
                return '';
            var _startDate = new Date(time),
                _year = _startDate.getFullYear(),
                _month = _startDate.getMonth()+1,
                _day = _startDate.getDate() ;
            _month < 10 && (_month = '0'+_month);
            _day < 10 && (_day = '0'+_day);
            return _year+'-'+_month+'-'+_day;
        },
        regularState: function (param){
            var cron = param.cronExpression;
            var cronGlobalParam = {
                startTimeStr: this.time2str(param.startTime),
                endTimeStr: this.time2str(param.endTime)
            };
            var state = '';
            if ( param.periodType == 0 ){
                return common_js_lang['job.period.PeriodOnceImmed'];
            }

            if ( param.periodType == 1 ){
                var arr = cron.split(' ');
                var date = arr[6]+'-'+(+arr[4]>=10?arr[4]:'0'+arr[4])+'-'+(+arr[3]>=10?arr[3]:'0'+arr[3]),
                    time = (+arr[2] >= 10 ? arr[2] : '0'+arr[2])+':'+(+arr[1]>=10? arr[1]:'0'+arr[1])+':'+(+arr[0]>=10?arr[0]:'0'+arr[0]) ;

                return common_js_lang['cron.text.exec1']+' ['+date+' '+time+']';
            }

            if ( cron.slice(-5) == '* * ?' ){
                state += common_js_lang['cron.text.hourTy']+',';
                var arr = cron.split(' ');
                state += common_js_lang['cron.text.timeIs']+' ['+(+arr[1]>= 10? arr[1]:'0'+arr[1])+':'+(+arr[0]>= 10? arr[0]:'0'+arr[0])+']';
            }
            else if ( cron.slice(-3) == '* ?' ) {
                var arr = cron.split(' ');
                state += common_js_lang['cron.text.dayTy']+','+common_js_lang['cron.text.timeIs']+' ['+(+arr[2] >= 10 ? arr[2] : '0'+arr[2])+':'+(+arr[1]>=10? arr[1]:'0'+arr[1])+':'+(+arr[0]>=10?arr[0]:'0'+arr[0])+']';
            }
            else if ( cron.slice(-1) == '?' ){
                var arr = cron.split(' ');
                var d = arr[3];
                state += common_js_lang['cron.text.monthTy']+','+common_js_lang['cron.text.timeIs']+(d == 'L'? '['+common_js_lang['client.text.lastDay']+']':common_js_lang['cron.text.dayNum'].replace(/\[x\]/, "["+d+"]"))+' ['+(+arr[2] >= 10 ? arr[2] : '0'+arr[2])+':'+(+arr[1]>=10? arr[1]:'0'+arr[1])+':'+(+arr[0]>=10?arr[0]:'0'+arr[0])+']';
            }
            else {
                var arr = cron.split(' ');
                var w = arr[5].split(','
                );
                state += common_js_lang['cron.text.weekTy']+','+common_js_lang['cron.text.timeIs']+' [ ';        
                w.map(function(v){
                    state += [common_js_lang['client.text.sun'], common_js_lang['client.text.Mon'], common_js_lang['client.text.Tue'], common_js_lang['client.text.wed'], common_js_lang['client.text.thu'], common_js_lang['client.text.fri'], common_js_lang['client.text.sat']][+v-1]+' ' ;
                });
                state += '] ['+(+arr[2] >= 10 ? arr[2] : '0'+arr[2])+':'+(+arr[1]>=10? arr[1]:'0'+arr[1])+':'+(+arr[0]>=10?arr[0]:'0'+arr[0])+'] ' ;
            }

            if ( !cronGlobalParam.endTimeStr )
                state += ' .'+common_js_lang['cron.text.from']+' '+cronGlobalParam.startTimeStr+' '+common_js_lang['cron.text.startEff']+'.';
            else
                state += ' '+common_js_lang['cron.text.valid']+' '+cronGlobalParam.startTimeStr+' '+common_js_lang['client.text.to']+' '+ cronGlobalParam.endTimeStr;    

            return state;
        },
        dateFormat: function(date, format){
            date = new Date(date);
            var map = {
                "M": date.getMonth() + 1, //月份 
                "d": date.getDate(), //日 
                "h": date.getHours(), //小时 
                "m": date.getMinutes(), //分 
                "s": date.getSeconds(), //秒 
                "q": Math.floor((date.getMonth() + 3) / 3), //季度 
                "S": date.getMilliseconds() //毫秒 
            };
            format = format.replace(/([yMdhmsqS])+/g, function(all, t){
                var v = map[t];
                if(v !== undefined){
                    if(all.length > 1){
                        v = '0' + v;
                        v = v.substr(v.length-2);
                    }
                    return v;
                }
                else if(t === 'y'){
                    return (date.getFullYear() + '').substr(4 - all.length);
                }
                return all;
            });
            return format;
        },
        parsePart: function(partition){
            if ( !partition ) 
                return ;
            var partArr = partition.split(','),
                partObj = {} ;
            partArr.map(function(v){
                var tmpArr = v.split('=');
                partObj[tmpArr[0]] = tmpArr[1].replace(/^\'|\'$/g, '') ;
            });
        },
        convertFileSize: function(byte){
            byte = byte || 0;
            if ( byte < 1024 )
                return (byte || 0)+' bytes';
            else if ( byte / 1024 < 1024 )
                return (byte/1024).toFixed(2)+' KB';
            else
                return (byte/1024/1024).toFixed(2)+' MB';
        },
        getDdl: function(param, i, event){
            this.y[i] = event.pageY;

            var tmpShow = !this.ddlShow[i];
            this.ddlShow = [false];
            Vue.set(this.ddlShow, i, tmpShow);

            var self = this ;
            if ( self.detailInfo[i].sql ) {
                setTimeout(function(){self.codeMirrorItems[i].refresh();}, 0);
                return;
            }

            if ( self.ddlAjaxHandle[i] )
                return ;
            self.ddlAjaxHandle[i] = true;
            $.ajax({
                url: 'db/table/ddl/show',
                data: param,
                success: function(data){
                    var sql = '';
                    if ( data.code != 200 ){
                        self.detailInfo[i].sql = data.msg ;                        
                    }
                    else {
                        self.detailInfo[i].sql = data.model.ddl ;
                    }
                    Vue.set(self.detailInfo, i, self.detailInfo[i]);
                    setTimeout(function() {
                        self.codeMirrorItems[i] = CodeMirror.fromTextArea($('.detailCon #detail .infoCon .flex-item').eq(i).find('.showDdl .content textarea')[0], {
                            lineNumbers: true
                        });
                    }, 0);
                }
            });
        },
        ddlOut: function(i){
            Vue.set(this.ddlShow, i, false);            
        },
        ddlOver: function(i){
            Vue.set(this.ddlShow, i, true);            
        },
        whereSqlOut: function(i){
            Vue.set(this.whereSqlShow, i, false);
        },
        whereSqlOver: function(i){
            Vue.set(this.whereSqlShow, i, true);
        },
        partOut: function(i){
            Vue.set(this.partShow, i, false);
        },
        partOver: function(i){
            Vue.set(this.partShow, i, true);
            if ( !this.gotPart[i] && this.jobInfo.fromList[i].useSynchronized ){  //增量同步 case
                this.getExpPart(this.jobInfo, i);  //出现loading，导致Over失效，需要重新设置partShow:true
            }
        }
    }
});