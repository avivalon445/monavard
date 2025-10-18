const bidService = require('../services/bid.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all bids for customer's requests
 * GET /api/v1/bids
 */
const getCustomerBids = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const filters = {
    status: req.query.status,
    request_id: req.query.request_id,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: req.query.sort || 'created_at',
    order: req.query.order || 'DESC'
  };
  
  const result = await bidService.getCustomerBids(customerId, filters);
  
  res.json(
    new ApiResponse(200, 'Bids retrieved successfully', result.bids, { pagination: result.pagination })
  );
});

/**
 * Get bid by ID
 * GET /api/v1/bids/:id
 */
const getBidById = asyncHandler(async (req, res) => {
  const bidId = parseInt(req.params.id);
  const customerId = req.user.id;
  
  const bid = await bidService.getBidById(bidId, customerId);
  
  res.json(
    new ApiResponse(200, 'Bid retrieved successfully', bid)
  );
});

/**
 * Accept a bid
 * POST /api/v1/bids/:id/accept
 */
const acceptBid = asyncHandler(async (req, res) => {
  const bidId = parseInt(req.params.id);
  const customerId = req.user.id;
  
  const result = await bidService.acceptBid(bidId, customerId);
  
  res.status(201).json(
    new ApiResponse(201, result.message, result)
  );
});

/**
 * Reject a bid
 * POST /api/v1/bids/:id/reject
 */
const rejectBid = asyncHandler(async (req, res) => {
  const bidId = parseInt(req.params.id);
  const customerId = req.user.id;
  const { rejection_reason } = req.body;
  
  const result = await bidService.rejectBid(bidId, customerId, rejection_reason);
  
  res.json(
    new ApiResponse(200, result.message, result)
  );
});

/**
 * Get bid statistics
 * GET /api/v1/bids/stats/summary
 */
const getBidStatistics = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  
  const stats = await bidService.getBidStatistics(customerId);
  
  res.json(
    new ApiResponse(200, 'Bid statistics retrieved successfully', stats)
  );
});


module.exports = {
  getCustomerBids,
  getBidById,
  acceptBid,
  rejectBid,
  getBidStatistics
};

