const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { query } = require('../config/database');

/**
 * Verify JWT token and attach user to request
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    // Check for token in cookies
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    throw ApiError.unauthorized('Not authorized to access this route. Please login.');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const sql = `
      SELECT id, email, first_name, last_name, phone, user_type, is_verified, is_active, account_status
      FROM users 
      WHERE id = ? AND is_active = 1 AND account_status = 'active'
    `;
    
    const users = await query(sql, [decoded.id]);

    if (!users || users.length === 0) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    // Attach user to request
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expired. Please login again.');
    }
    throw ApiError.unauthorized('Not authorized to access this route');
  }
});

/**
 * Grant access to specific roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.user_type)) {
      throw ApiError.forbidden(
        `User role '${req.user.user_type}' is not authorized to access this route`
      );
    }
    next();
  };
};

/**
 * Check if user is verified
 */
const requireVerified = (req, res, next) => {
  if (!req.user.is_verified) {
    throw ApiError.forbidden('Please verify your email to access this resource');
  }
  next();
};

/**
 * Optional auth - doesn't fail if no token
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const sql = `
        SELECT id, email, first_name, last_name, user_type, is_verified, is_active
        FROM users 
        WHERE id = ? AND is_active = 1
      `;
      const users = await query(sql, [decoded.id]);
      if (users && users.length > 0) {
        req.user = users[0];
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  }

  next();
});

module.exports = {
  protect,
  authorize,
  requireVerified,
  optionalAuth
};

