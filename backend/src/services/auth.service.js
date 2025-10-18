const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const ApiError = require('../utils/ApiError');
const {
  generateVerificationToken,
  generatePasswordResetToken,
  storeRefreshToken
} = require('../utils/tokenManager');
const emailService = require('./email.service');
const logger = require('../utils/logger');

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 * @returns {Promise<Object>} Created user
 */
const register = async (userData, ipAddress, userAgent) => {
  const { email, password, first_name, last_name, phone, user_type, company_name } = userData;

  // Check if user already exists
  const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (existingUser.length > 0) {
    throw ApiError.conflict('Email already registered');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

  // Generate verification token
  const verificationToken = generateVerificationToken();

  // Create user in transaction
  const user = await transaction(async (connection) => {
    // Insert user
    const [result] = await connection.execute(
      `INSERT INTO users (email, password, first_name, last_name, phone, user_type, verification_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, first_name, last_name, phone || null, user_type, verificationToken]
    );

    const userId = result.insertId;

    // Create profile based on user type
    if (user_type === 'customer') {
      await connection.execute(
        'INSERT INTO customer_profiles (user_id) VALUES (?)',
        [userId]
      );
    } else if (user_type === 'supplier') {
      if (!company_name) {
        throw ApiError.badRequest('Company name is required for suppliers');
      }
      await connection.execute(
        'INSERT INTO supplier_profiles (user_id, company_name) VALUES (?, ?)',
        [userId, company_name]
      );
    }

    // Create notification settings
    await connection.execute(
      'INSERT INTO notification_settings (user_id) VALUES (?)',
      [userId]
    );

    // Create security settings
    await connection.execute(
      'INSERT INTO user_security_settings (user_id) VALUES (?)',
      [userId]
    );

    // Log registration
    await connection.execute(
      `INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success)
       VALUES (?, 'registration', ?, ?, 1)`,
      [userId, ipAddress, userAgent]
    );

    return {
      id: userId,
      email,
      first_name,
      last_name,
      phone,
      user_type,
      is_verified: false,
      is_active: true
    };
  });

  // Send verification email
  try {
    await emailService.sendVerificationEmail(email, first_name, verificationToken);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    // Don't fail registration if email fails
  }

  return user;
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 * @returns {Promise<Object>} User object
 */
const login = async (email, password, ipAddress, userAgent) => {
  // Get user with password
  const sql = `
    SELECT id, email, password, first_name, last_name, phone, user_type, 
           is_verified, is_active, account_status, last_login
    FROM users 
    WHERE email = ?
  `;
  
  const users = await query(sql, [email]);

  if (users.length === 0) {
    // Log failed attempt
    await query(
      `INSERT INTO auth_logs (action, ip_address, user_agent, success, failure_reason)
       VALUES ('login_failed', ?, ?, 0, 'Invalid credentials')`,
      [ipAddress, userAgent]
    );
    throw ApiError.unauthorized('Invalid email or password');
  }

  const user = users[0];

  // Check if account is active
  if (!user.is_active || user.account_status !== 'active') {
    await query(
      `INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success, failure_reason)
       VALUES (?, 'login_failed', ?, ?, 0, 'Account inactive or suspended')`,
      [user.id, ipAddress, userAgent]
    );
    throw ApiError.forbidden('Account is inactive or suspended');
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    await query(
      `INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success, failure_reason)
       VALUES (?, 'login_failed', ?, ?, 0, 'Invalid password')`,
      [user.id, ipAddress, userAgent]
    );
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Update last login
  await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

  // Log successful login
  await query(
    `INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success)
     VALUES (?, 'login', ?, ?, 1)`,
    [user.id, ipAddress, userAgent]
  );

  // Remove password from user object
  delete user.password;

  return user;
};

/**
 * Verify email with token
 * @param {string} token - Verification token
 * @returns {Promise<boolean>}
 */
const verifyEmail = async (token) => {
  const sql = 'SELECT id, email, is_verified FROM users WHERE verification_token = ?';
  const users = await query(sql, [token]);

  if (users.length === 0) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }

  const user = users[0];

  if (user.is_verified) {
    throw ApiError.badRequest('Email already verified');
  }

  // Update user
  await query(
    'UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?',
    [user.id]
  );

  // Log verification
  await query(
    `INSERT INTO auth_logs (user_id, action, success)
     VALUES (?, 'email_verification', 1)`,
    [user.id]
  );

  return true;
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<boolean>}
 */
const forgotPassword = async (email) => {
  const sql = 'SELECT id, email, first_name FROM users WHERE email = ? AND is_active = 1';
  const users = await query(sql, [email]);

  if (users.length === 0) {
    // Don't reveal if email exists
    return true;
  }

  const user = users[0];
  const resetToken = generatePasswordResetToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store reset token
  await query(
    'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
    [resetToken, resetExpires, user.id]
  );

  // Send reset email
  try {
    await emailService.sendPasswordResetEmail(user.email, user.first_name, resetToken);
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw ApiError.internal('Failed to send reset email');
  }

  return true;
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>}
 */
const resetPassword = async (token, newPassword) => {
  const sql = `
    SELECT id, email 
    FROM users 
    WHERE reset_password_token = ? 
      AND reset_password_expires > NOW()
      AND is_active = 1
  `;
  
  const users = await query(sql, [token]);

  if (users.length === 0) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const user = users[0];

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

  // Update password and clear reset token
  await query(
    `UPDATE users 
     SET password = ?, reset_password_token = NULL, reset_password_expires = NULL 
     WHERE id = ?`,
    [hashedPassword, user.id]
  );

  // Store password in history
  await query(
    'INSERT INTO password_history (user_id, password_hash) VALUES (?, ?)',
    [user.id, hashedPassword]
  );

  // Update security settings
  await query(
    'UPDATE user_security_settings SET last_password_change = NOW() WHERE user_id = ?',
    [user.id]
  );

  // Log password change
  await query(
    `INSERT INTO auth_logs (user_id, action, success)
     VALUES (?, 'password_reset', 1)`,
    [user.id]
  );

  // Revoke all refresh tokens for security
  await query(
    'UPDATE refresh_tokens SET is_revoked = 1, revoked_at = NOW() WHERE user_id = ?',
    [user.id]
  );

  return true;
};

/**
 * Change password
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // Get user with password
  const users = await query('SELECT id, password FROM users WHERE id = ?', [userId]);

  if (users.length === 0) {
    throw ApiError.notFound('User not found');
  }

  const user = users[0];

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

  // Update password
  await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

  // Store in password history
  await query(
    'INSERT INTO password_history (user_id, password_hash) VALUES (?, ?)',
    [userId, hashedPassword]
  );

  // Update security settings
  await query(
    'UPDATE user_security_settings SET last_password_change = NOW() WHERE user_id = ?',
    [userId]
  );

  // Log password change
  await query(
    `INSERT INTO auth_logs (user_id, action, success)
     VALUES (?, 'password_change', 1)`,
    [userId]
  );

  return true;
};

/**
 * Get current user profile
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User profile
 */
const getCurrentUser = async (userId) => {
  const sql = `
    SELECT 
      u.id, u.email, u.first_name, u.last_name, u.phone, u.user_type,
      u.is_verified, u.is_active, u.account_status, u.last_login, u.created_at,
      CASE 
        WHEN u.user_type = 'customer' THEN JSON_OBJECT(
          'company_name', cp.company_name,
          'industry', cp.industry,
          'preferred_currency', cp.preferred_currency
        )
        WHEN u.user_type = 'supplier' THEN JSON_OBJECT(
          'company_name', sp.company_name,
          'rating', sp.rating,
          'review_count', sp.review_count,
          'is_approved', sp.is_approved
        )
        ELSE NULL
      END as profile_data
    FROM users u
    LEFT JOIN customer_profiles cp ON u.id = cp.user_id AND u.user_type = 'customer'
    LEFT JOIN supplier_profiles sp ON u.id = sp.user_id AND u.user_type = 'supplier'
    WHERE u.id = ?
  `;

  const users = await query(sql, [userId]);

  if (users.length === 0) {
    throw ApiError.notFound('User not found');
  }

  const user = users[0];
  
  // Parse profile data
  if (user.profile_data) {
    user.profile = JSON.parse(user.profile_data);
    delete user.profile_data;
  }

  return user;
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser
};

