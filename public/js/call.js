// global variables
var myUsername = null; //en mi aplicacion el username del caller lo cogere de la session cookie del ws
var remoteCallerUsername = null; //quien te llama (aun no le has aceptado la llamada)
var targetUsername = null; // To store username of other peer (le has aceptado la llamada)
var myPeerConnection = null; // RTCPeerConnection()
var mediaConstraints = { video: true, audio: true };
var myLocalStream; //navigator.mediaDevices.getUserMedia()

//******
//Signaling server
//******

//when we got a message from a signaling server
socket.on("call", function(data) {
  console.log("Got message", data);

  var data = JSON.parse(data);

  switch (data.type) {
    case "calling": //call received
      callReceived(data.name, data.username, data.photoURL);
      break;
    case "confirmcallacceptreceived": //call has been accepted
      redirectCalleeToCall(data.name);
      break;
    case "reject": //Rejected offer
      console.log("reject");
      handleRejectOffer();
      break;
    case "callnotallowed": //caller has not permissions to call callee
      callNotAllowed(data.msg);
      break;
    //when we have accepted a call
    case "askforoffer": // Invitation and offer to chat
      console.log("start");
      handleNegotiationNeededEvent("call", data.name);
      break;
    case "offer": // Caller sent us an offer
      //callReceived(data.offer, data.name);
      console.log(data.name);
      handleOffer(data.offer, data.name);
      break;
    case "answer": // Callee has answered our offer
      handleAnswer(data.answer);
      break;
    //when a remote peer sends an ice candidate to us
    case "candidate": // A new ICE candidate has been received
      handleNewICECandidateMsg(data.candidate);
      break;
    case "leave": // The other peer has hung up the call (or left the page when talking)
      console.log("leave");
      handleHangUpMsg();
      break;
    case "cancel": // The other peer has cancelled the call
      console.log("cancel");
      handleCancelCall();
      break;
    case "timeout": // The other peer has neither accepted nor rejected the call and it has timed out
      handleTimeout();
      break;
    case "mediaError": // The other peer has media error
      handleCalleeUserGetUserMediaError(data.msg);
      break;
    default:
      break;
  }
});

//alias for sending JSON encoded messages
function send(message) {
  console.log("v");
  //attach the other peer username to our messages
  if (targetUsername) {
    message.name = targetUsername;
  }

  //conn.send(JSON.stringify(message));
  socket.emit("call", JSON.stringify(message));
}

//******
//UI selectors block
//******
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

var callBtn = document.getElementById("callIcon");
var hangUpBtn = document.getElementById("hangupIcon");
var popup = document.getElementById("incoming-call-dialog");
var cancelCallDiv = document.getElementById("call-canceled");
var incomingCallDialogDiv = document.getElementById(
  "incoming-call-dialog-action"
);

//Initial message
var callerUsername = document.getElementById("caller-username");
if (!callerUsername) {
  showTopMsg("Pulsa el boton para llamar");
} else {
  showTopMsg("Pulsa el boton para descolgar");
}

targetUsername = getUsername();
console.log("target" + targetUsername);
function getUsername() {
  var p = window.location.pathname;
  var pu = p.split("/");
  var usernameNormalized = pu[pu.length - 1];
  return usernameNormalized;
}

//getUserMedia
start(false);

