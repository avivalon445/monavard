const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const supplierProfileService = require('../services/supplierProfile.service');
const logger = require('../utils/logger');

/**
 * Supplier Profile Controller
 * Handles HTTP requests for supplier profile management
 */

/**
 * Get complete supplier profile
 */
const getSupplierProfile = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  logger.info(`Fetching profile for supplier ${supplierId}`);
  
  const profile = await supplierProfileService.getSupplierProfile(supplierId);
  res.json(new ApiResponse(200, 'Profile retrieved successfully', profile));
});

/**
 * Update supplier profile
 */
const updateSupplierProfile = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const updateData = req.body;
  
  logger.info(`Updating profile for supplier ${supplierId}`);
  const result = await supplierProfileService.updateSupplierProfile(supplierId, updateData);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Update supplier user info
 */
const updateSupplierUserInfo = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const updateData = req.body;
  
  logger.info(`Updating user info for supplier ${supplierId}`);
  const result = await supplierProfileService.updateSupplierUserInfo(supplierId, updateData);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Update notification preferences
 */
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const preferences = req.body;
  
  logger.info(`Updating notification preferences for supplier ${supplierId}`);
  const result = await supplierProfileService.updateNotificationPreferences(supplierId, preferences);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Update privacy settings
 */
const updatePrivacySettings = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const settings = req.body;
  
  logger.info(`Updating privacy settings for supplier ${supplierId}`);
  const result = await supplierProfileService.updatePrivacySettings(supplierId, settings);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Add supplier category
 */
const addSupplierCategory = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const categoryData = req.body;
  
  logger.info(`Adding category for supplier ${supplierId}`);
  const result = await supplierProfileService.addSupplierCategory(supplierId, categoryData);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Update supplier category
 */
const updateSupplierCategory = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const categoryId = req.params.id;
  const updateData = req.body;
  
  logger.info(`Updating category ${categoryId} for supplier ${supplierId}`);
  const result = await supplierProfileService.updateSupplierCategory(supplierId, categoryId, updateData);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Remove supplier category
 */
const removeSupplierCategory = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const categoryId = req.params.id;
  
  logger.info(`Removing category ${categoryId} for supplier ${supplierId}`);
  const result = await supplierProfileService.removeSupplierCategory(supplierId, categoryId);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Upload supplier file
 */
const uploadSupplierFile = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const fileData = req.body;
  
  logger.info(`Uploading file for supplier ${supplierId}`);
  const result = await supplierProfileService.uploadSupplierFile(supplierId, fileData);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Delete supplier file
 */
const deleteSupplierFile = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const fileId = req.params.id;
  
  logger.info(`Deleting file ${fileId} for supplier ${supplierId}`);
  const result = await supplierProfileService.deleteSupplierFile(supplierId, fileId);
  res.json(new ApiResponse(200, result.message, result));
});

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
