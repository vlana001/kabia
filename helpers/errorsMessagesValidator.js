module.exports = {
  //Cojo las key 'msg' de los objetos JS y pongo su value en un array
  getErrorsMessages: function(errorsMapped) {
    let errorsMessages = [];
    for (let key in errorsMapped) {
      // skip loop if the property is from prototype
      if (!errorsMapped.hasOwnProperty(key)) continue;

      let obj = errorsMapped[key];
      for (let prop in obj) {
        // skip loop if the property is from prototype
        if (!obj.hasOwnProperty(prop)) continue;

        if (prop === "msg") {
          errorsMessages.push(obj[prop]);
        }
      }
    }
    return errorsMessages;
  }
};