/*** */
/**Get user media */
// Start a peer connection and capturing media
function start(getUserMediaError) {
  //para simular que estas en otra pagina cuando te llaman
  // if (myUsername === "b") {
  //   return;
  // }
  //
  if (myPeerConnection) {
    //sanity check
    alert("You can't start a call because you already have one open!");
  } else {
    //call constructor
    createPeerConnection();

    //check if navigator supports getUserMedia()
    if (!hasGetUserMedia()) {
      browserNotSupportgetUserMedia(undefined);
      return;
    }

    if (!getUserMediaError) {
      console.log("MLS" + myLocalStream);

      if (!myLocalStream) {
        //getting local video stream
        //request access to the user's camera and microphone
        var getUserMediaError = true;
        var p = navigator.mediaDevices.getUserMedia(mediaConstraints);

        //It receives as input, a MediaStream object representing
        //the stream with audio from the user's microphone and video from their webcam.
        p.then(function(localStream) {
          getUserMediaError = false; //no ha habido error en gUM

          myLocalStream = localStream;
          //displaying local video stream on the page
          //We attach the incoming stream to the local preview autoplay <video> element
          //by setting the element's srcObject property.
          localVideo.srcObject = myLocalStream;

          //We iterate over the tracks in the stream, to add each track to the RTCPeerConnection.
          myLocalStream
            .getTracks()
            .forEach(track => myPeerConnection.addTrack(track, myLocalStream));
        });

        p.catch(function(error) {
          if (getUserMediaError) {
            handleGetUserMediaError(error, undefined);
          } else {
            console.log(error);
          }
        });
      } else {
        //We iterate over the tracks in the stream, to add each track to the RTCPeerConnection.
        myLocalStream
          .getTracks()
          .forEach(track => myPeerConnection.addTrack(track, myLocalStream));
      }
    }
  }
}

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function browserNotSupportgetUserMedia(user) {
  //create error object
  var e = new Error();
  e.name = "OldBrowser";
  handleGetUserMediaError(e, user);
  return;
}

function handleGetUserMediaError(e, user) {
  var codeErrorInCalleeForCaller = 0;
  switch (e.name) {
    // case "notFoundError":
    case "NotFoundError":
      codeErrorInCalleeForCaller = 1;
      showTopMsg(
        "No se ha encontrado ninguna camara"
        //camera and/or microphone were found
      );
      break;
    case "NotAllowedError":
      codeErrorInCalleeForCaller = 2;
      showTopMsg("No has permitido hacer uso de la camara");
      break;
    case "OldBrowser":
      codeErrorInCalleeForCaller = 3;
      showTopMsg(
        "Su navegador es muy viejo, no soporta la funcion getUserMedia(), actualizelo"
      );
      break;
    // case "SecurityError":
    // case "PermissionDeniedError":
    //   // Do nothing; this is the same as the user canceling the call.
    //   showTopMsg("No has permitido hacer uso de la camara");
    //   break;
    default:
      //default error
      codeErrorInCalleeForCaller = 4;
      showTopMsg(
        "No se ha podido hacer uso de la camara debido a un error: " + e.message
      );
      //showTopMsg("Error opening your camera and/or microphone: " + e.message);
      break;
  }

  //send msg to caller
  if (user === "callee" && codeErrorInCalleeForCaller != 0) {
    sendGetUserMediaErrorToCaller(codeErrorInCalleeForCaller);
  }

  closeVideoCall(false, true);
}

function sendGetUserMediaErrorToCaller(codeErrorInCalleeForCaller) {
  var msgErrorInCalleeForCaller;
  if (codeErrorInCalleeForCaller == 1) {
    msgErrorInCalleeForCaller = "El otro usuario no tiene camara y/o micro";
  } else if (codeErrorInCalleeForCaller == 2) {
    msgErrorInCalleeForCaller =
      "El otro usuario no ha permitido hacer uso de la camara";
  } else if (codeErrorInCalleeForCaller == 3) {
    msgErrorInCalleeForCaller =
      "El otro usuario ha tenido un problema con su navegador";
  } else if (codeErrorInCalleeForCaller == 4) {
    msgErrorInCalleeForCaller =
      "El otro usuario no ha podido hacer uso de la camara debido a un error";
  }

  //enviar msg al otro user de que ese user tiene un problema con la camara o micro
  send({
    type: "mediaError",
    msg: msgErrorInCalleeForCaller
  });
}

function handleCalleeUserGetUserMediaError(msg) {
  showTopMsg(msg);
  closeVideoCall(false, false);
}

//call not allowed
function callNotAllowed(msg) {
  showTopMsg(msg);
  photoStatus("hangup");
  setRightIconCall("call");
}

