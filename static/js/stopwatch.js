// Timing logic
// var runStart = new Date();
// var lapStart = runStart; // TODO fetch both from database
const interval = 10;
const idealLapMillis = 60000;
function updateStopwatch() {
  var millisText = millisToString(new Date() - runStart);
  $("#stopwatch").text(millisText);
  var lapText = millisToString(new Date() - lapStart);
  $("#lapTable tbody tr:first-child td:nth-child(2)").text(lapText);
  setTimeout(function() {
    updateStopwatch();
  }, interval);
}
//updateStopwatch();

function initLapTable() {
  // TODO fetch from db
  $("#lapTable tbody").prepend("<tr><td>"+lapNo+"</td><td>00:00.000</td></tr>");
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