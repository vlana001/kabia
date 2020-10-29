//const multer = require("multer");

const fs = require("fs");
const fsp = require("fs").promises;

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const User = require("../models/user");
const Chat = require("../models/chat");
const UserAction = require("../models/userAction");

const { normalizeUsername } = require("../helpers/username");
const {
  identifyLoginMethod,
  registrationMethod,
  isProfileCreated
} = require("../helpers/auth");

const {
  checkOperationIsValid,
  checkUserIsTheSame,
  checkUserExists,
  isBlockedByCurrentUser,
  isFriendOfCurrentUser,
  isPendingActionUser,
  countNumberOfUserFriends,
  isFriendOfCurrentUserUsingUsernameNormalized
} = require("../helpers/friends");

// const {} = require("../helpers/date");

const {
  calculateTodayDate,
  calculateAgeYears,
  formatRegistrationDate,
  subtractYearsToTodayDate,
  subtractYearsYearIncludedToTodayDate,
  getCurrentTimeUTC,
  convertDateStringToObject
} = require("../helpers/moment");

const errorMessagesValidator = require("../helpers/errorsMessagesValidator");
const { messageErrorShow, messageSuccessShow } = require("../helpers/messages");
const { ws } = require("../controllers/ws");

const keys = require("../config/keys");

//Search users by username
exports.getSearchUsersByUsername = (req, res, next) => {
  res.render("users/searchusersbyusername", {
    pageTitle: "Search users by username",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req),
    registrationMethod: registrationMethod(req),
    usernameNormalized: req.user.usernameNormalized,
    errorMessage: messageErrorShow(req.flash("error")), //
    user: null,
    msgNoUsers: "", //Si no hace una busqueda, no muestro mensaje 'No Users Found'
    input: {
      username: ""
    }
  });
};