/*** */
//call received
//puedo decidir si coger la llamada o rechazarla
function callReceived(caller, usernameCaller, photoURLCaller) {
  //set timeout
  timeoutIfNoActionDoneWhenCallReceived("setTimeOut", caller);

  console.log("caller");
  console.log(caller);
  //show popup with options

  popup.style.display = "block";
  var imgPopup = popup.getElementsByTagName("img")[0];
  imgPopup.src = "/uploads/" + photoURLCaller;
  var usernamePopup = popup.getElementsByTagName("p")[0];
  // var text = document.createTextNode(usernameCaller + " is calling...");
  // usernamePopup.appendChild(text);
  usernamePopup.innerText = usernameCaller + " is calling...";

  remoteCallerUsername = caller;

  //solo si estoy en la pagina de calls: si tengo msg arriba del video, al mostra el popup quitarlo
  //ya que si no estoy en la pagina de video, no podre tener msg arriba
  //para saber si estas en la pagina de video, ver si existe ese elemento de msg
  removeTopMsg();

  var acceptBtn = document.getElementById("accept-incoming-call-btn");
  acceptBtn.addEventListener("click", acceptIncomingCall);
  //incoming call actions
  //accept
  function acceptIncomingCall(a) {
    console.log("call accepted");
    removePopupBtnsListeners();
    timeoutIfNoActionDoneWhenCallReceived("clearTimeOut", undefined);

    //acceptOffer(offer, name);
    popup.style.display = "none";

    send({
      type: "callaccepted",
      name: caller //attach who calls us
    });

    //remove top msg (if there is one)
    //removeTopMsg();

    //mostrar pagina de call con js
  }

  //reject
  var rejectBtn = document.getElementById("reject-incoming-call-btn");
  rejectBtn.addEventListener("click", rejectIncomingCall);
  function rejectIncomingCall() {
    console.log("call rejected");
    removePopupBtnsListeners();
    timeoutIfNoActionDoneWhenCallReceived("clearTimeOut", undefined);

    popup.style.display = "none";
    //esto hace falta o no
    //closeVideoCall(false, false);
    send({
      type: "callrejected",
      name: caller //attach who calls us
    });
  }
}

function redirectCalleeToCall(caller) {
  window.location.href = `${origin}/users/call/2/${caller}`;
}

//ask for offer
function askForOffer(username) {
  send({
    type: "askforoffer",
    name: username
  });
}

/*** */
//***Peer connection */
function createPeerConnection() {
  //using Google public stun server
  // Information about ICE servers - Use your own!
  // var configuration = {
  //   iceServers: [{ urls: "stun:stun2.1.google.com:19302" }]
  // };

  var configuration = servers;

  myPeerConnection = new RTCPeerConnection(configuration);

  //set up handlers for the events
  myPeerConnection.ontrack = handleTrackEvent;
  myPeerConnection.onremovetrack = handleRemoveTrackEvent;
  myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
  myPeerConnection.onicecandidate = handleICECandidateEvent;
  myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
  myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
  myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
}

var t = document.getElementById("caller-username");
if (t) {
  photoStatus("receivingcalling");
}

/**webRTC flow */
//Initiating a call
callBtn.addEventListener("click", function() {
  removeTopMsg();

  var usernameCaller = document.getElementById("caller-username");
  if (usernameCaller) {
    askForOffer(usernameCaller.value);
    // return;
  } else {
    //check if permissions are given, if not, don't allow to make a call
    navigator.mediaDevices
      .enumerateDevices()
      .then(devices => {
        var audioEnabled = devices.some(
          val => val.kind === "audioinput" && val.label !== ""
        );

        var videoEnabled = devices.some(
          val => val.kind === "videoinput" && val.label !== ""
        );
        console.log("a" + audioEnabled);
        console.log("v" + videoEnabled);

        //llamar
        //si esta probihido usar la camara o no ha aceptado usar la camara no se hace nada
        if (audioEnabled && videoEnabled) {
          var callToUsername = targetUsername;

          //remove top msg (if there is one)
          removeTopMsg();

          //quitar if, ya que cojo del DOM el username
          //  if (callToUsername.length > 0) {
          targetUsername = callToUsername;

          send({
            type: "calling"
          });
          photoStatus("calling");
          // yourConn.createOffer(
          //   function(offer) {
          //     send({
          //       type: "offer",
          //       offer: offer
          //     });

          //     yourConn.setLocalDescription(offer);
          //   },
          //   function(error) {
          //     alert("Error when creating an offer");
          //     console.log(error);
          //   }
          // );
          // }

          //change button styles
          setRightIconCall("hangup");
        }
      })
      .catch(function(err) {
        console.log(err.name + ": " + err.message);
      });
  }
});

