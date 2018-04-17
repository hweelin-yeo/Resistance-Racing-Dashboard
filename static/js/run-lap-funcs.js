function lapButtonClicked() {
   // TODO: if last lap, end lap request, send data back to Electron
   $("#lapButton").text('Next Lap');
   var time = (new Date()).toLocaleString('en-US');
   socket.emit('Next Lap', {time: time}); 
  }

 var registerRun; // initialised at init, refreshed by websockets
 var runStart;
 var lapStart;

function runButtonClicked() {
  if (registerRun) {
    runName =  $("#run-name-input").val();
    var time = new Date();
    time = time.toLocaleString('en-US');
      // updateStopwatch();
      socket.emit('Start Run', {runname: runName, time: time});  

    } else {
      var time = new Date();
      time = time.toLocaleString('en-US');
      socket.emit('End Run', {time: time}); 
    }

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
            runStart = data.starttime;
          });

          $.get(runIDEndPoint).done(function(data) {
            $.get(lapNoEndPoint, {runid: data.id}).done(function(data) {
              if (data.lapno != undefined) {
                $('#lapNumber')[0].innerHTML = "Lap # " + data.lapno;
                $("#lapButton").text("Next Lap");
              } else {
                $("#lapButton").text("Start Lap");
              }
            });

            $.get(lapStartTime, {runid: data.id}).done(function(data) { // TODO: Verify with Karun that we can initialise lapStart here
              lapStart = data.starttime;
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