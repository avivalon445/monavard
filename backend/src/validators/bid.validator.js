const Joi = require('joi');

/**
 * Validation schemas for bid operations
 */

const createBidSchema = Joi.object({
  request_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Request ID must be a number',
      'number.integer': 'Request ID must be an integer',
      'number.positive': 'Request ID must be positive',
      'any.required': 'Request ID is required'
    }),
    
  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be positive',
      'any.required': 'Price is required'
    }),
    
  delivery_time_days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .required()
    .messages({
      'number.base': 'Delivery time must be a number',
      'number.integer': 'Delivery time must be an integer',
      'number.min': 'Delivery time must be at least 1 day',
      'number.max': 'Delivery time must not exceed 365 days',
      'any.required': 'Delivery time is required'
    }),
    
  description: Joi.string()
    .min(10)
    .max(500)
    .allow(null, '')
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description must not exceed 500 characters'
    }),
    
  proposal_details: Joi.string()
    .min(20)
    .max(2000)
    .allow(null, '')
    .messages({
      'string.min': 'Proposal details must be at least 20 characters long',
      'string.max': 'Proposal details must not exceed 2000 characters'
    }),
    
  materials_cost: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .messages({
      'number.base': 'Materials cost must be a number',
      'number.min': 'Materials cost must be non-negative'
    }),
    
  labor_cost: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .messages({
      'number.base': 'Labor cost must be a number',
      'number.min': 'Labor cost must be non-negative'
    }),
    
  other_costs: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .messages({
      'number.base': 'Other costs must be a number',
      'number.min': 'Other costs must be non-negative'
    })
});

const updateBidSchema = Joi.object({
  price: Joi.number()
    .positive()
    .precision(2)
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be positive'
    }),
    
  delivery_time_days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .messages({
      'number.base': 'Delivery time must be a number',
      'number.integer': 'Delivery time must be an integer',
      'number.min': 'Delivery time must be at least 1 day',
      'number.max': 'Delivery time must not exceed 365 days'
    }),
    
  description: Joi.string()
    .min(10)
    .max(500)
    .allow(null, '')
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description must not exceed 500 characters'
    }),
    
  proposal_details: Joi.string()
    .min(20)
    .max(2000)
    .allow(null, '')
    .messages({
      'string.min': 'Proposal details must be at least 20 characters long',
      'string.max': 'Proposal details must not exceed 2000 characters'
    }),
    
  materials_cost: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .messages({
      'number.base': 'Materials cost must be a number',
      'number.min': 'Materials cost must be non-negative'
    }),
    
  labor_cost: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .messages({
      'number.base': 'Labor cost must be a number',
      'number.min': 'Labor cost must be non-negative'
    }),
    
  other_costs: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .messages({
      'number.base': 'Other costs must be a number',
      'number.min': 'Other costs must be non-negative'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const cancelBidSchema = Joi.object({
  cancellation_reason: Joi.string()
    .max(500)
    .allow(null, '')
    .messages({
      'string.max': 'Cancellation reason must not exceed 500 characters'
    })
});

const bidIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Bid ID must be a number',
      'number.integer': 'Bid ID must be an integer',
      'number.positive': 'Bid ID must be positive',
      'any.required': 'Bid ID is required'
    })
});

module.exports = {
  createBidSchema,
  updateBidSchema,
  cancelBidSchema,
  bidIdSchema
};
