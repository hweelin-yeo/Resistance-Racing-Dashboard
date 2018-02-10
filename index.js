/** Framework Setup */
var express = require('express');
var app = express();
const { Client } = require('pg'); // database
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false, 
});

client.connect();

var bodyparser = require('body-parser');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

/** Server Information */
app.listen(process.env.PORT || 5000);

/** Particle Information */
var Particle = require('particle-api-js');
var particle = new Particle();
var token;
var device_ID = "34004a000251363131363432";

/** Race Information */
var lap = 1;

function insertDataQuery(property, value, res) {
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

function insertRunDataQuery(property, value, res) {
  client.query('INSERT INTO rundata (runid, lapno, starttime, endtime)' +
       'VALUES ($1, $2, $3)', [property, value], (err, rows) => {
      if (err){
        console.log(err.stack);
      } else {
        console.log(rows.rows[0]);
      }
      res.end("sent");
      
    });
}

 runid     | integer                     |           |          | 
 lapno     | integer                     |           |          | 
 starttime | timestamp without time zone |           |          | 
 endtime

// Database: Post Data
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
    insertDataQuery(property, value, res);
  }
});

// Database: Post runData
app.post('/addRunData', function (req, res) {
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
    insertQuery(property, value, res);
  }
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
