function startChat() {
  $('#startVideoButton').html('Stop Video Chat');
  createHTMLObjects();
  easyrtc.setSocketUrl("//localhost:5002");
  easyrtc.setRoomOccupantListener( roomListener);
  easyrtc.easyApp("Company_Chat_Line", "self", ["caller"],
    function(myId) {
      console.log("My easyrtcid is " + myId);
    }
  );
}

function stopChat() {
  $('#startVideoButton').html('Start Video Chat');
  destroyHTMLObjects();
  easyrtc.disconnect();
}

function destroyHTMLObjects() {
  $('#easyRTCWrapper').html('');
}

function createHTMLObjects() {
  $('#easyRTCWrapper').html(' \
            <div style="position:relative;float:left;width:300px"> \
               self \
               <video  style="float:left" id="self" width="300" height="200" muted="muted"></video> \
            </div> \
          <div style="position:relative;float:left;width:300px"> \
              caller \
              <video id="caller" width="300" height="200"></video> \
          </div> \
          <div id="otherClients">other clients</div>');
}

function roomListener(roomName, otherPeers) {
    var otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }
    for(var i in otherPeers) {
        var button = document.createElement('button');
        button.onclick = function(easyrtcid) {
            return function() {
                performCall(easyrtcid);
            }
        }(i);

        label = document.createTextNode(i);
        button.appendChild(label);
        otherClientDiv.appendChild(button);
    }
}

function performCall(easyrtcid) {
    easyrtc.call(
       easyrtcid,
       function(easyrtcid) { console.log("completed call to " + easyrtcid); },
       function(errorMessage) { console.log("err:" + errorMessage); },
       function(accepted, bywho) {
          console.log((accepted?"accepted":"rejected")+ " by " + bywho);
       }
    );
}
