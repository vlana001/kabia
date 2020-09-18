const User = require("../models/user");
const mongoose = require("mongoose");

//I only export this functions
module.exports = {
  //You can only do each operation once, ex. requestFriendship
  //Un usuario solo podra estar en un array de friendship, salvo en friends y en blockedUsers
  //Antes de guardar un user en un array de friendship compruebas que no esta en ningun array de friendship,
  //ni en ningun otro array
  checkOperationIsValid: function(req, opType, friend) {
    return User.findById(req.user.id)
      .then(user => {
        if (user) {
          let arraysStatus = checkUserInArrays(user, friend);
          let msg = isOpAllowedMsg(opType, arraysStatus);
          return msg;
        }
      })
      .catch(err => {});
  },
  //no puedes realizar operaciones de amistad sobre ti mismo
  checkUserIsTheSame: function(currentUser, userProfileUsernameNormalized) {
    if (currentUser.usernameNormalized === userProfileUsernameNormalized) {
      return true;
    } else {
      return false;
    }
  },
  //para hacer operaciones de amistad sobre un usuario, este debe existir
  checkUserExists: async function(userProfileUsernameNormalized) {
    const user = await User.findOne({
      usernameNormalized: userProfileUsernameNormalized
    });
    if (user) {
      return true;
    } else {
      return false;
    }
  },
  //para saber que botones mostrar en profile
  isBlockedByCurrentUser: function(currentUser, userProfile) {
    return User.findById(currentUser.id)
      .then(user => {
        if (user) {
          if (
            user.blockedUsers.some(
              e => e.usernameNormalized === userProfile.usernameNormalized
            )
          ) {
            return true;
          } else {
            return false;
          }
        }
      })
      .catch(err => {});
  },
  //para saber que botones mostrar en profile
  isFriendOfCurrentUser: function(currentUser, userProfile) {
    return User.findById(currentUser.id)
      .then(user => {
        if (user) {
          if (
            user.friends.some(
              e => e.usernameNormalized === userProfile.usernameNormalized
            )
          ) {
            return true;
          } else {
            return false;
          }
        }
      })
      .catch(err => {});
  },
  isPendingActionUser: function(currentUser, userProfile) {
    return User.findById(currentUser.id)
      .then(user => {
        if (user) {
          if (
            user.friendshipRequestSent.some(
              e => e.usernameNormalized === userProfile.usernameNormalized
            )
          ) {
            return true;
          } else {
            return false;
          }
        }
      })
      .catch(err => {});
  },
  countNumberOfUserFriends: function(currentUser) {
    return User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(currentUser.id) } }, //filter
      { $unwind: "$friends" }, //subdocument
      {
        $group: {
          _id: "", //todos los subdocuments tendran un id
          count: { $sum: 1 }
        }
      }
    ])
      .then(result => {
        if (result.length === 0) {
          return 0;
        } else {
          return result[0].count;
        }
      })
      .catch(err => {});
  },
  isFriendOfCurrentUserUsingUsernameNormalized: function(currentUser, usernameNormalized) {
    return User.findById(currentUser.id)
      .then(user => {
        if (user) {
          if (
            user.friends.some(
              e => e.usernameNormalized === usernameNormalized
            )
          ) {
            return true;
          } else {
            return false;
          }
        }
      })
      .catch(err => {});
  }
};

//functions not exported
checkUserInArrays = (user, friend) => {
  let arraysStatus = {
    isInFriendsList: false,
    isInFriendshipRequestsSentList: false,
    isInFriendshipRequestsReceivedList: false,
    isInBlockedUsersList: false
  };

  if (user.friends.some(e => e.usernameNormalized === friend)) {
    arraysStatus.isInFriendsList = true;
  }

  if (user.friendshipRequestSent.some(e => e.usernameNormalized === friend)) {
    arraysStatus.isInFriendshipRequestsSentList = true;
  }

  if (
    user.friendshipRequestReceived.some(e => e.usernameNormalized === friend)
  ) {
    arraysStatus.isInFriendshipRequestsReceivedList = true;
  }

  if (user.blockedUsers.some(e => e.usernameNormalized === friend)) {
    arraysStatus.isInBlockedUsersList = true;
  }

  return arraysStatus;
};

isOpAllowedMsg = (opType, arraysStatus) => {
  let msg = "";

  switch (opType) {
    case 1: //request Frienship
      if (arraysStatus.isInFriendsList) {
        msg = "Ese user ya es tu amigo";
      }
      if (arraysStatus.isInFriendshipRequestsSentList) {
        msg = "Ya has solicitado amistad a ese usuario, espera su respuesta";
      }
      if (arraysStatus.isInFriendshipRequestsReceivedList) {
        msg =
          "Ese user ya te ha solicitado amistad a ti, aceptalo si quieres ser su amigo";
      }
      if (arraysStatus.isInBlockedUsersList) {
        msg =
          "Ese user lo tienes bloqueado, desbloquealo para solicitarle amistad";
      }
      break;
    case 2: //cancel friendship requests
      //Ver si esta en el array requested (send)
      if (!arraysStatus.isInFriendshipRequestsSentList) {
        msg =
          "No habias enviado una solicitud de amistad al usuario para que la pudieses cancelar";
      }
      break;
    case 3: //accept friendship request
      //Ver si esta en el array received
      if (!arraysStatus.isInFriendshipRequestsReceivedList) {
        msg =
          "No habias recibido una solicitud de amistad del usuario para que la pudieses aceptar";
      }
      break;
    case 4: //reject frienship request
      //Ver si esta en el array received
      if (!arraysStatus.isInFriendshipRequestsReceivedList) {
        msg =
          "No habias recibido una solicitud de amistad del usuario para que la pudieses rechazar";
      }
      break;
    //para bloquear/desbloquear no hace falta que los 2 users sean amigos
    case 5: //block user
      if (arraysStatus.isInBlockedUsersList) {
        msg = "Ese user ya lo tienes bloqueado";
      }
      break;
    case 6: //unblock user
      if (!arraysStatus.isInBlockedUsersList) {
        msg = "Ese user ya lo tienes desbloqueado";
      }
      break;
    case 7: // stop being friend and block
      //si el user esta ya bloqueado por el usuario, no se le muestra este boton
      if (!arraysStatus.isInFriendsList || arraysStatus.isInBlockedUsersList) {
        msg =
          "El user debe ser tu amigo y debe estar desbloqueado para que finalizes amistad con el y lo bloquees";
      }
      break;
    case 8: // stop being friend
      if (!arraysStatus.isInFriendsList) {
        msg = "El user debe ser tu amigo para que finalizes amistad con el";
      }
      break;
  }
  return msg;
};
