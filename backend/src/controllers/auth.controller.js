const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { sendTokenResponse, storeRefreshToken, verifyRefreshToken, revokeRefreshToken } = require('../utils/tokenManager');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || '';

  const user = await authService.register(req.body, ipAddress, userAgent);

  ApiResponse.created('Registration successful. Please check your email to verify your account.', user).send(res);
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || '';

  const user = await authService.login(email, password, ipAddress, userAgent);

  // Generate and send tokens
  const refreshToken = await sendTokenResponse(user, 200, res);
  
  // Store refresh token
  await storeRefreshToken(user.id, refreshToken, ipAddress, userAgent);
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  // Clear cookies
  res.cookie('token', '', { maxAge: 0 });
  res.cookie('refreshToken', '', { maxAge: 0 });

  ApiResponse.success('Logged out successfully').send(res);
});

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  const userData = await verifyRefreshToken(refreshToken);

  if (!userData) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // Generate new tokens
  const user = {
    id: userData.id,
    email: userData.email,
    user_type: userData.user_type
  };

  sendTokenResponse(user, 200, res);
});

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  await authService.verifyEmail(token);

  ApiResponse.success('Email verified successfully').send(res);
});

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  await authService.forgotPassword(email);

  ApiResponse.success('Password reset email sent').send(res);
});

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  await authService.resetPassword(token, password);

  ApiResponse.success('Password reset successfully').send(res);
});

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (authenticated)
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(req.user.id, currentPassword, newPassword);

  ApiResponse.success('Password changed successfully').send(res);
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  ApiResponse.success('User retrieved successfully', user).send(res);
});

