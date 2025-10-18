const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const supplierSettingsService = require('../services/supplierSettings.service');
const logger = require('../utils/logger');

/**
 * Supplier Settings Controller
 * Handles HTTP requests for supplier account settings
 */

/**
 * Get supplier settings
 */
const getSupplierSettings = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  
  logger.info(`Fetching settings for supplier ${supplierId}`);
  const settings = await supplierSettingsService.getSupplierSettings(supplierId);
  res.json(new ApiResponse(200, 'Settings retrieved successfully', settings));
});

/**
 * Update notification preferences
 */
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const preferences = req.body;
  
  logger.info(`Updating notification preferences for supplier ${supplierId}`);
  const result = await supplierSettingsService.updateNotificationPreferences(supplierId, preferences);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Update privacy settings
 */
const updatePrivacySettings = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const settings = req.body;
  
  logger.info(`Updating privacy settings for supplier ${supplierId}`);
  const result = await supplierSettingsService.updatePrivacySettings(supplierId, settings);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Update user info
 */
const updateUserInfo = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const updateData = req.body;
  
  logger.info(`Updating user info for supplier ${supplierId}`);
  const result = await supplierSettingsService.updateUserInfo(supplierId, updateData);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Change password
 */
const changePassword = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const passwordData = req.body;
  
  logger.info(`Changing password for supplier ${supplierId}`);
  const result = await supplierSettingsService.changePassword(supplierId, passwordData);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Update email
 */
const updateEmail = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const emailData = req.body;
  
  logger.info(`Updating email for supplier ${supplierId}`);
  const result = await supplierSettingsService.updateEmail(supplierId, emailData);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Toggle two-factor authentication
 */
const toggleTwoFactor = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const toggleData = req.body;
  
  logger.info(`Toggling two-factor authentication for supplier ${supplierId}`);
  const result = await supplierSettingsService.toggleTwoFactor(supplierId, toggleData);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Get account activity
 */
const getAccountActivity = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  
  logger.info(`Fetching account activity for supplier ${supplierId}`);
  const activities = await supplierSettingsService.getAccountActivity(supplierId, limit);
  res.json(new ApiResponse(200, 'Account activity retrieved successfully', activities));
});

/**
 * Delete account
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const deleteData = req.body;
  
  logger.info(`Deleting account for supplier ${supplierId}`);
  const result = await supplierSettingsService.deleteAccount(supplierId, deleteData);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Export account data
 */
const exportAccountData = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  
  logger.info(`Exporting account data for supplier ${supplierId}`);
  const exportData = await supplierSettingsService.exportAccountData(supplierId);
  
  // Set headers for file download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="account_data_${supplierId}_${Date.now()}.json"`);
  
  res.json(new ApiResponse(200, 'Account data exported successfully', exportData));
});

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
