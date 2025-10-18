const supplierBidService = require('../services/supplierBid.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all bids submitted by supplier
 * GET /api/v1/supplier/bids
 */
const getSupplierBids = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const filters = {
    status: req.query.status,
    request_id: req.query.request_id,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: req.query.sort || 'created_at',
    order: req.query.order || 'DESC'
  };
  
  const result = await supplierBidService.getSupplierBids(supplierId, filters);
  
  res.json(
    new ApiResponse(200, 'Supplier bids retrieved successfully', result.bids, { pagination: result.pagination })
  );
});

/**
 * Get supplier bid by ID
 * GET /api/v1/supplier/bids/:id
 */
const getSupplierBidById = asyncHandler(async (req, res) => {
  const bidId = parseInt(req.params.id);
  const supplierId = req.user.id;
  
  const bid = await supplierBidService.getSupplierBidById(bidId, supplierId);
  
  res.json(
    new ApiResponse(200, 'Supplier bid retrieved successfully', bid)
  );
});

/**
 * Update supplier bid
 * PUT /api/v1/supplier/bids/:id
 */
const updateSupplierBid = asyncHandler(async (req, res) => {
  const bidId = parseInt(req.params.id);
  const supplierId = req.user.id;
  const updateData = req.body;
  
  const result = await supplierBidService.updateSupplierBid(bidId, supplierId, updateData);
  
  res.json(
    new ApiResponse(200, result.message, result)
  );
});

/**
 * Cancel supplier bid
 * POST /api/v1/supplier/bids/:id/cancel
 */
const cancelSupplierBid = asyncHandler(async (req, res) => {
  const bidId = parseInt(req.params.id);
  const supplierId = req.user.id;
  const { cancellation_reason } = req.body;
  
  const result = await supplierBidService.cancelSupplierBid(bidId, supplierId, cancellation_reason);
  
  res.json(
    new ApiResponse(200, result.message, result)
  );
});

/**
 * Create a new bid
 * POST /api/v1/supplier/bids
 */
const createSupplierBid = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const bidData = req.body;
  
  const result = await supplierBidService.createSupplierBid(supplierId, bidData);
  
  res.status(201).json(
    new ApiResponse(201, result.message, result)
  );
});

/**
 * Get supplier bid statistics
 * GET /api/v1/supplier/bids/stats/summary
 */
const getSupplierBidStatistics = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  
  const stats = await supplierBidService.getSupplierBidStatistics(supplierId);
  
  res.json(
    new ApiResponse(200, 'Supplier bid statistics retrieved successfully', stats)
  );
});

module.exports = {
  getSupplierBids,
  getSupplierBidById,
  updateSupplierBid,
  cancelSupplierBid,
  createSupplierBid,
  getSupplierBidStatistics
};
