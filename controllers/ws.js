var _ = require("lodash"); //to compare 2 objects

//models
const Chat = require("../models/chat");
const User = require("../models/user");

const moment = require("../helpers/moment");

module.exports = {
  ws: io => {
    //let userArray = [];

    //socket.io
    // var socket = require("./helpers/socketio");
    // socket.socketio;

    io.on("connection", async function(socket) {
      console.log("a user connected, socketId: " + socket.id);

      //map username to ws
      // mapUsernameToWs(socket);
      const cookie = getCookieFromWsHeader(socket.handshake.headers.cookie);
      const usernameNormalizedSender = cookieUsernameWs.get(cookie); //usuario que crea el ws
      console.log("user:" + usernameNormalizedSender + ",cookie:" + cookie);
      usernameSocketWs.set(usernameNormalizedSender, socket); //map username with web socket

      //protect against unauthenticated users sending ws msg
      if (!usernameNormalizedSender) {
        return;
      }

      //Each time that a ws is created, this checks are made
      if (usernameNormalizedSender) {
        //tiene que tener el profile creado (si tiene username es que tiene el profile creado)
        //1-set user is online
        //remove timeout
        clearTimeout(
          usernameNotOnlineTimeoutFunction.get(usernameNormalizedSender)
        );
        await User.updateOne(
          {
            usernameNormalized: usernameNormalizedSender,
            status: { $ne: "online" }
          },
          { status: "online" }
        );

        //1-check if that user has pending (unread) messages
        const unreadMsg = await checkUserHasPendingMsg(
          io,
          usernameNormalizedSender
        );

        //comprobar si el user tiene nuevas solicitudes de amistad
        await checkUserHasNewFriendshipReq(io, usernameNormalizedSender);

        //comprobar si el user tiene notificaciones sin leer
        //await checkUserHasUnreadNotifications(io, usernameNormalizedSender);

        if (unreadMsg.length > 0) {
          //2-check if that user has pending messages how many of them are from each of his friends
          checkUserHowManyPendingMsg(io, unreadMsg, usernameNormalizedSender);
        }
        //3-check if that user has sent any msg that has not been readed by the receiver
        await checkUserHasSentUnreadMsg(io, usernameNormalizedSender);
      }

      // console.log(
      //   "test" + usernameSocketWs.get(usernameNormalized).handshake.headers.cookie
      // );

      // socket.id = 2; //set socketId
      // console.log(socket.id);
      // let socketId;
      // if (socketId === undefined) {
      //   console.log(2);
      // }
      //userArray.push(socket);
      //console.log(userArray[0]);
      //console.log(userArray.length);

      // socket.on("chat message", function(msg) {
      //   console.log("message: " + msg);
      // });

      //cuando un user envia un mensaje otro user amigo suyo
      //creo una room para esos 2 users: username1-username2 (alfabeticamente mayor)
      // socket.on('join', function (data) {
      //   socket.join(data.email); // We are using room of socket io
      // });

      // socket.on("join", function(data) {
      //comprobaciones para saber si añado el user a la room
      // //crear el nombre de la room
      // const usernameSender = req.user.usernameNormalized;
      // const usernameReceiver = req.body.userReceiver;
      //const roomName = "u1" + "-" + "u2"; //data.receiver;
      //console.log("joining room", roomName);
      //join room
      //socket.join(roomName); //u2
      //userArray[0].join(roomName); //u1
      // io.of("/")
      //   .in(roomName)
      //   .clients((error, clients) => {
      //     if (error) throw error;
      //     console.log("number " + clients);
      //   });
      //envio al receiver para que este haga join
      // sending to individual socketid (private message)
      // io.to(`${socketId}`).emit("hey", "I just met you");
      // sending to all clients in 'game' room except sender
      // socket.to("game").emit("nice game", "let's play a game");
      // });

      socket.on("chatSend", async function(data) {
        //o debo cogerlo de nuevo
        // let cookieSender = socket.handshake.headers.cookie;
        // console.log(cookieSender);

        // let usernameSender = cookieUsernameWs.get(
        //   getCookieFromWsHeader(cookieSender)
        // );
        // console.log(usernameSender);

        const userSender = await User.findOne({
          usernameNormalized: usernameNormalizedSender
        });
        //console.log("f" + usernameNormalizedSender);

        const receiver = data.to;
        const userReceiver = await User.findOne({
          usernameNormalized: receiver
        });

        const isAllowed = await checkSenderIsAllowedToSendMsg(
          socket,
          data,
          userSender,
          userReceiver,
          usernameNormalizedSender
        );

        if (isAllowed) {
          let time = moment.getCurrentTimeUTC();

          try {
            //save msg db: guardar siempre en la db, se envie el msg en ese momento o no
            const chat = new Chat({
              //username: "name",
              msgText: data.msg,
              sender: usernameNormalizedSender,
              receiver: receiver,
              date: time
            });
            await chat.save();

            //actualizo lista de los friends con los que ha chateado
            // //remove from array
            // const user1 = await User.updateOne(
            //   { usernameNormalized: usernameNormalizedSender },
            //   {
            //     $pull: {
            //       chatConversationsList: {
            //         usernameNormalizedFriend: receiver
            //       }
            //     }
            //   }
            // );
            // console.log(user1.nModified);

            // //add to array
            // const user = await User.updateOne(
            //   { usernameNormalized: usernameNormalizedSender },
            //   {
            //     $push: {
            //       chatConversationsList: {
            //         usernameFriend: receiver,
            //         usernameNormalizedFriend: receiver
            //       }
            //     }
            //   }
            // );
            //console.log(user.nModified);
            //falta para receiver
            //asi haria 2 op de db mas

            //sender
            const chatConversationsListSender = updateChatConversationsArraySender(
              userSender.chatConversationsList,
              userReceiver.username,
              userReceiver.usernameNormalized
            );
            userSender.chatConversationsList = chatConversationsListSender;
            await userSender.save();

            //receiver
            const chatConversationsListReceiver = updateChatConversationsArrayReceiver(
              userReceiver.chatConversationsList,
              userSender.username,
              userSender.usernameNormalized
            );
            userReceiver.chatConversationsList = chatConversationsListReceiver;
            await userReceiver.save();
          } catch (e) {}

          // sending to individual socketid (private message)
          const receiverSocket = usernameSocketWs.get(receiver);
          //console.log(receiverSocket.handshake.headers.cookie, data.msg);
          if (receiverSocket !== undefined) {
            let sendData = {
              msgText: data.msg,
              msgTime: time,
              msgSender: userSender.username,
              msgSenderNormalized: usernameNormalizedSender
            };
            //send msg
            io.to(receiverSocket.id).emit(
              "chatReceive",
              JSON.stringify(sendData)
            );
          }
        }
      });

      socket.on("setMsgRead", async function(data) {
        const receiverMsg = usernameNormalizedSender;
        const senderMsg = data.from; //no valido, porque es absurdo que pasen mmediante tampering otro
        //tendra que ser su amigo para que se cambie read en la db, y si es su amigo lo puede hacer dando click
        //en el dom a ese user
        //pongo todos los msg que tengan ese receiver y ese sender como leidos
        console.log(receiverMsg);
        console.log(senderMsg);
        try {
          const result = await Chat.updateMany(
            { sender: senderMsg, receiver: receiverMsg, read: false },
            { read: true }
          );
        } catch (e) {}
      });

      socket.on("disconnect", function() {
        //free map array
        freeUserMapArray(socket);

        //setTimeout: if in 12 secs that users doesnt create a new ws, we will set him as not online
        if (usernameNormalizedSender) {
          const timeoutNotOnline = setTimeout(async function() {
            console.log("timeout");
            await User.updateOne(
              {
                usernameNormalized: usernameNormalizedSender,
                status: "online"
              },
              { status: "profile_created" }
            );
          }, 12000);
          usernameNotOnlineTimeoutFunction.set(
            usernameNormalizedSender,
            timeoutNotOnline
          );
        }

        //show msg
        console.log("user disconnected");
      });
    });
  }
};

