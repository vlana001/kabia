//global vars: tambien para chat.js
var pathName = window.location.pathname;
var origin = window.location.origin;

//Get email address from login input
// var inputLoginEmail = document.getElementById("forgotPassword");
// console.log(inputLoginEmail);
// inputLoginEmail.addEventListener("click", getEmailFromLogin);

function getEmailFromLogin() {
  var link = document.getElementById("forgotPassword");
  var email = document.getElementById("email").value;
  link.setAttribute("href", "/forgotpassword/" + email);
  return true;
}

//********** */
//Autocomplete
function autocomplete() {
  var userinput = document.getElementById("friend-username");
  if (userinput) {
    // var userinputvalue = document.getElementById("friend-username").value;
    //console.log(userinputvalue);

    var currentFocus;
    var matchedValues; //array to store values and when click out and in not neccesary to make another http req

    userinput.addEventListener("input", function(e) {
      var val = this.value;
      currentFocus = -1;

      if (val) {
        //#search-loading show, #search-not-loading hide
        showIconSearchInInput("loading");
        var userinputvalue = document.getElementById("friend-username").value;
        //If input is empty we dont send an http req to server
        const options = {
          method: "post",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username: userinputvalue })
        };
        // const url = `${origin}/users/searchfriend`;
        //const url = "http://localhost:3000/users/searchfriend";

        fetch(`${origin}/users/searchfriend`, options)
          .then(function(response) {
            return response.json();
          })
          .then(function(users) {
            //#search-not-loading show, #search-loading hide
            showIconSearchInInput("not-loading");
            //Add usernames to the DOM
            matchedValues = users;
            writeUsersListInModalInputDropdown(users, e);
          })
          .catch(function(err) {
            console.error("Request failed", err);
          });
      } else {
        matchedValues = 0;
        writeUsersListInModalInputDropdown(matchedValues, e);
      }
    });

    //si clicko en un lugar de la screen, se cierra el dropdown con los users obtenidos mediante fetch, y si vuelvo a
    //clickar en el input del modal, se vuelven a mostrar los users que habias obtenido con la fetch api,
    //sin necesidad de realizar otra http req
    userinput.addEventListener("click", function(e) {
      var val = this.value;
      if (!val) {
        return false;
      }
      //poner value, no puedes si no has escrito aun en el DOM
      writeUsersListInModalInputDropdown(matchedValues, e);
    });

    userinput.addEventListener("keydown", function(e) {
      var x = document.getElementById("friends-list");
      if (x) x = x.getElementsByClassName("friend-card"); //obtiene todos los elementos div con clase friend-card hijos del elemento x

      if (e.keyCode == 40) {
        //"Arrowdown " key
        currentFocus++;
        addActive(x);
        scrollWhenElementSelected();
      } else if (e.keyCode == 38) {
        //"Arrowup " key
        currentFocus--;
        addActive(x);
        scrollWhenElementSelected();
      } else if (e.keyCode == 13) {
        //"Enter" key
        e.preventDefault(); //dont submit form
        if (currentFocus > -1) {
          if (x) x[currentFocus].click(); //simula el click de un ratón físico en un elemento HTML
        }
      }
    });
  }

  function scrollWhenElementSelected() {
    var el = document.getElementsByClassName("autocomplete-active")[0];
    el.scrollIntoView(false);
  }

  //Escribe los divs de los users obtenidos mediante fetch, en el dropdown del modal
  function writeUsersListInModalInputDropdown(users, event) {
    closeAllLists();
    //no pasarlo en la func como parametro, si borras muy rapido no funciona
    val = document.getElementById("friend-username").value;

    //matchedValues
    var a, b, i;
    // closeAllLists();
    if (!val) {
      return false;
    }

    //create a DIV element that will contain the items (usernames)
    //crea el div (dropdown del modal) que contiene la lista de users
    a = document.createElement("div");
    a.setAttribute("id", "friends-list");
    a.setAttribute("class", "friends-list");

    var divAutocomplete = document.getElementById("autocomplete");
    divAutocomplete.parentNode.insertBefore(a, divAutocomplete.nextSibling);
    //userinput.parentNode.insertBefore(a, userinput.nextSibling); //inserta a
    //a = getelementbyId

    //for each returned user: write in DOM
    for (i = 0; i < users.length; i++) {
      //NO hace falta hacer un filtro, porque desde el server solo devuelvo lo que cumple el criteria
      // if (
      //   users[i].username.substr(0, val.length).toUpperCase() ==
      //   val.toUpperCase()
      // ) {
      //create a DIV element for each username
      b = document.createElement("div");
      b.setAttribute("class", "friend-card");

      //create div element
      img = document.createElement("img");
      img.setAttribute("class", "search-friend-img");
      img.src = "/uploads/" + users[i].imageURL;
      img.alt = "";
      b.appendChild(img);

      if (users[i].isBlocked) {
        b.setAttribute("data-blocked", "true");
        b.classList.add("blocked-friend-user");
      } else {
        b.setAttribute("data-blocked", "false");
      }

      if (users[i].status === "online") {
        b.setAttribute("data-status", "online");
      } else {
        b.setAttribute("data-status", "not-online");
      }

      //make the matching letters bold:
      u = document.createElement("div");
      u.setAttribute("class", "search-friend-username");
      u.innerHTML =
        "<strong>" + users[i].username.substr(0, val.length) + "</strong>";
      u.innerHTML += users[i].username.substr(val.length);
      //insert a input field that will hold the current array item's value to know the value when click
      u.innerHTML +=
        "<input type='hidden' value='" + users[i].usernameNormalized + "'>";
      u.innerHTML += "<input type='hidden' value='" + users[i].username + "'>";
      b.appendChild(u);

      //Cuando clickes en un elemento del dropdown/autocomplete del modal
      b.addEventListener("click", function(e) {
        var value = this.getElementsByTagName("input")[0].value;
        //let location = window.location;
        //console.log("a" + location.origin);
        //http redirect
        //http://localhost:3000/users/${value}

        //redirect
        if (pathName === "/users/searchfriend") {
          window.location.href = `${origin}/users/u/${value}`;
        }
        //start new chat
        if (pathName === "/users/chat") {
          var cardsFriend = document.getElementsByClassName("friend-card");

          for (var i = 0; i < cardsFriend.length; i++) {
            if (cardsFriend[i].contains(e.target)) {
              startNewChat(cardsFriend[i]);
            }
          }
        }

        closeAllLists();
      });

      //a = document.getElementById("friends-list");
      //a.parentNode.insertBefore(b, a.nextSibling);
      a.appendChild(b);
      // }
    }

    //Si el event es click le pongo el value al elemento de la lista que lo tenia antes de quitar el focus al input
    if (event.type === "click") {
      if (currentFocus !== -1) {
        var x = document.getElementById("friends-list");
        if (x) x = x.getElementsByClassName("friend-card");
        addActive(x);
      }
    }

    //mensaje no users found
    if (users.length == 0) {
      if (val !== "" || val.length !== 0 || val !== null) {
        b = document.createElement("DIV");
        a.setAttribute("id", "msg-no-friends-found"); //sobrescribo el valor del id, asi no se puede bajar con las flechas en el mensaje
        b.setAttribute("id", "msg-no-friends-found-child");
        b.innerHTML = "<i>No friends found matching that criteria</i>";
        a.appendChild(b);
      }
    }
  }

  function addActive(x) {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0; //pasar del ultimo elemento de la lista al primero
    if (currentFocus < 0) currentFocus = x.length - 1; //pasar del primer elemento de la lista al ultimo
    x[currentFocus].classList.add("autocomplete-active");
    x[currentFocus]
      .getElementsByTagName("div")[0]
      .classList.add("autocomplete-active");
  }
  function removeActive(x) {
    console.log(x);
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
      x[i]
        .getElementsByTagName("div")[0]
        .classList.remove("autocomplete-active");
    }
  }

  function closeAllLists(elmnt) {
    var userinput = document.getElementById("friend-username");
    var x = document.getElementsByClassName("friends-list");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != userinput) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }

  document.addEventListener("click", function(e) {
    closeAllLists(e.target);
  });

  // function delay(callback, ms) {
  //   var timer = 0;
  //   return function() {
  //     var context = this,
  //       args = arguments;
  //     clearTimeout(timer);
  //     timer = setTimeout(function() {
  //       callback.apply(context, args);
  //     }, ms || 0);
  //   };
  // }
}

