// Timing logic
// var runStart = new Date();
// var lapStart = runStart; // TODO fetch both from database
const interval = 10;
const idealLapMillis = 60000;
function updateStopwatch() {
  var millisText = millisToString(new Date() - runFirstLapStart*1000);
  if (runFirstLapStart != null) $("#stopwatch").text(millisText);
  var lapText = millisToString(new Date() - lapStart*1000);
  if (lapStart != null && runFirstLapStart != null) $("#lapTable tbody tr:first-child td:nth-child(2)").text(lapText);
  setTimeout(function() {
    updateStopwatch();
  }, interval);
}
updateStopwatch();

function initLapTable(runID) {
  console.log("variable is " + getAllLapsInfoByRun);
  // TODO fetch from db
  $.get(getAllLapsInfoByRun, {runid: runID}).done(function(data) {
    console.log(data);
    data.forEach((v) => {
      lapNo = v.lapno;
      v.endtime = new Date(v.endtime);
      v.starttime = new Date(v.starttime);
      v.totaltime = new Date(v.endtime - v.starttime);
      $("#lapTable tbody").prepend("<tr><td>"+lapNo+"</td><td>"+ millisToString(v.totaltime.getTime()) +"</td><td>" + v.totalenergy + " kWh</td></tr>");
    })
  });
}

function roundToXDecimals(num, x) {
  return Math.round(num * Math.pow(10, x)) / Math.pow(10, x);
}

function millisToString(m) {
  var minutes = Math.floor(m / 60000);
  m = m % 60000;
  var seconds = Math.floor(m / 1000);
  m = m % 1000;
  var millis = m;
  return pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(millis, 3);
}

function pad(quantity, nums) {
  s = quantity + "";
  if (s.length >= nums) {
    return s;
  }
  return pad("0"+quantity, nums);
}
