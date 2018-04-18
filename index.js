/** Framework Setup */
var express = require('express');
var lap = require('./static/lap.js');
var app = express();
const {
    Client
} = require('pg'); // database
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
});


client.connect((err) => {
    if (err) console.log("Postgres connection error: " + err)
});

var bodyparser = require('body-parser');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/live', express.static('live-timing.html'))
app.use('/websocket-test', express.static('websocket-test.html'))
app.use('/user-test', express.static('control-speed.html'))
app.use('/runs', express.static('run-history.html'))
app.use('/laps', express.static('lap-history.html'))
app.use(express.static('static'))

/** Server Information */
// app.listen(process.env.PORT || 5000, function() {
//   console.log("Listening on port " + (process.env.PORT || 5000));
// });

// WebSocket
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(process.env.PORT || 5000, function() {
    console.log("Listening on port " + (process.env.PORT || 5000));
});

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.on('connection', function(socket) {

    // Lap Button
    socket.on('Next Lap', function(data) {
        lapQuery(data['time']);
    });

    // Run Button
    socket.on('Start Run', function(data) {
        var runname = data['runname'];
        var time = data['time'];
        startRunDataQuery(runname, time);
    });

    socket.on('End Run', function(data) {
        console.log("server receives end run");
        var time = data['time'];
        endRunData(time, function() {
            io.sockets.emit('Run Ended', {
                time: time
            });
            endLapDataNoID(time);
        });
    });

    socket.on('Post Note', function(data) {
        var note = data['note'];
        var position = data['position'];
        var time = data['time'];
        socket.broadcast.emit('Note Posted', {
            note: note,
            position: position
        });
        insertDataQuery(time, 'note', {
            note: note,
            position: position
        });

    });

});



/** Particle Information */
var Particle = require('particle-api-js');
var particle = new Particle();
var token;
var device_ID = "34004a000251363131363432";

function insertDataQuery(time, property, value) {
    // to_timestamp(time, 'MM/DD/YYYY, HH12:MI:MS')
    client.query('INSERT INTO data (timestamp, property, value)' +
        'VALUES ($1, $2, $3)', [time, property, value], (err, rows) => {
            if (err) {
                console.log(err.stack);
            } else {
                console.log(rows.rows[0]);
            }
            // res.end("sent");

        });
}

function startLapDataQuery(runid, lapno, time) {
    client.query('INSERT INTO lapdata (runid, lapno, starttime)' +
        'VALUES ($1, $2, $3)', [runid, lapno, time], (err, rows) => {
            if (err) {
                console.log(err.stack);
            } else {
                console.log(rows.rows[0]);
            }
            io.sockets.emit('Lap Started', {
                lapno: lapno,
                time: time
            });
        });
}

function endLapDataQuery(runid, lapno, endtime) {
    updateEndTime(runid, lapno, endtime, function() {
        getStartTime(runid, lapno, function(starttime) {
            getAllDataForLap(starttime, endtime, function(data) {
                var curLap = new lap.Lap(null, runid, lapno, starttime, endtime, null);
                curLap.addData(data);
                var totalTime = curLap.getTotalTime();
                var totalEnergy = curLap.computeEnergyUsed();
                io.sockets.emit('Lap Ended', {
                    lapno: lapno,
                    totaltime: totalTime,
                    totalenergy: totalEnergy
                });
            })
        })
    });
}

function getStartTime(runid, lapno, callback) {
    client.query('SELECT starttime FROM lapdata WHERE runid = ($1) AND lapno = ($2)', [runid, lapno], (err, rows) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log(rows.rows[0]);
            callback(rows.rows[0]);
        }
    });
}

app.get('/getRunStartTime', function(req, res) {
    client.query('SELECT starttime FROM rundata WHERE id IN(SELECT max(id) FROM rundata)', (err, rows) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log(rows.rows[0]);
            res.send(rows.rows[0]);
        }
        // res.send(rows.rows[0]);
    });
});

