/** Frameworks/Modules setup */
var express = require('express');
var app = express();
var pg = require('pg'); // database
var bodyparser = require('body-parser');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

/** Servers */
app.listen(process.env.PORT || 5000);

var Particle = require('particle-api-js');
var particle = new Particle();
var token;

/** Particle */

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
// function getEventStream() {
// 	//Successful login: get devices events
//   console.log('Begin event stream.');
//   console.log(token);
// 	particle.getEventStream({ deviceId: 'mine', auth: token }).then(function(stream) {
//   stream.on('event', function(data) {
//
//     console.log("Event: " + data);
//     console.log(JSON.stringify(data, null, 4));
//     console.log("trying to retrieve data");
//   });
// });
// }


// Database: Post data
app.post('/add', function (req, res) {
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


    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query('INSERT INTO data (timestamp, property, value)' +
      'VALUES (NOW(), $1, $2)',
      [(property), (value)]); {
        done();
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
  }

  // parsed = JSON.parse(data);
  // console.log(parsed);
  // property = parsed.property;
  // console.log(property);
  });

  // Database: Get all results
  app.get('/db', function (req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query('SELECT * FROM data', function(err, result) {
        done();
        if (err)
         { console.error(err); res.send("Error " + err); }
        else
         {
           res.send({results: result.rows});}
           // response.render('pages/db', {results: result.rows} ); }
      });
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
