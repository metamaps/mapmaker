jQuery('document').ready(function() {
    setUpButton('open');
});

function setUpButton(op) {
  if (op === 'open') {
    $('#easyRTCWrapper').append('<button id="videoChatButton">Open Video Chat</button>');
    $('#videoChatButton').click(function() {
      openVideo(0, 'devvmh');
    });
  } else if (op === 'close') {
    $('#videoChatButton').html('Close Video Chat');
    $('#videoChatButton').unbind('click');
    $('#videoChatButton').click(function() {
      closeVideo();
    });
  }
}//setUpButton

function openVideo(mapid, userid) {
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

function connectChat(mapid, userid) {
  easyrtc.setSocketUrl("//localhost:5002");
  easyrtc.setPeerListener(addToConversation);
  easyrtc.setRoomOccupantListener(convertListToButtons);
  easyrtc.connect("easyrtc.instantMessaging_mapid_" + mapid, loginSuccess, loginFailure);
}

function closeVideo() {
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

var selfEasyrtcid = "";
function addToConversation(who, msgType, content) {
  // Escape html special characters, then add linefeeds.
  content = content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  content = content.replace(/\n/g, "<br />");
  document.getElementById("conversation").innerHTML +=
  "<b>" + who + ":</b>&nbsp;" + content + "<br />";
}
 
function convertListToButtons (roomName, occupants, isPrimary) {
  var otherClientDiv = document.getElementById("otherClients");
  while (otherClientDiv.hasChildNodes()) {
    otherClientDiv.removeChild(otherClientDiv.lastChild);
  }
 
  for(var easyrtcid in occupants) {
    var button = document.createElement("button");
    button.onclick = function(easyrtcid) {
      return function() {
        sendStuffWS(easyrtcid);
      };
    }(easyrtcid);
    var label = document.createTextNode("Send to " + easyrtc.idToName(easyrtcid));
    button.appendChild(label);
 
    otherClientDiv.appendChild(button);
  }
  if( !otherClientDiv.hasChildNodes() ) {
    otherClientDiv.innerHTML = "<em>Nobody else logged in to talk to...</em>";
  }
}
 
function sendStuffWS(otherEasyrtcid) {
  var text = document.getElementById("sendMessageText").value;
  if(text.replace(/\s/g, "").length === 0) { // Don"t send just whitespace
    return;
  }
 
  easyrtc.sendDataWS(otherEasyrtcid, "message",  text);
  addToConversation("Me", "message", text);
  document.getElementById("sendMessageText").value = "";
}
 
function loginSuccess(easyrtcid) {
  selfEasyrtcid = easyrtcid;
  document.getElementById("iam").innerHTML = "I am " + easyrtcid;
}
 
function loginFailure(errorCode, message) {
  easyrtc.showError(errorCode, message);
}