app.get('/getLapStartTime', function(req, res) {
    client.query('SELECT starttime FROM lapdata WHERE runid = ($1) AND id IN(SELECT max(id) FROM lapdata)', [req.query.runid], (err, rows) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log(rows.rows[0]);
            res.send(rows.rows[0]);
        }

    });
});

/** Original version of endLapDataQuery*/
// function endLapDataQuery(runid, lapno, endtime) {
//   client.query('UPDATE lapdata SET endtime = ($3) WHERE runid = ($1) AND lapno = ($2)',
//    [runid, lapno, endtime], (err, rows) => {
//     if (err){
//       console.log(err.stack);
//     } else {
//       console.log(rows.rows[0]);
//     }

//     calculateEnergy(, function(res) {
//       // TODO: update total energy column
//       io.sockets.emit('Lap Ended', {lapno: lapno, time: time, totalenergy: res});
//     })
//   });
// }

function updateEndTime(runid, lapno, endtime, callback) {
    client.query('UPDATE lapdata SET endtime = ($3) WHERE runid = ($1) AND lapno = ($2)', [runid, lapno, endtime], (err, rows) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log(rows.rows[0]);
        }
        callback();
    });
}

function updateEnergy(runid, lapno, energy) {
    client.query('UPDATE lapdata SET energy = ($3) WHERE runid = ($1) AND lapno = ($2)', [runid, lapno, energy], (err, rows) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log(rows.rows[0]);
        }
    });
}

function startRunDataQuery(runname, time, callback) {
    console.log("START TIME IS " + time);
    client.query('INSERT INTO rundata (runname, starttime)' +
        'VALUES ($1, $2)', [runname, time], (err, rows) => {
            if (err) {
                console.log(err.stack);
            } else {
                console.log(rows.rows[0]);
            }
            io.sockets.emit('Run Started', {
                runname: runname,
                time: time
            });
            // res.end("sent");

        });
}
/** Second version: has callback parameter*/
function endRunData(endtime, callback) {
    console.log("in endrundata function");
    client.query('UPDATE rundata SET endtime = ($1)' +
        'WHERE id IN( SELECT max(id) FROM rundata)', [endtime], (err, rows) => {
            if (err) {
                console.log(err.stack);
            } else {
                console.log(rows.rows[0]);
            }
            callback();
        });
}

/** Original version: corresponds to end point*/
function endRunDataQuery(endtime, res) {
    client.query('UPDATE rundata SET endtime = ($1)' +
        'WHERE id IN( SELECT max(id) FROM rundata)', [endtime], (err, rows) => {
            if (err) {
                console.log(err.stack);
            } else {
                console.log(rows.rows[0]);
            }
            res.end("sent");
        });
}

// Logic:
// Two cases: Last run in the run table has either ended, or is ongoing
// Case 1: If run has ended, lap button is disabled. So this func wouldn't be called at all
// Case 2: If run is ongoing, lap table either has no laps of the run (start lap hasn't been clicked) or has laps.
// Case 2a: If lap table has no laps of the run, lap is 1.
// Case 2b: Else, it's latest lap no. + 1

function lapQuery(startTime) {
    var runID;
    var lapNo;

    // get runID
    client.query('SELECT id FROM rundata WHERE id IN(SELECT max(id) FROM rundata)', (err, rows) => {
        if (err) {
            console.log(err.stack);
            return;
        } else {
            runID = (rows.rows[0])['id'];
        }

        // get lapNo
        client.query('SELECT lapno FROM lapdata WHERE runid = ($1) AND id IN(SELECT max(id) FROM lapdata)', [runID], (err, rows) => {
            if (err) {
                console.log(err.stack);
                return;
            } else {
                if (rows.rows[0]) {
                    lapNo = (rows.rows[0])['lapno'];
                }
            }
            // end previous lap (if there's a previous lap)
            if (lapNo) {
                endLapDataQuery(runID, lapNo, startTime);
                // TODO: calculate cumulative energy
            }
            // insert query for next lap
            lapNo = (lapNo) ? lapNo + 1 : 1;
            startLapDataQuery(runID, lapNo, startTime)
        });

    });
}

