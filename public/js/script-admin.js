var origin = window.location.origin;
var pathName = window.location.pathname;

//hide/show password
function hideShowPassword() {
  var inputPassword = document.getElementById("password-field");
  var pathEyeIcon = document.getElementById("eye-icon");
  passwordToggle(inputPassword, pathEyeIcon);
}

function passwordToggle(inputPassword, pathEyeIcon) {
  //You only need to use setAttribute for non-standard attributes.
  if (inputPassword.type === "password") {
    inputPassword.type = "text";
    pathEyeIcon.setAttribute(
      "d",
      "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
    );
  } else {
    inputPassword.type = "password";
    pathEyeIcon.setAttribute(
      "d",
      "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
    );
  }
}

//ban/unban/delete user
//unban
function unbanUser(e) {
  //hide top msg on ban icon click
  var topMsg = document.getElementById("top-msg");
  topMsg.classList.remove("msg-visibility-show");
  topMsg.classList.add("msg-visibility-hide");
  var topMsgText = document.getElementById("top-msg-text");

  var elem;
  var iconContainer;
  if (e.target.tagName.toLowerCase() === "path") {
    elem =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement;
    iconContainer = e.target.parentElement.parentElement.parentElement;
  } else {
    //svg
    elem = e.target.parentElement.parentElement.parentElement;
    iconContainer = e.target.parentElement;
  }

  //show spinner
  var spanIcon = iconContainer.getElementsByTagName("span")[0];
  spanIcon.classList.remove("hide-spinner");
  spanIcon.classList.add("show-spinner");

  var usernameToUnban = elem.querySelector("p").dataset.usernameNormalized;

  fetch(`${origin}/admin/user-account-action/action/unban`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: usernameToUnban
    })
  })
    .then(response => response.json())
    .then(msg => {
      console.log(msg);
      if (msg.result === "ok") {
        //hide spinner
        spanIcon.classList.remove("show-spinner");
        spanIcon.classList.add("hide-spinner");
        //eliminar row
        var elemToRemove = elem.parentElement.parentElement;
        var elemToRemoveParent = elemToRemove.parentElement;
        elemToRemoveParent.removeChild(elemToRemove);
        //mostrar msg
        var b = areMoreBannedUsers();
        if (b) {
          //mostrar msg username desbaneado
          topMsgText.textContent = "El usuario se desbaneo";
        } else {
          //borrar tabla
          var table = document.getElementById("table-list");
          table.parentElement.removeChild(table);
          //show msg no more banned users
          topMsg.classList.remove("msg-success");
          topMsg.classList.add("msg-empty");
          topMsgText.textContent = "No hay ningun usuario baneado";
        }
        //show top msg
        topMsg.classList.remove("msg-visibility-hide");
        topMsg.classList.add("msg-visibility-show");
      }
    })
    .catch(err => {
      console.log(err);
    });
}

function areMoreBannedUsers() {
  var users = document.querySelectorAll(".username-container");
  if (users.length === 0) {
    return false;
  } else {
    return true;
  }
}

