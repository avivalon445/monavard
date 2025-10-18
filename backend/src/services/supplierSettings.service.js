const db = require('../config/database');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

/**
 * Supplier Settings Service
 * Handles all business logic for supplier account settings and preferences
 */

/**
 * Get all supplier settings
 */
const getSupplierSettings = async (supplierId) => {
  try {
    // Get user basic info
    const [user] = await db.query(
      'SELECT id, email, first_name, last_name, phone, user_type, is_verified, created_at, two_factor_enabled FROM users WHERE id = ?',
      [supplierId]
    );
    
    if (!user) {
      throw new ApiError(404, 'Supplier not found');
    }
    
    // Get supplier profile for profile_id
    const [profile] = await db.query('SELECT id FROM supplier_profiles WHERE user_id = ?', [supplierId]);
    if (!profile) {
      throw new ApiError(404, 'Supplier profile not found');
    }
    
    // Get notification preferences
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
    
    // Get account security settings (from user table)
    const securitySettings = {
      two_factor_enabled: user.two_factor_enabled || false,
      email_verified: user.is_verified || false,
      last_password_change: null, // This would need to be tracked separately
      account_created: user.created_at
    };
    
    // Get subscription information
    const [subscriptionInfo] = await db.query(
      'SELECT subscription_plan, subscription_expires_at, premium_status FROM supplier_profiles WHERE user_id = ?',
      [supplierId]
    );
    
    return {
      user,
      notification_settings: notificationSettings,
      privacy_settings: privacySettings,
      security_settings: securitySettings,
      subscription_info: subscriptionInfo || { subscription_plan: 'basic', premium_status: 0 }
    };
  } catch (error) {
    logger.error('Error fetching supplier settings:', error);
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
 * Update user basic information
 */
const updateUserInfo = async (supplierId, updateData) => {
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
    logger.error('Error updating user info:', error);
    throw error;
  }
};

/**
 * Change password
 */
const changePassword = async (supplierId, passwordData) => {
  try {
    const { current_password, new_password, confirm_password } = passwordData;
    
    // Validate input
    if (!current_password || !new_password || !confirm_password) {
      throw new ApiError(400, 'All password fields are required');
    }
    
    if (new_password !== confirm_password) {
      throw new ApiError(400, 'New password and confirmation do not match');
    }
    
    if (new_password.length < 8) {
      throw new ApiError(400, 'New password must be at least 8 characters long');
    }
    
    // Get current user
    const [user] = await db.query('SELECT password FROM users WHERE id = ?', [supplierId]);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isCurrentPasswordValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }
    
    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);
    
    // Update password
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, supplierId]);
    
    // Log password change
    await db.query(
      'INSERT INTO account_actions (user_id, action_type, reason, created_at) VALUES (?, "password_change", "Password changed by user", NOW())',
      [supplierId]
    );
    
    logger.info(`Password changed for supplier ${supplierId}`);
    return { message: 'Password changed successfully' };
  } catch (error) {
    logger.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Update email address
 */
const updateEmail = async (supplierId, emailData) => {
  try {
    const { new_email, current_password } = emailData;
    
    if (!new_email || !current_password) {
      throw new ApiError(400, 'Email and current password are required');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(new_email)) {
      throw new ApiError(400, 'Invalid email format');
    }
    
    // Check if email already exists
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [new_email, supplierId]);
    if (existingUser) {
      throw new ApiError(400, 'Email address is already in use');
    }
    
    // Get current user
    const [user] = await db.query('SELECT password, email FROM users WHERE id = ?', [supplierId]);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isCurrentPasswordValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }
    
    // Update email
    await db.query('UPDATE users SET email = ?, is_verified = 0 WHERE id = ?', [new_email, supplierId]);
    
    // Log email change
    await db.query(
      'INSERT INTO account_actions (user_id, action_type, reason, created_at) VALUES (?, "email_change", "Email changed by user", NOW())',
      [supplierId]
    );
    
    logger.info(`Email updated for supplier ${supplierId} from ${user.email} to ${new_email}`);
    return { message: 'Email address updated successfully. Please verify your new email address.' };
  } catch (error) {
    logger.error('Error updating email:', error);
    throw error;
  }
};

/**
 * Toggle two-factor authentication
 */
