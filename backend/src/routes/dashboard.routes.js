const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboard.controller');

// All routes require authentication
router.use(protect);

// GET /api/v1/dashboard/customer - Get customer dashboard
router.get('/customer', authorize('customer'), dashboardController.getCustomerDashboard);

// GET /api/v1/dashboard/supplier - Get supplier dashboard
router.get('/supplier', authorize('supplier'), dashboardController.getSupplierDashboard);

module.exports = router;

