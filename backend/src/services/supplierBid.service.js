const db = require('../config/database');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Supplier Bid Service
 * Handles all business logic for supplier bid operations
 */

/**
 * Get all bids submitted by a supplier
 */
const getSupplierBids = async (supplierId, filters = {}) => {
  try {
    const { status, request_id, page = 1, limit = 10, sort = 'created_at', order = 'DESC' } = filters;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT b.*, 
             r.title as request_title,
             r.description as request_description,
             r.status as request_status,
             r.budget_min,
             r.budget_max,
             r.currency,
             r.delivery_date as request_delivery_date,
             r.created_at as request_created_at,
             'Anonymous Customer' as customer_anonymous_name,
             NULL as customer_rating,
             NULL as customer_review_count
      FROM bids b
      INNER JOIN requests r ON b.request_id = r.id
      WHERE b.supplier_id = ?
    `;
    
    const params = [supplierId];
    
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
    const validSortFields = ['created_at', 'price', 'delivery_time_days', 'status', 'accepted_at', 'rejected_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY b.${sortField} ${sortOrder}`;
    
    // Get total count - build separate count query
    const countQuery = `
      SELECT COUNT(DISTINCT b.id) as total
      FROM bids b
      INNER JOIN requests r ON b.request_id = r.id
      WHERE b.supplier_id = ?
      ${status ? 'AND b.status = ?' : ''}
      ${request_id ? 'AND b.request_id = ?' : ''}
    `;
    
    const countParams = [supplierId];
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
    logger.error('Error fetching supplier bids:', error);
    throw error;
  }
};

/**
 * Get supplier bid by ID
 */
