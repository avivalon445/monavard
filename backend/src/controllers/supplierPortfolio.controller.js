const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const supplierPortfolioService = require('../services/supplierPortfolio.service');
const logger = require('../utils/logger');

/**
 * Supplier Portfolio Controller
 * Handles HTTP requests for supplier portfolio management
 */

/**
 * Get supplier portfolio
 */
const getSupplierPortfolio = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const filters = {
    category_id: req.query.category_id ? parseInt(req.query.category_id) : null,
    is_featured: req.query.is_featured ? req.query.is_featured === 'true' : undefined,
    limit: parseInt(req.query.limit) || 20,
    offset: parseInt(req.query.offset) || 0
  };
  
  logger.info(`Fetching portfolio for supplier ${supplierId} with filters:`, filters);
  const result = await supplierPortfolioService.getSupplierPortfolio(supplierId, filters);
  res.json(new ApiResponse(200, 'Portfolio retrieved successfully', result.portfolio, { pagination: result.pagination }));
});

/**
 * Get single portfolio item
 */
const getPortfolioItem = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const itemId = req.params.id;
  
  logger.info(`Fetching portfolio item ${itemId} for supplier ${supplierId}`);
  const item = await supplierPortfolioService.getPortfolioItem(supplierId, itemId);
  res.json(new ApiResponse(200, 'Portfolio item retrieved successfully', item));
});

/**
 * Create portfolio item
 */
const createPortfolioItem = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const portfolioData = req.body;
  
  logger.info(`Creating portfolio item for supplier ${supplierId}`);
  const result = await supplierPortfolioService.createPortfolioItem(supplierId, portfolioData);
  res.json(new ApiResponse(201, result.message, { id: result.id }));
});

/**
 * Update portfolio item
 */
const updatePortfolioItem = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const itemId = req.params.id;
  const updateData = req.body;
  
  logger.info(`Updating portfolio item ${itemId} for supplier ${supplierId}`);
  const result = await supplierPortfolioService.updatePortfolioItem(supplierId, itemId, updateData);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Delete portfolio item
 */
const deletePortfolioItem = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const itemId = req.params.id;
  
  logger.info(`Deleting portfolio item ${itemId} for supplier ${supplierId}`);
  const result = await supplierPortfolioService.deletePortfolioItem(supplierId, itemId);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Update portfolio order
 */
const updatePortfolioOrder = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const orderData = req.body;
  
  logger.info(`Updating portfolio order for supplier ${supplierId}`);
  const result = await supplierPortfolioService.updatePortfolioOrder(supplierId, orderData);
  res.json(new ApiResponse(200, result.message, result));
});

/**
 * Toggle featured status
 */
const toggleFeaturedStatus = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const itemId = req.params.id;
  
  logger.info(`Toggling featured status for portfolio item ${itemId} for supplier ${supplierId}`);
  const result = await supplierPortfolioService.toggleFeaturedStatus(supplierId, itemId);
  res.json(new ApiResponse(200, result.message, { is_featured: result.is_featured }));
});

/**
 * Get portfolio statistics
 */
const getPortfolioStatistics = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  
  logger.info(`Fetching portfolio statistics for supplier ${supplierId}`);
  const stats = await supplierPortfolioService.getPortfolioStatistics(supplierId);
  res.json(new ApiResponse(200, 'Portfolio statistics retrieved successfully', stats));
});

/**
 * Get portfolio categories
 */
const getPortfolioCategories = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  
  logger.info(`Fetching portfolio categories for supplier ${supplierId}`);
  const categories = await supplierPortfolioService.getPortfolioCategories(supplierId);
  res.json(new ApiResponse(200, 'Portfolio categories retrieved successfully', categories));
});

module.exports = {
  getSupplierPortfolio,
  getPortfolioItem,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  updatePortfolioOrder,
  toggleFeaturedStatus,
  getPortfolioStatistics,
  getPortfolioCategories
};
