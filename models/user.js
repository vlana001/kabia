const mongoose = require("mongoose");

const Schema = mongoose.Schema;

//Create schema
const userSchema = new Schema({
  //username y usernameNormalized se crean al crear el perfil
  username: {
    //unique
    type: String
    //unique: true
    //required: true
  },
  usernameNormalized: {
    type: String
    //unique
  },
  role: {
    type: String,
    enum: ["user", "administrator"],
    required: true
  },
  email: {
    //email, google and facebook registering
    type: String,
    required: true
  },
  confirmEmailToken: {
    type: String
    //required: true //the may not be signin in with email address
  },
  confirmEmailTokenExpiration: {
    type: Date
  },
  // registrationMethod: {
  //   //email, google and facebook registering
  //   type: String,
  //   enum: ["email_password", "google_account", "facebook_account"],
  //   required: true
  // },
  // registratioDate: {
  //   //email, google and facebook registering
  //   type: Date,
  //   required: true,
  //   default: hourSpain(2)
  // },
  //Registered using email and password
  password: {
    type: String
    //required: true //the may not be signin in with email address
  },
  resetToken: {
    type: String
  },
  resetTokenExpiration: {
    type: Date
  },
  //Registered using Google or Facebook account
  googleID: {
    type: String
    //required: true //the may not be signin in with google
  },
  facebookID: {
    type: String
    //required: true //the may not be signin in with facebook
  },
  deleteAccountToken: {
    type: String
  },
  deleteAccountTokenExpiration: {
    type: Date
  },
  //
  date: {
    //registration date, MongoDB stores date in UTC format always.
    type: Date,
    default: Date.now,
    required: true
  },
  imageURL: {
    type: String
    //required: true
  },
  gender: {
    type: String,
    //enum
    enum: ["male", "female"]
    //required: true
  },
  euskLevel: {
    type: String, //duda lo pongo number
    //enum
    enum: ["1", "2", "3", "4", "5"]

    //required: true
  },
  birthDate: {
    //We just want to print it
    type: String //duda: js date only date not time
    //required: true
  },
  aboutMe: {
    type: String
  },
  birthPlace: {
    type: String
  },
  livingPlace: {
    type: String
  },

  //steps 2 completed, profile not completed
  status: {
    //logged in (online)
    //enum
    type: String,
    enum: [
      "profile_not_created",
      "profile_created",
      "online",
      "account_lockdown",
      "banned"
    ]
    //required: true
  },
  timezone: {
    type: String
  },

  //friends
  friends: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      username: { type: String },
      usernameNormalized: { type: String }
      //no guardo la foto para que si la tiene cacheada y el amigo la cambia, se le envie la nueva
    }
  ],

  friendshipRequestSent: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      username: { type: String },
      usernameNormalized: { type: String }
    }
  ],

  friendshipRequestReceived: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      username: { type: String },
      usernameNormalized: { type: String }
    }
  ],

  blockedUsers: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      username: { type: String },
      usernameNormalized: { type: String }
    }
  ],

  //ordenado segun el momento en que se envio/recibio el ultimo mensaje
  chatConversationsList: [
    {
      _id: false,
      usernameFriend: { type: String },
      usernameNormalizedFriend: { type: String },
      isFriendCurrently: { type: Boolean, default: true }, //podia haber si amigo, pero haber finalizado la amistad
      isBlocked: { type: Boolean, default: false }
      // hasDeletedAccount: { type: Boolean }
    }
  ],

  banned: {
    _id: false,
    banStartDate: { type: Date },
    banEndDate: { type: Date },
    banTotalDays: { type: Number }
  },

  lastLogins: [
    {
      _id: false,
      date: { type: Date, default: Date.now, required: true },
      ipAddress: { type: String, required: true }
    }
  ]
});

//Create collection and add schema
module.exports = mongoose.model("User", userSchema);

//MongoDB Atlas server's time is 2 hours less than in Spain
// function hourSpain(h) {
//   let dateMongoDBServer = new Date();
//   let hourSpain = dateMongoDBServer.setHours(dateMongoDBServer.getHours() + h);
//   return hourSpain;
// }
