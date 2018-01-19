// USAGE: node generate-data.js

var sensorReadingsQueue = [];
const initDatetime = new Date();
const initEpoch = initDatetime.getTime();



// MockSensor class declaration
const MockSensor = function(name, frequency, generator) {
	this.name = name;
	this.frequency = frequency; // sensor reading frequency in ms
	this.generator = generator; // function(epoch) -> value
	this.connectSensor = function() {
		setInterval(function() {
			const nowDatetime = new Date();
			const nowEpoch = nowDatetime.getTime()/* - initEpoch */;
			sensorReadingsQueue.push({name: name, value: generator(nowEpoch), epoch: nowEpoch});
		}, this.frequency);
	};
};

/* Configure mock sensors */
const SpeedSensor = new MockSensor("speed", 500, function(epoch) {
	return 40 + 40*Math.sin(epoch/2000);
});
const ThrottleSensor = new MockSensor("throttle", 250, function(epoch) {
	return epoch % 2;
});
const FaultSensor = new MockSensor("fault", 5000, function(epoch) {
	return epoch % 4;
});
const GPSSensor = new MockSensor("gps", 1000, function(epoch) {
	if (!gpsLoaded) return;
	var latlon = waypoints[waypointIndex].lat + "," + waypoints[waypointIndex].lon;
	waypointIndex++;
	if (waypointIndex == waypoints.length) waypointIndex = 0;
	return latlon;
})
const ConnectedSensors = [SpeedSensor, ThrottleSensor, FaultSensor, GPSSensor];
ConnectedSensors.forEach(function(sensor) {
	sensor.connectSensor();
});
/* ---------------------- */

function constructBatch() {
	var batchStrings = [];
	sensorReadingsQueue.forEach(function(sensorReading) {
		batchStrings.push(sensorReading.name + ";" + sensorReading.value + ";" + sensorReading.epoch);
	});
	sensorReadingsQueue = [];
	const batchData = batchStrings.join("_");
	console.log("Sending batch to Particle Cloud...");
	var publishPromise = particle.publishEvent({ name: "general", data: batchData, auth: token });
	publishPromise.then(
  		function(data) {
    		if (data.body.ok) { console.log("Batch published!") }
  		},
  		function(err) {
    		console.log("Failed to publish batch: " + err)
    		console.log(batchData);
  		}
	);
}

const batchFrequency = 1000; // frequency (in ms) at which batches are to be published

/* Particle Setup */
var Particle = require('particle-api-js');
var particle = new Particle();
var token;
var device_ID = "34004a000251363131363432";
particle.login({username: 'cornellresistance@gmail.com', password: 'clifford'}).then(
  function(data) {
    console.log('Logged into particle...');
    token = data.body.access_token;
    sensorReadingsQueue = [];
    setInterval(constructBatch, batchFrequency);
  },
  function (err) {
    console.log('Could not log in.', err);
  }
);

/* GPX Things */
var gpxParse = require("gpx-parse");
var gpsLoaded = false;
var waypoints;
var waypointIndex = 0;
gpxParse.parseGpxFromFile("./sonoma-test.gpx.xml", function(error, data) {
	waypoints = data.tracks[0].segments[0];
	gpsLoaded = true;
});