// Webhook from live-timing.html: Post LapData
app.post('/startLapData', function(req, res) {
    console.log("reached add lap data request function");
    var runid = req.body.runid;
    var lapno = req.body.lapno;
    var starttime = req.body.starttime;
    startLapDataQuery(runid, lapno, starttime, res);

});

function endLapDataNoID(endtime) {
    client.query('SELECT lapno, runid FROM lapdata WHERE id IN(SELECT max(id) FROM lapdata)', (err, rows) => {

        if (err) {
            console.log(err.stack);
        } else {
            console.log(rows.rows);
            endLapDataQuery(rows.rows[0].runid, rows.rows[0].lapno, endtime);
        }
        // res.end("sent");
    });
}

app.post('/endLapDataNoID', function(req, res) {
    client.query('UPDATE lapdata SET endtime = ($1) WHERE id IN(SELECT max(id) FROM lapdata)', [req.body.endtime], (err, rows) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log(rows.rows[0]);
        }
        res.end("sent");
    });

});

app.post('/endLapData', function(req, res) {
    console.log("reached add lap data request function");
    var runid = req.body.runid;
    var lapno = req.body.lapno;
    var endtime = req.body.endtime;
    endLapDataQuery(runid, lapno, endtime, res);
});

// Webhook from live-timing.html: Post RunData
app.post('/startRunData', function(req, res) {
    console.log("reached add run data request function");
    var runname = req.body.runname;
    var starttime = req.body.starttime;
    startRunDataQuery(runname, starttime, res);

});

app.post('/endRunData', function(req, res) {
    console.log("reached end run data request function");
    var endtime = req.body.endtime;
    endRunDataQuery(endtime, res);
});

// Webhook from Electron: Post Data
app.post('/addData', function(req, res) {
    console.log("reached add request function");
    var data = req.body.data;
    console.log(req.body.data);
    var outputArr = parseDataBeta(data);
    pushToDatabase(outputArr);
});


app.get('/getRunID', function(req, res) {
    console.log("reached get run id");
    client.query('SELECT id FROM rundata WHERE id IN(SELECT max(id) FROM rundata)', (err, rows) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log(rows.rows[0]);
        }
        res.send(rows.rows[0]);
    });
});

app.get('/getRunName', function(req, res) {
    console.log("reached get run name");
    client.query('SELECT runname FROM rundata WHERE id IN(SELECT max(id) FROM rundata)', (err, rows) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log(rows.rows[0]);
        }
        res.send(rows.rows[0]);
    });
});

app.get('/isRunOngoing', function(req, res) {
    console.log("reached isRunOngoing");
    client.query('SELECT endtime FROM rundata WHERE id IN(SELECT max(id) FROM rundata)', (err, rows) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log(rows.rows[0]);
        }
        res.send(rows.rows[0]);
    });
});

app.get('/getLapNo', function(req, res) {
    console.log("in get lap number and the run id is " + req.query.runid);
    client.query('SELECT lapno FROM lapdata WHERE runid = ($1) AND id IN(SELECT max(id) FROM lapdata)', [req.query.runid], (err, rows) => {
        // console.log(rows);
        console.log(rows.rows);
        // console.log(rows.rows[0]);
        if (err) {
            console.log(err.stack);
        } else {
            console.log("no errors in " + rows.rows[0]);
        }
        res.send(rows.rows[0]);
    });
});

app.get('/getAllLapsInfoByRun', function(req, res) {
    console.log("in get lap number and the run id is " + req.query.runid);
    client.query('SELECT id, lapno, starttime, endtime, totalenergy, totaldistance FROM lapdata WHERE runid = ($1) ORDER BY id', [req.query.runid], (err, rows) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log("no errors in " + rows.rows);
        }
        res.send(rows.rows);
    });
});

