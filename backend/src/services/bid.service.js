const db = require('../config/database');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Bid Service
 * Handles all business logic for bids
 */

/**
 * Get all bids for a customer's requests
 */
const getCustomerBids = async (customerId, filters = {}) => {
  try {
    const { status, request_id, page = 1, limit = 10, sort = 'created_at', order = 'DESC' } = filters;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT b.*, 
             r.title as request_title,
             r.status as request_status,
             r.budget_min,
             r.budget_max,
             r.currency,
             ans.anonymous_name,
             ans.anonymous_rating,
             ans.anonymous_review_count
      FROM bids b
      INNER JOIN requests r ON b.request_id = r.id
      LEFT JOIN anonymous_suppliers ans ON b.supplier_id = ans.supplier_id AND b.request_id = ans.request_id
      WHERE r.customer_id = ?
    `;
    
    const params = [customerId];
    
    // Add filters
    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }
    
    if (request_id) {
      query += ' AND b.request_id = ?';
      params.push(request_id);
    }
    
    // Add sorting
    const validSortFields = ['created_at', 'price', 'delivery_time_days', 'status'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY b.${sortField} ${sortOrder}`;
    
    // Get total count - build separate count query
    const countQuery = `
      SELECT COUNT(DISTINCT b.id) as total
      FROM bids b
      INNER JOIN requests r ON b.request_id = r.id
      LEFT JOIN anonymous_suppliers ans ON b.supplier_id = ans.supplier_id AND b.request_id = ans.request_id
      WHERE r.customer_id = ?
      ${status ? 'AND b.status = ?' : ''}
      ${request_id ? 'AND b.request_id = ?' : ''}
    `;
    
    const countParams = [customerId];
    if (status) countParams.push(status);
    if (request_id) countParams.push(request_id);
    
    const countResult = await db.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    
    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const bids = await db.query(query, params);
    
    return {
      bids,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
  } catch (error) {
    logger.error('Error fetching customer bids:', error);
    throw error;
  }
};

/**
 * Get bid by ID
 */
const getBidById = async (bidId, customerId) => {
  try {
    const bids = await db.query(
      `SELECT b.*, 
              r.id as request_id,
              r.title as request_title,
              r.description as request_description,
              r.budget_min,
              r.budget_max,
              r.currency,
              r.delivery_date as request_delivery_date,
              r.status as request_status,
              ans.anonymous_name,
              ans.anonymous_rating,
              ans.anonymous_review_count
       FROM bids b
       INNER JOIN requests r ON b.request_id = r.id
       LEFT JOIN anonymous_suppliers ans ON b.supplier_id = ans.supplier_id AND b.request_id = ans.request_id
       WHERE b.id = ? AND r.customer_id = ?`,
      [bidId, customerId]
    );
    
    if (bids.length === 0) {
      throw new ApiError(404, 'Bid not found');
    }
    
    return bids[0];
    
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching bid by ID:', error);
    throw error;
  }
};

/**
 * Accept a bid
 */
const acceptBid = async (bidId, customerId) => {
  try {
    const result = await db.transaction(async (connection) => {
      // Get bid details with request info
      const [bids] = await connection.execute(
        `SELECT b.*, r.customer_id, r.status as request_status
         FROM bids b
         INNER JOIN requests r ON b.request_id = r.id
         WHERE b.id = ?`,
        [bidId]
      );
      
      if (bids.length === 0) {
        throw new ApiError(404, 'Bid not found');
      }
      
      const bid = bids[0];
      
      // Verify ownership
      if (bid.customer_id !== customerId) {
        throw new ApiError(403, 'You do not have permission to accept this bid');
      }
      
      // Check if bid is still pending
      if (bid.status !== 'pending') {
        throw new ApiError(400, 'Only pending bids can be accepted');
      }
      
      // Check if request is still open for accepting bids
      if (!['open_for_bids', 'bids_received'].includes(bid.request_status)) {
        throw new ApiError(400, 'This request is no longer accepting bids');
      }
      
      // Calculate commission (5% or minimum $1)
      const commissionRate = 0.05;
      const commissionAmount = Math.max(bid.price * commissionRate, 1.00);
      
      // Generate order number
      const orderNumber = `CB${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(bidId).padStart(6, '0')}`;
      
      // Update bid status
      await connection.execute(
        `UPDATE bids SET status = 'accepted', accepted_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [bidId]
      );
      
      // Reject all other pending bids for this request
      await connection.execute(
        `UPDATE bids 
         SET status = 'rejected', rejected_at = NOW(), rejection_reason = 'Another bid was accepted', updated_at = NOW()
         WHERE request_id = ? AND id != ? AND status = 'pending'`,
        [bid.request_id, bidId]
      );
      
      // Update request status
      await connection.execute(
        `UPDATE requests SET status = 'in_progress', updated_at = NOW() WHERE id = ?`,
        [bid.request_id]
      );
      
      // Create order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          bid_id, customer_id, supplier_id, order_number, 
          total_amount, commission_amount, commission_rate, 
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', NOW(), NOW())`,
        [
          bidId,
          customerId,
          bid.supplier_id,
          orderNumber,
          bid.price,
          commissionAmount,
          commissionRate
        ]
      );
      
      const orderId = orderResult.insertId;
      
      // Log bid action
      await connection.execute(
        `INSERT INTO bid_actions (bid_id, action_type, performed_by, created_at)
         VALUES (?, 'accept', ?, NOW())`,
        [bidId, customerId]
      );
      
      // Log request status change
      await connection.execute(
        `INSERT INTO request_status_history (request_id, old_status, new_status, changed_by, change_type, reason, changed_at)
         VALUES (?, ?, 'in_progress', ?, 'automatic', 'Bid accepted and order created', NOW())`,
        [bid.request_id, bid.request_status, customerId]
      );
      
      return {
        message: 'Bid accepted successfully',
        order_id: orderId,
        order_number: orderNumber
      };
    });
    
    logger.info(`Bid accepted: ${bidId} by customer: ${customerId}`);
    return result;
    
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error accepting bid:', error);
    throw error;
  }
};

/**
 * Reject a bid
 */
const rejectBid = async (bidId, customerId, rejectionReason = null) => {
  try {
    const result = await db.transaction(async (connection) => {
      // Get bid details with request info
      const [bids] = await connection.execute(
        `SELECT b.*, r.customer_id
         FROM bids b
         INNER JOIN requests r ON b.request_id = r.id
         WHERE b.id = ?`,
        [bidId]
      );
      
      if (bids.length === 0) {
        throw new ApiError(404, 'Bid not found');
      }
      
      const bid = bids[0];
      
      // Verify ownership
      if (bid.customer_id !== customerId) {
        throw new ApiError(403, 'You do not have permission to reject this bid');
      }
      
      // Check if bid is still pending
      if (bid.status !== 'pending') {
        throw new ApiError(400, 'Only pending bids can be rejected');
      }
      
      // Update bid status
      await connection.execute(
        `UPDATE bids 
         SET status = 'rejected', rejected_at = NOW(), rejection_reason = ?, updated_at = NOW()
         WHERE id = ?`,
        [rejectionReason || 'Rejected by customer', bidId]
      );
      
      // Log bid action
      await connection.execute(
        `INSERT INTO bid_actions (bid_id, action_type, performed_by, reason, created_at)
         VALUES (?, 'reject', ?, ?, NOW())`,
        [bidId, customerId, rejectionReason]
      );
      
      return { message: 'Bid rejected successfully' };
    });
    
    logger.info(`Bid rejected: ${bidId} by customer: ${customerId}`);
    return result;
    
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error rejecting bid:', error);
    throw error;
  }
};

/**
 * Get bid statistics for customer
 */
const getBidStatistics = async (customerId) => {
  try {
    const stats = await db.query(
      `SELECT 
         COUNT(DISTINCT b.id) as total_bids,
         COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bids,
         COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) as accepted_bids,
         COUNT(DISTINCT CASE WHEN b.status = 'rejected' THEN b.id END) as rejected_bids,
         COUNT(DISTINCT b.request_id) as requests_with_bids,
         AVG(b.price) as average_bid_price,
         MIN(b.price) as lowest_bid_price,
         MAX(b.price) as highest_bid_price
       FROM bids b
       INNER JOIN requests r ON b.request_id = r.id
       WHERE r.customer_id = ?`,
      [customerId]
    );
    
    return stats[0] || {
      total_bids: 0,
      pending_bids: 0,
      accepted_bids: 0,
      rejected_bids: 0,
      requests_with_bids: 0,
      average_bid_price: 0,
      lowest_bid_price: 0,
      highest_bid_price: 0
    };
    
  } catch (error) {
    logger.error('Error fetching bid statistics:', error);
    throw error;
  }
};


module.exports = {
  getCustomerBids,
  getBidById,
  acceptBid,
  rejectBid,
  getBidStatistics
};

