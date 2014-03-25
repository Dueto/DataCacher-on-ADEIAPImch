(function(window)
{   
    var dateTimeFormat = function()
    { 
        var me = {};  

        me.splitTimeFromAny = function(window)
        {       
                var Microsec = window.substr(19);
                var d = new Date(window);
                var buf = d.toISOString().substr(13).substring(0,7);                
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                var Time = d.toISOString().substring(0,13);                
                Time = Time + buf + Microsec;
                return Time;
        };

        me.splitTimeFromUnix = function(window)
        {   
                var Microsec = window.split('.')[1];
                if (Microsec == undefined)
                {
                    Microsec = '000000';
                }                
                var d = new Date(window * 1000);
                var buf = d.toISOString().substr(13).substring(0,7); 
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                var Time = d.toISOString().substring(0,13);                
                Time = Time + buf + Microsec;
                return Time;
          

        };   
        
        me.checkWindowFormat = function (window)
        {
            var begSec = window.split('-')[0];
            var endSec = window.split('-')[1];
            if(begSec != undefined && endSec != undefined)
            {
                
                var milBegSec = begSec.split('.')[1];               
                var milEndSec = endSec.split('.')[1];
                if(milBegSec!== undefined && milEndSec !== undefined)
                {
                    endSec = endSec.split('.')[0]; 
                    begSec = begSec.split('.')[0];
                    milBegSec = parseInt(milBegSec);
                    milEndSec = parseInt(milEndSec);
                    begSec = parseInt(begSec);
                    endSec = parseInt(endSec);
                    if( milBegSec != NaN &&
                        milEndSec != NaN &&
                        begSec != NaN &&
                        endSec != NaN)
                    {
                        return true;                        
                    }
                    else
                    {
                        return false;
                    }
                }
                else
                {
                    if(typeof parseInt(begSec) === "number" &&
                       typeof parseInt(endSec) === "number")
                    {
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                }
            }
            else
            {
                return false;
            }
            
        };

        return me;
            
    }; 
    
    window.dateTimeFormat = dateTimeFormat;
    

})(window);
