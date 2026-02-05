const isAuthenticated = (req, res, next) => {
  // Passport adds the isAuthenticated() method to the request object
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ 
    success: false, 
    message: "Unauthorized: No active session found. Please log in." 
  });
};

const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.designation === 'Admin') {
        return next();
    }
    res.status(403).json({ message: "Forbidden. Admin access required." });
};

module.exports = { isAuthenticated, isAdmin };
