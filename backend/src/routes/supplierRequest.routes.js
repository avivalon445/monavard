const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and supplier role
router.use(protect);
router.use(authorize('supplier'));

/**
 * @route   GET /api/v1/supplier/requests/stats/summary
 * @desc    Get request statistics for supplier
 * @access  Private (Supplier)
 */
router.get('/stats/summary', requestController.getSupplierRequestStatistics);

/**
 * @route   GET /api/v1/supplier/requests
 * @desc    Get available requests for suppliers
 * @access  Private (Supplier)
 */
router.get('/', requestController.getAvailableRequests);

/**
 * @route   GET /api/v1/supplier/requests/:id
 * @desc    Get supplier request by ID
 * @access  Private (Supplier)
 */
router.get('/:id', requestController.getSupplierRequestById);

module.exports = router;
