const express = require("express");
//const { body } = require("express-validator");

//const User = require("../models/user");

const adminController = require("../controllers/admins");

// const {
//   validateUsername,
//   validateAllButUsername,
//   validateProfilePhoto,
//   validateLastTime,
//   validateLimit
// } = require("../helpers/validation");

const { ensureAuthenticated, ensureIsAdmin } = require("../helpers/auth");

const {
  validateNewPassword,
  validateNewPasswordConfirm,
  validateOldPassword
} = require("../helpers/validation");

//const { multerGetImage } = require("../helpers/multer");

const router = express.Router();

// /
router.get(
  "/",
  ensureAuthenticated,
  ensureIsAdmin,
  adminController.getHomeAdmin
);

// /stats
router.get(
  "/stats",
  //ensureAuthenticated,
  adminController.getStatsUsersAdmin
);

router.get(
  "/stats/:option/:period",
  //ensureAuthenticated,
  adminController.getStatsForTimePeriodUsersAdmin
);

// /users-messages/:option
router.get(
  "/users-messages/:option",
  //ensureAuthenticated,
  adminController.getMessagesAdmin
);

//actions
// /user-account-action/:option
router.post(
  "/search-user/",
  //ensureAuthenticated,
  adminController.postSearchUserAdmin
);
router.get(
  "/user-account-action/:option",
  //ensureAuthenticated,
  adminController.getAccountsActionAdmin
);

router.post(
  "/user-account-action/action/:option",
  //ensureAuthenticated,
  adminController.postActionUserAdmin
);

//profile
router.get(
  "/lastlogins",
  ensureAuthenticated,
  ensureIsAdmin,
  adminController.getMyLastLogins
);

router.get(
  "/changepassword",
  ensureAuthenticated,
  ensureIsAdmin,
  adminController.getChangePasswordAdmin
);
router.post(
  "/changepassword",
  ensureAuthenticated,
  ensureIsAdmin,
  [validateNewPassword(), validateNewPasswordConfirm(), validateOldPassword()],
  adminController.postChangePasswordAdmin
);

//logout
router.get("/logout", ensureIsAdmin, adminController.getLogoutAdmin);

module.exports = router;