app.get('/getAllRuns', function(req, res) {
    client.query('SELECT runid, runname, starttime, endtime, numlaps, totalenergy, totaldistance FROM (SELECT COUNT(*) AS numlaps, SUM(totalenergy) as totalenergy, SUM(totaldistance) as totaldistance, runid FROM lapdata GROUP BY runid) A, rundata B WHERE A.runid = B.id ORDER BY runid', (err, rows) => {
        // console.log(rows);
        console.log(rows.rows);
        // console.log(rows.rows[0]);
        if (err) {
            console.log(err.stack);
        } else {
            console.log("no errors in " + rows.rows);
        }
        res.send(rows.rows);
    });
});

app.get('/getLapTimingsByRun', function(req, res) {
    console.log("in get lap number and the run id is " + req.query.runid);
    client.query('SELECT lapno, starttime, endtime FROM lapdata WHERE runid = ($1)', [req.query.runid], (err, rows) => {
        // console.log(rows);
        console.log(rows.rows);
        // console.log(rows.rows[0]);
        if (err) {
            console.log(err.stack);
        } else {
            console.log("no errors in " + rows.rows);
        }
        res.send(rows.rows);
    });
});

app.get('/getRunNames', function(req, res) {
    console.log("in get runnames");
    client.query('SELECT runname FROM rundata WHERE runid = ($1)', [req.query.runid], (err, rows) => {
        // console.log(rows);
        console.log(rows.rows);
        // console.log(rows.rows[0]);
        if (err) {
            console.log(err.stack);
        } else {
            console.log("no errors in " + rows.rows[0]);
        }
        res.send(rows.rows);
    });
});

app.get('/getLapForLapId', function(req, res) {
  console.log("in getLapForLapId");
  client.query('SELECT * FROM lapdata WHERE id = ($1)', [req.query.lapid], (err, rows) => {
    if (err) {
      console.log(err.stack);
      return;
    }
    var data = rows.rows[0];
    var lapObject = new lap.Lap(data.id, data.runid, data.lapno, data.starttime, data.endtime, data.totalenergy, data.totaldistance);
    var upperLimit = data.endtime;
    if (data.endtime == null) {
      upperLimit = new Date();
      upperLimit = upperLimit.getTime();
    }
    client.query('SELECT * FROM data WHERE timestamp >= ($1) AND timestamp <= ($2)', [data.starttime, upperLimit], (err, rows) => {
      if (err) {
        console.log(err.stack);
        return;
      }
      lapObject.addData(rows.rows);
      res.send(JSON.stringify(lapObject));
    });
  });
});

function getAllDataForLap(startTime, endTime, callback) {
    client.query('SELECT * FROM data WHERE timestamp >= ($1) AND timestamp <= ($2)', [startTime, endTime], (err, rows) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log(rows.rows);
            callback(rows.rows);
        }
    })
}

// push into data for notes
app.post('/postNote', function(req, res) {
    // TODO: incomplete
    var time = req.body.time;
    var note = req.body.note;
    insertDataQuery(time, 'note', note);
});


// get polylines
app.get('/getPolylines', function(req, res) {
    console.log("in get lap polylines method" + req.query.lapid);

});

// Database: Get all results
app.get('/db', function(req, res) {
    client.query('SELECT * FROM data', (err, rows) => {
        if (err) {
            console.log(err.stack);
        } else {
            console.log(rows.rows[0]);
        }
        res.end("sent");
    });
});


/** Particle */

var particle = new Particle();
var token;
// Login
particle.login({
    username: 'cornellresistance@gmail.com',
    password: 'clifford'
}).then(
    function(data) {
        console.log('LOGGED IN.');
        token = data.body.access_token;
        console.log(token);
        getEventStream();
    },
    function(err) {
        console.log('Could not log in.', err);
    }
);

