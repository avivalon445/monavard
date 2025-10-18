const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const supplierProfileController = require('../controllers/supplierProfile.controller');
const { validateJoi } = require('../middleware/validator');
const { 
  updateSupplierProfileSchema, 
  updateUserInfoSchema,
  notificationPreferencesSchema,
  privacySettingsSchema,
  supplierCategorySchema,
  fileUploadSchema
} = require('../validators/supplier.validator');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('supplier'));

// Profile routes
router.get('/', supplierProfileController.getSupplierProfile);
router.put('/', validateJoi(updateSupplierProfileSchema, 'body'), supplierProfileController.updateSupplierProfile);
router.put('/user-info', validateJoi(updateUserInfoSchema, 'body'), supplierProfileController.updateSupplierUserInfo);

// Notification preferences
router.put('/notifications', validateJoi(notificationPreferencesSchema, 'body'), supplierProfileController.updateNotificationPreferences);

// Privacy settings
router.put('/privacy', validateJoi(privacySettingsSchema, 'body'), supplierProfileController.updatePrivacySettings);

// Categories management
router.post('/categories', validateJoi(supplierCategorySchema, 'body'), supplierProfileController.addSupplierCategory);
router.put('/categories/:id', validateJoi(supplierCategorySchema, 'body'), supplierProfileController.updateSupplierCategory);
router.delete('/categories/:id', supplierProfileController.removeSupplierCategory);

// File management
router.post('/files', validateJoi(fileUploadSchema, 'body'), supplierProfileController.uploadSupplierFile);
router.delete('/files/:id', supplierProfileController.deleteSupplierFile);

module.exports = router;