//helpers
function getCookieFromWsHeader(cookie) {
  //const cookie = socket.handshake.headers.cookie;
  //console.log(cookie);
  let str1 = cookie.split("=")[1];
  //console.log(str1);
  let str2 = str1.split(".")[0];
  //console.log(str2);
  let sessionId = str2.split("s%3A")[1];
  //console.log(sessionId);
  return sessionId;
}

// const cookie = socket.handshake.headers.cookie;
// //console.log(cookie);
// let str1 = cookie.split("=")[1];
// //console.log(str1);
// let str2 = str1.split(".")[0];
// //console.log(str2);
// let str3 = str2.split("s%3A")[1];
// //console.log(str3);

function isMsgLengthValid(msgValue) {
  const msgLength = msgValue.length;
  //console.log(msgLength);
  if (msgLength < 4096) {
    return true;
  }
  return false;
}

// function mapUsernameToWs(socket) {
//   const cookie = getCookieFromWsHeader(socket.handshake.headers.cookie);
//   const usernameNormalized = cookieUsernameWs.get(cookie); //usuario que crea el ws
//   console.log("user:" + usernameNormalized + ",cookie:" + cookie);
//   usernameSocketWs.set(usernameNormalized, socket); //map username with web socket
// }

function freeUserMapArray(socket) {
  const cookie = getCookieFromWsHeader(socket.handshake.headers.cookie);
  usernameNormalizedSender = cookieUsernameWs.get(cookie);
  usernameSocketWs.delete(usernameNormalizedSender);
}

