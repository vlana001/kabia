var socket = io({ transports: ["websocket"], upgrade: false });

//rename (remove friend username) url if arrived from friends card chat icon
var pathNameParts = pathName.split("/");
if (
  pathNameParts[1] === "users" &&
  pathNameParts[2] === "chat" &&
  pathNameParts[3]
) {
  window.history.pushState("", "", "/users/chat");
}

//***send msg****
var sendMsgIcon = document.getElementById("send-msg-icon");
if (sendMsgIcon) {
  sendMsgIcon.addEventListener("click", sendChatMsg);
}

// var sendBtn = document.getElementById("msgsend");
// sendBtn.addEventListener("click", sendChatMsg);

function sendChatMsg(e) {
  // e.preventDefault(); // prevents page reloading, form is not submitted
  var msg = document.getElementById("msgtext");
  var msgText = msg.value;
  var isText = validateIsText(msgText); //validate
  //var isLengthAllowed = validateIsAlllowedLength(msgText);
  if (isText) {
    //&& isLengthAllowed
    //loop: enviar cada posicion del array
    var aMsg = splitLongMessages(msg.value);
    for (i = 0; i < aMsg.length; i++) {
      sendMsg(aMsg[i]); //send msg
      hideMsgThereAreNoChats();
      createMsgDOM(aMsg[i], "send"); //create msg in DOM
      moveScrollWithNewMsg();
    }
    msg.value = ""; //clean input
    //change send button opacity
    //var sendBtn = document.getElementById("msgsend");
    sendMsgIcon.style.opacity = "0.3";
  }
  return false;
}

//validation
//dont allow sending an empty message
function validateIsText(msgText) {
  //no permitir enviar todo espacios en blanco
  msgTextTrimmed = msgText.trim();
  if (msgTextTrimmed === "") {
    return false;
  } else {
    return true;
  }
}

function isFriendAndNotBlocked() {
  var friendDiv = document.getElementById(currentFriendUsernameNormalized)
    .parentElement;
  var isNotFriend = friendDiv.querySelector("#nofriend") != null;
  var isBlocked = friendDiv.querySelector("#blocked") != null;

  if (isNotFriend || isBlocked) {
    return false;
  } else {
    return true;
  }
}

// function validateIsAlllowedLength(msgText) {
//   if (msgText.length < 4096) {
//     return true;
//   } else {
//     return false;
//     //array partir msg
//   }
// }

//Si un msg es mayor de 4095 caracteres se separa en msg mas pequeños
function splitLongMessages(msgText) {
  var msgArray = [];
  if (msgText.length < 4096) {
    msgArray.push(msgText);
  } else {
    var msgArray = msgText.match(/.{1,4095}/g);
  }
  return msgArray;
}

//change opacity send icon when input value changes
var msg = document.getElementById("msgtext");
if (msg) {
  msg.addEventListener("input", toggleSendIcon);
}

function toggleSendIcon() {
  var msgText = msg.value;
  var isText = validateIsText(msgText);

  if (isText) {
    //sendBtn.disabled = false;
    sendMsgIcon.style.opacity = "1";
  } else {
    //sendBtn.disabled = true;
    sendMsgIcon.style.opacity = "0.3";
  }
}

function verifyUserIsSelected() {
  if (currentFriendUsernameNormalized) {
    return true;
  }
  return false;
}

//***add send or received msg to DOM *
function createMsgDOM(msg, msgType) {
  var divMsg = document.createElement("div");
  divMsg.classList.add("chat-message");

  var time;
  var msgText;
  if (msgType === "send") {
    divMsg.classList.add("chat-message-send");
    time = nowTime();
    msgText = msg;
  }

  if (msgType === "receive") {
    var msgReceived = JSON.parse(msg);
    divMsg.classList.add("chat-message-received");
    msgText = msgReceived.msgText;
    // time = calculateTime(msgReceived.msgTime);
    time = msgReceived.msgTime;
  }

  var divMsgText = document.createElement("div");
  divMsgText.classList.add("chat-message-text");
  var spanMsgText = document.createElement("span");
  spanMsgText.innerText = msgText;
  divMsgText.appendChild(spanMsgText);

  var divMsgTime = document.createElement("div");
  divMsgTime.classList.add("chat-message-hour");
  var spanMsgTime = document.createElement("span");
  spanMsgTime.innerText = time;
  var inputMsgTime = document.createElement("input");
  inputMsgTime.setAttribute("type", "hidden");
  inputMsgTime.setAttribute("value", time);
  divMsgTime.appendChild(spanMsgTime);
  divMsgTime.appendChild(inputMsgTime);

  divMsg.appendChild(divMsgText);
  divMsg.appendChild(divMsgTime);

  var chatMsgDiv = document.getElementById("chatmessages");
  chatMsgDiv.appendChild(divMsg);
}