//delete
function deleteUser(e) {
  //hide top msg on ban icon click
  var topMsg = document.getElementById("top-msg");
  topMsg.classList.remove("msg-visibility-show");
  topMsg.classList.add("msg-visibility-hide");
  var topMsgText = document.getElementById("top-msg-text");

  var elem;
  var iconContainer;
  if (e.target.tagName.toLowerCase() === "path") {
    elem =
      e.target.parentElement.parentElement.parentElement.parentElement
        .parentElement;
    iconContainer = e.target.parentElement.parentElement.parentElement;
  } else {
    //svg
    elem = e.target.parentElement.parentElement.parentElement;
    iconContainer = e.target.parentElement;
  }

  //show spinner
  var spanIcon = iconContainer.getElementsByTagName("span")[0];
  spanIcon.classList.remove("hide-spinner");
  spanIcon.classList.add("show-spinner");

  var usernameToDelete = elem.querySelector("p").dataset.usernameNormalized;
  fetch(`${origin}/admin/user-account-action/action/delete`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usernameNormalized: usernameToDelete
    })
  })
    .then(response => response.json())
    .then(msg => {
      console.log(msg);
      if (msg.result === "ok") {
        //hide spinner
        spanIcon.classList.remove("show-spinner");
        spanIcon.classList.add("hide-spinner");
        //eliminar row
        var elemToRemove = elem.parentElement.parentElement;
        var elemToRemoveParent = elemToRemove.parentElement;
        elemToRemoveParent.removeChild(elemToRemove);
        //mostrar msg
        var b = areMoreBannedUsers();
        if (b) {
          //mostrar msg username borrado
          topMsgText.textContent = "El usuario se borro";
        } else {
          //borrar tabla
          var table = document.getElementById("table-list");
          table.parentElement.removeChild(table);
          //show msg no more banned users
          topMsg.classList.remove("msg-success");
          topMsg.classList.add("msg-empty");
          topMsgText.textContent = "No hay ningun usuario baneado";
        }
        //show top msg
        topMsg.classList.remove("msg-visibility-hide");
        topMsg.classList.add("msg-visibility-show");
      }
    })
    .catch(err => {
      console.log(err);
    });
}

