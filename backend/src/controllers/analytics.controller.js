const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const analyticsService = require('../services/analytics.service');
const logger = require('../utils/logger');

/**
 * Analytics Controller
 * Handles HTTP requests for analytics endpoints
 */

/**
 * Get supplier analytics
 */
const getSupplierAnalytics = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const filters = {
    dateRange: req.query.date_range || '30d',
    categoryId: req.query.category_id ? parseInt(req.query.category_id) : null
  };

  logger.info(`Fetching analytics for supplier ${supplierId} with filters:`, filters);

  try {
    const analytics = await analyticsService.getSupplierAnalytics(supplierId, filters);
    
    res.json(
      new ApiResponse(200, 'Analytics data retrieved successfully', analytics)
    );
  } catch (error) {
    logger.error('Error in getSupplierAnalytics controller:', error);
    throw error;
  }
});

/**
 * Get analytics overview (lightweight version for quick dashboard widgets)
 */
const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const dateRange = req.query.date_range || '30d';

  logger.info(`Fetching analytics overview for supplier ${supplierId} for ${dateRange}`);

  try {
    const analytics = await analyticsService.getSupplierAnalytics(supplierId, { dateRange });
    
    // Return only essential metrics for quick loading
    const overview = {
      overview: analytics.overview,
      performance: analytics.performance,
      date_range: analytics.date_range,
      generated_at: analytics.generated_at
    };
    
    res.json(
      new ApiResponse(200, 'Analytics overview retrieved successfully', overview)
    );
  } catch (error) {
    logger.error('Error in getAnalyticsOverview controller:', error);
    throw error;
  }
});

/**
 * Get financial analytics
 */
const getFinancialAnalytics = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const dateRange = req.query.date_range || '30d';

  logger.info(`Fetching financial analytics for supplier ${supplierId} for ${dateRange}`);

  try {
    const analytics = await analyticsService.getSupplierAnalytics(supplierId, { dateRange });
    
    const financial = {
      financial: analytics.financial,
      time_series: analytics.time_series,
      date_range: analytics.date_range,
      generated_at: analytics.generated_at
    };
    
    res.json(
      new ApiResponse(200, 'Financial analytics retrieved successfully', financial)
    );
  } catch (error) {
    logger.error('Error in getFinancialAnalytics controller:', error);
    throw error;
  }
});

/**
 * Get performance analytics
 */
const getPerformanceAnalytics = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const dateRange = req.query.date_range || '30d';

  logger.info(`Fetching performance analytics for supplier ${supplierId} for ${dateRange}`);

  try {
    const analytics = await analyticsService.getSupplierAnalytics(supplierId, { dateRange });
    
    const performance = {
      performance: analytics.performance,
      bids: analytics.bids,
      orders: analytics.orders,
      time_series: analytics.time_series,
      date_range: analytics.date_range,
      generated_at: analytics.generated_at
    };
    
    res.json(
      new ApiResponse(200, 'Performance analytics retrieved successfully', performance)
    );
  } catch (error) {
    logger.error('Error in getPerformanceAnalytics controller:', error);
    throw error;
  }
});

/**
 * Get category analytics
 */
const getCategoryAnalytics = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const dateRange = req.query.date_range || '30d';

  logger.info(`Fetching category analytics for supplier ${supplierId} for ${dateRange}`);

  try {
    const analytics = await analyticsService.getSupplierAnalytics(supplierId, { dateRange });
    
    const categories = {
      categories: analytics.categories,
      top_categories: analytics.top_categories,
      date_range: analytics.date_range,
      generated_at: analytics.generated_at
    };
    
    res.json(
      new ApiResponse(200, 'Category analytics retrieved successfully', categories)
    );
  } catch (error) {
    logger.error('Error in getCategoryAnalytics controller:', error);
    throw error;
  }
});

/**
 * Get competitive analysis
 */
const getCompetitiveAnalysis = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const dateRange = req.query.date_range || '30d';

  logger.info(`Fetching competitive analysis for supplier ${supplierId} for ${dateRange}`);

  try {
    const analytics = await analyticsService.getSupplierAnalytics(supplierId, { dateRange });
    
    const competitive = {
      competitive: analytics.competitive,
      recent_activity: analytics.recent_activity,
      date_range: analytics.date_range,
      generated_at: analytics.generated_at
    };
    
    res.json(
      new ApiResponse(200, 'Competitive analysis retrieved successfully', competitive)
    );
  } catch (error) {
    logger.error('Error in getCompetitiveAnalysis controller:', error);
    throw error;
  }
});

module.exports = {
  getSupplierAnalytics,
  getAnalyticsOverview,
  getFinancialAnalytics,
  getPerformanceAnalytics,
  getCategoryAnalytics,
  getCompetitiveAnalysis
};