//*** add msg loaded from db to dom*
var scrollToElement;
var prevReadStatus;
var msgAdded;
function createLoadedMsgDOM(msg, i, numMsgLoaded, msgType, loadFromCase) {
  var divMsg = document.createElement("div");
  divMsg.classList.add("chat-message");

  var time;
  var msgText;
  var divMsgStatus;

  if (msgType === "send") {
    var msgSend = JSON.parse(msg);
    divMsg.classList.add("chat-message-send");
    msgText = msgSend.msgText;
    time = msgSend.msgTime;
    if (msgSend.msgReadStatus === false) {
      divMsgStatus = document.createElement("div");
      divMsgStatus.classList.add("msg-status-unread");
    }
  }

  var msgStatus;
  if (msgType === "receive") {
    var msgReceived = JSON.parse(msg);
    msgStatus = msgReceived.msgReadStatus;
    divMsg.classList.add("chat-message-received");
    msgText = msgReceived.msgText;
    time = msgReceived.msgTime;
  }

  var divMsgText = document.createElement("div");
  divMsgText.classList.add("chat-message-text");
  var spanMsgText = document.createElement("span");
  spanMsgText.innerText = msgText;
  divMsgText.appendChild(spanMsgText);

  var divMsgTime = document.createElement("div");
  divMsgTime.classList.add("chat-message-hour");
  var spanMsgTime = document.createElement("span");
  spanMsgTime.innerText = time;
  var inputMsgTime = document.createElement("input");
  inputMsgTime.setAttribute("type", "hidden");
  inputMsgTime.setAttribute("value", time);
  divMsgTime.appendChild(spanMsgTime);
  divMsgTime.appendChild(inputMsgTime);

  if (msgType === "send") {
    if (msgSend.msgReadStatus === false) {
      divMsgTime.appendChild(divMsgStatus);
    }
  }

  divMsg.appendChild(divMsgText);
  divMsg.appendChild(divMsgTime);

  //poner msg despues del spinner
  //ponerlos arriba de los msg que estan cargados, no debajo, ya que son anteriores
  var spinnerChatDiv = document.getElementById("spinner-loading-chat");
  spinnerChatDiv.parentNode.insertBefore(divMsg, spinnerChatDiv.nextSibling); //insert after spinner

  //load al hacer scroll hacia arriba para ver msg previos
  if (loadFromCase === "loadPrevious") {
    if (i === 0) {
      scrollToElement = divMsg;
    }
  }
  //load al abrir un chat
  if (loadFromCase === "loadOpening") {
    if (
      (msgStatus === true || msgStatus === undefined) && //msg es received ya leido por mi, o es send por mi
      prevReadStatus === false && //el anterior msg no estaba leido por mi
      msgAdded === false
    ) {
      //div nuevos mensajes
      var divNewMsgText = document.createElement("div");
      divNewMsgText.classList.add("chat-message-info");
      divNewMsgText.classList.add("chat-message");
      divNewMsgText.setAttribute("id", "new-messages");
      divNewMsgText.innerHTML += "Nuevos mensajes";

      scrollToElement = divNewMsgText;

      spinnerChatDiv.parentNode.insertBefore(
        divNewMsgText,
        spinnerChatDiv.nextSibling.nextSibling
      );
      msgAdded = true;
    } else if (
      //no me habia enviado ese user msg nunca
      msgStatus === false && //msg recibido y no leido
      i === numMsgLoaded - 1 && //y no hay mas msg que cargar
      msgAdded === false
    ) {
      //div nuevos mensajes
      var divNewMsgText = document.createElement("div");
      divNewMsgText.classList.add("chat-message-info");
      divNewMsgText.classList.add("chat-message");
      divNewMsgText.setAttribute("id", "new-messages");
      divNewMsgText.innerHTML += "Nuevos mensajes";

      scrollToElement = divNewMsgText;

      spinnerChatDiv.parentNode.insertBefore(
        divNewMsgText,
        spinnerChatDiv.nextSibling
      );
      msgAdded = true;
    }
  }

  //update prevReadStatus
  if (msgType === "receive") {
    prevReadStatus = msgStatus;
  }
}

//***scroll ****

//bajar el scroll hasta abajo cada vez que se envia o recibe un msg
// para que el user vea el msg sin tener que bajarlo el manualmente
//scroll to bottom
function moveScrollWithNewMsg() {
  var scroll = document.getElementById("chatmessages");
  var y = scroll.scrollHeight;
  scroll.scrollTo(0, y);
}

//cuando haces scroll para arriba para cargar msg de la db
var scrollDiv = document.getElementById("chatmessages");
if (scrollDiv) {
  scrollDiv.addEventListener("scroll", moveScrollUp);
}

function moveScrollUp() {
  var a = scrollDiv.scrollTop;
  var b = scrollDiv.scrollHeight - scrollDiv.clientHeight;
  var c = a / b;

  //cuando llega arriba del todo
  if (c === 0) {
    //load last 10 msg from new user
    loadMessages(10)
      .then(msgLoaded => {
        if (msgLoaded.length > 0) {
          addMsgLoadedDOM(msgLoaded, "loadPrevious");
        }
        return msgLoaded;
      })
      .then(msgLoaded => {
        if (msgLoaded.length < 10) {
          msgBeginningOfChat();
        }
      });
  }
}

function scrollToPreviousPosition() {
  //cuando ya no hay mas msg que obtener de la db y se obtiene [],
  //como msgLoaded.length = 0, no se llamara a addMsgLoadedDOM(),
  //que es la funcion que llama a scrollToPreviousPosition()

  if (scrollToElement) {
    //hay msg nuevos
    scrollToElement.scrollIntoView(); //arriba del area visible
    scrollDiv.scrollTop = scrollDiv.scrollTop - 5; //5px mas arriba
  } else {
    //no hay msg nuevos
    moveScrollWithNewMsg();
  }
}

//*** keydown load messages from db*

// document.addEventListener("click", focusChat);
// function focusChat() {
//   document.getElementById("chatmessages").focus();
// }

document.addEventListener("keydown", arrowUpKeyLoadMessages);
function arrowUpKeyLoadMessages(e) {
  if (e.keyCode === 38) {
    //arrow up key

    //hago el scroll hasta arriba del todo y como se detecta un evento de scroll
    //la funcion moveScrollUp() carga los msg
    var scroll = document.getElementById("chatmessages");
    if (verifyUserIsSelected() && isChatMessagesClicked) {
      // && clickedOnChatDiv()
      scroll.scrollTo(0, 0);
    }

    // if (verifyUserIsSelected()) {
    //   //load last 10 msg from new user
    //   loadMessages(10).then(msgLoaded => {
    //     if (msgLoaded.length > 0) {
    //       addMsgLoadedDOM(msgLoaded);
    //     } else {
    //       //para que si subes mediante la flecha que se quede el scroll arriba del todo cuando llega al limite
    //       var scroll = document.getElementById("chatmessages");
    //       scroll.scrollTo(0, 0);
    //     }
    //   });
    // }

    //scrollToPreviousPosition();
  }
}

//Para que mediante la key up solo suba un scroll en cada momento,
//el scroll de los mensajes de chat o el scroll de los friends
//Si haces click en el documento y no es el div derecha o un hijo suyo,
//que no suba la key up el scroll ese
// var isChatMessagesClicked;
// document.addEventListener("click", isClickedChatDiv);
// function isClickedChatDiv(e) {
//   var elementTargeted = e.target;
//   // console.log(elementTargeted);
//   var chatMessages = document.getElementById("chatmessages");
//   if (
//     chatMessages.isSameNode(elementTargeted) ||
//     chatMessages.contains(elementTargeted)
//   ) {
//     isChatMessagesClicked = true;
//   } else {
//     isChatMessagesClicked = false;
//   }
//   console.log(isChatMessagesClicked);
//   return isChatMessagesClicked;
// }