autocomplete();

//***********
//***Terms and privacy modal
//Login
// Get the links that open the modal
var termsPrivacyModalLoginLaunch1 = document.getElementById(
  "termsPrivacyModalLoginLauncher1"
);
var termsPrivacyModalLoginLaunch2 = document.getElementById(
  "termsPrivacyModalLoginLauncher2"
);

// Get the modal
var termsPrivacyModalLogin = document.getElementById("termsPrivacyModalLogin");

// When the user clicks the link, open the modal
//if (linkModal || linkModal2) {
if (termsPrivacyModalLoginLaunch1) {
  termsPrivacyModalLoginLaunch1.onclick = function() {
    termsPrivacyModalLogin.style.display = "block";
  };
}
if (termsPrivacyModalLoginLaunch2) {
  termsPrivacyModalLoginLaunch2.onclick = function() {
    termsPrivacyModalLogin.style.display = "block";
  };
}
//}

// Get the <span> element that closes the modal
//When the user clicks on <span> (x), close the modal
var spanCloseTermsPrivacyModalLogin = document.getElementById(
  "close-terms-privacy-modal-login"
);
if (spanCloseTermsPrivacyModalLogin) {
  spanCloseTermsPrivacyModalLogin.onclick = function() {
    termsPrivacyModalLogin.style.display = "none";
  };
}

//create and edit profile
function copyPastePlace() {
  var bp = document.getElementById("birthplace").value;
  document.getElementById("livingplace").value = bp;
}

//Register
var termsPrivacyModalRegisterLaunch = document.getElementById(
  "termsPrivacyModalRegisterLauncher"
);

var termsPrivacyModalRegister = document.getElementById(
  "termsPrivacyModalRegister"
);

if (termsPrivacyModalRegisterLaunch) {
  termsPrivacyModalRegisterLaunch.onclick = function() {
    termsPrivacyModalRegister.style.display = "block";
  };
}

var spanCloseTermsPrivacyModalRegister = document.getElementById(
  "close-terms-privacy-modal-register"
);
if (spanCloseTermsPrivacyModalRegister) {
  spanCloseTermsPrivacyModalRegister.onclick = function() {
    termsPrivacyModalRegister.style.display = "none";
  };
}

//dropdown

// var friendsBtn = document.getElementById("dropbtn-friends");
// if (friendsBtn) {
//   friendsBtn.addEventListener("click", hideShowDropdown);
// }

// var notificationsBtn = document.getElementById("dropbtn-notifications");
// if (notificationsBtn) {
//   notificationsBtn.addEventListener("click", hideShowDropdown);
// }

// var myAccountBtn = document.getElementById("dropbtn-myaccount");
// if (myAccountBtn) {
//   myAccountBtn.addEventListener("click", hideShowDropdown);
// }

// var previousElement; //global variable
// function hideShowDropdown(event) {
//   //ver que elemento lanza el evento
//   var elemId = event.target;
//   //dropdown content: para abrir y cerrar el dropdown
//   var dropdownContent = document.getElementById("dropdown-content");
//   //para saber si he clickado 2 veces seguidas en el btn de la navbar que abre el dropdown
//   var b = false;

//   //Si las 2 ultimas veces que he hecho click, he dado click al mismo boton de la navbar: no muestro el dropdown.
//   //Porque la primera de las veces le he dado para mostrarlo y la segunda para ocultarlo,
//   //asi que la segunda vez que doy click, lo oculto, no lo vuelvo a mostrar
//   var btnDropdown = document.getElementById("dropbtn-myaccount");
//   if (previousElement && btnDropdown.contains(previousElement)) {
//     b = true;
//   }
//   previousElement = elemId;

//   //2 formas de cerrar el dropdown:
//   //click en la window fuera del elemento
//   //click 2 veces seguidas en el mismo elemento btn que abre el dropdown

//   //hide/show: no hace falta mirar el estado de la propiedad CSS display
//   //Al hacer un click en window fuera del btn se cierra el dropdown
//   if (!b) {
//     //no esta abierto (no acabo de clickar el btn por lo que no esta abierto)
//     dropdownContent.style.display = "block";
//   } else {
//     //esta abierto (acabo de clickar el btn por lo que esta abierto)
//     dropdownContent.style.display = "none"; //Cierro el dropdown
//     previousElement = undefined; //reset variable
//   }
// }

// window.onclick = function(event) {
//   // console.log(event);
//   // //close dropdown
//   // var ddc = document.getElementsByClassName("dropdown-content")[0];
//   // console.log(ddc.style);
//   // if (ddc && ddc.style.display == "block") {
//   //   ddc.style.display = "none";
//   // }

// };

//******************friends
//***** *
//1.profile btns
//friendship request
var buttonRequestFriendship = document.getElementById("rf-btn");
if (buttonRequestFriendship) {
  buttonRequestFriendship.addEventListener("click", requestFriendship);
}

