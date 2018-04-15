/** Framework Setup */
var express = require('express');
var app = express();
const { Client } = require('pg'); // database
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false, 
});


client.connect((err) => { if (err) console.log("Postgres connection error: " + err)});

var bodyparser = require('body-parser');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/live', express.static('live-timing.html'))
app.use('/websocket-test', express.static('websocket-test.html'))
app.use('/user-test', express.static('control-speed.html'))
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

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

  // Lap Button
  socket.on('Next Lap', function (data) {
    lapQuery(data['time']);
  });

  // Run Button
  socket.on('Start Run', function (data) {
    var runname = data['runname'];
    var time = data['time'];
    startRunDataQuery(runname, time);
  });

  socket.on('End Run', function (data) {
    console.log("server receives end run");
    var time = data['time'];
    endRunData(time, function() {
      endLapDataNoID(time, function(){
        io.sockets.emit('Run Ended', {time: time}); 
      });
    });
  });

});



/** Particle Information */
var Particle = require('particle-api-js');
var particle = new Particle();
var token;
var device_ID = "34004a000251363131363432";

function insertDataQuery(time, property, value) {
  client.query('INSERT INTO data (timestamp, property, value)' +
   'VALUES ($1, $2, $3)', [time, property, value], (err, rows) => {
    if (err){
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
    if (err){
      console.log(err.stack);
    } else {
      console.log(rows.rows[0]);
    }
    io.sockets.emit('Lap Started', {lapno: lapno, time: time}); 
  });
}

function endLapDataQuery(runid, lapno, endtime) {
  updateEndTime(runid, lapno, endtime, function() {
    // updateEnergy(runid, lapno, res);
    io.sockets.emit('Lap Ended', {lapno: lapno, totaltime: 0, totalenergy: 0}); // TODO: discuss with karun to get methods
  });
}

function getStartTime(runid, lapno, callback) {
  client.query('SELECT starttime FROM lapdata WHERE runid = ($1) AND lapno = ($2)', 
    [runid, lapno], (err, rows) => {
    if (err){
      console.log(err.stack);
    } else {
      console.log(rows.rows[0]);
      callback(rows.rows[0]);
    }
  });
}

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
  client.query('UPDATE lapdata SET endtime = ($3) WHERE runid = ($1) AND lapno = ($2)', 
   [runid, lapno, endtime], (err, rows) => {
    if (err){
      console.log(err.stack);
    } else {
      console.log(rows.rows[0]);
    }
    callback();
  });
}

function updateEnergy(runid, lapno, energy) {
  client.query('UPDATE lapdata SET energy = ($3) WHERE runid = ($1) AND lapno = ($2)', 
    [runid, lapno, energy], (err, rows) => {
      if (err){
        console.log(err.stack);
      } else {
        console.log(rows.rows[0]);
      }
    });
}

