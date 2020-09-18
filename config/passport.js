const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const bcrypt = require("bcryptjs");
const validator = require("validator");

//Load keys
const keys = require("./keys");

// Load user model
const User = require("../models/user");
const UserAction = require("../models/userAction");

const { transporter } = require("../helpers/awsEmail");
const { calculateUnbanningDateInTime } = require("../helpers/moment");

//Local authentication
//user normal: aqui solo se hace el login, no el register
module.exports.localAuthUser = function(passport) {
  passport.use(
    "user-local",
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      // Match user
      User.findOne({
        //Email is saved normalized so to make the query I have to compare with a normalized email
        email: validator.normalizeEmail(email),
        role: "user",
        password: { $exists: true, $ne: null }
      }).then(user => {
        if (!user) {
          return done(null, false, { message: "No User Found" });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            if (user.confirmEmailToken !== undefined) {
              return done(null, false, {
                message: "EmailNotVerified",
                email: user.email
              });
            } else if (user.status.toString() === "banned") {
              const unbanningDate = calculateUnbanningDateInTime(
                user.banned.banEndDate
              );

              return done(null, false, {
                message: "Banned",
                unbanningDate: unbanningDate
                //time: user.bannedTillDate
              });
            } else {
              return done(null, user);
            }
          } else {
            return done(null, false, { message: "Password Incorrect" });
          }
        });
      });
    })
  );

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
};

//admin: aqui solo se hace el login, no el register
module.exports.localAuthAdmin = function(passport) {
  passport.use(
    "admin-local",
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      // Match user
      User.findOne({
        //Email is saved normalized so to make the query I have to compare with a normalized email
        email: validator.normalizeEmail(email),
        role: "administrator",
        password: { $exists: true, $ne: null }
      }).then(user => {
        if (!user) {
          return done(null, false, { message: "No User Found" });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Password Incorrect" });
          }
        });
      });
    })
  );

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
};

//Google OAuth
module.exports.googleAuth = function(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: keys.GOOGLE_CLIENT_ID,
        clientSecret: keys.GOOGLE_CLIENT_SECRET,
        callbackURL: "/google/callback",
        proxy: true
      },
      (accessToken, refreshToken, profile, done) => {
        // console.log(accessToken);
        //console.log(profile);

        //If user is registering: save user data in the database
        //If user is logging in: get user data
        const newUser = new User({
          googleID: profile.id,
          email: profile.emails[0].value,
          //guardo en la db y luego los muestro en los inputs de /createprofile
          // username: profile.name.givenName + " " + profile.name.familyName,
          status: "profile_not_created",
          role: "user"
        });

        // Check for existing user (that googleid already exists in the database)
        User.findOne({
          googleID: profile.id
        }).then(user => {
          if (user) {
            //user exists in the app
            if (user.status.toString() === "banned") {
              const unbanningDate = calculateUnbanningDateInTime(
                user.banned.banEndDate
              );

              return done(null, user, {
                message: "Banned",
                unbanningDate: unbanningDate
                //time: user.bannedTillDate
              });
            } else {
              // Return user
              done(null, user);
            }
          } else {
            // Create user
            new User(newUser).save().then(user => {
              //send welcome email
              if (user) {
                const action = new UserAction({
                  userIdActionDoer: user._id,
                  actionType: "user_registration",
                  strategy: "google"
                });
                action.save();

                if (keys.send_email_allowed) {
                  transporter.sendMail({
                    from: "appeuskara@gmail.com",
                    to: newUser.email,
                    subject: "Welcome to app Euskara",
                    html: `
                    <p>Welcome to app Euskara</p>
                    <p>If you didn't request this email, please ignore it</p><br>
                    <p>App Euskara</p>`,
                    ses: {}
                  });
                }
              }
              done(null, user);
            });
          }
        });
      }
    )
  );

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
};

//Facebook OAuth
module.exports.facebookAuth = function(passport) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: keys.FACEBOOK_APP_ID,
        clientSecret: keys.FACEBOOK_APP_SECRET,
        callbackURL: "/facebook/callback",
        profileFields: ["id", "displayName", "email"],
        proxy: true
      },
      (accessToken, refreshToken, profile, done) => {
        // console.log(accessToken);
        // console.log(profile);

        //If user is registering: save user data in the database
        //If user is logging in: get user data
        const newUser = new User({
          facebookID: profile.id,
          email: profile.emails[0].value,
          // username: profile.displayName,
          status: "profile_not_created",
          role: "user"
        });

        // Check for existing user (that facebookid already exists in the database)
        User.findOne({
          facebookID: profile.id
        }).then(user => {
          if (user) {
            if (user.status.toString() === "banned") {
              const unbanningDate = calculateUnbanningDateInTime(
                user.banned.banEndDate
              );

              return done(null, user, {
                message: "Banned",
                unbanningDate: unbanningDate
                //time: user.bannedTillDate
              });
            } else {
              // Return user
              done(null, user);
            }
          } else {
            // Create user
            new User(newUser).save().then(user => {
              if (user) {
                const action = new UserAction({
                  userIdActionDoer: user._id,
                  actionType: "user_registration",
                  strategy: "facebook"
                });
                action.save();

                //send welcome email
                if (keys.send_email_allowed) {
                  transporter.sendMail({
                    from: "appeuskara@gmail.com",
                    to: newUser.email,
                    subject: "Welcome to app Euskara",
                    html: `
                  <p>Welcome to app Euskara</p>
                  <p>If you didn't request this email, please ignore it</p><br>
                  <p>App Euskara</p>`,
                    ses: {}
                  });
                }
              }
              done(null, user);
            });
          }
        });
      }
    )
  );

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
};
