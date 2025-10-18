const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || 'anonymous'
  });

  // Convert error to ApiError if it isn't already
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, error.stack);
  }

  // MySQL specific errors
  if (error.code === 'ER_DUP_ENTRY') {
    error = ApiError.conflict('Duplicate entry. Resource already exists.');
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    error = ApiError.badRequest('Invalid reference. Related resource not found.');
  } else if (error.code === 'ER_BAD_FIELD_ERROR') {
    error = ApiError.badRequest('Invalid field in query.');
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token. Please login again.');
  } else if (error.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired. Please login again.');
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(e => e.message).join(', ');
    error = ApiError.unprocessable(message);
  }

  // Multer file upload errors
  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      error = ApiError.badRequest('File size is too large');
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      error = ApiError.badRequest('Too many files');
    } else {
      error = ApiError.badRequest('File upload error');
    }
  }

  // Response
  const response = {
    success: false,
    message: error.message,
    statusCode: error.statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;