//cada vez que se hace un nuevo click se actualiza la variable isChatMessagesClicked
if (pathName === "/users/chat") {
  document.addEventListener("mousedown", mouseDown);
}
function mouseDown(e) {
  clickedOnChatDiv(e.clientX, e.clientY);
}

//quiero que si se hace click en uno de los divs (friendslist o chatmessages),
//incluida  la scrollbar de estos, y pulsas la tecla flecha arriba,
// solo se suba el scroll que has pinchado y nunca los 2 scrolls a la vez
var isChatMessagesClicked;
//offsetWidth: The width of the entire element, including borders and padding (excluding margins)
function clickedOnChatDiv(mouseX, mouseY) {
  var friendsListDiv = document.getElementById("friendslist");
  var chatMessagesDiv = document.getElementById("chatmessages");
  var navbar = document.getElementById("main-header");

  if (
    friendsListDiv.offsetWidth < mouseX &&
    // mouseY <= chatMessagesDiv.offsetHeight &&
    mouseY <= navbar.offsetHeight + chatMessagesDiv.offsetHeight &&
    navbar.offsetHeight <= mouseY
  ) {
    isChatMessagesClicked = true;
    return true;
  } else {
    isChatMessagesClicked = false;
  }
}

// function clickedOnFriendsDiv(mouseX, mouseY) {
//   var friendsListDiv = document.getElementById("friendslist");
//   var navbar = document.getElementById("main-header");

//   if (mouseX <= friendsListDiv.offsetWidth && navbar.offsetHeight <= mouseY) {
//     return true;
//   }
// }

//**** load msg from db
function loadMessages(limit, areUnreadMsg) {
  spinnerShow();
  var usernameReceiver = document.getElementById("username-receiver").value;
  //con la fetch API hay que poner todo el dominio no vale solo el pathname
  return fetch(`${origin}/users/chat-load-msg`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: usernameReceiver,
      limit: limit,
      lastTime: getLastTime()
    })
  })
    .then(response => response.json())
    .then(msg => {
      spinnerHide();
      console.log(msg);
      // if (msg.length === 0) {
      //   msgBeginningOfChat();
      // }
      return msg;
    })
    .then(msg => {
      //Despues de cargar los msg los pongo como read
      if (areUnreadMsg) {
        //set msg from that user with status read
        setMsgFromCurrentUserAsRead(currentFriendUsernameNormalized);
      }
      return msg;
    });
}

//**** process msg loaded from db*
function addMsgLoadedDOM(msgLoaded, loadFromCase) {
  //los msg estan ordenados de mas reciente a menos reciente,  pongo en el DOM el mas reciente el primero,
  //el segundo mas reciente encima del primero mas reciente y asi

  var numMsgLoaded = msgLoaded.length;
  msgLoaded.forEach((msg, i) => {
    var me = userRole(msg.sender, msg.receiver);

    var m = JSON.stringify({
      msgText: msg.msgText,
      msgTime: msg.date,
      msgReadStatus: msg.read
    });

    if (me === 2) {
      //yo lo he enviado
      createLoadedMsgDOM(m, i, numMsgLoaded, "send", loadFromCase);
    } else if (me === 1) {
      //yo lo he recibido
      //nuevos msg
      createLoadedMsgDOM(m, i, numMsgLoaded, "receive", loadFromCase);
    }

    // if (i === 9) {
    //   scrollToPreviousPosition();
    // }
  });

  scrollToPreviousPosition();
}

function userRole(sender, receiver) {
  if (currentFriendUsernameNormalized === sender) {
    return 1;
  } else if (currentFriendUsernameNormalized === receiver) {
    return 2;
  }
}

//**** socketio
//recibir msg: recibir msg, ponerlo en el DOM y bajar el scroll
socket.on("chatReceive", function(data) {
  var msgReceived = JSON.parse(data);

  //esta en la pagina de chats
  if (pathName === "/users/chat") {
    var pUsername = document.getElementById(msgReceived.msgSenderNormalized);
    var divUser;
    //console.log(pUsername);
    if (pUsername) {
      divUser = pUsername.parentElement.parentElement;
    }
    //console.log(divUser);

    //tiene abierto el chat de ese user (del que recibe el msg)
    if (msgReceived.msgSenderNormalized === currentFriendUsernameNormalized) {
      //poner msg como leido en la db
      socket.emit("setMsgRead", { from: msgReceived.msgSenderNormalized });
      //mostrar msg en el dom
      createMsgDOM(data, "receive");
      moveScrollWithNewMsg();

      setUserDivFirst(divUser); //poner user div primero en la lista de users
    } else {
      //no tiene abierto el chat de ese user
      //si no existe un div para ese user crearlo (no ha hablado antes con el)
      if (!pUsername) {
        //get msg sender image name
        getImageName(msgReceived.msgSenderNormalized).then(function(imageName) {
          //create div
          divUser = createDivForUser(
            msgReceived.msgSender,
            msgReceived.msgSenderNormalized,
            imageName
          );

          //esto esta dentro de la promise, no puedo poner solo una vez,
          //lo del if y el else despues del if
          //poner user div primero en la lista de users
          setUserDivFirst(divUser);

          //sumar 1 (nuevo msg sin leer) a los 2 contadores
          addNewMsgToUserUnreadMsgCounter(
            msgReceived.msgSender,
            msgReceived.msgSenderNormalized
          );
          addNewMsgToTotalUnreadMsgCounter();
        });
      } else {
        //si existe un div para ese user crearlo (ha hablado antes con el)
        //ponerlo para los 2
        setUserDivFirst(divUser); //poner user div primero en la lista de users

        //sumar 1 (nuevo msg sin leer) a los 2 contadores
        addNewMsgToUserUnreadMsgCounter(
          msgReceived.msgSender,
          msgReceived.msgSenderNormalized
        );
        addNewMsgToTotalUnreadMsgCounter();
      }
    }
  } else {
    //no esta en la pagina de chat
    //sumar 1 (nuevo msg sin leer) al contador de la navbar
    addNewMsgToTotalUnreadMsgCounter();
  }
});

