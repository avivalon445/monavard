const categorizationQueueService = require('../services/categorizationQueue.service');
const aiService = require('../services/ai.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * Categorization Controller
 * Handles AI categorization queue management
 */

/**
 * Process the categorization queue
 * POST /api/v1/categorization/process
 */
const processQueue = asyncHandler(async (req, res) => {
  const { batchSize = 10 } = req.body;
  
  if (batchSize < 1 || batchSize > 50) {
    throw new ApiError(400, 'Batch size must be between 1 and 50');
  }
  
  const result = await categorizationQueueService.processQueue(batchSize);
  
  res.json(
    new ApiResponse(
      200,
      `Processed ${result.processedCount} items from categorization queue`,
      result
    )
  );
});

/**
 * Get queue statistics
 * GET /api/v1/categorization/stats
 */
const getQueueStats = asyncHandler(async (req, res) => {
  const queueStats = await categorizationQueueService.getQueueStats();
  const usageStats = await aiService.getUsageStatistics(30);
  
  res.json(
    new ApiResponse(200, 'Queue statistics retrieved successfully', {
      queue: queueStats,
      ai_usage: usageStats
    })
  );
});

/**
 * Get queue items
 * GET /api/v1/categorization/queue
 */
const getQueueItems = asyncHandler(async (req, res) => {
  const { status, limit = 50 } = req.query;
  
  const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
  
  if (status && !validStatuses.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${validStatuses.join(', ')}`);
  }
  
  const items = await categorizationQueueService.getQueueItems(status, parseInt(limit));
  
  res.json(
    new ApiResponse(200, 'Queue items retrieved successfully', items)
  );
});

/**
 * Add request to queue manually
 * POST /api/v1/categorization/queue/:requestId
 */
const addToQueue = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { priority = 'normal' } = req.body;
  
  const validPriorities = ['low', 'normal', 'high', 'urgent'];
  
  if (!validPriorities.includes(priority)) {
    throw new ApiError(400, `Priority must be one of: ${validPriorities.join(', ')}`);
  }
  
  const queueItem = await categorizationQueueService.addToQueue(parseInt(requestId), priority);
  
  res.json(
    new ApiResponse(200, 'Request added to categorization queue', queueItem)
  );
});

/**
 * Retry failed items
 * POST /api/v1/categorization/retry-failed
 */
const retryFailedItems = asyncHandler(async (req, res) => {
  const result = await categorizationQueueService.retryFailedItems();
  
  res.json(
    new ApiResponse(200, `Reset ${result.count} failed items for retry`, result)
  );
});

/**
 * Cancel queue item
 * DELETE /api/v1/categorization/queue/:queueId
 */
const cancelQueueItem = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  
  await categorizationQueueService.cancelQueueItem(parseInt(queueId));
  
  res.json(
    new ApiResponse(200, 'Queue item cancelled successfully')
  );
});

/**
 * Process single request immediately (admin/debug)
 * POST /api/v1/categorization/process/:requestId
 */
const processSingleRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  
  // Get or create queue item
  const queueItem = await categorizationQueueService.addToQueue(parseInt(requestId), 'urgent');
  
  // Process immediately
  const result = await categorizationQueueService.processQueueItem(queueItem);
  
  res.json(
    new ApiResponse(
      result.success ? 200 : 500,
      result.success ? 'Request categorized successfully' : 'Categorization failed',
      result
    )
  );
});

/**
 * Get categorization history for a request
 * GET /api/v1/categorization/history/:requestId
 */
const getCategorizationHistory = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const db = require('../config/database');
  
  const history = await db.query(
    `SELECT 
      id, attempt_number, ai_provider, suggested_category,
      confidence_score, reasoning, processing_time_ms,
      success, error_message, tokens_used, model_used,
      created_at
     FROM ai_categorization_log
     WHERE request_id = ?
     ORDER BY attempt_number DESC`,
    [requestId]
  );
  
  res.json(
    new ApiResponse(200, 'Categorization history retrieved successfully', history)
  );
});

/**
 * Get available categories
 * GET /api/v1/categorization/categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await aiService.getActiveCategories();
  
  res.json(
    new ApiResponse(200, 'Categories retrieved successfully', categories)
  );
});

module.exports = {
  processQueue,
  getQueueStats,
  getQueueItems,
  addToQueue,
  retryFailedItems,
  cancelQueueItem,
  processSingleRequest,
  getCategorizationHistory,
  getCategories
};