// Get event stream
function getEventStream() {
    console.log('Begin event stream.');
    particle.getEventStream({
        deviceId: 'mine',
        auth: token
    }).then(function(stream) {
        stream.on('event', function(json) {
            console.log(JSON.stringify(json, null, 4));
            emitWebsocket(parseDataBeta(json.data));
        });
    });
}

// Parse live data
function parseDataBeta(data) {
    var dataArr = data.split("_"); // split batched data

    var dataOutput = dataArr.map((dataI) => {
        var posSemicolon = dataI.indexOf(';');
        if (posSemicolon != -1) {
            if (dataI.length <= posSemicolon + 1) {
                return null;
            } // invalid data
            var dataType = dataI.substring(0, posSemicolon);

            switch (dataType) {
                case ("b"):
                    return parseBMS(dataI.substring(posSemicolon + 1, dataI.length));
                case ("gps"):
                    return parseGPS(dataI.substring(posSemicolon + 1, dataI.length));
                case ("mc"):
                    return parseMC(dataI.substring(posSemicolon + 1, dataI.length));
                default:
                    return null;
                    break; // discard data
            }
        }
    });
    return dataOutput;
}

function parseBMS(data) {
    // initial validity check: length should be 48 before ;time. discard if invalid
    var posSemicolon = data.indexOf(';');
    if (posSemicolon == -1) {
        return;
    }
    if (data.substring(0, posSemicolon).length != 48) {
        return;
    }

    // verify headers: if one header is wrong, discard data immediately
    // else if we may run into situation where we log faults into database, then
    // realise other headers are corrupted. discard if invalid

    if (data.substring(0, 1) != "F") {
        return;
    } // verify F
    if (data.substring(5, 6) != "C") {
        return;
    } // verify C
    if (data.substring(11, 12) != "V") {
        return;
    } // verify V
    if (data.substring(27, 28) != "T") {
        return;
    } // verify T
    if (data.length <= 50) {
        return;
    }

    var time = data.substring(49, data.length); // (new Date(parseInt(data.substring(49, data.length)))).toLocaleString();
    var faults = parseBMSFaults(data.substring(1, 5));
    var cur = parseBMSCurrent(data.substring(6, 11));
    var volt = parseBMSVolt(data.substring(12, 27));
    var temp = parseBMSTemp(data.substring(28, 48));

    return {
        dataType: 'BMS',
        data: {
            tempFault: faults[0],
            curFault: faults[1],
            voltFault: faults[2],
            emergFault: faults[3],
            current: cur,
            voltAve: volt,
            tempMax: temp
        },
        time: time
    };
    // io.sockets.emit('New Data_BMS', {tempFault: faults[0] ,curFault: faults[1], voltFault: faults[2], emergFault: faults[3],
    //                                  current: cur, voltAve: volt, tempMax: temp, time: time});
}


function parseBMSFaults(faults) {
    var tempFault = (faults.substring(0, 1) == '1');
    var curFault = (faults.substring(1, 2) == '1');
    var voltFault = (faults.substring(2, 3) == '1');
    var emergFault = (faults.substring(3, 4) == '1');
    // TODO: store into database
    return [tempFault, curFault, voltFault, emergFault];

}

function parseBMSCurrent(cur) {
    var cur = parseInt(cur);

    // TODO: store into database
    return cur;
}

function parseBMSVolt(volt) {
    var voltMax = parseInt(volt.substring(0, 5));
    var voltMin = parseInt(volt.substring(5, 10));
    var voltAve = parseInt(volt.substring(10, 15));
    voltMax = voltMax / (65535 / 5);
    voltMin = voltMin / (65535 / 5);
    voltAve = voltAve / (65535 / 5);

    // TODO: store into database

    return voltAve;
}

function parseBMSTemp(temp) {
    var temp1 = parseInt(temp.substring(0, 5));
    // int temp2 = parseInt(volt.substring(5,10));
    // int temp3 = parseInt(volt.substring(10,15));
    // int temp4 = parseInt(volt.substring(15,20));
    var maxTemp = temp1;
    for (var i = 1; i < 4; i++) {
        var tempI = parseInt(temp.substring(i * 5, i * 5 + 5));
        if (tempI > maxTemp) {
            maxTemp = tempI;
        }
    }
    return maxTemp;

    // TODO: store into database
}

