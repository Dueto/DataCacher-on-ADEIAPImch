(function(window)
{   
    var dataCacher = function()
    { 
        var me = {};
        
        me.db = ''; 
        me.dataHandl = new dataHandler();
        me.dateHelper = new dateTimeFormat();
        me.clientsCallback = '';  
        me.level = '';
        
        me.getData = function(db_server,
                              db_name,
                              db_group,
                              db_mask,
                              window,
                              pointCount,
                              onEndCallBack,
                              onEndCallBackAll)
        {
          var self = this;
          self.clientsCallback = onEndCallBack;     
          
          db_mask = self.formDbMask(db_server, db_name, db_group, db_mask);    
          
          self.dataHandl.flushData();
          self.dataHandl.setRequest(db_server, db_name, db_group, db_mask, window, pointCount);
          self.level = self.dataHandl.level; 
          self.dataHandl.setClientsCallback(onEndCallBackAll);    
          
          if(self.dateHelper.checkWindowFormat(window))
          {              
                self.db.transaction(function(req)
                { 
                   for (g = 0; g < db_mask.length; g++) 
                   {  
                      req.executeSql('SELECT * FROM DataSource WHERE db_server = "' + db_server + '" AND \n\
                                                                  db_name = "' + db_name + '" AND \n\
                                                                  db_group = "' + db_group + '" AND \n\
                                                                  db_mask = "' + self.createDbItemName(db_mask[g]) + '"', [], function(count){ return function (req, results)
                   {         
                      if(results.rows.length == 0)
                      {  
                          var url = self.formURL(db_server, db_name, db_group, db_mask[count], window, self.level.window);  
                          var csv = new RGraph.CSV(url, function(csv)
                          {                                   
                                var objData = self.dataHandl.parseData(csv);
                                if (objData.label != undefined) 
                                {        
                                    if(objData.data.length < 100000)
                                    {
                                       self.clientsCallback(objData);
                                       self.dataHandl.concatData(objData);
                                       self.db.transaction(function(req)
                                       {
                                           var idDataSource;
                                           req.executeSql('INSERT OR REPLACE INTO DataSource (db_server, db_name, db_group, db_mask, channellabel ) VALUES ("' + db_server + '","' + db_name + '","' + db_group + '","' + self.createDbItemName(db_mask[count]) + '", "' + objData.label + '")');    
                                           req.executeSql('SELECT id FROM DataSource WHERE db_server = "' + db_server + '" AND \n\
                                                                     db_name = "' + db_name + '" AND \n\
                                                                     db_group = "' + db_group + '" AND \n\
                                                                     db_mask = "' + self.createDbItemName(db_mask[count]) + '"', [], function (req, results)
                                           {         
                                               idDataSource = results.rows.item(0).id;
                                               req.executeSql('CREATE TABLE IF NOT EXISTS "' + self.createTableName(idDataSource) + '" (DateTime NOT NULL UNIQUE, PointData)');
                                               req.executeSql('CREATE INDEX IF NOT EXISTS DateTimeIndex ON "' + self.createTableName(idDataSource) + '" (DateTime)');  
                                               for (p = 0; p < objData.dateTime.length; p++) 
                                               {                         
                                                   req.executeSql('INSERT OR REPLACE INTO "' + self.createTableName(idDataSource) + '" (DateTime, PointData) ' + 'VALUES ' + '("' + objData.dateTime[p] + '",' + objData.data[p] + ')');                                                
                                               }  


                                           });
                                       },
                                       self.onError,
                                       self.onReadyTransaction);
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
                          
                          beginTime = self.dataHandl.formatUnixData(beginTime, self.level.aggregator, self.level.level);
                          endTime = self.dataHandl.formatUnixData(endTime, self.level.aggregator, self.level.level);
                          
                          self.db.transaction(function(req)
                          {      
//                              req.executeSql('SELECT DateTime, PointData FROM "' + self.createTableName(idDataSource) + '" WHERE  (DateTime) <=  "' + endTime + '" AND \n\
//                                                                                         (DateTime) >= "' + beginTime + '" AND (DateTime) LIKE "%' + self.level.aggregator + '%" ORDER BY DateTime', [],function(counter){ return function (req, res)
//                              
//                              
                              req.executeSql('SELECT DateTime, PointData FROM "' + self.createTableName(idDataSource) + '" WHERE  (DateTime) <=  "' + endTime + '" AND \n\
                                                                                         (DateTime) >= "' + beginTime + '" ORDER BY DateTime', [],function(counter){ return function (req, res)
                              
                              
                              {            
                                  if(res.rows.length != 0)
                                  {
                                        var dataBuffer = [];     
                                        var dateTime = [];
                                        
                                        self.dataHandl.concatRowData(res, dataBuffer, dateTime);
                                        
                                        var returnedEndTime = (dateTime[dateTime.length - 1]);
                                        var returnedBeginTime = (dateTime[0]);
                                        
                                        if (beginTime == returnedBeginTime && endTime == returnedEndTime)
                                        {                                       
                                            var label = results.rows.item(0).channellabel;
                                            self.clientsCallback({data: dataBuffer, dateTime: dateTime, label: label});
                                            self.dataHandl.concatData({data: dataBuffer, dateTime: dateTime, label: label});
                                        }
                                        
                                        if(returnedBeginTime > beginTime && returnedEndTime == endTime)
                                        {
                                            var b = Date.parse(beginTime)/1000;
                                            var e = Date.parse(returnedBeginTime)/1000;
                                            var needenTime = b + '-' + e; 
                                            
                                            self.requestLeftData(db_server, 
                                                                 db_name, 
                                                                 db_group, 
                                                                 db_mask[count], 
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
                                                                 db_mask[count], 
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
                                                                 db_mask[count], 
                                                                 needenTime1,
                                                                 self.level.window,
                                                                 idDataSource,
                                                                 [],
                                                                 [],
                                                                 function(objRightData)
                                                                 {
                                                                     if(objRightData != null)
                                                                     {
                                                                        self.requestLeftData(db_server, 
                                                                                             db_name, 
                                                                                             db_group, 
                                                                                             db_mask[count], 
                                                                                             needenTime2,
                                                                                             self.level.window,
                                                                                             idDataSource,
                                                                                             dataBuffer,
                                                                                             dateTime,
                                                                                             function(objLeftData)
                                                                                             {
                                                                                                 if(objLeftData != null)
                                                                                                 {
                                                                                                 objLeftData.data = objLeftData.data.concat(objRightData.data);
                                                                                                 objLeftData.dateTime = objLeftData.dateTime.concat(objRightData.dateTime);
                                                                                                 onEndCallBack(objLeftData);
                                                                                                 self.dataHandl.concatData(objLeftData);
                                                                                                 }
                                                                                                 else
                                                                                                 {
                                                                                                     onEndCallBack(null);
                                                                                                     throw ('There is no data in server responses.');
                                                                                                 }
                                                                                             });      
                                                                     }       
                                                                     else
                                                                     {
                                                                         onEndCallBack(null);
                                                                         throw ('There is no data in server responses.');
                                                                     }
                                                                 });                                                                
                                        }
                                  }
                                  else
                                  {
                                       self.insertNeedenData(db_server,
                                                            db_name,
                                                            db_group,
                                                            db_mask[count],
                                                            window,
                                                            self.level.window,
                                                            idDataSource,
                                                            onEndCallBack);                                       
                                  }                                  
                              };}(counter));
                          },
                          self.onError,
                          self.onReadyTransaction);
                          
                                                                         

                      }
                      
                   };
               }(g) ); 
               }}, 
                this.onError,
                this.onReadyTransaction);
          }
          else
          {
              console.log('Bad window format.');
          }
        };    
        

         me.requestRightData = function(db_server,
                                        db_name,
                                        db_group,
                                        db_mask,
                                        window,
                                        level,
                                        idDataSource,
                                        dataBuffer,
                                        dateTime,
                                        onEndCallBack)
        {
            var self = this;
            var url = self.formURL(db_server, db_name, db_group, db_mask, window, level);   
            
            var csv = RGraph.CSV(url, function(csv)
            {  
                var objData = self.dataHandl.parseData(csv);
                if (objData.label != undefined) 
                { 
                    var clone = {};
                    clone.data = objData.data.slice(0);
                    clone.dateTime = objData.dateTime.slice(0);
                    self.insertData(clone, idDataSource);                    
                    
                    dataBuffer = dataBuffer.concat(objData.data);
                    dateTime = dateTime.concat(objData.dateTime);

                    objData.data = dataBuffer;
                    objData.dateTime = dateTime;

                    onEndCallBack(objData);
                    self.dataHandl.concatData(objData);
                   
                }
                else
                {      
                    onEndCallBack(null);            
                    throw ('There is no data in server responces.');                                         
                }    
            }); 
            
        };
        
        

        
        
        
        me.requestLeftData = function(db_server,
                                        db_name,
                                        db_group,
                                        db_mask,
                                        window,
                                        level,
                                        idDataSource,
                                        dataBuffer,
                                        dateTime,
                                        onEndCallBack)
        {
            var self = this;
            var url = self.formURL(db_server, db_name, db_group, db_mask, window, level);   
            
            var csv = RGraph.CSV(url, function(csv)
            {                    
                var objData = self.dataHandl.parseData(csv);
                if (objData.label != undefined) 
                {   
                    var clone = {};
                    clone.data = objData.data.slice(0);
                    clone.dateTime = objData.dateTime.slice(0);
                    self.insertData(clone, idDataSource);
                    
                    objData.data = objData.data.concat(dataBuffer);
                    objData.dateTime = objData.dateTime.concat(dateTime);

                    onEndCallBack(objData);
                    self.dataHandl.concatData(objData);
                }
                else
                {      
                    onEndCallBack(null);
                    throw ('There is no data in server responces.');                                         
                }    
             });               
        };
        

     
                               
        me.insertNeedenData = function(db_server,
                                       db_name,
                                       db_group,
                                       db_mask,
                                       window,
                                       level,
                                       idDataSource,
                                       onEndCallBack)
        {
            var self = this;
            var url = self.formURL(db_server, db_name, db_group, db_mask, window, level);   
            
            var csv = RGraph.CSV(url, function(csv)
            {   
                var objData = self.dataHandl.parseData(csv);
                if (objData.label != undefined) 
                {   
                    onEndCallBack(objData);
                    self.dataHandl.concatData(objData);
                    self.insertData(objData, idDataSource);
                }
                else
                {      
                    onEndCallBack(null);                    
                    throw ('There is no data in server responces.');                                         
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
        
        me.getDatabaseConnection = function()
        {
            return this.db;
        };

        me.formDataBase = function()
        {            
            this.db.transaction(function (req)
            {
                req.executeSql('CREATE TABLE IF NOT EXISTS DataSource (id INTEGER PRIMARY KEY AUTOINCREMENT,\n\
                                                                         db_server,\n\
                                                                         db_name,\n\
                                                                         db_group,\n\
                                                                         db_mask,\n\
                                                                         channellabel)'); 
            }, 
            this.onError,
            this.onReadyTransaction);
        };

        me.insertData = function(objData, idDataSource)
        {   
            var self = this;
                    self.db.transaction(function(req)
                    {                        
                        for (i = 0; i < objData.dateTime.length; i++) 
                        {                               
                            req.executeSql('INSERT OR REPLACE INTO "' + self.createTableName(idDataSource) + '" (DateTime, PointData) ' + 'VALUES ' + '("' + objData.dateTime[i] + '",' + objData.data[i] + ')', [], function(req,res)
                            {                                
                            });                                                
                        }  
                    },
                    self.onError,
                    self.onReadyTransaction);          
        };  
        
        me.createTableName = function(id)
        {
            return id + '_' + this.level.window;
        };
        
        me.createDbItemName = function(db_item)
        {
            return db_item + '_' + this.level.window;
        }
   
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
        
        me.formURL = function(db_server, db_name, db_group, db_mask, window, level)
        {
            var url = 'http://localhost/ADEI/ADEIWS/services/getdata.php?db_server=' + db_server 
                    + '&db_name=' + db_name
                    + '&db_group=' + db_group 
                    + '&db_mask=' + db_mask 
                    + '&experiment=' + window 
                    + '&window=0' 
                    + '&resample=' + level 
                    + '&format=csv';                        
            return url; 
        };
        
        me.formURLList = function(db_server, db_name, db_group)
        {
            var url = 'http://localhost/ADEI/ADEIWS/services/list.php?db_server=' + db_server 
                    + '&db_name=' + db_name
                    + '&db_group=' + db_group 
                    + '&target=items';  
            return url;
        };
        
        me.formDbMask = function (db_server, db_name, db_group, db_mask)
        {
          var self = this;
          if(db_mask != 'all')
          {
              db_mask = db_mask.split(',');    
          }
          else 
          {    
              var url = self.formURLList(db_server, db_name, db_group);
              var responseXML = self.httpGet(url);
              var items = responseXML.getElementsByTagName('Value');
              var mask = [];
              
              for(var i = 0; i < items.length; i++)
              {
                  mask.push(items[i].getAttribute('value'));
              }
              db_mask = mask;
          }     
          return db_mask;
        }
        
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



