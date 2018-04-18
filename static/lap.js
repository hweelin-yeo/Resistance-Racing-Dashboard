/**
 * lap.js defines a class that encapsulates all the information about a
 * particular lap entity, and provides functions to extract properties
 */

const VOLTAGE_PROP = "voltage";
const CURRENT_PROP = "current";

// Constructor: lap_id, run_id, lap_no and start_time are required
// end_time and energy_used can be null for ongoing laps
function Lap(lap_id, run_id, lap_no, start_time, end_time, energy_used) {
  this.lap_id = lap_id;
  this.run_id = run_id;
  this.lap_no = lap_no;
  this.start_time = start_time;
  this.end_time = end_time;
  this.energy_used = energy_used;
  this.data = []; // each data object contains a timestamp, property and value
}

// Useful functions:
Lap.prototype.getTotalTime = function() {
  if (this.isOngoing()) {
    return null;
  } else {
    return this.end_time - this.start_time;
  }
}

// Compare to another lap based on specified property
Lap.prototype.compareTo = function(that, property) {
  // TODO
}

// Append new data to this lap
Lap.prototype.addData = function(newData) {
  this.data.push(newData);
  this.data.sort(function(a, b) {
    a.timestamp - b.timestamp;
  });
}

Lap.prototype.computeEnergyUsed = function() {
  if (this.isOngoing()) {
    return null;          // TODO implement
  } else {
    const voltageData = this.getDataByProperty(VOLTAGE_PROP);
    const currentData = this.getDataByProperty(CURRENT_PROP);
    var power = 0;
    var prevTime = this.start_time;
    for (var i = 0; i < voltageData.length; i++) {
      const timeOfReading = voltageData[i].timestamp;
      const voltage = voltageData[i].value;
      const current = this.getVirtualData(timeOfReading, CURRENT_PROP);
      power += (voltage.value * current.value * (timeOfReading - prevTime));
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
    return (a.timestamp > time);
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
    const t2 = propertyData[secondIndex].timestamp;
    const v1 = propertyData[secondIndex-1].value;
    const t1 = propertyData[secondIndex-1].timestamp;
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

module.exports.Lap = Lap;