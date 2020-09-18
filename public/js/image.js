//Upload profile image
// var imgPreview = document.getElementById("img");
// if (imgPreview) {
//   var profileSrc = imgPreview.src;
// }

// if (pic) {
//   pic.addEventListener("change", function() {
//     if (this.files && this.files[0]) {
//       var reader = new FileReader();

//       reader.onload = function(e) {

//         //si esta editando el profile
//         //cuando sube una nueva imagen quitar la vieja
//         imgPreview.style.display = "block";
//         imgPreview.src = e.target.result;

//         //mostrar svg de delete icon
//         var deleteIcon = document.getElementById("delete-img");
//         deleteIcon.style.display = "inline";

//       };

//       reader.readAsDataURL(this.files[0]);
//     }
//   });
// }

// when profile image is selected open modal to crop it
var el = document.getElementById("imguser");
var vanilla = new Croppie(el, {
  viewport: { width: 300, height: 300, type: "circle" },
  boundary: { width: 300, height: 300 },
  showZoomer: true,
  enableOrientation: true,
  enforceBoundary: true
});

var modalImg;
var imgShow;
var pic = document.getElementById("pic");
if (pic) {
  modalImg = document.getElementById("imgModal");
  imgShow = document.getElementById("img-show");
  pic.addEventListener("change", cropModal);
}

// var valImgSelected;
// var valImgPrevSelected;
function cropModal(e) {
  var reader = new FileReader();
  if (this.files && this.files[0]) {
    reader.onload = function(event) {
      //si esta editando el profile
      //cuando sube una nueva imagen quitar la vieja
      // imgPreview.style.display = "block";
      // imgPreview.src = e.target.result;

      //mostrar svg de delete icon
      var deleteIcon = document.getElementById("delete-img");
      deleteIcon.style.display = "inline";

      //   valImgPrevSelected = valImgSelected;
      //   valImgSelected = event.target.result;

      //crop image
      vanilla.bind({
        url: event.target.result,
        orientation: 1
      });
    };
    reader.readAsDataURL(this.files[0]);
  }
  //display modal
  modalImg.style.display = "block";
}

var btn = document.getElementById("btnModalImg");
if (btn) {
  btn.addEventListener("click", getResult);
}

function getResult() {
  //console.log(2);
  imgShow.style.display = "block";
  vanilla
    .result({
      type: "base64",
      format: "png",
      quality: 1
    })
    .then(function(imgCroppedBase64) {
      //var imgCroppedBase64 = base64;
      console.log("l" + imgCroppedBase64.length);
      //elemento hidden

      document.getElementById("picBase64").value = imgCroppedBase64;

      //close modal
      modalImg.style.display = "none";

      //preview img
      //imgPreview.src = base64;
      // var imgShow = document.getElementById("img-show");
      // imgShow.src = base64;

      //elemento show
      imgShow.src = imgCroppedBase64;
    });
}

//close img modal
// Get the <span> element that closes the modal
var spanCloseImg = document.getElementById("closeImg");
// When the user clicks on <span> (x), close the modal
if (spanCloseImg) {
  spanCloseImg.onclick = function() {
    //Si cierro el modal y no hay ninguna img base64 en el DOM, que no se ponga la nueva en el input
    //y si hay alguna img base64 en el DOM dejar la que esta
    if (imgShow.getAttribute("src") == "") {
      //remove img from DOM
      //reset selected file to upload (input)
      document.getElementById("pic").value = "";
    } else {
      //document.getElementById("pic").value = valImgPrevSelected;
    }

    //delete X icon
    var deleteIcon = document.getElementById("delete-img");
    if (deleteIcon) {
      deleteIcon.style.display = "none";
    }
    //close modal
    modalImg.style.display = "none";
  };
}

//Si clickas en el SVG elimina del DOM la nueva img y si es
//en edit profile pone la que tienes actualmente en el profile
function changeImg() {
  //remove delete icon
  var deleteIcon = document.getElementById("delete-img");
  if (deleteIcon) {
    deleteIcon.style.display = "none";
  }

  //change img to the profile one (edit profile)

  // imgPreview.src = profileSrc; //edit profile

  var imgBase64 = document.getElementById("picBase64");
  var imgOrig = document.getElementById("picBase64Orig");
  if (imgOrig) {
    //edit profile
    var imgOrigVal = imgOrig.value;
    imgShow.src = imgOrigVal;
    //pic.value = imgOrigVal;
    imgBase64.value = imgOrigVal;
  } else {
    //create profiles
    //reset cropped img (create profile)
    imgShow.src = "";
    //do not show image
    imgShow.style.display = "none";
    //reset selected file to upload (input)
    //pic.value = "";
    //reset hidden value
    imgBase64.value = "";
  }
}

//Si el server me devulve una img, porque la validacion ha fallado, la muestro
if (imgShow.getAttribute("src") != "") {
  imgShow.style.display = "block";
  //muestro tambien icono de eliminar foto
  var imgOrig = document.getElementById("picBase64Orig");
  var deleteIcon = document.getElementById("delete-img");
  if (imgOrig) {
    //edit profile
    var img = document.getElementById("picBase64");
    var imgOrig = document.getElementById("picBase64Orig");
    if (imgOrig.value !== img.value) {
      deleteIcon.style.display = "inline";
    }
  } else {
    //create profile
    deleteIcon.style.display = "inline";
  }
}

//custom button to select image
var btnP = document.getElementById("pic-btn");
btnP.addEventListener("click", addImg);
function addImg() {
  //unselect file in input[type="file"]
  pic.value = pic.defaultValue;
  //dont sumit request
  event.preventDefault();
  //click button
  var btnPic = document.getElementById("pic");
  btnPic.click();
}
