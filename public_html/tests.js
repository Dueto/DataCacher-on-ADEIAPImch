
module("class DataCacher");

//asyncTest("getData", 1, function() {
//        DataCacher = new dataCacher();
// 	DataCacher.getData("db_server", "db_name", "db_group", "db_mask", "window", "asd", function(data) {
// 		  if(data === null)
//                  {
//                      	ok(true,  "Ok");
// 			start();
//                  }
//                  else
//                  {
//                      ok(false, "Undefined data...");
//                  }
//
// 	});
// });
//
// asyncTest("CheckChannelCount", 1 , function() {
//        DataCacher = new dataCacher();
// 	DataCacher.getData("autogen", "hourly", "default", "0,1", "1363096123-1363355323", 2, function(data)
//        {
//            console.log(data);
//                      ok(true, "Ok");
//                      start();
//
// 	});
// });
asyncTest("CheckChannelCount", 1, function() {
    DataCacher = new dataCacher();
    DataCacher.getData("autogen", "hourly", "default", "all", "226688801-1205428001", 500, function(data)
    {
        console.log(data);
        ok(true, "Ok");
        start();

    });
});
//asyncTest("CheckChannelCount", 1, function() {
//    DataCacher = new dataCacher();
//    DataCacher.getData("fastgen", "10hz", "default", "all", "1393927947-1393935147", 1000, function(data)
//    {
//        console.log(data);
//        ok(true, "Ok");
//        start();
//
//    });
//});
//  asyncTest("CheckChannelCount", 1 , function() {
//        DataCacher = new dataCacher();
// 	DataCacher.getData("fastgen", "10hz", "default", "all", "1394028146-1395237746", 1000, function(data)
//        {
//            console.log(data);
//                      ok(true, "Ok");
//                      start();
//
// 	});
// });
//  asyncTest("CheckChannelCount", 1 , function() {
//        DataCacher = new dataCacher();
// 	DataCacher.getData("temp0", "BakeOut2013", "TempMon", "all", "1355914844-1379156444", 70, function(data)
//        {
//                  console.log(data);
//                      ok(true, "Ok");
//                      start();
//
// 	});
// });
//
//  asyncTest("CheckChannelMinute", 1 , function() {
//        DataCacher = new dataCacher();
//        var count = 0;
// 	DataCacher.getData("autogen", "minutely", "default", "all", "1363096123-1363355323", 60, function(data)
//        {
//                  console.log(data);
//                  count++;
//                  if(count == 6)
//                  {
//                      ok(true, "Ok");
//                      start();
//                  }
// 	},
//        function(data){
//            console.log(data);
//        });
// });
//

//
//   asyncTest("CheckDataLeftLength", 1 , function() {
//        DataCacher = new dataCacher();
// 	DataCacher.getData("autogen", "minutely", "default", "all", "1363185095-1363357895", 500, function(data) {
//         console.log(data);
//                      if(data !== null)
//                      {
//                          ok(true, "Ok");
//                          start();
//                      }
//
// 	});
// });
//
//    asyncTest("CheckDataRightLength", 1 , function() {
//        DataCacher = new dataCacher();
// 	DataCacher.getData("autogen", "minutely", "default", "0", "1363185095-1363357895", 0, function(data) {
//      console.log(data);
//                      if(data !== null)
//                      {
//                          ok(true, "Ok");
//                          start();
//                      }
//                      else
//                      {
//                          ok(false, "Object is null or count isn't equal.");
//                          start();
//                      }
//
//
//
// 	});
// });
//
//asyncTest("CheckOutsideLength", 1 , function() {
//        DataCacher = new dataCacher();
// 	DataCacher.getData("autogen", "minutely", "default", "0", "1363185095-1363357895", 2592000, function(data) {
//            console.log(data);
//                      if(data !== null)
//                      {
//                          ok(true, "Ok");
//                          start();
//                      }
//                      else
//                      {
//                          ok(false, "Object is null or count isn't equal.");
//                          start();
//                      }
//
//
//
// 	});
// });
//
//     asyncTest("CheckDataMoreLength", 1 , function() {
//        var DataCacher = new dataCacher();
// 	DataCacher.getData("autogen", "hourly", "default", "0", "1363009723-1363614523", 50, function(data) {
//                      console.log(data);
//                      if(data !== null && data.data.length == 8)
//                      {
//                          ok(true, "Ok");
//                          start();
//                      }
//                      else
//                      {
//                          ok(false, "Object is null or count isn't equal.");
//                          start();
//                      }
//
//
//
// 	},
//        function(data){});
// });
//
//asyncTest("CheckDataInsideLength", 1 , function() {
//        var DataCacher = new dataCacher();
// 	DataCacher.getData("autogen", "hourly", "default", "0", "1363182523-1363268923", 120, function(data) {
//                      console.log(data);
//                      if(data !== null && data.data.length == 2)
//                      {
//                          ok(true, "Ok");
//                          start();
//                      }
//                      else
//                      {
//                          ok(false, "Object is null or count isn't equal.");
//                          start();
//                      }
//
//
//
// 	},
//        function(data){});
// });
//
//
//
// asyncTest("CheckWorkWithMilliseconds", 1 , function() {
//        DataCacher = new dataCacher();
// 	DataCacher.getData("autogen", "minutely", "default", "0", "1362420215-1394042615", 3600, function(data) {
//                      console.log(data);
//                      if(data !== null)
//                      {
//                          ok(true, "Ok");
//                          start();
//                      }
//                      else
//                      {
//                          ok(false, "Object is null or count isn't equal.");
//                          start();
//                      }
//
//
//
// 	});
// });
//
// asyncTest("CheckWorkWith", 1 , function() {
//        DataCacher = new dataCacher();
// 	DataCacher.getData("fastgen", "10hz", "default", "0", "1362421848-1394044248", 86400, function(data) {
//                      console.log(data);
//                      if(data !== null)
//                      {
//                          ok(true, "Ok");
//                          start();
//                      }
//                      else
//                      {
//                          ok(false, "Object is null or count isn't equal.");
//                          start();
//                      }
//
//
//
// 	});
// });
//
// asyncTest("CheckWorkWithWebSockets", 1 , function()
// {
//    var socket;
//
//    (function init()
//    {
//      var host = "ws://localhost:12345/webSockets/index.php";
//      try
//      {
//          socket = new WebSocket(host);
//          socket.onopen    = function(msg){ console.log("Welcome - status " + this.readyState); send(); };
//          socket.onmessage = function(msg){ console.log("Received: " + msg.data); ok(true, "Ok");};
//          socket.onclose   = function(msg){ console.log("Disconnected - status " + this.readyState); };
//          socket.onerror   = function(msg){ console.log(msg); };
//      }
//      catch(ex)
//      {
//          console.log(ex);
//      }
//    })();
//
//
//
//    function send()
//    {
//        var txt = 'autogen;hourly;default;0;1362580295-1363357895;mean;86400';
//        try
//        {
//            socket.send(txt);
//            console.log('Sent: ' + txt);
//        }
//        catch(ex)
//        {
//            console.log(ex);
//        }
//    }
//    function quit()
//    {
//        socket.close();
//        socket = null;
//    }
//    start();
// });