const getSupplierBidById = async (bidId, supplierId) => {
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
              r.created_at as request_created_at,
              'Anonymous Customer' as customer_anonymous_name,
              NULL as customer_rating,
              NULL as customer_review_count
       FROM bids b
       INNER JOIN requests r ON b.request_id = r.id
       WHERE b.id = ? AND b.supplier_id = ?`,
      [bidId, supplierId]
    );
    
    if (bids.length === 0) {
      throw new ApiError(404, 'Bid not found');
    }
    
    return bids[0];
    
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching supplier bid by ID:', error);
    throw error;
  }
};

/**
 * Update a supplier's bid (only if status is pending)
 */
const updateSupplierBid = async (bidId, supplierId, updateData) => {
  try {
    const result = await db.transaction(async (connection) => {
      // First check if bid exists and belongs to supplier
      const [bids] = await connection.execute(
        `SELECT id, status FROM bids WHERE id = ? AND supplier_id = ?`,
        [bidId, supplierId]
      );
      
      if (bids.length === 0) {
        throw new ApiError(404, 'Bid not found');
      }
      
      const bid = bids[0];
      
      // Check if bid is still pending
      if (bid.status !== 'pending') {
        throw new ApiError(400, 'Only pending bids can be updated');
      }
      
      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      
      if (updateData.price !== undefined) {
        updateFields.push('price = ?');
        updateValues.push(updateData.price);
      }
      
      if (updateData.delivery_time_days !== undefined) {
        updateFields.push('delivery_time_days = ?');
        updateValues.push(updateData.delivery_time_days);
      }
      
      if (updateData.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updateData.description);
      }
      
      if (updateData.proposal_details !== undefined) {
        updateFields.push('proposal_details = ?');
        updateValues.push(updateData.proposal_details);
      }
      
      if (updateData.materials_cost !== undefined) {
        updateFields.push('materials_cost = ?');
        updateValues.push(updateData.materials_cost);
      }
      
      if (updateData.labor_cost !== undefined) {
        updateFields.push('labor_cost = ?');
        updateValues.push(updateData.labor_cost);
      }
      
      if (updateData.other_costs !== undefined) {
        updateFields.push('other_costs = ?');
        updateValues.push(updateData.other_costs);
      }
      
      if (updateFields.length === 0) {
        throw new ApiError(400, 'No valid fields to update');
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(bidId);
      
      const updateQuery = `UPDATE bids SET ${updateFields.join(', ')} WHERE id = ?`;
      
      await connection.execute(updateQuery, updateValues);
      
      // Log bid action
      await connection.execute(
        `INSERT INTO bid_actions (bid_id, action_type, performed_by, created_at)
         VALUES (?, 'update', ?, NOW())`,
        [bidId, supplierId]
      );
      
      return { message: 'Bid updated successfully' };
    });
    
    logger.info(`Bid updated: ${bidId} by supplier: ${supplierId}`);
    return result;
    
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating supplier bid:', error);
    throw error;
  }
};

/**
 * Cancel a supplier's bid (only if status is pending)
 */
const cancelSupplierBid = async (bidId, supplierId, cancellationReason = null) => {
  try {
    const result = await db.transaction(async (connection) => {
      // First check if bid exists and belongs to supplier
      const [bids] = await connection.execute(
        `SELECT id, status FROM bids WHERE id = ? AND supplier_id = ?`,
        [bidId, supplierId]
      );
      
      if (bids.length === 0) {
        throw new ApiError(404, 'Bid not found');
      }
      
      const bid = bids[0];
      
      // Check if bid is still pending
      if (bid.status !== 'pending') {
        throw new ApiError(400, 'Only pending bids can be cancelled');
      }
      
      // Update bid status
      await connection.execute(
        `UPDATE bids 
         SET status = 'cancelled', rejected_at = NOW(), rejection_reason = ?, updated_at = NOW()
         WHERE id = ?`,
        [cancellationReason || 'Cancelled by supplier', bidId]
      );
      
      // Log bid action
      await connection.execute(
        `INSERT INTO bid_actions (bid_id, action_type, performed_by, reason, created_at)
         VALUES (?, 'cancel', ?, ?, NOW())`,
        [bidId, supplierId, cancellationReason]
      );
      
      return { message: 'Bid cancelled successfully' };
    });
    
    logger.info(`Bid cancelled: ${bidId} by supplier: ${supplierId}`);
    return result;
    
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error cancelling supplier bid:', error);
    throw error;
  }
};

/**
 * Create a new bid for a request
 */
const createSupplierBid = async (supplierId, bidData) => {
  try {
    const {
      request_id,
      price,
      delivery_time_days,
      description,
      proposal_details,
      materials_cost,
      labor_cost,
      other_costs
    } = bidData;

    const result = await db.transaction(async (connection) => {
      // Check if request exists and is open for bids
      const [requests] = await connection.execute(
        `SELECT id, status, expires_at, customer_id 
         FROM requests 
         WHERE id = ? AND status IN ('open_for_bids', 'bids_received') AND expires_at > NOW()`,
        [request_id]
      );

      if (requests.length === 0) {
        throw new ApiError(400, 'Request not found or not available for bidding');
      }

      const request = requests[0];

      // Check if supplier has already bid on this request
      const [existingBids] = await connection.execute(
        `SELECT id, status FROM bids WHERE supplier_id = ? AND request_id = ?`,
        [supplierId, request_id]
      );

      if (existingBids.length > 0) {
        throw new ApiError(400, 'You have already submitted a bid for this request');
      }

      // Create the bid
      const [bidResult] = await connection.execute(
        `INSERT INTO bids (
          request_id, supplier_id, price, delivery_time_days, 
          description, proposal_details, materials_cost, labor_cost, other_costs,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
        [
          request_id, supplierId, price, delivery_time_days,
          description || null, proposal_details || null, materials_cost || null,
          labor_cost || null, other_costs || null
        ]
      );

      const bidId = bidResult.insertId;

      // Update request status if it was 'open_for_bids'
      if (request.status === 'open_for_bids') {
        await connection.execute(
          `UPDATE requests SET status = 'bids_received', updated_at = NOW() WHERE id = ?`,
          [request_id]
        );
      }

      // Create anonymous supplier entry for this bid
      const anonymousName = `Supplier${Math.floor(Math.random() * 10000)}`;
      await connection.execute(
        `INSERT INTO anonymous_suppliers (supplier_id, request_id, anonymous_name, created_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE anonymous_name = VALUES(anonymous_name)`,
        [supplierId, request_id, anonymousName]
      );

      // Log bid action
      await connection.execute(
        `INSERT INTO bid_actions (bid_id, action_type, performed_by, created_at)
         VALUES (?, 'create', ?, NOW())`,
        [bidId, supplierId]
      );

      return {
        bidId,
        message: 'Bid submitted successfully'
      };
    });

    logger.info(`New bid created: ${result.bidId} by supplier: ${supplierId} for request: ${request_id}`);
    return result;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error creating supplier bid:', error);
    throw error;
  }
};

/**
 * Get bid statistics for supplier
 */
const getSupplierBidStatistics = async (supplierId) => {
  try {
    const stats = await db.query(
      `SELECT 
         COUNT(DISTINCT b.id) as total_bids,
         COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bids,
         COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) as accepted_bids,
         COUNT(DISTINCT CASE WHEN b.status = 'rejected' THEN b.id END) as rejected_bids,
         COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bids,
         COUNT(DISTINCT b.request_id) as requests_bid_on,
         AVG(b.price) as average_bid_price,
         MIN(b.price) as lowest_bid_price,
         MAX(b.price) as highest_bid_price,
         AVG(b.delivery_time_days) as average_delivery_time,
         COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) / NULLIF(COUNT(DISTINCT b.id), 0) * 100 as win_rate
       FROM bids b
       WHERE b.supplier_id = ?`,
      [supplierId]
    );
    
    return stats[0] || {
      total_bids: 0,
      pending_bids: 0,
      accepted_bids: 0,
      rejected_bids: 0,
      cancelled_bids: 0,
      requests_bid_on: 0,
      average_bid_price: 0,
      lowest_bid_price: 0,
      highest_bid_price: 0,
      average_delivery_time: 0,
      win_rate: 0
    };
    
  } catch (error) {
    logger.error('Error fetching supplier bid statistics:', error);
    throw error;
  }
};

module.exports = {
  getSupplierBids,
  getSupplierBidById,
  updateSupplierBid,
  cancelSupplierBid,
  createSupplierBid,
  getSupplierBidStatistics
};
