const express = require("express");
// const { body } = require("express-validator");
// const bcrypt = require("bcryptjs");

const authController = require("../controllers/auth");
// const { blacklistedPasswords } = require("../helpers/bannedPasswords");

const {
  ensureAuthenticated,
  redirectionIfAuthenticated,
  registeredUsingEmail,
  registeredUsingSocialLogin
} = require("../helpers/auth");

const {
  validateEmailRegister,
  validateEmail,
  validatePasswordLogin,
  acceptDeleteAccount,
  validatePassword,
  validateConfirmPassword,
  validateNewPassword,
  validateNewPasswordConfirm,
  validateOldPassword,
  passwordDeleteAccount
} = require("../helpers/validation");

//const User = require("../models/user");

const router = express.Router();

// /register
router.get(
  "/register",
  redirectionIfAuthenticated,
  authController.getRegisterUser
);
router.post(
  "/register",
  redirectionIfAuthenticated,
  [validateEmailRegister(), validatePassword(), validateConfirmPassword()],
  authController.postRegisterUser
);

//confirm email address when registering using email
router.get(
  "/confirmemail/:token/:email",
  redirectionIfAuthenticated,
  authController.getConfirmEmail
);

router.get(
  "/resend-email-confirmation/:email",
  redirectionIfAuthenticated,
  authController.getResendEmailConfirmationEmail
);

// /login (local auth)
router.get("/", redirectionIfAuthenticated, authController.getLoginUser);
router.post(
  "/",
  redirectionIfAuthenticated,
  [validateEmail(), validatePasswordLogin()],
  authController.postLoginUser
);

//logout
router.get("/logout", ensureAuthenticated, authController.getLogoutUser);

//forgot password (reset)
router.get(
  "/forgotpassword",
  redirectionIfAuthenticated,
  authController.getForgotPassword
);

router.get(
  "/forgotpassword/:email",
  redirectionIfAuthenticated,
  authController.getForgotPassword
);

router.post(
  "/forgotpassword",
  redirectionIfAuthenticated,
  [validateEmail()],
  authController.postForgotPassword
);

router.get(
  "/resetpassword/:token/:email",
  redirectionIfAuthenticated,
  authController.getResetPasswordNewPassword
);

router.post(
  "/resetpassword",
  redirectionIfAuthenticated,
  [validateNewPassword(), validateNewPasswordConfirm()],
  authController.postResetPasswordNewPassword
);

//delete account email/password
router.get(
  "/delete-account",
  ensureAuthenticated,
  registeredUsingEmail,
  authController.getDeleteAccount
);

router.post(
  "/delete-account",
  ensureAuthenticated,
  registeredUsingEmail,
  [acceptDeleteAccount(), passwordDeleteAccount()],
  authController.postDeleteAccount
);

//delete account social login
//multistep: no se puede saltar ningun paso, ya que necesita un token valido
router.get(
  "/delete-account-gf",
  ensureAuthenticated,
  registeredUsingSocialLogin,
  authController.getDeleteAccountGF
);

router.post(
  "/delete-account-gf-send-email",
  ensureAuthenticated,
  registeredUsingSocialLogin,
  authController.postDeleteAccountGFSendEmail
);

router.get(
  "/delete-account-gf-email/:token/:email/:regMethod",
  ensureAuthenticated,
  registeredUsingSocialLogin,
  authController.getDeleteAccountGFEmail
);

router.post(
  //Google and Facebook
  "/delete-account-gf",
  ensureAuthenticated,
  registeredUsingSocialLogin,
  [acceptDeleteAccount()],
  authController.postDeleteAccountGF //
);

//google auth (create account and login)
router.get("/google/oauth/:timezone", authController.getGoogleAuthAccount);
router.get("/google/callback", authController.getGoogleAuthCallback);

//facebook auth (create account and login)
router.get("/facebook/oauth/:timezone", authController.getFacebookAuthAccount);
router.get("/facebook/callback", authController.getFacebookAuthCallback);

// /changepassword
router.get(
  "/changepassword",
  ensureAuthenticated,
  registeredUsingEmail,
  authController.getChangePasswordUsers
);
router.post(
  "/changepassword",
  ensureAuthenticated,
  registeredUsingEmail,
  [validateNewPassword(), validateNewPasswordConfirm(), validateOldPassword()],
  authController.postChangePasswordUsers
);

// router.get(
//   "/password-change-success",
//   ensureAuthenticated,
//   authController.getPasswordChangeSuccess
// );

//admin
router.get("/admin-login", authController.getAdminLogin); //redirectionIfAuthenticated

router.post(
  "/admin-login",
  //redirectionIfAuthenticated,
  //[validateEmail(), validatePasswordLogin()], //no valido, para no dar pistas a un atacante de
  authController.postAdminLogin
);

module.exports = router;
