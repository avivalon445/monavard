const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const orderController = require('../controllers/order.controller');

// All routes require authentication
router.use(protect);

// GET /api/v1/orders/stats/summary - Get order statistics
router.get('/stats/summary', authorize('customer'), orderController.getOrderStatistics);

// GET /api/v1/orders - Get all customer orders
router.get('/', authorize('customer'), orderController.getCustomerOrders);

// GET /api/v1/orders/:id - Get order by ID
router.get('/:id', authorize('customer'), orderController.getOrderById);

// POST /api/v1/orders/:id/cancel - Cancel order
router.post('/:id/cancel', authorize('customer'), orderController.cancelOrder);

// POST /api/v1/orders/:id/confirm-delivery - Confirm delivery
router.post('/:id/confirm-delivery', authorize('customer'), orderController.confirmDelivery);

// POST /api/v1/orders/:id/complete - Complete order
router.post('/:id/complete', authorize('customer'), orderController.completeOrder);

module.exports = router;

