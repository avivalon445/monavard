const requestService = require('../services/request.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Create new request
 * @route   POST /api/requests
 * @access  Private (Customer only)
 */
const createRequest = asyncHandler(async (req, res) => {
  const request = await requestService.createRequest(req.user.id, req.body);
  
  res.status(201).json(
    new ApiResponse(201, 'Request created successfully', request)
  );
});

/**
 * @desc    Get all requests for logged-in customer
 * @route   GET /api/requests
 * @access  Private (Customer only)
 */
const getMyRequests = asyncHandler(async (req, res) => {
  const { status, category_id, page, limit, sort, order } = req.query;
  
  const result = await requestService.getCustomerRequests(req.user.id, {
    status,
    category_id,
    page,
    limit,
    sort,
    order
  });
  
  res.json(
    new ApiResponse(200, 'Requests retrieved successfully', result)
  );
});

/**
 * @desc    Get request by ID
 * @route   GET /api/requests/:id
 * @access  Private (Customer only)
 */
const getRequestById = asyncHandler(async (req, res) => {
  const request = await requestService.getRequestById(
    req.params.id,
    req.user.id
  );
  
  res.json(
    new ApiResponse(200, 'Request retrieved successfully', request)
  );
});

/**
 * @desc    Update request
 * @route   PUT /api/requests/:id
 * @access  Private (Customer only)
 */
const updateRequest = asyncHandler(async (req, res) => {
  const request = await requestService.updateRequest(
    req.params.id,
    req.user.id,
    req.body
  );
  
  res.json(
    new ApiResponse(200, 'Request updated successfully', request)
  );
});

/**
 * @desc    Cancel request
 * @route   DELETE /api/requests/:id
 * @access  Private (Customer only)
 */
const cancelRequest = asyncHandler(async (req, res) => {
  const result = await requestService.cancelRequest(
    req.params.id,
    req.user.id
  );
  
  res.json(
    new ApiResponse(200, 'Request cancelled successfully', result)
  );
});

/**
 * @desc    Get request statistics
 * @route   GET /api/requests/stats/summary
 * @access  Private (Customer only)
 */
const getRequestStatistics = asyncHandler(async (req, res) => {
  const stats = await requestService.getRequestStatistics(req.user.id);
  
  res.json(
    new ApiResponse(200, 'Statistics retrieved successfully', stats)
  );
});

/**
 * @desc    Get bids for a request
 * @route   GET /api/requests/:id/bids
 * @access  Private (Customer only)
 */
const getRequestBids = asyncHandler(async (req, res) => {
  const bids = await requestService.getRequestBids(
    req.params.id,
    req.user.id
  );
  
  res.json(
    new ApiResponse(200, 'Bids retrieved successfully', bids)
  );
});

// ===== SUPPLIER REQUEST CONTROLLERS =====

/**
 * Get available requests for suppliers
 * GET /api/v1/supplier/requests
 */
const getAvailableRequests = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const filters = {
    category_id: req.query.category_id,
    budget_min: req.query.budget_min,
    budget_max: req.query.budget_max,
    delivery_date_from: req.query.delivery_date_from,
    delivery_date_to: req.query.delivery_date_to,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: req.query.sort || 'created_at',
    order: req.query.order || 'DESC',
    search: req.query.search
  };
  
  const result = await requestService.getAvailableRequests(supplierId, filters);
  
  res.json(
    new ApiResponse(200, 'Available requests retrieved successfully', result.requests, { pagination: result.pagination })
  );
});

/**
 * Get supplier request by ID
 * GET /api/v1/supplier/requests/:id
 */
const getSupplierRequestById = asyncHandler(async (req, res) => {
  const requestId = parseInt(req.params.id);
  const supplierId = req.user.id;
  
  const request = await requestService.getSupplierRequestById(requestId, supplierId);
  
  res.json(
    new ApiResponse(200, 'Request retrieved successfully', request)
  );
});

/**
 * Get supplier request statistics
 * GET /api/v1/supplier/requests/stats/summary
 */
const getSupplierRequestStatistics = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  
  const stats = await requestService.getSupplierRequestStatistics(supplierId);
  
  res.json(
    new ApiResponse(200, 'Supplier request statistics retrieved successfully', stats)
  );
});

module.exports = {
  createRequest,
  getMyRequests,
  getRequestById,
  updateRequest,
  cancelRequest,
  getRequestStatistics,
  getRequestBids,
  getAvailableRequests,
  getSupplierRequestById,
  getSupplierRequestStatistics
};

