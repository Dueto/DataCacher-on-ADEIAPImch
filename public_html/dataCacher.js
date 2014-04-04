(function(window)
{
    var dataCacher = function()
    {
        var me = {};

        me.dataHandl = new dataHandler();
        me.dateHelper = new dateTimeFormat();

        me.db = '';
        me.clientsCallback = '';
        me.level = '';
        me.columns = '';
        me.db_items = '';
        me.isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

        me.getData = function(db_server,
                db_name,
                db_group,
                db_mask,
                window,
                pointCount,
                onEndCallBack)
        {
            var self = this;

            self.clientsCallback = onEndCallBack;
            if (self.dataHandl.isPriviousRequest())
            {
                if (db_mask != 'all')
                {
                    self.db_items = db_mask.split(',');
                }
                else
                {
                    self.db_items = self.dataHandl.getDbMask();
                }
                self.dataHandl.setRequest(window, pointCount);
                self.level = self.dataHandl.level;
                self.columns = self.formTableColumns();

                self.onReadyFormingRequest(db_server, db_name, db_group, window);
            }
            else
            {
                self.db.transaction(function(req)
                {
                    var sql = 'SELECT * FROM DataSource WHERE ((db_server="' + db_server + '") AND (db_name="' + db_name + '")) AND ((db_group="' + db_group + '"))'
                    req.executeSql(sql, [], function(req, results)
                    {
                        if (results.rows.length == 0)
                        {
                            if (db_mask != 'all')
                            {
                                self.db_items = db_mask.split(',');
                                db_mask = self.formDbMask(db_server, db_name, db_group);
                            }
                            else
                            {
                                db_mask = self.formDbMask(db_server, db_name, db_group);
                                self.db_items = db_mask;
                            }

                            self.dataHandl.setLabels(self.formLabels());
                            self.dataHandl.setMaxLevel(self.formMaxLevel(db_server, db_name, db_group));
                            self.dataHandl.setNewRequest(db_server, db_name, db_group, db_mask, window, pointCount);

                            self.level = self.dataHandl.level;
                            self.columns = self.formTableColumns();

                            self.onReadyFormingRequest(db_server, db_name, db_group, window);
                        }
                        else
                        {
                            if (db_mask != 'all')
                            {
                                self.db_items = db_mask.split(',');
                                db_mask = results.rows.item(0).db_items.split(',');
                            }
                            else
                            {
                                db_mask = results.rows.item(0).db_items.split(',');
                                self.db_items = db_mask;
                            }

                            self.dataHandl.setLabels(results.rows.item(0).labels.split(','));
                            self.dataHandl.setMaxLevel(results.rows.item(0).maxlevel);
                            self.dataHandl.setNewRequest(db_server, db_name, db_group, db_mask, window, pointCount);


                            self.level = self.dataHandl.level;
                            self.columns = self.formTableColumns();

                            self.onReadyFormingRequest(db_server, db_name, db_group, window);
                        }
                    });
                });
            }
        };

        me.onReadyFormingRequest = function(db_server, db_name, db_group, window)
        {
            var self = this;
            if (self.dateHelper.checkWindowFormat(window))
            {
                self.db.transaction(function(req)
                {

                    var sqlStatement = 'SELECT * FROM DataSource WHERE ((db_server="' + db_server + '") AND (db_name="' + db_name + '")) AND ((db_group="' + db_group + '") AND (level="' + self.level.window + '"))';
                    ;
                    req.executeSql(sqlStatement, [], function(req, results)
                    {
                        if (results.rows.length == 0)
                        {
                            var url = self.formURL(db_server, db_name, db_group, window, self.level.window);
                            var csv = new RGraph.CSV(url, function(csv)
                            {
                                var objData = self.dataHandl.parseData(csv);
                                if (objData.dateTime.length != 0)
                                {
                                    if (objData.data[0].length < 20000)
                                    {
                                        var clone = self.splitData(objData);
                                        self.clientsCallback(clone);
                                        if (!self.isFirefox)
                                        {
                                            self.dataHandl.startBackgroundCaching(self.level, self.columns);
                                            self.dataHandl.startBackgroundCaching(self.dataHandl.getDataLevelForBackgr(self.level), self.columns);
                                        }
                                        else
                                        {
                                            /* self.db.transaction(function(req)
                                             {
                                             var idDataSource;
                                             req.executeSql('INSERT OR REPLACE INTO DataSource \n\
                                             (db_server, db_name, db_group, level ) VALUES ("'
                                             + db_server
                                             + '","' + db_name
                                             + '","' + db_group
                                             + '","' + self.level.window + '")');
                                             req.executeSql('SELECT id FROM DataSource WHERE \n\
                                             db_server = "' + db_server + '" AND \n\
                                             db_name = "' + db_name + '" AND \n\
                                             db_group = "' + db_group + '" AND \n\
                                             level = "' + self.level.window + '"', [], function(req, results)
                                             {
                                             idDataSource = results.rows.item(0).id;
                                             self.columns = self.formTableColumns();
                                             req.executeSql('CREATE TABLE IF NOT EXISTS "' + idDataSource
                                             + '" (DateTime NOT NULL UNIQUE' + self.columns + ')');
                                             req.executeSql('CREATE INDEX IF NOT EXISTS DateTimeIndex ON "'
                                             + idDataSource + '" (DateTime)');

                                             for (var p = 0; p < objData.dateTime.length; p++)
                                             {
                                             req.executeSql('INSERT OR REPLACE INTO "'
                                             + idDataSource
                                             + '" (DateTime ' + self.columns + ') ' + 'VALUES '
                                             + '("' + objData.dateTime[p] + '"'
                                             + self.formValues(objData.data, p) + ')');
                                             }
                                             });
                                             },
                                             self.onError,
                                             self.onReadyTransaction);*/
                                        }
                                    }
                                    else
                                    {
                                        self.clientsCallback(objData);
                                        throw 'Too much points in request.'
                                    }
                                }
                                else
                                {
                                    self.clientsCallback(null);
                                    throw 'There is no data in server responces.';
                                }

                            });

                        }
                        else
                        {
                            var counter = 0;
                            var idDataSource = results.rows.item(0).id;

                            var beginTime = self.dateHelper.splitTimeFromUnix(window.split('-')[0]);
                            var endTime = self.dateHelper.splitTimeFromUnix(window.split('-')[1]);

                            var formatedBeginTime = self.dataHandl.formatDate(beginTime);
                            var formatedEndTime = self.dataHandl.formatDate(endTime);

                            self.db.transaction(function(req)
                            {
                                var sqlStatement = 'SELECT * FROM "' + idDataSource + '" WHERE  (DateTime) <=  "' + endTime + '" AND (DateTime) >= "' + beginTime + '" ORDER BY DateTime';
                                req.executeSql(sqlStatement, [], function(counter) {
                                    return function(req, res)
                                    {
                                        if (res.rows.length != 0)
                                        {
                                            var dataBuffer = [];
                                            var dateTime = [];
                                            var labels = [];
                                            var flag = false;

                                            self.dataHandl.concatRowData(res, dataBuffer, dateTime);
                                            labels = self.dataHandl.getLabels();

                                            if (!self.isFirefox)
                                            {
                                                objData = {data: dataBuffer, dateTime: dateTime, label: labels};
                                                var clone = self.splitData(objData);
                                                self.dataHandl.startBackgroundCaching(self.dataHandl.getDataLevelForBackgr(self.level), self.columns);
                                                self.clientsCallback(clone);
                                            }
                                            else
                                            {
                                                var returnedBeginTime = (dateTime[0]);
                                                var returnedEndTime = (dateTime[dateTime.length - 1]);

                                                var formatedReturnedBeginTime = self.dataHandl.formatDate(returnedBeginTime);
                                                var formatedReturnedEndTime = self.dataHandl.formatDate(returnedEndTime);

                                                if (formatedBeginTime == formatedReturnedBeginTime
                                                        && formatedEndTime == formatedReturnedEndTime)
                                                {
                                                    flag = true;

                                                    self.clientsCallback({data: dataBuffer, dateTime: dateTime, label: labels});

                                                }
                                                if (formatedReturnedBeginTime > formatedBeginTime
                                                        && formatedReturnedEndTime == formatedEndTime)
                                                {
                                                    var b = Date.parse(beginTime) / 1000;
                                                    var e = Date.parse(returnedBeginTime) / 1000;
                                                    var needenTime = b + '-' + e;

                                                    flag = true;
                                                    self.requestLeftData(db_server,
                                                            db_name,
                                                            db_group,
                                                            needenTime,
                                                            self.level.window,
                                                            idDataSource,
                                                            dataBuffer,
                                                            dateTime,
                                                            function(data)
                                                            {
                                                                if (data == null)
                                                                {
                                                                    self.clientsCallback({data: dataBuffer, dateTime: dateTime, label: labels});
                                                                }
                                                                else
                                                                {
                                                                    self.clientsCallback(data);
                                                                }
                                                            });
                                                }
                                                if (formatedReturnedBeginTime == formatedBeginTime
                                                        && formatedReturnedEndTime < formatedEndTime)
                                                {
                                                    var e = Date.parse(endTime) / 1000;
                                                    var b = Date.parse(returnedEndTime) / 1000;
                                                    var needenTime = b + '-' + e;

                                                    self.requestRightData(db_server,
                                                            db_name,
                                                            db_group,
                                                            needenTime,
                                                            self.level.window,
                                                            idDataSource,
                                                            dataBuffer,
                                                            dateTime,
                                                            function(data)
                                                            {
                                                                if (data == null)
                                                                {
                                                                    self.clientsCallback({data: dataBuffer, dateTime: dateTime, label: labels});
                                                                }
                                                                else
                                                                {
                                                                    self.clientsCallback(data);
                                                                }
                                                            });
                                                }
                                                if (formatedBeginTime < formatedReturnedBeginTime
                                                        && formatedEndTime > formatedReturnedEndTime)
                                                {
                                                    var e = Date.parse(returnedBeginTime) / 1000;
                                                    var b = Date.parse(returnedEndTime) / 1000;

                                                    var needenTime1 = b + '-' + Date.parse(endTime) / 1000;
                                                    var needenTime2 = (Date.parse(beginTime) / 1000) + '-' + e;

                                                    flag = true;
                                                    self.requestRightData(db_server,
                                                            db_name,
                                                            db_group,
                                                            needenTime1,
                                                            self.level.window,
                                                            idDataSource,
                                                            [],
                                                            [],
                                                            function(objRightData)
                                                            {
                                                                self.requestLeftData(db_server,
                                                                        db_name,
                                                                        db_group,
                                                                        needenTime2,
                                                                        self.level.window,
                                                                        idDataSource,
                                                                        dataBuffer,
                                                                        dateTime,
                                                                        function(objLeftData)
                                                                        {
                                                                            if (objLeftData != null && objRightData != null)
                                                                            {
                                                                                for (var i = 0; i < objLeftData.data.length; i++)
                                                                                {
                                                                                    objLeftData.data[i] = objLeftData.data[i].concat(objRightData.data[i]);
                                                                                }
                                                                                objLeftData.dateTime = objLeftData.dateTime.concat(objRightData.dateTime);
                                                                                self.clientsCallback(objLeftData);
                                                                            }
                                                                            else
                                                                            {
                                                                                self.clientsCallback({data: dataBuffer, dateTime: dateTime, label: labels});
                                                                            }
                                                                        });
                                                            });
                                                }

                                            }
                                        }
                                        else
                                        {
                                            self.insertNeedenData(db_server,
                                                    db_name,
                                                    db_group,
                                                    window,
                                                    self.level.window,
                                                    idDataSource);
                                        }
                                    };
                                }(counter));
                            },
                                    self.onError,
                                    self.onReadyTransaction);



                        }

                    },
                            self.onErrorSql);

                }, self.onError,
                        self.onReadyTransaction);
            }
            else
            {
                console.log('Bad window format.');
            }
        };

        me.requestRightData = function(db_server,
                db_name,
                db_group,
                window,
                level,
                idDataSource,
                dataBuffer,
                dateTime,
                onEndCallBack)
        {
            var self = this;
            var url = self.formURL(db_server, db_name, db_group, window, level);
            var csv = RGraph.CSV(url, function(csv)
            {
                var objData = self.dataHandl.parseData(csv);
                if (objData.dateTime.length != 0)
                {
                    var clone = {};
                    clone.data = objData.data.slice(0);
                    clone.dateTime = objData.dateTime.slice(0);
                    clone.label = objData.label.slice(0);

                    self.insertData(clone, idDataSource);

                    for (var i = 0; i < dataBuffer.length; i++)
                    {
                        dataBuffer[i] = dataBuffer[i].concat(objData.data[i]);
                    }
                    dateTime = dateTime.concat(objData.dateTime);

                    objData.data = dataBuffer;
                    objData.dateTime = dateTime;

                    var obj = self.splitData(objData);

                    onEndCallBack(obj);
                }
                else
                {
                    onEndCallBack(null);
                }
            });

        };

        me.splitData = function(objData)
        {
            var self = this;
            if (self.db_items == self.dataHandl.getDbMask())
            {
                return objData;
            }
            var clone = {};
            clone.data = [];
            clone.dateTime = objData.dateTime;
            clone.label = [];
            for (var i = 0; i < self.db_items.length; i++)
            {
                clone.data.push(objData.data[self.db_items[i]]);
                clone.label.push(objData.label[self.db_items[i]]);
            }
            return clone;
        };

        me.formTableColumns = function()
        {
            var self = this;
            var db_mask = self.dataHandl.getDbMask();
            var columns = '';
            for (var i = 0; i < db_mask.length; i++)
            {
                //var formatLabel = labels[i].split(" ").join("_");
                columns = columns + ', column' + db_mask[i];
            }
            return columns;
        };

        me.formLabels = function()
        {
            var self = this;
            var url = self.formURLList(self.dataHandl.getDbServer(), self.dataHandl.getDbName(), self.dataHandl.getDbGroup(), 'items');
            var responseXML = self.httpGet(url);
            var items = responseXML.getElementsByTagName('Value');
            var labels = [];

            for (var i = 0; i < items.length; i++)
            {
                labels.push(items[i].getAttribute('name'));
            }
            return labels;
        };

        me.formLabelList = function(db_server, db_name, db_group)
        {
            var self = this;
            var url = self.formURLList(db_server, db_name, db_group, 'items');
            var responseXML = self.httpGet(url);
            var items = responseXML.getElementsByTagName('Value');
            var labels = [];

            for (var i = 0; i < items.length; i++)
            {
                labels.push(items[i].getAttribute('name'));
            }
            return labels;
        };

        me.formValues = function(data, i)
        {
            var values = '';
            for (var j = 0; j < data.length; j++)
            {
                values = values + ',' + data[j][i];
            }
            return values;
        };

        me.requestLeftData = function(db_server,
                db_name,
                db_group,
                window,
                level,
                idDataSource,
                dataBuffer,
                dateTime,
                onEndCallBack)
        {
            var self = this;
            var url = self.formURL(db_server, db_name, db_group, window, level);

            var csv = RGraph.CSV(url, function(csv)
            {
                var objData = self.dataHandl.parseData(csv);
                if (objData.dateTime.length != 0)
                {
                    var clone = {};
                    clone.data = objData.data.slice(0);
                    clone.dateTime = objData.dateTime.slice(0);
                    clone.label = objData.label.slice(0);

                    self.insertData(clone, idDataSource);

                    for (var i = 0; i < objData.data.length; i++)
                    {
                        objData.data[i] = objData.data[i].concat(dataBuffer[i]);
                    }
                    objData.dateTime = objData.dateTime.concat(dateTime);

                    var obj = self.splitData(objData);

                    onEndCallBack(obj);
                }
                else
                {
                    onEndCallBack(null);
                }
            });
        };




        me.insertNeedenData = function(db_server,
                db_name,
                db_group,
                window,
                level,
                idDataSource)
        {
            var self = this;
            var url = self.formURL(db_server, db_name, db_group, window, level);

            var csv = RGraph.CSV(url, function(csv)
            {
                var objData = self.dataHandl.parseData(csv);
                if (objData.dateTime.length != 0)
                {
                    var obj = self.splitData(objData);
                    self.clientsCallback(obj);
                    self.insertData(objData, idDataSource);
                }
                else
                {
                    self.clientsCallback(null);
                }
            });
        };

        me.openDataBase = function(name)
        {
            if (this.db == '')
            {
                this.db = window.openDatabase(name, '1.0', '', 50 * 1024 * 1024);
            }
        };

        me.formDataBase = function()
        {
            this.db.transaction(function(req)
            {
                req.executeSql('CREATE TABLE IF NOT EXISTS DataSource \n\
                                (id INTEGER PRIMARY KEY AUTOINCREMENT,db_server,db_name,db_group, level, db_items, maxlevel, labels)', [],
                        function(res, rows) {
                        },
                        this.onErrorSql);
            },
                    this.onError,
                    this.onReadyTransaction);
        };

        me.insertData = function(objData, idDataSource)
        {
            var self = this;
            self.db.transaction(function(req)
            {
                for (var i = 0; i < objData.dateTime.length; i++)
                {
                    var sqlStatement = 'INSERT OR REPLACE INTO "' + idDataSource + '" (DateTime' + self.columns + ') '
                            + 'VALUES ' + '("' + objData.dateTime[i] + '"' + self.formValues(objData.data, i) + ')';
                    req.executeSql(sqlStatement, [], function(res, rows) {
                    }, self.onErrorSql);
                }
            },
                    self.onError,
                    self.onReadyTransaction);
        };

        me.onReadyTransaction = function()
        {
            // console.log('Transaction completed.');
        };

        me.onError = function(err)
        {
            console.log(err);
        };

        me.onErrorSql = function(asd, err)
        {
            console.log(err.toString());
        };

        me.onReadySql = function()
        {
            console.log('Executing SQL completed.');
        };

        me.formURL = function(db_server, db_name, db_group, window, level)
        {
            var url = 'http://ipecluster5.ipe.kit.edu/ADEI/ADEIWS/services/getdata.php?db_server=' + db_server
                    + '&db_name=' + db_name
                    + '&db_group=' + db_group
                    + '&db_mask=all'
                    + '&experiment=' + window
                    + '&window=0'
                    + '&resample=' + level
                    + '&format=csv';
            return url;
        };

        me.formURLList = function(db_server, db_name, db_group, target)
        {
            var url = 'http://ipecluster5.ipe.kit.edu/ADEI/ADEIWS/services/list.php?db_server=' + db_server
                    + '&db_name=' + db_name
                    + '&db_group=' + db_group
                    + '&target=' + target;
            return url;
        };

        me.formMaxLevel = function(db_server, db_name, db_group)
        {
            var self = this;
            var url = self.formURLList(db_server, db_name, db_group, 'max_resolution');
            var responseXML = self.httpGet(url);
            var item = responseXML.getElementsByTagName('Value');
            return item[0].getAttribute('value');
        };

        me.formDbMask = function(db_server, db_name, db_group)
        {
            var self = this;
            var url = self.formURLList(db_server, db_name, db_group, 'items');
            var responseXML = self.httpGet(url);
            var items = responseXML.getElementsByTagName('Value');
            var mask = [];

            for (var i = 0; i < items.length; i++)
            {
                mask.push(items[i].getAttribute('value'));
            }
            var db_mask = mask;

            return db_mask;
        };

        me.httpGet = function(url)
        {
            var xmlHttp = null;

            xmlHttp = new XMLHttpRequest();
            xmlHttp.open("GET", url, false);
            xmlHttp.send(null);
            return xmlHttp.responseXML;
        };

        me.openDataBase('DB');
        me.formDataBase();

        return me;





    };

    window.dataCacher = dataCacher;


})(window);



