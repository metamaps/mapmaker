mapid = 9999;
roomName = "Metamaps-Map-" + mapid;
var randomNumber = Math.floor(Math.random() * 90) + 10;
userid = "devvmh" + randomNumber.toString();

//can these be variables inside Metamaps.Chat?
var videoIds = ["caller"];
var numPEOPLE = videoIds.length;
var refreshPane = 0;
var monitorVideoId = "self";

jQuery('document').ready(function() {
    $('#easyRTCWrapper').append('<div id="chat-wrapper"></div>');
    $('#easyRTCWrapper').append('<div id="video-wrapper"></div>');
    setUpChatButton('open');
    openChat();
});

function setUpChatButton(op) {
  if (op === 'open') {
    $('#chat-wrapper').append('<button id="chat-button">Open Chat</button>');
    $('#chat-button').click(function() {
      openChat();
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
      openVideo();
    });
  } else if (op === 'close') {
    $('#video-button').html('Close Video');
    $('#video-button').unbind('click');
    $('#video-button').click(function() {
      closeVideo();
    });
  }//if
}//setUpVideoButton

function openChat() {
  setUpChatButton('close');
  setUpVideoButton('open');
  createChatHTMLObjects();
  window.chatEnabled = true;

  easyrtc.setSocketUrl("//localhost:5002");
  easyrtc.joinRoom(roomName, null, null, null)
  easyrtc.setUsername(userid);

  easyrtc.setPeerListener(addToConversation);
  easyrtc.setRoomOccupantListener(occupantChangeListener);

  easyrtc.connect("Metamaps", loginSuccess, loginFailure);
}

function loginSuccess(easyrtcid) {
  window.selfEasyrtcid = easyrtcid;
  document.getElementById("iam").innerHTML = "I am " + easyrtc.username;
}
 
