//Delete, este file no hace falta
var passwordValidator = require("password-validator");

//la funcion solo devuelve el primer error
module.exports = {
  validatePassword: function(password) {
    // Create schemas
    var schemaAtLeast8Characters = new passwordValidator();
    var schemaLetters = new passwordValidator();
    var schemaNumbers = new passwordValidator();
    var schemaSymbols = new passwordValidator();
    var schemaNotBlacklistedWords = new passwordValidator();

    let msg = ""; //error message

    //has at least 8 characters
    schemaAtLeast8Characters.is().min(8);
    let hasAtLeast8Characters = schemaAtLeast8Characters.validate(password);
    console.log(hasAtLeast8Characters);
    if (!hasAtLeast8Characters) {
      msg = "Password must contain at least 8 characters";
      return msg;
    }

    //has letters
    schemaLetters.has().letters();
    let hasLetters = schemaLetters.validate(password);
    console.log(hasLetters);
    if (!hasLetters) {
      msg = "Password must contain letters";
      return msg;
    }

    //has numbers or symbols
    schemaNumbers.has().digits();
    let hasNumbers = schemaNumbers.validate(password);
    console.log(hasNumbers);

    schemaSymbols.has().symbols();
    let hasSymbols = schemaSymbols.validate(password);
    console.log(hasSymbols);

    if (!hasNumbers && !hasSymbols) {
      msg = "Password must contain at least one number or symbol";
      return msg;
    }

    //has blacklisted words
    const blacklistedWords = ["aaaaaaaa1", "aaaaaaaa2"]; //TODO
    schemaNotBlacklistedWords
      .is()
      .not()
      .oneOf(blacklistedWords);
    let hasNotBlacklistedWords = schemaNotBlacklistedWords.validate(password);

    console.log(hasNotBlacklistedWords);
    if (!hasNotBlacklistedWords) {
      msg = "Password can not be that word, it is very common";
      return msg;
    }

    //si llega al final, devuelvo msg="" y es porque  pasa todas las validaciones
    return msg;
  }
};
