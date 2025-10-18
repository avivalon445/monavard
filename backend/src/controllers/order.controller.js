const orderService = require('../services/order.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get customer orders
 * GET /api/v1/orders
 */
const getCustomerOrders = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const filters = {
    status: req.query.status,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: req.query.sort || 'created_at',
    order: req.query.order || 'DESC'
  };
  
  const result = await orderService.getCustomerOrders(customerId, filters);
  
  res.json(
    new ApiResponse(200, 'Orders retrieved successfully', result.orders, { pagination: result.pagination })
  );
});

/**
 * Get order by ID
 * GET /api/v1/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  const orderId = parseInt(req.params.id);
  const customerId = req.user.id;
  
  const order = await orderService.getOrderById(orderId, customerId);
  
  res.json(
    new ApiResponse(200, 'Order retrieved successfully', order)
  );
});

/**
 * Get order statistics
 * GET /api/v1/orders/stats/summary
 */
const getOrderStatistics = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  
  const stats = await orderService.getOrderStatistics(customerId);
  
  res.json(
    new ApiResponse(200, 'Order statistics retrieved successfully', stats)
  );
});

/**
 * Cancel order
 * POST /api/v1/orders/:id/cancel
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const orderId = parseInt(req.params.id);
  const customerId = req.user.id;
  const { reason } = req.body;
  
  const result = await orderService.cancelOrder(orderId, customerId, reason);
  
  res.json(
    new ApiResponse(200, result.message)
  );
});

/**
 * Confirm delivery
 * POST /api/v1/orders/:id/confirm-delivery
 */
const confirmDelivery = asyncHandler(async (req, res) => {
  const orderId = parseInt(req.params.id);
  const customerId = req.user.id;
  
  const result = await orderService.confirmDelivery(orderId, customerId);
  
  res.json(
    new ApiResponse(200, result.message)
  );
});

/**
 * Complete order
 * POST /api/v1/orders/:id/complete
 */
const completeOrder = asyncHandler(async (req, res) => {
  const orderId = parseInt(req.params.id);
  const customerId = req.user.id;
  
  const result = await orderService.completeOrder(orderId, customerId);
  
  res.json(
    new ApiResponse(200, result.message)
  );
});

/**
 * Get supplier orders
 * GET /api/v1/supplier/orders
 */
const getSupplierOrders = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const filters = {
    status: req.query.status,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: req.query.sort || 'created_at',
    order: req.query.order || 'DESC'
  };
  
  const result = await orderService.getSupplierOrders(supplierId, filters);
  
  res.json(
    new ApiResponse(200, 'Orders retrieved successfully', result.orders, { pagination: result.pagination })
  );
});

/**
 * Get supplier order by ID
 * GET /api/v1/supplier/orders/:id
 */
const getSupplierOrderById = asyncHandler(async (req, res) => {
  const orderId = parseInt(req.params.id);
  const supplierId = req.user.id;
  
  const order = await orderService.getSupplierOrderById(orderId, supplierId);
  
  res.json(
    new ApiResponse(200, 'Order retrieved successfully', order)
  );
});

/**
 * Get supplier order statistics
 * GET /api/v1/supplier/orders/stats/summary
 */
const getSupplierOrderStatistics = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  
  const stats = await orderService.getSupplierOrderStatistics(supplierId);
  
  res.json(
    new ApiResponse(200, 'Order statistics retrieved successfully', stats)
  );
});

/**
 * Update order status
 * PUT /api/v1/supplier/orders/:id/status
 */
const updateSupplierOrderStatus = asyncHandler(async (req, res) => {
  const orderId = parseInt(req.params.id);
  const supplierId = req.user.id;
  const { status, notes } = req.body;
  
  const result = await orderService.updateOrderStatus(orderId, supplierId, status, notes);
  
  res.json(
    new ApiResponse(200, result.message)
  );
});

/**
 * Add order update
 * POST /api/v1/supplier/orders/:id/updates
 */
const addSupplierOrderUpdate = asyncHandler(async (req, res) => {
  const orderId = parseInt(req.params.id);
  const supplierId = req.user.id;
  const { title, description, image_url } = req.body;
  
  const result = await orderService.addOrderUpdate(orderId, supplierId, title, description, image_url);
  
  res.json(
    new ApiResponse(200, result.message)
  );
});

module.exports = {
  getCustomerOrders,
  getOrderById,
  getOrderStatistics,
  cancelOrder,
  confirmDelivery,
  completeOrder,
  getSupplierOrders,
  getSupplierOrderById,
  getSupplierOrderStatistics,
  updateSupplierOrderStatus,
  addSupplierOrderUpdate,
};

