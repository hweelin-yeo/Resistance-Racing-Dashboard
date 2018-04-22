/**
 * lap.js defines a class that encapsulates all the information about a
 * particular lap entity, and provides functions to extract properties
 */

const VOLTAGE_PROP = "voltage";
const CURRENT_PROP = "current";
const LAT_PROP = "gps_lat";
const LON_PROP = "gps_lon";

// Constructor: lap_id, run_id, lap_no and start_time are required
// end_time and energy_used can be null for ongoing laps
function Lap(lap_id, run_id, lap_no, start_time, end_time, energy_used, distance) {
  this.lap_id = lap_id;
  this.run_id = run_id;
  this.lap_no = lap_no;
  this.start_time = start_time;
  this.end_time = end_time;
  this.energy_used = energy_used;
  this.distance = distance;
  this.data = []; // each data object contains a timestamp, property and value
}

// Useful functions:
Lap.prototype.computeEfficiency = function() {
  if (this.distance == null || this.energy_used == null) {
    return null;
  } else {
    return this.distance / this.energy_used;
  }
}

Lap.prototype.computeDistance = function() {
  if (this.isOngoing()) {
    return null;
  } else {
    var sumDistance = 0;
    const latData = this.getDataByProperty(LAT_PROP);
    const lonData = this.getDataByProperty(LON_PROP);
    if (latData.length == 0 || lonData.length == 0) return 0;

    var distance = 0;
    var prevLat = latData[0].value;
    var prevLon = lonData[0].value;
    var minLatLonDataLength = Math.min(latData.length, lonData.length); // prevent unexpected index out of bounds at for loop

    for (var i = 0; i < minLatLonDataLength; i++) {
      const lat = latData[i].value;
      const lon = lonData[i].value;
      distance += getDistanceFromLatLonInM(prevLat, prevLon, lat, lon);
      prevLat = lat;
      prevLon = lon;
    }
    return distance;
  }
}

function getDistanceFromLatLonInM(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c * 1000; // Distance in m
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

Lap.prototype.getTotalTime = function() {
  if (this.isOngoing()) {
    return null;
  } else {
    return new Date(this.end_time) - new Date(this.start_time);
  }
}

// Compare to another lap based on specified property
Lap.prototype.compareTo = function(that, property) {
  // TODO
}

// Append new data to this lap
Lap.prototype.addData = function(newData) {
  this.data = this.data.concat(newData);
  this.data.sort(function(a, b) {
    return a.timestamp - b.timestamp;
  });
}

Lap.prototype.computeEnergyUsed = function() {
  if (this.isOngoing()) {
    return null;          // TODO implement
  } else {
    const voltageData = this.getDataByProperty(VOLTAGE_PROP);
    const currentData = this.getDataByProperty(CURRENT_PROP);
    var power = 0;
    var prevTime = this.start_time * 1000;
    console.log("COMPUTE ENERGY USED: starttime " + prevTime);
    for (var i = 0; i < voltageData.length; i++) {
      const timeOfReading = voltageData[i].timestamp;
      const voltage = voltageData[i].value;
      const current = this.getVirtualData(timeOfReading, CURRENT_PROP);
      console.log("COMPUTE ENERGY USED: voltage " + voltage);
      console.log("COMPUTE ENERGY USED: current " + current);
      console.log("COMPUTE ENERGY USED: time " + (new Date(timeOfReading) - new Date(prevTime)));
      power += (voltage * current * (new Date(timeOfReading) - new Date(prevTime)) / 1000.0);
      console.log("COMPUTE ENERGY USED: power " + power);
      prevTime = timeOfReading;
    }
    return power;
  }
}

// ASSUMES LINEAR INTERPOLATION
// ASSUMES CONSTANT READINGS FROM START -> FIRST READING, AND FROM
// LAST READING -> END / CURRENT TIME
Lap.prototype.getVirtualData = function(time, property) {
  const propertyData = this.getDataByProperty(property);
  if (propertyData.length == 0) {
    return null;      // Can't estimate anything about the lap if no data
  }
  var secondIndex = propertyData.findIndex(function(a) {
    return (new Date(a.timestamp) > new Date(time));
  });
  // Three cases:
  // 1. secondIndex = 0 (interpolate from start)
  // 2. secondIndex = -1 (interpolate at the end)
  // 3. secondIndex is anywhere else, in which case we interpolate between
  //    secondIndex - 1 and secondIndex.
  if (secondIndex == 0) {
    return propertyData[0].value;
  } else if (secondIndex == -1) {
    return propertyData[propertyData.length-1].value;
  } else {
    const v2 = propertyData[secondIndex].value;
    const t2 = new Date(propertyData[secondIndex].timestamp);
    const v1 = propertyData[secondIndex-1].value;
    const t1 = new Date(propertyData[secondIndex-1].timestamp);
    const ratio = (time - t1)/(t2 - t1);
    return (1 - ratio) * v1 + (ratio) * v2;
  }
}

Lap.prototype.getDataByProperty = function(property) {
  return this.data.filter(function(a) {
    return (a.property == property);
  })
}

Lap.prototype.isOngoing = function() {
  return (this.end_time == null);
}

// Primary Setters
Lap.prototype.setLapId = function(lap_id) {
  this.lap_id = lap_id;
}

Lap.prototype.setRunId = function(run_id) {
  this.run_id = run_id;
}

Lap.prototype.setLapNo = function(lap_no) {
  this.lap_no = lap_no;
}

Lap.prototype.setStartTime = function(start_time) {
  this.start_time = start_time;
}

Lap.prototype.setEndTime = function(end_time) {
  this.end_time = end_time;
}

Lap.prototype.setEnergyUsed = function(energy_used) {
  this.energy_used = energy_used;
}

Lap.prototype.setData = function(data) {
  this.data = data;
}

Lap.prototype.setDistance = function(distance) {
  this.distance = distance;
}

// Primary Getters
Lap.prototype.getLapId = function() {
  return this.lap_id;
}

Lap.prototype.getRunId = function() {
  return this.run_id;
}

Lap.prototype.getLapNo = function() {
  return this.lap_no;
}

Lap.prototype.getStartTime = function() {
  return this.start_time;
}

Lap.prototype.getEndTime = function() {
  return this.end_time;
}

Lap.prototype.getEnergyUsed = function() {
  return this.energy_used;
}

Lap.prototype.getData = function() {
  return this.data;
}

Lap.prototype.getDistance = function() {
  return this.distance;
}
