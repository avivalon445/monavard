const express = require('express');
const router = express.Router();
const categorizationController = require('../controllers/categorization.controller');
const { protect, authorize } = require('../middleware/auth');

/**
 * Categorization Routes
 * All routes require admin authentication
 */

// Apply authentication to all routes
router.use(protect);

/**
 * @route   POST /api/v1/categorization/process
 * @desc    Process categorization queue (batch)
 * @access  Admin only
 */
router.post('/process', authorize('admin'), categorizationController.processQueue);

/**
 * @route   GET /api/v1/categorization/stats
 * @desc    Get queue and AI usage statistics
 * @access  Admin only
 */
router.get('/stats', authorize('admin'), categorizationController.getQueueStats);

/**
 * @route   GET /api/v1/categorization/queue
 * @desc    Get queue items (with optional status filter)
 * @access  Admin only
 */
router.get('/queue', authorize('admin'), categorizationController.getQueueItems);

/**
 * @route   POST /api/v1/categorization/queue/:requestId
 * @desc    Add request to categorization queue
 * @access  Admin only
 */
router.post('/queue/:requestId', authorize('admin'), categorizationController.addToQueue);

/**
 * @route   POST /api/v1/categorization/retry-failed
 * @desc    Retry all failed categorization items
 * @access  Admin only
 */
router.post('/retry-failed', authorize('admin'), categorizationController.retryFailedItems);

/**
 * @route   DELETE /api/v1/categorization/queue/:queueId
 * @desc    Cancel a queue item
 * @access  Admin only
 */
router.delete('/queue/:queueId', authorize('admin'), categorizationController.cancelQueueItem);

/**
 * @route   POST /api/v1/categorization/process/:requestId
 * @desc    Process single request immediately
 * @access  Admin only
 */
router.post('/process/:requestId', authorize('admin'), categorizationController.processSingleRequest);

/**
 * @route   GET /api/v1/categorization/history/:requestId
 * @desc    Get categorization history for a request
 * @access  Admin only
 */
router.get('/history/:requestId', authorize('admin'), categorizationController.getCategorizationHistory);

/**
 * @route   GET /api/v1/categorization/categories
 * @desc    Get all available categories
 * @access  Public (authenticated)
 */
router.get('/categories', categorizationController.getCategories);

module.exports = router;

