const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const supplierSettingsController = require('../controllers/supplierSettings.controller');
const { validateJoi } = require('../middleware/validator');
const { 
  updateUserInfoSchema,
  changePasswordSchema,
  updateEmailSchema,
  toggleTwoFactorSchema,
  deleteAccountSchema,
  notificationPreferencesSchema,
  privacySettingsSchema
} = require('../validators/supplier.validator');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('supplier'));

// Settings routes
router.get('/', supplierSettingsController.getSupplierSettings);

// User information
router.put('/user-info', validateJoi(updateUserInfoSchema, 'body'), supplierSettingsController.updateUserInfo);

// Security settings
router.put('/password', validateJoi(changePasswordSchema, 'body'), supplierSettingsController.changePassword);
router.put('/email', validateJoi(updateEmailSchema, 'body'), supplierSettingsController.updateEmail);
router.put('/two-factor', validateJoi(toggleTwoFactorSchema, 'body'), supplierSettingsController.toggleTwoFactor);

// Notification preferences
router.put('/notifications', validateJoi(notificationPreferencesSchema, 'body'), supplierSettingsController.updateNotificationPreferences);

// Privacy settings
router.put('/privacy', validateJoi(privacySettingsSchema, 'body'), supplierSettingsController.updatePrivacySettings);

// Account management
router.get('/activity', supplierSettingsController.getAccountActivity);
router.delete('/account', validateJoi(deleteAccountSchema, 'body'), supplierSettingsController.deleteAccount);
router.get('/export', supplierSettingsController.exportAccountData);

module.exports = router;
