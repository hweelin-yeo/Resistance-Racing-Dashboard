console.log("in new-data-update.js");

function faultTemp(bool) {
  if (bool) {
    $('#TempFault')[0].style.background = "#E53838";
  } else {
    $('#TempFault')[0].style.background = "#56BF56";
  }
}

function faultCur(bool) {
  if (bool) {
    $('#CurFault')[0].style.background = "#E53838";
  } else {
    $('#CurFault')[0].style.background = "#56BF56";
  }
}

function faultVolt(bool) {
  if (bool) {
    $('#VoltFault')[0].style.background = "#E53838";
  } else {
    $('#VoltFault')[0].style.background = "#56BF56";
  }
}

function faultEmerg(bool) {
  if (bool) {
    $('#EmergFault')[0].style.background = "#E53838";
  } else {
    $('#EmergFault')[0].style.background = "#56BF56";
  }
}


function changeSpeedStats(num, lastUpdated) {
  $('#speedStats')[0].innerHTML = Math.round(num*10)/10.0 + " kmph";
  var col = valueToCol (num);
  drawMap(prevLatLng, col);
}

function changeLastUpdatedStats(num) {
  $('#lastUpdatedStats')[0].innerHTML = "" + num;
}

function changeThrottleStats(num, lastUpdated) {
  $('#throttleStats')[0].innerHTML = "" + num;
  changeLastUpdatedStats(lastUpdated);
}