//send offer
function handleNegotiationNeededEvent(action, name) {
  console.log("start offer");
  console.log(name);
  //solo se ejecute cuando pulsamos el boton llamar no cuando ponemos o quitamos la camara y el micro
  if (action == "call") {
    myPeerConnection
      .createOffer()
      .then(function(offer) {
        return myPeerConnection.setLocalDescription(offer);
      })
      .then(function() {
        // sendToServer({
        //   name: myUsername,
        //   target: targetUsername,
        //   type: "video-offer",
        //   sdp: myPeerConnection.localDescription //esto
        // });

        send({
          type: "offer",
          name: name,
          offer: myPeerConnection.localDescription
        });
      })
      .catch(function(error) {
        console.log(error);
      }); //reportError
  }
}

//when somebody sends us an offer
function handleOffer(offer, name) {
  console.log(name + " has sent us a offer");
  //popupEndFunction(); //remove listener
  // acceptOrRejectOffer(offer, name);
  targetUsername = name;

  //check if navigator supports getUserMedia()
  if (!hasGetUserMedia()) {
    browserNotSupportgetUserMedia("callee");
    return;
  }

  //call constructor
  createPeerConnection();

  var desc = new RTCSessionDescription(offer);
  var getUserMediaError = false;
  var setRemoteDescriptionError = true;

  //promises chaining
  myPeerConnection
    .setRemoteDescription(desc)
    .then(function() {
      setRemoteDescriptionError = false; //no ha habido error en sRD
      console.log("myLocalStream " + myLocalStream); //quitar
      //a
      //if (!myLocalStream) {
      //throw Error("error1");
      return navigator.mediaDevices.getUserMedia(mediaConstraints);
      //}
    })
    .catch(function(err) {
      if (!setRemoteDescriptionError) {
        getUserMediaError = true;
      }
      throw err;
    })
    .then(function(localStream) {
      console.log("localStream " + localStream);
      // if (localStream) {
      myLocalStream = localStream;
      //}
      //a
      localVideo.srcObject = myLocalStream;

      myLocalStream
        .getTracks()
        .forEach(track => myPeerConnection.addTrack(track, myLocalStream));
    })
    .then(function() {
      return myPeerConnection.createAnswer();
    })
    .then(function(answer) {
      //console.log("answer" + answer);
      return myPeerConnection.setLocalDescription(answer);
    })
    .then(function() {
      // var msg = {
      //   name: myUsername,
      //   target: targetUsername,
      //   type: "video-answer",
      //   sdp: myPeerConnection.localDescription //esto
      // };

      // sendToServer(msg);

      photoStatus("talking");
      send({
        type: "answer",
        answer: myPeerConnection.localDescription
      });

      //change button styles
      setRightIconCall("hangup");
    })
    .catch(function(e) {
      if (getUserMediaError) {
        handleGetUserMediaError(e, "callee");
      } else {
        //si es error de webrtc
        console.log(e);
      }
    });
}

