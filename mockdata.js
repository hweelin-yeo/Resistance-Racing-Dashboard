// Sends a single JSON object as the Electron would send it
// Usage: node mock_data.js
var request = require('request');

var json_object =
	{
    	"data": "speed;415.22;100_throttle;415.22;102",
    	"ttl": 60,
    	"published_at": "2017-10-14T17:58:23.085Z",
		  "coreid": "api",
		  "name": "general"
  };

request({
    url: "http://intense-dawn-73114.herokuapp.com/add",
    method: "POST",
    headers: {
    },
    json: json_object,
    function(err, res, body){
        if(!err){
            console.log("Received response: " + res);
        } else{
            console.log("Received error: " + err);
        }
    }
});

request({
    url: "http://intense-dawn-73114.herokuapp.com/db",
    method: "GET",
    function(err, res, body){
        if(!err){
            console.log("Received response: " + res);
        } else{
            console.log("Received error: " + err);
        }
    }
});

/*
  Current data format:
  [object Object] {
  "data": "{property: \"lap\", value: 2}",
  "ttl": 60,
  "published_at": "2017-10-14T17:58:23.085Z",
  "coreid": "api",
  "name": "general"
}*/
