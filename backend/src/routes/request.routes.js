const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const { protect, authorize } = require('../middleware/auth');
const { validateJoi } = require('../middleware/validator');
const {
  createRequestSchema,
  updateRequestSchema,
  requestIdSchema,
  querySchema
} = require('../validators/request.validator');

/**
 * All routes require authentication and customer role
 */
router.use(protect);
router.use(authorize('customer'));

/**
 * @route   GET /api/requests/stats/summary
 * @desc    Get request statistics for logged-in customer
 * @access  Private (Customer only)
 */
router.get(
  '/stats/summary',
  requestController.getRequestStatistics
);

/**
 * @route   GET /api/requests
 * @desc    Get all requests for logged-in customer
 * @access  Private (Customer only)
 */
router.get(
  '/',
  validateJoi(querySchema, 'query'),
  requestController.getMyRequests
);

/**
 * @route   POST /api/requests
 * @desc    Create new request
 * @access  Private (Customer only)
 */
router.post(
  '/',
  validateJoi(createRequestSchema),
  requestController.createRequest
);

/**
 * @route   GET /api/requests/:id
 * @desc    Get request by ID
 * @access  Private (Customer only)
 */
router.get(
  '/:id',
  validateJoi(requestIdSchema, 'params'),
  requestController.getRequestById
);

/**
 * @route   PUT /api/requests/:id
 * @desc    Update request
 * @access  Private (Customer only)
 */
router.put(
  '/:id',
  validateJoi(requestIdSchema, 'params'),
  validateJoi(updateRequestSchema),
  requestController.updateRequest
);

/**
 * @route   DELETE /api/requests/:id
 * @desc    Cancel request
 * @access  Private (Customer only)
 */
router.delete(
  '/:id',
  validateJoi(requestIdSchema, 'params'),
  requestController.cancelRequest
);

/**
 * @route   GET /api/requests/:id/bids
 * @desc    Get all bids for a request
 * @access  Private (Customer only)
 */
router.get(
  '/:id/bids',
  validateJoi(requestIdSchema, 'params'),
  requestController.getRequestBids
);

module.exports = router;
