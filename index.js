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
app.use('/user-test', express.static('control-speed.html'))
app.use(express.static('static'))

/** Server Information */
app.listen(process.env.PORT || 5000, function() {
  console.log("Listening on port " + (process.env.PORT || 5000));
});

/** Particle Information */
var Particle = require('particle-api-js');
var particle = new Particle();
var token;
var device_ID = "34004a000251363131363432";

/** Race Information */
var lap = 1;

function insertDataQuery(time, property, value, res) {
  client.query('INSERT INTO data (timestamp, property, value)' +
       'VALUES ($1, $2, $3)', [time, property, value], (err, rows) => {
      if (err){
        console.log(err.stack);
      } else {
        console.log(rows.rows[0]);
      }
      res.end("sent");
      
    });
}

function startLapDataQuery(runid, lapno, starttime, res) {
  client.query('INSERT INTO lapdata (runid, lapno, starttime)' +
       'VALUES ($1, $2, $3)', [runid, lapno, starttime], (err, rows) => {
      if (err){
        console.log(err.stack);
      } else {
        console.log(rows.rows[0]);
      }
      res.end("sent");
      
    });
}

function endLapDataQuery(runid, lapno, endtime, res) {
  client.query('UPDATE lapdata SET endtime = ($3) WHERE runid = ($1) AND lapno = ($2)', 
       [runid, lapno, endtime], (err, rows) => {
      if (err){
        console.log(err.stack);
      } else {
        console.log(rows.rows[0]);
      }
      res.end("sent");
      
    });
}

function startRunDataQuery(runname, starttime, res) {
  console.log("START TIME IS "+ starttime);
  client.query('INSERT INTO rundata (runname, starttime)' +
       'VALUES ($1, $2)', [runname, starttime], (err, rows) => {
      if (err){
        console.log(err.stack);
      } else {
        console.log(rows.rows[0]);
      }
      res.end("sent");
      
    });
}

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

// Webhook from live-timing.html: Post LapData
app.post('/startLapData', function (req, res) {
  console.log("reached add lap data request function");
  var runid = req.body.runid;
  var lapno = req.body.lapno;
  var starttime = req.body.starttime;
  startLapDataQuery(runid, lapno, starttime, res);
  
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

  app.get('/getLapNo', function (req, res) {
    client.query('SELECT lapno FROM lapdata WHERE runid = ($1) AND id IN(SELECT max(id) FROM rundata)', [req.runid], (err, rows) => {
      if (err){
        console.log(err.stack);
      } else {
        console.log(rows.rows[0]);
      }
      res.send(rows.rows[0]);
    });
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

/**
  // Database: Post data
  app.post('/add', function (req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query('INSERT INTO data (timestamp, property, value)' +
      'VALUES (NOW(), $1, $2)', [
        req.body.property, req.body.value]); {
        done();
        console.log([
          req.body.property, req.body.value]);
        //res.redirect('/db');

        if (err)
         { console.error(err); res.send("Error " + err); }
        else
         {
           console.log("RES.SEND sent response back")
           res.send("sent response back")
         }
       };
      });
    });
/** This is the event data sent from Particle:

Event: [object Object] {
  "data": "{property: \"lap\", value: 2}",
  "ttl": 60,
  "published_at": "2017-10-14T17:58:23.085Z",
  "coreid": "api",
  "name": "general"
}

Use json parser to get req.body.data.property, req.body.data.value **/