function requestFriendship(e) {
  var spinnerStatus = isSpinnerActive(e);
  if (spinnerStatus) {
    return;
  }
  disableEnableBtnsProfile("disable", e);

  var divMsg = document.getElementById("message-profile");
  divMsg.style.display = "none"; //si habia un msg lo oculto
  var pMsg = document.getElementById("msg-users");

  var usernameRequestFriendship = document.getElementById("username").value;
  var spinnerBtn = document.getElementById("btn-rf-spinner");
  spinnerBtn.classList.add("lds-dual-ring");

  //if (buttonRequestFriendship.value === "Solicitar amistad")
  fetch(`${origin}/users/request-friendship`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ usernameNormalized: usernameRequestFriendship })
  })
    .then(response => response.json())
    .then(body => {
      spinnerBtn.classList.remove("lds-dual-ring");

      if (body.requestSend === "OK") {
        //cambiar color del boton y mensaje

        //buttonRequestFriendship.style.backgroundColor = "blue";
        //buttonRequestFriendship.value = "Solicitud enviada";

        //Add msg
        divMsg.style.backgroundColor = "#85e085";
        pMsg.innerText = body.msg;
        // divMsg.style.display = "flex";

        //Remove button and add button
        var btnFr = document.getElementById("rf-btn");
        if (btnFr) {
          btnFr.remove();
        }

        var btnCfb = document.createElement("button");
        btnCfb.id = "cfr-btn";
        btnCfb.classList.add("friendship-actions-btn");

        var span1 = document.createElement("span");
        span1.classList.add("btn-text");
        span1.innerText = "Cancelar Solicitud de amistad";

        var span2 = document.createElement("span");
        span2.id = "btn-cfr-spinner";

        btnCfb.appendChild(span1);
        btnCfb.appendChild(span2);

        var referenceNode = document.getElementById("blockunblock-btn");
        var parentNode = document.getElementById("btns");
        parentNode.insertBefore(btnCfb, referenceNode);

        //Para que al pulsar el btn cancelar solicitud de amistad funcione y se envie al servidor
        //ya que cuando se ejecuto el codigo JS en el navegador
        //no existia el btn cancelar solicitud de amistad por lo que el codigo de dentro del if
        //no se ejecuto
        //code:
        // if (buttonCancelFriendshipRequestProfile) {
        //   buttonCancelFriendshipRequestProfile.addEventListener(
        //     "click",
        //     cancelFriendshipRequestProfile
        //   );
        // }

        var buttonCancelFriendshipRequestProfile = document.getElementById(
          "cfr-btn"
        );
        if (buttonCancelFriendshipRequestProfile) {
          buttonCancelFriendshipRequestProfile.addEventListener(
            "click",
            cancelFriendshipRequestProfile
          );
        }
      } else if (
        body.requestSend === "NotAllowed" ||
        body.requestSend === "operationNotAllowed"
      ) {
        //buttonRequestFriendship.style.backgroundColor = "red";
        // buttonRequestFriendship.value = "Not Allowed";

        divMsg.style.backgroundColor = "#ffb0b0";
        pMsg.innerText = body.msg;
      }
      divMsg.style.display = "flex";
      disableEnableBtnsProfile("enable", null);
    });
}

//cancel sent friendship request from profile
var buttonCancelFriendshipRequestProfile = document.getElementById("cfr-btn");
if (buttonCancelFriendshipRequestProfile) {
  buttonCancelFriendshipRequestProfile.addEventListener(
    "click",
    cancelFriendshipRequestProfile
  );
}

function cancelFriendshipRequestProfile(e) {
  var spinnerStatus = isSpinnerActive(e);
  if (spinnerStatus) {
    return;
  }
  disableEnableBtnsProfile("disable", e);

  var divMsg = document.getElementById("message-profile");
  divMsg.style.display = "none"; //si habia un msg lo oculto
  var pMsg = document.getElementById("msg-users");

  var usernameCancelFriendship = document.getElementById("username").value;
  var spinnerBtn = document.getElementById("btn-cfr-spinner");
  spinnerBtn.classList.add("lds-dual-ring");

  fetch(`${origin}/users/cancel-sent-friendship-request`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ usernameNormalized: usernameCancelFriendship })
  })
    .then(response => response.json())
    .then(body => {
      spinnerBtn.classList.remove("lds-dual-ring");

      if (body.requestSend === "OK") {
        //cambiar color del boton y mensaje

        //buttonRequestFriendship.style.backgroundColor = "blue";
        //buttonRequestFriendship.value = "Solicitud enviada";

        //Add msg
        divMsg.style.backgroundColor = "#85e085";
        pMsg.innerText = body.msg;

        //Remove button and add button
        var btnFcr = document.getElementById("cfr-btn");
        if (btnFcr) {
          btnFcr.remove();
        }
        var btnRf = document.createElement("button");
        btnRf.id = "rf-btn";
        btnRf.classList.add("friendship-actions-btn");

        var span1 = document.createElement("span");
        span1.classList.add("btn-text");
        span1.innerText = "Solicitar amistad";

        var span2 = document.createElement("span");
        span2.id = "btn-rf-spinner";

        btnRf.appendChild(span1);
        btnRf.appendChild(span2);

        var referenceNode = document.getElementById("blockunblock-btn");
        var parentNode = document.getElementById("btns");
        parentNode.insertBefore(btnRf, referenceNode);

        //Para que al pulsar el btn solicitar amistad funcione y se envie la solicitud
        //ya que cuando se ejecuto el codigo JS en el navegador
        //no existia el btn solicitar amistad por lo que el codigo de dentro del if
        //no se ejecuto
        //code:
        // if (buttonRequestFriendship) {
        //   buttonRequestFriendship.addEventListener("click", requestFriendship);
        // }
        var buttonRequestFriendship = document.getElementById("rf-btn");
        if (buttonRequestFriendship) {
          buttonRequestFriendship.addEventListener("click", requestFriendship);
        }
      } else if (
        body.requestSend === "NotAllowed" ||
        body.requestSend === "operationNotAllowed"
      ) {
        //buttonRequestFriendship.style.backgroundColor = "red";
        // buttonRequestFriendship.value = "Not Allowed";
        divMsg.style.backgroundColor = "#ffb0b0";
        pMsg.innerText = body.msg;
      }
      divMsg.style.display = "flex";
      disableEnableBtnsProfile("enable", null);
    });
}

//block/unblock user
var buttonBlockUnblockUser = document.getElementById("blockunblock-btn");
if (buttonBlockUnblockUser) {
  buttonBlockUnblockUser.addEventListener("click", toggleBlock);
}