//send answer
function acceptOffer(offer, name) {
  targetUsername = name;

  //check if navigator supports getUserMedia()
  if (!hasGetUserMedia()) {
    browserNotSupportgetUserMedia("callee");
    return;
  }

  //call constructor
  createPeerConnection();

  var desc = new RTCSessionDescription(offer);
  var getUserMediaError = false;
  var setRemoteDescriptionError = true;

  //promises chaining
  myPeerConnection
    .setRemoteDescription(desc)
    .then(function() {
      setRemoteDescriptionError = false; //no ha habido error en sRD
      console.log("myLocalStream " + myLocalStream); //quitar
      //a
      //if (!myLocalStream) {
      //throw Error("error1");
      return navigator.mediaDevices.getUserMedia(mediaConstraints);
      //}
    })
    .catch(function(err) {
      if (!setRemoteDescriptionError) {
        getUserMediaError = true;
      }
      throw err;
    })
    .then(function(localStream) {
      console.log("localStream " + localStream);
      // if (localStream) {
      myLocalStream = localStream;
      //}
      //a
      localVideo.srcObject = myLocalStream;

      myLocalStream
        .getTracks()
        .forEach(track => myPeerConnection.addTrack(track, myLocalStream));
    })
    .then(function() {
      return myPeerConnection.createAnswer();
    })
    .then(function(answer) {
      //console.log("answer" + answer);
      return myPeerConnection.setLocalDescription(answer);
    })
    .then(function() {
      // var msg = {
      //   name: myUsername,
      //   target: targetUsername,
      //   type: "video-answer",
      //   sdp: myPeerConnection.localDescription //esto
      // };

      // sendToServer(msg);

      send({
        type: "answer",
        answer: myPeerConnection.localDescription
      });

      //change button styles
      setRightIconCall("hangup");
    })
    .catch(function(e) {
      if (getUserMediaError) {
        handleGetUserMediaError(e, "callee");
      } else {
        //si es error de webrtc
        console.log(e);
      }
    });
}

//when we got an answer from a remote user
function handleAnswer(answer) {
  console.log("Callee has accepted our call");

  var desc = new RTCSessionDescription(answer); //msg.sdp
  myPeerConnection.setRemoteDescription(desc).catch(function(err) {
    console.log(err);
  });

  photoStatus("talking");

  //

  // // Configure the remote description, which is the SDP payload
  // // in our "video-answer" message.

  // var desc = new RTCSessionDescription(msg.sdp);
  // await myPeerConnection.setRemoteDescription(desc).catch(reportError);
}

//call ended: clear variables and states
function closeVideoCall(remoteUserHangUp, getUserMediaError) {
  console.log("close");
  var remoteVideoMedia = remoteVideo.srcObject;

  if (myPeerConnection) {
    myPeerConnection.ontrack = null;
    myPeerConnection.onremovetrack = null;
    myPeerConnection.onremovestream = null;
    myPeerConnection.onicecandidate = null;
    myPeerConnection.oniceconnectionstatechange = null;
    myPeerConnection.onsignalingstatechange = null;
    myPeerConnection.onicegatheringstatechange = null;
    myPeerConnection.onnegotiationneeded = null;

    if (remoteVideo.srcObject) {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
    }

    //dejar de verme
    // if (localVideo.srcObject) {
    //   localVideo.srcObject.getTracks().forEach(track => track.stop());
    // }

    myPeerConnection.close();
    myPeerConnection = null;
  }

  remoteVideo.srcObject = null; //para que en firefox no se quede la ultima imagen sino que se ponga remoteVideo del color definido
  remoteVideo.removeAttribute("src");
  remoteVideo.removeAttribute("srcObject");

  //si quiero que el user no se vea por la cam en localVideo
  // localVideo.removeAttribute("src");
  // localVideo.removeAttribute("srcObject");

  //change button styles
  setRightIconCall("call");

  if (remoteUserHangUp && remoteVideoMedia) {
    //mostrar mensaje: si el otro user recargo el browser y este user estaba hablando con el
    //(tambien si colgo con el btn de colgar)
    showTopMsg("El otro extremo finalizo la llamada");
  }

  //para que pueda volver a llamarle si lo desea sin tener que recargar la pagina
  start(getUserMediaError);

  targetUsername = null; //no habria que limpiarlo por si quiere volver a llamarle,
  //o si porque lo vuelve a coger del dom? pero y si es el callee el que quiere llamarle depues de que el otro user le haya
  //llamado y hayan colgado
  remoteCallerUsername = null;
}

