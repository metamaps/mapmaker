jQuery('document').ready(function() {
    setUpButton('open');
});

function setUpButton(op) {
  if (op === 'open') {
    $('#easyRTCWrapper').append('<button id="videoChatButton">Open Video Chat</button>');
    $('#videoChatButton').click(function() {
      openChat(0, 'devvmh');
    });
  } else if (op === 'close') {
    $('#videoChatButton').html('Close Video Chat');
    $('#videoChatButton').unbind('click');
    $('#videoChatButton').click(function() {
      closeChat();
    });
  }
}//setUpButton

function openChat(mapid, userid) {
  setUpButton('close');
  createHTMLObjects();
  easyrtc.setSocketUrl("//localhost:5002");
  easyrtc.setRoomOccupantListener( roomListener);
  easyrtc.easyApp("videochat_mapid_" + mapid, "self", ["caller"],
    function(myId) {
      console.log("My easyrtcid is " + myId);
    }
  );
}

function closeChat() {
  easyrtc.disconnect();
  destroyHTMLObjects();
  setUpButton('open');
}

function destroyHTMLObjects() {
  $('#easyRTCWrapper').html('');
}

function createHTMLObjects() {
  $('#easyRTCWrapper').append('<div id="otherClients" />');
  $('#easyRTCWrapper').append('<div id="self-wrapper" />');
  $('#easyRTCWrapper').append('<div id="caller-wrapper" />');
  $('#self-wrapper').append('<video id="self" width="60" height="40" muted="muted" />');
  $('#caller-wrapper').append('<video id="caller" width="300" height="200"/>');
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