function toggleBlock(e) {
  var spinnerStatus = isSpinnerActive(e);
  if (spinnerStatus) {
    return;
  }
  disableEnableBtnsProfile("disable", e);

  if (buttonBlockUnblockUser.value === "blocked") {
    unblockUser(e);
  } else {
    blockUser(e);
  }
}

function blockUser(e) {
  //Get username
  var blockedUser = document.getElementById("username").value;

  var spinnerBtn = document.getElementById("btn-bu-spinner");
  spinnerBtn.classList.add("lds-dual-ring");

  fetch(`${origin}/users/block-user`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: blockedUser
    })
  })
    .then(response => response.json())
    .then(body => {
      spinnerBtn.classList.remove("lds-dual-ring");

      //cambiar color del boton y mostrar mensaje
      //quitar elemento del DOM, como no dejar un hueco
      // buttonRequestFriendship.style.backgroundColor = "blue";
      // buttonRequestFriendship.value = "Solicitud enviada";

      var divMsg = document.getElementById("message-profile");
      var pMsg = document.getElementById("msg-users");

      if (body.requestSend === "OK") {
        //cambiar color del boton y mensaje

        //buttonRequestFriendship.style.backgroundColor = "blue";
        //buttonRequestFriendship.value = "Solicitud enviada";

        //Show msg
        divMsg.style.backgroundColor = "#85e085";
        pMsg.innerText = body.msg;
        divMsg.style.display = "flex";

        //Change button (button attributes): unblock to block
        var button = document.getElementById("blockunblock-btn");
        var btnChildren = button.children;
        btnChildren[0].innerText = "Unblock user";
        btnChildren[1].id = "btn-uu-spinner";
        button.value = "blocked";

        //If user is friend
        //Remove button if it is in DOM
        var btnFf = document.getElementById("ff-btn");
        if (btnFf) {
          var btnFfb = document.getElementById("ffb-btn");
          if (btnFfb) {
            btnFfb.remove();
          }
        }
      } else if (
        body.requestSend === "NotAllowed" ||
        body.requestSend === "operationNotAllowed"
      ) {
        //Show msg
        divMsg.style.backgroundColor = "#ffb0b0";
        pMsg.innerText = body.msg;
        divMsg.style.display = "flex";
      }
      disableEnableBtnsProfile("enable", null);
    });
}

//unblock user
function unblockUser(e) {
  //Get username
  var unblockedUser = document.getElementById("username").value;

  var spinnerBtn = document.getElementById("btn-uu-spinner");
  spinnerBtn.classList.add("lds-dual-ring");

  fetch(`${origin}/users/unblock-user`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: unblockedUser
    })
  })
    .then(response => response.json())
    .then(body => {
      spinnerBtn.classList.remove("lds-dual-ring");

      //cambiar color del boton y mostrar mensaje
      //quitar elemento del DOM, como no dejar un hueco
      // buttonRequestFriendship.style.backgroundColor = "blue";
      // buttonRequestFriendship.value = "Solicitud enviada";

      var divMsg = document.getElementById("message-profile");
      var pMsg = document.getElementById("msg-users");

      if (body.requestSend === "OK") {
        //cambiar color del boton y mensaje

        //buttonRequestFriendship.style.backgroundColor = "blue";
        //buttonRequestFriendship.value = "Solicitud enviada";

        //Show msg
        divMsg.style.backgroundColor = "#85e085";
        pMsg.innerText = body.msg;
        divMsg.style.display = "flex";

        //Change button (button attributes): block to unblock
        var button = document.getElementById("blockunblock-btn");
        var btnChildren = button.children;
        btnChildren[0].innerText = "Block user";
        btnChildren[1].id = "btn-bu-spinner";
        button.value = "unblocked";

        //If user is friend
        //Create button and set it in DOM
        var btnFf = document.getElementById("ff-btn");
        if (btnFf) {
          var btnFfb = document.createElement("button");
          btnFfb.id = "ffb-btn";
          btnFfb.classList.add("friendship-actions-btn");

          var span1 = document.createElement("span");
          span1.classList.add("btn-text");
          span1.innerText = "Finalizar amistad y bloquear";

          var span2 = document.createElement("span");
          span2.id = "btn-ffb-spinner";

          btnFfb.appendChild(span1);
          btnFfb.appendChild(span2);

          var referenceNode = document.getElementById("ff-btn");

          referenceNode.parentNode.insertBefore(
            btnFfb,
            referenceNode.nextSibling
          );

          //add listener
          var buttonFinishFriendshipAndBlock = document.getElementById(
            "ffb-btn"
          );
          if (buttonFinishFriendshipAndBlock) {
            buttonFinishFriendshipAndBlock.addEventListener(
              "click",
              endFriendshipBlock
            );
          }
        }
      } else if (
        body.requestSend === "NotAllowed" ||
        body.requestSend === "operationNotAllowed"
      ) {
        //Show msg
        divMsg.style.backgroundColor = "#ffb0b0";
        pMsg.innerText = body.msg;
        divMsg.style.display = "flex";
      }
      disableEnableBtnsProfile("enable", null);
    });
}

//end friendship
var buttonEndFriendship = document.getElementById("ff-btn");
if (buttonEndFriendship) {
  buttonEndFriendship.addEventListener("click", endFriendship);
}

