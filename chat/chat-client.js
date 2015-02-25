jQuery('document').ready(function() {
    $('#easyRTCWrapper').append('<div id="chat-wrapper"></div>');
    $('#easyRTCWrapper').append('<div id="video-wrapper"></div>');
    setUpChatButton('open');
});

function setUpChatButton(op) {
  if (op === 'open') {
    $('#chat-wrapper').append('<button id="chat-button">Open Chat</button>');
    $('#chat-button').click(function() {
      openChat(0, 'devvmh');
    });
  } else if (op === 'close') {
    $('#chat-button').html('Close Chat');
    $('#chat-button').unbind('click');
    $('#chat-button').click(function() {
      closeChat();
    });
  }
}//setUpChatButton

function setUpVideoButton(op) {
  if (op === 'open') {
    $('#video-wrapper').append('<button id="video-button">Open Video</button>');
    $('#video-button').click(function() {
      openVideo(0, 'devvmh');
    });
  } else if (op === 'close') {
    $('#video-button').html('Close Video');
    $('#video-button').unbind('click');
    $('#video-button').click(function() {
      closeVideo();
    });
  }//if
}//setUpVideoButton

function openChat(mapid, userid) {
  setUpChatButton('close');
  setUpVideoButton('open');
  createChatHTMLObjects();
  easyrtc.setSocketUrl("//localhost:5002");
  easyrtc.setPeerListener(addToConversation);
  easyrtc.setRoomOccupantListener(occupantChangeListener);
  window.chatEnabled = true;
  easyrtc.connect("easyrtc.instantMessaging_mapid_" + mapid, loginSuccess, loginFailure);
}

function createChatHTMLObjects() {
  $('#easyRTCWrapper').append('<div id="chat-wrapper"></div>');
  $('#chat-wrapper').append('<div id="sendMessageArea"></div>');
  $('#chat-wrapper').append('<div id="receiveMessageArea"></div>');
  $('#sendMessageArea').append(' \
      <div id="iam">Obtaining ID...</div> \
      <textarea id="sendMessageText"></textarea> \
      <div id="chat-other-clients"></div>');
  $('#receiveMessageArea').append(' \
      Received Messages: \
      <div id="conversation"></div>');
}

function closeChat() {
  easyrtc.disconnect();

  $('#video-wrapper').html('');
  $('#chat-wrapper').html('');

  setUpChatButton('open');
}

function openVideo(mapid, userid) {
  setUpVideoButton('close');
  createVideoHTMLObjects();

  //listeners are already set up; just enable this flag
  window.videoEnabled = true;

  easyrtc.easyApp("videochat_mapid_" + mapid, "self", ["caller"],
    function(myId) {
      console.log("My easyrtcid is " + myId);
    }
  );

  var roomName = easyrtc.roomData.default.roomName;
  var occupants = getOtherOccupants();
  occupantChangeListener(roomName, occupants);
}

function getOtherOccupants() {
  var roomName = easyrtc.roomData.default.roomName;
  var occupantsIndexed = easyrtc.getRoomOccupantsAsArray(roomName);
  var occupants = {};
  //index array with element names. Don't include self.
  $.each(occupantsIndexed, function(index, element) {
    if (element !== window.selfEasyrtcid) {
      occupants[element] = element;
    }//if
  });
  return occupants;
}//getOtherOccupants

function closeVideo() {
  window.videoEnabled = false;
  destroyVideoHTMLObjects();
  setUpVideoButton('open');
}

function destroyVideoHTMLObjects() {
  $('#video-wrapper').html('');
}

function createVideoHTMLObjects() {
  $('#video-wrapper').append('<div id="video-other-clients" />');
  $('#video-wrapper').append('<div id="self-wrapper" />');
  $('#video-wrapper').append('<div id="caller-wrapper" />');
  $('#self-wrapper').append('<video id="self" width="60" height="40" muted="muted" />');
  $('#caller-wrapper').append('<video id="caller" width="300" height="200"/>');
}

function occupantChangeListener(roomName, occupants) {
  if (window.chatEnabled) {
    chatRoomListener(roomName, occupants);
  }//if
  if (window.videoEnabled) {
    videoRoomListener(roomName, occupants);
  }//if
}//occupantChangeListener
 
function chatRoomListener(roomName, occupants) {
  var otherClientDiv = document.getElementById("chat-other-clients");
  while (otherClientDiv.hasChildNodes()) {
    otherClientDiv.removeChild(otherClientDiv.lastChild);
  }
 
  //for loop runs 0, 1, or 2 times, MAX, because of continue; and break; statements
  for(var easyrtcid in occupants) {
    if (easyrtcid === window.selfEasyrtcid) {
      continue;
    }//if
    var button = document.createElement("button");
    button.onclick = function() {
        sendStuffWS("all");
    };
    $('#sendMessageText').keyup(function(e) {
      if (e.keyCode === 13) {
        sendStuffWS("all");
      }//if
    });
    
    var label = document.createTextNode("Send");
    button.appendChild(label);
    otherClientDiv.appendChild(button);
    break;
  }
  if( !otherClientDiv.hasChildNodes() ) {
    otherClientDiv.innerHTML = "<em>Nobody else logged in to talk to...</em>";
  }
}

function videoRoomListener(roomName, occupants) {
    var otherClientDiv = document.getElementById('video-other-clients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }
    for(var easyrtcid in occupants) {
        if (easyrtcid === window.selfEasyrtcid) {
          continue;
        }//if
        var button = document.createElement('button');
        button.onclick = function(easyrtcid) {
            return function() {
                performCall(easyrtcid);
            }
        }(easyrtcid);

        label = document.createTextNode(easyrtcid);
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

function addToConversation(who, msgType, content) {
  // Escape html special characters, then add linefeeds.
  content = content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  content = content.replace(/\n/g, "<br />");
  document.getElementById("conversation").innerHTML +=
  "<b>" + who + ":</b>&nbsp;" + content + "<br />";
}
 
function sendStuffWS(otherEasyrtcid) {
  var text = document.getElementById("sendMessageText").value;
  if(text.replace(/\s/g, "").length === 0) { // Don"t send just whitespace
    return;
  }

  if (otherEasyrtcid === "all") {
    //send to the whole room
    for (easyrtcid in getOtherOccupants()) {
      easyrtc.sendDataWS(easyrtcid, "message",  text);
    }
  } else {
    //send to one person
    easyrtc.sendDataWS(otherEasyrtcid, "message",  text);
  }//if

  //clear elements
  addToConversation("Me", "message", text);
  document.getElementById("sendMessageText").value = "";
}
 
function loginSuccess(easyrtcid) {
  window.selfEasyrtcid = easyrtcid;
  document.getElementById("iam").innerHTML = "I am " + easyrtcid;
}
 
function loginFailure(errorCode, message) {
  easyrtc.showError(errorCode, message);
}
