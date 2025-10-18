const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const crypto = require('crypto');

/**
 * Generate JWT access token
 * @param {number} userId - User ID
 * @returns {string} JWT token
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
};

/**
 * Generate JWT refresh token
 * @param {number} userId - User ID
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

/**
 * Store refresh token in database
 * @param {number} userId - User ID
 * @param {string} refreshToken - Refresh token
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 * @returns {Promise<void>}
 */
const storeRefreshToken = async (userId, refreshToken, ipAddress, userAgent) => {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const sql = `
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `;

  await query(sql, [userId, tokenHash, expiresAt, ipAddress, userAgent]);
};

/**
 * Verify refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object|null>} User object or null
 */
const verifyRefreshToken = async (refreshToken) => {
  try {
    // Verify JWT
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if token exists in database and not revoked
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    const sql = `
      SELECT rt.*, u.id, u.email, u.user_type, u.is_active
      FROM refresh_tokens rt
      INNER JOIN users u ON rt.user_id = u.id
      WHERE rt.token_hash = ? 
        AND rt.is_revoked = 0 
        AND rt.expires_at > NOW()
        AND u.id = ?
        AND u.is_active = 1
    `;
    
    const results = await query(sql, [tokenHash, decoded.id]);
    
    if (!results || results.length === 0) {
      return null;
    }
    
    return results[0];
  } catch (error) {
    return null;
  }
};

/**
 * Revoke refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<boolean>}
 */
const revokeRefreshToken = async (refreshToken) => {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  const sql = `
    UPDATE refresh_tokens 
    SET is_revoked = 1, revoked_at = NOW()
    WHERE token_hash = ?
  `;
  
  await query(sql, [tokenHash]);
  return true;
};

/**
 * Revoke all refresh tokens for a user
 * @param {number} userId - User ID
 * @returns {Promise<boolean>}
 */
const revokeAllUserTokens = async (userId) => {
  const sql = `
    UPDATE refresh_tokens 
    SET is_revoked = 1, revoked_at = NOW()
    WHERE user_id = ? AND is_revoked = 0
  `;
  
  await query(sql, [userId]);
  return true;
};

/**
 * Generate email verification token
 * @returns {string} Verification token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate password reset token
 * @returns {string} Reset token
 */
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Send token response (cookie + JSON)
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Remove password from output
  delete user.password;

  res
    .status(statusCode)
    .cookie('token', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({
      success: true,
      message: 'Authentication successful',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  generateVerificationToken,
  generatePasswordResetToken,
  sendTokenResponse
};

