//core modules
const crypto = require("crypto");
const fs = require("fs");
const { promisify } = require("util");

//3rd party modules
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { validationResult } = require("express-validator");
const validator = require("validator");
// const createDOMPurify = require("dompurify");
// const { JSDOM } = require("jsdom");

// const window = new JSDOM("").window;
// const DOMPurify = createDOMPurify(window);

//const clean = DOMPurify.sanitize(dirty);

//imports
const User = require("../models/user");
const UserAction = require("../models/userAction");
const DeletedAccount = require("../models/deletedAccount");

const keys = require("../config/keys");
const { messageErrorShow, messageSuccessShow } = require("../helpers/messages");
const errorMessagesValidator = require("../helpers/errorsMessagesValidator");
//const validatePassword = require("../helpers/passwordValidation");

const {
  identifyLoginMethod,
  registrationMethod,
  isProfileCreated
} = require("../helpers/auth");

const { calculateTodayDate } = require("../helpers/moment");

const { transporter } = require("../helpers/awsEmail");

//Register using email and password
exports.getRegisterUser = (req, res, next) => {
  res.render("auth/register", {
    pageTitle: "Register",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req),
    registrationMethod: registrationMethod(req),
    errorMessage: messageErrorShow(req.flash("error_message")),
    oldInput: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  });
};

exports.postRegisterUser = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  //let errorsMessages;
  //validate password
  //var passwordValidationResult = validatePassword.validatePassword(password);
  //console.log(passwordValidationResult);

  const errors = validationResult(req);
  //pasar el mensaje que devuelve la funcion al array errorsMessages
  if (!errors.isEmpty()) {
    let errorsMessages = errorMessagesValidator.getErrorsMessages(
      errors.mapped()
    );

    //errors.array(): devuelve un array de objetos con todos los mensajes de error
    //errors.mapped(): devuelve un objeto de objetos con el primer error de cada campo y no todos los errores de cada campo

    return res.status(422).render("auth/register", {
      pageTitle: "Register",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      errorMessage: messageErrorShow(errorsMessages), //errors.array(), //errors.mapped()
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword
      }
    });
  }

  //generate token
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      req.flash("error", "An error ocurred, please try again");
      return res.redirect("/register");
    }
    const token = buffer.toString("hex");

    //Check if there is already an user registered with that email address
    // User.findOne({ email: req.body.email }).then(user => {
    //   if (user) {
    //     req.flash("error_message", "Email already registered");
    //     return res.redirect("/register");
    //   } else {
    //     //hash password using bcrypt
    //     return

    //hash password
    bcrypt
      .hash(password, 12)
      .then(hashedPassword => {
        const user = new User({
          //username: "name",
          email: validator.normalizeEmail(email),
          password: hashedPassword,
          role: "user",
          status: "profile_not_created",
          confirmEmailToken: token,
          confirmEmailTokenExpiration: Date.now() + 172800000 //token valid for 2 days
        });
        //here all validations are correct
        //normalize email only when all validations are correct, otherwise if email is not valid it adds
        //a @ symbol and returns it back to the client in the email form input
        return user.save();
      })
      .then(result => {
        //save action
        if (result) {
          const action = new UserAction({
            userIdActionDoer: result._id,
            actionType: "user_registration",
            strategy: "email"
          });
          action.save();
        }
        return result;
      })
      .then(result => {
        if (result) {
          //throw new Error("error");
          req.flash(
            "success_message",
            "You are now registered. We have send you an email to verify your email address"
          );
          res.redirect("/");

          if (keys.send_email_allowed) {
            transporter.sendMail({
              from: "appeuskara@gmail.com",
              to: email,
              subject: "Welcome to app Euskara",
              html: `
            <p>Welcome to app Euskara</p>
            <p>This link will be valid for 2 days, if expired request a new one trying to login</p>
            <p>Click this <a href="${keys.domain}/confirmemail/${token}/${email}">link</a> to confirm your email address</p>
            <p>If you didn't request this email, please ignore it</p>`,
              ses: {}
            });
          }
        }
      })
      .catch(err => {
        // console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error); //Skip all the middlewares and go directly to the error middleware
      });
  });

  //   }
  // });
};