exports.postSearchUsersByUsername = async (req, res, next) => {
  const username = req.body.username;

  const errors = validationResult(req);
  let errorsMessages = [];
  if (!errors.isEmpty()) {
    errorsMessages = errorMessagesValidator.getErrorsMessages(errors.mapped());
  }

  if (errorsMessages.length != 0) {
    return res.status(422).render("users/searchusersbyusername", {
      pageTitle: "Search users by username",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      usernameNormalized: req.user.usernameNormalized,
      errorMessage: errorsMessages,
      user: null,
      msgNoUsers: "", //Si no hace una busqueda, no muestro mensaje 'No Users Found'
      input: {
        username: ""
      }
    });
  }

  let query = {};
  if (username !== "") {
    //Busqueda por username
    query["usernameNormalized"] = normalizeUsername(username);
    query["status"] = { $ne: "profile_not_created" };
    query["role"] = "user";
  }

  try {
    let user = await User.findOne(query);

    //console.log(users);
    //if (users) {
    //existe algun user que satisfaga la busqueda
    //devolver resultado de las cards en la misma pagina
    //dejar parametros de busqueda en los inputs

    let msg = "";
    if (!user) {
      msg = "No Users Found!";
    } else {
      msg = "";
      user.userAge = calculateAgeYears(user.birthDate);
    }

    return res.render("users/searchusersbyusername", {
      pageTitle: "Search users by username",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      usernameNormalized: req.user.usernameNormalized,
      errorMessage: messageErrorShow(req.flash("error")),
      user: user,
      userFriendships: req.user,
      msgNoUsers: msg,
      input: {
        username: req.body.username
      }
    });
    // } else {
    //no existe
    //dejar parametros de busqueda en los inputs
    // req.flash(
    //   "message",
    //   "No existe ningún usuario que coincida con los parámetros de la búsqueda"
    // );
    //res.redirect("/users/searchusers");
    // }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//Search users
exports.getSearchUsers = (req, res, next) => {
  res.render("users/searchusers", {
    pageTitle: "Search users",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req),
    registrationMethod: registrationMethod(req),
    usernameNormalized: req.user.usernameNormalized,
    errorMessage: messageErrorShow(req.flash("error")), //
    usersList: [],
    msgNoUsers: "", //Si no hace una busqueda, no muestro mensaje 'No Users Found'
    input: {
      gender: "",
      euskLevel: "",
      age1: "",
      age2: ""
    }
  });
};

exports.postSearchUsers = async (req, res, next) => {
  const errors = validationResult(req);
  let errorsMessages = [];
  if (!errors.isEmpty()) {
    errorsMessages = errorMessagesValidator.getErrorsMessages(errors.mapped());
  }

  if (errorsMessages.length != 0) {
    return res.status(422).render("users/searchusers", {
      pageTitle: "Search users",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      usernameNormalized: req.user.usernameNormalized,
      errorMessage: errorsMessages,
      usersList: [],
      msgNoUsers: "", //Si no hace una busqueda, no muestro mensaje 'No Users Found'
      input: {
        gender: req.body.gender,
        euskLevel: req.body.euskLevel,
        age1: req.body.age1,
        age2: req.body.age2
      }
    });
  }

  let query = {};

  //Busqueda por datos (no por username)
  const gender = req.body.gender;
  if (gender) {
    query["gender"] = gender;
  }

  const euskLevel = req.body.euskLevel;
  if (euskLevel) {
    query["euskLevel"] = euskLevel;
  }

  query["status"] = { $ne: "profile_not_created" };
  query["role"] = "user";

  //edad
  const age1 = req.body.age1;
  const age2 = req.body.age2;

  if (age1 !== "" || age2 !== "") {
    query["birthDate"] = {};
  }

  if (age1) {
    //min age
    query["birthDate"].$lte = subtractYearsToTodayDate(age1);
  }
  if (age2) {
    //max age
    query["birthDate"].$gte = subtractYearsYearIncludedToTodayDate(age2);
  }

  // const birthplace = req.body.birthplace;
  // if (birthplace) {
  //   query["birthPlace"] = birthplace;
  // }

  // const livingplace = req.body.livingplace;
  // if (livingplace) {
  //   query["livingPlace"] = livingplace;
  // }

  //
  // console.log(req.body.gender);
  // let maleChecked = false;
  // if (req.body.gender === "male") {
  //   maleChecked = true;
  // }
  // let femaleChecked = false;
  // if (req.body.gender === "female") {
  //   femaleChecked = true;
  // }

  try {
    let users = await User.find(query);

    //console.log(users);
    //if (users) {
    //existe algun user que satisfaga la busqueda
    //devolver resultado de las cards en la misma pagina
    //dejar parametros de busqueda en los inputs

    let msg = "";
    if (users.length == 0) {
      msg = "No Users Found!";
    } else {
      msg = "";
      users.forEach(function(user) {
        user.userAge = calculateAgeYears(user.birthDate);
      });
    }

    return res.render("users/searchusers", {
      pageTitle: "Search users",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      usernameNormalized: req.user.usernameNormalized,
      errorMessage: messageErrorShow(req.flash("error")),
      usersList: users,
      msgNoUsers: msg,
      userFriendships: req.user,
      input: {
        gender: req.body.gender,
        euskLevel: req.body.euskLevel,
        age1: req.body.age1,
        age2: req.body.age2
      }
    });
    // } else {
    //no existe
    //dejar parametros de busqueda en los inputs
    // req.flash(
    //   "message",
    //   "No existe ningún usuario que coincida con los parámetros de la búsqueda"
    // );
    //res.redirect("/users/searchusers");
    // }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//Edit profile
exports.getEditProfileUsers = async (req, res, next) => {
  try {
    //Obtener identificador unico (alias) de la session
    const user = await User.findById(req.user.id);

    const imgBase64 = await fsp.readFile("./public/uploads/" + user.imageURL, {
      encoding: "base64"
    });

    return res.render("users/editprofile", {
      pageTitle: "Edit profile",
      isAuthenticated: req.isAuthenticated(),
      usernameNormalized: req.user.usernameNormalized,
      errorMessage: messageErrorShow(req.flash("error")),
      todayDate: calculateTodayDate(),
      registrationMethod: registrationMethod(req),
      isProfileCreated: isProfileCreated(req),
      oldInput: {
        euskLevel: user.euskLevel,
        gender: user.gender,
        birthdate: user.birthDate,
        birthplace: user.birthPlace,
        livingplace: user.livingPlace,
        aboutme: user.aboutMe,
        imageProfile: imgBase64,
        imageProfileOrig: imgBase64
      }
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postEditProfileUsers = async (req, res, next) => {
  const gender = req.body.gender;
  const euskLevel = req.body.euskLevel;
  const birthdate = req.body.birthdate;
  const birthplace = req.body.birthplace;
  const livingplace = req.body.livingplace;
  const aboutme = req.body.aboutme;
  //como es base64 la img la envio en input[type="text"] y no en input[type="file"]
  const imageProfile = req.body.picBase64.toString();

  try {
    //leer image actual del filesystem
    const imageOld = await fsp.readFile(
      "./public/uploads/" + req.user.imageURL,
      {
        encoding: "base64"
      }
    );

    const errors = validationResult(req);
    let errorsMessages = [];
    //pasar los mensajes que devuelve la funcion al array errorsMessages
    if (!errors.isEmpty()) {
      errorsMessages = errorMessagesValidator.getErrorsMessages(
        errors.mapped()
      );
    }

    if (errorsMessages.length != 0) {
      return res.status(422).render("users/editprofile", {
        pageTitle: "Edit Profile",
        isAuthenticated: req.isAuthenticated(),
        isProfileCreated: isProfileCreated(req),
        usernameNormalized: req.user.usernameNormalized,
        registrationMethod: registrationMethod(req),
        errorMessage: errorsMessages,
        todayDate: calculateTodayDate(),
        oldInput: {
          gender: gender,
          euskLevel: euskLevel,
          birthdate: birthdate,
          birthplace: birthplace,
          livingplace: livingplace,
          aboutme: aboutme,
          //si falla validacion pongo la foto que ha enviado, no la que tiene actualmente en el perfil
          imageProfile: imageProfile.split(",")[1],
          imageProfileOrig: imageOld
        }
      });
    }

    //Obtener identificador unico (alias) de la session
    const user = await User.findById(req.user.id);

    //console.log(imageOld.substring(1, 40));
    const imageNewBase64 = imageProfile.split(",")[1];
    const imageNew = Buffer.from(imageNewBase64, "base64");
    //console.log(imageNew.substring(1, 40));

    //compare base64 strings (2 images)
    let isImgProfileNew = false;
    let profileImgName;
    if (imageNewBase64 !== imageOld) {
      isImgProfileNew = true;
      console.log("nosame");

      const usernameNormalized = req.user.usernameNormalized;
      const imageName = user.imageURL;
      //get number imageOld, para sumarle 1
      let imgNum = parseInt(
        imageName.substring(
          imageName.lastIndexOf("_") + 1,
          imageName.lastIndexOf("-")
        )
      );
      imgNum = imgNum + 1;
      profileImgName = usernameNormalized + "_" + imgNum + "-" + "profile.png";

      //borrar foto vieja
      await fsp.unlink("./public/uploads/" + user.imageURL);
      //crear foto nueva
      await fsp.writeFile("./public/uploads/" + profileImgName, imageNew);
    } else {
      console.log("same");
    }

    let updateUser = user;
    updateUser.gender = gender;
    updateUser.euskLevel = euskLevel;
    updateUser.birthDate = birthdate;
    updateUser.birthPlace = birthplace;
    updateUser.livingPlace = livingplace;
    if (isImgProfileNew) {
      updateUser.imageURL = profileImgName;
    }
    updateUser.aboutMe = aboutme;
    //save in db (edit profile)
    const userNew = await updateUser.save();

    req.flash("success_message", "Your profile has been updated correctly");
    res.redirect("/users/menu");
  } catch (err) {
    // console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//Menu
exports.getMenuUsers = async (req, res, next) => {
  //r(req, res); //redirect if profile not created

  // console.log(cookieUsernameWs.get(req.session.id));
  // console.log(req.session.id);

  try {
    // let query = {};
    // identifyLoginMethod(req, query);
    // const user = await User.findOne(query);

    //console.log("u" + user.status);
    // if (user.status === "profile_not_created") {
    // res.redirect("/users/createprofile");
    //hacer el menor numero de HTTP redirects
    // res.render("auth/createprofile", {
    //   pageTitle: "Create profile",
    //   isAuthenticated: req.isAuthenticated(),
    //   //message: req.flash("error")
    // });
    // } else {

    const users = await getAllUsers();
    const friendships = await getUserFriendshipsStatus(req);

    console.log(users);

    //pasar array al template y en el template con un loop mostrar en la UI
    res.render("users/menu", {
      pageTitle: "Menu",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      username: req.user.username,
      usernameNormalized: req.user.usernameNormalized,
      usersList: users,
      userFriendships: friendships,
      errorMessage: messageErrorShow(req.flash("error")),
      successMessage: messageSuccessShow(req.flash("success_message"))
      //message: req.flash("error")
    });
  } catch (err) {
    // console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

getAllUsers = () => {
  //select username field, _id field is always present unless you explicitly exclude it using - symbol
  return User.find({
    status: { $ne: "profile_not_created" },
    role: "user"
  }).select("username usernameNormalized imageURL status -_id");
};

getUserFriendshipsStatus = req => {
  return User.findById(req.user.id)
    .select("friends blockedUsers -_id")
    .lean();
};

// function r(req, res) {
//   //console.log(req.user);
//   User.findOne({ email: req.user.email })
//     .then(user => {
//       console.log("u" + user.status);
//       if (user.status === "profile_not_created") {
//         res.redirect("/register2");
//       }
//     })
//     .catch(err => {});
// }

exports.getOnlineUsers = async (req, res, next) => {
  try {
    const users = await getAllOnlineUsers();
    const friendships = await getUserFriendshipsStatus(req);

    res.render("users/menu", {
      pageTitle: "Online users",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      username: req.user.username,
      usernameNormalized: req.user.usernameNormalized,
      usersList: users,
      userFriendships: friendships,
      errorMessage: messageErrorShow(req.flash("error")),
      successMessage: messageSuccessShow(req.flash("success_message"))
      //message: req.flash("error")
    });
  } catch (err) {
    // console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

getAllOnlineUsers = () => {
  //select username field, _id field is always present unless you explicitly exclude it using - symbol
  return User.find({
    status: "online",
    role: "user"
  }).select("username usernameNormalized imageURL status -_id");
};

//Create Profile
exports.getCreateProfileUser = (req, res, next) => {
  res.render("users/createprofile", {
    pageTitle: "Create Profile",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req),
    registrationMethod: registrationMethod(req),
    //usernameNormalized: req.user.usernameNormalized,
    errorMessage: messageErrorShow(req.flash("error_message")),
    todayDate: calculateTodayDate(),
    oldInput: {
      username: "",
      gender: "",
      euskLevel: "",
      birthdate: "",
      birthplace: "",
      livingplace: "",
      aboutme: "",
      imageProfile: ""
    }
  });
};

exports.postCreateProfileUser = async (req, res, next) => {
  const username = req.body.username; //validar que sea unico con validator en la middleware chain
  const gender = req.body.gender;
  const euskLevel = req.body.euskLevel;
  const birthdate = req.body.birthdate;
  const birthplace = req.body.birthplace;
  const livingplace = req.body.livingplace;
  const aboutme = req.body.aboutme;
  const imageProfile = req.body.picBase64.toString();

  const errors = validationResult(req);
  let errorsMessages = [];
  if (!errors.isEmpty()) {
    errorsMessages = errorMessagesValidator.getErrorsMessages(errors.mapped());
  }

  if (errorsMessages.length != 0) {
    return res.status(422).render("users/createprofile", {
      pageTitle: "Create Profile",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      //usernameNormalized: req.user.usernameNormalized,
      errorMessage: errorsMessages,
      todayDate: calculateTodayDate(),
      oldInput: {
        username: username,
        gender: gender,
        euskLevel: euskLevel,
        birthdate: birthdate,
        birthplace: birthplace,
        livingplace: livingplace,
        aboutme: aboutme,
        imageProfile: imageProfile
      }
    });
  }
  //Aqui sabes que se han pasado todas las validaciones

  const usernameNormalized = normalizeUsername(username);
  const profileImgName = usernameNormalized + "_0-" + "profile.png";

  User.findById(req.user.id)
    .then(user => {
      //if there is already an user registered with that email addres and registration method,
      // update its values
      let resetUser;
      resetUser = user;
      resetUser.username = username;
      resetUser.usernameNormalized = usernameNormalized;
      resetUser.gender = gender;
      resetUser.euskLevel = euskLevel;
      resetUser.birthDate = birthdate;
      resetUser.birthPlace = birthplace;
      resetUser.livingPlace = livingplace;
      resetUser.imageURL = profileImgName;
      resetUser.aboutMe = aboutme;
      resetUser.status = "profile_created";

      return resetUser.save();
    })
    .then(result => {
      const image = Buffer.from(imageProfile.split(",")[1], "base64");

      fs.writeFile("./public/uploads/" + profileImgName, image, err => {
        if (err) {
          console.log(err);
          return;
        }
      });
    })
    .then(result => {
      console.log(result);
      cookieUsernameWs.set(req.session.id, normalizeUsername(username)); //map sessionId with username
      req.flash("success_message", "Your profile has been created correctly");
      res.redirect("/users/menu");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getMyProfile = async (req, res, next) => {
  //Uso un redirect
  const usernameNormalized = req.user.usernameNormalized;
  return res.redirect(`/users/u/${usernameNormalized}`);

  //Esta seria la manera de mayor performance porque no hace redirect,
  //pero como quiero que en la URL aparezca igual que todas /u/:user
  //y no quiero hacer URL rewriting uso la otra

  // const user = req.user;
  // return res.render("users/user-profile", {
  //   pageTitle: `Profile ${user.username}`,
  //   isAuthenticated: req.isAuthenticated(),
  //   currentUser: user.usernameNormalized,
  //   errorMessage: messageErrorShow(req.flash("error_message")),
  //   username: user.username,
  //   usernameNormalized: user.usernameNormalized,
  //   userProfilePhoto: user.imageURL,
  //   userGender: user.gender,
  //   userLivingPlace: user.livingPlace,
  //   userBirthPlace: user.birthPlace,
  //   userBirthDate: user.birthDate,
  //   userAge: calculateAgeYears(user.birthDate),
  //   userAboutMe: user.aboutMe,
  //   userSince: formatRegistrationDate(user.date),
  //   userEuskLevel: user.euskLevel
  // });
};

exports.getUserProfile = async (req, res, next) => {
  const username = req.params.username;

  //get values from db
  const user = await User.findOne({ usernameNormalized: username });

  try {
    if (user) {
      const blocked = await isBlockedByCurrentUser(req.user, user);
      const friend = await isFriendOfCurrentUser(req.user, user);
      const pendingAction = await isPendingActionUser(req.user, user);
      const numberFriends = await countNumberOfUserFriends(req.user);

      //throw new Error("Error!");

      return res.render("users/user-profile", {
        pageTitle: `Profile ${username}`,
        isAuthenticated: req.isAuthenticated(),
        isProfileCreated: isProfileCreated(req),
        registrationMethod: registrationMethod(req),
        currentUser: req.user.usernameNormalized,
        isBlockedByCurrentUser: blocked,
        isFriendOfCurrentUser: friend,
        isPendingAction: pendingAction,
        errorMessage: messageErrorShow(req.flash("error_message")),
        username: user.username,
        usernameNormalized: user.usernameNormalized,
        userProfilePhoto: user.imageURL,
        userGender: user.gender,
        userLivingPlace: user.livingPlace,
        userBirthPlace: user.birthPlace,
        userBirthDate: user.birthDate,
        userAge: calculateAgeYears(user.birthDate),
        userAboutMe: user.aboutMe,
        numberFriends: numberFriends,
        userSince: formatRegistrationDate(user.date),
        userEuskLevel: user.euskLevel,
        status: user.status
      });
    } else {
      //Si no existe el user mostrar mensaje
      return res.render("users/error-pages/error", {
        pageTitle: `Error - No existe el usuario ${username}`,
        isAuthenticated: req.isAuthenticated(),
        isProfileCreated: isProfileCreated(req),
        registrationMethod: registrationMethod(req),
        usernameNormalized: req.user.usernameNormalized,
        errorMessage: [`No existe el usuario ${username}`]
      });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//Friends
exports.getSearchFriend = (req, res, next) => {
  return res.render("users/searchfriend", {
    pageTitle: "Search friend",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req),
    registrationMethod: registrationMethod(req),
    usernameNormalized: req.user.usernameNormalized,
    errorMessage: ""
  });
};

exports.postSearchFriend = async (req, res, next) => {
  let username = req.body.username;

  //replace multiple whitespaces by a single space
  username = username.replace(/[\s]{1,}/gm, " ");

  //si contiene caracteres no validos para el username, devuelvo array vacio
  //puede contener solo letras (min y may), numeros y space " "
  if (!/^[a-z0-9 ]+$/i.test(username)) {
    return res.json([]);
  }

  //query busqueda entre los amigos de ese user: like %
  try {
    const friendsMatching = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.user.id) } },
      { $unwind: "$friends" },
      {
        $match: {
          "friends.username": {
            $regex: new RegExp("^" + username, "i")
          }
        }
      },
      { $sort: { "friends.username": 1 } },
      {
        $project: {
          //pasar al navegador usernameNormalized y username
          _id: 0, //exclude _id field
          username: "$friends.username",
          usernameNormalized: "$friends.usernameNormalized"
        }
      }
    ]);
    let friendsMatchingWithImage = [];

    for (const value of friendsMatching) {
      //query db
      let user = await User.findOne({
        usernameNormalized: value.usernameNormalized
      })
        .select("imageURL status -_id")
        .lean();

      //add image url and status to the array object
      let objUser = value;
      objUser["imageURL"] = user.imageURL.toString();
      if (user.status.toString() === "online") {
        objUser["status"] = user.status.toString();
      } else {
        objUser["status"] = "";
      }
      friendsMatchingWithImage.push(objUser);
    }

    let friendsMachingWithBlockedUsers = [];
    for (const value of friendsMatchingWithImage) {
      const result = await User.findOne({
        _id: req.user.id,
        "blockedUsers.usernameNormalized": value.usernameNormalized
      });

      let objUser1 = value;
      if (result) {
        objUser1["isBlocked"] = true;
      } else {
        objUser1["isBlocked"] = false;
      }
      friendsMachingWithBlockedUsers.push(objUser1);
    }

    res.json(friendsMachingWithBlockedUsers);
  } catch (err) {
    console.log(err);
  }
};

//Friends
exports.getMyFriends = async (req, res, next) => {
  let friends = [];
  let userfr;

  try {
    userfr = await User.findById(req.user.id)
      .select("friends blockedUsers -_id")
      .lean();

    if (userfr) {
      for (const value of userfr.friends) {
        //query db
        let user = await User.findOne({
          usernameNormalized: value.usernameNormalized
        })
          .select("imageURL status -_id")
          .lean();

        if (user) {
          //add image url to the array object
          let objUser = value;
          objUser["imageURL"] = user.imageURL.toString();
          objUser["status"] = user.status;

          friends.push(objUser);
        }
      }
      console.log(friends);
    }
  } catch (err) {
    console.log(err);
  }

  return res.render("users/friends", {
    pageTitle: "My friends",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req),
    registrationMethod: registrationMethod(req),
    friendsList: friends,
    blockedUsersList: userfr.blockedUsers,
    usernameNormalized: req.user.usernameNormalized,
    optionLateralMenu: 1
    //errorMessage: ""
  });
};

exports.getMyFriendsOnline = async (req, res, next) => {
  //for each user I make a query to see if he is online
  let friendsList;
  let friendsOnline = [];
  try {
    //get all friends
    friendsList = await User.findById(req.user.id)
      .select("friends blockedUsers -_id")
      .lean();

    if (friendsList) {
      //get data for each friend
      for (const f of friendsList.friends) {
        let friendOnline = await User.findOne({
          usernameNormalized: f.usernameNormalized,
          status: "online"
        })
          .select("username usernameNormalized imageURL status -_id")
          .lean();

        if (friendOnline) {
          friendsOnline.push(friendOnline);
        }
      }
      console.log(friendsOnline);
    }
  } catch (err) {}
  return res.render("users/friends", {
    pageTitle: "My friends online",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req),
    registrationMethod: registrationMethod(req),
    friendsList: friendsOnline,
    blockedUsersList: friendsList.blockedUsers,
    usernameNormalized: req.user.usernameNormalized,
    optionLateralMenu: 2
    //errorMessage: ""
  });
};

exports.postUserRequestFriendship = (req, res, next) => {
  const friendshipRequested = req.body.usernameNormalized;
  const friendshipRequester = req.user;

  //A user can not be its own friend
  if (checkUserIsTheSame(friendshipRequester, friendshipRequested)) {
    return res.json({
      requestSend: "NotAllowed",
      msg: "You can not be your own friend"
    });
  }

  //A user with that username must exist
  checkUserExists(friendshipRequested)
    .then(exists => {
      if (!exists) {
        return res.json({
          requestSend: "operationNotAllowed",
          msg: "No existe un usuario con ese nombre"
        });
      }
    })
    .catch(err => {});

  //The operation must be valid
  checkOperationIsValid(req, 1, friendshipRequested)
    .then(result => {
      if (result !== "") {
        //no permitir realizar operacion
        return res.json({ requestSend: "operationNotAllowed", msg: result });
      } else {
        // realizar operacion
        //save in db both in requester and requested user's documents
        //2 promises chained
        let userRequested;
        //let userExists = false;
        User.findOne({ usernameNormalized: friendshipRequested })
          .then(user => {
            if (user) {
              //save action
              const action = new UserAction({
                userIdActionDoer: friendshipRequester._id,
                actionType: "friendship_request_sent"
              });
              action.save();

              //save request
              // userExists = true;
              userRequested = user;
              let resetUser = user;
              resetUser.friendshipRequestReceived.push({
                userId: friendshipRequester.id,
                username: friendshipRequester.username,
                usernameNormalized: friendshipRequester.usernameNormalized
              });
              return resetUser.save();
            }
          })
          .then(result => {
            if (result) {
              return User.findById(friendshipRequester.id);
            }
          })
          .then(user => {
            if (user) {
              let resetUser = user;

              resetUser.friendshipRequestSent.push({
                userId: userRequested.id,
                username: userRequested.username,
                usernameNormalized: userRequested.usernameNormalized
              });
              return resetUser.save();
            }
          })
          .then(result => {
            if (result) {
              return res.json({ requestSend: "OK", msg: "Solicitud enviada" });
            }
            return result;
          })
          .then(result => {
            //ws
            if (result) {
              // sending to individual socketid (private message)
              const receiverSocket = usernameSocketWs.get(friendshipRequested);
              if (receiverSocket !== undefined) {
                //send msg
                const newFriendshipNum = {
                  newFriendshipRequest: 1
                };
                req.io
                  .to(receiverSocket.id)
                  .emit(
                    "newFriendshipRequestsNumber",
                    JSON.stringify(newFriendshipNum)
                  );
              }
            }
          })
          .catch(err => {
            console.log(err);
          });
      }
    })
    .catch(err => {});
};

exports.postCancelSentFriendshipRequest = (req, res, next) => {
  const usernameNormalized = req.body.usernameNormalized;
  const userDoer = req.user;

  //Esto es valido para: cancel, accept y reject
  //1.No hace falta comprobar si los 2 users son el mismo user, porque
  //un user no puede enviarse a si mismo una solicitud de amistad,
  //por lo que no estara nunca en sus propios arrays de Received ni Sent

  //2.No hace falta comprobar si el user existe
  //porque para meter en el array de Received se comprueba
  //que ese usuarios existe, si se mete en el array de Received es porque existe
  //el usuario
  //Puede ocurrir que un usuario que existia a recibido una solicitud de amistad
  //y ha borrado su cuenta
  //Cuando un usuario borra su cuenta, se borran sus datos de los arrays
  //Sent en donde este, ademas de su array Received
  //Al user que solicita la amistad se le podria notificar que el otro usuario ha borrado su cuenta
  //cuando este la borre

  checkOperationIsValid(req, 2, usernameNormalized)
    .then(result => {
      if (result !== "") {
        //no permitir realizar operacion
        console.log(1);
        return res.json({ requestSend: "operationNotAllowed", msg: result });
      } else {
        // realizar operacion
        //quitar de sent y de received
        User.updateOne(
          //received
          { usernameNormalized: usernameNormalized },
          { $pull: { friendshipRequestReceived: { userId: userDoer.id } } }
        )
          .then(result => {
            //sent
            if (result.nModified === 1) {
              return User.updateOne(
                { _id: userDoer.id },
                {
                  $pull: {
                    friendshipRequestSent: {
                      usernameNormalized: usernameNormalized
                    }
                  }
                }
              );
            }
          })
          .then(result => {
            if (result.nModified === 1) {
              res.json({
                requestSend: "OK",
                msg: "Solicitud de amistad cancelada con exito"
              });
            }
            return result;
          })
          .then(result => {
            //ws
            if (result) {
              // sending to individual socketid (private message)
              const receiverSocket = usernameSocketWs.get(usernameNormalized);
              if (receiverSocket !== undefined) {
                //send msg
                const newFriendshipNum = {
                  newFriendshipRequest: -1
                };
                req.io
                  .to(receiverSocket.id)
                  .emit(
                    "newFriendshipRequestsNumber",
                    JSON.stringify(newFriendshipNum)
                  );
              }
            }
          })
          .catch(err => {});
      }
    })
    .catch(err => {});
};

exports.getFriendshipRequests = async (req, res, next) => {
  const option = req.params.option; // /send

  if (option === "send") {
    let friendshipRequestsSent = [];

    try {
      const frsend = await User.findById(req.user.id)
        .select("friendshipRequestSent -_id")
        .lean();

      for (const value of frsend.friendshipRequestSent) {
        //query db
        let user = await User.findOne({
          usernameNormalized: value.usernameNormalized
        })
          .select("imageURL -_id")
          .lean();

        //add image url to the array object
        let objUser = value;
        objUser["imageURL"] = user.imageURL.toString();
        friendshipRequestsSent.push(objUser);
      }
    } catch (err) {}

    return res.render("users/friendship-requests", {
      pageTitle: "Friendship requests",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      usernameNormalized: req.user.usernameNormalized,
      errorMessage: "",
      option: "send",
      friendshipRequestsSent: friendshipRequestsSent
    });
  } else if (option === "received") {
    //default option
    let friendshipRequestsReceived = [];

    try {
      const frreceived = await User.findById(req.user.id)
        .select("friendshipRequestReceived -_id")
        .lean();

      for (const value of frreceived.friendshipRequestReceived) {
        //query db
        let user = await User.findOne({
          usernameNormalized: value.usernameNormalized
        })
          .select("imageURL -_id")
          .lean();

        //add image url to the array object
        let objUser = value;
        objUser["imageURL"] = user.imageURL.toString();
        friendshipRequestsReceived.push(objUser);
      }
    } catch (err) {}

    return res.render("users/friendship-requests", {
      pageTitle: "Friendship requests",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      usernameNormalized: req.user.usernameNormalized,
      errorMessage: "",
      option: "received",
      friendshipRequestsReceived: friendshipRequestsReceived
    });
  } else {
    //if parameter does not exist
    //404
    res.status(404).render("404", {
      pageTitle: "Page Not Found",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      usernameNormalized: req.user.usernameNormalized
    });
  }
};

exports.postAcceptFriendshipRequest = async (req, res, next) => {
  const usernameNormalized = req.body.usernameNormalized;
  //const userDoer = req.user;
  console.log("u" + usernameNormalized);

  //Si modifican el username y pasan uno que no existe:
  //si no existe ese user en la db o no le ha mandado ese una request de amistad,
  //en ambos casos no se encontrara en el array de sent, asi que no se hace ningun update de document
  try {
    const result = await checkOperationIsValid(req, 3, usernameNormalized);
    if (result !== "") {
      //no permitir realizar operacion
      return res.json({ requestSend: "operationNotAllowed", msg: result });
    } else {
      //6 chained then block containing each one an async coperation
      //pasar de sent a friends

      let userRequester;

      const result1 = await User.updateOne(
        { usernameNormalized: usernameNormalized },
        { $pull: { friendshipRequestSent: { userId: req.user.id } } }
      );

      if (result1.nModified === 1) {
        const user1 = await User.findOne({
          usernameNormalized: usernameNormalized
        });

        if (user1) {
          userRequester = user1;
          let resetUser1 = user1;
          resetUser1.friends.push({
            userId: req.user.id,
            username: req.user.username,
            usernameNormalized: req.user.usernameNormalized
          });
          await resetUser1.save();

          //if both user chatted before (they were friends, stopped being friends, and now the become friends again)
          await User.updateOne(
            {
              usernameNormalized: usernameNormalized,
              "chatConversationsList.usernameNormalizedFriend":
                req.user.usernameNormalized
            },
            { "chatConversationsList.$.isFriendCurrently": true }
          );
        }

        //pasar de received a friends
        const result2 = await User.updateOne(
          { _id: req.user.id },
          { $pull: { friendshipRequestReceived: { userId: user1.id } } }
        );

        if (result2.nModified === 1) {
          const user2 = await User.findById(req.user.id);

          if (user2) {
            let resetUser2 = user2;
            resetUser2.friends.push({
              userId: userRequester.id,
              username: userRequester.username,
              usernameNormalized: userRequester.usernameNormalized
            });
            await resetUser2.save();

            await User.updateOne(
              {
                usernameNormalized: req.user.usernameNormalized,
                "chatConversationsList.usernameNormalizedFriend": usernameNormalized
              },
              { "chatConversationsList.$.isFriendCurrently": true }
            );

            //send response a quien ha hecho la HTTP req JSON para quitar del DOM la card
            return res.json({
              requestSend: "OK",
              msg: "La solicitud de amistad se ha aceptado con exito"
            });
          }
        }
      }
    }
  } catch (err) {}
};

exports.postRejectFriendshipRequest = (req, res, next) => {
  const usernameNormalized = req.body.usernameNormalized;

  checkOperationIsValid(req, 4, usernameNormalized)
    .then(result => {
      if (result !== "") {
        //no permitir realizar operacion
        return res.json({ requestSend: "operationNotAllowed", msg: result });
      } else {
        //quitar de sent y de received
        User.updateOne(
          //sent
          { usernameNormalized: usernameNormalized },
          { $pull: { friendshipRequestSent: { userId: req.user.id } } }
        )
          .then(result => {
            //received
            if (result.nModified === 1) {
              return User.updateOne(
                { _id: req.user.id },
                {
                  $pull: {
                    friendshipRequestReceived: {
                      usernameNormalized: usernameNormalized
                    }
                  }
                }
              );
            }
          })
          .then(result => {
            if (result.nModified === 1) {
              return res.json({
                requestSend: "OK",
                msg: "La solicitud de amistad ha sido rechazada con exito"
              });
            }
          })
          .catch(err => {});
      }
    })
    .catch(err => {});
};

exports.getBlockedUsers = async (req, res, next) => {
  let blockedUsers = [];
  try {
    const friendship = await getUserFriendshipsStatus(req);

    for (const value of friendship.blockedUsers) {
      //query db
      let user = await User.findOne({
        usernameNormalized: value.usernameNormalized
      })
        .select("imageURL status -_id")
        .lean();

      //add image url to the array object
      let objUser = value;
      objUser["imageURL"] = user.imageURL.toString();
      objUser["status"] = user.status;
      blockedUsers.push(objUser);
    }
    console.log(blockedUsers);

    return res.render("users/blocked-users", {
      pageTitle: "Blocked Users",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      usernameNormalized: req.user.usernameNormalized,
      //registrationMethod: registrationMethod(req),
      friends: friendship.friends,
      blockedUsers: blockedUsers
    });
  } catch (err) {}
};

exports.postBlockUser = async (req, res, next) => {
  const usernameNormalizedBlockedUser = req.body.usernameNormalized; //user blocked
  const userDoer = req.user; //user blocker

  //check if operation is allowed

  //A user can not block himself
  if (checkUserIsTheSame(userDoer, usernameNormalizedBlockedUser)) {
    return res.json({
      requestSend: "NotAllowed",
      msg: "You can not block yourself"
    });
  }

  try {
    //A user with that username must exist
    if (!(await checkUserExists(usernameNormalizedBlockedUser))) {
      return res.json({
        requestSend: "operationNotAllowed",
        msg: "No existe un usuario con ese nombre"
      });
    }

    const result = await checkOperationIsValid(
      req,
      5,
      usernameNormalizedBlockedUser
    );

    if (result !== "") {
      //no permitir realizar operacion
      return res.json({ requestSend: "operationNotAllowed", msg: result });
    } else {
      // realizar operacion
      const user1 = await User.findOne({
        usernameNormalized: usernameNormalizedBlockedUser
      });
      //user2 siempre va a existir porque es quien hace la request
      const user2 = await User.updateOne(
        { _id: userDoer.id },
        {
          $push: {
            blockedUsers: {
              userId: user1.id,
              username: user1.username,
              usernameNormalized: user1.usernameNormalized
            }
          }
        }
      );

      await User.updateOne(
        {
          usernameNormalized: userDoer.usernameNormalized,
          "chatConversationsList.usernameNormalizedFriend":
            user1.usernameNormalized
        },
        {
          "chatConversationsList.$.isBlocked": true
        }
      );

      if (user2) {
        return res.json({ requestSend: "OK", msg: "Usuario bloqueado" });
      }
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postUnblockUser = async (req, res, next) => {
  const usernameNormalizedUnblockedUser = req.body.usernameNormalized; //user unblocked
  const userDoer = req.user; //user unblocker

  //check if operation is allowed

  //check1
  //A user can not unblock himself
  if (checkUserIsTheSame(userDoer, usernameNormalizedUnblockedUser)) {
    return res.json({
      requestSend: "NotAllowed",
      msg: "You can not unblock yourself"
    });
  }

  //promises
  // checkOperationIsValid(req, 6, usernameNormalizedUnblockedUser)
  //   .then(result => {
  //     if (result !== "") {
  //       //no permitir realizar operacion
  //       return res.json({ requestSend: "operationNotAllowed", msg: result });
  //     } else {
  //       // realizar operacion
  //       User.findOne({ usernameNormalized: usernameNormalizedUnblockedUser })
  //         .then(user => {
  //             if(user){
  //              return User.updateOne(
  //                 { _id: userDoer.id },
  //                 {
  //                  $pull: {
  //                    blockedUsers: {
  //                      userId: user.id,
  //                      username: user.username,
  //                      usernameNormalized: user.usernameNormalized
  //                    }
  //                  }
  //                }
  //               );
  //            }else{
  //              res.json{ requestSend: "operationNotAllowed", msg: "No existe usuario con ese nombre" });
  //             }
  //         })
  //         .then(user => {
  //           return res.json({ requestSend: "OK", msg: "Usuario desbloqueado" });
  //         })
  //         .catch(err => {});
  //   }
  // })
  // .catch(err => {});

  //async-await
  try {
    //check2
    //A user with that username must exist
    if (!(await checkUserExists(usernameNormalizedUnblockedUser))) {
      return res.json({
        requestSend: "operationNotAllowed",
        msg: "No existe un usuario con ese nombre"
      });
    }

    //check3
    const result = await checkOperationIsValid(
      req,
      6,
      usernameNormalizedUnblockedUser
    );

    if (result !== "") {
      //no permitir realizar operacion
      return res.json({ requestSend: "operationNotAllowed", msg: result });
    } else {
      // realizar operacion
      //user1 exists otherwise we would have send a response previously with an error msg
      const user1 = await User.findOne({
        usernameNormalized: usernameNormalizedUnblockedUser
      });

      //user2 siempre va a existir porque es quien hace la request
      const user2 = await User.updateOne(
        { _id: userDoer.id },
        {
          $pull: {
            blockedUsers: {
              userId: user1.id,
              username: user1.username,
              usernameNormalized: user1.usernameNormalized
            }
          }
        }
      );

      await User.updateOne(
        {
          usernameNormalized: userDoer.usernameNormalized,
          "chatConversationsList.usernameNormalizedFriend":
            user1.usernameNormalized
        },
        {
          "chatConversationsList.$.isBlocked": false
        }
      );

      if (user2) {
        return res.json({ requestSend: "OK", msg: "Usuario desbloqueado" });
      }
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postEndFriendship = async (req, res, next) => {
  const usernameNormalizedUser = req.body.usernameNormalized;
  const userDoer = req.user;

  //check if operation is allowed

  //A user can not end friendship with himself
  if (checkUserIsTheSame(userDoer, usernameNormalizedUser)) {
    return res.json({
      requestSend: "NotAllowed",
      msg: "You can not end frienship with yourself"
    });
  }

  try {
    //A user with that username must exist
    if (!(await checkUserExists(usernameNormalizedUser))) {
      return res.json({
        requestSend: "operationNotAllowed",
        msg: "No existe un usuario con ese nombre"
      });
    }
    const result = await checkOperationIsValid(req, 8, usernameNormalizedUser);

    if (result !== "") {
      //no permitir realizar operacion
      return res.json({ requestSend: "operationNotAllowed", msg: result });
    } else {
      // realizar operacion
      //quitar de la db 2 documents de friends uno en cada users
      const user = await User.findOne({
        usernameNormalized: usernameNormalizedUser
      });

      if (user) {
        const user1Update = await User.updateOne(
          { _id: userDoer.id },
          {
            $pull: {
              friends: {
                userId: user.id,
                username: user.username,
                usernameNormalized: user.usernameNormalized
              }
            }
          }
        );

        await User.updateOne(
          {
            usernameNormalized: userDoer.usernameNormalized,
            "chatConversationsList.usernameNormalizedFriend":
              user.usernameNormalized
          },
          { "chatConversationsList.$.isFriendCurrently": false }
        );

        const user2Update = await User.updateOne(
          { _id: user.id },
          {
            $pull: {
              friends: {
                userId: userDoer.id,
                username: userDoer.username,
                usernameNormalized: userDoer.usernameNormalized
              }
            }
          }
        );

        await User.updateOne(
          {
            usernameNormalized: user.usernameNormalized,
            "chatConversationsList.usernameNormalizedFriend":
              userDoer.usernameNormalized
          },
          { "chatConversationsList.$.isFriendCurrently": false }
        );

        if (user1Update && user2Update) {
          return res.json({
            requestSend: "OK",
            msg: "Finalizada amistad con el usuario"
          });
        }
      }
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postEndFriendshipBlock = async (req, res, next) => {
  const usernameNormalizedUser = req.body.usernameNormalized;
  const userDoer = req.user;
  console.log(usernameNormalizedUser);
  console.log(userDoer);

  //check if operation is allowed

  //A user can not end friendship with himself
  if (checkUserIsTheSame(userDoer, usernameNormalizedUser)) {
    return res.json({
      requestSend: "NotAllowed",
      msg: "You can not end frienship with yourself"
    });
  }

  try {
    //A user with that username must exist
    if (!(await checkUserExists(usernameNormalizedUser))) {
      return res.json({
        requestSend: "operationNotAllowed",
        msg: "No existe un usuario con ese nombre"
      });
    }

    const result = await checkOperationIsValid(req, 7, usernameNormalizedUser);

    if (result !== "") {
      //no permitir realizar operacion
      return res.json({ requestSend: "operationNotAllowed", msg: result });
    } else {
      // realizar operacion
      //quitar de la db 2 documents de friends uno en cada users
      const user = await User.findOne({
        usernameNormalized: usernameNormalizedUser
      });

      if (user) {
        const user1Update = await User.updateOne(
          { _id: userDoer.id },
          {
            $pull: {
              friends: {
                userId: user.id,
                username: user.username,
                usernameNormalized: user.usernameNormalized
              }
            }
          }
        );

        await User.updateOne(
          {
            usernameNormalized: userDoer.usernameNormalized,
            "chatConversationsList.usernameNormalizedFriend":
              user.usernameNormalized
          },
          {
            "chatConversationsList.$.isFriendCurrently": false,
            "chatConversationsList.$.isBlocked": true
          }
        );

        const user2Update = await User.updateOne(
          { _id: user.id },
          {
            $pull: {
              friends: {
                userId: userDoer.id,
                username: userDoer.username,
                usernameNormalized: userDoer.usernameNormalized
              }
            }
          }
        );

        await User.updateOne(
          {
            usernameNormalized: user.usernameNormalized,
            "chatConversationsList.usernameNormalizedFriend":
              userDoer.usernameNormalized
          },
          {
            "chatConversationsList.$.isFriendCurrently": false
          }
        );

        const user3Update = await User.updateOne(
          { _id: userDoer.id },
          {
            $push: {
              blockedUsers: {
                userId: user.id,
                username: user.username,
                usernameNormalized: user.usernameNormalized
              }
            }
          }
        );

        if (user1Update && user2Update && user3Update) {
          return res.json({
            requestSend: "OK",
            msg: "Finalizada amistad con el usuario y bloqueado"
          });
        }
      }
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//Chat
exports.getUserChat = async (req, res, next) => {
  let friendsChated = [];

  const usernameNormalizedFriend = req.params.username;
  console.log(usernameNormalizedFriend);

  let startChatWithUserUsername = "";
  let startChatWithUserUsernameNormalized = "";
  let startChatWithUserImageUrl = "";
  let startChatWithUserStatus = "";

  try {
    //throw new Error("Error!");
    let isFriend = false;
    let chatedWithHimBefore = false;

    //si pasan un usernameNormalized como param
    if (usernameNormalizedFriend) {
      //compruebo si ese user es amigo (aunque este bloqueado)
      isFriend = await isFriendOfCurrentUserUsingUsernameNormalized(
        req.user,
        usernameNormalizedFriend
      );

      //Para ponerlo en el dom en input hidden y que pueda iniciar chat con el al cargar el chat
      if (isFriend) {
        startChatWithUserUsernameNormalized = usernameNormalizedFriend;
      }
    }

    //obtener todos los users con los que ha chateado previamente
    const userChat = await User.findById(req.user.id)
      .select("chatConversationsList -_id")
      .lean();

    //comprobar si ha chateado previamente con ese user (aunque ya no sea amigo)
    for (const userChated of userChat.chatConversationsList) {
      if (userChated.usernameNormalizedFriend === usernameNormalizedFriend) {
        chatedWithHimBefore = true;
      }
    }

    if (chatedWithHimBefore) {
      //sea el user actualmente amigo o no, tambien tendre que abrir su chat
      //si ese user ya esta en chat list, no hace falta pasar imgurl ni username (porque ya los sabra),
      //solo hara falta usernameNormalized, para que abra su chat
      startChatWithUserUsernameNormalized = usernameNormalizedFriend;
    } else if (isFriend && !chatedWithHimBefore) {
      //query para obtener data de ese amigo por que hara falta crear el div de user,
      //solo si no ha chateado antes con el y es amigo,
      //ya que si no es amigo y no ha chateado antes con el no le tengo que mostrar/cargar nada
      //obtengo username y imgurl para ese amigo
      const userFriend = await User.findOne({
        usernameNormalized: usernameNormalizedFriend
      })
        .select("username imageURL status -_id")
        .lean();
      //ya esta puesto de cuando compruebo si es friend
      //startChatWithUserUsernameNormalized = usernameNormalizedFriend;

      if (userFriend) {
        startChatWithUserImageUrl = userFriend.imageURL;
        startChatWithUserUsername = userFriend.username;
        startChatWithUserStatus = userFriend.status;
      }
    }

    //para todos los users con los que ha chateado obtener su foto y su estado
    if (userChat) {
      for (const value of userChat.chatConversationsList) {
        //para cada user con los que ha chateado, obtengo su img
        let user = await User.findOne({
          usernameNormalized: value.usernameNormalizedFriend
        })
          .select("imageURL status -_id")
          .lean();

        //add image url to the array object
        let objUser = value;
        if (user) {
          objUser["imageURL"] = user.imageURL.toString();
          objUser["status"] = user.status;
        } else {
          objUser["imageURL"] = "";
          objUser["status"] = "";
        }
        friendsChated.push(objUser);
      }
    }
  } catch (err) {
    // console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }

  return res.render("users/chat", {
    pageTitle: "Chat",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req),
    registrationMethod: registrationMethod(req),
    usernameNormalized: req.user.usernameNormalized,
    chatConversations: friendsChated.reverse(), //req.user.friends,
    startChatWithUserUsernameNormalized: startChatWithUserUsernameNormalized,
    startChatWithUserUsername: startChatWithUserUsername,
    startChatWithUserImageUrl: startChatWithUserImageUrl,
    startChatWithUserStatus: startChatWithUserStatus
    //errorMessage: ""
  });
};

exports.postLoadChat = async (req, res, next) => {
  const sender = req.user.usernameNormalized;
  const receiver = req.body.usernameNormalized;
  const limit = req.body.limit;
  const lastTime = req.body.lastTime;

  //validation
  const errors = validationResult(req);
  let errorsMessages = [];
  //pasar los mensajes que devuelve la funcion al array errorsMessages
  if (!errors.isEmpty()) {
    //mapped: Gets the first validation error of each failed field in the form of an object.
    errorsMessages = errorMessagesValidator.getErrorsMessages(errors.mapped());
    return res.status(422).json({
      error: errorsMessages
    });
  }
  //No valido el formato del receiver, si no lo encuentra pues no manda msg con el
  //No tengo que validar si son amigos, porque cuando le escribio el msg ya se valido eso

  //aqui no tiene que pasar las validaciones como en index
  //si estan an la db es que han pasado las validaciones cuando se han guardado en la db

  //const limit = 10;
  //const startIndex = (page - 1) * limit;

  // console.log(lastTime);
  // console.log(typeof lastTime);

  let t;
  if (lastTime === "") {
    //La primera vez no habra elementos en el DOM, por lo que no habra elementos con una date
    //cuando abre y carga un chat vez no pasa ninguna date (pasa "")
    //si no pasa ninguna date, se cargue desde la fecha actual

    t = getCurrentTimeUTC();
  } else {
    t = convertDateStringToObject(lastTime);
    // console.log(t);
    // console.log(lastTime);
    // console.log(typeof t);
    // console.log(typeof lastTime);
  }

  // const numMessagesUnread = await Chat.countDocuments({
  //   sender: { $in: [sender, receiver] },
  //   receiver: { $in: [sender, receiver] },
  //   read: false,
  //   date: { $lt: t }
  // });

  //Si he enviado un msg, significa que he leido los anteriores msg que he recibo antes de ese msg
  //Es decir, hasta que haya uno que haya enviado yo
  const numMessagesForMeUnread = await Chat.countDocuments({
    "sender.usernameNormalized": receiver,
    "receiver.usernameNormalized": sender,
    read: false,
    date: { $lt: t }
  });

  let limitMsg;
  if (limit === 10) {
    //si quiero cargar msg anteriores ya leidos usando el scroll
    //cargo msg enviados y recibidos
    limitMsg = limit;
  } else {
    if (numMessagesForMeUnread > 20) {
      //cuando abro chat y tengo mas de 20 msg recibidos sin leer
      //cargo msg recibidos
      limitMsg = numMessagesForMeUnread + 1;
    } else {
      //cuando abro chat y tengo 20 o menos msg recibidos sin leer
      //cargo msg enviados y recibidos
      limitMsg = 20;
    }
  }

  //pagination
  const messages = await Chat.find({
    "sender.usernameNormalized": { $in: [sender, receiver] },
    "receiver.usernameNormalized": { $in: [sender, receiver] },
    $or: [
      { showOnlyToSender: false },
      { showOnlyToSender: true, "sender.usernameNormalized": sender } //the user who wants to load the message is the user who sent that message
    ],
    date: { $lt: t }
  })
    .select(
      "msgText sender.usernameNormalized receiver.usernameNormalized date read -_id"
    )
    .limit(limitMsg) //si no hay tantos, coge los que haya
    //.skip(startIndex)
    .sort({ date: -1 });

  let msgList = [];
  messages.forEach(msg => {
    const obj = {
      sender: msg.sender.usernameNormalized,
      receiver: msg.receiver.usernameNormalized,
      read: msg.read,
      msgText: msg.msgText,
      date: msg.date
    };
    msgList.push(obj);
  });

  res.status(200).json(msgList);
};

exports.postSetUserMsgRead = async (req, res, next) => {
  const usernameSender = req.body.usernameNormalized;
  const usernameReceiver = req.user.usernameNormalized;
  //pongo todos los msg que tengan ese receiver y ese sender como leidos
  const result = await Chat.updateMany(
    {
      "sender.usernameNormalized": usernameSender,
      "receiver.usernameNormalized": usernameReceiver,
      read: false
    },
    { read: true }
  );
  //console.log("r " + result.n);

  //send msg read confirmation to msg sender
  const wsMsgSender = usernameSocketWs.get(usernameSender);
  console.log(wsMsgSender);
  if (wsMsgSender) {
    req.io
      .to(wsMsgSender.id)
      .emit(
        "confirmMsgHasBeenRead",
        JSON.stringify({ msgText: "confirm", msgReceiver: usernameReceiver })
      );
  }

  return res.json({ msg: "operacion realizada" });
};

exports.postGetImgName = async (req, res, next) => {
  const usernameNormalized = req.body.usernameNormalized;
  //pongo todos los msg que tengan ese receiver y ese sender como leidos
  const result = await User.findOne({
    usernameNormalized: usernameNormalized
  }).select("imageURL status -_id");

  let status = "not-online";
  if (result.status === "online") {
    status = "online";
  }
  return res.json({ imageName: result.imageURL, status: status });
};

//call
exports.getCall = async (req, res, next) => {
  const usernameNormalizedFriend = req.params.username;
  const opt = req.params.opt;
  console.log(usernameNormalizedFriend);
  console.log(opt);

  //get image
  const userImage = await User.findOne({
    usernameNormalized: usernameNormalizedFriend
  }).select("imageURL -_id");

  return res.render("users/call", {
    pageTitle: "Call",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req),
    registrationMethod: registrationMethod(req),
    usernameNormalized: req.user.usernameNormalized,
    opt: opt,
    usernameNormalizedFriend: usernameNormalizedFriend,
    userImage: userImage.imageURL,
    stunTurnServers: JSON.stringify(keys.stunTurnServers)
  });
};

//Notifications
exports.getNotifications = (req, res, next) => {
  return res.render("users/notifications", {
    pageTitle: "Notifications",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req),
    registrationMethod: registrationMethod(req),
    usernameNormalized: req.user.usernameNormalized
    //errorMessage: ""
  });
};
