const isAuthenticated = (req, res, next) => {
  // Check for Bearer Token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const jwt = require("jsonwebtoken");
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "advent_engineers_secret_key");
      req.user = decoded; // Attach decoded user to request
      return next();
    } catch (err) {
      // Token invalid, fall through to session check or fail
      console.error("JWT Verification Failed:", err.message);
    }
  }

  // Passport adds the isAuthenticated() method to the request object
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: "Unauthorized: No active session or valid token found. Please log in."
  });
};

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.designation === 'Admin') {
    return next();
  }
  res.status(403).json({ message: "Forbidden. Admin access required." });
};

module.exports = { isAuthenticated, isAdmin };