const toggleTwoFactor = async (supplierId, toggleData) => {
  try {
    const { enable, current_password } = toggleData;
    
    if (enable === undefined || !current_password) {
      throw new ApiError(400, 'Enable flag and current password are required');
    }
    
    // Get current user
    const [user] = await db.query('SELECT password, two_factor_enabled FROM users WHERE id = ?', [supplierId]);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isCurrentPasswordValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }
    
    // Check if already in desired state
    if (user.two_factor_enabled === enable) {
      throw new ApiError(400, `Two-factor authentication is already ${enable ? 'enabled' : 'disabled'}`);
    }
    
    // Update two-factor setting
    await db.query('UPDATE users SET two_factor_enabled = ? WHERE id = ?', [enable ? 1 : 0, supplierId]);
    
    // Log the change
    await db.query(
      'INSERT INTO account_actions (user_id, action_type, reason, created_at) VALUES (?, ?, ?, NOW())',
      [supplierId, enable ? 'enable_2fa' : 'disable_2fa', `Two-factor authentication ${enable ? 'enabled' : 'disabled'} by user`]
    );
    
    logger.info(`Two-factor authentication ${enable ? 'enabled' : 'disabled'} for supplier ${supplierId}`);
    return { message: `Two-factor authentication ${enable ? 'enabled' : 'disabled'} successfully` };
  } catch (error) {
    logger.error('Error toggling two-factor authentication:', error);
    throw error;
  }
};

/**
 * Get account activity log
 */
const getAccountActivity = async (supplierId, limit = 50) => {
  try {
    const activities = await db.query(
      `SELECT 
        action_type,
        reason,
        created_at,
        performed_by
      FROM account_actions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?`,
      [supplierId, limit]
    );
    
    return activities;
  } catch (error) {
    logger.error('Error fetching account activity:', error);
    throw error;
  }
};

/**
 * Delete account (soft delete)
 */
const deleteAccount = async (supplierId, deleteData) => {
  try {
    const { password, reason } = deleteData;
    
    if (!password) {
      throw new ApiError(400, 'Password is required to delete account');
    }
    
    // Get current user
    const [user] = await db.query('SELECT password, email FROM users WHERE id = ?', [supplierId]);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(400, 'Password is incorrect');
    }
    
    // Check for active orders
    const [activeOrders] = await db.query(
      'SELECT COUNT(*) as count FROM orders WHERE supplier_id = ? AND status IN ("confirmed", "in_progress", "production", "shipped")',
      [supplierId]
    );
    
    if (activeOrders.count > 0) {
      throw new ApiError(400, 'Cannot delete account with active orders. Please complete or cancel all orders first.');
    }
    
    // Log account deletion
    await db.query(
      'INSERT INTO account_actions (user_id, action_type, reason, created_at) VALUES (?, "account_deletion", ?, NOW())',
      [supplierId, reason || 'Account deleted by user']
    );
    
    // Deactivate account instead of hard delete
    await db.query('UPDATE users SET is_active = 0, deactivated_at = NOW() WHERE id = ?', [supplierId]);
    
    logger.info(`Account deactivated for supplier ${supplierId}`);
    return { message: 'Account has been deactivated successfully' };
  } catch (error) {
    logger.error('Error deleting account:', error);
    throw error;
  }
};

/**
 * Export account data (GDPR compliance)
 */
const exportAccountData = async (supplierId) => {
  try {
    // Get all user data
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [supplierId]);
    const [profile] = await db.query('SELECT * FROM supplier_profiles WHERE user_id = ?', [supplierId]);
    const [notifications] = await db.query('SELECT * FROM supplier_notification_preferences WHERE supplier_id = ?', [profile?.id]);
    const [privacy] = await db.query('SELECT * FROM supplier_privacy_settings WHERE supplier_id = ?', [profile?.id]);
    const bids = await db.query('SELECT * FROM bids WHERE supplier_id = ?', [supplierId]);
    const orders = await db.query('SELECT * FROM orders WHERE supplier_id = ?', [supplierId]);
    const portfolio = await db.query('SELECT * FROM supplier_portfolio WHERE supplier_id = ?', [supplierId]);
    const activities = await db.query('SELECT * FROM account_actions WHERE user_id = ?', [supplierId]);
    
    const exportData = {
      user_data: user,
      profile_data: profile,
      notification_preferences: notifications,
      privacy_settings: privacy,
      bids: bids,
      orders: orders,
      portfolio: portfolio,
      account_activities: activities,
      export_date: new Date().toISOString(),
      export_type: 'complete_account_data'
    };
    
    logger.info(`Account data exported for supplier ${supplierId}`);
    return exportData;
  } catch (error) {
    logger.error('Error exporting account data:', error);
    throw error;
  }
};

module.exports = {
  getSupplierSettings,
  updateNotificationPreferences,
  updatePrivacySettings,
  updateUserInfo,
  changePassword,
  updateEmail,
  toggleTwoFactor,
  getAccountActivity,
  deleteAccount,
  exportAccountData
};
