const profileService = require('../services/profile.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get customer profile with all settings
 * GET /api/v1/profile/customer
 */
const getCustomerProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const profile = await profileService.getCustomerProfile(userId);
  
  res.json(
    new ApiResponse(200, 'Profile retrieved successfully', profile)
  );
});

/**
 * Update user basic info
 * PUT /api/v1/profile/user
 * Note: Email cannot be changed via this endpoint for security reasons
 */
const updateUserInfo = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { first_name, last_name, phone } = req.body;
  
  const result = await profileService.updateUserInfo(userId, {
    first_name,
    last_name,
    phone
  });
  
  res.json(
    new ApiResponse(200, result.message)
  );
});

/**
 * Update customer profile
 * PUT /api/v1/profile/customer
 */
const updateCustomerProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const result = await profileService.updateCustomerProfile(userId, req.body);
  
  res.json(
    new ApiResponse(200, result.message)
  );
});

/**
 * Update notification settings
 * PUT /api/v1/profile/notifications
 */
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const result = await profileService.updateNotificationSettings(userId, req.body);
  
  res.json(
    new ApiResponse(200, result.message)
  );
});

/**
 * Change password
 * POST /api/v1/profile/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json(
      new ApiResponse(400, 'Current password and new password are required')
    );
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json(
      new ApiResponse(400, 'New password must be at least 8 characters long')
    );
  }
  
  const result = await profileService.changePassword(userId, currentPassword, newPassword);
  
  res.json(
    new ApiResponse(200, result.message)
  );
});

/**
 * Toggle two-factor authentication
 * POST /api/v1/profile/toggle-2fa
 */
const toggleTwoFactor = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { enabled } = req.body;
  
  if (typeof enabled !== 'boolean') {
    return res.status(400).json(
      new ApiResponse(400, 'Enabled must be a boolean value')
    );
  }
  
  const result = await profileService.toggleTwoFactor(userId, enabled);
  
  res.json(
    new ApiResponse(200, result.message, { two_factor_enabled: result.two_factor_enabled })
  );
});

/**
 * Delete account
 * POST /api/v1/profile/delete-account
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json(
      new ApiResponse(400, 'Password is required to delete account')
    );
  }
  
  const result = await profileService.deleteAccount(userId, password);
  
  res.json(
    new ApiResponse(200, result.message)
  );
});

module.exports = {
  getCustomerProfile,
  updateUserInfo,
  updateCustomerProfile,
  updateNotificationSettings,
  changePassword,
  toggleTwoFactor,
  deleteAccount,
};

