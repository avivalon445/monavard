const db = require('../config/database');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Supplier Profile Service
 * Handles all business logic for supplier profile management
 */

/**
 * Get complete supplier profile with all settings
 */
const getSupplierProfile = async (supplierId) => {
  try {
    // Get user basic info
    const [user] = await db.query(
      'SELECT id, email, first_name, last_name, phone, user_type, is_verified, created_at FROM users WHERE id = ?',
      [supplierId]
    );
    
    if (!user) {
      throw new ApiError(404, 'Supplier not found');
    }
    
    // Get supplier profile
    let [profile] = await db.query(
      'SELECT * FROM supplier_profiles WHERE user_id = ?',
      [supplierId]
    );
    
    // Create profile if doesn't exist
    if (!profile) {
      await db.query(
        'INSERT INTO supplier_profiles (user_id, company_name, created_at) VALUES (?, "New Company", NOW())',
        [supplierId]
      );
      [profile] = await db.query(
        'SELECT * FROM supplier_profiles WHERE user_id = ?',
        [supplierId]
      );
    }
    
    // Get notification settings
    let [notificationSettings] = await db.query(
      'SELECT * FROM supplier_notification_preferences WHERE supplier_id = ?',
      [profile.id]
    );
    
    // Create notification settings if doesn't exist
    if (!notificationSettings) {
      await db.query(
        'INSERT INTO supplier_notification_preferences (supplier_id, email_new_requests, email_bid_updates, email_order_updates, sms_notifications, push_notifications, notification_frequency, created_at) VALUES (?, 1, 1, 1, 0, 1, "immediate", NOW())',
        [profile.id]
      );
      [notificationSettings] = await db.query(
        'SELECT * FROM supplier_notification_preferences WHERE supplier_id = ?',
        [profile.id]
      );
    }
    
    // Get privacy settings
    let [privacySettings] = await db.query(
      'SELECT * FROM supplier_privacy_settings WHERE supplier_id = ?',
      [profile.id]
    );
    
    // Create privacy settings if doesn't exist
    if (!privacySettings) {
      await db.query(
        'INSERT INTO supplier_privacy_settings (supplier_id, profile_visibility, show_contact_info, show_portfolio, show_reviews, allow_messages, created_at) VALUES (?, "public", 1, 1, 1, 1, NOW())',
        [profile.id]
      );
      [privacySettings] = await db.query(
        'SELECT * FROM supplier_privacy_settings WHERE supplier_id = ?',
        [profile.id]
      );
    }
    
    // Get supplier categories
    const categories = await db.query(
      `SELECT sc.*, c.name as category_name 
       FROM supplier_categories sc 
       LEFT JOIN categories c ON sc.category_id = c.id 
       WHERE sc.supplier_id = ?`,
      [supplierId]
    );
    
    // Get supplier files
    const files = await db.query(
      'SELECT * FROM supplier_files WHERE supplier_id = ? ORDER BY file_category, sort_order, created_at DESC',
      [profile.id]
    );
    
    // Parse JSON fields
    const parseJsonFields = (obj) => {
      if (obj.awards_recognitions) {
        try { obj.awards_recognitions = JSON.parse(obj.awards_recognitions); } catch (e) { obj.awards_recognitions = null; }
      }
      if (obj.environmental_certifications) {
        try { obj.environmental_certifications = JSON.parse(obj.environmental_certifications); } catch (e) { obj.environmental_certifications = null; }
      }
      if (obj.social_media_links) {
        try { obj.social_media_links = JSON.parse(obj.social_media_links); } catch (e) { obj.social_media_links = null; }
      }
      if (obj.operating_hours) {
        try { obj.operating_hours = JSON.parse(obj.operating_hours); } catch (e) { obj.operating_hours = null; }
      }
      if (obj.service_areas) {
        try { obj.service_areas = JSON.parse(obj.service_areas); } catch (e) { obj.service_areas = null; }
      }
      return obj;
    };
    
    profile = parseJsonFields(profile);
    
    return {
      user,
      profile,
      notificationSettings,
      privacySettings,
      categories,
      files
    };
  } catch (error) {
    logger.error('Error fetching supplier profile:', error);
    throw error;
  }
};

/**
 * Update supplier basic profile information
 */
