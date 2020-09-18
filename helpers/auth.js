const User = require("../models/user");

module.exports = {
  //route protection
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    // req.flash("error", "Not Authorized");
    res.redirect("/");
  },

  //If user is loged in, redirect when tries to visit some pages such as /login
  redirectionIfAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      if (req.user.role === "user") {
        return res.redirect("/users/menu");
      } else if (req.user.role === "administrator") {
        return res.redirect("/admin/");
      }
    }
    next();
  },

  ensureIsAdmin: function(req, res, next) {
    if (req.user.role === "administrator") {
      return next();
    }
    return res.redirect("/users/menu");
  },

  ensureIsUser: function(req, res, next) {
    if (req.user.role === "user") {
      return next();
    }
    return res.redirect("/admin/");
  },

  //para saber con que metodo de los 3 se ha registrado
  identifyLoginMethod: function(req, query) {
    query["email"] = req.user.email;

    if (req.user.password) {
      return (query["password"] = { $exists: true, $ne: null });
    }

    if (req.user.googleID) {
      return (query["googleID"] = { $exists: true, $ne: null });
    }

    if (req.user.facebookID) {
      return (query["facebookID"] = { $exists: true, $ne: null });
    }
  },

  registrationMethod: function(req) {
    if (req.user.password) {
      return "email";
    }

    if (req.user.googleID) {
      return "google";
    }

    if (req.user.facebookID) {
      return "facebook";
    }
  },
  registrationMethodByUsername: async function(usernameNormalized) {
    const user = await User.findOne({ usernameNormalized: usernameNormalized });

    if (user) {
      if (user.password) {
        return "email";
      }

      if (user.googleID) {
        return "google";
      }

      if (user.facebookID) {
        return "facebook";
      }
    } else {
      return "";
    }
  },

  //si no ha creado el perfil, no podra ver otra route de /users que no sea /user/createprofile
  ensureProfileCreated: function(req, res, next) {
    let query = {};
    query["email"] = req.user.email;

    if (req.user.password) {
      query["password"] = { $exists: true, $ne: null };
    }

    if (req.user.googleID) {
      query["googleID"] = { $exists: true, $ne: null };
    }

    if (req.user.facebookID) {
      query["facebookID"] = { $exists: true, $ne: null };
    }

    User.findOne(query)
      .then(user => {
        if (user.status === "profile_not_created") {
          return res.redirect("/users/createprofile");
        } else {
          next();
        }
      })
      .catch(err => {});
  },

  isProfileCreated: function(req) {
    if (req.user === undefined) {
      return false;
    } else {
      if (req.user.status === "profile_not_created") {
        return false;
      } else {
        return true;
      }
    }
  },

  //Errors 404 and 500 can happen if the user is or is not logged in
  //we pass the usernameNormalized to the template engine so that the user can see
  //its profile
  //If the user is not logged in we do not know who he is so we pass "" to the template  engine
  notLoggedInUsernameNormalized: function(req, res, next) {
    if (req.user) {
      return req.user.usernameNormalized;
    } else {
      return "";
    }
  },

  //User registrado con email no podra ir a los enlaces de borrar cuenta para user registrado con social login
  registeredUsingEmail: function(req, res, next) {
    if (req.user.password) {
      next();
    } else {
      res.redirect("/users/menu");
    }
  },

  //User registrado con social login no podra ir a los enlaces de borrar cuenta para user registrado con email
  registeredUsingSocialLogin: function(req, res, next) {
    if (req.user.googleID || req.user.facebookID) {
      next();
    } else {
      res.redirect("/users/menu");
    }
  }
};
