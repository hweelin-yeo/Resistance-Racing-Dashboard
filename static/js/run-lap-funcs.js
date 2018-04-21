function lapButtonClicked() {
   // TODO: if last lap, end lap request, send data back to Electron
   $("#lapButton").text('Next Lap');
   var time = new Date();
   time = new Date(time.getTime() + time.getTimezoneOffset()*60*1000);
   socket.emit('Next Lap', {time: time.getTime()}); 
  }

 var registerRun; // initialised at init, refreshed by websockets
 var runStart;
 var lapStart;
 var lapNo;
 var idealLap;
 var currentLap; // TODO: Initialise, update 
 var previousLap; // TODO: Initialise, update  

function runButtonClicked() {
  if (registerRun) {
    runName =  $("#run-name-input").val();
    var time = new Date();
    time = new Date(time.getTime() + time.getTimezoneOffset()*60*1000);
      // updateStopwatch();
      socket.emit('Start Run', {runname: runName, time: time.getTime()});  

    } else {
      var time = new Date();
      time = new Date(time.getTime() + time.getTimezoneOffset()*60*1000);
      socket.emit('End Run', {time: time.getTime()}); 
    }

  }

  function submitBestLapID() {
    lapID =  $("#best-lap-id-input").val();
    $.get(getLapForLapId, {lapid: lapID}).done(function(data) {
      console.log(data);
      var parsed = JSON.parse(data);
      console.log(parsed);
      var newLap = new Lap(parsed.lap_id, parsed.run_id, parsed.lap_no, parsed.start_time, parsed.end_time, parsed.energy_used);
      newLap.setData(parsed.data);
      idealLap = newLap;
      console.log(newLap);
      console.log("submitted best lap");
    });

  }

  function init() {
    $.get(isRunOnEndPoint).done(function(data) {
      if (data.endtime == null) {
          // if a run is ongoing: set runName and lap#
          runOngoing();
          $.get(runNameEndPoint).done(function(data) {
            $('#run-name-input').val(data.runname);
          });

          $.get(runStartTime).done(function (data) { // TODO: Verify with Karun that we can initialise runStart here
            runStart = new Date(data.starttime);
          });

          $.get(runIDEndPoint).done(function(data) {
            var runID = data.id;
            $.get(lapNoEndPoint, {runid: runID}).done(function(data) {
              if (data.lapno != undefined) {
                lapNo = data.lapno;
                initLapTable(runID);
                $('#lapNumber')[0].innerHTML = "Lap # " + data.lapno;
                $("#lapButton").text("Next Lap");
              } else {
                $("#lapButton").text("Start Lap");
              }
            });

            $.get(lapStartTime, {runid: data.id}).done(function(data) { // TODO: Verify with Karun that we can initialise lapStart here
              lapStart = new Date(data.starttime);
            });
          });

        } else {
          runNotOngoing();
        }
      });
  }

  init();

  function runOngoing() {
    registerRun = false;
    $("#run-name-input").attr("readonly", "readonly");
    $("#lapButton").removeAttr("disabled");
    $('#runButton').text('End Run');
    $('#runButton').removeClass("btn-warning").addClass("btn-danger");
  }

  function runNotOngoing() {
    registerRun = true;
    $('#runButton').removeClass("btn-danger").addClass("btn-warning");
    $('#run-name-input').val('');
    $('#runButton').text('Register Run');
    $("#run-name-input").removeAttr("readonly");
    $("#lapButton").attr("disabled", "disabled");
    $('#lapNumber')[0].innerHTML = "Lap # " + 0;
  }