const updateSupplierProfile = async (supplierId, updateData) => {
  try {
    const allowedFields = [
      'company_name', 'business_license', 'tax_id', 'address', 'city', 'country', 
      'website', 'description', 'avatar_url', 'company_size', 'year_established',
      'portfolio_description', 'awards_recognitions', 'insurance_coverage',
      'environmental_certifications', 'social_media_links', 'operating_hours',
      'service_areas', 'timezone', 'business_hours'
    ];
    
    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        // Handle JSON fields
        if (['awards_recognitions', 'environmental_certifications', 'social_media_links', 'operating_hours', 'service_areas'].includes(key)) {
          filteredData[key] = typeof updateData[key] === 'object' ? JSON.stringify(updateData[key]) : updateData[key];
        } else {
          filteredData[key] = updateData[key];
        }
      }
    });
    
    if (Object.keys(filteredData).length === 0) {
      throw new ApiError(400, 'No valid fields to update');
    }
    
    filteredData.last_profile_update = new Date();
    
    // Update profile completion score
    const [profile] = await db.query('SELECT * FROM supplier_profiles WHERE user_id = ?', [supplierId]);
    if (profile) {
      const completionScore = calculateProfileCompletion({ ...profile, ...filteredData });
      filteredData.profile_completion = completionScore;
    }
    
    const setClause = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(filteredData);
    values.push(supplierId);
    
    await db.query(
      `UPDATE supplier_profiles SET ${setClause} WHERE user_id = ?`,
      values
    );
    
    logger.info(`Supplier profile updated for supplier ${supplierId}`);
    return { message: 'Profile updated successfully' };
  } catch (error) {
    logger.error('Error updating supplier profile:', error);
    throw error;
  }
};

/**
 * Update user basic information
 */
const updateSupplierUserInfo = async (supplierId, updateData) => {
  try {
    const allowedFields = ['first_name', 'last_name', 'phone'];
    const filteredData = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    });
    
    if (Object.keys(filteredData).length === 0) {
      throw new ApiError(400, 'No valid fields to update');
    }
    
    const setClause = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(filteredData);
    values.push(supplierId);
    
    await db.query(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      values
    );
    
    logger.info(`User info updated for supplier ${supplierId}`);
    return { message: 'User information updated successfully' };
  } catch (error) {
    logger.error('Error updating supplier user info:', error);
    throw error;
  }
};

/**
 * Update notification preferences
 */
const updateNotificationPreferences = async (supplierId, preferences) => {
  try {
    const allowedFields = [
      'email_new_requests', 'email_bid_updates', 'email_order_updates',
      'sms_notifications', 'push_notifications', 'notification_frequency'
    ];
    
    const filteredData = {};
    Object.keys(preferences).forEach(key => {
      if (allowedFields.includes(key) && preferences[key] !== undefined) {
        filteredData[key] = preferences[key];
      }
    });
    
    if (Object.keys(filteredData).length === 0) {
      throw new ApiError(400, 'No valid preferences to update');
    }
    
    // Get supplier profile ID
    const [profile] = await db.query('SELECT id FROM supplier_profiles WHERE user_id = ?', [supplierId]);
    if (!profile) {
      throw new ApiError(404, 'Supplier profile not found');
    }
    
    const setClause = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(filteredData);
    values.push(profile.id);
    
    await db.query(
      `UPDATE supplier_notification_preferences SET ${setClause}, updated_at = NOW() WHERE supplier_id = ?`,
      values
    );
    
    logger.info(`Notification preferences updated for supplier ${supplierId}`);
    return { message: 'Notification preferences updated successfully' };
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    throw error;
  }
};

/**
 * Update privacy settings
 */
const updatePrivacySettings = async (supplierId, settings) => {
  try {
    const allowedFields = [
      'profile_visibility', 'show_contact_info', 'show_portfolio',
      'show_reviews', 'allow_messages'
    ];
    
    const filteredData = {};
    Object.keys(settings).forEach(key => {
      if (allowedFields.includes(key) && settings[key] !== undefined) {
        filteredData[key] = settings[key];
      }
    });
    
    if (Object.keys(filteredData).length === 0) {
      throw new ApiError(400, 'No valid settings to update');
    }
    
    // Get supplier profile ID
    const [profile] = await db.query('SELECT id FROM supplier_profiles WHERE user_id = ?', [supplierId]);
    if (!profile) {
      throw new ApiError(404, 'Supplier profile not found');
    }
    
    const setClause = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(filteredData);
    values.push(profile.id);
    
    await db.query(
      `UPDATE supplier_privacy_settings SET ${setClause}, updated_at = NOW() WHERE supplier_id = ?`,
      values
    );
    
    logger.info(`Privacy settings updated for supplier ${supplierId}`);
    return { message: 'Privacy settings updated successfully' };
  } catch (error) {
    logger.error('Error updating privacy settings:', error);
    throw error;
  }
};

/**
 * Add supplier category
 */
