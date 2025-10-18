const express = require('express');
const router = express.Router();
const supplierBidController = require('../controllers/supplierBid.controller');
const { protect, authorize } = require('../middleware/auth');
const { validateJoi } = require('../middleware/validator');
const { createBidSchema, updateBidSchema, cancelBidSchema, bidIdSchema } = require('../validators/bid.validator');

// All routes require authentication and supplier role
router.use(protect);
router.use(authorize('supplier'));

/**
 * @route   POST /api/v1/supplier/bids
 * @desc    Create a new bid
 * @access  Private (Supplier)
 */
router.post('/', validateJoi(createBidSchema, 'body'), supplierBidController.createSupplierBid);

/**
 * @route   GET /api/v1/supplier/bids/stats/summary
 * @desc    Get bid statistics for supplier
 * @access  Private (Supplier)
 */
router.get('/stats/summary', supplierBidController.getSupplierBidStatistics);

/**
 * @route   GET /api/v1/supplier/bids
 * @desc    Get all bids submitted by supplier
 * @access  Private (Supplier)
 */
router.get('/', supplierBidController.getSupplierBids);

/**
 * @route   GET /api/v1/supplier/bids/:id
 * @desc    Get supplier bid by ID
 * @access  Private (Supplier)
 */
router.get('/:id', validateJoi(bidIdSchema, 'params'), supplierBidController.getSupplierBidById);

/**
 * @route   PUT /api/v1/supplier/bids/:id
 * @desc    Update supplier bid
 * @access  Private (Supplier)
 */
router.put('/:id', validateJoi(bidIdSchema, 'params'), validateJoi(updateBidSchema, 'body'), supplierBidController.updateSupplierBid);

/**
 * @route   POST /api/v1/supplier/bids/:id/cancel
 * @desc    Cancel supplier bid
 * @access  Private (Supplier)
 */
router.post('/:id/cancel', validateJoi(bidIdSchema, 'params'), validateJoi(cancelBidSchema, 'body'), supplierBidController.cancelSupplierBid);

module.exports = router;
