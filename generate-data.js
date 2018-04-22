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
			const nowEpoch = Math.round(nowDatetime.getTime() / 1000)/* - initEpoch */;
			sensorReadingsQueue.push({name: name, value: generator(nowEpoch), epoch: nowEpoch});
		}, this.frequency);
	};
};

/* Configure mock sensors */
const SpeedSensor = new MockSensor("speed", 500, function(epoch) {
	return 40 + 40*Math.sin(epoch/(2000* 2));
});
const ThrottleSensor = new MockSensor("throttle", 250, function(epoch) {
	return epoch % 2;
});
const FaultSensor = new MockSensor("fault", 5000, function(epoch) {
	return epoch % 4;
});
const GPSSensor = new MockSensor("gps", 1500, function(epoch) {
	if (!gpsLoaded) return;
	var latlon = waypoints[waypointIndex].lat + "," + waypoints[waypointIndex].lon + ",0.0";
	waypointIndex+=1;
	if (waypointIndex == waypoints.length) waypointIndex = 0;
	return latlon;
});
const VoltageSensor = new MockSensor("voltage", 1000, function(epoch) {
	var relative = epoch - initEpoch;
	return Math.round(1000*Math.max(40, 50 - 10*(relative/1800000.0)))/1000.0;
});
const CurrentSensor = new MockSensor("current", 1000, function(epoch) {
	var r = Math.random();
	return r > 0.8 ? 0.0: 20.0;
});
const MCSensor = new MockSensor("mc", 500, function(epoch) {
	return (15 + 15*Math.sin(epoch/2))/(0.03 * Math.PI / 6.0);
});
const BMSSensor = new MockSensor("b", 1500, function(epoch) {
	return "FzzzzC00010V524285242852428T12345678901234567890";
});
const ConnectedSensors = [GPSSensor, MCSensor, BMSSensor];
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
	var publishPromise = particle.publishEvent({ name: "UART", data: batchData, auth: token });
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

const batchFrequency = 1200; // frequency (in ms) at which batches are to be published

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
gpxParse.parseGpxFromFile("./static/shell-track.gpx.txt", function(error, data) {
	waypoints = data.tracks[0].segments[0];
	gpsLoaded = true;
});