const addSupplierCategory = async (supplierId, categoryData) => {
  try {
    const { category_id, expertise_level, experience_years, portfolio_items, certifications } = categoryData;
    
    // Check if category already exists for this supplier
    const [existing] = await db.query(
      'SELECT id FROM supplier_categories WHERE supplier_id = ? AND category_id = ?',
      [supplierId, category_id]
    );
    
    if (existing) {
      throw new ApiError(400, 'Category already added for this supplier');
    }
    
    await db.query(
      'INSERT INTO supplier_categories (supplier_id, category_id, expertise_level, experience_years, portfolio_items, certifications, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [supplierId, category_id, expertise_level, experience_years, portfolio_items, certifications]
    );
    
    logger.info(`Category added for supplier ${supplierId}`);
    return { message: 'Category added successfully' };
  } catch (error) {
    logger.error('Error adding supplier category:', error);
    throw error;
  }
};

/**
 * Update supplier category
 */
const updateSupplierCategory = async (supplierId, categoryId, updateData) => {
  try {
    const allowedFields = ['expertise_level', 'experience_years', 'portfolio_items', 'certifications'];
    const filteredData = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    });
    
    if (Object.keys(filteredData).length === 0) {
      throw new ApiError(400, 'No valid fields to update');
    }
    
    const setClause = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(filteredData);
    values.push(supplierId, categoryId);
    
    const result = await db.query(
      `UPDATE supplier_categories SET ${setClause} WHERE supplier_id = ? AND id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      throw new ApiError(404, 'Category not found for this supplier');
    }
    
    logger.info(`Category updated for supplier ${supplierId}`);
    return { message: 'Category updated successfully' };
  } catch (error) {
    logger.error('Error updating supplier category:', error);
    throw error;
  }
};

/**
 * Remove supplier category
 */
const removeSupplierCategory = async (supplierId, categoryId) => {
  try {
    const result = await db.query(
      'DELETE FROM supplier_categories WHERE supplier_id = ? AND id = ?',
      [supplierId, categoryId]
    );
    
    if (result.affectedRows === 0) {
      throw new ApiError(404, 'Category not found for this supplier');
    }
    
    logger.info(`Category removed for supplier ${supplierId}`);
    return { message: 'Category removed successfully' };
  } catch (error) {
    logger.error('Error removing supplier category:', error);
    throw error;
  }
};

/**
 * Calculate profile completion percentage
 */
const calculateProfileCompletion = (profile) => {
  const fields = [
    'company_name', 'description', 'address', 'city', 'country', 'website',
    'company_size', 'year_established', 'portfolio_description', 'avatar_url'
  ];
  
  let completedFields = 0;
  fields.forEach(field => {
    if (profile[field] && profile[field].toString().trim() !== '') {
      completedFields++;
    }
  });
  
  return Math.round((completedFields / fields.length) * 100);
};

/**
 * Upload supplier file
 */
const uploadSupplierFile = async (supplierId, fileData) => {
  try {
    const { file_category, original_name, filename, file_path, file_type, file_size, description, is_public } = fileData;
    
    // Get supplier profile ID
    const [profile] = await db.query('SELECT id FROM supplier_profiles WHERE user_id = ?', [supplierId]);
    if (!profile) {
      throw new ApiError(404, 'Supplier profile not found');
    }
    
    await db.query(
      'INSERT INTO supplier_files (supplier_id, file_category, original_name, filename, file_path, file_type, file_size, description, is_public, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [profile.id, file_category, original_name, filename, file_path, file_type, file_size, description, is_public || 0]
    );
    
    logger.info(`File uploaded for supplier ${supplierId}`);
    return { message: 'File uploaded successfully' };
  } catch (error) {
    logger.error('Error uploading supplier file:', error);
    throw error;
  }
};

/**
 * Delete supplier file
 */
const deleteSupplierFile = async (supplierId, fileId) => {
  try {
    // Get supplier profile ID
    const [profile] = await db.query('SELECT id FROM supplier_profiles WHERE user_id = ?', [supplierId]);
    if (!profile) {
      throw new ApiError(404, 'Supplier profile not found');
    }
    
    const result = await db.query(
      'DELETE FROM supplier_files WHERE supplier_id = ? AND id = ?',
      [profile.id, fileId]
    );
    
    if (result.affectedRows === 0) {
      throw new ApiError(404, 'File not found');
    }
    
    logger.info(`File deleted for supplier ${supplierId}`);
    return { message: 'File deleted successfully' };
  } catch (error) {
    logger.error('Error deleting supplier file:', error);
    throw error;
  }
};

module.exports = {
  getSupplierProfile,
  updateSupplierProfile,
  updateSupplierUserInfo,
  updateNotificationPreferences,
  updatePrivacySettings,
  addSupplierCategory,
  updateSupplierCategory,
  removeSupplierCategory,
  uploadSupplierFile,
  deleteSupplierFile
};
