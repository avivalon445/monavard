const db = require('../config/database');
const logger = require('../utils/logger');
const aiService = require('./ai.service');
const ApiError = require('../utils/ApiError');

/**
 * Categorization Queue Service
 * Manages the queue of requests waiting for AI categorization
 */

/**
 * Add request to categorization queue
 */
const addToQueue = async (requestId, priority = 'normal') => {
  try {
    // Check if request already in queue
    const [existing] = await db.query(
      'SELECT id, status FROM ai_categorization_queue WHERE request_id = ?',
      [requestId]
    );
    
    if (existing) {
      // If already completed or processing, don't add again
      if (['completed', 'processing'].includes(existing.status)) {
        logger.info(`Request ${requestId} already in queue with status: ${existing.status}`);
        return existing;
      }
      
      // If failed or cancelled, reset it
      await db.query(
        `UPDATE ai_categorization_queue 
         SET status = 'pending', 
             retry_count = 0,
             error_message = NULL,
             scheduled_at = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [existing.id]
      );
      
      return existing;
    }
    
    // Add new queue item
    const result = await db.query(
      `INSERT INTO ai_categorization_queue 
       (request_id, priority, status, scheduled_at) 
       VALUES (?, ?, 'pending', NOW())`,
      [requestId, priority]
    );
    
    logger.info(`Request ${requestId} added to categorization queue with priority: ${priority}`);
    
    return {
      id: result.insertId,
      request_id: requestId,
      priority,
      status: 'pending'
    };
  } catch (error) {
    logger.error('Error adding to categorization queue:', error);
    throw error;
  }
};

/**
 * Get next pending item from queue
 */
const getNextPendingItem = async () => {
  try {
    // Get the highest priority pending item that's scheduled to run
    const [item] = await db.query(
      `SELECT q.*, r.title, r.description
       FROM ai_categorization_queue q
       INNER JOIN requests r ON q.request_id = r.id
       WHERE q.status = 'pending' 
         AND q.scheduled_at <= NOW()
         AND q.retry_count < q.max_retries
       ORDER BY 
         FIELD(q.priority, 'urgent', 'high', 'normal', 'low'),
         q.scheduled_at ASC
       LIMIT 1`,
      []
    );
    
    return item || null;
  } catch (error) {
    logger.error('Error getting next pending item:', error);
    throw error;
  }
};

/**
 * Mark queue item as processing
 */
const markAsProcessing = async (queueId) => {
  try {
    await db.query(
      `UPDATE ai_categorization_queue 
       SET status = 'processing', 
           started_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [queueId]
    );
  } catch (error) {
    logger.error('Error marking as processing:', error);
    throw error;
  }
};

/**
 * Mark queue item as completed
 */
const markAsCompleted = async (queueId) => {
  try {
    await db.query(
      `UPDATE ai_categorization_queue 
       SET status = 'completed', 
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [queueId]
    );
  } catch (error) {
    logger.error('Error marking as completed:', error);
    throw error;
  }
};

/**
 * Mark queue item as failed
 */
const markAsFailed = async (queueId, errorMessage, shouldRetry = true) => {
  try {
    const [item] = await db.query(
      'SELECT retry_count, max_retries FROM ai_categorization_queue WHERE id = ?',
      [queueId]
    );
    
    if (!item) {
      throw new ApiError(404, 'Queue item not found');
    }
    
    const newRetryCount = item.retry_count + 1;
    const hasRetriesLeft = newRetryCount < item.max_retries;
    
    if (shouldRetry && hasRetriesLeft) {
      // Schedule retry with exponential backoff
      const retryDelayMinutes = Math.pow(2, newRetryCount) * 5; // 5, 10, 20 minutes
      
      await db.query(
        `UPDATE ai_categorization_queue 
         SET status = 'pending',
             retry_count = ?,
             error_message = ?,
             scheduled_at = DATE_ADD(NOW(), INTERVAL ? MINUTE),
             updated_at = NOW()
         WHERE id = ?`,
        [newRetryCount, errorMessage, retryDelayMinutes, queueId]
      );
      
      logger.info(`Queue item ${queueId} scheduled for retry ${newRetryCount} in ${retryDelayMinutes} minutes`);
    } else {
      // Mark as permanently failed
      await db.query(
        `UPDATE ai_categorization_queue 
         SET status = 'failed',
             retry_count = ?,
             error_message = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [newRetryCount, errorMessage, queueId]
      );
      
      logger.error(`Queue item ${queueId} permanently failed after ${newRetryCount} attempts`);
    }
  } catch (error) {
    logger.error('Error marking as failed:', error);
    throw error;
  }
};

/**
 * Process a single queue item
 */
