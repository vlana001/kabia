const mongoose = require("mongoose");

const Schema = mongoose.Schema;

//Create schema
const userActionsSchema = new Schema({
  userIdActionDoer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  actionType: {
    type: String,
    enum: [
      "user_registration",
      "account_deletion",
      "user_signingin",
      "friendship_request_sent",
      "message_sent_to_admin"
    ],
    required: true
  },
  strategy: {
    //acction: register, signin, delete account
    type: String,
    enum: ["email", "facebook", "google"],
    required: false
  },
  actionDoer: {
    //action: delete accoun
    type: String,
    enum: ["administrator", "user"],
    required: false
  },
  actionDoneTimestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
});

//Create collection and add schema
module.exports = mongoose.model("UserAction", userActionsSchema);
