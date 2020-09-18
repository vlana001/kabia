module.exports = {
  //
  //Si el input del email de un form se pasa vacio al server, como se normaliza se añade una @
  //Quitamos esa @, antes de devolver el input recibido al user
  cleanAtSymbol: function(email) {
    if (email === "@") {
      email = "";
      return email;
    } else {
      return email;
    }
  }
};
