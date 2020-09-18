const multer = require("multer");

const path = require("path");

const User = require("../models/user");
const { isProfileCreated } = require("./auth");

//const { normalizeUsername } = require("./username");

//Es obligatorio tener una foto de perfil

module.exports = {
  multerGetImage: function(req, res, next) {
    let userUsername;
    res.locals.emptyImg = false;

    //si estoy en create profile: guardo el objectId, despues si la validacion es correcta
    //lo renombro con el usernameNormalized
    //si estoy en edit profile: trabajo con el usernameNormalized, porque el user ya tiene un usernameNormalixed
    if (req.user.usernameNormalized) {
      userUsername = String(req.user.usernameNormalized);
    } else {
      userUsername = String(req.user.id);
    }

    //Set The Storage Engine
    const storage = multer.diskStorage({
      destination: "./public/uploads/",
      filename: function(req, file, cb) {
        cb(
          null,
          userUsername +
          "-profile" +
          "+tmp+" + //username no puede contener +, solo a-zA-Z y 0-9
            path.extname(file.originalname)
        );
        res.locals.imgName =
          userUsername + "-profile" + "+tmp+" + path.extname(file.originalname);
      }
    });
    //var storage = multer.memoryStorage()

    //Init upload
    const upload = multer({
      storage: storage,
      limits: { fileSize: 2097152 }, //2Mb
      fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
      }
    }).single("pic");

    // Check File Type
    function checkFileType(file, cb) {
      // Allowed ext
      const filetypes = /jpeg|jpg|png/;
      // Check extension
      const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      // Check mime type
      const mimetype = filetypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb("Only valid images jpeg/jpg/png");
      }
    }

    upload(req, res, err => {
      if (err) {
        //Get error message
        let errorMessage;
        if (err === "Only valid images jpeg/jpg/png") {
          errorMessage = "Only valid images jpeg/jpg/png";
        } else if (err.code === "LIMIT_FILE_SIZE") {
          errorMessage = "File too large";
        } else {
          //mensaje de error global
          errorMessage = "Error con la imagen";
        }

        //Pasar al siguiente middleware el mensaje de error
        res.locals.errMsg = errorMessage;
        next();
      } else {
        //Si no pasan una imagen
        //si estan creando el perfil: da error (es necesario poner una img en el perfil)
        //si estan modificando el perfil: se permite (no tiene porque cambiarla)
        if (req.file == undefined) {
          const profileCreated = isProfileCreated(req);
          if (profileCreated) {
            //edit profile
            res.locals.emptyImg = true;
            next();
          } else {
            //create profile
            //si el perfil no esta creado
            //Crear msg error
            res.locals.errMsg = "No image submitted";
            next();
          }
        } else {
          //Image is saved
          next();
        }
      }
    });
  }
};

// isProfileCreated = req => {
//   if (req.user.status !== "profile_not_created") {
//     return true;
//   } else {
//     return false;
//   }
// };
