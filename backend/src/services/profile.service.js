const db = require('../config/database');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

/**
 * Profile Service
 * Handles all business logic for user profiles and settings
 */

/**
 * Get customer profile with all settings
 */
const getCustomerProfile = async (userId) => {
  try {
    // Get user basic info
    const [user] = await db.query(
      'SELECT id, email, first_name, last_name, phone, user_type, is_verified, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Get customer profile
    let [profile] = await db.query(
      'SELECT * FROM customer_profiles WHERE user_id = ?',
      [userId]
    );
    
    // Create profile if doesn't exist
    if (!profile) {
      await db.query(
        'INSERT INTO customer_profiles (user_id) VALUES (?)',
        [userId]
      );
      [profile] = await db.query(
        'SELECT * FROM customer_profiles WHERE user_id = ?',
        [userId]
      );
    }
    
    // Get notification settings
    let [notificationSettings] = await db.query(
      'SELECT * FROM notification_settings WHERE user_id = ?',
      [userId]
    );
    
    // Create notification settings if doesn't exist
    if (!notificationSettings) {
      await db.query(
        'INSERT INTO notification_settings (user_id) VALUES (?)',
        [userId]
      );
      [notificationSettings] = await db.query(
        'SELECT * FROM notification_settings WHERE user_id = ?',
        [userId]
      );
    }
    
    return {
      user,
      profile,
      notification_settings: notificationSettings
    };
  } catch (error) {
    logger.error('Error fetching customer profile:', error);
    throw error;
  }
};

/**
 * Update user basic info
 * Note: Email cannot be changed for security reasons
 */
const updateUserInfo = async (userId, data) => {
  try {
    const { first_name, last_name, phone } = data;
    
    const updates = [];
    const values = [];
    
    if (first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(last_name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    
    if (updates.length === 0) {
      throw new ApiError(400, 'No fields to update');
    }
    
    values.push(userId);
    
    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    logger.info(`User ${userId} updated basic info`);
    
    return { message: 'User information updated successfully' };
  } catch (error) {
    logger.error('Error updating user info:', error);
    throw error;
  }
};

/**
 * Update customer profile
 */
const updateCustomerProfile = async (userId, data) => {
  try {
    const {
      company_name,
      address,
      city,
      country,
      postal_code,
      website,
      bio,
      industry,
      company_size,
      preferred_currency,
      language,
      date_of_birth,
      gender,
      email_visibility,
      profile_visibility,
      activity_status
    } = data;
    
    const updates = [];
    const values = [];
    
    if (company_name !== undefined) {
      updates.push('company_name = ?');
      values.push(company_name);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (city !== undefined) {
      updates.push('city = ?');
      values.push(city);
    }
    if (country !== undefined) {
      updates.push('country = ?');
      values.push(country);
    }
    if (postal_code !== undefined) {
      updates.push('postal_code = ?');
      values.push(postal_code);
    }
    if (website !== undefined) {
      updates.push('website = ?');
      values.push(website);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (industry !== undefined) {
      updates.push('industry = ?');
      values.push(industry);
    }
    if (company_size !== undefined) {
      updates.push('company_size = ?');
      values.push(company_size);
    }
    if (preferred_currency !== undefined) {
      updates.push('preferred_currency = ?');
      values.push(preferred_currency);
    }
    if (language !== undefined) {
      updates.push('language = ?');
      values.push(language);
    }
    if (date_of_birth !== undefined) {
      updates.push('date_of_birth = ?');
      values.push(date_of_birth);
    }
    if (gender !== undefined) {
      updates.push('gender = ?');
      values.push(gender);
    }
    if (email_visibility !== undefined) {
      updates.push('email_visibility = ?');
      values.push(email_visibility);
    }
    if (profile_visibility !== undefined) {
      updates.push('profile_visibility = ?');
      values.push(profile_visibility);
    }
    if (activity_status !== undefined) {
      updates.push('activity_status = ?');
      values.push(activity_status);
    }
    
    if (updates.length === 0) {
      throw new ApiError(400, 'No fields to update');
    }
    
    values.push(userId);
    
    await db.query(
      `UPDATE customer_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );
    
    logger.info(`Customer profile ${userId} updated`);
    
    return { message: 'Profile updated successfully' };
  } catch (error) {
    logger.error('Error updating customer profile:', error);
    throw error;
  }
};

/**
 * Update notification settings
 */
const updateNotificationSettings = async (userId, data) => {
  try {
    const {
      email_new_bids,
      email_order_updates,
      email_messages,
      email_promotions,
      sms_order_updates,
      sms_messages,
      push_notifications,
      real_time_notifications,
      frequency
    } = data;
    
    const updates = [];
    const values = [];
    
    if (email_new_bids !== undefined) {
      updates.push('email_new_bids = ?');
      values.push(email_new_bids ? 1 : 0);
    }
    if (email_order_updates !== undefined) {
      updates.push('email_order_updates = ?');
      values.push(email_order_updates ? 1 : 0);
    }
    if (email_messages !== undefined) {
      updates.push('email_messages = ?');
      values.push(email_messages ? 1 : 0);
    }
    if (email_promotions !== undefined) {
      updates.push('email_promotions = ?');
      values.push(email_promotions ? 1 : 0);
    }
    if (sms_order_updates !== undefined) {
      updates.push('sms_order_updates = ?');
      values.push(sms_order_updates ? 1 : 0);
    }
    if (sms_messages !== undefined) {
      updates.push('sms_messages = ?');
      values.push(sms_messages ? 1 : 0);
    }
    if (push_notifications !== undefined) {
      updates.push('push_notifications = ?');
      values.push(push_notifications ? 1 : 0);
    }
    if (real_time_notifications !== undefined) {
      updates.push('real_time_notifications = ?');
      values.push(real_time_notifications ? 1 : 0);
    }
    if (frequency !== undefined) {
      updates.push('frequency = ?');
      values.push(frequency);
    }
    
    if (updates.length === 0) {
      throw new ApiError(400, 'No fields to update');
    }
    
    values.push(userId);
    
    await db.query(
      `UPDATE notification_settings SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );
    
    logger.info(`Notification settings ${userId} updated`);
    
    return { message: 'Notification settings updated successfully' };
  } catch (error) {
    logger.error('Error updating notification settings:', error);
    throw error;
  }
};

/**
 * Change password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Get user with password
    const [user] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      throw new ApiError(401, 'Current password is incorrect');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    
    // Store in password history
    await db.query(
      'INSERT INTO password_history (user_id, password_hash) VALUES (?, ?)',
      [userId, hashedPassword]
    );
    
    logger.info(`User ${userId} changed password`);
    
    return { message: 'Password changed successfully' };
  } catch (error) {
    logger.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Toggle two-factor authentication
 */
const toggleTwoFactor = async (userId, enabled) => {
  try {
    await db.query(
      'UPDATE customer_profiles SET two_factor_enabled = ? WHERE user_id = ?',
      [enabled ? 1 : 0, userId]
    );
    
    logger.info(`User ${userId} ${enabled ? 'enabled' : 'disabled'} 2FA`);
    
    return { 
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
      two_factor_enabled: enabled
    };
  } catch (error) {
    logger.error('Error toggling 2FA:', error);
    throw error;
  }
};

/**
 * Delete account
 */
const deleteAccount = async (userId, password) => {
  try {
    // Get user with password
    const [user] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new ApiError(401, 'Password is incorrect');
    }
    
    // Soft delete - update account status
    await db.query(
      'UPDATE users SET account_status = ?, is_active = 0 WHERE id = ?',
      ['deleted', userId]
    );
    
    logger.info(`User ${userId} deleted account`);
    
    return { message: 'Account deleted successfully' };
  } catch (error) {
    logger.error('Error deleting account:', error);
    throw error;
  }
};

module.exports = {
  getCustomerProfile,
  updateUserInfo,
  updateCustomerProfile,
  updateNotificationSettings,
  changePassword,
  toggleTwoFactor,
  deleteAccount,
};

