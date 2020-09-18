//hamburger open/close lateral menu (responsive)
var hamburger = document.getElementById("hamburger-icon");
if (hamburger) {
  hamburger.addEventListener("click", toggleLateralMenu);
}

function toggleLateralMenu() {
  var sideNav = document.getElementById("side-navigation");
  var hamburgerIcon = document.getElementById("hamburgerIcon");
  var closeHamburgerIcon = document.getElementById("closeHamburgerIcon");

  if (sideNav.style.width > "0px") {
    //si esta abierto parcial o totalmente
    //close menu
    sideNav.style.width = "0";
    //change icon
    closeHamburgerIcon.style.display = "none";
    hamburgerIcon.style.display = "inline-block";
  } else {
    //si esta cerrado del todo
    //open menu
    sideNav.style.width = "80%";
    hamburgerIcon.style.display = "none";
    closeHamburgerIcon.style.display = "inline-block";
  }
}

////////////////
//lateral menu dropdown
var dropdown = document.getElementsByClassName("dropdown-btn-side-nav");
var i;
for (i = 0; i < dropdown.length; i++) {
  dropdown[i].addEventListener("click", function() {
    var dropdownContent = this.nextElementSibling;
    if (dropdownContent != null) {
      //tiene elementos el dropdown
      var button = getButton();
      var svgArray = button.getElementsByTagName("svg");
      if (dropdownContent.style.display === "block") {
        dropdownContent.style.display = "none";
        svgArray[1].style.display = "inline-block";
        svgArray[2].style.display = "none";
      } else {
        dropdownContent.style.display = "block";
        svgArray[1].style.display = "none";
        svgArray[2].style.display = "inline-block";
      }
    }
  });
}

function getButton() {
  var button;
  if (["path", "polygon"].includes(event.target.tagName.toLowerCase())) {
    button = event.target.parentElement.parentElement;
  } else if (["svg", "span"].includes(event.target.tagName.toLowerCase())) {
    button = event.target.parentElement;
  } else {
    button = event.target;
  }
  return button;
}

///////////////////////////
//hide/show top navbar my account dropdown (depending on screen size)
var myAccountBtn = document.getElementById("dropbtn-myaccount");
if (myAccountBtn) {
  myAccountBtn.addEventListener("click", hideShowDropdown);
}

var previousElement; //global variable
function hideShowDropdown(event) {
  if (getBrowserWindowWidth() > 600) {
    //ver que elemento lanza el evento
    var elemId = event.target;
    //dropdown content: para abrir y cerrar el dropdown
    var dropdownContent = document.getElementById("dropdown-content");
    //para saber si he clickado 2 veces seguidas en el btn de la navbar que abre el dropdown
    var b = false;

    //Si las 2 ultimas veces que he hecho click, he dado click al mismo boton de la navbar: no muestro el dropdown.
    //Porque la primera de las veces le he dado para mostrarlo y la segunda para ocultarlo,
    //asi que la segunda vez que doy click, lo oculto, no lo vuelvo a mostrar
    var btnDropdown = document.getElementById("dropbtn-myaccount");
    if (previousElement && btnDropdown.contains(previousElement)) {
      b = true;
    }
    previousElement = elemId;

    //2 formas de cerrar el dropdown:
    //click en la window fuera del elemento
    //click 2 veces seguidas en el mismo elemento btn de la navbar que abre el dropdown

    //hide/show: no hace falta mirar el estado de la propiedad CSS display
    //Al hacer un click en window fuera del btn se cierra el dropdown
    if (!b) {
      //no esta abierto (no acabo de clickar el btn por lo que no esta abierto)
      dropdownContent.style.display = "block";
    } else {
      //esta abierto (acabo de clickar el btn por lo que esta abierto)
      dropdownContent.style.display = "none"; //Cierro el dropdown
      previousElement = undefined; //reset variable
    }
  }
}

function getBrowserWindowWidth() {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
}

////////////////////

//open lateral menu when tab of top navbar is clicked (small screens) or redirect (big screens)
// dependiendo del tam de la pantalla redirijo o abro menu lateral
var topNavbarTab = document.getElementsByClassName("navbar-link");
if (topNavbarTab) {
  for (var i = 0; i < topNavbarTab.length; i++) {
    topNavbarTab[i].addEventListener(
      "click",
      showLateralMenuOptionSelectedOrRedirect
    );
  }
}

function showLateralMenuOptionSelectedOrRedirect(e) {
  //go to ancestor which has link in data attribute
  var tabClicked = getElementAncestor(e.target);

  //get screen width
  if (
    getBrowserWindowWidth() > 600 ||
    tabClicked.dataset.url.toString() === "/" //if logo is clicked and user is not logged in
  ) {
    //redirect
    if (tabClicked.tagName.toLowerCase() === "a") {
      window.location.href = tabClicked.dataset.url;
    }
  } else {
    //open lateral menu with option selected
    openLateralMenuAfterClickOnTabTopNavBar(tabClicked.dataset.number);
  }
}

// tipos link top navbar:
// -home: g
// -button dropdown my account: div
// -link a normal (puede tener div con icono numero notificaciones)

