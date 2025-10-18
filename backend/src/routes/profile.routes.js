const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const profileController = require('../controllers/profile.controller');

// All routes require authentication
router.use(protect);

// GET /api/v1/profile/customer - Get customer profile with all settings
router.get('/customer', authorize('customer'), profileController.getCustomerProfile);

// PUT /api/v1/profile/user - Update user basic info
router.put('/user', profileController.updateUserInfo);

// PUT /api/v1/profile/customer - Update customer profile
router.put('/customer', authorize('customer'), profileController.updateCustomerProfile);

// PUT /api/v1/profile/notifications - Update notification settings
router.put('/notifications', profileController.updateNotificationSettings);

// POST /api/v1/profile/change-password - Change password
router.post('/change-password', profileController.changePassword);

// POST /api/v1/profile/toggle-2fa - Toggle two-factor authentication
router.post('/toggle-2fa', profileController.toggleTwoFactor);

// POST /api/v1/profile/delete-account - Delete account
router.post('/delete-account', profileController.deleteAccount);

module.exports = router;