//stats
var statsSearchButton = document.getElementById("stats-search-button");
if (statsSearchButton) {
  statsSearchButton.addEventListener("click", getStats);
}
function getStats() {
  createNewCanvasElement();
  var statsSelectedAction = document.getElementById("type").value;
  var statsSelectedTime = document.getElementById("time").value;

  var msgNoOptionsSelected = document.getElementById("msg-no-options-selected");
  msgNoOptionsSelected.style.display = "none";

  var errMsg = document.getElementById("msg-err-options");
  errMsg.style.display = "none";

  var spinner = document.getElementById("spinner-loading-stats");
  spinner.style.display = "block";

  fetch(`${origin}/admin/stats/${statsSelectedAction}/${statsSelectedTime}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(msg => {
      spinner.style.display = "none";
      if (msg.msg === "Invalid options") {
        errMsg.style.display = "flex";
      } else {
        showChart(msg.labels, msg.data, msg.title, msg.xLabelString);
      }
    })
    .catch(err => {
      console.log(err);
    });
}

function createNewCanvasElement() {
  var canvasContainer = document.getElementById("chart-container");

  //remove canvas from DOM
  var canvasElem = document.getElementById("my-chart");

  if (canvasElem) {
    canvasContainer.removeChild(canvasElem);
  }

  //add canvas to DOM
  var canvas = document.createElement("canvas");
  canvas.id = "my-chart";
  canvasContainer.appendChild(canvas);
}

function showChart(labels, data, title, xLabelString) {
  var myChart = document.getElementById("my-chart").getContext("2d");

  var options = {
    title: {
      display: true,
      text: title,
      fontSize: 22
    },
    legend: {
      display: false
    },
    scales: {
      yAxes: [
        {
          display: true,
          ticks: {
            beginAtZero: true, // minimum value will be 0.
            precision: 0 //numbers must be integers
          }
          // scaleLabel: {
          //   display: true,
          //   labelString: "total"
          // }
        }
      ],
      xAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: xLabelString,
            fontSize: 14
          }
        }
      ]
    },
    maintainAspectRatio: false
  };

  var data = {
    labels: labels,
    datasets: [
      {
        label: "Total",
        data: data,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1
      }
    ]
  };

  var myBarChart = new Chart(myChart, {
    type: "bar",
    data: data,
    options: options
  });
}

//click on window: close dropdown and lateral menu
window.onclick = function(event) {
  //search users modal
  // When the user clicks anywhere outside of the modal, close it
  //   if (event.target == friendsModal) {
  //     friendsModal.style.display = "none";
  //   }

  //top navbar dropdown
  // When the user clicks anywhere outside of the dropdown, close it
  var btnDropdown = document.getElementById("dropbtn-myaccount");
  if (btnDropdown && !btnDropdown.contains(event.target)) {
    var dropdownContent = document.getElementById("dropdown-content");
    dropdownContent.style.display = "none";
    previousElement = undefined; //reset variable (dropdown)
  }

  var sideNav = document.getElementById("side-navigation");
  var hamburgerIconSVG = document.getElementById("hamburger-icon");
  var istopNavbarTab = isTopNavbarTab(event);

  //lateral menu close
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

        fetch(`${origin}/admin/search-user`, options)
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
      var x = document.getElementById("users-list");
      if (x) x = x.getElementsByClassName("userslist-user-card"); //obtiene todos los elementos div con clase userslist-user-card hijos del elemento x

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
    valWhitespacesTrimmed = val.replace(/[\s]{1,}/gm, " ");


    //matchedValues
    var a, b, i;
    // closeAllLists();
    if (!val) {
      return false;
    }

    //create a DIV element that will contain the items (usernames)
    //crea el div (dropdown del modal) que contiene la lista de users
    a = document.createElement("div");
    a.setAttribute("id", "users-list");
    a.setAttribute("class", "users-list");

    // var divAutocomplete = document.getElementById("autocomplete");
    // divAutocomplete.parentNode.insertBefore(a, divAutocomplete.nextSibling);
    var searchBoxDiv = document.getElementById(
      "user-account-action-search-user-container"
    );
    searchBoxDiv.parentNode.insertBefore(a, searchBoxDiv.nextSibling);
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
      b.setAttribute("class", "userslist-user-card");

      if (users[i].status === "banned") {
        b.setAttribute("class", "userslist-user-card user-banned");
      } else {
        b.setAttribute("class", "userslist-user-card");
      }

      //make the matching letters bold:
      u = document.createElement("div");
      u.setAttribute("class", "search-user-username");
 
      u.innerHTML =
        "<strong class='whitespace-autosuggest'>" +
        users[i].username.substr(0, valWhitespacesTrimmed.length) +
        "</strong>";
      u.innerHTML +=
        "<span class='whitespace-autosuggest'>" +
        users[i].username.substr(valWhitespacesTrimmed.length);
      ("</span>");

      //insert a input field that will hold the current array item's value to know the value when click
      u.innerHTML +=
        "<input type='hidden' id='" +
        users[i].usernameNormalized +
        "' value='" +
        users[i].usernameNormalized +
        "'>";
      // u.innerHTML += "<input type='hidden' value='" + users[i].username + "'>";
      b.appendChild(u);

      // //Cuando clickes en un elemento del dropdown/autocomplete del modal
      // b.addEventListener("click", function(e) {
      //   var value = this.getElementsByTagName("input")[0].value;
      //   //let location = window.location;
      //   //console.log("a" + location.origin);
      //   //http redirect
      //   //http://localhost:3000/users/${value}

      //   //redirect
      //   if (pathName === "/users/searchfriend") {
      //     window.location.href = `${origin}/users/u/${value}`;
      //   }
      //   //start new chat
      //   if (pathName === "/users/chat") {
      //     var cardsFriend = document.getElementsByClassName("userslist-user-card");

      //     for (var i = 0; i < cardsFriend.length; i++) {
      //       if (cardsFriend[i].contains(e.target)) {
      //         startNewChat(cardsFriend[i]);
      //       }
      //     }
      //   }

      //   closeAllLists();
      // });

      var btnDiv = document.createElement("div");
      btnDiv.setAttribute("class", "action-btns");

      if (users[i].status === "banned") {
        //unban
        var btnUnBan = document.createElement("button");
        btnUnBan.innerHTML = '<span class="btn-action-text">UnBan</span>';
        // var divContainerIcon = document.createElement("div");
        // divContainerIcon.setAttribute("class", "action-btn-icon-container");
        // btnUnBan.appendChild(divContainerIcon);

        btnUnBan.innerHTML +=
          '<span id="" class="lds-dual-ring-btn-banunbandelete hide-spinner"></span>';
        btnUnBan.innerHTML +=
          '<svg xmlns="http://www.w3.org/2000/svg" class="unban-icon-svg" version="1.0" width="40px" height="40px" viewBox="0 0 216.000000 233.000000" preserveAspectRatio="xMidYMid meet"><g transform="translate(-66,300) scale(0.1500000,-0.1500000)" fill="#000000"><path d="M1249 1877 c-32 -13 -68 -33 -82 -44 -108 -85 -152 -231 -107 -362 l21 -64 -305 -307 c-276 -276 -306 -309 -306 -338 0 -63 63 -99 124 -70 24 10 30 7 80 -40 60 -57 80 -62 120 -31 42 33 35 70 -26 135 l-51 54 23 25 c30 32 37 31 76 -6 37 -36 75 -41 104 -14 31 28 25 69 -14 113 l-35 38 163 163 163 162 64 -21 c92 -32 176 -25 261 22 231 126 221 464 -17 577 -75 36 -182 39 -256 8z m237 -45 c62 -32 97 -65 129 -124 26 -46 30 -63 30 -133 0 -70 -4 -87 -30 -133 -70 -127 -205 -180 -342 -133 -34 12 -70 21 -80 21 -25 0 -363 -339 -363 -365 0 -12 16 -36 35 -55 66 -64 36 -100 -32 -39 -24 22 -51 39 -62 39 -20 0 -101 -82 -101 -103 0 -7 25 -37 55 -67 58 -58 64 -70 40 -90 -13 -11 -25 -4 -74 44 -61 57 -89 68 -111 41 -23 -28 -70 -12 -70 24 0 9 137 153 305 321 196 197 305 313 305 325 -1 11 -9 45 -20 75 -23 66 -25 111 -6 174 27 90 92 158 183 192 53 20 157 13 209 -14z"> </path><path d="M1313 1684 c-43 -22 -66 -60 -66 -109 0 -135 184 -167 232 -40 38 99 -71 197 -166 149z m115 -60 c27 -31 28 -63 2 -97 -59 -75 -172 -7 -134 81 23 57 88 64 132 16z"></path></g></svg>';
        btnUnBan.setAttribute("class", "action-btn");
        btnUnBan.addEventListener("click", function(e) {
          makeAction(getUsernameNormalized(e, "unban"), "unban");
        });
        btnDiv.appendChild(btnUnBan);
      } else {
        //ban
        var btnBan = document.createElement("button");
        btnBan.innerHTML = '<span class="btn-action-text">Ban</span>';
        btnBan.innerHTML +=
          '<span id="" class="lds-dual-ring-btn-banunbandelete hide-spinner"></span>';
        btnBan.innerHTML +=
          '<svg xmlns="http://www.w3.org/2000/svg" version="1.0" viewBox="0 0 260 260" preserveAspectRatio="xMidYMid meet" class="ban-icon-svg"><g transform="translate(-32,260) scale(0.1,-0.1)" fill="#000000" stroke="none"><path d="M1510 2421 c-184 -59 -334 -204 -392 -380 -18 -56 -22 -96 -26 -273 l-4 -206 -101 -4 c-117 -4 -152 -20 -187 -88 -19 -38 -20 -61 -20 -640 0 -498 2 -606 14 -628 21 -41 68 -81 107 -92 21 -6 318 -10 769 -10 693 0 737 1 775 19 46 21 79 54 94 94 7 19 11 225 11 621 l0 593 -23 44 c-36 68 -81 89 -193 89 l-91 0 -6 203 c-5 223 -13 262 -74 379 -66 126 -219 246 -358 283 -80 20 -225 19 -295 -4z m270 -97 c124 -28 241 -117 296 -226 45 -88 54 -148 54 -350 l0 -188 -465 0 -465 0 0 200 c0 177 3 208 21 263 78 235 308 358 559 301z m634 -874 l26 -10 0 -603 c0 -456 -3 -606 -12 -615 -15 -15 -1504 -17 -1528 -2 -13 8 -15 88 -18 604 -2 586 -2 596 18 616 20 20 31 20 754 20 453 0 745 -4 760 -10z" /><path d="M1592 1073 c-45 -22 -74 -67 -80 -124 -4 -39 0 -56 22 -93 23 -39 26 -56 26 -130 0 -76 3 -87 26 -115 32 -38 80 -49 123 -27 46 24 61 62 61 156 0 67 4 86 21 110 13 17 23 49 26 77 10 119 -115 200 -225 146z" /> </g></svg>';
        btnBan.setAttribute("class", "action-btn");
        btnBan.addEventListener("click", function(e) {
          makeAction(getUsernameNormalized(e, "ban"), "ban");
        });
        btnDiv.appendChild(btnBan);
      }

      //delete
      var btnDelete = document.createElement("button");
      btnDelete.innerHTML = '<span class="btn-action-text">Delete</span>';
      btnDelete.innerHTML +=
        '<span id="" class="lds-dual-ring-btn-banunbandelete hide-spinner"></span>';
      btnDelete.innerHTML +=
        '<svg xmlns="http://www.w3.org/2000/svg" class="delete-icon-svg" version="1.0" viewBox="0 0 225 225" preserveAspectRatio="xMidYMid meet"><g transform="translate(0.000000,225.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none"><path d="M802 2164 c-21 -14 -22 -22 -22 -140 l0 -124 -260 0 -261 0 -24 -25 c-30 -30 -31 -54 -4 -89 l20 -26 874 0 874 0 20 26 c27 35 26 59 -4 89 l-24 25 -261 0 -260 0 0 124 c0 118 -1 126 -22 140 -19 14 -67 16 -323 16 -256 0 -304 -2 -323 -16z m538 -194 l0 -70 -215 0 -215 0 0 70 0 70 215 0 215 0 0 -70z" /><path d="M393 1680 c-12 -5 -26 -18 -32 -29 -15 -26 -15 -1371 -1 -1422 16 -56 51 -101 100 -129 l45 -25 620 0 620 0 45 25 c49 28 84 73 100 129 6 22 10 293 10 722 0 640 -1 688 -17 707 -27 32 -64 37 -96 12 l-27 -21 0 -695 0 -695 -25 -24 -24 -25 -586 0 -586 0 -24 25 -25 24 0 695 0 695 -26 20 c-29 23 -38 24 -71 11z" /><path d="M1110 1542 c-8 -2 -23 -11 -32 -20 -17 -14 -18 -52 -18 -538 0 -561 -2 -543 50 -559 20 -6 59 9 72 29 4 6 8 245 8 532 0 484 -1 522 -17 536 -23 19 -44 26 -63 20z" /><path  d="M733 1392 c-29 -18 -33 -70 -33 -412 0 -238 4 -357 11 -374 7 -13 25 -30 41 -37 25 -10 33 -9 56 8 l27 20 3 383 c2 346 1 385 -14 402 -17 18 -69 24 -91 10z" /><path  d="M1426 1382 c-15 -17 -16 -56 -14 -402 l3 -383 27 -20 c23 -17 31 -18 56 -8 16 7 34 24 41 37 7 17 11 136 11 374 0 342 -4 394 -33 412 -22 14 -74 8 -91 -10z" /> </g> </svg>';

      btnDelete.setAttribute("class", "action-btn");
      btnDelete.addEventListener("click", function(e) {
        makeAction(getUsernameNormalized(e, "delete"), "delete");
      });
      btnDiv.appendChild(btnDelete);

      b.appendChild(btnDiv);

      //closeAllLists();

      //a = document.getElementById("users-list");
      //a.parentNode.insertBefore(b, a.nextSibling);
      a.appendChild(b);
      // }
    }

    //Si el event es click le pongo el value al elemento de la lista que lo tenia antes de quitar el focus al input
    if (event.type === "click") {
      if (currentFocus !== -1) {
        var x = document.getElementById("users-list");
        if (x) x = x.getElementsByClassName("userslist-user-card");
        addActive(x);
      }
    }

    //mensaje no users found
    if (users.length == 0) {
      if (val !== "" || val.length !== 0 || val !== null) {
        b = document.createElement("DIV");
        a.setAttribute("id", "msg-no-users-found"); //sobrescribo el valor del id, asi no se puede bajar con las flechas en el mensaje
        b.setAttribute("id", "msg-no-users-found-child");
        b.innerHTML = "<i>No users found matching that criteria</i>";
        a.appendChild(b);
      }
    }
  }

  function getUsernameNormalized(e, action) {
    var elem1;
    var usernameNormalized;
    var spanSpinner;
    if (e.target.tagName.toLowerCase() === "path") {
      elem1 =
        e.target.parentElement.parentElement.parentElement.parentElement
          .parentElement;
    } else if (
      e.target.tagName.toLowerCase() === "svg" ||
      e.target.tagName.toLowerCase() === "span"
    ) {
      elem1 = e.target.parentElement.parentElement.parentElement;
    } else {
      //btn
      elem1 = e.target.parentElement.parentElement;
    }
    usernameNormalized = elem1.getElementsByTagName("input")[0].value;

    if (action === "ban" || action === "unban") {
      spanSpinner = elem1.getElementsByClassName(
        "lds-dual-ring-btn-banunbandelete"
      )[0];
    } else if (action === "delete") {
      spanSpinner = elem1.getElementsByClassName(
        "lds-dual-ring-btn-banunbandelete"
      )[1];
    }

    return [usernameNormalized, spanSpinner];
  }

  function makeAction(usernameNormalized, action) {
    var btnSpinner = usernameNormalized[1];
    btnSpinner.classList.remove("hide-spinner");
    btnSpinner.classList.add("show-spinner");

    fetch(`${origin}/admin/user-account-action/action/${action}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usernameNormalized: usernameNormalized[0]
      })
    })
      .then(response => response.json())
      .then(msg => {
        btnSpinner.classList.remove("show-spinner");
        btnSpinner.classList.add("hide-spinner");
        if (msg.result === "ok") {
          //mostrar msg
          var row = document.getElementById(usernameNormalized[0]).parentElement
            .parentElement;
          var unbanBanBtn = row.getElementsByTagName("button")[0];
          var btnsContainer = unbanBanBtn.parentElement;

          var topMsg = document.getElementById("top-msg");
          topMsg.style.visibility = "hidden";
          var topMsgText = document.getElementById("top-msg-text");

          if (action === "ban") {
            //change styles
            row.classList.add("user-banned");
            btnsContainer.removeChild(unbanBanBtn);

            var btnUnBan = document.createElement("button");
            btnUnBan.innerHTML = '<span class="btn-action-text">UnBan</span>';
            btnUnBan.innerHTML +=
              '<span id="" class="lds-dual-ring-btn-banunbandelete hide-spinner"></span>';
            btnUnBan.innerHTML +=
              '<svg xmlns="http://www.w3.org/2000/svg" class="unban-icon-svg" version="1.0" width="40px" height="40px" viewBox="0 0 216.000000 233.000000" preserveAspectRatio="xMidYMid meet"><g transform="translate(-66,300) scale(0.1500000,-0.1500000)" fill="#000000"><path d="M1249 1877 c-32 -13 -68 -33 -82 -44 -108 -85 -152 -231 -107 -362 l21 -64 -305 -307 c-276 -276 -306 -309 -306 -338 0 -63 63 -99 124 -70 24 10 30 7 80 -40 60 -57 80 -62 120 -31 42 33 35 70 -26 135 l-51 54 23 25 c30 32 37 31 76 -6 37 -36 75 -41 104 -14 31 28 25 69 -14 113 l-35 38 163 163 163 162 64 -21 c92 -32 176 -25 261 22 231 126 221 464 -17 577 -75 36 -182 39 -256 8z m237 -45 c62 -32 97 -65 129 -124 26 -46 30 -63 30 -133 0 -70 -4 -87 -30 -133 -70 -127 -205 -180 -342 -133 -34 12 -70 21 -80 21 -25 0 -363 -339 -363 -365 0 -12 16 -36 35 -55 66 -64 36 -100 -32 -39 -24 22 -51 39 -62 39 -20 0 -101 -82 -101 -103 0 -7 25 -37 55 -67 58 -58 64 -70 40 -90 -13 -11 -25 -4 -74 44 -61 57 -89 68 -111 41 -23 -28 -70 -12 -70 24 0 9 137 153 305 321 196 197 305 313 305 325 -1 11 -9 45 -20 75 -23 66 -25 111 -6 174 27 90 92 158 183 192 53 20 157 13 209 -14z"> </path><path d="M1313 1684 c-43 -22 -66 -60 -66 -109 0 -135 184 -167 232 -40 38 99 -71 197 -166 149z m115 -60 c27 -31 28 -63 2 -97 -59 -75 -172 -7 -134 81 23 57 88 64 132 16z"></path></g></svg>';
            btnUnBan.setAttribute("class", "action-btn");
            btnUnBan.addEventListener("click", function(e) {
              makeAction(getUsernameNormalized(e, "unban"), "unban");
            });
            btnsContainer.insertBefore(btnUnBan, btnsContainer.firstChild);
            //show msg
            topMsg.style.visibility = "visible";
            topMsgText.textContent = "El usuario se baneo por 7 dias con exito";
          } else if (action === "unban") {
            //change styles
            row.classList.remove("user-banned");
            btnsContainer.removeChild(unbanBanBtn);

            var btnBan = document.createElement("button");
            btnBan.innerHTML = '<span class="btn-action-text">Ban</span>';
            btnBan.innerHTML +=
              '<span id="" class="lds-dual-ring-btn-banunbandelete hide-spinner"></span>';
            btnBan.innerHTML +=
              '<svg xmlns="http://www.w3.org/2000/svg" version="1.0" viewBox="0 0 260 260" preserveAspectRatio="xMidYMid meet" class="ban-icon-svg"><g transform="translate(-32,260) scale(0.1,-0.1)" fill="#000000" stroke="none"><path d="M1510 2421 c-184 -59 -334 -204 -392 -380 -18 -56 -22 -96 -26 -273 l-4 -206 -101 -4 c-117 -4 -152 -20 -187 -88 -19 -38 -20 -61 -20 -640 0 -498 2 -606 14 -628 21 -41 68 -81 107 -92 21 -6 318 -10 769 -10 693 0 737 1 775 19 46 21 79 54 94 94 7 19 11 225 11 621 l0 593 -23 44 c-36 68 -81 89 -193 89 l-91 0 -6 203 c-5 223 -13 262 -74 379 -66 126 -219 246 -358 283 -80 20 -225 19 -295 -4z m270 -97 c124 -28 241 -117 296 -226 45 -88 54 -148 54 -350 l0 -188 -465 0 -465 0 0 200 c0 177 3 208 21 263 78 235 308 358 559 301z m634 -874 l26 -10 0 -603 c0 -456 -3 -606 -12 -615 -15 -15 -1504 -17 -1528 -2 -13 8 -15 88 -18 604 -2 586 -2 596 18 616 20 20 31 20 754 20 453 0 745 -4 760 -10z" /><path d="M1592 1073 c-45 -22 -74 -67 -80 -124 -4 -39 0 -56 22 -93 23 -39 26 -56 26 -130 0 -76 3 -87 26 -115 32 -38 80 -49 123 -27 46 24 61 62 61 156 0 67 4 86 21 110 13 17 23 49 26 77 10 119 -115 200 -225 146z" /> </g></svg>';
            btnBan.setAttribute("class", "action-btn");
            btnBan.addEventListener("click", function(e) {
              makeAction(getUsernameNormalized(e, "ban"), "ban");
            });
            btnsContainer.insertBefore(btnBan, btnsContainer.firstChild);
            //show msg
            topMsg.style.visibility = "visible";
            topMsgText.textContent = "El usuario se desbaneo con exito";
          } else if (action === "delete") {
            //change styles
            var rowParentElement = row.parentElement;
            rowParentElement.removeChild(row);
            //show msg
            topMsg.style.visibility = "visible";
            topMsgText.textContent = "El usuario se borro con exito";
          }
        }
      })
      .catch(err => {
        console.log(err);
      });
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
    var x = document.getElementsByClassName("users-list");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != userinput) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }

  // document.addEventListener("click", function(e) {
  //   closeAllLists(e.target);
  // });

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