function getImageName(usernameNormalized) {
  return fetch(`${origin}/users/get-image-name`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: usernameNormalized
    })
  })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      return data.imageName;
    });
}

//recibir el num total de msg pendientes de leer
socket.on("unreadMessagesNumber", function(data) {
  var num = JSON.parse(data);
  console.log(num);
  if (num.unreadMsgNumber > 0) {
    updateUnreadedMsgNum(num.unreadMsgNumber);
  }
});

if (pathName === "/users/chat") {
  socket.on("unreadMessagesNumberEachFriend", function(data) {
    var num = JSON.parse(data);
    console.log(num);
    updateUnreadedMsgNumEachFriend(num);
  });
}

if (pathName === "/users/chat") {
  socket.on("unreadMessagesStatusEachFriend", function(data) {
    var friends = JSON.parse(data);
    console.log(friends);
    console.log(friends.friends);
    updateUnreadedMsgStatusEachFriend(friends.friends);
  });
}

//enviar msg
function sendMsg(msgText) {
  var receiver = document.getElementById("username-receiver").value;
  socket.emit("chatSend", { msg: msgText, to: receiver });

  var divUserReceiver = document.getElementById(receiver);
  setUserDivFirst(divUserReceiver.parentElement.parentElement);
}

//Si no se ha hablado con ese user antes necesitara que se le cree un div en el DOM
function createDivForUser(username, usernameNormalized, image) {
  var divContainerUser = document.createElement("div");
  divContainerUser.classList.add("friend");

  var divContainerUserPhoto = document.createElement("div");
  divContainerUserPhoto.classList.add("friend-photo");
  var imgUserPhoto = document.createElement("img");
  imgUserPhoto.classList.add("chat-user-img");
  imgUserPhoto.setAttribute("src", "/uploads/" + image);
  divContainerUserPhoto.appendChild(imgUserPhoto);

  var divContainerUserUsername = document.createElement("div");
  divContainerUserUsername.classList.add("friend-username");
  var userUsernameP = document.createElement("p");
  userUsernameP.id = usernameNormalized;
  userUsernameP.innerText = username;

  var input1 = document.createElement("input");
  input1.type = "hidden";
  input1.name = "username";
  input1.value = username;
  var input2 = document.createElement("input");
  input2.type = "hidden";
  input2.name = "imageURL";
  input2.value = image;
  divContainerUserUsername.appendChild(userUsernameP);
  divContainerUserUsername.appendChild(input1);
  divContainerUserUsername.appendChild(input2);

  var divContainerUserUnreadMsg = document.createElement("div");
  divContainerUserUnreadMsg.classList.add("unread-msg-number");
  var divContainerUserUnreadMsgNumber = document.createElement("div");
  divContainerUserUnreadMsgNumber.id = "user-unread-msg-number";
  divContainerUserUnreadMsg.appendChild(divContainerUserUnreadMsgNumber);
  var divContainerUserUnreadMsgStatus = document.createElement("div");
  divContainerUserUnreadMsgStatus.id = "user-unread-msg-status";
  divContainerUserUnreadMsg.appendChild(divContainerUserUnreadMsgStatus);

  divContainerUser.appendChild(divContainerUserPhoto);
  divContainerUser.appendChild(divContainerUserUsername);
  divContainerUser.appendChild(divContainerUserUnreadMsg);

  divContainerUser.addEventListener("click", function(e) {
    selectCurrentFriend(e);
  });

  return divContainerUser;
}

//subo ese div como primero
function setUserDivFirst(divUser) {
  //los msg tendran que estar en orden cronologico
  //los ultimos recibidos estaran mas recientes

  var friendListDiv = document.getElementById("friendslist");

  //añadir elem al dom
  friendListDiv.insertBefore(divUser, friendListDiv.firstChild);

  //subir scroll de lista de users con los que has chateados
  setUserListScrollUp();
}

//poner el scroll en la scrollbar de users arriba del todo
function setUserListScrollUp() {
  var scrollUsers = document.getElementById("friendslist");

  //scroll to top
  scrollUsers.scrollTo(0, 0);
}

//update DOM
function updateUnreadedMsgNum(number) {
  var chatIcon = document.getElementById("chat-icon");
  chatIcon.style.display = "inline-block";
  chatIcon.innerText = number;
}

//recorrer el array
//para cada objeto buscar friend en la lista de la izquierda y añadir num al dom (resetear el que habia)
//y si no habia abierto un chat con ese user se abre
//finalmente ordeno la lista poniendo ese div el primero
function updateUnreadedMsgNumEachFriend(num) {
  for (i = 0; i < num.length; i++) {
    //console.log(num[i].username);
    var divUsername = document.getElementById(num[i].username);
    //var divUser;
    // if (divUsername) {
    //num msg recibidos sin leer
    var divMsgNum = divUsername.parentElement.nextElementSibling.getElementsByTagName(
      "div"
    )[0]; //#user-unread-msg-number
    divMsgNum.style.display = "inline-block";
    divMsgNum.innerText = num[i].msgNum;

    // }
    // else {
    //   var divContainerUser = document.createElement("div");
    //   divContainerUser.classList.add("friend");
    //   var divContainerUserPhoto = document.createElement("div");
    //   divContainerUserPhoto.classList.add("friend-photo");
    //   var divContainerUserUsername = document.createElement("div");
    //   divContainerUserUsername.classList.add("friend-username");
    //   var userUsernameP = document.createElement("p");
    //   userUsernameP.id = "a"; //Pasar username
    //   userUsernameP.innerText = "a"; //Pasar username
    //   divContainerUserUsername.appendChild(userUsernameP);
    //   var divContainerUserUnreadMsgNumber = document.createElement("div");
    //   divContainerUserUnreadMsgNumber.classList.add("unread-msg-number");
    //   var divContainerUserUnreadMsgNumberChild = document.createElement("div");
    //   divContainerUserUnreadMsgNumberChild.id = "user-unread-msg-number";
    //   divContainerUserUnreadMsgNumber.appendChild("user-unread-msg-number");

    //   divContainerUser.appendChild(divContainerUserPhoto);
    //   divContainerUser.appendChild(divContainerUserUsername);
    //   divContainerUser.appendChild(divContainerUserUnreadMsgNumber);

    //   divUser = divContainerUser;
    // }
  }

  //var chatIcon = document.getElementById("chat-icon"); //get div y su icono de msg
  //si no existe el div para ese user lo creo
  //chatIcon.style.display = "inline-block";
  //chatIcon.innerText += num;
}

