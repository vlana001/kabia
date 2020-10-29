const fs = require("fs");
const { promisify } = require("util");

const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const errorMessagesValidator = require("../helpers/errorsMessagesValidator");
const { messageErrorShow, messageSuccessShow } = require("../helpers/messages");

const User = require("../models/user");
const DeletedAccount = require("../models/deletedAccount");
const UserAction = require("../models/userAction");

const {
  calculateTodayDate,
  calculateTomorrowDate,
  calculateXDaysAfterTodayDate,
  calculateXDaysBeforeTodayDate,
  getLastXDaysDates,
  isSameDate,
  formatMongodbDate,
  getLastXMonthsNumberOfDays,
  numberOfMonthsBetweenADateAndThisMonthBothIncluded,
  calculateDateWithHour,
  calculateLastLoginDateInTime
} = require("../helpers/moment");

const { registrationMethodByUsername } = require("../helpers/auth");

const keys = require("../config/keys");
const { transporter } = require("../helpers/awsEmail");

//Home
exports.getHomeAdmin = async (req, res, next) => {
  const email = req.user.email;

  //second last (last one is current login)

  let lastLoginDate = "-";
  let lastLoginText = " ";
  if (req.user.lastLogins.length > 1) {
    const lastDate = req.user.lastLogins[req.user.lastLogins.length - 2].date;
    lastLoginDate = calculateDateWithHour(lastDate, req);
    lastLoginText = calculateLastLoginDateInTime(lastDate);
  }

  const [accounDeletionToday] = await getTodayStats("account_deletion");
  const [userRegistrationToday] = await getTodayStats("user_registration");
  const [userSigningInToday] = await getTodayStats("user_signingin");
  const [friendshipRequestSentToday] = await getTodayStats(
    "friendship_request_sent"
  );

  const totalBannedUsers = await User.countDocuments({
    status: "banned"
  });

  const totalUnBanTomorrow = await User.countDocuments({
    status: "banned",
    "banned.banEndDate": {
      $eq: calculateTomorrowDate()
    }
  });

  return res.render("admin/home-admin", {
    pageTitle: "Home Admin",
    successMessage: messageSuccessShow(req.flash("success_message")),
    isAuthenticated: req.isAuthenticated(),
    email: email,
    lastLoginDate: lastLoginDate,
    lastLoginText: lastLoginText,
    accounDeletionToday: accounDeletionToday[0],
    userRegistrationToday: userRegistrationToday[0],
    userSigningInToday: userSigningInToday[0],
    friendshipRequestSentToday: friendshipRequestSentToday[0],
    totalBannedUsers: totalBannedUsers,
    totalUnBanTomorrow: totalUnBanTomorrow
    // usernameNormalized: req.user.usernameNormalized
    //errorMessage: ""
  });
};

//Stats
exports.getStatsUsersAdmin = (req, res, next) => {
  const optionSelected = req.params.option;
  return res.render("admin/stats/stats-users-admin", {
    pageTitle: "Admin stats",
    isAuthenticated: req.isAuthenticated(),
    optionSelected: optionSelected
    // usernameNormalized: req.user.usernameNormalized
    //errorMessage: ""
  });
};

