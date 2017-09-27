$(document).ready(function() {
    // demo
  $("#demo").html("Hello, World!");

	var Particle = require('particle-api-js');
	var particle = new Particle();
	var token;


	particle.login({username: 'cornellresistance@email.com', password: 'clifford'}).then(
  function(data) {
    token = data.body.access_token;
  },
  function (err) {
    console.log('Could not log in.', err);
  }
);

});