function startRunDataQuery(runname, time, callback) {
  console.log("START TIME IS "+ time);
  client.query('INSERT INTO rundata (runname, starttime)' +
   'VALUES ($1, $2)', [runname, time], (err, rows) => {
    if (err){
      console.log(err.stack);
    } else {
      console.log(rows.rows[0]);
    }
    io.sockets.emit('Run Started', {runname: runname, time: time}); 
    // res.end("sent");

  });
}
/** Second version: has callback parameter*/
function endRunData(endtime, callback) {
  console.log("in endrundata function");
  client.query('UPDATE rundata SET endtime = ($1)' +
    'WHERE id IN( SELECT max(id) FROM rundata)', [endtime], (err, rows) => {
      if (err){
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
    'WHERE id IN( SELECT max(id) FROM rundata)', 
    [endtime], (err, rows) => {
      if (err){
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
      if (err) {console.log(err.stack); return;} else { 
        runID = (rows.rows[0])['id'];
      }
      
      // get lapNo
      client.query('SELECT lapno FROM lapdata WHERE runid = ($1) AND id IN(SELECT max(id) FROM lapdata)', [runID], (err, rows) => {
        if (err) {console.log(err.stack); return; } else { 
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
  app.post('/startLapData', function (req, res) {
    console.log("reached add lap data request function");
    var runid = req.body.runid;
    var lapno = req.body.lapno;
    var starttime = req.body.starttime;
    startLapDataQuery(runid, lapno, starttime, res);
    
  });

  function endLapDataNoID(endtime, callback) {
    client.query('UPDATE lapdata SET endtime = ($1) WHERE id IN(SELECT max(id) FROM lapdata)', 
     [endtime], (err, rows) => {
      if (err){
        console.log(err.stack);
      } else {
        console.log(rows.rows[0]);
      }
      // res.end("sent"); 
      callback();
    });
  }

  app.post('/endLapDataNoID', function (req, res) {
    client.query('UPDATE lapdata SET endtime = ($1) WHERE id IN(SELECT max(id) FROM lapdata)', 
     [req.body.endtime], (err, rows) => {
      if (err){
        console.log(err.stack);
      } else {
        console.log(rows.rows[0]);
      }
      res.end("sent"); 
    });
    
  });

  app.post('/endLapData', function (req, res) {
    console.log("reached add lap data request function");
    var runid = req.body.runid;
    var lapno = req.body.lapno;
    var endtime = req.body.endtime;
    endLapDataQuery(runid, lapno, endtime, res);
  });

  // Webhook from live-timing.html: Post RunData
  app.post('/startRunData', function (req, res) {
    console.log("reached add run data request function");
    var runname = req.body.runname;
    var starttime = req.body.starttime;
    startRunDataQuery(runname, starttime, res);
    
  });

  app.post('/endRunData', function (req, res) {
    console.log("reached end run data request function");
    var endtime = req.body.endtime;
    endRunDataQuery(endtime, res);
  });

  // Webhook from Electron: Post Data
  app.post('/addData', function (req, res) {
    console.log("reached add request function");
    var data = req.body.data;
    console.log(req.body.data);

    var data_arr = data.split("_");
    for (var i in data_arr) {

      var data_i = data_arr[i];
      var data_i_arr = data_i.split(";");

      var property = data_i_arr[0];
      var value = data_i_arr[1];
      var time = data_i_arr[2];
      console.log(value);
      insertDataQuery(time, property, value, res);
    }
  });


  app.get('/getRunID', function (req, res) {
    console.log("reached get run id");
    client.query('SELECT id FROM rundata WHERE id IN(SELECT max(id) FROM rundata)', (err, rows) => {
      if (err){
        console.log(err.stack);
      } else {
        console.log(rows.rows[0]);
      }
      res.send(rows.rows[0]);
    });
  });

  app.get('/getRunName', function (req, res) {
    console.log("reached get run name");
    client.query('SELECT runname FROM rundata WHERE id IN(SELECT max(id) FROM rundata)', (err, rows) => {
      if (err){
        console.log(err.stack);
      } else {
        console.log(rows.rows[0]);
      }
      res.send(rows.rows[0]);
    });
  });

  app.get('/isRunOngoing', function (req, res) {
    console.log("reached isRunOngoing");
    client.query('SELECT endtime FROM rundata WHERE id IN(SELECT max(id) FROM rundata)', (err, rows) => {
      if (err){
        console.log(err.stack);
      } else {
        console.log(rows.rows[0]);
      }
      res.send(rows.rows[0]);
    });
  });

  app.get('/getLapNo', function (req, res) {
    console.log("in get lap number and the run id is " + req.query.runid);
    client.query('SELECT lapno FROM lapdata WHERE runid = ($1) AND id IN(SELECT max(id) FROM lapdata)', [req.query.runid], (err, rows) => {
      // console.log(rows);
      console.log(rows.rows);
      // console.log(rows.rows[0]);
      if (err){
        console.log(err.stack);
      } else {
        console.log("no errors in " + rows.rows[0]);
      }
      res.send(rows.rows[0]);
    });
  });

  app.get('/getLapTimingsByRun', function (req, res) {
    console.log("in get lap number and the run id is " + req.query.runid);
    client.query('SELECT lapno, starttime, endtime FROM lapdata WHERE runid = ($1)', [req.query.runid], (err, rows) => {
      // console.log(rows);
      console.log(rows.rows);
      // console.log(rows.rows[0]);
      if (err){
        console.log(err.stack);
      } else {
        console.log("no errors in " + rows.rows);
      }
      res.send(rows.rows);
    });
  });

  app.get('/getRunNames', function (req, res) {
    console.log("in get runnames");
    client.query('SELECT runname FROM rundata WHERE runid = ($1))', [req.query.runid], (err, rows) => {
      // console.log(rows);
      console.log(rows.rows);
      // console.log(rows.rows[0]);
      if (err){
        console.log(err.stack);
      } else {
        console.log("no errors in " + rows.rows[0]);
      }
      res.send(rows.rows);
    });
  });


  // get polylines
  app.get('/getPolylines', function (req, res) {
    console.log("in get lap polylines method" + req.query.lapid);
    
  });

  // Database: Get all results
  app.get('/db', function (req, res) {
    client.query('SELECT * FROM data', (err, rows) => {
      if (err){
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
    particle.login({username: 'cornellresistance@gmail.com', password: 'clifford'}).then(
      function(data) {
        console.log('LOGGED IN.');
        token = data.body.access_token;
        console.log(token);
        getEventStream();
      },
      function (err) {
        console.log('Could not log in.', err);
      }
      );

    // Get event stream
    function getEventStream() {
      console.log('Begin event stream.');
      particle.getEventStream({ deviceId: 'mine', auth: token }).then(function(stream) {
        stream.on('event', function(json) {
          console.log(JSON.stringify(json, null, 4));
          parseDataBeta (json.data); //TODO: implement this
        });
      });
    }

    // Parse live data
    function parseDataBeta (data) {
      var dataArr = data.split("_"); // split batched data

      for (var i in dataArr) {
        var dataI = dataArr[i];
        var posSemicolon = dataI.indexOf(';');

        if (posSemicolon != -1) {
          if (dataI.length <= posSemicolon + 1) {return;} // invalid data
          var dataType = dataI.substring(0,posSemicolon);
          
          switch (dataType) {
            case (b):
              parseBMS(dataI.substring(posSemicolon+1, dataI.length));  
              break;
            case (gps):
              parseGPS(dataI.substring(posSemicolon+1, dataI.length));
              break;
            case (mc):
              parseMC(dataI.substring(posSemicolon+1, dataI.length));
              break;
            default:
              break; // discard data
          }
        }
      }
    }

    function parseBMS(data) {
      // initial validity check: length should be 48 before ;time. discard if invalid
      var posSemicolon = dataI.indexOf(';');
      if (posSemicolon == -1) { return; }
      if (data.substring(0,posSemicolon).length != 48) { return; }

      // verify headers: if one header is wrong, discard data immediately 
      // else if we may run into situation where we log faults into database, then 
      // realise other headers are corrupted. discard if invalid

      if (data.substring(0,1) != "F") { return;} // verify F
      if (data.substring(5,6) != "C") { return;} // verify C
      if (data.substring(11,12) != "V") { return;} // verify V
      if (data.substring(27,28) != "T") { return;} // verify T
      if (data.length <= 50) { return; }

      var time = data.substring(49, data.length);
      parseBMSFaults(data.substring(1, 5), time);
      parseBMSCurrent(data.substring(6, 11), time);
      parseBMSVolt(data.substring(11, 27), time);
      parseBMSTemp(data.substring(28, 48), time);
    }


    function parseBMSFaults(faults, time) {
      var tempFault = (faults.substring(0,1) == '1') ? 1 : 0;
      var curFault = (faults.substring(1,2) == '1') ? 1 : 0;
      var voltFault = (faults.substring(2,3) == '1') ? 1 : 0;
      var emergFault = (faults.substring(3,4) == '1') ? 1 : 0;

      // store into database
      // websocket update
      io.sockets.emit('New Data', {property: faults, value: 1010, time: time}); 
    }

    function parseBMSCurrent(cur, time) {
      var cur = parseInt(cur);

      // store into database
      // websocket update
    }

    function parseBMSVolt(volt, time) {
      var voltMax = parseInt(volt.substring(0,5));
      var voltMin = parseInt(volt.substring(5,10));
      var voltAve = parseInt(volt.substring(10,15));
      voltMax = voltMax/ (65535/5);
      voltMin = voltMin/ (65535/5);
      voltAve = voltAve/ (65535/5);

      // store into database
      // websocket update
    }

    function parseBMSTemp(temp, time) {
      var temp1 = parseInt(volt.substring(0,5));
      // int temp2 = parseInt(volt.substring(5,10));
      // int temp3 = parseInt(volt.substring(10,15));
      // int temp4 = parseInt(volt.substring(15,20));
      var maxTemp = temp1;
      for (var i = 1; i < 4; i++) {
        var temp = parseInt(volt.substring(i * 5, i * 5 + 5));
        if (temp > maxTemp) {
          maxTemp = temp;
        }
      }

      // store into database
    }

    function parseGPS(data) {
      // int latSep = dataI.indexOf(',');
      // if (latSep == -1 || data.length <= latSep + 1) { return; }
      // int longSep = dataI.indexOf(',', latSep);
      // if (longSep == -1 || data.length <= longSep + 1) { return; }
      var altSep = dataI.indexOf(';');
      if (altSep == -1 || data.length <= altSepalt + 1) { return; }

      var latLngAlt = data.substring(0, altSep);
      var time = data.substring(altSep + 1, data.length);

      // store into database
      // websocket update
      io.sockets.emit('New Data', {property: gps, value: latLngAlt, time: time}); 

    }

    function parseMC(data) {
     var sep = dataI.indexOf(';');
     if (sep == -1 || data.length <= sep + 1) { return; }
     var value = parseFloat(data.substring(0, sep));
     var time = data.substring(sep + 1, data.length);

     // store into database
     // websocket update
      io.sockets.emit('New Data', {property: speed, value: value, time: time}); 
    }