function getElementAncestor() {
  var dropDownBtn = document.getElementById("dropdown-myaccount");
  var homeLink = document.getElementById("home-link-button");
  var svgIconNavbar = document.getElementById("svg-navbar-home-icon");

  var ancestorElem;
  //svg icon home (user navbar) to be able to redirect on click
  if (svgIconNavbar.contains(event.target)) {
    ancestorElem = svgIconNavbar.parentElement;
    return ancestorElem;
  }

  if (["path", "polygon"].includes(event.target.tagName.toLowerCase())) {
    if (dropDownBtn.contains(event.target) || homeLink.contains(event.target)) {
      //de myaccount o de home
      ancestorElem = event.target.parentElement.parentElement.parentElement;
    } else {
      ancestorElem = event.target.parentElement.parentElement;
    }
  } else if (event.target.tagName.toLowerCase() === "svg") {
    if (dropDownBtn.contains(event.target)) {
      //de myaccount
      ancestorElem = event.target.parentElement.parentElement;
    } else {
      ancestorElem = event.target.parentElement;
    }
  } else if (event.target.tagName.toLowerCase() === "div") {
    ancestorElem = event.target.parentElement;
  } else {
    //el elemento top que contiene el data-url
    ancestorElem = event.target;
  }
  return ancestorElem;
}

function openLateralMenuAfterClickOnTabTopNavBar(tabNumber) {
  var sideNav = document.getElementById("side-navigation");
  var hamburgerIcon = document.getElementById("hamburgerIcon");
  var closeHamburgerIcon = document.getElementById("closeHamburgerIcon");

  var tabLateralMenuSelected = document.getElementById(tabNumber);

  //quitar color azul al tab de lateral menu que lo tenga
  var dropDownLateralMenu = document.getElementsByClassName(
    "dropdown-btn-side-nav"
  );
  if (dropDownLateralMenu) {
    for (var i = 0; i < dropDownLateralMenu.length; i++) {
      dropDownLateralMenu[i].style.backgroundColor = "#f0e68c";
    }
  }

  //close all dropdowns
  var dropDownContentLateralMenu = document.getElementsByClassName(
    "dropdown-container"
  );
  if (dropDownContentLateralMenu) {
    for (var i = 0; i < dropDownContentLateralMenu.length; i++) {
      dropDownContentLateralMenu[i].style.display = "none";
      //si tiene dropdown tendra 3 svg
      var svgElem = dropDownContentLateralMenu[
        i
      ].previousElementSibling.getElementsByTagName("svg");
      svgElem[1].style.display = "inline-block";
      svgElem[2].style.display = "none";
    }
  }
  //change color
  tabLateralMenuSelected.style.backgroundColor = "blue";

  //open dropdown (if there is one)
  var ddContainerSelectedTab = tabLateralMenuSelected.parentElement.getElementsByClassName(
    "dropdown-container"
  );
  if (ddContainerSelectedTab.length > 0) {
    ddContainerSelectedTab[0].style.display = "block";
    var svgElem2 = tabLateralMenuSelected.getElementsByTagName("svg");
    svgElem2[1].style.display = "none";
    svgElem2[2].style.display = "inline-block";
  }

  //show lateral menu
  sideNav.style.width = "80%";
  hamburgerIcon.style.display = "none";
  closeHamburgerIcon.style.display = "inline-block";
}

//////
//Para evitar que al pulsar un icono de la navbar se cierre el lateral menu
function isTopNavbarTab(event) {
  var topNavbarTabElements = document.getElementsByClassName("navbar-link");
  for (i = 0; i < topNavbarTabElements.length; i++) {
    if (topNavbarTabElements[i].contains(event.target)) {
      return true;
    }
  }
  return false;
}

/////////////////////
//Password
function hideShowPassword() {
  var inputPassword = document.getElementById("password-field");
  var pathEyeIcon = document.getElementById("eye-icon");
  passwordToggle(inputPassword, pathEyeIcon);
}

function hideShowPasswordConfirm() {
  var inputPassword = document.getElementById("password-field-confirm");
  var pathEyeIcon = document.getElementById("eye-icon-confirm");
  passwordToggle(inputPassword, pathEyeIcon);
}

function hideShowNewPassword() {
  var inputPassword = document.getElementById("new-password-field");
  var pathEyeIcon = document.getElementById("eye-icon-newpassword");
  passwordToggle(inputPassword, pathEyeIcon);
}

function hideShowNewPasswordConfirm() {
  var inputPassword = document.getElementById("new-password-field-confirm");
  var pathEyeIcon = document.getElementById("eye-icon-newpassword-confirm");
  passwordToggle(inputPassword, pathEyeIcon);
}

function passwordToggle(inputPassword, pathEyeIcon) {
  //   var inputPassword = document.getElementById("password-field");
  //   var pathEyeIcon = document.getElementById("eye-icon");

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

//********* *
//send timezone when login
//google sign in
var googleSignInForm = document.getElementById("google-signin-form");
if (googleSignInForm) {
  googleSignInForm.addEventListener("submit", addTimezoneToUrlGoogle);
}
function addTimezoneToUrlGoogle() {
  var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  googleSignInForm.action = googleSignInForm.action + window.btoa(timezone);
}
//facebook sign in
var facebookSignInForm = document.getElementById("facebook-signin-form");
if (facebookSignInForm) {
  facebookSignInForm.addEventListener("submit", addTimezoneToUrlFacebook);
}
function addTimezoneToUrlFacebook() {
  var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  facebookSignInForm.action = facebookSignInForm.action + window.btoa(timezone);
}
//email sign in
var emailSignInForm = document.getElementById("form-login-email");
if (emailSignInForm) {
  emailSignInForm.addEventListener("submit", addTimezoneToFormEmail);
}
function addTimezoneToFormEmail() {
  var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  var inputTimezone = document.getElementById("timezone");
  inputTimezone.value = timezone;
}

var emailSignInFormAdmin = document.getElementById("form-login-email-admin");
if (emailSignInFormAdmin) {
  emailSignInFormAdmin.addEventListener("submit", addTimezoneToFormEmailAdmin);
}
function addTimezoneToFormEmailAdmin() {
  var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  var inputTimezone = document.getElementById("timezone");
  inputTimezone.value = timezone;
}
