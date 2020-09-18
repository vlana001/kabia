const nodemailer = require("nodemailer");
const aws = require("aws-sdk");

const keys = require("../config/keys");

// Configure AWS SDK
aws.config = new aws.Config({
  accessKeyId: keys.AWS_ACCESS_KEY_ID,
  secretAccessKey: keys.AWS_SECRET_ACCESS_KEY,
  region: keys.AWS_REGION
});

//nodemailer transporter
let transporter = nodemailer.createTransport({
  SES: new aws.SES({
    apiVersion: "2010-12-01"
  })
});

exports.transporter = transporter;
