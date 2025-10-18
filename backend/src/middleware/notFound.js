const ApiError = require('../utils/ApiError');

/**
 * 404 Not Found middleware
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

module.exports = { notFound };

