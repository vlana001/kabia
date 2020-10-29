const express = require("express");
const { body } = require("express-validator");

const User = require("../models/user");

const usersController = require("../controllers/users");

const {
  validateUsername,
  validateAllButUsername,
  validateUsernameSearchUsers,
  validateMaxAgeIsBiggerThanMinAge,
  validateProfilePhoto,
  validateLastTime,
  validateLimit
} = require("../helpers/validation");

const {
  ensureAuthenticated,
  ensureIsUser,
  ensureProfileCreated
} = require("../helpers/auth");

//const { multerGetImage } = require("../helpers/multer");

const router = express.Router();

// /menu
router.get(
  "/menu",
  ensureAuthenticated,
  ensureIsUser,
  ensureProfileCreated,
  usersController.getMenuUsers
);

router.get(
  "/online-users",
  ensureAuthenticated,
  ensureIsUser,
  ensureProfileCreated,
  usersController.getOnlineUsers
);

// /searchusers
router.get(
  "/searchusers",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.getSearchUsers
);

router.post(
  "/searchusers",
  ensureAuthenticated,
  ensureProfileCreated,
  [validateMaxAgeIsBiggerThanMinAge()],
  usersController.postSearchUsers
);

//searchusersbyusername
router.get(
  "/searchusersbyusername",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.getSearchUsersByUsername
);

router.post(
  "/searchusersbyusername",
  ensureAuthenticated,
  ensureProfileCreated,
  [validateUsernameSearchUsers()],
  usersController.postSearchUsersByUsername
);

//search friend
router.get(
  "/searchfriend",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.getSearchFriend
);
router.post(
  "/searchfriend",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.postSearchFriend
);

// /createprofile
router.get(
  "/createprofile",
  ensureAuthenticated,
  usersController.getCreateProfileUser
);
router.post(
  "/createprofile",
  ensureAuthenticated,
  // multerGetImage,
  [
    validateUsername(), //username can not be changed once you have created a profile
    validateAllButUsername(),
    validateProfilePhoto()
  ],
  usersController.postCreateProfileUser
);

// /editprofile
router.get(
  "/editprofile",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.getEditProfileUsers
);
router.post(
  "/editprofile",
  ensureAuthenticated,
  ensureProfileCreated,
  //multerGetImage,
  [validateAllButUsername()],
  usersController.postEditProfileUsers
);

//see user profile
router.get(
  "/u/:username",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.getUserProfile
);

//see my profile
router.get(
  "/myprofile",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.getMyProfile
);

//chat
router.get(
  ["/chat", "/chat/:username"],
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.getUserChat
);

router.post(
  "/chat-load-msg",
  ensureAuthenticated,
  ensureProfileCreated,
  //no valido si el receiver es amigo, por que si tiene msg con el receiver
  // es que era amigo cuando se los envio porque
  //cuando se envia un msg se valida a ver si se le puede enviar
  [validateLastTime(), validateLimit()],
  usersController.postLoadChat
);

router.post(
  "/set-user-msg-read",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.postSetUserMsgRead
);

router.post(
  "/get-image-name",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.postGetImgName
);

//call
router.get(
  ["/call/:username", "/call/:opt/:username"],
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.getCall
);

//friends
router.get(
  "/myfriends",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.getMyFriends
);

router.get(
  "/myfriends-online",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.getMyFriendsOnline
);

//friendship
router.post(
  "/request-friendship", //send-friendship-request
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.postUserRequestFriendship //
);

router.get(
  "/friendship-requests/:option",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.getFriendshipRequests
);

router.post(
  "/cancel-sent-friendship-request",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.postCancelSentFriendshipRequest
);

router.post(
  "/accept-friendship-request",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.postAcceptFriendshipRequest
);

router.post(
  "/reject-friendship-request",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.postRejectFriendshipRequest
);

//friends
router.get(
  "/blocked-users",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.getBlockedUsers
);

router.post(
  "/block-user",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.postBlockUser
);

router.post(
  "/unblock-user",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.postUnblockUser
);

router.post(
  "/end-friendship",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.postEndFriendship
);

router.post(
  "/end-friendship-block",
  ensureAuthenticated,
  ensureProfileCreated,
  usersController.postEndFriendshipBlock
);

//notifications
router.get(
  "/notifications",
  ensureAuthenticated,
  usersController.getNotifications
);

module.exports = router;
