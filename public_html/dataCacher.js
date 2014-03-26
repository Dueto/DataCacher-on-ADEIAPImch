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
          self.dataHandl.flushData();
          self.dataHandl.setRequest(db_server, db_name, db_group, db_mask, window, pointCount);          
          self.level = self.dataHandl.level;           
          if(db_mask != 'all')
          {
              db_mask = db_mask.split(',');
          }
          else
          {
              db_mask = self.formDbMask(db_server, db_name, db_group);
          }
          if(self.dateHelper.checkWindowFormat(window))
          {              
                self.db.transaction(function(req)
                {                     
                   req.executeSql('SELECT * FROM DataSource WHERE db_server = "' + db_server + '" AND \n\
                                                                  db_name = "' + db_name + '" AND \n\
                                                                  db_group = "' + db_group + '" AND \n\
                                                                    level = "' + self.level.window + '"', [], function (req, results)
  //                 req.executeSql('SELECT * FROM DataSource WHERE db_server = ? AND db_name = ? AND db_group = ? AND level = ?', [db_server,db_name,db_group,self.level.window], function (req, results)
                   
                   {         
                      if(results.rows.length == 0)
                      {  
                          var url = self.formURL(db_server, db_name, db_group, window, self.level.window);  
                          var csv = new RGraph.CSV(url, function(csv)
                          {                                   
                                var objData = self.dataHandl.parseData(csv);
                                if (objData.dateTime.length != 0) 
                                {        
                                    if(objData.data[0].length < 50000)
                                    {
                                       var clone = self.splitData(objData, db_mask);
                                       self.clientsCallback(clone);                                       
                                       self.db.transaction(function(req)
                                       {
                                           var idDataSource;
                                           req.executeSql('INSERT OR REPLACE INTO DataSource (db_server, db_name, db_group, level ) VALUES ("' + db_server + '","' + db_name + '","' + db_group + '","' + self.level.window + '")');    
                                           req.executeSql('SELECT id FROM DataSource WHERE db_server = "' + db_server + '" AND \n\
                                                                     db_name = "' + db_name + '" AND \n\
                                                                     db_group = "' + db_group + '" AND \n\
                                                                     level = "' + self.level.window + '"', [], function (req, results)
                                           {         
                                               idDataSource = results.rows.item(0).id;                                               
                                               self.columns = self.formTableColumns();
                                               req.executeSql('CREATE TABLE IF NOT EXISTS "' + idDataSource + '" (DateTime NOT NULL UNIQUE' + self.columns + ')');
                                               req.executeSql('CREATE INDEX IF NOT EXISTS DateTimeIndex ON "' + idDataSource + '" (DateTime)');  
                                               for (var p = 0; p < objData.dateTime.length; p++) 
                                               {                         
                                                   req.executeSql('INSERT OR REPLACE INTO "' + idDataSource + '" (DateTime ' + self.columns + ') ' + 'VALUES ' + '("' + objData.dateTime[p] + '"' + self.formValues(objData.data, p) + ')');                                                
                                               }  


                                           });
                                       },
                                       self.onError,
                                       self.onEndOfWork.bind(self));
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
                          //self.startBackgroundCaching(db_server, db_name, db_group, db_mask[count], window, backgrLevel.window);
                          var counter = 0;                          
                          var idDataSource = results.rows.item(0).id;
                          
                          var beginTime = self.dateHelper.splitTimeFromUnix(window.split('-')[0]);
                          var endTime = self.dateHelper.splitTimeFromUnix(window.split('-')[1]);   
                          
                          //beginTime = self.dataHandl.formatUnixData(beginTime, self.level.aggregator, self.level.level);
                          //endTime = self.dataHandl.formatUnixData(endTime, self.level.aggregator, self.level.level);
                          
                          self.db.transaction(function(req)
                          {      
//                              req.executeSql('SELECT DateTime, PointData FROM "' + idDataSource + '" WHERE  (DateTime) <=  "' + endTime + '" AND \n\
//                                                                                         (DateTime) >= "' + beginTime + '" AND (DateTime) LIKE "%' + self.level.aggregator + '%" ORDER BY DateTime', [],function(counter){ return function (req, res)
//                              
//                              
                              req.executeSql('SELECT * FROM "' + idDataSource + '" WHERE  (DateTime) <=  "' + endTime + '" AND \n\
                                              (DateTime) >= "' + beginTime + '" ORDER BY DateTime', [],function(counter){ return function (req, res)
                              
                              
                              {            
                                  if(res.rows.length != 0)
                                  {
                                        var dataBuffer = [];     
                                        var dateTime = [];
                                        var labels = [];
                                                                               
                                        self.dataHandl.concatRowData(res, dataBuffer, dateTime);                                        
                                        self.columns = self.formTableColumns(); 
                                        labels = self.formLabels();
                                        var returnedEndTime = (dateTime[dateTime.length - 1]);
                                        var returnedBeginTime = (dateTime[0]);
                                        
                                        if (beginTime == returnedBeginTime && endTime == returnedEndTime)
                                        {   
                                            self.clientsCallback({data: dataBuffer, dateTime: dateTime, label:labels});                                            
                                        }
                                        
                                        if(returnedBeginTime > beginTime && returnedEndTime == endTime)
                                        {
                                            var b = Date.parse(beginTime)/1000;
                                            var e = Date.parse(returnedBeginTime)/1000;
                                            var needenTime = b + '-' + e; 
                                            
                                            self.requestLeftData(db_server, 
                                                                 db_name, 
                                                                 db_group,                                                                  
                                                                 needenTime,
                                                                 self.level.window,
                                                                 idDataSource,
                                                                 dataBuffer,
                                                                 dateTime,
                                                                 onEndCallBack);  
                                        }
                                        if(returnedBeginTime == beginTime && returnedEndTime < endTime)
                                        {                       
                                            var e = Date.parse(endTime)/1000;
                                            var b = Date.parse(returnedEndTime)/1000;
                                            var needenTime = b + '-' + e;
                                            
                                            self.requestRightData(db_server, 
                                                                 db_name, 
                                                                 db_group,                                                                  
                                                                 needenTime,
                                                                 self.level.window,
                                                                 idDataSource,
                                                                 dataBuffer,
                                                                 dateTime,
                                                                 onEndCallBack);                                           
                                        }
                                        if(beginTime < returnedBeginTime && endTime > returnedEndTime)
                                        {
                                            var e = Date.parse(returnedBeginTime)/1000;
                                            var b = Date.parse(returnedEndTime)/1000;
                                            
                                            var needenTime1 = b + '-' + Date.parse(endTime)/1000;
                                            var needenTime2 = (Date.parse(beginTime)/1000) + '-' + e;
                                            
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
                                                                                             if(objLeftData != null && objRightData != null)
                                                                                             {
                                                                                                objLeftData.data = objLeftData.data.concat(objRightData.data);
                                                                                                objLeftData.dateTime = objLeftData.dateTime.concat(objRightData.dateTime);
                                                                                                onEndCallBack(objLeftData);                                                                                                
                                                                                             }
                                                                                             else
                                                                                             {
                                                                                                 self.clientsCallback({data: dataBuffer, dateTime: dateTime, label: labels});
                                                                                             }
                                                                                         });     
                                                                 });                                                                
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
                              };}(counter));
                          },
                          self.onError,
                          self.onEndOfWork.bind(self));
                          
                                                                         

                      }
                      
                   }); 
               }, 
                self.onError,
                self.onReadyTransaction);
          }
          else
          {
              console.log('Bad window format.');
          }
        };    
        
        
        me.onEndOfWork = function()
        {
            this.dataHandl.startBackgroundCaching(this.level, this.columns);
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
                    
                    for(var i = 0; i < dataBuffer.length; i++)
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
            var db_mask = self.dataHandl.getDbMask().split(',');
            if(db_mask == 'all')
            {
                var db_mask = self.formDbMask(self.dataHandl.getDbServer(), self.dataHandl.getDbName(), self.dataHandl.getDbGroup());
            }     
            var clone = {};
            clone.data = [];
            clone.dateTime = objData.dateTime;
            clone.label = [];
            for(var i = 0; i < db_mask.length; i++)
            {
                clone.data.push(objData.data[db_mask[i]]);    
                clone.label.push(objData.label[db_mask[i]]);
            }            
            return clone;            
        };
        
        me.formTableColumns = function()
        {
            var self = this;
            var db_mask = self.formDbMask(self.dataHandl.getDbServer(), self.dataHandl.getDbName(), self.dataHandl.getDbGroup());
            var columns = '';
            for(var i = 0; i < db_mask.length; i++)
            {
                //var formatLabel = labels[i].split(" ").join("_");
                columns = columns + ', column' +  db_mask[i];
            }
            return columns;
        };
        
        me.formLabels = function()
        { 
            var self = this;
            var url = self.formURLList(self.dataHandl.getDbServer(), self.dataHandl.getDbName(), self.dataHandl.getDbGroup());
            var responseXML = self.httpGet(url);
            var items = responseXML.getElementsByTagName('Value');
            var labels = [];

            for(var i = 0; i < items.length; i++)
            {
                labels.push(items[i].getAttribute('name'));
            } 
            return labels;         
        };
        
        me.formLabelList = function(db_server, db_name, db_group)
        {
            var self = this;
            var url = self.formURLList(db_server, db_name, db_group);
            var responseXML = self.httpGet(url);
            var items = responseXML.getElementsByTagName('Value');
            var labels = [];

            for(var i = 0; i < items.length; i++)
            {
                labels.push(items[i].getAttribute('name'));
            } 
            return labels;
        };
        
        me.formValues = function(data, i)
        {
            var values = '';
            for(var j = 0; j < data.length; j++)
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
                    
                    for(var i = 0; i < objData.data.length; i++)
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
            if(this.db == '')
            {
                this.db = window.openDatabase(name, '1.0', '', 50*1024*1024);                               
            }
        };
        
        me.formDataBase = function()
        {            
            this.db.transaction(function (req)
            {
//                req.executeSql('CREATE TABLE IF NOT EXISTS DataSource (id INTEGER PRIMARY KEY AUTOINCREMENT,\n\
//                                                                         db_server,\n\
//                                                                         db_name,\n\
//                                                                         db_group,\n\
//                                                                         level)'); 
           req.executeSql('CREATE TABLE IF NOT EXISTS DataSource (id INTEGER PRIMARY KEY AUTOINCREMENT,db_server,db_name,db_group,level)'); 
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
                            req.executeSql('INSERT OR REPLACE INTO "' + idDataSource + '" (DateTime' + self.formTableColumns() + ') ' + 'VALUES ' + '("' + objData.dateTime[i] + '"' + self.formValues(objData.data, i)+ ')', [], function(req,res)
                            {                                
                            });                                                
                        }  
                    },
                    self.onError,
                    self.onReadyTransaction);          
        };  
        
        me.onReadyTransaction = function()
        {                
            console.log( 'Transaction completed.' );
	};
 
	me.onError = function( err )
        {
            console.log( err );
	};
        
        me.onErrorSql = function(err)
        {
            console.log( err );
        };
        
        me.onReadySql = function()
        {
            console.log( 'Executing SQL completed.' );
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
        
        me.formURLList = function(db_server, db_name, db_group)
        {
            var url = 'http://ipecluster5.ipe.kit.edu/ADEI/ADEIWS/services/list.php?db_server=' + db_server 
                    + '&db_name=' + db_name
                    + '&db_group=' + db_group 
                    + '&target=items';  
            return url;
        };
        
        me.formDbMask = function (db_server, db_name, db_group)
        {
            var self = this;
            var url = self.formURLList(db_server, db_name, db_group);
            var responseXML = self.httpGet(url);
            var items = responseXML.getElementsByTagName('Value');
            var mask = [];

            for(var i = 0; i < items.length; i++)
            {
                mask.push(items[i].getAttribute('value'));
            }
            var db_mask = mask;
              
          return db_mask;
        };
        
        me.httpGet = function (url)
        {
            var xmlHttp = null;

            xmlHttp = new XMLHttpRequest();
            xmlHttp.open( "GET", url, false);
            xmlHttp.send( null );
            return xmlHttp.responseXML;
        };
        
        me.openDataBase('DB');    
        me.formDataBase(); 
        
        return me;
        
        
    
    
    
    }; 
    
    window.dataCacher = dataCacher;
    

})(window);



