const mongoose = require("mongoose");

const Schema = mongoose.Schema;

//Create schema
const deletedAccountSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  usernameNormalized: {
    type: String,
    required: true
  },
  deletingDate: {
    type: String, //We just want to print it
    required: true
  },
  actionDoer: {
    type: String,
    enum: ["administrator", "user"],
    required: true
  }
});

//Create collection and add schema
module.exports = mongoose.model("DeletedAccount", deletedAccountSchema);
