//Gets passwords from bannedPasswords.txt file that are at least 8 characters long 
//and contain at least one number or one symbol

var fs = require("fs"),
  readline = require("readline");

//read content from file
var rd = readline.createInterface({
  input: fs.createReadStream(__dirname + "/bannedPasswords.txt"),
  // output: process.stdout,
  // console: false
});

//delete content from file
var fs = require('fs')
fs.truncate(__dirname + "/bannedPasswordArray.txt", 0, function () {})

//add content to file
rd.on("line", function (line) {
  if (hasSymbol(line)) {
    console.log(line);
  }
  if (line.length >= 8 && hasLetter(line) && (hasNumber(line) && hasSymbol(line))) {
    fs.appendFile(
      __dirname + "/bannedPasswordArray.txt",
      `"${line}",\n`,
      function (err) {
        if (err) {
          console.log(err);
        }
      }
    );
  }
});


function hasNumber(line) {
  return /\d/.test(line);
}

function hasLetter(line) {
  return /[a-zA-Z]/.test(line);
}

function hasSymbol(line) {
  return /[`´~\!@#\$%\^\&\*\(\)\-_\=\+\[\{\}\]\\\|;:'",<.>\/\?¿€£¥₹]/.test(line);
}