function endFriendship(e) {
  var spinnerStatus = isSpinnerActive(e);
  if (spinnerStatus) {
    return;
  }
  disableEnableBtnsProfile("disable", e);

  //Get username
  var user = document.getElementById("username").value;

  var spinnerBtn = document.getElementById("btn-ff-spinner");
  spinnerBtn.classList.add("lds-dual-ring");

  fetch(`${origin}/users/end-friendship`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: user
    })
  })
    .then(response => response.json())
    .then(body => {
      spinnerBtn.classList.remove("lds-dual-ring");

      //cambiar color del boton y mostrar mensaje
      //quitar elemento del DOM, como no dejar un hueco
      // buttonRequestFriendship.style.backgroundColor = "blue";
      // buttonRequestFriendship.value = "Solicitud enviada";

      var divMsg = document.getElementById("message-profile");
      var pMsg = document.getElementById("msg-users");

      if (body.requestSend === "OK") {
        //cambiar color del boton y mensaje

        //buttonRequestFriendship.style.backgroundColor = "blue";
        //buttonRequestFriendship.value = "Solicitud enviada";

        //Show msg
        divMsg.style.backgroundColor = "#85e085";
        pMsg.innerText = body.msg;
        divMsg.style.display = "flex";

        //Remove 2 buttons
        var btnFf = document.getElementById("ff-btn");
        if (btnFf) {
          btnFf.remove();
        }
        var btnFfb = document.getElementById("ffb-btn");
        if (btnFfb) {
          btnFfb.remove();
        }

        //Create button and set it in DOM
        var btnRf = document.createElement("button");
        btnRf.id = "rf-btn";
        btnRf.classList.add("friendship-actions-btn");

        var span1 = document.createElement("span");
        span1.classList.add("btn-text");
        span1.innerText = "Solicitar amistad";

        var span2 = document.createElement("span");
        span2.id = "btn-rf-spinner";

        btnRf.appendChild(span1);
        btnRf.appendChild(span2);

        var referenceNode = document.getElementById("blockunblock-btn");
        var parentNode = document.getElementById("btns");
        parentNode.insertBefore(btnRf, referenceNode);

        //Para que al pulsar el btn solicitar amistad funcione y se envie la solicitud
        //ya que cuando se ejecuto el codigo JS en el navegador
        //no existia el btn solicitar amistad por lo que el codigo de dentro del if
        //no se ejecuto
        //code:
        // if (buttonRequestFriendship) {
        //   buttonRequestFriendship.addEventListener("click", requestFriendship);
        // }

        var buttonRequestFriendship = document.getElementById("rf-btn");
        if (buttonRequestFriendship) {
          buttonRequestFriendship.addEventListener("click", requestFriendship);
        }
      } else if (
        body.requestSend === "NotAllowed" ||
        body.requestSend === "operationNotAllowed"
      ) {
        //Show msg
        divMsg.style.backgroundColor = "#ffb0b0";
        pMsg.innerText = body.msg;
        divMsg.style.display = "flex";
      }
      disableEnableBtnsProfile("enable", null);
    });
}

//end friendship and block user
var buttonEndFriendshipBlock = document.getElementById("ffb-btn");
if (buttonEndFriendshipBlock) {
  buttonEndFriendshipBlock.addEventListener("click", endFriendshipBlock);
}

function endFriendshipBlock(e) {
  var spinnerStatus = isSpinnerActive(e);
  if (spinnerStatus) {
    return;
  }
  disableEnableBtnsProfile("disable", e);

  //Get username
  var user = document.getElementById("username").value;

  var spinnerBtn = document.getElementById("btn-ffb-spinner");
  spinnerBtn.classList.add("lds-dual-ring");

  fetch(`${origin}/users/end-friendship-block`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: user
    })
  })
    .then(response => response.json())
    .then(body => {
      spinnerBtn.classList.remove("lds-dual-ring");

      //cambiar color del boton y mostrar mensaje
      //quitar elemento del DOM, como no dejar un hueco
      // buttonRequestFriendship.style.backgroundColor = "blue";
      // buttonRequestFriendship.value = "Solicitud enviada";

      var divMsg = document.getElementById("message-profile");
      var pMsg = document.getElementById("msg-users");

      if (body.requestSend === "OK") {
        //cambiar color del boton y mensaje

        //buttonRequestFriendship.style.backgroundColor = "blue";
        //buttonRequestFriendship.value = "Solicitud enviada";

        //Show msg
        divMsg.style.backgroundColor = "#85e085";
        pMsg.innerText = body.msg;
        divMsg.style.display = "flex";

        //Remove 2 buttons
        var btnFf = document.getElementById("ff-btn");
        if (btnFf) {
          btnFf.remove();
        }
        var btnFfb = document.getElementById("ffb-btn");
        if (btnFfb) {
          btnFfb.remove();
        }

        //Create button and set it in DOM
        var btnRf = document.createElement("button");
        btnRf.id = "rf-btn";
        btnRf.classList.add("friendship-actions-btn");

        var span1 = document.createElement("span");
        span1.classList.add("btn-text");
        span1.innerText = "Solicitar amistad";

        var span2 = document.createElement("span");
        span2.id = "btn-rf-spinner";
        var att = document.createAttribute("class");
        att.value = "";
        span2.setAttributeNode(att);

        btnRf.appendChild(span1);
        btnRf.appendChild(span2);

        var referenceNode = document.getElementById("blockunblock-btn");
        var parentNode = document.getElementById("btns");
        parentNode.insertBefore(btnRf, referenceNode);

        //Para que al pulsar el btn solicitar amistad funcione y se envie la solicitud
        //ya que cuando se ejecuto el codigo JS en el navegador
        //no existia el btn solicitar amistad por lo que el codigo de dentro del if
        //no se ejecuto
        // if (buttonRequestFriendship) {
        //   buttonRequestFriendship.addEventListener("click", requestFriendship);
        // }

        var buttonRequestFriendship = document.getElementById("rf-btn");
        if (buttonRequestFriendship) {
          buttonRequestFriendship.addEventListener("click", requestFriendship);
        }

        //Change button (button attributes): unblock to block
        var button = document.getElementById("blockunblock-btn");
        var btnChildren = button.children;
        btnChildren[0].innerText = "Unblock user";
        btnChildren[1].id = "btn-uu-spinner";
        button.value = "blocked";
      } else if (
        body.requestSend === "NotAllowed" ||
        body.requestSend === "operationNotAllowed"
      ) {
        //Show msg
        divMsg.style.backgroundColor = "#ffb0b0";
        pMsg.innerText = body.msg;
        divMsg.style.display = "flex";
      }
      disableEnableBtnsProfile("enable", null);
    });
}

//friends helpers
//Ignore btn click when spinner is active (is shown)
//when a fetch request is being doing, if btn is pulsed again ignore it
function isSpinnerActive(e) {
  //si tiene el spinner y pulsa el btn no hacer nada
  var targetTagName = e.target.tagName;
  var btnAction;
  if (targetTagName.toLowerCase() === "span") {
    btnAction = e.target.parentElement;
  } else if (targetTagName.toLowerCase() === "button") {
    btnAction = e.target;
  }
  var spinnerSpanClassName = btnAction.getElementsByTagName("span")[1]
    .className;
  if (spinnerSpanClassName === "lds-dual-ring") {
    return true;
  }
  return false;
}