/**** */
/****actions/events*/
/**** */
//action: callee rejected call
function handleRejectOffer() {
  setRightIconCall("call"); //ya se pone en closeVideoCall()
  //closeVideoCall(false, false);
  showTopMsg("El otro extremo rechazo la llamada");
}

/********* */
//timeout
//timeout if no action is done when a call is received
var timeOutNoAction;
var timeOutFadePopupNoAction;
function timeoutIfNoActionDoneWhenCallReceived(opt, name) {
  if (opt === "setTimeOut") {
    timeOutNoAction = setTimeout(function() {
      console.log("timeout set");
      //quitar popup directamente
      // popup.style.display = "none";
      //quitar popup con fadeout
      popup.classList.add("hidden");
      popup.nameCaller = name;

      //por si minimiza el navegador o la pestaña pierde el focus, te garantizas
      //que se llama a la funcion popupEndFunctionTimeout()
      //requestAnimationFrame() is very CPU friendly,
      // causing animations to stop if the current window or tab is not visible.
      timeOutFadePopupNoAction = setTimeout(function() {
        popupEndFunctionTimeout(undefined, name);
      }, 3000);

      popup.addEventListener("transitionend", popupEndFunctionTimeout);
    }, 7000);
  } else if (opt === "clearTimeOut") {
    //cuando callee acepta/cancela la llamada
    console.log("timeout cleared");

    clearTimeout(timeOutNoAction);
    clearTimeout(timeOutFadePopupNoAction);

    popup.removeEventListener("transitionend", popupEndFunctionTimeout);
    clearPopup();
    //No tengo que borrar los listeners de los btns accept/cancel porque los borra al pulsarlos,
    //y aqui se viene cuando los pulsas
  } else if (opt === "clearTimeOut2") {
    //cuando el caller cancela la llamada
    console.log("timeout cleared");
    clearTimeout(timeOutNoAction);
    clearTimeout(timeOutFadePopupNoAction);
  }
}

function popupEndFunctionTimeout(event, username) {
  console.log(event);
  console.log(11);

  //remove timeout
  clearTimeout(timeOutFadePopupNoAction);
  //remove listeners
  popup.removeEventListener("transitionend", popupEndFunctionTimeout);
  removePopupBtnsListeners(); //podra pulsar los btns accept/cancel mientras el popup hace fadeout

  //there are 2 transitions but we want to execute only once
  // if (popup.style.display == "block") {
  //   console.log(2);
  //   popup.style.display = "none";
  //   popup.classList.remove("hidden");
  // }
  clearPopup();

  var callerUsername;
  if (event) {
    callerUsername = event.currentTarget.nameCaller;
  } else {
    callerUsername = username;
  }

  // enviar al caller msg
  send({
    type: "timeout",
    name: callerUsername
  });

  //close call, colgar la llamada para que pueda hacer mas llamadas: closeVideoCall
  closeVideoCall(false, false);
}

function handleTimeout() {
  //setIcon: ya se pone en closeVideoCall()
  //setRightIconCall("call");
  //colgar la llamada: closeVideoCall para que se pueda volver a hacer una llamada
  closeVideoCall(false, false);

  //mostrar msg encima del video
  showTopMsg("El otro usuario no respondio a la llamada");
}
/*********** */

//*** hang up */
//action: one of the peers hangs up
hangUpBtn.addEventListener("click", hangUp);
function hangUp() {
  //cancel the call I am doing
  //if (currentCommunicationStatus === "calling")
  // if (
  //   myPeerConnection &&
  //   myPeerConnection.signalingState === "have-local-offer"
  // ) {
  //}else{}
  // if (currentCommunicationStatus === "calling") {
  send({
    type: "hangup"
  });
  // } else if (currentCommunicationStatus === "talking") {
  //hang up
  // send({
  //   type: "leave"
  // });
  //  closeVideoCall(false);
  //}

  closeVideoCall(false, false);
}