function updateUnreadedMsgStatusEachFriend(friends) {
  for (i = 0; i < friends.length; i++) {
    var divUsername = document.getElementById(friends[i]);
    //console.log(divUsername);
    //if (divUsername) {
    //tiene msg enviados que el receiver no ha leido
    //en un chat entre 2 users nunca podra haber user msg que has enviado y que has recibido que esten
    //ambos sin leer, solo podra haber uno de los 2
    var divMsgUnread = divUsername.parentElement.nextElementSibling.getElementsByTagName(
      "div"
    )[1];

    divMsgUnread.style.display = "inline-block";
    // }
  }
}

//*** select users form user list: to open its chat messages*/
//****new user is selected *
//select current friend to chat
var friendsDivs = document.getElementsByClassName("friend");
if (friendsDivs) {
  for (var i = 0; i < friendsDivs.length; i++) {
    friendsDivs[i].addEventListener("click", selectCurrentFriend);
  }
}

var currentFriendUsernameNormalized;
function selectCurrentFriend(e) {
  //clear textarea
  var textarea = document.getElementById("msgtext");
  textarea.value = "";
  //change send icon opacity
  sendMsgIcon.style.opacity = "0.3";

  //hide msg
  toggleMsgSelectChat("hideMsg");
  var elem = e.target;
  var elemTag = elem.tagName;
  var elemClass = elem.className;

  var elemParent;
  if (elemTag === "DIV") {
    if (
      elem.id === "user-unread-msg-number" ||
      elem.id === "user-unread-msg-status"
    ) {
      elemParent = elem.parentElement.parentElement;
    } else if (
      elemClass === "friend-photo" ||
      elemClass === "friend-username" ||
      elemClass === "unread-msg-number"
    ) {
      elemParent = elem.parentElement;
    } else {
      elemParent = elem;
    }
  } else if (elemTag === "P") {
    elemParent = elem.parentElement.parentElement;
  } else if (elemTag === "IMG") {
    elemParent = elem.parentElement.parentElement;
  }
  //select current friend
  var currentFriendUsernameNormalizedElement = elemParent.getElementsByTagName(
    "p"
  )[0];
  currentFriendUsernameNormalized = currentFriendUsernameNormalizedElement.id;

  document.getElementById(
    "username-receiver"
  ).value = currentFriendUsernameNormalized;
  //

  var currentFriendUsername =
    currentFriendUsernameNormalizedElement.nextElementSibling;

  //enable/disable input
  var inputText = document.getElementById("msgtext");
  if (isFriendAndNotBlocked()) {
    inputText.disabled = false;
  } else {
    inputText.disabled = true;
  }

  //create div
  // var imgRelativeURL = currentFriendUsername.nextElementSibling.value.split("/")[4];
  // console.log(currentFriendUsername.nextElementSibling);
  // console.log(currentFriendUsername.nextElementSibling.value);
  // console.log(imgRelativeURL);

  // var currentFriendImageURL = imgRelativeURL;

  //ssr
  var currentFriendImageURL = currentFriendUsername.nextElementSibling;

  //set unread msg from that user to 0
  var msgElem = elemParent.getElementsByTagName("div")[2];
  var msgElemNum = msgElem.getElementsByTagName("div")[0];
  var numMsgUnreadUser = parseInt(msgElemNum.innerText);
  msgElemNum.style.display = "none";
  msgElemNum.innerText = 0;

  //subtract to the total number of unread msg
  var msgElemNumTotal = document.getElementById("chat-icon");
  var vTotal = parseInt(msgElemNumTotal.innerText);
  var newTotal;
  if (!isNaN(numMsgUnreadUser)) {
    newTotal = vTotal - numMsgUnreadUser;
    msgElemNumTotal.innerText = newTotal;
  }

  if (newTotal === 0) {
    msgElemNumTotal.style.display = "none";
  }

  var areUnreadMsg;
  if (!isNaN(numMsgUnreadUser) && numMsgUnreadUser !== 0) {
    areUnreadMsg = true;
  } else {
    areUnreadMsg = false;
  }

  //display user messages
  displayUserMessages(
    currentFriendUsername.value,
    currentFriendImageURL.value,
    areUnreadMsg
  );

  //if mobile screen: hide lateral menu with users list (when user card clicked)
  hideLateralUsersListIfMobileScreen();

  //focus textarea
  textarea.focus();
}

function hideLateralUsersListIfMobileScreen() {
  var friendsListDivIcon = document.getElementById("container-icon");
  var friendsListDivIconDisplay = window.getComputedStyle(friendsListDivIcon)
    .display;
  //ver si nos encontramos en al version de pantalla mobile
  if (friendsListDivIconDisplay === "none") {
    //mobile, porque el icon de la lista con users esta oculto
    var friendsListDivRight = document.getElementById("friends");
    friendsListDivRight.style.width = "0";
  }
}

function toggleMsgSelectChat(opt) {
  //Al cargar la pagina esta: container (div#messages) visibility: hidden;
  //y div#msg-select-chat-div  visibility: visible;
  //si doy visibility:visible al hijo se muestra aunque el padre tenga visibility hidden

  if (opt === "hideMsg") {
    //container esta visibility:visible
    //div#msg-select-chat-div lo pongo display:none (no ocupe espacio)
    var msgDiv = document.getElementById("msg-select-chat-div");
    msgDiv.style.display = "none";
    msgDiv.style.visibility = "hidden";
  }

  if (opt === "showMsg") {
    //pongo todo el container visibility: hidden
    //div#msg-select-chat-div lo pongo display:flex (ocupe espacio) y visibility:visible
    // se puede tener el padre visibility: hidden, pero poner el hijo visibility: visible
    var messagesDiv = document.getElementById("messages");
    messagesDiv.style.visibility = "hidden";
    //
    var msgDiv = document.getElementById("msg-select-chat-div");
    msgDiv.style.display = "flex";
    msgDiv.style.visibility = "visible";
  }
}

