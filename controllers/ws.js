//var _ = require("lodash"); //to compare 2 objects

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
      //protect against unauthenticated users sending ws msg
      if (!usernameNormalizedSender) {
        return;
      }

      const wsUser = usernameSocketWs.get(usernameNormalizedSender);
      //console.log(wsUser);
      if (wsUser) {
        //send ws message to blur document
        console.log("defined");
        io.to(wsUser.id).emit(
          "connectionAlreadyExists",
          JSON.stringify({
            msgText: "blur"
          })
        );
      } else {
        console.log("undefined");
        //cada vez que abre una conexion de ws, si tenia alguna abierta le envio msg para que haga blur
      }
      const lastWsUser = usernameLastOpenSocketWs.get(usernameNormalizedSender);
      //set
      console.log("last" + lastWsUser);
      if (lastWsUser) {
        io.to(lastWsUser.id).emit(
          "connectionAlreadyExists",
          JSON.stringify({
            msgText: "blur"
          })
        );
      }
      usernameSocketWs.set(usernameNormalizedSender, socket); //map username with web socket
      usernameLastOpenSocketWs.set(usernameNormalizedSender, socket); //map username with web socket

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

        if (isAllowed == 1) {
          let time = moment.getCurrentTimeUTC();

          try {
            //save msg db: guardar siempre en la db, se envie el msg en ese momento o no
            const chat = new Chat({
              //username: "name",
              msgText: data.msg,
              sender: {
                usernameNormalized: userSender.usernameNormalized,
                userId: userSender.id
              },
              receiver: {
                usernameNormalized: userReceiver.usernameNormalized,
                userId: userReceiver.id
              },
              showOnlyToSender: false,
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
              userReceiver.id,
              userReceiver.username,
              userReceiver.usernameNormalized
            );
            userSender.chatConversationsList = chatConversationsListSender;
            await userSender.save();

            //receiver
            const chatConversationsListReceiver = updateChatConversationsArrayReceiver(
              userReceiver.chatConversationsList,
              userSender.id,
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
        } else if (isAllowed == 2) {
          let time = moment.getCurrentTimeUTC();

          try {
            //save msg db: guardar siempre en la db, se envie el msg en ese momento o no
            const chat = new Chat({
              //username: "name",
              msgText: data.msg,
              sender: {
                usernameNormalized: userSender.usernameNormalized,
                userId: userSender.id
              },
              receiver: {
                usernameNormalized: userReceiver.usernameNormalized,
                userId: userReceiver.id
              },
              showOnlyToSender: true,
              date: time
            });
            await chat.save();

            //actualizo lista de los friends con los que ha chateado
            //sender
            const chatConversationsListSender = updateChatConversationsArraySender(
              userSender.chatConversationsList,
              userReceiver.id,
              userReceiver.username,
              userReceiver.usernameNormalized
            );
            userSender.chatConversationsList = chatConversationsListSender;
            await userSender.save();
          } catch (e) {}
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
            {
              "sender.usernameNormalized": senderMsg,
              "receiver.usernameNormalized": receiverMsg,
              read: false
            },
            { read: true }
          );
        } catch (e) {}

        //send msg read confirmation to msg sender
        const wsMsgSender = usernameSocketWs.get(senderMsg);
        console.log(wsMsgSender);
        if (wsMsgSender) {
          io.to(wsMsgSender.id).emit(
            "confirmMsgHasBeenRead",
            JSON.stringify({ msgText: "confirm", msgReceiver: receiverMsg })
          );
        }
      });

      socket.on("call", async function(message) {
        console.log(message);
        let data;

        //accepting only JSON messages
        try {
          data = JSON.parse(message);
        } catch (e) {
          console.log("Invalid JSON");
          data = {};
        }
        //console.log(data);
        let conn;
        //switching type of the user message
        switch (data.type) {
          case "calling":
            console.log("calling to: ", data.name);

            //test if caller has permission to call callee
            const isAllowedCode = await isCallerAllowedToCallCallee(
              usernameNormalizedSender,
              data.name
            );

            //get callee data
            const usernamePhoto = await getUsernameAndPhotoURL(
              usernameNormalizedSender
            );
            const username = usernamePhoto[0].username;

            console.log(isAllowedCode);
            if (isAllowedCode !== 0) {
              const msg = getNotAllowedMsg(isAllowedCode, username);

              conn = usernameSocketWs.get(usernameNormalizedSender);
              if (conn != null) {
                sendTo(conn, {
                  type: "callnotallowed",
                  msg: msg
                });
              }
            } else {
              conn = usernameSocketWs.get(data.name);
              if (conn != null) {
                const photo = usernamePhoto[0].imageURL;

                //set maps
                userCallStatus.set(usernameNormalizedSender, {
                  status: "calling",
                  otherUser: data.name
                });
                userCallStatus.set(data.name, {
                  status: "being_called",
                  otherUser: usernameNormalizedSender
                });

                sendTo(conn, {
                  type: "calling",
                  //offer: data.offer,
                  name: usernameNormalizedSender,
                  username: username,
                  photoURL: photo
                });
              }
            }
            break;

          case "callaccepted":
            console.log(userCallStatus.get(usernameNormalizedSender));
            //comprobar que tiene status being_called del caller
            userCallStatus.set(usernameNormalizedSender, {
              status: "accepted",
              otherUser: data.name
            });
            console.log(userCallStatus.get(usernameNormalizedSender));

            conn = usernameSocketWs.get(usernameNormalizedSender);
            if (conn != null) {
              sendTo(conn, {
                type: "confirmcallacceptreceived",
                name: data.name
              });
            }
            break;

          //reject
          case "callrejected":
            //for ex. UserA wants to call UserB
            console.log("Sending reject to: ", data.name);

            conn = usernameSocketWs.get(data.name);
            if (conn != null) {
              sendTo(conn, {
                type: "reject",
                name: usernameNormalizedSender
              });
            }

            userCallStatus.delete(usernameNormalizedSender);
            userCallStatus.delete(data.name);

            break;

          //ask for offer
          case "askforoffer":
            console.log(usernameNormalizedSender + " accepted");
            console.log(data.name);

            conn = usernameSocketWs.get(data.name);
            if (conn != null) {
              sendTo(conn, {
                type: "askforoffer",
                name: usernameNormalizedSender
              });
            }
            break;

          case "offer":
            console.log("Sending offer to: ", data.name);
            console.log(usernameNormalizedSender);

            conn = usernameSocketWs.get(data.name);
            if (conn != null) {
              sendTo(conn, {
                type: "offer",
                offer: data.offer,
                name: usernameNormalizedSender
              });
            }

            break;

          case "answer":
            console.log("Sending answer to: ", data.name);

            //set map as talking
            console.log(userCallStatus.get(usernameNormalizedSender));
            console.log(userCallStatus.get(data.name));
            userCallStatus.set(usernameNormalizedSender, {
              status: "talking",
              otherUser: data.name
            });
            userCallStatus.set(data.name, {
              status: "talking",
              otherUser: usernameNormalizedSender
            });
            console.log(userCallStatus.get(usernameNormalizedSender));
            console.log(userCallStatus.get(data.name));

            conn = usernameSocketWs.get(data.name);
            if (conn != null) {
              sendTo(conn, {
                type: "answer",
                answer: data.answer
              });
            }

            break;

          case "candidate":
            console.log("Sending candidate to:", data.name);

            conn = usernameSocketWs.get(data.name);
            if (conn != null) {
              sendTo(conn, {
                type: "candidate",
                candidate: data.candidate
              });
            }

            break;
          case "hangup":
            //see action type
            const call = userCallStatus.get(usernameNormalizedSender);
            const otherUser = call.otherUser;

            console.log("c");
            console.log(call);
            if (call) {
              conn = usernameSocketWs.get(otherUser);

              console.log("s" + call.status);
              if (conn != null) {
                if (call.status === "calling") {
                  //cancel call (peers are not yet talking)
                  console.log("Canceling call to", otherUser);
                  sendTo(conn, {
                    type: "cancel",
                    name: usernameNormalizedSender
                  });
                } else if (call.status === "talking") {
                  //end call (peers are already talking)
                  console.log("Disconnecting from", otherUser);
                  sendTo(conn, {
                    type: "leave",
                    name: usernameNormalizedSender
                  });
                }
              }
            }

            console.log(userCallStatus.get(usernameNormalizedSender));
            console.log(userCallStatus.get(otherUser));
            userCallStatus.delete(usernameNormalizedSender);
            userCallStatus.delete(otherUser);
            console.log(userCallStatus.get(usernameNormalizedSender));
            console.log(userCallStatus.get(otherUser));

            break;

          case "timeout":
            console.log("Sending timeout to: ", data.name);
            //if UserB exists then send him timeout details
            //var conn = users[data.name];
            conn = usernameSocketWs.get(data.name);

            if (conn != null) {
              //setting that UserA connected with UserB
              //connection.otherName = data.name;

              sendTo(conn, {
                type: "timeout",
                name: usernameNormalizedSender
              });
            }

            break;

          case "mediaError":
            console.log("Media error: ", data.msg);
            //if UserB exists then send him offer details
            //var conn = users[data.name];
            conn = usernameSocketWs.get(data.name);

            if (conn != null) {
              //setting that UserA connected with UserB
              //connection.otherName = data.name;

              sendTo(conn, {
                type: "mediaError",
                msg: data.msg,
                name: usernameNormalizedSender
              });
            }

            break;

          default:
            // sendTo(connection, {
            //   type: "error",
            //   message: "Command not found: " + data.type
            // });

            break;
        }
      });

      function sendTo(connection, message) {
        //connection.send(JSON.stringify(message));
        io.to(connection.id).emit("call", JSON.stringify(message));
      }

      socket.on("disconnect", function() {
        const call = userCallStatus.get(usernameNormalizedSender);
        if (call) {
          const otherUser = call.otherUser;
          if (otherUser) {
            conn = usernameSocketWs.get(otherUser);

            if (conn != null) {
              //setting that UserA connected with UserB
              //connection.otherName = data.name;

              const status = call.status;
              if (status === "calling") {
                //clear caller and callee maps
                console.log(userCallStatus.get(usernameNormalizedSender));
                console.log(userCallStatus.get(otherUser));
                userCallStatus.delete(usernameNormalizedSender);
                userCallStatus.delete(otherUser);
                console.log(userCallStatus.get(usernameNormalizedSender));
                console.log(userCallStatus.get(otherUser));

                sendTo(conn, {
                  type: "cancel",
                  // offer: data.offer, //esto sobra no
                  name: usernameNormalizedSender
                });
              } else if (status === "being_called") {
                console.log("r");

                //clear caller and callee maps
                console.log(userCallStatus.get(usernameNormalizedSender));
                console.log(userCallStatus.get(otherUser));
                userCallStatus.delete(usernameNormalizedSender);
                userCallStatus.delete(otherUser);
                console.log(userCallStatus.get(usernameNormalizedSender));
                console.log(userCallStatus.get(otherUser));

                sendTo(conn, {
                  type: "reject",
                  // offer: data.offer, //esto sobra no
                  name: usernameNormalizedSender
                });
              } else if (status === "accepted") {
                console.log("accept");
                //no libero el map
              } else if (status === "talking") {
                console.log("leave");

                //clear caller and callee maps
                console.log(userCallStatus.get(usernameNormalizedSender));
                console.log(userCallStatus.get(otherUser));
                userCallStatus.delete(usernameNormalizedSender);
                userCallStatus.delete(otherUser);
                console.log(userCallStatus.get(usernameNormalizedSender));
                console.log(userCallStatus.get(otherUser));

                sendTo(conn, {
                  type: "leave",
                  // offer: data.offer, //esto sobra no
                  name: usernameNormalizedSender
                });
              }
            }
          }
        }
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
      "receiver.usernameNormalized": usernameNormalizedSender,
      showOnlyToSender: false,
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
    if (msgSender[msgObj.sender.usernameNormalized]) {
      msgSender[msgObj.sender.usernameNormalized] += 1;
    } else {
      msgSender[msgObj.sender.usernameNormalized] = 1;
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
      "sender.usernameNormalized": usernameNormalizedSender,
      read: false
    });

    let msgReceiver = []; // array
    msg.forEach(function(msgObj) {
      if (!msgReceiver.includes(msgObj.receiver.usernameNormalized)) {
        msgReceiver.push(msgObj.receiver.usernameNormalized);
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
      // si son amigos y ninguno tiene bloqueado al otro: guardo el msg en la db y lo envio
      // si son amigos y receiver tiene bloqueado a sender: guardo el msg en la db pero no lo envio al receiver

      if (
        userReceiver.friends.some(
          e => e.usernameNormalized === usernameSender
        ) &&
        !userSender.blockedUsers.some(e => e.usernameNormalized === receiver) &&
        isMsgLengthValid(data.msg)
      ) {
        if (
          !userReceiver.blockedUsers.some(
            e => e.usernameNormalized === usernameSender
          )
        ) {
          console.log("allowed");
          return 1;
        } else {
          console.log("not allowed but save in db");
          return 2;
        }
      } else {
        //user sender is not allowed to send that msg to receiver
        //no hacer nada, no se envia ningun msg
        console.log("not allowed");
        return 3;
      }
    }
  } catch (e) {}
}

function updateChatConversationsArraySender(
  chatConversations,
  receiverId,
  receiverUsername,
  receiverUsernameNormalized
) {
  //si esta aqui es que son amigos y no estan bloqueados entre si
  const objUser = {
    userId: receiverId,
    usernameFriend: receiverUsername,
    usernameNormalizedFriend: receiverUsernameNormalized,
    isFriendCurrently: true,
    isBlocked: false,
    isDeletedAccount: false
  };

  //remove object from array by value
  let chatConversationsUpdated = [];
  chatConversations.forEach(item => {
    if (
      item.toObject().usernameNormalizedFriend !==
      objUser.usernameNormalizedFriend
    ) {
      chatConversationsUpdated.push(item.toObject());
    }
  });

  //add to array in last position
  chatConversationsUpdated.push(objUser);

  return chatConversationsUpdated;
}

function updateChatConversationsArrayReceiver(
  chatConversations,
  senderId,
  senderUsername,
  senderUsernameNormalized
) {
  const objUser = {
    userId: senderId,
    usernameFriend: senderUsername,
    usernameNormalizedFriend: senderUsernameNormalized,
    isFriendCurrently: true,
    isBlocked: false,
    isDeletedAccount: false
  };

  //remove object from array by value
  let chatConversationsUpdated = [];
  // chatConversationsUpdated = chatConversations.filter(item => {
  //   return !_.isEqual(item.toObject(), objUser);
  // });
  chatConversations.forEach(item => {
    if (
      item.toObject().usernameNormalizedFriend !==
      objUser.usernameNormalizedFriend
    ) {
      chatConversationsUpdated.push(item.toObject());
    }
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

async function getUsernameAndPhotoURL(usernameNormalized) {
  const data = await User.find({
    usernameNormalized: usernameNormalized
  })
    .select("username imageURL -_id")
    .lean();
  console.log(data);
  return data;
}

async function isCallerAllowedToCallCallee(
  callerUsernameNormalized,
  calleeUsernameNormalized
) {
  const caller = await User.findOne({
    usernameNormalized: callerUsernameNormalized
  }).select("friends blockedUsers  -_id");

  //if caller and callee are not friends
  const callerFriends = caller.friends;
  if (
    !callerFriends.some(e => e.usernameNormalized === calleeUsernameNormalized)
  ) {
    return 1;
  }

  //if caller has callee blocked
  const callerBlocked = caller.blockedUsers;
  if (
    callerBlocked.some(e => e.usernameNormalized === calleeUsernameNormalized)
  ) {
    return 2;
  }

  const callee = await User.findOne({
    usernameNormalized: calleeUsernameNormalized
  }).select("status friends blockedUsers  -_id");

  //if callee has caller blocked
  const calleeBlocked = callee.blockedUsers;
  if (
    calleeBlocked.some(e => e.usernameNormalized === callerUsernameNormalized)
  ) {
    return 3;
  }

  console.log("s");
  console.log(callee.status);
  //if callee is not online
  if (callee.status !== "online") {
    return 4;
  }

  //if callee is busy
  console.log("l");
  console.log(userCallStatus.get(calleeUsernameNormalized));
  if (userCallStatus.get(calleeUsernameNormalized) != undefined) {
    return 5;
  }

  return 0;
}

function getNotAllowedMsg(isAllowedCode, calleeUsername) {
  let msg;
  switch (isAllowedCode) {
    case 1: //they are not friends
      msg = `You can not call ${calleeUsername}, because you are not friends`;
      break;
    case 2: //caller has callee bloqued
      msg = `You can not call ${calleeUsername}, because you have him bloqued`;
      break;
    case 3: //callee has caller bloqued
      msg = `You are not allowed to call ${calleeUsername}`;
      break;
    case 4: //callee is not online
      msg = `You can not call ${calleeUsername}, because he is not currently online`;
      break;
    case 5: //callee is busy
      msg = `You can not call ${calleeUsername}, because he is busy in a call right now`;
      break;
    default:
      msg = `You can not call ${calleeUsername}`;
  }
  return msg;
}
