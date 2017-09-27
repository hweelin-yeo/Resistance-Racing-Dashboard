var Particle = require('particle-api-js');
var particle = new Particle();
var token;


	particle.login({username: 'cornellresistance@gmail.com', password: 'clifford'}).then(
  function(data) {
    console.log('LOGGED IN.');
    token = data.body.access_token;
  },
  function (err) {
    console.log('Could not log in.', err);
  }
);