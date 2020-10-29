//core modules
const path = require("path");

//3rd party modules
const express = require("express");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
//https
// var https = require("https");
// const fs = require("fs");

const errorController = require("./controllers/error");

//const { getCookieFromWsHeader } = require("./helpers/auth");

const User = require("./models/user");

const app = express();
//http
var http = require("http").createServer(app);
var io = require("socket.io")(http);

// //https
// const privateKey = fs.readFileSync("./ssl/server.key");
// const certificate = fs.readFileSync("./ssl/server.cert");

// const http = https.createServer(
//   {
//     key: privateKey,
//     cert: certificate
//   },
//   app
// );
// var io = require("socket.io")(http);

//use express behind a proxy
app.set("trust proxy", true);

//app.io = io;
//middleware to attach the io instance to req object in order to be able to use socketio functions in route handlers
app.use((req, res, next) => {
  req.io = io;
  //res.io = io
  next();
});
const { ws } = require("./controllers/ws");

//Views
app.set("view engine", "ejs");
app.set("views", "views");

// Load routes
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
//const shopRoutes = require('./routes/shop');

// Load Keys
const keys = require("./config/keys");

//global variable
//let cookieWs = [];//{}
global.cookieUsernameWs = new Map(); //map
global.usernameSocketWs = new Map(); //map
global.usernameLastOpenSocketWs = new Map(); //map
global.usernameNotOnlineTimeoutFunction = new Map(); //map
global.userCallStatus = new Map(); //map


// Passport Config
require("./config/passport").localAuthUser(passport);
require("./config/passport").localAuthAdmin(passport);
require("./config/passport").googleAuth(passport);
require("./config/passport").facebookAuth(passport);

// Body Parser Middleware
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));

//Static files
app.use(
  express.static(path.join(__dirname, "public"), {
    // maxAge: 86400000 //cache static resources : 24 * 60 * 60 * 1000
  })
);

// Express session midleware
//app.set('trust proxy', 1) // trust first proxy
app.use(
  session({
    secret: keys.sessionSecret,
    resave: true, //
    saveUninitialized: true, //
    cookie: { maxAge: null } //session cookie
  })
);

// Passport middleware (after sessions middleware)
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// app.get("/user", (req, res) => {
//   console.log(req.route);
//   res.send("GET");
// });

//Use routes
app.use("/admin", adminRoutes);
app.use("/users", userRoutes);
app.use(authRoutes);

//const port = process.env.PORT || 5000;
//const PORT = 3000;

//error handling
//poner aqui (antes de los routes handlers de error 404) los route handlers de error 500
app.get("/500", errorController.get500);
app.get("/admin/500", errorController.get500Admin);

// app.use(errorController.get404);
app.get("/404", errorController.get404);
app.get("/admin/404", errorController.get404Admin);

app.use(function(req, res, next) {
  if (req.user === undefined) {
    res.redirect("/404");
  } else {
    if (req.user.role === "user") {
      res.redirect("/404");
    } else {
      //admin
      res.redirect("/admin/404");
    }
  }
});

//error middleware
app.use((error, req, res, next) => {
  console.log(error);
  if (req.user === undefined) {
    res.redirect("/500");
  } else {
    if (req.user.role === "user") {
      res.redirect("/500");
    } else {
      //admin
      res.redirect("/admin/500");
    }
  }
});

mongoose
  .connect(keys.dbURI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
  })
  .then(result => {
    console.log("MongoDB Connected...");
    // app.listen(PORT, function() {
    //   console.log(`Listening on port ${PORT}`);
    // });
    http.listen(keys.PORT, "0.0.0.0", function() {
      console.log(`Listening on port ${keys.PORT}`);
    });
  })
  .catch(err => {
    console.log(err);
  });

//socketio
ws(io);

//do some task before restarting with nodemon or before shutting own (stopping the process)
process.on("SIGINT", function() {
  console.log("About to close");
  for (const [key, value] of cookieUsernameWs.entries()) {
    console.log(key, value);
    //set status as profile_created
  }
  //process.exit(0); //sobra?
});

//nodemon
process.once("SIGUSR2", async function() {
  console.log("About to restart");
  //iterate map
  for (const [key, value] of cookieUsernameWs.entries()) {
    console.log(key, value);
    if (value) {
      //if value!=undefined
      //set status as profile_created
      await User.updateOne(
        { usernameNormalized: value, status: "online" },
        { status: "profile_created" }
      );
    }
  }
  for (const [key, value] of usernameSocketWs.entries()) {
    console.log(key, value.id);
  }
  process.kill(process.pid, "SIGUSR2");
});
