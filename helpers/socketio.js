module.exports = {
  socketio: function() {
    io.on("connection", function(socket) {
      console.log("a user connected, socketId: " + socket.id);

      // const cookie = socket.handshake.headers.cookie;
      // //console.log(cookie);
      // let str1 = cookie.split("=")[1];
      // //console.log(str1);
      // let str2 = str1.split(".")[0];
      // //console.log(str2);
      // let str3 = str2.split("s%3A")[1];
      // //console.log(str3);

      const cookie = getCookieFromWsHeader(socket.handshake.headers.cookie);
      usernameNormalized = cookieUsernameWs.get(cookie); //usuario que envia el ws
      console.log("user:" + usernameNormalized + ",cookie:" + cookie);
      usernameSocketWs.set(usernameNormalized, socket); //map username with socket
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

      socket.on("chatSend", function(data) {
        console.log(socket.handshake.headers.cookie);

        //let receiver = userArray[0].id;
        //let msg = { msgText: data, time: "s" };

        const receiver = data.to;
        //isAllowedToSendMsg() //validaciones para saber si puede enviar el mensaje
        const receiverSocket = usernameSocketWs.get(receiver);
        //console.log(receiverSocket.handshake.headers.cookie, data.msg);

        // sending to individual socketid (private message)
        if (receiverSocket !== undefined) {
          //save msg db

          //send msg
          io.to(receiverSocket.id).emit("chatReceive", data.msg);
        }
      });

      socket.on("disconnect", function() {
        //free map array
        const cookie = getCookieFromWsHeader(socket.handshake.headers.cookie);
        usernameNormalized = cookieUsernameWs.get(cookie);
        usernameSocketWs.delete(usernameNormalized);
        //show msg
        console.log("user disconnected");
      });
    });

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
  }
};
