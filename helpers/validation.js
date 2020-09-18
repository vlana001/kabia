const fs = require("fs").promises;
const { promisify } = require("util");
const sizeOf = promisify(require("image-size"));
const isBase64 = require("is-base64");
const fileType = require("file-type");

const { body } = require("express-validator");
const validator = require("validator");
const bcrypt = require("bcryptjs");
//var sizeOf = require("image-size");
var XRegExp = require("xregexp");

const { isValidBirthdateDate, isValidDateChat } = require("../helpers/moment");
const { normalizeUsername } = require("../helpers/username");
const { blacklistedPasswords } = require("../helpers/bannedPasswords");
const { registrationMethod } = require("../helpers/auth");

const User = require("../models/user");

module.exports = {
  //Create profile
  validateUsername: function(req, res, next) {
    return [
      body("username")
        .trim() //para que no pueda tener solo whitespaces
        .not()
        .isEmpty()
        .withMessage("Provide a username")
        .custom((value, { req }) => {
          //username must be unique, check if it already exixts
          //Dejo las mayusculas pero para comprobar que no existe comparo con el normalized de la db
          return User.findOne({
            usernameNormalized: normalizeUsername(value)
          }).then(user => {
            if (user) {
              return Promise.reject(
                "It already exists an user with that username, please pick a different one"
              );
            }
          });
        })
        .customSanitizer(value => {
          //Normalize
          //Replace multiple whitespaces in a row by a single space
          return value.replace(/[\s]{1,}/gm, " ");
        })
        .matches(/^[a-z0-9 ]+$/i)
        //puede contener solo letras (min y may), numeros y space " ", no es necesario que contenga las 3, puede tener solo letras o numeros
        // /i case insensitive
        .withMessage(
          "Username must be contain only letters (a-z), numbers and whitespaces"
        )
        .isLength({ min: 3 }) //se comprueba despues de normalize varios whitespaces seguidos contaran como uno solo
        .withMessage("Username must be at least 3 chars")
        .isLength({ max: 35 })
        .withMessage("Username must be at maximum 35 chars")
    ];
  },
  //Create/Edit profile
  validateAllButUsername: function(req, res, next) {
    return [
      body("gender")
        .not()
        .isEmpty()
        .withMessage("Select a gender")
        .isIn(["male", "female"])
        .withMessage("Gender value is not correct"),
      body("euskLevel")
        .not()
        .isEmpty()
        .withMessage("Select a Euskara level")
        .isIn(["1", "2", "3", "4", "5"])
        .withMessage("Euskera level value is not correct"),
      body("birthdate")
        .not()
        .isEmpty()
        .withMessage("Select a date")
        .custom((value, { req }) => {
          //YYYY-MM-DD
          if (!isValidBirthdateDate(value)) {
            throw new Error("Date is not valid");
          }
          return true;
        }),
      body("birthplace")
        .trim() //remove whitespaces at the start and the end of the string
        .customSanitizer((value, { req }) => {
          // replace whitespace characters in the middle of the string by a space character
          return value.replace(/[\s]{1,}/gm, " ");
        })
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage("Birthplace must be at minimum 2 chars")
        .isLength({ max: 40 })
        .withMessage("Birthplace must be at maximum 40 chars")
        .custom((value, { req }) => {
          //remove . / - " "(whitespace) and check if it is an unicode word
          var valueCleaned = value.replace(/[.\-\/" "]/gm, "");
          let unicodeWord = XRegExp("^\\pL+$"); // L: Letter

          //Los nombres solo pueden tener letras Unicode y '.' , '-' , '/' y espacios
          //algunas letras de algunos lenguajes no estan soportados
          if (!unicodeWord.test(valueCleaned)) {
            throw new Error(
              "Los nombres de localidades solo pueden tener letras y '.' , '-' , '/' y espacios"
            );
          }
          return true;
        }),
      body("livingplace")
        .trim()
        .customSanitizer((value, { req }) => {
          return value.replace(/[\s]{1,}/gm, " ");
        })
        .optional({ checkFalsy: true })
        .isLength({ min: 2 })
        .withMessage("Living place must be at minimum 2 chars")
        .isLength({ max: 40 })
        .withMessage("Livingplace must be at maximum 40 chars")
        .custom((value, { req }) => {
          //remove . / - " "(whitespace) and check if it is an unicode word
          var valueCleaned = value.replace(/[.\-\/" "]/gm, "");
          let unicodeWord = XRegExp("^\\pL+$"); // L: Letter

          //Los nombres solo pueden tener letras Unicode y '.' , '-' , '/' y espacios
          if (!unicodeWord.test(valueCleaned)) {
            throw new Error(
              "Los nombres de localidades solo pueden tener letras y '.' , '-' , '/' y espacios"
            );
          }
          return true;
        }),
      body("aboutme")
        .trim()
        .optional({ checkFalsy: true })
        .isLength({ max: 400 })
        .withMessage("About me must be at maximum 400 chars")
        .customSanitizer(value => {
          //replace many whitespace character (space character, tab character...),
          //except \r and \n, by a single " " (space character)

          value = value.replace(/[^\S\r\n]{2,}/gm, " ");

          //si hay 2 o mas  \r\n poner dos \r\n
          //si hay un \r\n se deja como esta
          const arrayStrings = value.split(/\r\n/);
          let stringTrimmed = "";
          let i;
          let prev;
          for (i = 0; i < arrayStrings.length; i++) {
            stringTrimmed = stringTrimmed + arrayStrings[i].trim(); //trim before and after for each line

            if (i < arrayStrings.length - 1 && arrayStrings[i] != "") {
              stringTrimmed = stringTrimmed + "\r\n";
            }
            if (arrayStrings[i] == "" && prev != "") {
              stringTrimmed = stringTrimmed + "\r\n";
            }

            prev = arrayStrings[i];
          }
          return stringTrimmed;
        })
    ];
  },
  //Authentication
  validateEmailRegister: function(req, res, next) {
    return [
      body("email")
        .isEmail()
        .withMessage("Please enter a valid email")
        .custom((value, { req }) => {
          const emailNormalized = validator.normalizeEmail(value);
          return User.findOne({
            email: emailNormalized,
            password: { $exists: true, $ne: null } //cuenta registrada con google o facebook no tendra password
          }).then(userDoc => {
            if (userDoc) {
              return Promise.reject(
                "E-Mail exists already, please pick a different one"
              );
            }
          });
        })
    ];
  },
  validateEmail: function(req, res, next) {
    return [
      body("email")
        .isEmail()
        .withMessage("Please enter a valid email address")
    ];
  },
  validatePasswordLogin: function(req, res, next) {
    //Dont validate password maxlength since a hash is stored which has always the same length
    return [
      body(
        "password",
        "That can not be your password because it does not pass our registration requirements"
      )
        .not()
        .isEmpty()
        .isLength({ min: 8 })
        .matches(/[a-zA-Z]+/)
        .matches(
          /[0-9`´~\!@#\$%\^\&\*\(\)\-_\=\+\[\{\}\]\\\|;:'",<.>\/\?¿€£¥₹]+/
        )
        .not()
        .isIn(blacklistedPasswords)
    ];
  },
  acceptDeleteAccount: function(req, res, next) {
    return [
      body("acceptDelete")
        .exists()
        .withMessage("You have to accept that you want to delete your account")
    ];
  },
  validatePassword: function(req, res, next) {
    return [
      body("password")
        .not()
        .isEmpty()
        .withMessage("Password can not be empty")
        .isLength({ min: 8 })
        .withMessage("Please enter a password with at least 8 characters")
        .matches(/[a-zA-Z]+/)
        .withMessage("Password must contain at least one letter")
        .matches(
          /[0-9`´~\!@#\$%\^\&\*\(\)\-_\=\+\[\{\}\]\\\|;:'",<.>\/\?¿€£¥₹]+/
        )
        .withMessage(
          "Password must contain at least one number or a special character"
        )
        .not()
        .isIn(blacklistedPasswords)
        .withMessage("Password can not be that word, it is very common")
      // oneOf(
      //   [check("password").matches("[0-9]"), check("[0-9]").exists()],
      //   "Password must contain at least a number or a special character"
      // ),
    ];
  },
  validateConfirmPassword: function(req, res, next) {
    return [
      body("confirmPassword")
        .not()
        .isEmpty()
        .withMessage("Password confirm can not be empty")
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error("Password confirmation has to match password");
          }
          return true;
        })
    ];
  },
  validateNewPassword: function(req, res, next) {
    return [
      body("newPassword")
        .not()
        .isEmpty()
        .withMessage("New password can not be empty")
        .isLength({ min: 8 })
        .withMessage("Please enter a new password with at least 8 characters")
        .matches(/[a-zA-Z]+/)
        .withMessage("New password must contain at least one letter")
        .matches(
          /[0-9`´~\!@#\$%\^\&\*\(\)\-_\=\+\[\{\}\]\\\|;:'",<.>\/\?¿€£¥₹]+/
        )
        .withMessage(
          "New password must contain at least one number or a special character"
        )
        .not()
        .isIn(blacklistedPasswords)
        .withMessage("New password can not be that word, it is very common")
      // oneOf(
      //   [check("password").matches("[0-9]"), check("[0-9]").exists()],
      //   "Password must contain at least a number or a special character"
      // ),
    ];
  },
  validateNewPasswordConfirm: function(req, res, next) {
    return [
      body("newPasswordConfirm")
        .not()
        .isEmpty()
        .withMessage("New password confirm can not be empty")
        .custom((value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error("New password confirmation has to match password");
          }
          return true;
        })
    ];
  },
  validateOldPassword: function(req, res, next) {
    return [
      body("oldPassword")
        .not()
        .isEmpty()
        .withMessage("Current password can not be empty")
        .custom((value, { req }) => {
          return bcrypt.compare(value, req.user.password).then(isMatch => {
            if (!isMatch) {
              throw new Error(
                "The current password you provided is not correct"
              );
            }
            return true;
          });
        })
    ];
  },
  passwordDeleteAccount: function(req, res, next) {
    return [
      body("password")
        .not()
        .isEmpty()
        .withMessage("Value can not be empty")
        .custom((value, { req }) => {
          if (registrationMethod(req) === "email") {
            return bcrypt.compare(value, req.user.password).then(isMatch => {
              if (!isMatch) {
                throw new Error("The password you provided is not correct");
              }
              return true;
            });
          } else {
            return User.findOne({
              //puede que un mismo email tenga registrado en google y fb por lo que daria error
              email: req.user.email,
              deleteAccountToken: value,
              deleteAccountTokenExpiration: { $gt: Date.now() }
            }).then(user => {
              if (!user) {
                throw new Error(
                  "The token you provided is not valid or it has expirated"
                );
                return true;
              }
            });
          }
        })
    ];
  },
  validateLimit: function(req, res, next) {
    return [
      body("limit", "Invalid limit value")
        .isNumeric()
        .isIn([10, 20])
    ];
  },
  validateLastTime: function(req, res, next) {
    return [
      body("lastTime").custom((value, { req }) => {
        if (value !== "") {
          if (!isValidDateChat(value)) {
            throw new Error("Invalid date");
          }
        }
        return true;
      })
    ];
  },
  validateProfilePhoto: function(req, res, next) {
    return [
      body("picBase64")
        .custom((value, { req }) => {
          const image = value.split(",")[1];
          if (image === undefined) {
            throw new Error("Añada una imagen");
          }
          return true;
        })
        .custom((value, { req }) => {
          const image = value.split(",")[1];
          //console.log(isBase64(image, { allowEmpty: false }));
          if (!isBase64(image, { allowEmpty: false })) {
            throw new Error("La imagen no es valida");
          }
          return true;
        })
        .custom(async (value, { req }) => {
          //croppie lo envia como base64
          const image = value.split(",")[1];
          const mimeInfo = await fileType.fromBuffer(
            Buffer.from(image, "base64")
          );
          //console.log(mimeInfo);

          if (mimeInfo.mime.toString() !== "image/png") {
            throw new Error("La imagen no es valida");
          }
          return true;
        })
        .custom((value, { req }) => {
          const imageBase64Length = value.split(",")[1].length;
          const maxSizePngFile = (imageBase64Length * 3) / 4;

          if (maxSizePngFile > 1048576) {
            //1Mb
            throw new Error("Imagen demasiado grande");
          }
          return true;
        })
        .custom(async (value, { req }) => {
          const imageProfile = value.toString();

          let image;
          try {
            image = Buffer.from(imageProfile.split(",")[1], "base64"); //decode base64 string
          } catch (err) {
            // console.log(err);
            throw new Error("Error con la imagen");
          }

          let width;
          let height;
          const profileImgName = req.user.email + "-profile.png";

          try {
            //guardar img tmp, para no usar sizeOf sync
            const file = await fs.writeFile("./tmp/" + profileImgName, image);

            //leer img async
            const dimensions = await sizeOf("./tmp/" + profileImgName);
            width = dimensions.width;
            height = dimensions.height;

            //borrar img tmp
            const result = await fs.unlink("./tmp/" + profileImgName);
          } catch (err) {
            //console.log(err);
            throw new Error("Error con la imagen");
          }
          if (height !== 300 || width !== 300) {
            throw new Error("Invalid image dimensions");
          }
          return true;
        })
    ];
  }
};
