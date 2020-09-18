//No se usa, uso moment library
// module.exports = {
//   calculateAge: function(dateString) {
//     console.log(dateString);
//     var today = new Date();
//     var birthDate = new Date(dateString);
//     var age = today.getFullYear() - birthDate.getFullYear();
//     var m = today.getMonth() - birthDate.getMonth();
//     if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
//       age--;
//     }
//     return age;
//   },
//   formatRegistrationDate: function(date) {
//     var month = ("0" + (date.getUTCMonth() + 1)).slice(-2); //months from 1-12
//     var day = ("0" + date.getUTCDate()).slice(-2);
//     var year = date.getUTCFullYear();

//     newDate = year + "-" + month + "-" + day;
//     return newDate;
//   }
// };
