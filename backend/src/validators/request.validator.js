const Joi = require('joi');

/**
 * Validation schemas for request operations
 */

const createRequestSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title must not exceed 255 characters',
      'any.required': 'Title is required'
    }),
    
  description: Joi.string()
    .min(20)
    .required()
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 20 characters long',
      'any.required': 'Description is required'
    }),
    
  budget_min: Joi.number()
    .positive()
    .allow(null)
    .messages({
      'number.positive': 'Minimum budget must be positive'
    }),
    
  budget_max: Joi.number()
    .positive()
    .allow(null)
    .when('budget_min', {
      is: Joi.exist(),
      then: Joi.number().min(Joi.ref('budget_min')).messages({
        'number.min': 'Maximum budget must be greater than minimum budget'
      })
    })
    .messages({
      'number.positive': 'Maximum budget must be positive'
    }),
    
  currency: Joi.string()
    .valid('EUR', 'USD')
    .default('EUR')
    .messages({
      'any.only': 'Currency must be either EUR or USD'
    }),
    
  delivery_date: Joi.date()
    .min('now')
    .allow(null)
    .messages({
      'date.min': 'Delivery date must be in the future'
    }),
    
  time_flexibility: Joi.string()
    .valid('critical', 'week', 'month')
    .default('critical')
    .messages({
      'any.only': 'Time flexibility must be critical, week, or month'
    }),
    
  priorities: Joi.alternatives()
    .try(
      Joi.string(),
      Joi.array().items(Joi.string())
    )
    .allow(null),
    
  file_notes: Joi.string()
    .max(1000)
    .allow(null, '')
    .messages({
      'string.max': 'File notes must not exceed 1000 characters'
    }),
    
  category_id: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .messages({
      'number.integer': 'Category ID must be an integer',
      'number.positive': 'Category ID must be positive'
    })
});

const updateRequestSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(255)
    .messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title must not exceed 255 characters'
    }),
    
  description: Joi.string()
    .min(20)
    .messages({
      'string.min': 'Description must be at least 20 characters long'
    }),
    
  budget_min: Joi.number()
    .positive()
    .allow(null)
    .messages({
      'number.positive': 'Minimum budget must be positive'
    }),
    
  budget_max: Joi.number()
    .positive()
    .allow(null)
    .when('budget_min', {
      is: Joi.exist(),
      then: Joi.number().min(Joi.ref('budget_min')).messages({
        'number.min': 'Maximum budget must be greater than minimum budget'
      })
    })
    .messages({
      'number.positive': 'Maximum budget must be positive'
    }),
    
  currency: Joi.string()
    .valid('EUR', 'USD')
    .messages({
      'any.only': 'Currency must be either EUR or USD'
    }),
    
  delivery_date: Joi.date()
    .min('now')
    .allow(null)
    .messages({
      'date.min': 'Delivery date must be in the future'
    }),
    
  time_flexibility: Joi.string()
    .valid('critical', 'week', 'month')
    .messages({
      'any.only': 'Time flexibility must be critical, week, or month'
    }),
    
  priorities: Joi.alternatives()
    .try(
      Joi.string(),
      Joi.array().items(Joi.string())
    )
    .allow(null),
    
  file_notes: Joi.string()
    .max(1000)
    .allow(null, '')
    .messages({
      'string.max': 'File notes must not exceed 1000 characters'
    }),
    
  category_id: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .messages({
      'number.integer': 'Category ID must be an integer',
      'number.positive': 'Category ID must be positive'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const requestIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Request ID must be a number',
      'number.integer': 'Request ID must be an integer',
      'number.positive': 'Request ID must be positive',
      'any.required': 'Request ID is required'
    })
});

const querySchema = Joi.object({
  status: Joi.string()
    .valid(
      'pending_categorization',
      'open_for_bids',
      'bids_received',
      'in_progress',
      'completed',
      'cancelled',
      'expired'
    )
    .messages({
      'any.only': 'Invalid status value'
    }),
    
  category_id: Joi.number()
    .integer()
    .positive()
    .messages({
      'number.integer': 'Category ID must be an integer',
      'number.positive': 'Category ID must be positive'
    }),
    
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1'
    }),
    
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),
    
  sort: Joi.string()
    .valid('created_at', 'updated_at', 'title', 'status', 'delivery_date')
    .default('created_at')
    .messages({
      'any.only': 'Invalid sort field'
    }),
    
  order: Joi.string()
    .valid('ASC', 'DESC', 'asc', 'desc')
    .default('DESC')
    .messages({
      'any.only': 'Order must be ASC or DESC'
    })
});

module.exports = {
  createRequestSchema,
  updateRequestSchema,
  requestIdSchema,
  querySchema
};

