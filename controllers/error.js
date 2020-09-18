const {
  notLoggedInUsernameNormalized,
  isProfileCreated
} = require("../helpers/auth");

//user: auth and not auth
exports.get404 = (req, res, next) => {
  res.status(404).render("users/error-pages/404", {
    pageTitle: "Page Not Found",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req)
    //usernameNormalized: notLoggedInUsernameNormalized(req)
  });
};

exports.get500 = (req, res, next) => {
  res.status(500).render("users/error-pages/500", {
    pageTitle: "Error 500",
    isAuthenticated: req.isAuthenticated(),
    isProfileCreated: isProfileCreated(req)
    //usernameNormalized: notLoggedInUsernameNormalized(req)
  });
};

//Admin
exports.get404Admin = (req, res, next) => {
  res.status(404).render("admin/error-pages/404-admin", {
    pageTitle: "Page Not Found",
    isAuthenticated: req.isAuthenticated()
  });
};

exports.get500Admin = (req, res, next) => {
  res.status(500).render("admin/error-pages/500-admin", {
    pageTitle: "Error 500",
    isAuthenticated: req.isAuthenticated()
  });
};