function setMsgFromCurrentUserAsRead(username) {
  return fetch(`${origin}/users/set-user-msg-read`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: username
    })
  })
    .then(response => response.json())
    .then(msg => {
      console.log(msg);
    });
}

//show/load chat messages when user is selected
function displayUserMessages(
  currentFriendUsername,
  currentFriendImageURL,
  areUnreadMsg
) {
  //add image and username to header
  var imgCurrentUser = document.getElementById("current-chat-user-image");
  imgCurrentUser.src = "/uploads/" + currentFriendImageURL;
  var usernameCurrentUser = document.getElementById(
    "current-chat-user-username"
  );
  usernameCurrentUser.textContent = currentFriendUsername;

  var messagesDiv = document.getElementById("messages");
  messagesDiv.style.visibility = "visible";

  //remove msgs from previous user (included new msg msg)
  removeElementsByClass("chat-message");

  //reset variables cuando abro chat
  scrollToElement = undefined;
  prevReadStatus = undefined;
  msgAdded = false;

  //load last 20 msg from new user
  loadMessages(20, areUnreadMsg)
    .then(msgLoaded => {
      if (msgLoaded.length > 0) {
        addMsgLoadedDOM(msgLoaded, "loadOpening");
      }
      return msgLoaded;
    })
    .then(msgLoaded => {
      if (msgLoaded.length < 20) {
        msgBeginningOfChat();
      }
    });

  moveScrollWithNewMsg();
}

//clear chat msg when new user is selected, to be able to set new user msgs in dom
function removeElementsByClass(className) {
  var elements = document.getElementsByClassName(className);
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }
}

//add +1 to navbar total number of unread msg counter
function addNewMsgToTotalUnreadMsgCounter() {
  var counter = document.getElementById("chat-icon");
  var numMsg = parseInt(counter.innerText);
  var newNumMsg;
  if (isNaN(numMsg)) {
    newNumMsg = 1;
  } else {
    newNumMsg = numMsg + 1;
  }

  counter.innerText = newNumMsg;
  counter.style.display = "inline-block";
}

//add +1 to number of unread msg counter from that user
function addNewMsgToUserUnreadMsgCounter(sender, senderNormalized) {
  var userDiv = document.getElementById(senderNormalized);
  var counterUser = userDiv.parentElement.nextElementSibling.getElementsByTagName(
    "div"
  )[0];

  var numMsg = parseInt(counterUser.innerText);
  var newNumMsg;
  if (isNaN(numMsg)) {
    newNumMsg = 1;
  } else {
    newNumMsg = numMsg + 1;
  }

  counterUser.innerText = newNumMsg;
  counterUser.style.display = "inline-block";
}

//set background when empty space is clicked
//only valid for when there are just a few users
//El espacio donde estan los usernames que queda libre si el user ha iniciado chat con pocos amigos
var emptySpace = document.getElementById("emptyspace");
if (emptySpace) {
  emptySpace.addEventListener("click", setBackground);
}

// var emptySpaceContainerIcon = document.getElementById("container-icon");
// if (emptySpaceContainerIcon) {
//   //emptySpaceContainerIcon.addEventListener("click", checkOutOfCircle);
//   // function checkOutOfCircle(e) {
//   //   if (e.target.id == "container-icon") {
//   //     setBackground();
//   //   }
//   // }
// }

function setBackground() {
  toggleMsgSelectChat("showMsg");
  currentFriendUsernameNormalized = undefined;

  hideLateralUsersListIfMobileScreen();
}

//***time: process time from msg loaded from db *
function nowDateTime() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();

  var hours = today.getHours();
  if (minutes < 10) {
    var minutes = today.getMinutes();
  }
  var now = mm + "/" + dd + "/" + yyyy + "-" + hours + ":" + minutes;
}

function nowTime() {
  // var today = new Date();
  // var hours = today.getHours();
  // var minutes = today.getMinutes();
  // if (minutes < 10) {
  //   minutes = "0" + minutes;
  // }
  // var now = hours + ":" + minutes;
  // return now;
  var currentDate = moment()
    .utc()
    .toDate();

  return currentDate;
}

// function calculateTime(time) {
//   //split
// }

//Obtener el time  del msg mas antiguo en el dom
function getLastTime() {
  var firstChildMsg = document.querySelector(
    "div.chat-message:not(.chat-beginning-message):not(.chat-message-info)"
  );
  //returns the first element that matches a specified CSS selector(s) in the document
  if (firstChildMsg) {
    var firstChildMsgTime = firstChildMsg.children[1].children[1].value;
    //console.log(firstChildMsgTime);

    return firstChildMsgTime;
  } else {
    return "";
  }
}

//**loading msgs spinner *
function spinnerShow() {
  var chatLoadingSpinnerDiv = document.getElementById("spinner-loading-chat");
  chatLoadingSpinnerDiv.style.display = "block";
  var chatLoadingSpinner = document.getElementById("spinner-loading-chat-span");
  chatLoadingSpinner.classList.add("lds-dual-ring-chat");
}

function spinnerHide() {
  var chatLoadingSpinnerDiv = document.getElementById("spinner-loading-chat");
  chatLoadingSpinnerDiv.style.display = "none";
  var chatLoadingSpinner = document.getElementById("spinner-loading-chat-span");
  chatLoadingSpinner.classList.remove("lds-dual-ring-chat");
}

//***Msg Inicio del chat *
function msgBeginningOfChat() {
  var msgBegChat = document.getElementsByClassName("chat-beginning-message")[0];

  if (!msgBegChat) {
    var divMsg = document.createElement("div");
    divMsg.classList.add("chat-beginning-message");
    divMsg.classList.add("chat-message");

    var spanMsg = document.createElement("span");
    spanMsg.innerText = "Inicio del chat";
    divMsg.appendChild(spanMsg);

    var chatMessages = document.getElementById("chatmessages");
    //chatMessages.appendChild(divMsg);
    chatMessages.insertBefore(divMsg, chatMessages.firstChild);
  }
}

