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
function getEventStream() {
	//Successful login: get devices events
  console.log('Begin event stream.');
  console.log(token);
	particle.getEventStream({ deviceId: 'mine', auth: token }).then(function(stream) {
  stream.on('event', function(data) {

    console.log("Event: " + data);
    console.log(JSON.stringify(data, null, 4));
    console.log("trying to retrieve data");
  });
});
}

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


// Database: Post data
app.post('/add', function (req, res) {
  console.log("reached add request function");
  console.log("edit 2");
  console.log(req.body.data);
  data = req.body.data;
  string = JSON.stringify(data, null, 4)
  parsed = JSON.parse(string);
  console.log(parsed.property);
  console.log("before pg connect");
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('INSERT INTO data (timestamp, property, value)' +
    'VALUES (NOW(), $1, $2)', [
      (JSON.parse(JSON.parse(req.body).data).property), (JSON.parse(JSON.parse(req.body).data).value)
      // (JSON.parse(req.body.data["property"])), (JSON.parse(req.body.data["value"]))
    ]); {
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
  });

  function makeMockRequest() {
    var request = require('request');

    var request = require('request');

    // Configure the request
    var options = {
      url: process.env.DATABASE_URL + "/add",
      method: 'POST',
      form: {"data": "{property: \"lap\", value: 2}",
        "ttl": 60,
        "published_at": "2017-10-14T17:58:23.085Z",
        "coreid": "api",
        "name": "general"
      }

    }

    // Start the request
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          // Print out the response body
        console.log(body);
      }
    })
  }
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
