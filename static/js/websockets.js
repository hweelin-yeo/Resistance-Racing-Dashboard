var socket = io();
socket.on('connect', function() {
  console.log("Socket Connected.");
})

socket.on('Lap Started', function (res) {
  var lap = res['lapno']; 
  var time = res['time'];
  $('#lapNumber')[0].innerHTML = "Lap # " + lap;
  $("#lapButton").text("Next Lap");

  /** TODO: Verify with Karun if we can set lapStart here*/
  lapStart = time;  
});

socket.on('Lap Ended', function (res) {
  var lap = res['lapno']; 
  var time = res['totaltime']; 
  var energy = res['totalenergy'];
  transferPolys();

  /** TODO: Verify Stopwatch stuff*/
  var now = new Date();
  var diff = (now - lapStart) - idealLapMillis;
  var compText = millisToString(Math.abs(diff));
  compText = (diff < 0 ? "-" : "+") + compText;
  $("#lapTable tbody tr:first-child td:nth-child(2)").append("<br>("+compText+")");
  $("#lapTable tbody").prepend("<tr><td>"+lap+"</td><td>00:00.000</td></tr>");
  lapStart = now;

});

socket.on('Run Started', function(res) {
  var runname = res['runname'];
  var time = res['time']; 
  /** TODO: Verify with Karun if we can set runStart here*/
  runStart = time;
  runOngoing();
  $('#run-name-input').val(runname); 
});

socket.on('Run Ended', function(res) {
  var time = res['time'];
  runNotOngoing();
});

socket.on('New Data_BMS', function(res) {
          // TODO: Implement
  var tempFault = res['data']['tempFault'];
  var curFault = res['data']['curFault'];
  var voltFault = res['data']['voltFault'];
  var emergFault = res['data']['emergFault'];
  var current = res['data']['current'];
  var voltAve = res['data']['voltAve'];
  var tempMax = res['data']['tempMax'];
  var time = res['data']['time'];
  faultTemp(tempFault);
  faultCur(curFault);
  faultVolt(voltFault); 
  faultEmerg(emergFault); 

}); 

socket.on('New Data_GPS', function(res) {
  // TODO: Implement
  var lat = res['data']['lat'];
  var lng = res['data']['lng'];
  var alt = res['data']['lng'];
  var time = res['time'];
  latestGPSCoordinates = value; 
  updateMap(lat + "," + lng); // TODO: value currently is just lat,lng, and does not take into account alt
}); 

socket.on('New Data_MC', function(res) {
  // TODO: Implement
  var value = res['data']['value'];
  var time = res['time'];
  changeSpeedStats(value, time);
  pushSpeedChart(value, time);
}); 