//***help modal
// Get the div icon that opens the help modal
var helpModalLaunch = document.getElementById("chat-help");
//helpDiv.addEventListener("click", showHelpModal);

// Get the help modal
var helpModal = document.getElementById("helpModal");

// When the user clicks the icon, open the modal
if (helpModalLaunch) {
  helpModalLaunch.onclick = function() {
    helpModal.style.display = "block";
  };
}

// Get the <span> element that closes the help modal
var spanCloseHelpModal = document.getElementById("close-help-modal");
// When the user clicks on <span> (x), close the modal
if (spanCloseHelpModal) {
  spanCloseHelpModal.onclick = function() {
    helpModal.style.display = "none";
  };
}

//*** search friend modal
var searchFriendModalLaunch = document.getElementById("search-friend-div");
if (searchFriendModalLaunch) {
  searchFriendModalLaunch.addEventListener("click", openModalSearchFriend);
}
var friendsModal = document.getElementById("searchFriendModal");

function openModalSearchFriend() {
  //clear modal input
  var modalInput = document.getElementById("friend-username");
  modalInput.value = "";
  //show modal
  friendsModal.style.display = "block";
}

var spanCloseSearchFriendModal = document.getElementById(
  "close-search-friend-modal"
);
if (spanCloseSearchFriendModal) {
  spanCloseSearchFriendModal.onclick = function() {
    friendsModal.style.display = "none";
    //clear input
    //document.getElementById("friend-username").value = "";
  };
}

//click on window: close modals and dropdown
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  // //dont hide android chrome keyboard when msg is sent
  // var sendMsgIcon = document.getElementById("send-msg-icon");
  // if (sendMsgIcon.contains(event.target)) {
  //   document.getElementById("msgtext").focus();
  //   document.getElementById("msgtext").click();
  // }

  //search friends modal
  if (event.target == friendsModal) {
    friendsModal.style.display = "none";
  }

  //help modal
  if (event.target == helpModal) {
    helpModal.style.display = "none";
  }

  //terms and privacy modal (login)
  // When the user clicks anywhere outside of the modal, close it
  if (event.target == termsPrivacyModalLogin) {
    termsPrivacyModalLogin.style.display = "none";
  }

  //terms and privacy modal (register)
  if (event.target == termsPrivacyModalRegister) {
    termsPrivacyModalRegister.style.display = "none";
  }

  //navbar dropdown
  // When the user clicks anywhere outside of the dropdown, close it
  var btnDropdown = document.getElementById("dropbtn-myaccount");
  if (btnDropdown && !btnDropdown.contains(event.target)) {
    var dropdownContent = document.getElementById("dropdown-content");
    dropdownContent.style.display = "none";
    previousElement = undefined; //reset variable (dropdown)
  }

  //lateral menu hamburger
  var sideNav = document.getElementById("side-navigation");
  var hamburgerIconSVG = document.getElementById("hamburger-icon");
  var istopNavbarTab = isTopNavbarTab(event);

  if (
    sideNav &&
    sideNav.style.width > "0px" &&
    !sideNav.contains(event.target) &&
    !hamburgerIconSVG.contains(event.target) &&
    !istopNavbarTab
  ) {
    //close menu
    sideNav.style.width = "0";
    //change icon
    var hamburgerIcon = document.getElementById("hamburgerIcon");
    var closeHamburgerIcon = document.getElementById("closeHamburgerIcon");
    closeHamburgerIcon.style.display = "none";
    hamburgerIcon.style.display = "inline-block";
  }
};

//Al buscar un string de username en el input del modal y hacer click en uno de los resultados (de users
//que coinciden con ese string) del dropdown, obtenidos mediante fetch,
//se llama a esta funcion, que sirve para poner ese user en la lista de users con los que has hablado.
//Es decir, creo un div en la lista de users con los que he hablado, al pulsar un div de un user
//en el dropdown de modal, esta funcion es la que se ejecuta al pulsar un div en dicho dropdown del modal
//Esta funcion se llama de script-user.

// diferenciar:
// -evento click al seleccionar un user de la lista del modal para añadir ese user a la lista de users con los que has hablado:
// script-user: writeUsersListInModalInputDropdown()
// -evento click seleccionar un user de la lista de users para hablar con el y cargar sus msg de chat:
// chat: friendsDivs[i].addEventListener("click", selectCurrentFriend);

function startNewChat(elem) {
  //get data to create div
  var usernameNormalized = elem.getElementsByTagName("input")[0].value;

  var pUsername = document.getElementById(usernameNormalized);
  var divUser;
  // var userFoundInUsersChated = false;
  if (pUsername) {
    //si ya ha chateado antes con ese user
    divUser = pUsername.parentElement.parentElement;
    //userFoundInUsersChated = true;
  } else {
    //si no ha chateado antes con ese user
    //get data to create div
    var username = elem.getElementsByTagName("input")[1].value;
    var image = elem.getElementsByTagName("img")[0].src;
    var imageRelativeURL = image.split("/")[4];
    //create div
    divUser = createDivForUser(username, usernameNormalized, imageRelativeURL);
  }

  //close modal
  friendsModal.style.display = "none";

  //aparte de añadir la card del user a users list, abro dicha lista (si es mobile)
  //ver si nos encontramos en al version de pantalla mobile
  var friendsListDivIcon = document.getElementById("container-icon");
  var friendsListDivIconDisplay = window.getComputedStyle(friendsListDivIcon)
    .display;
  if (friendsListDivIconDisplay === "none") {
    //mobile, porque el icon de la lista con users esta oculto
    var friendsListDivRight = document.getElementById("friends");

    //show menu lateral de la derecha con los users con los que he chateado (si no estaba ya mostrandose)
    if (!(friendsListDivRight.style.width > "0px")) {
      //si esta cerrado, lo abro
      friendsListDivRight.style.width = "80%";
    }
  }

  //otra forma de hacerlo
  //selecciona todos los users con los que he chateado anteriormente
  //var elemFriends = document.querySelectorAll("#friendslist p");
  // //Si el user (user seleccionado de la lista de users obtenidos
  // //con fetch, que paso del dropdown del modal a esta funcion (startNewChat)) ya se encuentra
  // //en la lista de users con los que has hablado antes
  // var userFoundInUsersChated = false;
  // var elemUser;
  // for (i = 0; i < elemFriends.length; i++) {
  //   if (elemFriends[i].id == usernameNormalized) {
  //     userFoundInUsersChated = true;
  //     elemUser = elemFriends[i];
  //   }
  // }

  if (pUsername) {
    // user found in list of user users chated
    //scroll into that element
    divUser.scrollIntoView(true); //me muevo hasta ese elemento
  } else {
    setUserDivFirst(divUser); //poner user div primero en la lista de users
  }

  //abro el chat con ese user, para cargar sus msg
  divUser.click();
}