//When a btn is clicked (so a fetch req is made), disable the rest of the btns
function disableEnableBtnsProfile(action, e) {
  var requestFriendshipBtn = document.getElementById("rf-btn");
  var cancelFriendshipRequestBtn = document.getElementById("cfr-btn");
  var blockUnblockBtn = document.getElementById("blockunblock-btn");
  var finalizeFriendshipBtn = document.getElementById("ff-btn");
  var finalizeFriendshipAndBlockBtn = document.getElementById("ffb-btn");

  if (action === "disable") {
    var clickedBtnId = getClickedBtnId(e);

    if (requestFriendshipBtn && clickedBtnId !== "rf-btn") {
      requestFriendshipBtn.disabled = true;
    }
    if (cancelFriendshipRequestBtn && clickedBtnId !== "cfr-btn") {
      cancelFriendshipRequestBtn.disabled = true;
    }
    if (blockUnblockBtn && clickedBtnId !== "blockunblock-btn") {
      blockUnblockBtn.disabled = true;
    }
    if (finalizeFriendshipBtn && clickedBtnId !== "ff-btn") {
      finalizeFriendshipBtn.disabled = true;
    }
    if (finalizeFriendshipAndBlockBtn && clickedBtnId !== "ffb-btn") {
      finalizeFriendshipAndBlockBtn.disabled = true;
    }
  }

  if (action === "enable") {
    if (requestFriendshipBtn) {
      requestFriendshipBtn.disabled = false;
    }
    if (cancelFriendshipRequestBtn) {
      cancelFriendshipRequestBtn.disabled = false;
    }
    if (blockUnblockBtn) {
      blockUnblockBtn.disabled = false;
    }
    if (finalizeFriendshipBtn) {
      finalizeFriendshipBtn.disabled = false;
    }
    if (finalizeFriendshipAndBlockBtn) {
      finalizeFriendshipAndBlockBtn.disabled = false;
    }
  }
}

function getClickedBtnId(e) {
  var targetTagName = e.target.tagName;
  var btnAction;
  if (targetTagName.toLowerCase() === "span") {
    btnAction = e.target.parentElement;
  } else if (targetTagName.toLowerCase() === "button") {
    btnAction = e.target;
  }

  return btnAction.id;
}

//2.sent friendship requests list
//cancel sent frienship request
var buttonCancelFriendshipRequest = document.querySelectorAll(
  ".friendship-actions-btn.csfr-btn"
);
if (buttonCancelFriendshipRequest) {
  for (var i = 0; i < buttonCancelFriendshipRequest.length; i++) {
    buttonCancelFriendshipRequest[i].addEventListener(
      "click",
      cancelFriendshipRequest
    );
  }
}

function cancelFriendshipRequest(e) {
  var spinnerStatus = isSpinnerActive(e);
  if (spinnerStatus) {
    return;
  }

  var divMsg = document.getElementById("message-friendship-user");
  divMsg.style.visibility = "hidden"; //si habia un msg lo oculto

  //solo hay un boton: Cancelar
  var spinnerBtn = e.target.parentElement.getElementsByTagName("span")[1];
  spinnerBtn.classList.add("lds-dual-ring");

  //Get username
  //Asi si pulsas el texto del boton o los bordes del boton funciona
  //dependiendo de en que lugar del boton pulses el target sera button o span
  var target = e.target;
  var cardNumber;
  if (target.id === "csfr-btn") {
    //button: subir 2 ancestor
    cardNumber = e.target.parentElement.parentElement.id;
  } else {
    //span: subir 3 ancestors
    cardNumber = e.target.parentElement.parentElement.parentElement.id;
  }

  var usernameCanceledFriendshipRequest = document
    .getElementById(cardNumber)
    .getElementsByTagName("p")[0].id;

  fetch(`${origin}/users/cancel-sent-friendship-request`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: usernameCanceledFriendshipRequest
    })
  })
    .then(response => response.json())
    .then(body => {
      spinnerBtn.classList.remove("lds-dual-ring");

      var pMsg1 = document.getElementById("msg-friendship-user");
      var pMsg2 = document.getElementById("no-msg");

      if (body.requestSend === "OK") {
        //cambiar color del boton y mensaje
        // buttonRequestFriendship.style.backgroundColor = "blue";
        // buttonRequestFriendship.value = "Solicitud enviada";

        //quitar elemento del DOM, como no dejar un hueco
        document
          .getElementById(usernameCanceledFriendshipRequest)
          .parentElement.parentElement.remove();

        var b = areMoreCards("cancel");
        if (!b) {
          //hay mas cards

          //Show msg 1
          pMsg1.innerText = body.msg;
          pMsg1.classList.remove("msg-hide");
          pMsg1.classList.add("msg-show");

          //hide msg 2
          //if
          pMsg2.classList.remove("msg-show");
          pMsg2.classList.add("msg-hide");

          //change div class: background green
          divMsg.classList.add("msg-success");
        } else {
          //no hay mas cards

          //hide msg 1
          pMsg1.classList.remove("msg-show");
          pMsg1.classList.add("msg-hide");

          //show msg 2
          pMsg2.classList.remove("msg-hide");
          pMsg2.classList.add("msg-show");

          //change div class: background red
          divMsg.classList.remove("msg-success");
          divMsg.classList.add("msg-empty");
        }
      } else if (
        body.requestSend === "NotAllowed" ||
        body.requestSend === "operationNotAllowed"
      ) {
        //Show msg
        divMsg.style.backgroundColor = "#ffb0b0";
        divMsg.classList.add("msg-success");

        pMsg1.innerText = body.msg;
        pMsg1.classList.remove("msg-hide");
        pMsg1.classList.add("msg-show");
      }
      divMsg.style.visibility = "visible"; //msg visible
    });
  // .then(result => {
  //   console.log(result);
  // });
}

//accept received frienship request
var buttonAcceptFriendshipRequest = document.querySelectorAll(
  ".friendship-actions-btn.afr-btn"
);

if (buttonAcceptFriendshipRequest) {
  for (var i = 0; i < buttonAcceptFriendshipRequest.length; i++) {
    buttonAcceptFriendshipRequest[i].addEventListener(
      "click",
      acceptFriendshipRequest
    );
  }
}

