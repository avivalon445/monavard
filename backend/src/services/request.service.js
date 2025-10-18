const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const categorizationQueueService = require('./categorizationQueue.service');

/**
 * Request Service
 * Handles all business logic for product requests
 */

/**
 * Create a new request
 */
const createRequest = async (userId, requestData) => {
  try {
    const {
      title,
      description,
      budget_min,
      budget_max,
      currency = 'EUR',
      delivery_date,
      time_flexibility = 'critical',
      priorities,
      file_notes,
      category_id
    } = requestData;
    
    const request = await db.transaction(async (connection) => {
      // Calculate expiration date (default: 30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const status = category_id ? 'open_for_bids' : 'pending_categorization';
      
      // Insert request
      const [result] = await connection.execute(
        `INSERT INTO requests (
          customer_id, title, description, budget_min, budget_max, 
          currency, delivery_date, time_flexibility, priorities, 
          file_notes, category_id, expires_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          title,
          description,
          budget_min || null,
          budget_max || null,
          currency,
          delivery_date || null,
          time_flexibility,
          priorities || null,
          file_notes || null,
          category_id || null,
          expiresAt,
          status
        ]
      );
      
      const requestId = result.insertId;
      
      // Log status to request_status_history
      await connection.execute(
        `INSERT INTO request_status_history (request_id, old_status, new_status, changed_by, change_type, changed_at)
         VALUES (?, NULL, ?, ?, 'automatic', NOW())`,
        [requestId, status, userId]
      );
      
      // Fetch and return the created request
      const [requests] = await connection.execute(
        `SELECT r.*, c.name as category_name,
                u.first_name as customer_first_name,
                u.last_name as customer_last_name,
                u.email as customer_email,
                (SELECT COUNT(*) FROM bids WHERE request_id = r.id) as bid_count
         FROM requests r
         LEFT JOIN categories c ON r.category_id = c.id
         LEFT JOIN users u ON r.customer_id = u.id
         WHERE r.id = ?`,
        [requestId]
      );
      
      return requests[0];
    });
    
    logger.info(`Request created: ${request.id} by user: ${userId}`);
    
    // Automatically add to categorization queue if no category provided
    if (!category_id) {
      try {
        await categorizationQueueService.addToQueue(request.id, 'normal');
        logger.info(`Request ${request.id} added to AI categorization queue`);
      } catch (queueError) {
        // Log error but don't fail the request creation
        logger.error(`Failed to add request ${request.id} to categorization queue:`, queueError);
      }
    }
    
    return request;
    
  } catch (error) {
    logger.error('Error creating request:', error);
    throw error;
  }
};

/**
 * Get all requests for a customer
 */
const getCustomerRequests = async (userId, filters = {}) => {
  try {
    const { status, category_id, page = 1, limit = 10, sort = 'created_at', order = 'DESC' } = filters;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT r.*, 
             c.name as category_name,
             (SELECT COUNT(*) FROM bids WHERE request_id = r.id) as bid_count,
             (SELECT COUNT(*) FROM bids WHERE request_id = r.id AND status = 'pending') as pending_bids,
             (SELECT MIN(price) FROM bids WHERE request_id = r.id AND status = 'pending') as min_bid_price,
             (SELECT MAX(price) FROM bids WHERE request_id = r.id AND status = 'pending') as max_bid_price
      FROM requests r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.customer_id = ?
    `;
    
    const params = [userId];
    
    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    
    if (category_id) {
      query += ' AND r.category_id = ?';
      params.push(category_id);
    }
    
    // Add sorting
    const validSortFields = ['created_at', 'updated_at', 'title', 'status', 'delivery_date'];
    const validOrders = ['ASC', 'DESC'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
    
    query += ` ORDER BY r.${sortField} ${sortOrder}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const requests = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM requests WHERE customer_id = ?';
    const countParams = [userId];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    if (category_id) {
      countQuery += ' AND category_id = ?';
      countParams.push(category_id);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    
    return {
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
  } catch (error) {
    logger.error('Error fetching customer requests:', error);
    throw error;
  }
};

/**
 * Get request by ID
 */
const getRequestById = async (requestId, userId) => {
  try {
    const requests = await db.query(
      `SELECT r.*, 
              c.name as category_name,
              u.first_name as customer_first_name,
              u.last_name as customer_last_name,
              u.email as customer_email,
              (SELECT COUNT(*) FROM bids WHERE request_id = r.id) as bid_count,
              (SELECT COUNT(*) FROM bids WHERE request_id = r.id AND status = 'pending') as pending_bids,
              (SELECT MIN(price) FROM bids WHERE request_id = r.id AND status = 'pending') as min_bid_price,
              (SELECT MAX(price) FROM bids WHERE request_id = r.id AND status = 'pending') as max_bid_price
       FROM requests r
       LEFT JOIN categories c ON r.category_id = c.id
       LEFT JOIN users u ON r.customer_id = u.id
       WHERE r.id = ? AND r.customer_id = ?`,
      [requestId, userId]
    );
    
    if (requests.length === 0) {
      throw new ApiError(404, 'Request not found');
    }
    
    // Get request files
    const files = await db.query(
      'SELECT id, filename, file_path, file_type, file_size, uploaded_at FROM request_files WHERE request_id = ?',
      [requestId]
    );
    
    // Get request status history
    const actions = await db.query(
      `SELECT rsh.*, u.first_name, u.last_name, u.user_type
       FROM request_status_history rsh
       LEFT JOIN users u ON rsh.changed_by = u.id
       WHERE rsh.request_id = ?
       ORDER BY rsh.changed_at DESC`,
      [requestId]
    );
    
    const request = requests[0];
    request.files = files;
    request.actions = actions;
    
    return request;
    
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching request by ID:', error);
    throw error;
  }
};

/**
 * Update request
 */
const updateRequest = async (requestId, userId, updateData) => {
  try {
    const updatedRequest = await db.transaction(async (connection) => {
      // Check if request exists and belongs to user
      const [existing] = await connection.execute(
        'SELECT * FROM requests WHERE id = ? AND customer_id = ?',
        [requestId, userId]
      );
      
      if (existing.length === 0) {
        throw new ApiError(404, 'Request not found');
      }
      
      // Only allow updates for certain statuses
      const editableStatuses = ['pending_categorization', 'open_for_bids'];
      if (!editableStatuses.includes(existing[0].status)) {
        throw new ApiError(400, 'Request cannot be edited in current status');
      }
      
      const oldStatus = existing[0].status;
      
      const {
        title,
        description,
        budget_min,
        budget_max,
        currency,
        delivery_date,
        time_flexibility,
        priorities,
        file_notes,
        category_id
      } = updateData;
      
      // Build update query dynamically
      const updates = [];
      const values = [];
      
      if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (budget_min !== undefined) {
        updates.push('budget_min = ?');
        values.push(budget_min);
      }
      if (budget_max !== undefined) {
        updates.push('budget_max = ?');
        values.push(budget_max);
      }
      if (currency !== undefined) {
        updates.push('currency = ?');
        values.push(currency);
      }
      if (delivery_date !== undefined) {
        updates.push('delivery_date = ?');
        values.push(delivery_date);
      }
      if (time_flexibility !== undefined) {
        updates.push('time_flexibility = ?');
        values.push(time_flexibility);
      }
      if (priorities !== undefined) {
        updates.push('priorities = ?');
        values.push(priorities);
      }
      if (file_notes !== undefined) {
        updates.push('file_notes = ?');
        values.push(file_notes);
      }
      
      let newStatus = oldStatus;
      if (category_id !== undefined) {
        updates.push('category_id = ?');
        values.push(category_id);
        // If category is set, change status to open_for_bids
        if (category_id && existing[0].status === 'pending_categorization') {
          updates.push('status = ?');
          values.push('open_for_bids');
          newStatus = 'open_for_bids';
        }
      }
      
      if (updates.length === 0) {
        throw new ApiError(400, 'No valid fields to update');
      }
      
      updates.push('updated_at = NOW()');
      values.push(requestId, userId);
      
      await connection.execute(
        `UPDATE requests SET ${updates.join(', ')} WHERE id = ? AND customer_id = ?`,
        values
      );
      
      // Log status change if status changed
      if (newStatus !== oldStatus) {
        await connection.execute(
          `INSERT INTO request_status_history (request_id, old_status, new_status, changed_by, change_type, reason, changed_at)
           VALUES (?, ?, ?, ?, 'manual', 'Request updated with category', NOW())`,
          [requestId, oldStatus, newStatus, userId]
        );
      }
      
      // Fetch and return updated request
      const [updated] = await connection.execute(
        `SELECT r.*, c.name as category_name,
                (SELECT COUNT(*) FROM bids WHERE request_id = r.id) as bid_count
         FROM requests r
         LEFT JOIN categories c ON r.category_id = c.id
         WHERE r.id = ?`,
        [requestId]
      );
      
      return updated[0];
    });
    
    logger.info(`Request updated: ${requestId} by user: ${userId}`);
    return updatedRequest;
    
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating request:', error);
    throw error;
  }
};

/**
 * Delete/Cancel request
 */
const cancelRequest = async (requestId, userId) => {
  try {
    // Use the transaction utility from database module
    const result = await db.transaction(async (connection) => {
      // Check if request exists and belongs to user
      const [existing] = await connection.execute(
        'SELECT * FROM requests WHERE id = ? AND customer_id = ?',
        [requestId, userId]
      );
      
      if (existing.length === 0) {
        throw new ApiError(404, 'Request not found');
      }
      
      // Only allow cancellation for certain statuses
      const cancellableStatuses = ['pending_categorization', 'open_for_bids', 'bids_received'];
      if (!cancellableStatuses.includes(existing[0].status)) {
        throw new ApiError(400, 'Request cannot be cancelled in current status');
      }
      
      const oldStatus = existing[0].status;
      
      // Update request status
      await connection.execute(
        'UPDATE requests SET status = ?, updated_at = NOW() WHERE id = ?',
        ['cancelled', requestId]
      );
      
      // Cancel all pending bids
      await connection.execute(
        'UPDATE bids SET status = ?, updated_at = NOW() WHERE request_id = ? AND status = ?',
        ['cancelled', requestId, 'pending']
      );
      
      // Log status change to request_status_history
      await connection.execute(
        `INSERT INTO request_status_history (request_id, old_status, new_status, changed_by, change_type, reason, changed_at)
         VALUES (?, ?, 'cancelled', ?, 'manual', 'Request cancelled by customer', NOW())`,
        [requestId, oldStatus, userId]
      );
      
      return { message: 'Request cancelled successfully' };
    });
    
    logger.info(`Request cancelled: ${requestId} by user: ${userId}`);
    return result;
    
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error cancelling request:', error);
    throw error;
  }
};

/**
 * Get request statistics for customer
 */
const getRequestStatistics = async (userId) => {
  try {
    const stats = await db.query(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending_categorization' THEN 1 ELSE 0 END) as pending_categorization,
        SUM(CASE WHEN status = 'open_for_bids' THEN 1 ELSE 0 END) as open_for_bids,
        SUM(CASE WHEN status = 'bids_received' THEN 1 ELSE 0 END) as bids_received,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        (SELECT COUNT(*) FROM bids b 
         JOIN requests r ON b.request_id = r.id 
         WHERE r.customer_id = ? AND b.status = 'pending') as total_pending_bids
       FROM requests 
       WHERE customer_id = ?`,
      [userId, userId]
    );
    
    return stats[0];
    
  } catch (error) {
    logger.error('Error fetching request statistics:', error);
    throw error;
  }
};

/**
 * Get bids for a request
 */
const getRequestBids = async (requestId, userId) => {
  try {
    // Verify request belongs to customer
    const requests = await db.query(
      'SELECT id FROM requests WHERE id = ? AND customer_id = ?',
      [requestId, userId]
    );
    
    if (requests.length === 0) {
      throw new ApiError(404, 'Request not found');
    }
    
    // Get bids
    const bids = await db.query(
      `SELECT b.*,
              u.first_name as supplier_first_name,
              u.last_name as supplier_last_name,
              sp.company_name,
              sp.rating as supplier_rating,
              (SELECT COUNT(*) FROM orders WHERE supplier_id = b.supplier_id AND status = 'completed') as completed_orders,
              (SELECT COUNT(*) FROM orders WHERE supplier_id = b.supplier_id AND status = 'completed') as total_completed_orders
       FROM bids b
       JOIN users u ON b.supplier_id = u.id
       LEFT JOIN supplier_profiles sp ON u.id = sp.user_id
       WHERE b.request_id = ?
       ORDER BY 
         CASE WHEN b.status = 'pending' THEN 1 
              WHEN b.status = 'accepted' THEN 2 
              ELSE 3 END,
         b.price ASC`,
      [requestId]
    );
    
    return bids;
    
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching request bids:', error);
    throw error;
  }
};

/**
 * Get available requests for suppliers (requests that are open for bids)
 */
const getAvailableRequests = async (supplierId, filters = {}) => {
  try {
    const { 
      category_id, 
      budget_min, 
      budget_max, 
      delivery_date_from, 
      delivery_date_to,
      page = 1, 
      limit = 10, 
      sort = 'created_at', 
      order = 'DESC',
      search
    } = filters;
    
    const offset = (page - 1) * limit;
    
    // Build the main query
    let query = `
      SELECT r.*,
             c.name as category_name,
             'Anonymous Customer' as customer_name,
             NULL as customer_rating,
             NULL as customer_review_count,
             (SELECT COUNT(*) FROM bids b WHERE b.request_id = r.id) as bid_count,
             (SELECT COUNT(*) FROM bids b WHERE b.request_id = r.id AND b.supplier_id = ?) as my_bid_count,
             CASE WHEN EXISTS(SELECT 1 FROM bids b WHERE b.request_id = r.id AND b.supplier_id = ?) 
                  THEN 1 ELSE 0 END as has_bid
      FROM requests r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.status IN ('open_for_bids', 'bids_received')
        AND r.expires_at > NOW()
    `;
    
    const params = [supplierId, supplierId];
    
    // Add category filter if supplier has categories
    if (category_id) {
      query += ' AND r.category_id = ?';
      params.push(category_id);
    }
    
    // Add budget filters
    if (budget_min) {
      query += ' AND (r.budget_max >= ? OR r.budget_max IS NULL)';
      params.push(budget_min);
    }
    
    if (budget_max) {
      query += ' AND (r.budget_min <= ? OR r.budget_min IS NULL)';
      params.push(budget_max);
    }
    
    // Add delivery date filters
    if (delivery_date_from) {
      query += ' AND (r.delivery_date >= ? OR r.delivery_date IS NULL)';
      params.push(delivery_date_from);
    }
    
    if (delivery_date_to) {
      query += ' AND (r.delivery_date <= ? OR r.delivery_date IS NULL)';
      params.push(delivery_date_to);
    }
    
    // Add search filter
    if (search) {
      query += ' AND (r.title LIKE ? OR r.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // Add sorting
    const validSortFields = ['created_at', 'title', 'budget_min', 'budget_max', 'delivery_date', 'bid_count'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    if (sortField === 'bid_count') {
      query += ` ORDER BY bid_count ${sortOrder}, r.created_at DESC`;
    } else {
      query += ` ORDER BY r.${sortField} ${sortOrder}`;
    }
    
    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM requests r
      WHERE r.status IN ('open_for_bids', 'bids_received')
        AND r.expires_at > NOW()
    `;
    
    const countParams = [];
    
    // Apply same filters to count query
    if (category_id) {
      countQuery += ' AND r.category_id = ?';
      countParams.push(category_id);
    }
    
    if (budget_min) {
      countQuery += ' AND (r.budget_max >= ? OR r.budget_max IS NULL)';
      countParams.push(budget_min);
    }
    
    if (budget_max) {
      countQuery += ' AND (r.budget_min <= ? OR r.budget_min IS NULL)';
      countParams.push(budget_max);
    }
    
    if (delivery_date_from) {
      countQuery += ' AND (r.delivery_date >= ? OR r.delivery_date IS NULL)';
      countParams.push(delivery_date_from);
    }
    
    if (delivery_date_to) {
      countQuery += ' AND (r.delivery_date <= ? OR r.delivery_date IS NULL)';
      countParams.push(delivery_date_to);
    }
    
    if (search) {
      countQuery += ' AND (r.title LIKE ? OR r.description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    
    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const requests = await db.query(query, params);
    
    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
  } catch (error) {
    logger.error('Error fetching available requests:', error);
    throw error;
  }
};

/**
 * Get request details for suppliers (with anonymous customer info)
 */
const getSupplierRequestById = async (requestId, supplierId) => {
  try {
    const requests = await db.query(
      `SELECT r.*,
              c.name as category_name,
              'Anonymous Customer' as customer_name,
              NULL as customer_rating,
              NULL as customer_review_count,
              (SELECT COUNT(*) FROM bids b WHERE b.request_id = r.id) as bid_count,
              (SELECT COUNT(*) FROM bids b WHERE b.request_id = r.id AND b.supplier_id = ?) as my_bid_count,
              CASE WHEN EXISTS(SELECT 1 FROM bids b WHERE b.request_id = r.id AND b.supplier_id = ?) 
                   THEN 1 ELSE 0 END as has_bid,
              (SELECT b.id FROM bids b WHERE b.request_id = r.id AND b.supplier_id = ? LIMIT 1) as my_bid_id
       FROM requests r
       LEFT JOIN categories c ON r.category_id = c.id
       WHERE r.id = ? 
         AND r.status IN ('open_for_bids', 'bids_received')
         AND r.expires_at > NOW()`,
      [supplierId, supplierId, supplierId, requestId]
    );
    
    if (requests.length === 0) {
      throw new ApiError(404, 'Request not found or no longer available');
    }
    
    return requests[0];
    
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching supplier request by ID:', error);
    throw error;
  }
};

/**
 * Get request statistics for suppliers
 */
const getSupplierRequestStatistics = async (supplierId) => {
  try {
    const stats = await db.query(
      `SELECT 
         COUNT(DISTINCT r.id) as total_available_requests,
         COUNT(DISTINCT CASE WHEN r.status = 'open_for_bids' THEN r.id END) as open_for_bids,
         COUNT(DISTINCT CASE WHEN r.status = 'bids_received' THEN r.id END) as bids_received,
         COUNT(DISTINCT b.request_id) as requests_bid_on,
         COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.request_id END) as pending_bids,
         COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.request_id END) as accepted_bids,
         AVG(r.budget_min) as avg_min_budget,
         AVG(r.budget_max) as avg_max_budget,
         COUNT(DISTINCT CASE WHEN r.expires_at < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN r.id END) as expiring_soon
       FROM requests r
       LEFT JOIN bids b ON r.id = b.request_id AND b.supplier_id = ?
       WHERE r.status IN ('open_for_bids', 'bids_received')
         AND r.expires_at > NOW()`,
      [supplierId]
    );
    
    return stats[0] || {
      total_available_requests: 0,
      open_for_bids: 0,
      bids_received: 0,
      requests_bid_on: 0,
      pending_bids: 0,
      accepted_bids: 0,
      avg_min_budget: 0,
      avg_max_budget: 0,
      expiring_soon: 0
    };
    
  } catch (error) {
    logger.error('Error fetching supplier request statistics:', error);
    throw error;
  }
};

module.exports = {
  createRequest,
  getCustomerRequests,
  getRequestById,
  updateRequest,
  cancelRequest,
  getRequestStatistics,
  getRequestBids,
  getAvailableRequests,
  getSupplierRequestById,
  getSupplierRequestStatistics
};

