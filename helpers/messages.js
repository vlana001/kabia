module.exports = {
  //No hace falta este file, si recorro en la template con un for el array que le paso,
  //ya que si el array esta vacio, no añadira nada de HTML
  //Para que no se muestre el div de los mensajes de error y success sin texto, pero con los styles CSS
  messageErrorShow: function(msg) {
    let messageError = msg; //req.flash("error"); //poner error, no poner error-message, si no los msg de passport no se muestran
    if (!messageError.length > 0) {
      messageError = null;
    }
    return messageError;
  },
  messageSuccessShow: function(msg) {
    let messageSuccess = msg;
    if (!messageSuccess.length > 0) {
      messageSuccess = null;
    }
    return messageSuccess;
  }
};
