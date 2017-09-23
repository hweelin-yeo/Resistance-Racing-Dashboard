
function loadScript() {

var Particle = require('particle-api-js');
var particle = new Particle();
var token;

console.log('Logged in');

particle.login({username: 'cornellresistance@email.com', password: 'clifford'}).then(
  console.log('Logged in');
  function(data) {
    console.log('API call completed on promise resolve: ', data.body.access_token);
  },
  token = data.body.access_token;
},

function (err) {
  console.log('Could not log in.', err);
}
);

}
