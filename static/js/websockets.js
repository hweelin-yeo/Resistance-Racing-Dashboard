var socket = io();
socket.on('connect', function() {
  console.log("Socket Connected.");
})

socket.on('Lap Started', function (res) {
  var lap = res['lapno'];
  var time = res['time'];
  $('#lapNumber')[0].innerHTML = "Lap # " + lap;
  $("#lapButton").text("Next Lap");

  $("#lapTable tbody").prepend("<tr><td>"+lap+"</td><td>00:00.000</td><td></td></tr>");
  lapStart = new Date(time);
  if (runFirstLapStart == null) {
    runFirstLapStart = lapStart;
  }
});

socket.on('Lap Ended', function (res) {
  var lap = res['lapno'];
  var time = res['totaltime'];
  var energy = res['totalenergy'];
  // This is done because lap ended usually appears after lap started, so we can't
  // simply select the top row anymore.
  $("#lapTable tbody tr").each((i, v) => {
    var cell = $(v).find("td")[0];
    if ($(cell).text() == lap) {
      $($(v).find("td")[1]).text(millisToString(time * 1000));
      $($(v).find("td")[2]).text(roundToXDecimals((energy / 1000), 2) + " kWh");
    }
  });
  $("#prev-eff").text(roundToXDecimals((energy / 1000), 2) + " kWh");
  $("#prev-timing").text(millisToString(time * 1000));
  transferPolys();
  clearPolys(polyLinesForLap);
});

socket.on('Run Started', function(res) {
  var runname = res['runname'];
  var time = res['time'];
  console.log("Run started:" + time);
  runStart = new Date(time);
  runOngoing();
  $('#run-name-input').val(runname);
});

socket.on('Run Ended', function(res) {
  var time = res['time'];
  runNotOngoing();
  runStart = null;
  runFirstLapStart = null;
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
  var lat = res['data']['lat'];
  var lng = res['data']['lng'];
  var alt = res['data']['lng'];
  var time = res['time'];
  // latestGPSCoordinates = value;
  updateMap(lat + "," + lng); // TODO: value currently is just lat,lng, and does not take into account alt
});

socket.on('New Data_MC', function(res) {
  var value = res['data']['value'];
  var time = res['time'];
  changeSpeedStats(value, time);
});


socket.on('Note Posted', function (res) {
  console.log("note posted");
  var note = res['note'];
  var lat = res['lat'];
  var lon = res['lon'];
  var time = res['time'];
  position = new google.maps.LatLng({lat: lat, lng: lon});
  addMarker(position, note);
});
