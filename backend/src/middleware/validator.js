const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Validation middleware for express-validator
 * Used in auth routes
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));
    
    return next(new ApiError(400, 'Validation error', extractedErrors));
  }
  
  next();
};

/**
 * Validation middleware using Joi schemas
 * Used in request routes and other new routes
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Property to validate ('body', 'query', 'params')
 */
const validateJoi = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const extractedErrors = error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return next(new ApiError(400, 'Validation error', extractedErrors));
    }
    
    // Replace the validated property with the cleaned value
    req[property] = value;
    next();
  };
};

module.exports = validate;
module.exports.validateJoi = validateJoi;

