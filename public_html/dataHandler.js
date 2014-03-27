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
            {level: 'Month', aggregator: '-01T00:00:00.000000', window: 2592000},
            {level: 'Day', aggregator: 'T00:00:00.000000', window: 86400},
            {level: 'Hour', aggregator: ':00:00.000000', window: 3600},
            {level: 'Min', aggregator: ':00.000000', window: 60},
            {level: 'Sec', aggregator: '.000000', window: 1},
            {level: 'Milisec', aggregator: '', window: 0}];

        me.startBackgroundCaching = function(level, tableColumns)
        {
            if (this.maxlevel != level.window)
            {
                var backCacher = new Worker('backgrDataCacher.js');
                backCacher.postMessage(this.db_server + '<>' + this.db_name + '<>' + this.db_group + '<>' + this.window + '<>' + this.getDataLevelForBackgr(level).window + '<>' + tableColumns);
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
                    if (this.maxlevel == this.dataLevel[i].window)
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
            if (multiplier < 31536000)
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
            }


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




