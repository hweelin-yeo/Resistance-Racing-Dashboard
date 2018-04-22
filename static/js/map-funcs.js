
console.log("in map-init.js");
    var blueDot = 'http://www.robotwoods.com/dev/misc/bluecircle.png';
    var noteMarker ='https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'; // 'clifford.jpg'
    var curPos;
    var mapCur;
    var mapPrev;
    var polyCur;
    var change = 0;
    var colorCur = 'green';
    var drawMap;
    var latestNoteMarker;
    var polyLinesForLap = [];
    var polyLinesForOtherMap = [];
    var transferPolys;
    var clearPolys;

    function init() {
      var initLatLng = new google.maps.LatLng({lat: 38.160682, lng: -122.453061});
      prevLatLng = initLatLng;

      var mapOptions = {
        zoom: 17,
        center: initLatLng,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        disableDoubleClickZoom: true
      };

      mapCur = new google.maps.Map(document.getElementById('map_canvas_current'),
      mapOptions);

      curPos = new google.maps.Marker({
        position: initLatLng,
        map: mapCur,
        icon: blueDot
      });

      mapPrev = new google.maps.Map(document.getElementById('map_canvas_prev'),
      mapOptions);

      polyCur = new google.maps.Polyline({
        strokeColor: colorCur,
        strokeOpacity: 1,
        strokeWeight: 5,
        map: mapCur
      });


      polyCur.addListener('dblclick', function(e) {
        // var lapData = lapDataArr[lap - 1];
        // var selBool = lapData.selectPolys.get(this); // selBool is true if polyline is already selected
        // if (selBool) {
        //  this.setOptions({strokeOpacity: 1});
        // } else {
        this.setOptions({strokeOpacity: 0.5});
        // }
      });

      polyCur.addListener('click', function(e) {
        // var lapData = lapDataArr[lap - 1];
        // var selBool = lapData.selectPolys.get(this); // selBool is true if polyline is already selected
        // if (selBool) {
        //  this.setOptions({strokeOpacity: 1});
        // } else {
        this.setOptions({strokeOpacity: 0.5});
        // TODO: trigger selection
        // var startTime;
        // var endTime;
        // triggerSelectPolys(startTime, endTime);
        // }
      });

      var createPoly = function (col) {
        var poly = new google.maps.Polyline({
          strokeColor: col,
          strokeOpacity: 1,
          strokeWeight: 5,
          map: mapCur
        });

        poly.addListener('dblclick', function(e) {
          this.setOptions({strokeOpacity: 0.5});
        });

        poly.addListener('click', function(e) {
          this.setOptions({strokeOpacity: 0.5});
        });

        return poly;
      }

      // ROUTE DRAWING
      drawMap = function(latLng, col) {

        if (polyLinesForLap.length == 0) {
          var poly = createPoly(col);
          var path = poly.getPath();
          path.push(prevLatLng);
          path.push(latLng);

          polyLinesForLap.push(poly);
          prevLatLng = latLng;
        } else {
          var polyPrev = polyLinesForLap[polyLinesForLap.length - 1];
          if (polyPrev.strokeColor != col) {  // A--B    C (B is prev latlng, c is latlng)
            var poly = createPoly(col);
            var path = poly.getPath();
            path.push(latLng);
            polyLinesForLap.push(poly);
          }

          var pathPrev = polyPrev.getPath();
          pathPrev.push(latLng);
          prevLatLng = latLng;

        }
      }

      transferPolys = function() {
        if (polyLinesForOtherMap.length != 0) {
          clearPolys(polyLinesForOtherMap);
          polyLinesForOtherMap = [];
        }

        for (i = 0; i < polyLinesForLap.length ; i++) {
          var poly = polyLinesForLap[i];
          var polyNew = createPoly(poly.strokeColor);
          polyLinesForOtherMap.push(polyNew);
          polyNew.setPath(poly.getPath());
          polyNew.setMap(mapPrev);
        }

      }

       addMarker = function (e, data) {
        var note = (data == null) ? "Note1" : data;
        var marker = new google.maps.Marker({
          position: e.latLng,
          map: mapCur,
          icon: noteMarker,
          title: note,
        });
        latestNoteMarker = marker;
       }


      // NOTE MARKING (for presentation purposes)
      mapCur.addListener('dblclick', function(e) {
        addMarker(e, null);
      });

      mapCur.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);

    }

    function triggerSelectPolys(startTime, endTime) {
      // TODO:
    }

    function fail(){
      alert('navigator.geolocation failed, may not be supported');
    }

    function updateMap(value) {
      var latLng_arr = value.split(",");
      var latLng = new google.maps.LatLng(parseFloat(latLng_arr[0]), parseFloat(latLng_arr[1]));
      mapCur.setCenter(latLng);
      mapPrev.setCenter(latLng);
      curPos.setPosition(latLng);
      prevLatLng = latLng;
    }

    function clearPolys(polylineArr) {
      for (i = 0; i < polylineArr.length ; i++) {
          var poly = polylineArr[i];
          poly.setMap(null);
        }
    }


// var lap = 0;
var latestGPSTimeStamp;
var latestGPSCoordinates;
var prevLatLng;


function mockIdealSpeed(gps) {
  if (!gps) return 40;
  var latLng_arr = gps.split(",");
  var lat = parseFloat(latLng_arr[0]);
  var lng = parseFloat(latLng_arr[1]);
  var l2 = Math.sqrt(lat*lat + lng*lng);
  return 40+20*Math.sin(l2*1000);
}

/** Note taking Function*/

// Input form div, for google maps note taking later on
var controlDiv = document.createElement('DIV');
controlDiv.id = "controls";

var controlInput = document.createElement('input');
controlInput.id = "note";
controlInput.name = "note";
// controlInput.value = "Hi there!";

var controlLabel = document.createElement('label');
controlLabel.innerHTML = 'Note';
controlLabel.setAttribute("for","note");

var controlButton = document.createElement('button');
controlButton.innerHTML = 'Create note!';
controlButton.innerHTML = 'Send it!';

controlButton.addEventListener ("click", function() {
  if (latestNoteMarker != undefined) {
    latestNoteMarker.setTitle($("#note").val());
    socket.emit('Post Note', {note: ($("#note").val()), lat: latestNoteMarker.getPosition().lat(), lat: latestNoteMarker.getPosition().lng(), time: (new Date().getTime() / 1000.0)});
    controlInput.value = "";
  }
})



controlDiv.appendChild(controlLabel);
controlDiv.appendChild(controlInput);
controlDiv.appendChild(controlButton);

init();

function valueToCol (value) {
   var col;
   console.log("VALUE TO COL")
   console.log(value);
   var val = 0.2 + Math.min(0.8, value/60.0);
   col = interpolateLinearly(val, Blues);
   console.log(col);
   return col;
}