async function checkUserHasPendingMsg(io, usernameNormalizedSender) {
  try {
    const msg = await Chat.find({
      receiver: usernameNormalizedSender,
      read: false
    });
    //console.log("un" + usernameNormalizedSender);
    const unreadMsgNumber = msg.length;
    //console.log(unreadMsgNumber);
    //send to the user the number of unreaded msg that he has
    const unreadMsgNum = {
      unreadMsgNumber: unreadMsgNumber
    };
    io.to(usernameSocketWs.get(usernameNormalizedSender).id).emit(
      "unreadMessagesNumber",
      JSON.stringify(unreadMsgNum)
    );
    // if (unreadMsgNumber > 0) {
    //   return true;
    // }
    // return false;
    return msg;
  } catch (e) {}
}

function checkUserHowManyPendingMsg(io, msg, usernameNormalizedSender) {
  //send to the user the number of unreaded msg that he has from each of his friends
  let msgSender = []; //associative array
  msg.forEach(function(msgObj) {
    if (msgSender[msgObj.sender]) {
      msgSender[msgObj.sender] += 1;
    } else {
      msgSender[msgObj.sender] = 1;
    }
  });

  let msgSenderArr = [];
  for (let key in msgSender) {
    const obj = {
      username: key,
      msgNum: msgSender[key]
    };
    msgSenderArr.push(obj);
  }

  io.to(usernameSocketWs.get(usernameNormalizedSender).id).emit(
    "unreadMessagesNumberEachFriend",
    JSON.stringify(msgSenderArr)
  );
}

async function checkUserHasSentUnreadMsg(io, usernameNormalizedSender) {
  try {
    const msg = await Chat.find({
      sender: usernameNormalizedSender,
      read: false
    });
    let msgReceiver = []; // array
    msg.forEach(function(msgObj) {
      if (!msgReceiver.includes(msgObj.receiver)) {
        msgReceiver.push(msgObj.receiver);
      }
    });
    const objReceiversWithUnreadMsg = {
      friends: msgReceiver
    };

    io.to(usernameSocketWs.get(usernameNormalizedSender).id).emit(
      "unreadMessagesStatusEachFriend",
      JSON.stringify(objReceiversWithUnreadMsg)
    );
  } catch (e) {}
}