//remote user hangs up
function handleHangUpMsg() {
  console.log("Received hang up notification from other peer");
  closeVideoCall(true, false);
}

/********** */
//action: caller cancels call
//callee is receiving call has been cancelled by caller

var timeOutFadePopupCancelCall;
function handleCancelCall() {
  console.log("call cancelled by caller");
  var pathname = window.location.pathname;
  //si esta en call muestro msg
  if (pathname.split("/")[2] === "call") {
    showTopMsg("Call was cancelled by the caller");
    photoStatus("hangup");
  }
  //si esta el popup mostradose: lo deshabilito

  timeoutIfNoActionDoneWhenCallReceived("clearTimeOut2", undefined);

  removePopupBtnsListeners();

  //change DOM
  cancelCallDiv.style.display = "block";
  incomingCallDialogDiv.style.display = "none";

  //Inicia la transition
  popup.classList.add("hidden");

  //por si minimiza el navegador o la pestaña pierde el focus, te garantizas
  //que se llama a la funcion popupEndFunctionTimeout()
  //requestAnimationFrame() is very CPU friendly,
  // causing animations to stop if the current window or tab is not visible.

  //este setTimer no hay que limpiarlo cuando el user acepta/cancela
  //la llamada o cuando vencen los otos 2 setTimeout (timeOutNoAction, timeOutFadePopupNoAction),
  //porque solo se pone cuando caller cancela la llamada,
  //al contrario que los otros 2 setTimer que se ponen siempre que hay una llamada
  timeOutFadePopupCancelCall = setTimeout(function() {
    popupEndFunctionCancelCall();
  }, 3000);

  //after transition is ended change styles
  popup.addEventListener("transitionend", popupEndFunctionCancelCall);
}

//execute when transition finishes after caller cancelling call
function popupEndFunctionCancelCall() {
  console.log(1);

  //El primero que llega (timer o transitionend event) hace que el otro (timer o transitionend event)
  //no vaya a la funcion popupEndFunctionCancelCall(), asi solo se llama a la funcion una vez
  //remove listener
  popup.removeEventListener("transitionend", popupEndFunctionCancelCall);
  //si el popup se esta desvaneciendo y el caller cancela la llamada,
  // estara creado el listener transitionend que llama a popupEndFunctionTimeout()
  popup.removeEventListener("transitionend", popupEndFunctionTimeout);
  //remove timeout
  clearTimeout(timeOutFadePopupCancelCall);

  //there are 2 transitions but we want to execute only once
  // if (popup.style.display == "block") {
  //   console.log(2);
  //   popup.style.display = "none";
  //   popup.classList.remove("hidden");
  // }
  cancelCallDiv.style.display = "none";
  incomingCallDialogDiv.style.display = "block";
  clearPopup();

  //closeVideoCall(false, false); //no hang up, sino que la cancelo antes de que se estableciese
}
/*********** */

// function removePopupFadeOutListeners() {
//   var pBtn = document.getElementById("incoming-call-dialog");
//   var pBtnClone = pBtn.cloneNode(true);
//   pBtn.parentNode.replaceChild(pBtnClone, pBtn);
// }
//utility function to remove event listeners
function removePopupBtnsListeners() {
  //como para ejecutarlo en handleCancelCall() no se puede hacer:
  //acceptBtn.removeEventListener("click", acceptIncomingCall);, ni para el btn rejectBtn
  //lo hago tambien para acceptIncomingCall() y rejectIncomingCall() asi

  //remove all listeners by cloning the element, which will not clone the listeners collection.
  //remove button#accept-incoming-call-btn listeners
  var aicBtn = document.getElementById("accept-incoming-call-btn");
  var aicBtnClone = aicBtn.cloneNode(true);
  aicBtn.parentNode.replaceChild(aicBtnClone, aicBtn);

  //remove button#reject-incoming-call-btn listeners
  var ricBtn = document.getElementById("reject-incoming-call-btn");
  var ricBtnClone = ricBtn.cloneNode(true);
  ricBtn.parentNode.replaceChild(ricBtnClone, ricBtn);
}

