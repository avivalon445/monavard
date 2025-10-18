const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bid.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// ===== CUSTOMER ROUTES =====
/**
 * @route   GET /api/v1/bids/stats/summary
 * @desc    Get bid statistics for customer
 * @access  Private (Customer)
 */
router.get('/stats/summary', authorize('customer'), bidController.getBidStatistics);

/**
 * @route   GET /api/v1/bids
 * @desc    Get all bids for customer's requests
 * @access  Private (Customer)
 */
router.get('/', authorize('customer'), bidController.getCustomerBids);

/**
 * @route   GET /api/v1/bids/:id
 * @desc    Get bid by ID
 * @access  Private (Customer)
 */
router.get('/:id', authorize('customer'), bidController.getBidById);

/**
 * @route   POST /api/v1/bids/:id/accept
 * @desc    Accept a bid
 * @access  Private (Customer)
 */
router.post('/:id/accept', authorize('customer'), bidController.acceptBid);

/**
 * @route   POST /api/v1/bids/:id/reject
 * @desc    Reject a bid
 * @access  Private (Customer)
 */
router.post('/:id/reject', authorize('customer'), bidController.rejectBid);


module.exports = router;
