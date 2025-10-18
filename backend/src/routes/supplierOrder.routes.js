const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const orderController = require('../controllers/order.controller');
const { validateJoi } = require('../middleware/validator');
const Joi = require('joi');

// All routes require authentication
router.use(protect);
router.use(authorize('supplier'));

// Validation schemas
const updateStatusSchema = Joi.object({
  status: Joi.string().valid('in_progress', 'production', 'quality_check', 'shipped', 'delivered', 'cancelled').required(),
  notes: Joi.string().max(500).allow('', null)
});

const addUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  image_url: Joi.string().uri().allow('', null)
});

const orderIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

/**
 * @route   GET /api/v1/supplier/orders/stats/summary
 * @desc    Get order statistics for supplier
 * @access  Private (Supplier)
 */
router.get('/stats/summary', orderController.getSupplierOrderStatistics);

/**
 * @route   GET /api/v1/supplier/orders
 * @desc    Get all orders for supplier
 * @access  Private (Supplier)
 */
router.get('/', orderController.getSupplierOrders);

/**
 * @route   GET /api/v1/supplier/orders/:id
 * @desc    Get supplier order by ID
 * @access  Private (Supplier)
 */
router.get('/:id', validateJoi(orderIdSchema, 'params'), orderController.getSupplierOrderById);

/**
 * @route   PUT /api/v1/supplier/orders/:id/status
 * @desc    Update order status
 * @access  Private (Supplier)
 */
router.put('/:id/status', validateJoi(orderIdSchema, 'params'), validateJoi(updateStatusSchema, 'body'), orderController.updateSupplierOrderStatus);

/**
 * @route   POST /api/v1/supplier/orders/:id/updates
 * @desc    Add order update
 * @access  Private (Supplier)
 */
router.post('/:id/updates', validateJoi(orderIdSchema, 'params'), validateJoi(addUpdateSchema, 'body'), orderController.addSupplierOrderUpdate);

module.exports = router;