const processQueueItem = async (item) => {
  try {
    logger.info(`Processing categorization for request ${item.request_id} (queue: ${item.id})`);
    
    // Mark as processing
    await markAsProcessing(item.id);
    
    // Attempt categorization
    const result = await aiService.categorizeRequest(item.request_id);
    
    // Log the attempt
    await aiService.logCategorizationAttempt(
      item.request_id,
      item.retry_count + 1,
      result
    );
    
    if (result.success) {
      // Update request with category
      await aiService.updateRequestCategory(
        item.request_id,
        result.categoryId,
        result.confidence,
        result.reasoning
      );
      
      // Mark queue item as completed
      await markAsCompleted(item.id);
      
      logger.info(`Successfully categorized request ${item.request_id} as "${result.categoryName}" (confidence: ${result.confidence})`);
      
      return {
        success: true,
        requestId: item.request_id,
        category: result.categoryName,
        confidence: result.confidence
      };
    } else {
      // Handle failure
      if (result.error === 'Rate limit exceeded') {
        // Log rate limit and schedule retry
        await aiService.logRateLimit(item.request_id, result.errorMessage, result.retryAfter);
        await markAsFailed(item.id, result.errorMessage, true);
      } else {
        // Other errors - retry or fail permanently
        await markAsFailed(item.id, result.errorMessage, true);
      }
      
      return {
        success: false,
        requestId: item.request_id,
        error: result.error
      };
    }
  } catch (error) {
    logger.error(`Error processing queue item ${item.id}:`, error);
    
    // Mark as failed with retry
    await markAsFailed(item.id, error.message, true);
    
    return {
      success: false,
      requestId: item.request_id,
      error: error.message
    };
  }
};

/**
 * Process queue (process multiple items)
 */
const processQueue = async (batchSize = 10) => {
  try {
    logger.info(`Starting queue processing (batch size: ${batchSize})`);
    
    const results = [];
    let processedCount = 0;
    
    // Process items one by one (to respect rate limits)
    for (let i = 0; i < batchSize; i++) {
      const item = await getNextPendingItem();
      
      if (!item) {
        logger.info('No more pending items in queue');
        break;
      }
      
      const result = await processQueueItem(item);
      results.push(result);
      processedCount++;
      
      // Small delay between requests to avoid rate limits
      if (i < batchSize - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }
    
    logger.info(`Queue processing completed: ${processedCount} items processed`);
    
    return {
      processedCount,
      results
    };
  } catch (error) {
    logger.error('Error processing queue:', error);
    throw error;
  }
};

/**
 * Get queue statistics
 */
const getQueueStats = async () => {
  try {
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_items,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_items,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_items,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_items,
        AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as avg_processing_time_seconds
       FROM ai_categorization_queue`,
      []
    );
    
    return stats || {
      total_items: 0,
      pending_items: 0,
      processing_items: 0,
      completed_items: 0,
      failed_items: 0,
      avg_processing_time_seconds: 0
    };
  } catch (error) {
    logger.error('Error fetching queue stats:', error);
    throw error;
  }
};

/**
 * Get queue items with details
 */
const getQueueItems = async (status = null, limit = 50) => {
  try {
    let query = `
      SELECT 
        q.*,
        r.title as request_title,
        r.description as request_description,
        c.name as current_category
      FROM ai_categorization_queue q
      INNER JOIN requests r ON q.request_id = r.id
      LEFT JOIN categories c ON r.category_id = c.id
    `;
    
    const params = [];
    
    if (status) {
      query += ' WHERE q.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY q.updated_at DESC LIMIT ?';
    params.push(limit);
    
    const items = await db.query(query, params);
    return items;
  } catch (error) {
    logger.error('Error fetching queue items:', error);
    throw error;
  }
};

/**
 * Retry failed items
 */
const retryFailedItems = async () => {
  try {
    const result = await db.query(
      `UPDATE ai_categorization_queue 
       SET status = 'pending',
           retry_count = 0,
           error_message = NULL,
           scheduled_at = NOW(),
           updated_at = NOW()
       WHERE status = 'failed'`,
      []
    );
    
    logger.info(`Reset ${result.affectedRows} failed items for retry`);
    
    return {
      count: result.affectedRows
    };
  } catch (error) {
    logger.error('Error retrying failed items:', error);
    throw error;
  }
};

/**
 * Cancel queue item
 */
const cancelQueueItem = async (queueId) => {
  try {
    await db.query(
      `UPDATE ai_categorization_queue 
       SET status = 'cancelled',
           updated_at = NOW()
       WHERE id = ? AND status IN ('pending', 'failed')`,
      [queueId]
    );
    
    logger.info(`Queue item ${queueId} cancelled`);
  } catch (error) {
    logger.error('Error cancelling queue item:', error);
    throw error;
  }
};

module.exports = {
  addToQueue,
  getNextPendingItem,
  processQueue,
  processQueueItem,
  getQueueStats,
  getQueueItems,
  retryFailedItems,
  cancelQueueItem,
  markAsProcessing,
  markAsCompleted,
  markAsFailed
};

