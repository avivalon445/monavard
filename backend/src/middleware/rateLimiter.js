const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

// Check if rate limiting should be disabled in development
const isDevMode = process.env.NODE_ENV === 'development';
const skipRateLimiting = isDevMode && process.env.DISABLE_RATE_LIMIT === 'true';

/**
 * General rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  skip: () => skipRateLimiting,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw ApiError.tooManyRequests('Too many requests, please try again later');
  }
});

/**
 * Strict rate limiter for authentication routes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevMode ? 1000 : 5, // Higher limit in dev mode
  skip: () => skipRateLimiting,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later',
  handler: (req, res) => {
    throw ApiError.tooManyRequests('Too many authentication attempts, please try again after 15 minutes');
  }
});

/**
 * Upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevMode ? 1000 : 20, // Higher limit in dev mode
  skip: () => skipRateLimiting,
  message: 'Too many uploads, please try again later',
  handler: (req, res) => {
    throw ApiError.tooManyRequests('Upload limit reached, please try again later');
  }
});

module.exports = generalLimiter;
module.exports.authLimiter = authLimiter;
module.exports.uploadLimiter = uploadLimiter;

