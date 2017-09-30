var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.get('/webhook', function(req, res) {
  res.write("test");
})
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
  });
});

}
