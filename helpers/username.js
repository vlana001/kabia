module.exports = {
  normalizeUsername: function(username) {
    //sustituyo whitespaces por - y pongo en minusculas: John Doe: john-doe
    return username.toLowerCase().replace(/[\s]{1,}/gm, "-");
  }
};