function acceptFriendshipRequest(e) {
  var spinnerStatus = isSpinnerActive(e);
  if (spinnerStatus) {
    return;
  }
  disableEnableBtnsFriendshipRequestList("disable", e);

  var divMsg = document.getElementById("message-friendship-user");
  divMsg.style.visibility = "hidden"; //si habia un msg lo oculto

  //hay 2 botones: Aceptar y Rechazar
  var spinnerBtn = e.target.parentElement.getElementsByTagName("span")[1];
  spinnerBtn.classList.add("lds-dual-ring");

  //Get username
  //Asi si pulsas el texto del boton o los bordes del boton funciona
  //dependiendo de en que lugar del boton pulses el target sera button o span
  var target = e.target;
  var cardNumber;
  if (target.id === "afr-btn") {
    //button: subir 3 ancestor
    cardNumber = e.target.parentElement.parentElement.parentElement.id;
  } else {
    //span: subir 4 ancestors
    cardNumber =
      e.target.parentElement.parentElement.parentElement.parentElement.id;
  }

  var usernameAcceptedFriendshipRequest = document
    .getElementById(cardNumber)
    .getElementsByTagName("p")[0].id;

  fetch(`${origin}/users/accept-friendship-request`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: usernameAcceptedFriendshipRequest
    })
  })
    .then(response => response.json())
    .then(body => {
      spinnerBtn.classList.remove("lds-dual-ring");

      var pMsg1 = document.getElementById("msg-friendship-user");
      var pMsg2 = document.getElementById("no-msg");

      if (body.requestSend === "OK") {
        //cambiar color del boton y mensaje
        //quitar elemento del DOM, como no dejar un hueco
        // buttonRequestFriendship.style.backgroundColor = "blue";
        // buttonRequestFriendship.value = "Solicitud enviada";
        document
          .getElementById(usernameAcceptedFriendshipRequest)
          .parentElement.parentElement.remove();

        var b = areMoreCards("accept");
        if (!b) {
          //hay mas cards

          //Show msg 1
          pMsg1.innerText = body.msg;
          pMsg1.classList.remove("msg-hide");
          pMsg1.classList.add("msg-show");

          //hide msg 2
          //if
          pMsg2.classList.remove("msg-show");
          pMsg2.classList.add("msg-hide");

          //change div class: background green
          divMsg.classList.add("msg-success");

          //restar 1 al counter
          decreaseNavbarCounterNumber("friendship-icon");
        } else {
          //no hay mas cards

          //hide msg 1
          pMsg1.classList.remove("msg-show");
          pMsg1.classList.add("msg-hide");

          //show msg 2
          pMsg2.classList.remove("msg-hide");
          pMsg2.classList.add("msg-show");

          //change div class: background red
          divMsg.classList.remove("msg-success");
          divMsg.classList.add("msg-empty");

          //restar 1 al counter
          decreaseNavbarCounterNumber("friendship-icon");
        }
      } else if (
        body.requestSend === "NotAllowed" ||
        body.requestSend === "operationNotAllowed"
      ) {
        //Show msg
        divMsg.style.backgroundColor = "#ffb0b0";
        divMsg.classList.add("msg-success");

        pMsg1.innerText = body.msg;
        pMsg1.classList.remove("msg-hide");
        pMsg1.classList.add("msg-show");
      }
      divMsg.style.visibility = "visible"; //msg visible
      disableEnableBtnsFriendshipRequestList("enable", null);
    });
}

//reject received frienship request
var buttonRejectFriendshipRequest = document.querySelectorAll(
  ".friendship-actions-btn.rfr-btn"
);

if (buttonRejectFriendshipRequest) {
  for (var i = 0; i < buttonRejectFriendshipRequest.length; i++) {
    buttonRejectFriendshipRequest[i].addEventListener(
      "click",
      rejectFriendshipRequest
    );
  }
}

function rejectFriendshipRequest(e) {
  var spinnerStatus = isSpinnerActive(e);
  if (spinnerStatus) {
    return;
  }
  disableEnableBtnsFriendshipRequestList("disable", e);

  var divMsg = document.getElementById("message-friendship-user");
  divMsg.style.visibility = "hidden"; //si habia un msg lo oculto

  //hay 2 botones: Aceptar y Rechazar
  //Get username
  //Asi si pulsas el texto del boton o los bordes del boton funciona
  //dependiendo de en que lugar del boton pulses el target sera button o span
  var target = e.target;
  var cardNumber;
  var spinnerBtn;
  if (target.id === "rfr-btn") {
    //button: subir 3 ancestor
    cardNumber = e.target.parentElement.parentElement.parentElement.id;
    spinnerBtn = e.target.parentElement.getElementsByTagName("span")[3];
  } else {
    //span: subir 4 ancestors
    cardNumber =
      e.target.parentElement.parentElement.parentElement.parentElement.id;
    spinnerBtn = e.target.parentElement.parentElement.getElementsByTagName(
      "span"
    )[3];
  }
  spinnerBtn.classList.add("lds-dual-ring");

  var usernameRejectedFriendshipRequest = document
    .getElementById(cardNumber)
    .getElementsByTagName("p")[0].id;

  fetch(`${origin}/users/reject-friendship-request`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: usernameRejectedFriendshipRequest
    })
  })
    .then(response => response.json())
    .then(body => {
      spinnerBtn.classList.remove("lds-dual-ring");

      var pMsg1 = document.getElementById("msg-friendship-user");
      var pMsg2 = document.getElementById("no-msg");

      if (body.requestSend === "OK") {
        //cambiar color del boton y mensaje
        //quitar elemento del DOM, como no dejar un hueco
        // buttonRequestFriendship.style.backgroundColor = "blue";
        // buttonRequestFriendship.value = "Solicitud enviada";
        document
          .getElementById(usernameRejectedFriendshipRequest)
          .parentElement.parentElement.remove();

        var b = areMoreCards("reject");
        if (!b) {
          //hay mas cards

          //Show msg 1
          pMsg1.innerText = body.msg;
          pMsg1.classList.remove("msg-hide");
          pMsg1.classList.add("msg-show");

          //hide msg 2
          //if
          pMsg2.classList.remove("msg-show");
          pMsg2.classList.add("msg-hide");

          //change div class: background green
          divMsg.classList.add("msg-success");

          //restar 1 al counter
          decreaseNavbarCounterNumber("friendship-icon");
        } else {
          //no hay mas cards

          //hide msg 1
          pMsg1.classList.remove("msg-show");
          pMsg1.classList.add("msg-hide");

          //show msg 2
          pMsg2.classList.remove("msg-hide");
          pMsg2.classList.add("msg-show");

          //change div class: background red
          divMsg.classList.remove("msg-success");
          divMsg.classList.add("msg-empty");

          //restar 1 al counter
          decreaseNavbarCounterNumber("friendship-icon");
        }
      } else if (
        body.requestSend === "NotAllowed" ||
        body.requestSend === "operationNotAllowed"
      ) {
        //Show msg
        divMsg.style.backgroundColor = "#ffb0b0";
        divMsg.classList.add("msg-success");

        pMsg1.innerText = body.msg;
        pMsg1.classList.remove("msg-hide");
        pMsg1.classList.add("msg-show");
      }
      divMsg.style.visibility = "visible"; //msg visible
      disableEnableBtnsFriendshipRequestList("enable", null);
    });
}