exports.getStatsForTimePeriodUsersAdmin = async (req, res, next) => {
  try {
    const statSelected = req.params.option;
    const periodSelected = req.params.period;

    if (!statSelected || !periodSelected) {
      return res.json({ msg: "Invalid options" });
    }
    //comparar valor de los parametros con una whitelist
    const timeOptions = [
      "today",
      "last_week",
      "last_month",
      "last_year",
      "all_time"
    ];
    const statOptions = [
      "user_registration",
      "account_deletion",
      "user_signingin",
      "friendship_request_sent"
      // "message_sent_to_admin"
    ];

    if (
      !timeOptions.includes(periodSelected) ||
      !statOptions.includes(statSelected)
    ) {
      return res.json({ msg: "Invalid options" });
    }

    let result;
    let textXLabel;
    switch (periodSelected) {
      case "today":
        result = await getTodayStats(statSelected);
        textXLabel = "Dia";
        break;
      case "last_week":
        result = await getLastXDaysStats(statSelected, 7);
        textXLabel = "Año-Mes-Dia";
        break;
      case "last_month":
        result = await getLastXDaysStats(statSelected, 30);
        textXLabel = "Año-Mes-Dia";
        break;
      case "last_year": //months
        result = await getLastXMonthsStats(statSelected, 12);
        textXLabel = "Año-Mes";
        break;
      case "all_time": //months
        result = await getAllTimeStats(statSelected);
        textXLabel = "Año-Mes";
        break;
      default:
        return res.json({ msg: "Invalid options" });
    }

    const data = result[0];
    const labels = result[1];
    const xLabelString = textXLabel;
    const title = getChartTitle(statSelected);

    return res.json({
      labels: labels,
      data: data,
      title: title,
      xLabelString: xLabelString
    });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

function getChartTitle(statSelected) {
  let textTitle;
  switch (statSelected) {
    case "user_registration":
      textTitle = "Usuarios registrados";
      break;
    case "account_deletion":
      textTitle = "Cuentas eliminadas";
      break;
    case "user_signingin":
      textTitle = "Sesiones iniciadas";
      break;
    case "friendship_request_sent":
      textTitle = "Solicitudes de amistad enviadas";
      break;
    case "message_sent_to_admin":
      textTitle = "Mensajes enviados al administrador";
      break;
    default:
      textTitle = "";
  }

  return textTitle;
}

async function getTodayStats(statSelected) {
  const result = await UserAction.countDocuments({
    actionType: statSelected,
    actionDoneTimestamp: {
      $gte: calculateTodayDate(),
      $lt: calculateTomorrowDate()
    }
  });

  return [[result], ["today"]];
}

async function getLastXDaysStats(statSelected, numDays) {
  // const result = await UserAction.aggregate([
  //   {
  //     $match: {
  //       actionDoneTimestamp: {
  //         $gte: new Date(calculateXDaysBeforeTodayDate(numDays)),
  //         $lt: new Date(calculateTomorrowDate())
  //       },
  //       actionType: statSelected
  //     }
  //   }, //filter
  //   // { $unwind: "$actionDoneTimestamp" }, //key of document
  //   {
  //     $group: {
  //       _id: "$actionDoneTimestamp", //todos los subdocuments tendran un id
  //       count: { $sum: 1 }
  //     }
  //   },
  //   { $sort: { _id: 1 } }
  // ]);

  // let data = [];
  // getLastXDaysDate(numDays).forEach(function(item, index) {
  //   let hasCount = false;
  //   result.forEach(function(itm, i) {
  //     if (isSameDate(item, itm._id)) {
  //       data.push(itm.count);
  //       hasCount = true;
  //     }
  //   });
  //   if (!hasCount) {
  //     data.push(0);
  //   }
  // });

  // const labels = getLastXDaysDate(numDays);
  const [lastXDayDates, labels] = getLastXDaysDates(numDays);
  let data = [];

  for (const day of lastXDayDates) {
    const numActions = await UserAction.countDocuments({
      actionType: statSelected,
      actionDoneTimestamp: {
        $gte: day.day,
        $lt: day.nextDay
      }
    });
    data.push(numActions);
  }

  return [data.reverse(), labels.reverse()];
}

async function getLastXMonthsStats(statSelected, numMonths) {
  const [startAndEnddatesEachLastMonth, labels] = getLastXMonthsNumberOfDays(
    numMonths
  );
  let data = [];

  for (const month of startAndEnddatesEachLastMonth) {
    const numActions = await UserAction.countDocuments({
      actionType: statSelected,
      actionDoneTimestamp: {
        $gte: month.firstDayOfMonth,
        $lte: month.lastDayOfMonth
      }
    });
    data.push(numActions);
  }

  // console.log(labels);
  // console.log(data);
  return [data.reverse(), labels.reverse()];
}

async function getAllTimeStats(statSelected) {
  //calcular con una query cual es el primer mes que tiene registros de una accion
  //otra opcion seria tener la fecha de inicio hardcodeada, para no tener que hacer una query
  const firstActionDate = await UserAction.findOne({
    actionType: statSelected
  })
    .sort({ actionDoneTimestamp: 1 })
    .select("actionDoneTimestamp -_id");

  //calcular el numero de meses que han pasado hasta esa fecha
  let numMonths;
  if (firstActionDate) {
    numMonths = numberOfMonthsBetweenADateAndThisMonthBothIncluded(
      firstActionDate.actionDoneTimestamp
    );
    if (numMonths < 12) {
      numMonths = 12;
    }
  } else {
    //if that actions has never been done, we get the last 12 months as period
    numMonths = 12;
  }

  //obtener los datopara cada mes desde el inicio
  const [data, labels] = await getLastXMonthsStats(statSelected, numMonths);

  return [data, labels];
}

//Messages
exports.getMessagesAdmin = (req, res, next) => {
  const optionSelected = req.params.option;
  return res.render("admin/users-messages/messages-admin", {
    pageTitle: "Admin messages",
    isAuthenticated: req.isAuthenticated(),
    optionSelected: optionSelected
    // usernameNormalized: req.user.usernameNormalized
    //errorMessage: ""
  });
};

//Accounts action
//get
exports.getAccountsActionAdmin = (req, res, next) => {
  const optionSelected = req.params.option;

  switch (optionSelected) {
    case "action":
      actionOverUserAccount(res, req, next, optionSelected);
      break;
    case "see-banned-users":
      seeBannedUsers(res, req, next, optionSelected);
      break;
    case "see-accounts-deleted":
      seeDeletedUsers(res, req, next, optionSelected);
      break;
    default:
      accountActionAdminDefault(res, req, next, optionSelected);
      break;
  }
};

function actionOverUserAccount(res, req, next, optionSelected) {
  return res.render("admin/account-action/account-action-admin", {
    pageTitle: "Admin account action",
    isAuthenticated: req.isAuthenticated(),
    optionSelected: optionSelected
    // usernameNormalized: req.user.usernameNormalized
    //errorMessage: ""
  });
}

const seeBannedUsers = async (res, req, next, optionSelected) => {
  try {
    const usersBanned = await User.find({
      status: "banned",
      role: "user"
    }).select("username usernameNormalized banned -_id");

    let userBannedDatesFormated = [];
    usersBanned.forEach(e => {
      let user = {
        banned: {
          banStartDate: formatMongodbDate(e.banned.banStartDate),
          banEndDate: formatMongodbDate(e.banned.banEndDate),
          banTotalDays: e.banned.banTotalDays
        },
        username: e.username,
        usernameNormalized: e.usernameNormalized
      };
      userBannedDatesFormated.push(user);
    });
    console.log(userBannedDatesFormated);

    return res.render("admin/account-action/account-action-admin", {
      pageTitle: "Admin account action",
      isAuthenticated: req.isAuthenticated(),
      optionSelected: optionSelected,
      usersBanned: userBannedDatesFormated
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

const seeDeletedUsers = async (res, req, next, optionSelected) => {
  try {
    const accountsDeleted = await DeletedAccount.find({}).select(
      "username deletingDate actionDoer -_id"
    );

    return res.render("admin/account-action/account-action-admin", {
      pageTitle: "Admin account action",
      isAuthenticated: req.isAuthenticated(),
      optionSelected: optionSelected,
      accountsDeleted: accountsDeleted
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

function accountActionAdminDefault(res, req, next, optionSelected) {
  return res.render("admin/account-action/account-action-admin", {
    pageTitle: "Admin account action",
    isAuthenticated: req.isAuthenticated(),
    optionSelected: optionSelected
  });
}

//post
exports.postActionUserAdmin = (req, res, next) => {
  const optionSelected = req.params.option;

  switch (optionSelected) {
    case "ban":
      banUser(res, req, next);
      break;
    case "unban":
      unBanUser(res, req, next);
      break;
    case "delete":
      deleteUser(res, req, next);
      break;
    default:
      //accountActionAdminDefault(res, req, optionSelected);
      break;
  }
};

const banUser = async (res, req, next) => {
  const usernameNormalized = req.body.usernameNormalized;

  try {
    const user = await User.findOne({
      usernameNormalized: usernameNormalized,
      role: "user"
    });
    if (user) {
      let user1 = user;
      user1.status = "banned";
      user1.banned = {
        banStartDate: calculateTodayDate(),
        banEndDate: calculateXDaysAfterTodayDate(7),
        banTotalDays: 7
      };
      const result = await user1.save();
      if (result) {
        return res.json({ result: "ok" });
      } else {
        return res.json({ result: "err", message: "operation failed" });
      }
    } else {
      return res.json({ result: "err", message: "user doesn't exist" });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

const unBanUser = async (res, req) => {
  const usernameNormalized = req.body.usernameNormalized;

  try {
    const user = await User.findOne({
      usernameNormalized: usernameNormalized,
      status: "banned",
      role: "user"
    });
    if (user) {
      let user1 = user;
      user1.status = "profile_created";
      user1.banned = undefined;
      const result = await user1.save();
      if (result) {
        return res.json({ result: "ok" });
      } else {
        return res.json({ result: "err", message: "operation failed" });
      }
    } else {
      return res.json({ result: "err", message: "user doesn't exist" });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

const deleteUser = async (res, req, next) => {
  const usernameNormalized = req.body.usernameNormalized;

  try {
    if (usernameNormalized) {
      const user = await User.findOne({
        usernameNormalized: usernameNormalized,
        role: "user"
      });

      if (user) {
        const strategy = await registrationMethodByUsername(
          user.usernameNormalized
        );
        //delete user from db
        const result = await User.deleteOne({
          usernameNormalized: usernameNormalized
        });
        //delete profile photo from filesystem
        await promisify(fs.unlink)(`./public/uploads/${user.imageURL}`);

        if (result.deletedCount === 1) {
          //save username in deletedAccounts model
          const userDeleted = new DeletedAccount({
            username: user.username,
            usernameNormalized: user.usernameNormalized,
            deletingDate: calculateTodayDate(),
            actionDoer: "administrator"
          });
          await userDeleted.save();

          //save action
          const action = new UserAction({
            userIdActionDoer: req.user._id,
            actionType: "account_deletion",
            actionDoer: "administrator",
            strategy: strategy
          });
          await action.save();
        }

        //send email
        if (keys.send_email_allowed) {
          transporter.sendMail({
            from: "appeuskara@gmail.com",
            to: user.email,
            subject: "Account deleted by admins",
            html: `
            <p>Hi ${user.username}</p>
            <p>Your account have been deleted by our admins for infringing the terms</p>
            <p>App Euskara</p>`,
            ses: {}
          });
        }

        return res.json({ result: "ok" });
      }
    }
    return res.json({ result: "err", message: "user doesn't exist" });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postSearchUserAdmin = async (req, res, next) => {
  let username = req.body.username;
  // console.log(usernameN);

  //replace multiple whitespaces by a single space
  //when saved in database it was also trimmed
  username = username.replace(/[\s]{1,}/gm, " ");

  //si contiene caracteres no validos para el username, devuelvo array vacio
  //puede contener solo letras (min y may), numeros y space " "
  if (!/^[a-z0-9 ]+$/i.test(username)) {
    return res.json([]);
  }

  try {
    const usersMatching = await User.find({
      username: { $regex: new RegExp("^" + username, "i") },
      role: "user"
    })
      .sort({ username: 1 })
      .select("username usernameNormalized status -_id");

    // console.log(usersMatching);
    res.json(usersMatching);
  } catch (err) {}
};

//my account
exports.getMyLastLogins = (req, res, next) => {
  let lastLogins = [];
  req.user.lastLogins.forEach(e => {
    const login = {
      ipAddress: e.ipAddress,
      date: calculateDateWithHour(e.date, req)
    };
    lastLogins.push(login);
  });

  return res.render("admin/myaccount/lastlogins", {
    pageTitle: "Last logins",
    isAuthenticated: req.isAuthenticated(),
    optionSelected: "lastlogins",
    email: req.user.email,
    loginsList: lastLogins
  });
};

//change password
exports.getChangePasswordAdmin = (req, res, next) => {
  return res.render("admin/myaccount/changepassword-admin", {
    pageTitle: "Change Password",
    isAuthenticated: req.isAuthenticated(),
    errorMessage: "",
    optionSelected: "changepassword",
    oldInput: {
      oldPassword: "",
      newPassword: "",
      newPasswordConfirm: ""
    }
  });
};

exports.postChangePasswordAdmin = async (req, res, next) => {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const newPasswordConfirm = req.body.newPasswordConfirm;

  //validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let errorsMessages = errorMessagesValidator.getErrorsMessages(
      errors.mapped()
    );

    return res.status(422).render("admin/myaccount/changepassword-admin", {
      pageTitle: "Change Password",
      errorMessage: messageErrorShow(errorsMessages),
      isAuthenticated: req.isAuthenticated(),
      optionSelected: "changepassword",
      oldInput: {
        oldPassword: oldPassword,
        newPassword: newPassword,
        newPasswordConfirm: newPasswordConfirm
      }
    });
  }

  try {
    //db operation
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const result = await User.updateOne(
      { _id: req.user.id },
      { password: hashedPassword }
    );

    if (result.nModified === 1) {
      req.flash("success_message", "Su contraseña se ha cambiado con exito");
      res.redirect("/admin/");

      if (keys.send_email_allowed) {
        transporter.sendMail({
          from: "appeuskara@gmail.com",
          to: req.user.email,
          subject: `${req.user.email} your admin password was changed recently`,
          html: `
    <p>We write to inform you that recently your password was changed</p>
    <p>App Euskara</p>`,
          ses: {}
        });
      }
    }
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//Logout
exports.getLogoutAdmin = (req, res, next) => {
  //finish session
  req.logout();
  //req.flash("success_message", "You are logged out");
  req.session.destroy(function(err) {
    if (err) {
      console.log(err);
    } else {
      //return res.redirect("/admin-login");
      res.render("admin/adminLogin", {
        pageTitle: "Admin Login",
        isAuthenticated: false,
        isProfileCreated: false,
        errorMessage: "", ////poner error, no poner error-message, si no los msg de passport no se muestran
        successMessage: ["You are logged out"],
        logout: true,
        oldInput: {
          email: "",
          password: ""
        }
      });
    }
  });
};