function parseGPS(data) {
    var latSep = data.indexOf(',');
    if (latSep == -1 || data.length <= latSep + 1) {
        return;
    }
    var longSep = data.indexOf(',', latSep + 1);
    if (longSep == -1 || data.length <= longSep + 1) {
        return;
    }
    var altSep = data.indexOf(';');
    if (altSep == -1 || data.length <= altSep + 1) {
        return;
    }

    var lat = data.substring(0, latSep);
    var lng = data.substring(latSep + 1, longSep);
    var alt = data.substring(longSep + 1, altSep);
    var latLngAlt = data.substring(0, altSep);
    var time = data.substring(altSep + 1, data.length); //(new Date(parseInt(data.substring(altSep + 1, data.length)))).toLocaleString();

    return {
        dataType: 'GPS',
        data: {
            lat: lat,
            lng: lng,
            alt: alt
        },
        time: time
    };

    // store into database
    // websocket update
    // io.sockets.emit('New Data_GPS', {lat: lat, lng: lng, alt: alt, time: time});
}

function parseMC(data) {
    var sep = data.indexOf(';');
    if (sep == -1 || data.length <= sep + 1) {
        return;
    }
    var value = parseFloat(data.substring(0, sep));
    var time = data.substring(sep + 1, data.length); // (new Date(parseInt(data.substring(sep + 1, data.length)))).toLocaleString();
    return {
        dataType: 'MC',
        data: {
            value: value
        },
        time: time
    };
    // store into database
    // websocket update
    // io.sockets.emit('New Data_Speed', {value: value, time: time});
}

function pushToDatabase(outputArr) {
    for (var i = 0; i < outputArr.length; i++) {
        if (outputArr[i] != null || outputArr[i] != undefined) {
            switch (outputArr[i]['dataType']) {
                case ("BMS"):
                    insertDataQuery(outputArr[i]['time'], 'tempFault', outputArr[i]['data']['tempFault']);
                    insertDataQuery(outputArr[i]['time'], 'curFault', outputArr[i]['data']['curFault']);
                    insertDataQuery(outputArr[i]['time'], 'emergFault', outputArr[i]['data']['emergFault']);
                    insertDataQuery(outputArr[i]['time'], 'current', outputArr[i]['data']['current']);
                    insertDataQuery(outputArr[i]['time'], 'curFault', outputArr[i]['data']['curFault']);
                    insertDataQuery(outputArr[i]['time'], 'voltAve', outputArr[i]['data']['voltAve']);

                    break;
                case ("GPS"):
                    insertDataQuery(outputArr[i]['time'], 'GPS', outputArr[i]['data']);

                    break;
                case ("MC"):
                    insertDataQuery(outputArr[i]['time'], 'MC', outputArr[i]['data']);
                    break;
                default:
                    break; // discard data
            }
        }
    }
}

function emitWebsocket(outputArr) {
    for (var i = 0; i < outputArr.length; i++) {
        if (outputArr[i] != null || outputArr[i] != undefined) {
            switch (outputArr[i]['dataType']) {
                case ("BMS"):
                    console.log(outputArr['data']);
                    io.sockets.emit('New Data_BMS', {
                        data: outputArr[i]['data'],
                        time: outputArr[i]['time']
                    });
                    break;
                case ("GPS"):
                    io.sockets.emit('New Data_GPS', {
                        data: outputArr[i]['data'],
                        time: outputArr[i]['time']
                    });
                    break;
                case ("MC"):
                    io.sockets.emit('New Data_MC', {
                        data: outputArr[i]['data'],
                        time: outputArr[i]['time']
                    });
                    break;
                default:
                    break; // discard data
            }
        }
    }
}