//friends helpers
function disableEnableBtnsFriendshipRequestList(action, e) {
  var acceptFriendshipRequestBtn = document.getElementById("afr-btn");
  var rejectFriendshipRequestBtn = document.getElementById("rfr-btn");

  if (action === "disable") {
    var clickedBtnId = getClickedBtnId(e);

    if (acceptFriendshipRequestBtn && clickedBtnId !== "afr-btn") {
      acceptFriendshipRequestBtn.disabled = true;
    }
    if (rejectFriendshipRequestBtn && clickedBtnId !== "rfr-btn") {
      rejectFriendshipRequestBtn.disabled = true;
    }
  }

  if (action === "enable") {
    if (acceptFriendshipRequestBtn) {
      acceptFriendshipRequestBtn.disabled = false;
    }
    if (rejectFriendshipRequestBtn) {
      rejectFriendshipRequestBtn.disabled = false;
    }
  }
}

function decreaseNavbarCounterNumber(counterIconId) {
  var counterNum = document.getElementById(counterIconId);
  var vTotal = parseInt(counterNum.innerText);
  var newTotal;
  if (!isNaN(vTotal)) {
    newTotal = vTotal - 1;
    counterNum.innerText = newTotal;
  }

  if (newTotal === 0) {
    counterNum.style.display = "none";
  }
}

//cuando quitas del DOM la ultima card, poner mensaje no hay mas solicitudes de amistad
function areMoreCards(opType) {
  if (opType === "cancel") {
    var cards = document.querySelectorAll(".friendship-sent-card");
    if (cards.length === 0) {
      return true;
    }
  } else if (opType === "accept" || opType === "reject") {
    var cards = document.querySelectorAll(".friendship-received-card");
    if (cards.length === 0) {
      return true;
    }
  } else if (opType === "unblock") {
    var cards = document.querySelectorAll(".user-card");
    if (cards.length === 0) {
      return true;
    }
  }
  return false;
}

//3.unblock user from /blocked-users
var btnUnblockUserBlockedUsers = document.querySelectorAll("#unblock-bu-btn");
if (btnUnblockUserBlockedUsers) {
  for (var i = 0; i < btnUnblockUserBlockedUsers.length; i++) {
    btnUnblockUserBlockedUsers[i].addEventListener(
      "click",
      unblockUserBlockedUsers
    );
  }
}

function unblockUserBlockedUsers(e) {
  var spinnerStatus = isSpinnerActive(e);
  if (spinnerStatus) {
    return;
  }

  var divMsg = document.getElementById("message-blocked-users");
  divMsg.style.visibility = "hidden"; //si habia un msg lo oculto
  divMsg.classList.remove("msg-success");
  divMsg.classList.remove("msg-error");

  var spinnerBtn = e.target.parentElement.getElementsByTagName("span")[1];
  spinnerBtn.classList.add("lds-dual-ring");

  //Get username
  //Asi si pulsas el texto del boton o los bordes del boton funciona
  var target = e.target;
  var cardNumber;
  if (target.id === "unblock-bu-btn") {
    //button
    cardNumber = e.target.parentElement.id;
  } else {
    //span
    cardNumber = e.target.parentElement.parentElement.id;
  }

  var unblockedUser = document
    .getElementById(cardNumber)
    .getElementsByTagName("p")[0].id;

  fetch(`${origin}/users/unblock-user`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: unblockedUser
    })
  })
    .then(response => response.json())
    .then(body => {
      spinnerBtn.classList.remove("lds-dual-ring");

      var pMsg1 = document.getElementById("msg-blocked-users");
      var pMsg2 = document.getElementById("no-msg");

      //cambiar color del boton y mostrar mensaje
      //quitar elemento del DOM, como no dejar un hueco
      // buttonRequestFriendship.style.backgroundColor = "blue";
      // buttonRequestFriendship.value = "Solicitud enviada";

      if (body.requestSend === "OK") {
        //cambiar color del boton y mensaje

        //buttonRequestFriendship.style.backgroundColor = "blue";
        //buttonRequestFriendship.value = "Solicitud enviada";

        //Remove card from DOM
        var card = document.getElementById(cardNumber);
        card.remove();

        //if there are not more blocked users show msg
        var b = areMoreCards("unblock");

        if (!b) {
          //hay mas cards

          //Show msg 1
          pMsg1.innerText = body.msg;
          pMsg1.classList.remove("msg-hide");
          pMsg1.classList.add("msg-show");

          //hide msg 2
          //if
          pMsg2.classList.remove("msg-show");
          pMsg2.classList.add("msg-hide");

          //change div class: background green
          divMsg.classList.add("msg-success");
        } else {
          //no hay mas cards

          //hide msg 1
          pMsg1.classList.remove("msg-show");
          pMsg1.classList.add("msg-hide");

          //show msg 2
          pMsg2.classList.remove("msg-hide");
          pMsg2.classList.add("msg-show");

          //change div class: background red
          divMsg.classList.add("msg-empty");
        }
      } else if (
        body.requestSend === "NotAllowed" ||
        body.requestSend === "operationNotAllowed"
      ) {
        //Show msg
        //divMsg.style.backgroundColor = "#ffb0b0";
        divMsg.classList.add("msg-error");

        pMsg1.innerText = body.msg;
        pMsg1.classList.remove("msg-hide");
        pMsg1.classList.add("msg-show");
      }
      divMsg.style.visibility = "visible"; //msg visible
    });
}

//***************chat
//*****************

//capture event svg icon in card
function startChatWithSelectedCardUser(e) {
  //get username
  //si es path subir 5 ancestors si es svg subir 2
  var divUsernameCard;
  if (e.target.tagName.toLowerCase() === "path") {
    divUsernameCard =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement;
  } else {
    //svg
    divUsernameCard = e.target.parentElement.parentElement;
  }
  var usernameNormalized = divUsernameCard.getElementsByTagName("p")[0].dataset
    .usernamenormalized;

  //go to page
  window.location.href = `${origin}/users/chat/${usernameNormalized}`;
}

//capture event svg icon in card
function startVideoCallWithSelectedCardUser(e) {
  //get username
  //si es path subir 5 ancestors si es svg subir 2
  var divUsernameCard;
  if (e.target.tagName.toLowerCase() === "path") {
    divUsernameCard =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement;
  } else {
    //svg
    divUsernameCard = e.target.parentElement.parentElement;
  }
  var usernameNormalized = divUsernameCard.getElementsByTagName("p")[0].dataset
    .usernamenormalized;

  //go to page
  window.location.href = `${origin}/users/call/${usernameNormalized}`;
}

//input de buscar usuario
function showIconSearchInInput(opt) {
  var divSearchLoading = document.getElementById("search-loading");
  var divSearchNotLoading = document.getElementById("search-not-loading");
  if (opt === "loading") {
    divSearchNotLoading.style.display = "none";
    divSearchLoading.style.display = "inline";
  } else if (opt === "not-loading") {
    divSearchLoading.style.display = "none";
    divSearchNotLoading.style.display = "inline";
  }
}
