(function(window)
{
    var dataHandler = function()
    {
        var me = {};

        me.dateHelper = new dateTimeFormat();

        me.db_server = '';
        me.db_name = '';
        me.db_group = '';
        me.db_mask = '';
        me.window = '';
        me.pointCount = '';
        me.level = '';
        me.maxlevel = '';


        me.dataLevel = [{level: 'Year', aggregator: '-01-01T00:00:00.000000', window: 31536000},
            {level: 'HalfYear', aggregator: '-01T00:00:00.000000', window: 17064000},
            {level: 'ThreeMonth', aggregator: 'T00:00:00.000000', window: 8532000},
            {level: 'Month', aggregator: 'T00:00:00.000000', window: 2592000},
            {level: 'HalfMonth', aggregator: 'T00:00:00.000000', window: 1339200},
            {level: 'QuarterMonth', aggregator: 'T00:00:00.000000', window: 669600},
            {level: 'TwoMonth', aggregator: 'T00:00:00.000000', window: 334800},
            {level: 'Day', aggregator: 'T00:00:00.000000', window: 86400},
            {level: 'HalfDay', aggregator: ':00:00.000000', window: 43200},
            {level: 'QuarterDay', aggregator: ':00:00.000000', window: 21600},
            {level: 'ThreeHour', aggregator: ':00:00.000000', window: 10800},
            {level: 'Hour', aggregator: ':00:00.000000', window: 3600},
            {level: 'HalfHour', aggregator: ':00.000000', window: 1800},
            {level: 'QuarterHour', aggregator: ':00.000000', window: 900},
            {level: 'TenMinutes', aggregator: ':00.000000', window: 450},
            {level: 'FiveMinutes', aggregator: ':00.000000', window: 225},
            {level: 'TwoMinutes', aggregator: ':00.000000', window: 120},
            {level: 'Min', aggregator: ':00.000000', window: 60},
            {level: 'HalfMin', aggregator: '.000000', window: 30},
            {level: 'QuarterMin', aggregator: '.000000', window: 15},
            {level: 'TenSec', aggregator: '.000000', window: 5},
            {level: 'Sec', aggregator: '.000000', window: 1},
            // {level: 'Month', aggregator: '-01T00:00:00.000000', window: 2592000},
            {level: 'Milisec', aggregator: '', window: 0}];



//        me.dataLevel = [{level: 'Year', aggregator: '-01-01T00:00:00.000000', window: 31536000},
//            {level: 'HalfYear', aggregator: '-01T00:00:00.000000', window: 10512000},
//            {level: 'ThreeMonth', aggregator: 'T00:00:00.000000', window: 3504000},
//            {level: 'Month', aggregator: 'T00:00:00.000000', window: 1168000},
//            {level: 'HalfMonth', aggregator: 'T00:00:00.000000', window: 389333},
//            {level: 'QuarterMonth', aggregator: 'T00:00:00.000000', window: 129777},
//            {level: 'TwoMonth', aggregator: 'T00:00:00.000000', window: 43259},
//            {level: 'Day', aggregator: 'T00:00:00.000000', window: 14419},
//            {level: 'HalfDay', aggregator: ':00:00.000000', window: 4806},
//            {level: 'QuarterDay', aggregator: ':00:00.000000', window: 1602},
//            {level: 'ThreeHour', aggregator: ':00:00.000000', window: 534},
//            {level: 'Hour', aggregator: ':00:00.000000', window: 178},
//            {level: 'HalfHour', aggregator: ':00.000000', window: 60}];

//        me.dataLevel = [{level: 'Year', aggregator: '-01-01T00:00:00.000000', window: 31536000},
//            {level: 'HalfYear', aggregator: '-01T00:00:00.000000', window: 7884000},
//            {level: 'ThreeMonth', aggregator: 'T00:00:00.000000', window: 1971000},
//            {level: 'Month', aggregator: 'T00:00:00.000000', window: 492750},
//            {level: 'HalfMonth', aggregator: 'T00:00:00.000000', window: 123187},
//            {level: 'QuarterMonth', aggregator: 'T00:00:00.000000', window: 30796},
//            {level: 'TwoMonth', aggregator: 'T00:00:00.000000', window: 6483},
//            {level: 'Day', aggregator: 'T00:00:00.000000', window: 1620},
//            {level: 'HalfDay', aggregator: ':00:00.000000', window: 405},
//            {level: 'QuarterDay', aggregator: ':00:00.000000', window: 101},
//            {level: 'ThreeHour', aggregator: ':00:00.000000', window: 25}];

        me.startBackgroundCaching = function(level, tableColumns)
        {
            if (this.maxlevel != level.window)
            {
                var backCacher = new Worker('backgrDataCacher.js');
                backCacher.postMessage(this.db_server + '<>' + this.db_name + '<>' + this.db_group + '<>' + this.window + '<>' + level.window + '<>' + tableColumns);
            }
        };

        me.setRequest = function(db_server, db_name, db_group, db_mask, window, pointCount)
        {
            this.db_server = db_server;
            this.db_name = db_name;
            this.db_group = db_group;
            this.db_mask = db_mask;
            this.window = window;
            this.pointCount = pointCount;

            this.level = this.getDataLevel(this.pointCount, this.window);
            if (this.level.window < this.maxlevel)
            {
                for (var i = 0; i < this.dataLevel.length; i++)
                {
                    if (this.maxlevel <= this.dataLevel[i].window && this.maxlevel > this.dataLevel[i + 1].window)
                    {
                        this.level = this.dataLevel[i];
                    }
                }
            }
            this.itemsCount = this.db_mask.length;
        };

        me.parseData = function(csv)
        {
            var numrows = csv.numrows;
            var numcols = csv.numcols;
            var labels = csv.getRow(0, 1);
            var allData = new Array(numcols);

            for (i = 0; i < numcols; i++)
            {
                allData[i] = new Array(numrows - 1);
                var row = csv.getCol(i, 1);

                for (j = 0; j < numrows - 1; j++)
                {
                    if (i === 0)
                    {
                        //var Milliseconds = row[j].substr(22);
                        allData[i][j] = this.dateHelper.splitTimeFromAny(row[j]);
                    }
                    else
                    {
                        allData[i][j] = parseFloat(row[j]);
                    }

                }
            }
            var data = [];
            for (var i = 1; i < allData.length; i++)
            {
                data.push(allData[i]);
            }

            return {data: data, dateTime: allData[0], label: labels};
        };

        me.concatRowData = function(res, dataBuffer, dateTime)
        {

            for (var property in res.rows.item(0))
            {
                if (property != 'DateTime')
                {
                    dataBuffer.push([]);
                }
            }
            for (var k = 0; k < res.rows.length; k++)
            {
                var i = 0;
                for (var property in res.rows.item(k))
                {
                    if (res.rows.item(k).hasOwnProperty(property))
                    {
                        if (property == 'DateTime')
                        {
                            dateTime.push(res.rows.item(k).DateTime);
                        }
                        else
                        {
                            var data = res.rows.item(k)[property];
                            dataBuffer[i].push(data);
                            i++;
                        }
                    }

                }


            }
        };

        me.getDataLevel = function(pointCount, window)
        {
            var diffrence = window.split('-')[1] - window.split('-')[0];
            var multiplier = diffrence / pointCount;
            var level;

            for (var i = 0; i < this.dataLevel.length; i++)
            {
                if (this.dataLevel[i].window > multiplier)
                {
                    //level = this.dataLevel[i];
                    continue;
                }
                level = this.dataLevel[i];
                break;
            }
            return level;

            /*if (multiplier < 31536000)
             {
             if (multiplier < 2592000)
             {
             if (multiplier < 86400)
             {
             if (multiplier < 3600)
             {
             if (multiplier < 60)
             {
             if (multiplier < 1)
             {
             return this.dataLevel[6];
             }
             else
             {
             return this.dataLevel[5];
             }
             }
             else
             {
             return this.dataLevel[4];
             }
             }
             else
             {
             return this.dataLevel[3];
             }
             }
             else
             {
             return this.dataLevel[2];
             }
             }
             else
             {
             return this.dataLevel[1];
             }

             }
             else
             {
             return this.dataLevel[0];
             }*/


        };

        me.formatDate = function(date)
        {
            return date.substr(0, date.length - this.level.aggregator.length);
        };

        me.flushData = function()
        {
            this.db_server = '';
            this.db_name = '';
            this.db_group = '';
            this.db_mask = '';
            this.window = '';
            this.pointCount = '';
            this.level = '';
            this.maxlevel = '';
        };

        me.getDataLevelForBackgr = function(level)
        {
            for (var i = 0; i < this.dataLevel.length; i++)
            {
                if (this.dataLevel[i] == level)
                {
                    if (i == this.dataLevel.length - 1)
                    {
                        return level;
                    }
                    else
                    {
                        return this.dataLevel[i + 1];
                    }
                }
            }
        };

        me.getDbServer = function()
        {
            return this.db_server;
        };

        me.getDbName = function()
        {
            return this.db_name;
        };

        me.getDbGroup = function()
        {
            return this.db_group;
        };

        me.getDbMask = function()
        {
            return this.db_mask;
        };

        me.setMaxLevel = function(maxlevel)
        {
            this.maxlevel = maxlevel;
        };

        return me;

    };

    window.dataHandler = dataHandler;


})(window);