//Si aun no habia hablado con nadie, se mostrara el msg "No tienes ningun chat iniciado",
//ese msg desaparecera cuando envies un msg al primer user (no cuando pongas una card de user en la
//lista de users)
//si se cargan users en la pagina desde el backend, no se cargara el elemento #nofriendschat
function hideMsgThereAreNoChats() {
  var divMsg = document.getElementById("nofriendschat");
  if (divMsg) {
    divMsg.style.display = "none";
  }
}

//new friendship requests (no chat)
socket.on("newFriendshipRequestsNumber", function(data) {
  var num = JSON.parse(data);
  console.log(num);
  if (num.newFriendshipReqsNumber) {
    updateNewFriendshipReq(num.newFriendshipReqsNumber, "update");
  } else if (num.newFriendshipRequest === 1) {
    updateNewFriendshipReq(undefined, "sum");
  } else if (num.newFriendshipRequest === -1) {
    updateNewFriendshipReq(undefined, "subtract");
  }
});

function updateNewFriendshipReq(number, op) {
  var friendshipRequestIcon = document.getElementById("friendship-icon");
  friendshipRequestIcon.style.display = "inline-block";
  if (op === "update") {
    friendshipRequestIcon.innerText = number;
  } else if (op === "sum") {
    if (friendshipRequestIcon.innerText === "") {
      //al inicio si no hay req
      friendshipRequestIcon.innerText = 1;
    } else {
      friendshipRequestIcon.innerText =
        parseInt(friendshipRequestIcon.innerText) + parseInt(1);
    }
    // if (!isNaN(friendshipRequestIcon.innerText)) {
    //
    // } else {
    //   friendshipRequestIcon.innerText = 1;
    // }
    //vacio o 0
  } else if (op === "subtract") {
    friendshipRequestIcon.innerText =
      parseInt(friendshipRequestIcon.innerText) - parseInt(1);
  }
}

//small screen navbar
//see friends chated
var iconSeeFriendsChated = document.getElementById("see-friends-chated");
if (iconSeeFriendsChated) {
  iconSeeFriendsChated.addEventListener("click", seeFriendsChated);
}
function seeFriendsChated(e) {
  var friendsListSide = document.getElementById("friends");

  if (friendsListSide.style.width > "0px") {
    //si esta abierto parcial o totalmente
    //close menu
    friendsListSide.style.width = "0";
    //change icon
    // closeHamburgerIcon.style.display = "none";
    // hamburgerIcon.style.display = "inline-block";
  } else {
    //si esta cerrado del todo
    //open menu
    friendsListSide.style.width = "80%";
    // hamburgerIcon.style.display = "none";
    // closeHamburgerIcon.style.display = "inline-block";

    //subir scroll de lista de users con los que has chateados
    setUserListScrollUp();
  }
}

//search friend
var iconSearchFriend = document.getElementById(
  "search-friend-div-top-chat-navbar"
);
if (iconSearchFriend) {
  iconSearchFriend.addEventListener("click", searchFriend);
}
function searchFriend(e) {
  // var modal = document.getElementById("searchFriendModal");
  // modal.style.display = "block";
  openModalSearchFriend();
}

//
//Si viene de pulsar el icono de chat en un card de friends, abrir el chat de ese user
//al cargar la pagina ver si #start-chat-with-usernamenormalized tiene un value
var startChatWithUsernameNormalized = document.getElementById(
  "start-chat-with-usernamenormalized"
);
if (startChatWithUsernameNormalized) {
  //esta en la pagina de chats ya que esta #start-chat-with-usernamenornalized en el dom

  if (startChatWithUsernameNormalized.value) {
    //viene de la card de un friend

    console.log(2);
    var pUsername = document.getElementById(
      startChatWithUsernameNormalized.value
    );
    var divUser;
    //no va a tener abierto el chat de ese user porque acaba de cargar la pagina
    if (pUsername) {
      //si existe un div para ese user crearlo (ha hablado antes con el)
      divUser = pUsername.parentElement.parentElement;
    } else {
      //si no existe un div para ese user crearlo (no ha hablado antes con el)
      var startChatWithUsername = document.getElementById(
        "start-chat-with-username"
      );
      var startChatWithUsernameImgUrl = document.getElementById(
        "start-chat-with-imgurl"
      );

      divUser = createDivForUser(
        startChatWithUsername.value,
        startChatWithUsernameNormalized.value,
        startChatWithUsernameImgUrl.value
      );
    }

    setUserDivFirst(divUser); //poner user div primero en la lista de users

    //abrir chat con ese user para cargar sus msg
    //hacer click en el elemento: llama a selectCurrentFriend()
    divUser.click();
  }
}

// var t = document.getElementById("msgtext");
// t.addEventListener("focus", make);

// function make() {
//   console.log(324);
//   document.getElementById("writemessage").style.height = "100px";
// }

// var sendMsgIcon = document.getElementById("send-msg-icon");
// if (sendMsgIcon) {
//   sendMsgIcon.addEventListener("click", dontHideKeyboard); //
// }
// function dontHideKeyboard(e) {
//   e.preventDefault();
//   alert(3);
// }

//dont hide android chrome keyboard when msg is sent
var sendMsgIcon = document.getElementById("send-msg-icon");
if (sendMsgIcon) {
  sendMsgIcon.addEventListener("click", dontHideKeyboard);
}
function dontHideKeyboard(event) {
  var msgText = document.getElementById("msgtext");
  //if I click on icon but it has not text, I dont show the keyboard
  // if (validateIsText(msgText)) {
  document.getElementById("msgtext").focus();
  document.getElementById("msgtext").click();
  // }
}