async function checkSenderIsAllowedToSendMsg(
  socket,
  data,
  userSender,
  userReceiver,
  usernameSender
) {
  try {
    //let receiver = userArray[0].id;
    //let msg = { msgText: data, time: "s" };

    const receiver = data.to;
    //validaciones para saber si puede enviar el mensaje
    //check if sender is allowed to send that msg to receiver
    //si existe ese receiver
    if (userReceiver) {
      // si son amigos y ninguno tiene bloqueado al otro: enviar msg
      if (
        userReceiver.friends.some(
          e => e.usernameNormalized === usernameSender
        ) &&
        !userReceiver.blockedUsers.some(
          e => e.usernameNormalized === usernameSender
        ) &&
        !userSender.blockedUsers.some(e => e.usernameNormalized === receiver) &&
        isMsgLengthValid(data.msg)
      ) {
        console.log("allowed");
        return true;
      } else {
        //user sender is not allowed to send that msg to receiver
        //no hacer nada, no se envia ningun msg
        console.log("not allowed");
        return false;
      }
    }
  } catch (e) {}
}

function updateChatConversationsArraySender(
  chatConversations,
  receiverUsername,
  receiverUsernameNormalized
) {
  //si esta aqui es que son amigos y no estan bloqueados entre si
  const objUser = {
    usernameFriend: receiverUsername,
    usernameNormalizedFriend: receiverUsernameNormalized,
    isFriendCurrently: true,
    isBlocked: false
  };

  //remove object from array by value
  let chatConversationsUpdated = [];
  chatConversationsUpdated = chatConversations.filter(item => {
    return !_.isEqual(item.toObject(), objUser);
  });

  //add to array in last position
  chatConversationsUpdated.push(objUser);

  return chatConversationsUpdated;
}

function updateChatConversationsArrayReceiver(
  chatConversations,
  senderUsername,
  senderUsernameNormalized
) {
  const objUser = {
    usernameFriend: senderUsername,
    usernameNormalizedFriend: senderUsernameNormalized,
    isFriendCurrently: true,
    isBlocked: false
  };

  //remove object from array by value
  let chatConversationsUpdated = [];
  chatConversationsUpdated = chatConversations.filter(item => {
    return !_.isEqual(item.toObject(), objUser);
  });

  //add to array in last position
  chatConversationsUpdated.push(objUser);

  return chatConversationsUpdated;
}

async function checkUserHasNewFriendshipReq(io, usernameNormalizedSender) {
  try {
    const friendshipReq = await User.find({
      usernameNormalized: usernameNormalizedSender
    })
      .select("friendshipRequestReceived -_id")
      .lean();

    const newFriendshipReq = friendshipReq[0].friendshipRequestReceived.length;

    if (newFriendshipReq > 0) {
      const newFriendshipNum = {
        newFriendshipReqsNumber: newFriendshipReq
      };
      io.to(usernameSocketWs.get(usernameNormalizedSender).id).emit(
        "newFriendshipRequestsNumber",
        JSON.stringify(newFriendshipNum)
      );
    }
  } catch (e) {}
}

async function checkUserHasUnreadNotifications(io, usernameNormalizedSender) {
  try {
    const unreadNotifications = await Notification.find({
      usernameNormalized: usernameNormalizedSender,
      read: false
    });
    // .select("friendshipRequestReceived -_id")
    // .lean()

    if (unreadNotifications.length > 0) {
      io.to(usernameSocketWs.get(usernameNormalizedSender).id).emit(
        "newNotificationsNumber",
        JSON.stringify({
          unreadNotificationsNumber: unreadNotifications.length
        })
      );
    }
  } catch (e) {}
}
