//dirty, horrible, rotten, globals
var mapid = 9999;
var roomName = "Metamaps-Map-" + mapid;
var randomNumber = Math.floor(Math.random() * 90) + 10;
var userid = "devvmh" + randomNumber.toString();
var monitorVideoId = "self";

jQuery('document').ready(function() {
    $('#easyRTCWrapper').append('<div id="chat-wrapper"></div>');
    $('#easyRTCWrapper').append('<div id="video-wrapper"></div>');
    setUpChatButton('open');
    openChat();
    $('#controls').remove(); //TODO take this back out, just for simplicity now
    easyrtc.enableAudio(false);
    easyrtc.enableCamera(false);
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
  $('#video-wrapper button').remove();
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

  easyrtc.setSocketUrl("//localhost:5002");
  easyrtc.joinRoom(roomName, null, null, null)
  easyrtc.setUsername(userid);

  easyrtc.connect("Metamaps", loginSuccess, loginFailure);

  easyrtc.setPeerListener(addToConversation);
  easyrtc.setRoomOccupantListener(occupantChangeListener);
  easyrtc.setStreamAcceptor(videoStreamAcceptor);
  easyrtc.setOnStreamClosed(videoStreamClosedHandler);
}

function loginSuccess(easyrtcid) {
  window.selfEasyrtcid = easyrtcid;
  document.getElementById("iam").innerHTML = "I am " + easyrtc.username;
}
 
function loginFailure(errorCode, message) {
  easyrtc.showError(errorCode, message);
}


function createChatHTMLObjects() {
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

  //addControls();

  easyrtc.enableAudio(true);
  easyrtc.enableCamera(true);
  muteMonitorVideo();
  //create a local media stream, plus include success and failure handlers
  easyrtc.initMediaSource(
    function() {
      var monitorVideoElement = document.getElementById(monitorVideoId);
      easyrtc.setVideoObjectSrc(monitorVideoElement, easyrtc.getLocalStream());
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

  //call every other person in the room
  var occupants = getOtherOccupants(roomName);
  for (easyrtcid in occupants) {
    performCall(easyrtcid);
  }//for
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
  destroyVideoHTMLObjects();
  setUpVideoButton('open');
  easyrtc.enableAudio(false);
  easyrtc.enableCamera(false);
}

function destroyVideoHTMLObjects() {
  $('#self-wrapper').remove();
}

function createVideoHTMLObjects() {
  $('#video-wrapper').prepend('<div id="self-wrapper"><video id="' + monitorVideoId + '" width="100" height="100" muted="muted" /></div>');
}

function occupantChangeListener(roomName, occupants) {
  chatRoomListener(roomName, occupants);

  //don't open new calls if video isn't activated
  if ($('#' + monitorVideoId).length > 0) {
    videoRoomListener(roomName, occupants);
  }//if

  $('.caller-div video').each(function() {
    if(!easyrtc.isPeerInAnyRoom($(this).attr('id'))){
      alert("removed video element " + $(this).attr('id'));
      $(this).remove();
    }//if
  });//each
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
    for(var easyrtcid in occupants) {
        if (easyrtcid === window.selfEasyrtcid) {
          continue;
        }//if

        if ($('#' + easyrtcid).length == 0) {
          performCall(easyrtcid);
        }//if

    }//for
}//videoRoomListener

function newVideoElement(easyrtcid) {
  $('#video-wrapper').append('<div id="' + easyrtcid + '-wrapper" class="caller-div">' +
      '<video id="' + easyrtcid + '" width="100" height="100" /></div>');
}//newVideoElement

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
  if (who === "Me") {
    from = "Me";
  } else {
    from = easyrtc.idToName(who);
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

function videoIsFree(obj) {
    return (obj.dataset.caller === "" || obj.dataset.caller === null || obj.dataset.caller === undefined);
}

function hideVideo(video) {
    console.log("hideVideo called. Here is video");
    console.log(video);
    easyrtc.setVideoObjectSrc(video, "");
    //easyrtc.clearMediaStream(video);
    video.style.visibility = "hidden";
}//hideVideo

function showVideo(video, stream) {
    console.log("showVideo called. Here is video & stream");
    console.log(video);
    console.log(stream);
    //easyrtc.clearMediaStream(video);
    easyrtc.setVideoObjectSrc(video, stream);
    if (video.style.visibility) {
        video.style.visibility = 'visible';
    }
}//showVideo

function videoStreamAcceptor(caller, stream) {
    if (easyrtc.debugPrinter) {
        easyrtc.debugPrinter("stream acceptor called");
    }

    console.log("videoStreamAcceptor called with caller: " + caller + " and stream is");
    console.log(stream);

    //TODO prevent more than 10 video connections?

    //create new video element and start streaming to it
    if ($('#' + caller).length == 0) {
        newVideoElement(caller);
    } else {
        //console.log ("Got call from " + caller + " but already had session open.");
        $('#' + caller + '-wrapper').remove();
        newVideoElement(caller);
    }//if
    showVideo($('#' + caller).get(0), stream);
}//streamAcceptor

function videoStreamClosedHandler(caller) {
    var video = $('#' + caller).get(0);

    console.log("videoStreamClosedHandler called with caller: " + caller);

    hideVideo(video);
    video.dataset.caller = "";

    //destroy the caller-div wrapper and the video element inside it
    $('#' + caller).remove();
    $('#' + caller + '-wrapper').remove();
}//videoStreamClosedHandler

function getVideoByEasyrtcid(easyrtcid) {
    return document.getElementById(easyrtcid);
}//getVideoByEasyrtcid

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

    $('.caller-div video').each(function() {
      addControls($(this));
    });
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
