const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatSchema = new Schema({
  msgText: {
    type: String,
    required: true
  },
  sender: {
    type: String, //username normalized
    // type: Schema.Types.ObjectId,
    // ref: "User",
    required: true
  },
  receiver: {
    type: String, //username normalized
    // type: Schema.Types.ObjectId,
    // ref: "User",
    required: true
  },
  //   receiver: {
  //     type: String, //ref
  //     required: true
  //   },
  date: {
    // type: Date,
    // default: Date.now,
    type: Date,
    required: true
  },
  //msgStatus
  // delivered: {
  //   type: Boolean,
  //   default: false,
  //   required: true
  // },
  read: {
    type: Boolean,
    default: false,
    required: true
  }
});

module.exports = mongoose.model("Chat", chatSchema);
