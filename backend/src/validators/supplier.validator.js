const Joi = require('joi');

/**
 * Supplier validation schemas
 */

// Update supplier profile schema
const updateSupplierProfileSchema = Joi.object({
  company_name: Joi.string().min(2).max(255),
  business_license: Joi.string().max(255).allow(null, ''),
  tax_id: Joi.string().max(100).allow(null, ''),
  address: Joi.string().max(500).allow(null, ''),
  city: Joi.string().max(100).allow(null, ''),
  country: Joi.string().max(100).allow(null, ''),
  website: Joi.string().uri().max(255).allow(null, ''),
  description: Joi.string().max(2000).allow(null, ''),
  avatar_url: Joi.string().uri().max(500).allow(null, ''),
  company_size: Joi.string().valid('1-10', '11-50', '51-200', '201-1000', '1000+').allow(null, ''),
  year_established: Joi.number().integer().min(1800).max(new Date().getFullYear()).allow(null),
  portfolio_description: Joi.string().max(1000).allow(null, ''),
  awards_recognitions: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      year: Joi.number().integer().required(),
      organization: Joi.string().required(),
      description: Joi.string().allow(null, '')
    })
  ).allow(null),
  insurance_coverage: Joi.string().max(255).allow(null, ''),
  environmental_certifications: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      issuer: Joi.string().required(),
      date_issued: Joi.date().required(),
      expiry_date: Joi.date().allow(null),
      description: Joi.string().allow(null, '')
    })
  ).allow(null),
  social_media_links: Joi.object({
    linkedin: Joi.string().uri().allow(null, ''),
    facebook: Joi.string().uri().allow(null, ''),
    twitter: Joi.string().uri().allow(null, ''),
    instagram: Joi.string().uri().allow(null, ''),
    website: Joi.string().uri().allow(null, '')
  }).allow(null),
  operating_hours: Joi.object({
    monday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
    tuesday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
    wednesday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
    thursday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
    friday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
    saturday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
    sunday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() })
  }).allow(null),
  service_areas: Joi.array().items(Joi.string()).allow(null),
  timezone: Joi.string().max(100).allow(null, ''),
  business_hours: Joi.string().max(255).allow(null, '')
});

// Update user info schema
const updateUserInfoSchema = Joi.object({
  first_name: Joi.string().min(2).max(50),
  last_name: Joi.string().min(2).max(50),
  phone: Joi.string().max(20).allow(null, '')
});

// Notification preferences schema
const notificationPreferencesSchema = Joi.object({
  email_new_requests: Joi.boolean(),
  email_bid_updates: Joi.boolean(),
  email_order_updates: Joi.boolean(),
  sms_notifications: Joi.boolean(),
  push_notifications: Joi.boolean(),
  notification_frequency: Joi.string().valid('immediate', 'daily', 'weekly', 'never')
});

// Privacy settings schema
const privacySettingsSchema = Joi.object({
  profile_visibility: Joi.string().valid('public', 'private', 'verified_only'),
  show_contact_info: Joi.boolean(),
  show_portfolio: Joi.boolean(),
  show_reviews: Joi.boolean(),
  allow_messages: Joi.boolean()
});

// Supplier category schema
const supplierCategorySchema = Joi.object({
  category_id: Joi.number().integer().positive().required(),
  expertise_level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required(),
  experience_years: Joi.number().integer().min(0).max(50).required(),
  portfolio_items: Joi.string().max(1000).allow(null, ''),
  certifications: Joi.string().max(1000).allow(null, '')
});

// File upload schema
const fileUploadSchema = Joi.object({
  file_category: Joi.string().valid('business_documents', 'portfolio', 'company_assets', 'certifications').required(),
  original_name: Joi.string().max(255).required(),
  filename: Joi.string().max(255).required(),
  file_path: Joi.string().max(500).required(),
  file_type: Joi.string().max(100).required(),
  file_size: Joi.number().integer().positive().required(),
  description: Joi.string().max(500).allow(null, ''),
  is_public: Joi.boolean()
});

// Portfolio item schema
const portfolioItemSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().min(10).max(2000).required(),
  category_id: Joi.number().integer().positive().allow(null),
  image_url: Joi.string().uri().max(500).allow(null, ''),
  project_url: Joi.string().uri().max(500).allow(null, ''),
  completion_date: Joi.date().allow(null),
  client_name: Joi.string().max(255).allow(null, ''),
  project_value: Joi.number().positive().precision(2).allow(null),
  tags: Joi.string().max(500).allow(null, ''),
  is_featured: Joi.boolean(),
  display_order: Joi.number().integer().min(0)
});

// Update portfolio item schema
const updatePortfolioItemSchema = Joi.object({
  title: Joi.string().min(3).max(255),
  description: Joi.string().min(10).max(2000),
  category_id: Joi.number().integer().positive().allow(null),
  image_url: Joi.string().uri().max(500).allow(null, ''),
  project_url: Joi.string().uri().max(500).allow(null, ''),
  completion_date: Joi.date().allow(null),
  client_name: Joi.string().max(255).allow(null, ''),
  project_value: Joi.number().positive().precision(2).allow(null),
  tags: Joi.string().max(500).allow(null, ''),
  is_featured: Joi.boolean(),
  display_order: Joi.number().integer().min(0)
});

// Portfolio order schema
const portfolioOrderSchema = Joi.array().items(
  Joi.object({
    id: Joi.number().integer().positive().required(),
    display_order: Joi.number().integer().min(0).required()
  })
).min(1);

// Change password schema
const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(128).required(),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
});

// Update email schema
const updateEmailSchema = Joi.object({
  new_email: Joi.string().email().required(),
  current_password: Joi.string().required()
});

// Toggle two-factor schema
const toggleTwoFactorSchema = Joi.object({
  enable: Joi.boolean().required(),
  current_password: Joi.string().required()
});

// Delete account schema
const deleteAccountSchema = Joi.object({
  password: Joi.string().required(),
  reason: Joi.string().max(500).allow(null, '')
});

module.exports = {
  updateSupplierProfileSchema,
  updateUserInfoSchema,
  notificationPreferencesSchema,
  privacySettingsSchema,
  supplierCategorySchema,
  fileUploadSchema,
  portfolioItemSchema,
  updatePortfolioItemSchema,
  portfolioOrderSchema,
  changePasswordSchema,
  updateEmailSchema,
  toggleTwoFactorSchema,
  deleteAccountSchema
};