function loginFailure(errorCode, message) {
  easyrtc.showError(errorCode, message);
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

function openVideo() {
  setUpVideoButton('close');
  createVideoHTMLObjects();

  //listeners are already set up; just enable this flag
  window.videoEnabled = true;

  //handle incoming/outgoing video calls - adds listeners + controls
  self.addEventListener("roomOccupants", 
    function(eventName, eventData) {
      for (i = 0; i < numPEOPLE; i++) {
        var video = getIthVideo(i);
        if (!videoIsFree(video)) {
          if( !easyrtc.isPeerInAnyRoom(video.dataset.caller)){
            easyrtc.dataset.caller = null;
          }//if
        }//if
      }//for
    }//roomOccupantsListener
  );

  easyrtc.setOnStreamClosed(videoStreamClosedHandler);
  easyrtc.setAcceptChecker(videoAcceptChecker);
  easyrtc.setStreamAcceptor(videoStreamAcceptor);

  addControls();
  muteMonitorVideo();

  //create a local media stream, plus include success and failure handlers
  easyrtc.initMediaSource(
    function() {
      easyrtc.setVideoObjectSrc(document.getElementById(monitorVideoId), easyrtc.getLocalStream());
    },
    function(errorCode, errorText) {
      if (onFailure) {
        onFailure(easyrtc.errCodes.MEDIA_ERR, errorText);
      }
      else {
        easyrtc.showError(easyrtc.errCodes.MEDIA_ERR, errorText);
      }
    },
    null // default stream
    );

  //instead just do the name manually
  var occupants = getOtherOccupants(roomName);
  occupantChangeListener(roomName, occupants);
}

function getOtherOccupants(roomName) {
  if (roomName === null) {
    roomName = "Metamaps-Map-" + mapid;
  }//if
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

        var users = easyrtc.roomData[roomName];
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

function easyrtcidToUsername(easyrtcid) {
  var from = "Unknown Sender";
  var userList = easyrtc.roomData[roomName].clientListDelta.updateClient;
  if (userList.hasOwnProperty(easyrtcid)) {
    var user = userList[easyrtcid];
    if (user.hasOwnProperty("username")) {
      from = user.username;
    }//if
  }//if

  return from;
}//easyrtcidToUsername

function addToConversation(who, msgType, content) {
  if (who === "Me") {
    from = "Me";
  } else {
    from = easyrtcidToUsername(who);
  }//if

  // Escape html special characters, then add linefeeds.
  content = content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  content = content.replace(/\n/g, "<br />");
  document.getElementById("conversation").innerHTML +=
  "<b>" + from + ":</b>&nbsp;" + content + "<br />";
}
 
function sendStuffWS(otherEasyrtcid) {
  var text = document.getElementById("sendMessageText").value;
  if(text.replace(/\s/g, "").length === 0) { // Don"t send just whitespace
    return;
  }

  if (otherEasyrtcid === "all") {
    //send to the whole room
    for (easyrtcid in getOtherOccupants(roomName)) {
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
 
/*
 * VIDEO HELPER FUNCTIONS
 */

function validateVideoIds(monitorVideoId, videoIds) {
    var i;
    // verify that video ids were not typos.
    if (monitorVideoId && !document.getElementById(monitorVideoId)) {
        easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "The monitor video id passed to easyApp was bad, saw " + monitorVideoId);
        return false;
    }

    for (i in videoIds) {
        if (!videoIds.hasOwnProperty(i)) {
            continue;
        }
        var name = videoIds[i];
        if (!document.getElementById(name)) {
            easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "The caller video id '" + name + "' passed to easyApp was bad.");
            return false;
        }
    }
    return true;
}//validateVideoIds

function videoIsFree(obj) {
    return (obj.dataset.caller === "" || obj.dataset.caller === null || obj.dataset.caller === undefined);
}

function hideVideo(video) {
    easyrtc.setVideoObjectSrc(video, "");
    video.style.visibility = "hidden";
}//hideVideo

function showVideo(video, stream) {
    easyrtc.setVideoObjectSrc(video, stream);
    if (video.style.visibility) {
        video.style.visibility = 'visible';
    }
}//showVideo

//TODO - this is checking if there is an existing video tag
//I'd rather create a new one!
function videoAcceptChecker (caller, helper) {
    var i;
    for (i = 0; i < numPEOPLE; i++) {
        var video = getIthVideo(i);
        if (videoIsFree(video)) {
            helper(true);
            return;
        }
    }
    helper(false);
}//videoAcceptChecker

function videoStreamAcceptor(caller, stream) {
    var i;
    if (easyrtc.debugPrinter) {
        easyrtc.debugPrinter("stream acceptor called");
    }

    var video;
    if (refreshPane && videoIsFree(refreshPane)) {
        showVideo(refreshPane, stream);
        refreshPane = null;
        return;
    }
    for (i = 0; i < numPEOPLE; i++) {
        video = getIthVideo(i);
        if (video.dataset.caller === caller) {
            showVideo(video, stream);
            return;
        }
    }

    for (i = 0; i < numPEOPLE; i++) {
        video = getIthVideo(i);
        if (!video.dataset.caller || videoIsFree(video)) {
            video.dataset.caller = caller;
            showVideo(video, stream);
            return;
        }
    }
//
// no empty slots, so drop whatever caller we have in the first slot and use that one.
//
    video = getIthVideo(0);
    if (video) {
        easyrtc.hangup(video.dataset.caller);
        showVideo(video, stream);
    }
    video.dataset.caller = caller;
}//streamAcceptor

function videoStreamClosedHandler(caller) {
    var i;
    for (i = 0; i < numPEOPLE; i++) {
        var video = getIthVideo(i);
        if (video.dataset.caller === caller) {
            hideVideo(video);
            video.dataset.caller = "";
        }
    }
}//videoStreamClosedHandler

function getIthVideo(i) {
    if (videoIds[i]) {
        return document.getElementById(videoIds[i]);
    }
    else {
        return null;
    }
}

function getIthCaller(i) {
    if (i < 0 || i > videoIds.length) {
        return null;
    }
    var vid = getIthVideo(i);
    return vid.dataset.caller;
}

function getSlotOfCaller(easyrtcid) {
    var i;
    for (i = 0; i < numPEOPLE; i++) {
        if (self.getIthCaller(i) === easyrtcid) {
            return i;
        }
    }
    return -1; // caller not connected
}

function addControls() {
    var addControls, parentDiv, closeButton, i;

    addControls = function(video) {
        parentDiv = video.parentNode;
        video.dataset.caller = "";
        closeButton = document.createElement("div");
        closeButton.className = "easyrtc_closeButton";
        closeButton.onclick = function() {
            if (video.dataset.caller) {
                easyrtc.hangup(video.dataset.caller);
                hideVideo(video);
                video.dataset.caller = "";
            }
        };
        parentDiv.appendChild(closeButton);
    };
    for (i = 0; i < numPEOPLE; i++) {
        addControls(getIthVideo(i));
    }
}//addControls

function muteMonitorVideo() {
    var monitorVideo = null;
    monitorVideo = document.getElementById(monitorVideoId);
    if (!monitorVideo) {
        console.error("Programmer error: no object called " + monitorVideoId);
        return;
    }
    monitorVideo.muted = "muted";
    monitorVideo.defaultMuted = true;
}//muteMonitorVideo
