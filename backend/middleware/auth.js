// JWT Authentication Middleware
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * Middleware to verify JWT token
 * Add this to routes that require authentication
 * 
 * Usage:
 * const authenticateToken = require("./middleware/auth");
 * app.get("/api/protected-route", authenticateToken, (req, res) => {
 *   // req.user is now available
 * });
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required. Please login.' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token. Please login again.' 
      });
    }
    
    // Add user info to request object
    req.user = user;
    next();
  });
};

/**
 * Generate JWT token
 * Call this after successful login
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      club_id: user.club_id 
    },
    JWT_SECRET,
    { expiresIn: '24h' } // Token expires in 24 hours
  );
};

/**
 * Verify token without throwing error
 * Useful for optional authentication
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  generateToken,
  verifyToken,
  JWT_SECRET
};