/** */

/*action: on page reload, go to another page or close browser window */
//si el popup esta activo: se le envia msg al caller de que se rechaza la llamada
// window.addEventListener("unload", sendCancelActionMessageToPeer);
// function sendCancelActionMessageToPeer() {
//   //si me estaba llamando alguien: rechazar la llamada
//   if (currentCommunicationStatus === "receiving_call") {
//     //send ws
//     send({
//       type: "callrejected",
//       name: remoteCallerUsername //attach who sends us the offer
//     });
//   }
//   // }

//   //si estaba llamando a alguien: cancelar la llamada
//   if (currentCommunicationStatus === "calling") {
//     send({
//       type: "cancel"
//     });
//   }
// }

//****Signaling
function handleSignalingStateChangeEvent(event) {
  switch (myPeerConnection.signalingState) {
    case "closed":
      closeVideoCall(false, false);
      break;
  }
}

/*** UI updates */

//change button styles
function setRightIconCall(setMode) {
  if (setMode === "call") {
    hangUpBtn.style.display = "none";
    callBtn.style.display = "block";
    photoStatus("hangup");
  } else if (setMode === "hangup") {
    callBtn.style.display = "none";
    hangUpBtn.style.display = "block";
  }
}

//remove top msg (if there is one)
function removeTopMsg() {
  var divTopMsg = document.getElementById("show-msg");
  if (divTopMsg && divTopMsg.clientHeight == "100") {
    divTopMsg.style.height = "0";
  }
}

//restablece las propiedades CSS
//para cuando se queda class="hidden", lo quita
function clearPopup() {
  console.log("clear1");
  //there are 2 transitions but we want to execute only once
  if (popup.style.display == "block") {
    console.log("clear2");
    popup.style.display = "none";
    popup.classList.remove("hidden");
  }
}

// **** ICE
//when we got an ice candidate from a remote user
//duda: se puede borrar esta funcion? handleICECandidateEvent no tiene esos metodos
// function handleCandidate(candidate) {
//   yourConn.addIceCandidate(new RTCIceCandidate(candidate));
// }

// Setup ice handling
function handleICECandidateEvent(event) {
  if (event.candidate) {
    // sendToServer({
    //   type: "new-ice-candidate",
    //   target: targetUsername,
    //   candidate: event.candidate
    // });
    send({
      type: "candidate",
      candidate: event.candidate
    });
  }
}

//when we got an ice candidate from a remote user
function handleNewICECandidateMsg(candidate) {
  console.log(candidate);
  //msg
  //
  if (myPeerConnection) {
    var candidate1 = new RTCIceCandidate(candidate); //msg.candidate
    myPeerConnection.addIceCandidate(candidate1).catch(error => {
      console.log(error);
    });
  }
}

function handleICEConnectionStateChangeEvent(event) {
  switch (myPeerConnection.iceConnectionState) {
    case "closed":
    case "failed":
    case "disconnected":
      closeVideoCall(false, false);
      break;
  }
}

function handleICEGatheringStateChangeEvent(event) {
  console.log("changed: " + myPeerConnection.signalingState);
}

//***Track
function handleTrackEvent(event) {
  remoteVideo.srcObject = event.streams[0];
  console.log("track was added to the connection");
  //change button styles
  //setRightIconCall("call");
}

function handleRemoveTrackEvent(event) {
  var stream = remoteVideo.srcObject;
  var trackList = stream.getTracks();

  if (trackList.length == 0) {
    closeVideoCall(false, false);
  }
  console.log("track was removed from the connection");
}

//in call page so the dialog popup is seen also if video is un fullscreen mode
var popupDialog = document.getElementById("incoming-call-dialog");
var videoDiv = document.getElementById("callPage");
if (videoDiv) {
  videoDiv.appendChild(popupDialog);
  // popupDialog.remove();
}