//confirm email after registering using email: get token and check if it is valid
exports.getConfirmEmail = (req, res, next) => {
  const email = req.params.email;
  const token = req.params.token;
  console.log(email + token);

  User.findOne({
    email: email,
    confirmEmailToken: token,
    confirmEmailTokenExpiration: { $gt: Date.now() },
    status: "profile_not_created"
  })
    .then(user => {
      console.log(user);
      if (!user) {
        //si la query no devuelve un user, ya que no encuentra un user con ese token y fecha de expiracion
        req.flash(
          "error",
          `El token no es válido o ha expirado. <a class="link-err-msg" href="/resend-email-confirmation/${email}"> Volver a enviar email de confirmacion</a>`
        );
        return res.redirect("/");
      } else {
        //remove keys from document
        user.confirmEmailToken = undefined;
        user.confirmEmailTokenExpiration = undefined;
        user.save();
        //redirect
        req.flash(
          "success_message",
          "Su direccion de email ha sido confirmada"
        );
        //dar opcion de volver a crear un token
        return res.redirect("/");
      }
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//send email again
exports.getResendEmailConfirmationEmail = (req, res, next) => {
  //solo envio el email si tiene en la db esas keys
  const email = req.params.email;
  let token;

  User.findOne({
    email: email,
    confirmEmailToken: { $exists: true, $ne: null },
    status: "profile_not_created"
  })
    .then(user => {
      if (user) {
        crypto.randomBytes(32, (err, buffer) => {
          if (err) {
            req.flash("error", "An error ocurred, please try again");
            return res.redirect("/register");
          }
          token = buffer.toString("hex");
          user.confirmEmailToken = token;
          user.confirmEmailTokenExpiration = Date.now() + 172800000; //token valid for 2 days
          user.save();

          //send email
          if (keys.send_email_allowed) {
            transporter.sendMail({
              from: "appeuskara@gmail.com",
              to: email,
              subject: "Verify your email address",
              html: `
      <p>Verify your email address</p>
      <p>This link will be valid for 2 days, if expired request a new one trying to login</p>
      <p>Click this <a href="${keys.domain}/confirmemail/${token}/${email}">link</a> to confirm your email address</p>
      <p>If you didn't request this email, please ignore it</p>`,
              ses: {}
            });
          }
        });
      }

      //enviar response
      req.flash(
        "success_message",
        `Si existe una cuenta sin verificar para ${email}, se le ha enviado un email para que confirme su direccion de email`
      );
      return res.redirect("/");
    })
    .catch(err => {
      // console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//Login
exports.getLoginUser = (req, res, next) => {
  // const errorMsg = messages.messageErrorShow(req);
  // const successMsg = messages.messageSuccessShow(req);
  // console.log(req.isAuthenticated);

  res.render("auth/login", {
    pageTitle: "Login",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req),
    registrationMethod: registrationMethod(req),
    errorMessage: messageErrorShow(req.flash("error")), ////poner error, no poner error-message, si no los msg de passport no se muestran
    successMessage: messageSuccessShow(req.flash("success_message")),
    loginMsg: "Login",
    closeSessionInput: false,
    logout: false,
    oldInput: {
      email: "",
      password: ""
    }
  });
};

exports.postLoginUser = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const closeSession = req.body.closeSession;
  const timezone = req.body.timezone;

  const errors = validationResult(req);
  let errorsMessages;
  if (!errors.isEmpty()) {
    errorsMessages = errorMessagesValidator.getErrorsMessages(errors.mapped());
    res.status(422);
    //console.log(errorsMessages);
  } else {
    errorsMessages = ["Invalid credentials"];
  }

  //console.log(req.body);
  // passport.authenticate("local", {
  //   successRedirect: "users/menu",
  //   failureRedirect: "/",
  //   failureFlash: "Invalid username or password" //true
  //   // successFlash: true
  // })(req, res, next);

  //passport custom callback, instead of the built-in options
  //in order to return back the form input values and show failed validation messages
  //(I validate email and password using express-validator)
  passport.authenticate("user-local", function(err, user, info) {
    if (err) {
      return next(err);
    }

    if (!user) {
      if (info.message === "EmailNotVerified") {
        errorsMessages = [
          `Verify your email clicking in the link we sent you. <a class="link-err-msg" href="/resend-email-confirmation/${info.email}"> Volver a enviar email de confirmacion</a>`
        ];
      } else if (info.message === "Banned") {
        errorsMessages = [
          "You have been banned.",
          `You will be unbanned at ${info.unbanningDate[0]} (${info.unbanningDate[1]}).`
        ];
      }

      return res.render("auth/login", {
        pageTitle: "Login",
        isAuthenticated: false,
        isProfileCreated: isProfileCreated(req),
        registrationMethod: registrationMethod(req),
        errorMessage: messageErrorShow(errorsMessages), //
        successMessage: "",
        loginMsg: "Login",
        closeSessionInput: false,
        logout: false,
        oldInput: {
          email: email,
          password: password
        }
      });
    }

    //get all sessions
    const sessions = req.sessionStore.sessions;

    req.logIn(user, async function(err) {
      //successful login
      //establish a session
      if (err) {
        return next(err);
      }

      const passportSession = req.session.passport.user;
      if (closeSession === "true") {
        keysSessions = Object.keys(sessions);
        keysSessions.forEach(key => {
          const valueSession = JSON.parse(sessions[key]);
          if (
            valueSession.passport &&
            valueSession.passport.user == passportSession
          ) {
            //close user old session (open session in another browser)
            req.sessionStore.destroy(key);
          }
        });
      } else {
        for (let [key, value] of Object.entries(sessions)) {
          const objValue = JSON.parse(value);
          if (objValue.passport) {
            if (passportSession === objValue.passport.user) {
              //close user new session
              req.session.destroy();

              //send login page with popup o flash message
              return res.render("auth/login", {
                pageTitle: "Login",
                isAuthenticated: false,
                isProfileCreated: false,
                registrationMethod: registrationMethod(req),
                errorMessage: [
                  "A session already exists for that user",
                  "If you login that session wil be closed"
                ],
                successMessage: "",
                loginMsg: "Login de todas formas",
                closeSessionInput: true,
                logout: false,
                oldInput: {
                  email: email,
                  password: password
                }
              });
            }
          }
        }
      }

      const action = new UserAction({
        userIdActionDoer: user._id,
        actionType: "user_signingin",
        strategy: "email"
      });
      action.save();

      await User.updateOne(
        {
          _id: req.user.id
        },
        { timezone: timezone }
      );

      //para socketio
      if (
        req.user.status === "profile_created" ||
        req.user.status === "online"
      ) {
        cookieUsernameWs.set(req.session.id, req.user.usernameNormalized); //map sessionId with username
        if (req.user.status === "profile_created") {
          await User.updateOne(
            {
              usernameNormalized: req.user.usernameNormalized,
              status: { $ne: "online" }
            },
            { status: "online" }
          );
        }
      }

      if (user.status === "profile_not_created") {
        return res.redirect("/users/createprofile");
      } else {
        //profile previously created
        return res.redirect("/users/menu");
      }
    });
  })(req, res, next);
};

// Logout User
//csrf get method
exports.getLogoutUser = async (req, res, next) => {
  //free map array
  cookieUsernameWs.delete(req.session.id);

  clearTimeout(
    usernameNotOnlineTimeoutFunction.get(req.user.usernameNormalized)
  );
  usernameNotOnlineTimeoutFunction.delete(req.user.usernameNormalized);

  //change status
  await User.updateOne(
    { usernameNormalized: req.user.usernameNormalized },
    { status: "profile_created" }
  );

  // console.log(req.session);
  // console.log(req.session.id);
  //finish session
  req.logout();
  //req.flash("success_message", "You are logged out");
  req.session.destroy(function(err) {
    if (err) {
      console.log(err);
    } else {
      //no muestra msg flash porque elimina la session que necesita flash, por lo que no hago redirect, sino que
      //envio HTTP response
      //return res.redirect("/");
      res.render("auth/login", {
        pageTitle: "Login",
        isAuthenticated: false,
        isProfileCreated: false,
        registrationMethod: registrationMethod(req),
        errorMessage: "", ////poner error, no poner error-message, si no los msg de passport no se muestran
        successMessage: ["You are logged out"],
        loginMsg: "Login",
        closeSessionInput: false,
        logout: true,
        oldInput: {
          email: "",
          password: ""
        }
      });
    }
  });

  // req.session.destroy(function(err) {
  //   req.logout();
  //   req.flash("success_message", "You are logged out");
  //   res.redirect("/"); //Inside a callback
  // });

  // req.logout();
  // req.session.destroy();
  // res.clearCookie("connect.sid");
  // res.networkingirect("/");
};

// Delete account - users registered using email and password
exports.getDeleteAccount = (req, res, next) => {
  res.render("auth/delete-account", {
    pageTitle: "Delete account",
    isAuthenticated: req.isAuthenticated(),
    usernameNormalized: req.user.usernameNormalized,
    registrationMethod: registrationMethod(req),
    isProfileCreated: isProfileCreated(req),
    errorMessage: messageErrorShow(req.flash("error")),
    successMessage: messageSuccessShow(req.flash("success_message")),
    oldInput: {
      password: "",
      acceptDelete: ""
    }
  });
};

exports.postDeleteAccount = async (req, res, next) => {
  //coger de la session el email (no pasar como param)

  const password = req.body.password;
  const acceptDelete = req.body.acceptDelete;

  //let regMethod = registrationMethod(req);

  const errors = validationResult(req);
  // console.log(errors);

  //pasar el mensaje que devuelve la funcion al array errorsMessages
  if (!errors.isEmpty()) {
    let errorsMessages = errorMessagesValidator.getErrorsMessages(
      errors.mapped()
    );

    return res.status(422).render("auth/delete-account", {
      pageTitle: "Delete account",
      isAuthenticated: req.isAuthenticated(),
      usernameNormalized: req.user.usernameNormalized,
      registrationMethod: registrationMethod(req),
      isProfileCreated: isProfileCreated(req),
      sendEmail: false,
      showConfirmDialog: true,
      errorMessage: messageErrorShow(errorsMessages),
      successMessage: "",
      oldInput: {
        password: password,
        acceptDelete: acceptDelete
      }
    });
  }

  // let query = {};
  // identifyLoginMethod(req, query);

  if (req.user.password) {
    try {
      //delete db object
      const user = await User.findByIdAndDelete(req.user.id);

      //delete profile photo if there is one (user created profile)
      //if user registered but did not created profile, it will have not photo
      if (user) {
        if (user.imageURL !== undefined) {
          await promisify(fs.unlink)(`./public/uploads/${user.imageURL}`);

          // fs.unlink("./public/uploads/" + user.imageURL, err => {
          //   if (err) {
          //     console.log(err);
          //     return;
          //   }
          // });
        }

        //save action
        const action = new UserAction({
          userIdActionDoer: req.user._id,
          actionType: "account_deletion",
          actionDoer: "user",
          strategy: registrationMethod(req)
        });
        await action.save();

        //change isDeletedAccount to all the users who chatted with him
        if (
          user.chatConversationsList &&
          user.chatConversationsList.length > 0
        ) {
          for (const conv of user.chatConversationsList) {
            await User.updateOne(
              {
                _id: conv.userId,
                "chatConversationsList.usernameNormalizedFriend":
                  req.user.usernameNormalized
              },
              { "chatConversationsList.$.isDeletedAccount": true }
            );
            //
          }
        }

        //users who were the deleted user's friends
        if (user.friends.length > 0) {
          for (const f of user.friends) {
            await User.updateOne(
              {
                _id: f.userId,
                "friends.userId": req.user.id
              },
              { $pull: { friends: { userId: req.user.id } } }
            );
          }
        }

        //users who had sent the deleted user a friendship request
        if (user.friendshipRequestReceived.length > 0) {
          for (const fr of user.friendshipRequestReceived) {
            await User.updateOne(
              {
                _id: fr.userId,
                "friendshipRequestSent.userId": req.user.id
              },
              { $pull: { friendshipRequestSent: { userId: req.user.id } } }
            );
          }
        }

        //users whom the the deleted user had sent a friendship request
        if (user.friendshipRequestSent.length > 0) {
          for (const fr of user.friendshipRequestSent) {
            await User.updateOne(
              {
                _id: fr.userId,
                "friendshipRequestReceived.userId": req.user.id
              },
              { $pull: { friendshipRequestReceived: { userId: req.user.id } } }
            );
          }
        }

        //users who have the deleted user blocked
        await User.updateMany(
          {
            "blockedUsers.userId": req.user.id
          },
          {
            $pull: { blockedUsers: { userId: req.user.id } }
          }
        );

        //save username in deletedAccounts model
        const userDeleted = new DeletedAccount({
          username: user.username,
          usernameNormalized: user.usernameNormalized,
          deletingDate: calculateTodayDate(),
          actionDoer: "user"
        });
        await userDeleted.save();

        //send response
        req.flash("success_message", "Your account has been deleted");
        res.redirect("/");

        if (keys.send_email_allowed) {
          transporter.sendMail({
            from: "appeuskara@gmail.com",
            to: user.email,
            subject: `Bye Bye ${user.username}`,
            html: `
          <p>We hope to see you back</p>
          <p>App Euskara</p>`,
            ses: {}
          });
        }
      }
    } catch (err) {
      // console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }
};

//Delete account - registered using oauth: google or facebook
exports.getDeleteAccountGF = (req, res, next) => {
  res.render("auth/delete-account-gf", {
    pageTitle: "Delete account",
    isAuthenticated: req.isAuthenticated(),
    usernameNormalized: req.user.usernameNormalized,
    registrationMethod: registrationMethod(req),
    isProfileCreated: isProfileCreated(req),
    sendEmail: true,
    showConfirmDialog: false,
    errorMessage: messageErrorShow(req.flash("error")),
    successMessage: messageSuccessShow(req.flash("success_message")),
    oldInput: {
      userEmail: "",
      deleteToken: "",
      acceptDelete: ""
    }
  });
};

//Users registered using google or facebook
//Para borrar la cuenta se necesita una session para crear el link con el token y para acceder
// a la route de borrado
//si registration method google o facebook enviar email con un link con el token
//Verifico que el user tiene acceso al email con el que se creo la cuenta de google o de fb que se
//uso para registrarse en la app, asi si alguien consigue una session en la app pero no en el email
//usado, no podra borrar la cuenta
exports.postDeleteAccountGFSendEmail = (req, res, next) => {
  const email = req.user.email;
  const regMethod = registrationMethod(req);
  let query = {};
  identifyLoginMethod(req, query);
  //console.log(query);

  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      req.flash("error", "An error ocurred, please try again");
      return res.redirect("/delete-account-gf"); //
    }
    const token = buffer.toString("hex");
    User.findOne(query)
      .select("email")
      .then(user => {
        if (user) {
          user.deleteAccountToken = token;
          user.deleteAccountTokenExpiration = Date.now() + 3600000; //token valid for 1 hours
          return user.save();
        }
      })
      .then(result => {
        //Boton enviar email: se ha enviado un email con el token a la direccion a@a.com
        req.flash("success_message", `Le hemos enviado un email a ${email}`);
        res.redirect("/delete-account-gf");

        if (keys.send_email_allowed) {
          transporter.sendMail({
            from: "appeuskara@gmail.com",
            to: email,
            subject: "Account deletion",
            html: `
              <p>You requested an account deletion</p>
              <p>This link will be valid for 1 hour</p>
              <p><strong>You must be signed in to delete your account</strong></p>
              <p>Click this <a href="${keys.domain}/delete-account-gf-email/${token}/${email}/${regMethod}">link</a> to delete your account.</p>
            `,
            ses: {}
          });
        }
      })
      .catch(err => {
        // console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getDeleteAccountGFEmail = (req, res, next) => {
  const email = req.params.email; //por si existe el mismo token para 2 emails address, tambien usamos la misma email address
  const token = req.params.token;
  //const regMethod = req.params.regMethod; //por si con un mismo email se ha registrado usando google or facebook

  //let regMethod = registrationMethod(req);

  //console.log(token);
  User.findOne({
    email: email,
    deleteAccountToken: token,
    deleteAccountTokenExpiration: { $gt: Date.now() }
    //regMethod
  })
    .then(user => {
      //console.log(user);
      if (!user) {
        //si la query no devuelve un user, ya que no encuentra un user con ese token y fecha de expiracion
        req.flash("error", "El token no es válido o ha expirado");
        return res.redirect("/delete-account-gf");
      }

      return res.render("auth/delete-account-gf", {
        pageTitle: "Delete account",
        isAuthenticated: req.isAuthenticated(),
        usernameNormalized: req.user.usernameNormalized,
        registrationMethod: registrationMethod(req),
        isProfileCreated: isProfileCreated(req),
        sendEmail: false,
        showConfirmDialog: true,
        errorMessage: "",
        successMessage: "",
        oldInput: {
          userEmail: email,
          deleteToken: token,
          //regMethod
          acceptDelete: ""
        }
      });
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//confirm delete
exports.postDeleteAccountGF = async (req, res, next) => {
  const userEmail = req.body.userEmail;
  const deleteToken = req.body.deleteToken;
  const acceptDelete = req.body.acceptDelete;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    let errorsMessages = errorMessagesValidator.getErrorsMessages(
      errors.mapped()
    );

    return res.status(422).render("auth/delete-account-gf", {
      pageTitle: "Delete account",
      errorMessage: messageErrorShow(errorsMessages),
      successMessage: "",
      isAuthenticated: req.isAuthenticated(),
      usernameNormalized: req.user.usernameNormalized,
      registrationMethod: registrationMethod(req),
      isProfileCreated: isProfileCreated(req),
      sendEmail: false,
      showConfirmDialog: true,
      oldInput: {
        userEmail: userEmail,
        deleteToken: deleteToken,
        //regMethod
        acceptDelete: acceptDelete
      }
    });
  }

  try {
    //si le pasan parametros no validos, no existira el user
    //y se ejecutara el then pero user sera null y dara error al asignar campos a un objeto null
    const user = await User.findOneAndDelete({
      _id: req.user.id,
      deleteAccountToken: deleteToken,
      deleteAccountTokenExpiration: { $gt: Date.now() },
      email: userEmail
      //regMethod
    });

    //delete profile photo if there is one (user created profile)
    //if user registered but did not created profile, it will have not photo
    if (user) {
      if (user.imageURL !== undefined) {
        await promisify(fs.unlink)(`./public/uploads/${user.imageURL}`);

        // fs.unlink("./public/uploads/" + user.imageURL, err => {
        //   if (err) {
        //     console.log(err);
        //     return;
        //   }
        // });
      }

      //save action
      const action = new UserAction({
        userIdActionDoer: req.user._id,
        actionType: "account_deletion",
        actionDoer: "user",
        strategy: registrationMethod(req)
      });
      await action.save();

      //change isDeletedAccount to all the users who chatted with him
      if (user.chatConversationsList && user.chatConversationsList.length > 0) {
        for (const conv of user.chatConversationsList) {
          await User.updateOne(
            {
              _id: conv.userId,
              "chatConversationsList.usernameNormalizedFriend":
                req.user.usernameNormalized
            },
            { "chatConversationsList.$.isDeletedAccount": true }
          );
          //
        }
      }

      //users who were the deleted user's friends
      if (user.friends.length > 0) {
        for (const f of user.friends) {
          await User.updateOne(
            {
              _id: f.userId,
              "friends.userId": req.user.id
            },
            { $pull: { friends: { userId: req.user.id } } }
          );
        }
      }

      //users who had sent the deleted user a friendship request
      if (user.friendshipRequestReceived.length > 0) {
        for (const fr of user.friendshipRequestReceived) {
          await User.updateOne(
            {
              _id: fr.userId,
              "friendshipRequestSent.userId": req.user.id
            },
            { $pull: { friendshipRequestSent: { userId: req.user.id } } }
          );
        }
      }

      //users whom the the deleted user had sent a friendship request
      if (user.friendshipRequestSent.length > 0) {
        for (const fr of user.friendshipRequestSent) {
          await User.updateOne(
            {
              _id: fr.userId,
              "friendshipRequestReceived.userId": req.user.id
            },
            { $pull: { friendshipRequestReceived: { userId: req.user.id } } }
          );
        }
      }

      //users who have the deleted user blocked
      await User.updateMany(
        {
          "blockedUsers.userId": req.user.id
        },
        {
          $pull: { blockedUsers: { userId: req.user.id } }
        }
      );

      //save username in deletedAccounts model
      const userDeleted = new DeletedAccount({
        username: user.username,
        usernameNormalized: user.usernameNormalized,
        deletingDate: calculateTodayDate(),
        actionDoer: "user"
      });
      await userDeleted.save();

      req.flash("success_message", "Your account has been deleted");
      res.redirect("/");

      if (keys.send_email_allowed) {
        transporter.sendMail({
          from: "appeuskara@gmail.com",
          to: user.email,
          subject: `Bye Bye ${user.username}`,
          html: `
            <p>We hope to see you back</p>
            <p>App Euskara</p>`,
          ses: {}
        });
      }
    } else {
      req.flash("error", "El token no es válido o ha expirado");
      return res.redirect("/delete-account-gf");
    }
  } catch (err) {
    // console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//Forgot password
exports.getForgotPassword = (req, res, next) => {
  try {
    //throw new Error("Error!");
    let inputEmailLoginForm = "";
    console.log(req.params.email);
    if (req.params.email) {
      inputEmailLoginForm = req.params.email;
    }
    res.render("auth/forgotpassword", {
      pageTitle: "Forgot password",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      inputEmailLoginForm: inputEmailLoginForm,
      errorMessage: messageErrorShow(req.flash("error")),
      successMessage: messageSuccessShow(req.flash("success_message"))
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postForgotPassword = async (req, res, next) => {
  const email = req.body.email;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let errorsMessages = errorMessagesValidator.getErrorsMessages(
      errors.mapped()
    );

    return res.status(422).render("auth/forgotpassword", {
      pageTitle: "Forgot password",
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      inputEmailLoginForm: email, //oldInput
      errorMessage: messageErrorShow(errorsMessages),
      successMessage: ""
    });
  }

  //dont send reset password email if user has not confirmed that he is the owner of the email account he used to register
  //check if that user has registered using an email address and if he has already confirmed it
  const userForgotPassword = await User.findOne({
    email: validator.normalizeEmail(email),
    password: { $exists: true, $ne: null },
    confirmEmailToken: { $exists: true, $ne: null }
  });

  if (userForgotPassword) {
    req.flash(
      "error",
      `Aun no has confirmado que eres el dueño de esa direccion de email, para ello debes hacer click en el link que te enviemos.
      <a class="link-err-msg" href="/resend-email-confirmation/${userForgotPassword.email}"> Volver a enviar email de confirmacion</a>`
    );
    return res.redirect("/forgotpassword");
  }

  //generate token to send via email
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      //console.log(err);
      req.flash("error", "An error ocurred, please try again");
      return res.redirect("/forgotpassword");
    }
    const token = buffer.toString("hex");
    User.findOne({
      //solo los users registrados con email/password tienen en el modelo la key password
      email: validator.normalizeEmail(email),
      password: { $exists: true, $ne: null }
    })
      .select("email")
      .then(user => {
        if (user) {
          user.resetToken = token;
          user.resetTokenExpiration = Date.now() + 7200000; //token valid for 2 hours
          return user.save();
        }
      })
      .then(result => {
        //se ejecuta se haya buscado ese email con exito, o no
        req.flash(
          "success_message",
          "Si existe una cuenta para esa dirección de email le hemos enviado un email"
        );
        res.redirect("/");
        console.log(result);
        //solo se ejecuta si se ha buscado ese email con exito
        if (result) {
          if (keys.send_email_allowed) {
            transporter.sendMail({
              from: "appeuskara@gmail.com",
              to: email,
              subject: "Password reset",
              html: `
              <p>You requested a password reset</p>
              <p>This link will be valid for 2 hours</p>
              <p>Click this <a href="${keys.domain}/resetpassword/${token}/${email}">link</a> to set a new password.</p>
            `,
              ses: {}
            });
          }
        }
      })
      .catch(err => {
        // console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getResetPasswordNewPassword = (req, res, next) => {
  const email = req.params.email; //por si existe el mismo token para 2 emails address, tambien usamos la misma email address
  const token = req.params.token;
  console.log(token);
  User.findOne({
    email: email,
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }
  })
    .then(user => {
      console.log(user);
      if (!user) {
        //si la query no devuelve un user, ya que no encuentra un user con ese token y fecha de expiracion
        req.flash("error", "El token no es válido o ha expirado");
        return res.redirect("/");
      }

      //posible error: la password no pasa las validaciones
      //errorMessage muestra los errores en la templates
      //const errorMsg = messages.messageErrorShow(req);

      return res.render("auth/newpassword", {
        pageTitle: "New Password",
        isAuthenticated: req.isAuthenticated(),
        isProfileCreated: isProfileCreated(req),
        registrationMethod: registrationMethod(req),
        //errorMessage: errorMsg,
        userEmail: user.email.toString(),
        passwordToken: token,
        errorMessage: "",
        oldInput: {
          newPassword: "",
          newPasswordConfirm: ""
        }
      });
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postResetPasswordNewPassword = (req, res, next) => {
  const newPassword = req.body.newPassword;
  const newPasswordConfirm = req.body.newPasswordConfirm;
  const userEmail = req.body.userEmail;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    let errorsMessages = errorMessagesValidator.getErrorsMessages(
      errors.mapped()
    );
    return res.status(422).render("auth/newpassword", {
      pageTitle: "New password",
      errorMessage: messageErrorShow(errorsMessages),
      isAuthenticated: req.isAuthenticated(),
      isProfileCreated: isProfileCreated(req),
      registrationMethod: registrationMethod(req),
      userEmail: userEmail,
      passwordToken: passwordToken,
      oldInput: {
        newPassword: newPassword,
        newPasswordConfirm: newPasswordConfirm
      }
    });
  }

  //si le pasan parametros no validos, no existira el user
  //y se ejecutara el then pero user sera null y dara error al asignar campos a un objeto null
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    email: userEmail
  })
    .then(user => {
      console.log("u" + user);
      if (user) {
        resetUser = user;
        return bcrypt.hash(newPassword, 12);
      } else {
        req.flash("error", "El token no es válido o ha expirado");
        return res.redirect("/");
      }
    })
    .then(hashedPassword => {
      if (hashedPassword) {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
      }
    })
    .then(result => {
      if (result) {
        req.flash("success_message", "Su contraseña se ha cambiado con exito");
        res.redirect("/");
        //res.redirect("/password-change-success");
      }
    })
    .catch(err => {
      // console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//Google auth
exports.getGoogleAuthAccount = function(req, res, next) {
  const timezone = req.params.timezone;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account", //to always ask for account selection even if you logged in previously using an account
    state: timezone
  })(req, res, next);
};

exports.getGoogleAuthCallback = function(req, res, next) {
  const timezoneBase64 = req.query.state;
  const timezone = Buffer.from(timezoneBase64, "base64").toString();
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/");
    }

    if (info.message === "Banned") {
      errorsMessages = [
        "You have been banned.",
        `You will be unbanned at ${info.unbanningDate[0]} (${info.unbanningDate[1]}).`
      ];
      return res.render("auth/login", {
        pageTitle: "Login",
        isAuthenticated: false,
        isProfileCreated: isProfileCreated(req),
        registrationMethod: registrationMethod(req),
        errorMessage: messageErrorShow(errorsMessages), //
        successMessage: "",
        loginMsg: "Login",
        closeSessionInput: false,
        logout: false,
        oldInput: {
          email: "",
          password: ""
        }
      });
    }

    req.logIn(user, async function(err) {
      if (err) {
        return next(err);
      }
      //Successful authentication
      //establish a session

      //save action
      const action = new UserAction({
        userIdActionDoer: user._id,
        actionType: "user_signingin",
        strategy: "google"
      });
      await action.save();

      await User.updateOne(
        {
          _id: req.user.id
        },
        { timezone: timezone }
      );

      //If the user closed the browser  less than 12 secs ago without logging out, he will still have
      //online status
      if (
        req.user.status === "profile_created" ||
        req.user.status === "online"
      ) {
        cookieUsernameWs.set(req.session.id, req.user.usernameNormalized); //map sessionId with username
      }

      if (user.status === "profile_not_created") {
        return res.redirect("/users/createprofile");
      } else {
        //profile previously created
        return res.redirect("/users/menu");
      }
    });
  })(req, res, next);
};

//Facebook auth
exports.getFacebookAuthAccount = function(req, res, next) {
  const timezone = req.params.timezone;
  passport.authenticate("facebook", {
    scope: ["email"],
    state: timezone
    //authType: "reauthenticate"
  })(req, res, next);
};

exports.getFacebookAuthCallback = function(req, res, next) {
  const timezoneBase64 = req.query.state;
  const timezone = Buffer.from(timezoneBase64, "base64").toString();
  passport.authenticate("facebook", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/");
    }

    if (info.message === "Banned") {
      errorsMessages = [
        "You have been banned.",
        `You will be unbanned at ${info.unbanningDate[0]} (${info.unbanningDate[1]}).`
      ];
      return res.render("auth/login", {
        pageTitle: "Login",
        isAuthenticated: false,
        isProfileCreated: isProfileCreated(req),
        registrationMethod: registrationMethod(req),
        errorMessage: messageErrorShow(errorsMessages), //
        successMessage: "",
        loginMsg: "Login",
        closeSessionInput: false,
        logout: false,
        oldInput: {
          email: "",
          password: ""
        }
      });
    }

    req.logIn(user, async function(err) {
      if (err) {
        return next(err);
      }
      //Successful authentication
      //establish a session
      const action = new UserAction({
        userIdActionDoer: user._id,
        actionType: "user_signingin",
        strategy: "facebook"
      });
      await action.save();

      await User.updateOne(
        {
          _id: req.user.id
        },
        { timezone: timezone }
      );

      if (
        req.user.status === "profile_created" ||
        req.user.status === "online"
      ) {
        cookieUsernameWs.set(req.session.id, req.user.usernameNormalized); //map sessionId with username
      }
      if (user.status === "profile_not_created") {
        return res.redirect("/users/createprofile");
      } else {
        //profile previously created
        return res.redirect("/users/menu");
      }
    });
  })(req, res, next);
};

//change password
exports.getChangePasswordUsers = (req, res, next) => {
  res.render("auth/changepassword", {
    pageTitle: "Change Password",
    isAuthenticated: req.isAuthenticated(),
    usernameNormalized: req.user.usernameNormalized,
    registrationMethod: registrationMethod(req),
    isProfileCreated: isProfileCreated(req),
    errorMessage: messageErrorShow(req.flash("error")),
    oldInput: {
      oldPassword: "",
      newPassword: "",
      newPasswordConfirm: ""
    }
    //message: req.flash("error")
  });
};

exports.postChangePasswordUsers = (req, res, next) => {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const newPasswordConfirm = req.body.newPasswordConfirm;
  let resetUser;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let errorsMessages = errorMessagesValidator.getErrorsMessages(
      errors.mapped()
    );

    return res.status(422).render("auth/changepassword", {
      pageTitle: "Change Password",
      errorMessage: messageErrorShow(errorsMessages),
      isAuthenticated: req.isAuthenticated(),
      usernameNormalized: req.user.usernameNormalized,
      registrationMethod: registrationMethod(req),
      isProfileCreated: isProfileCreated(req),
      oldInput: {
        oldPassword: oldPassword,
        newPassword: newPassword,
        newPasswordConfirm: newPasswordConfirm
      }
    });
  }

  //console.log(req.user);
  //Solo para users registrados mediante email
  //a los users registrados con google o fb no darles esta opcion
  User.findOne({
    //solo los users registrados con email/password tienen la key password
    email: req.user.email, //cojo de la session
    password: { $exists: true, $ne: null },
    role: "user"
  })
    .then(user => {
      // console.log("u1" + user);
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      console.log("p1" + hashedPassword);
      resetUser.password = hashedPassword;
      //return resetUser.save();
      return resetUser.save();
    })
    .then(user => {
      // console.log("u2" + user);
      if (user) {
        //redirect to menu
        req.flash("success_message", "Su contraseña se ha cambiado con exito");
        res.redirect("/users/menu");
        //res.redirect("/password-change-success");

        if (keys.send_email_allowed) {
          transporter.sendMail({
            from: "appeuskara@gmail.com",
            to: user.email,
            subject: `${user.username} your password was changed recently`,
            html: `
        <p>We write to inform you that recently your password was changed</p>
        <p>App Euskara</p>`,
            ses: {}
          });
        }
      }
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// exports.getPasswordChangeSuccess = (req, res, next) => {
//   res.render("auth/password-change-success", {
//     pageTitle: "Password changed successfully",
//     isAuthenticated: req.isAuthenticated(),
//     usernameNormalized: req.user.usernameNormalized,
//     errorMessage: messageErrorShow(req.flash("error")),
//     successMessage: messageSuccessShow(req.flash("success_message"))
//   });
// };

//admin
exports.getAdminLogin = (req, res, next) => {
  return res.render("admin/adminLogin", {
    pageTitle: "Admin Login",
    isAuthenticated: req.isAuthenticated(),
    errorMessage: "",
    successMessage: "",
    logout: false,
    oldInput: {
      email: "",
      password: ""
    }
  });
};

exports.postAdminLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const timezone = req.body.timezone;

  const errors = validationResult(req);
  let errorsMessages;
  if (!errors.isEmpty()) {
    errorsMessages = errorMessagesValidator.getErrorsMessages(errors.mapped());
    res.status(422);
  } else {
    errorsMessages = ["Invalid credentials"];
  }

  //passport custom callback, instead of the built-in options
  //in order to return back the form input values and show failed validation messages
  //(I validate email and password using express-validator)
  passport.authenticate("admin-local", function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.render("admin/adminLogin", {
        pageTitle: "Admin Login",
        isAuthenticated: req.isAuthenticated(),
        errorMessage: messageErrorShow(errorsMessages), //
        successMessage: "",
        logout: false,
        oldInput: {
          email: email,
          password: password
        }
      });
    }

    req.logIn(user, async function(err) {
      //successful login
      //establish a session
      if (err) {
        return next(err);
      }

      // console.log(req.ips);
      // console.log(req.ip);
      const numberOfLastLogins = req.user.lastLogins.length;
      //add item to array in last position, also save timezone
      const lastLogin = await User.updateOne(
        { _id: req.user._id },
        {
          $push: {
            lastLogins: {
              ipAddress: req.ip
            }
          },
          timezone: timezone
        }
      );

      if (numberOfLastLogins >= 10 && lastLogin.nModified === 1) {
        //remove first item from array
        await User.updateOne(
          { _id: req.user._id },
          {
            $pop: {
              lastLogins: -1
            }
          }
        );
      }

      // await User.updateOne(
      //   {
      //     _id: req.user.id
      //   },
      //   { timezone: timezone }
      // );

      return res.redirect("/admin/"); //home
    });
  })(req, res, next);
};
