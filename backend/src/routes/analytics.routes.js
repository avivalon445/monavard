const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analytics.controller');

/**
 * Analytics Routes
 * All routes are protected and require supplier authorization
 */

router.use(protect);
router.use(authorize('supplier'));

// Main analytics endpoint
router.get('/', analyticsController.getSupplierAnalytics);

// Specific analytics endpoints for different sections
router.get('/overview', analyticsController.getAnalyticsOverview);
router.get('/financial', analyticsController.getFinancialAnalytics);
router.get('/performance', analyticsController.getPerformanceAnalytics);
router.get('/categories', analyticsController.getCategoryAnalytics);
router.get('/competitive', analyticsController.getCompetitiveAnalysis);

module.exports = router;
