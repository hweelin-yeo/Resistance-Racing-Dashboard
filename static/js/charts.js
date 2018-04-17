/* Charting JS */
'use strict';

// ----------- SPEED ------------
var speedChart = realTimeChart()
.title(" ")
.yTitle("kmph")
.xTitle("time")
.border(true)
.width(800)
.height(290)
.barWidth(1)
.minY(0)
.maxY(100);
d3.select("#speedChart").append("div")
.attr("id", "chartDiv")
.call(speedChart);

function pushSpeedChart(value, time) {
  var dt = new Date(parseInt(time));
  var obj = {
    value: value,
    time: dt,
    color: "#0949b7", // TODO choose relevant color
    ts: dt.getTime(),
  };
  speedChart.datum(obj);
}

// ----------- THROTTLE ------------
var throttleChart = realTimeChart()
.title(" ")
.yTitle("on/off")
.xTitle("time")
.border(true)
.width(800)
.height(290)
.barWidth(1)
.minY(0)
.maxY(1);
d3.select("#throttleChart").append("div")
.attr("id", "chartDiv")
.call(throttleChart);

function pushThrottleChart(value, time) {
  var dt = new Date(parseInt(time));
  if (value == 0) value = 0.1;
  var obj = {
    value: value,
    time: dt,
    color: "#0949b7", // TODO choose relevant color
    ts: dt.getTime(),
  };
  throttleChart.datum(obj);
}