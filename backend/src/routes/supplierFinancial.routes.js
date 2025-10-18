const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const supplierFinancialController = require('../controllers/supplierFinancial.controller');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('supplier'));

// Financial report routes
router.get('/report', supplierFinancialController.getFinancialReport);
router.get('/summary', supplierFinancialController.getFinancialSummary);
router.get('/tax', supplierFinancialController.getTaxReport);
router.get('/commission', supplierFinancialController.getCommissionBreakdown);

module.exports = router;
