var express = require('express');
var app = express();
var pg = require('pg'); // database
var bodyparser = require('body-parser');


app.listen(process.env.PORT || 5000);

var Particle = require('particle-api-js');
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
	//Successful login: get devices events
  console.log('Begin event stream.');
  console.log(token);
	particle.getEventStream({ deviceId: 'mine', auth: token }).then(function(stream) {
  stream.on('event', function(data) {

    console.log("Event: " + data);
    console.log(JSON.stringify(data, null, 4));
    console.log("trying to retrieve data");
    console.log(JSON.parse(data.data));
  });
});
}

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

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

// Parse Particle data
/** This is the event data sent from Particle:

Event: [object Object] {
  "data": "{property: \"lap\", value: 2}",
  "ttl": 60,
  "published_at": "2017-10-14T17:58:23.085Z",
  "coreid": "api",
  "name": "general"
}

Use json parser to get req.body.data.property, req.body.data.value **/
