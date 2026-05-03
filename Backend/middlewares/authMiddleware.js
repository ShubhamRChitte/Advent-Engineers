const passport = require('passport');

const isAuthenticated = (req, res, next) => {
  // 1. Check Session (for browser requests)
  if (req.isAuthenticated() && req.user) {
    return next();
  }

  // 2. Check JWT (for API requests with Bearer token)
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      console.error("[AUTH] JWT Authentication Error:", err);
      return next(err);
    }
    
    if (user) {
      req.user = user;
      return next();
    }

    // Diagnostic logging
    const authHeader = req.headers.authorization;
    const hasToken = !!authHeader;
    const reason = info ? info.message : "No valid user found";
    console.warn(`[AUTH] 401 Unauthorized at ${req.originalUrl}. Reason: ${reason}. Token Present: ${hasToken}`);

    return res.status(401).json({ 
      success: false, 
      message: `Unauthorized: ${reason}. Please log in.`
    });
  })(req, res, next);
};

const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.designation === 'Admin') {
        return next();
    }
    res.status(403).json({ message: "Forbidden. Admin access required." });
};

module.exports = { isAuthenticated, isAdmin };
