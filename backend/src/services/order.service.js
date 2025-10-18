const db = require('../config/database');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Order Service
 * Handles all business logic for orders
 */

/**
 * Get customer orders with filtering and pagination
 */
const getCustomerOrders = async (customerId, filters = {}) => {
  try {
    const { status, page = 1, limit = 10, sort = 'created_at', order = 'DESC' } = filters;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        o.*,
        r.title as request_title,
        r.description as request_description,
        r.category_id,
        c.name as category_name,
        b.price as bid_price,
        b.delivery_time_days,
        b.description as bid_description,
        u.first_name as supplier_first_name,
        u.last_name as supplier_last_name,
        u.email as supplier_email,
        u.phone as supplier_phone,
        sp.company_name as supplier_company_name,
        (SELECT COUNT(*) FROM order_updates ou WHERE ou.order_id = o.id) as updates_count,
        (SELECT COUNT(*) FROM order_messages om WHERE om.order_id = o.id AND om.receiver_id = ? AND om.is_read = 0) as unread_messages
      FROM orders o
      INNER JOIN bids b ON o.bid_id = b.id
      INNER JOIN requests r ON b.request_id = r.id
      LEFT JOIN categories c ON r.category_id = c.id
      INNER JOIN users u ON o.supplier_id = u.id
      LEFT JOIN supplier_profiles sp ON u.id = sp.user_id
      WHERE o.customer_id = ?
    `;
    
    const params = [customerId, customerId];
    
    // Add status filter
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    
    // Add sorting
    const validSortFields = ['created_at', 'updated_at', 'total_amount', 'status', 'delivery_date'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY o.${sortField} ${sortOrder}`;
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      WHERE o.customer_id = ?
      ${status ? 'AND o.status = ?' : ''}
    `;
    const countParams = status ? [customerId, status] : [customerId];
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult.total;
    
    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const orders = await db.query(query, params);
    
    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching customer orders:', error);
    throw error;
  }
};

/**
 * Get single order by ID
 */
const getOrderById = async (orderId, customerId) => {
  try {
    const query = `
      SELECT 
        o.*,
        r.id as request_id,
        r.title as request_title,
        r.description as request_description,
        r.budget_min,
        r.budget_max,
        r.currency,
        r.category_id,
        r.delivery_date as request_delivery_date,
        c.name as category_name,
        b.id as bid_id,
        b.price as bid_price,
        b.delivery_time_days,
        b.description as bid_description,
        b.materials_cost,
        b.labor_cost,
        b.other_costs,
        u.id as supplier_id,
        u.first_name as supplier_first_name,
        u.last_name as supplier_last_name,
        u.email as supplier_email,
        u.phone as supplier_phone,
        sp.company_name as supplier_company_name,
        sp.address as supplier_address
      FROM orders o
      INNER JOIN bids b ON o.bid_id = b.id
      INNER JOIN requests r ON b.request_id = r.id
      LEFT JOIN categories c ON r.category_id = c.id
      INNER JOIN users u ON o.supplier_id = u.id
      LEFT JOIN supplier_profiles sp ON u.id = sp.user_id
      WHERE o.id = ? AND o.customer_id = ?
    `;
    
    const [order] = await db.query(query, [orderId, customerId]);
    
    if (!order) {
      throw new ApiError(404, 'Order not found or you do not have access');
    }
    
    // Get order updates
    const updatesQuery = `
      SELECT 
        ou.*,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name
      FROM order_updates ou
      LEFT JOIN users u ON ou.created_by = u.id
      WHERE ou.order_id = ?
      ORDER BY ou.created_at DESC
    `;
    
    const updates = await db.query(updatesQuery, [orderId]);
    
    // Get order status history
    const historyQuery = `
      SELECT 
        osh.*,
        u.first_name as changed_by_first_name,
        u.last_name as changed_by_last_name
      FROM order_status_history osh
      LEFT JOIN users u ON osh.changed_by = u.id
      WHERE osh.order_id = ?
      ORDER BY osh.created_at ASC
    `;
    
    const statusHistory = await db.query(historyQuery, [orderId]);
    
    return {
      ...order,
      updates: updates || [],
      status_history: statusHistory || []
    };
  } catch (error) {
    logger.error('Error fetching order by ID:', error);
    throw error;
  }
};

/**
 * Get order statistics for customer
 */
const getOrderStatistics = async (customerId) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status IN ('confirmed', 'in_production', 'shipped') THEN 1 ELSE 0 END) as active_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        COALESCE(SUM(total_amount), 0) as total_spent,
        COALESCE(AVG(total_amount), 0) as avg_order_value,
        COALESCE(AVG(DATEDIFF(actual_delivery_date, created_at)), 0) as avg_delivery_days
      FROM orders
      WHERE customer_id = ?
    `;
    
    const [stats] = await db.query(query, [customerId]);
    
    return stats || {
      total_orders: 0,
      active_orders: 0,
      delivered_orders: 0,
      completed_orders: 0,
      cancelled_orders: 0,
      total_spent: 0,
      avg_order_value: 0,
      avg_delivery_days: 0
    };
  } catch (error) {
    logger.error('Error fetching order statistics:', error);
    throw error;
  }
};

/**
 * Cancel order
 */
const cancelOrder = async (orderId, customerId, reason = null) => {
  try {
    // Check if order exists and belongs to customer
    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND customer_id = ?',
      [orderId, customerId]
    );
    
    if (!order) {
      throw new ApiError(404, 'Order not found or you do not have access');
    }
    
    // Check if order can be cancelled
    if (!['confirmed', 'in_production'].includes(order.status)) {
      throw new ApiError(400, 'Order cannot be cancelled in its current status');
    }
    
    // Update order status
    await db.query(
      'UPDATE orders SET status = ?, customer_notes = ? WHERE id = ?',
      ['cancelled', reason, orderId]
    );
    
    // Add status history
    await db.query(
      'INSERT INTO order_status_history (order_id, status, notes, changed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
      [orderId, 'cancelled', reason, customerId]
    );
    
    logger.info(`Order ${orderId} cancelled by customer ${customerId}`);
    
    return { message: 'Order cancelled successfully' };
  } catch (error) {
    logger.error('Error cancelling order:', error);
    throw error;
  }
};

/**
 * Mark order as received/delivered (customer confirmation)
 */
const confirmDelivery = async (orderId, customerId) => {
  try {
    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND customer_id = ?',
      [orderId, customerId]
    );
    
    if (!order) {
      throw new ApiError(404, 'Order not found or you do not have access');
    }
    
    if (order.status !== 'shipped') {
      throw new ApiError(400, 'Only shipped orders can be confirmed as delivered');
    }
    
    // Update order status
    await db.query(
      'UPDATE orders SET status = ?, actual_delivery_date = CURDATE() WHERE id = ?',
      ['delivered', orderId]
    );
    
    // Add status history
    await db.query(
      'INSERT INTO order_status_history (order_id, status, notes, changed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
      [orderId, 'delivered', 'Confirmed by customer', customerId]
    );
    
    logger.info(`Order ${orderId} marked as delivered by customer ${customerId}`);
    
    return { message: 'Delivery confirmed successfully' };
  } catch (error) {
    logger.error('Error confirming delivery:', error);
    throw error;
  }
};

/**
 * Complete order (after delivery and customer is satisfied)
 */
const completeOrder = async (orderId, customerId) => {
  try {
    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND customer_id = ?',
      [orderId, customerId]
    );
    
    if (!order) {
      throw new ApiError(404, 'Order not found or you do not have access');
    }
    
    if (order.status !== 'delivered') {
      throw new ApiError(400, 'Only delivered orders can be completed');
    }
    
    // Update order status
    await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['completed', orderId]
    );
    
    // Add status history
    await db.query(
      'INSERT INTO order_status_history (order_id, status, notes, changed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
      [orderId, 'completed', 'Completed by customer', customerId]
    );
    
    logger.info(`Order ${orderId} completed by customer ${customerId}`);
    
    return { message: 'Order completed successfully' };
  } catch (error) {
    logger.error('Error completing order:', error);
    throw error;
  }
};

/**
 * Get supplier orders with filtering and pagination
 */
const getSupplierOrders = async (supplierId, filters = {}) => {
  try {
    const { status, page = 1, limit = 10, sort = 'created_at', order = 'DESC' } = filters;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        o.*,
        r.title as request_title,
        r.description as request_description,
        r.category_id,
        c.name as category_name,
        b.price as bid_price,
        b.delivery_time_days,
        b.description as bid_description,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        u.email as customer_email,
        u.phone as customer_phone,
        cp.company_name as customer_company_name,
        (SELECT COUNT(*) FROM order_updates ou WHERE ou.order_id = o.id) as updates_count,
        (SELECT COUNT(*) FROM order_messages om WHERE om.order_id = o.id AND om.receiver_id = ? AND om.is_read = 0) as unread_messages
      FROM orders o
      INNER JOIN bids b ON o.bid_id = b.id
      INNER JOIN requests r ON b.request_id = r.id
      LEFT JOIN categories c ON r.category_id = c.id
      INNER JOIN users u ON o.customer_id = u.id
      LEFT JOIN customer_profiles cp ON u.id = cp.user_id
      WHERE o.supplier_id = ?
    `;
    
    const params = [supplierId, supplierId];
    
    // Add status filter
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    
    // Add sorting
    const validSortFields = ['created_at', 'updated_at', 'total_amount', 'status', 'delivery_date'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY o.${sortField} ${sortOrder}`;
    
    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const orders = await db.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      WHERE o.supplier_id = ?
    `;
    const countParams = [supplierId];
    
    if (status) {
      countQuery += ' AND o.status = ?';
      countParams.push(status);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult.total;
    
    return {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching supplier orders:', error);
    throw error;
  }
};

/**
 * Get supplier order by ID
 */
const getSupplierOrderById = async (orderId, supplierId) => {
  try {
    const query = `
      SELECT 
        o.*,
        r.id as request_id,
        r.title as request_title,
        r.description as request_description,
        r.budget_min,
        r.budget_max,
        r.currency,
        r.category_id,
        r.delivery_date as request_delivery_date,
        c.name as category_name,
        b.id as bid_id,
        b.price as bid_price,
        b.delivery_time_days,
        b.description as bid_description,
        b.materials_cost,
        b.labor_cost,
        b.other_costs,
        u.id as customer_id,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        u.email as customer_email,
        u.phone as customer_phone,
        cp.company_name as customer_company_name,
        cp.address as customer_address
      FROM orders o
      INNER JOIN bids b ON o.bid_id = b.id
      INNER JOIN requests r ON b.request_id = r.id
      LEFT JOIN categories c ON r.category_id = c.id
      INNER JOIN users u ON o.customer_id = u.id
      LEFT JOIN customer_profiles cp ON u.id = cp.user_id
      WHERE o.id = ? AND o.supplier_id = ?
    `;
    
    const [order] = await db.query(query, [orderId, supplierId]);
    
    if (!order) {
      throw new ApiError(404, 'Order not found or you do not have access');
    }
    
    // Get order updates
    const updatesQuery = `
      SELECT 
        ou.*,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name
      FROM order_updates ou
      LEFT JOIN users u ON ou.created_by = u.id
      WHERE ou.order_id = ?
      ORDER BY ou.created_at DESC
    `;
    
    const updates = await db.query(updatesQuery, [orderId]);
    
    // Get order status history
    const historyQuery = `
      SELECT 
        osh.*,
        u.first_name as changed_by_first_name,
        u.last_name as changed_by_last_name
      FROM order_status_history osh
      LEFT JOIN users u ON osh.changed_by = u.id
      WHERE osh.order_id = ?
      ORDER BY osh.created_at ASC
    `;
    
    const statusHistory = await db.query(historyQuery, [orderId]);
    
    return {
      ...order,
      updates,
      status_history: statusHistory
    };
  } catch (error) {
    logger.error('Error fetching supplier order by ID:', error);
    throw error;
  }
};

/**
 * Get supplier order statistics
 */
const getSupplierOrderStatistics = async (supplierId) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status IN ('confirmed', 'in_progress', 'production', 'quality_check') THEN 1 ELSE 0 END) as active_orders,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_order_value,
        COALESCE(AVG(DATEDIFF(COALESCE(actual_delivery_date, NOW()), created_at)), 0) as avg_delivery_days,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as orders_last_7d,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as orders_last_30d
      FROM orders
      WHERE supplier_id = ?
    `;
    
    const [stats] = await db.query(query, [supplierId]);
    
    return stats || {
      total_orders: 0,
      active_orders: 0,
      shipped_orders: 0,
      delivered_orders: 0,
      completed_orders: 0,
      cancelled_orders: 0,
      total_revenue: 0,
      avg_order_value: 0,
      avg_delivery_days: 0,
      orders_last_7d: 0,
      orders_last_30d: 0
    };
  } catch (error) {
    logger.error('Error fetching supplier order statistics:', error);
    throw error;
  }
};

/**
 * Update order status (supplier action)
 */
const updateOrderStatus = async (orderId, supplierId, status, notes = null) => {
  try {
    // Check if order exists and belongs to supplier
    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND supplier_id = ?',
      [orderId, supplierId]
    );
    
    if (!order) {
      throw new ApiError(404, 'Order not found or you do not have access');
    }
    
    // Validate status transition
    const validTransitions = {
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['production', 'quality_check', 'cancelled'],
      'production': ['quality_check', 'shipped', 'cancelled'],
      'quality_check': ['shipped', 'production', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [],
      'completed': [],
      'cancelled': []
    };
    
    if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
      throw new ApiError(400, `Invalid status transition from ${order.status} to ${status}`);
    }
    
    // Update order status
    await db.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, orderId]
    );
    
    // Add status history
    await db.query(
      'INSERT INTO order_status_history (order_id, status, notes, changed_by, created_at) VALUES (?, ?, ?, ?, NOW())',
      [orderId, status, notes || `Status updated to ${status}`, supplierId]
    );
    
    // Add order update if notes provided
    if (notes) {
      await db.query(
        'INSERT INTO order_updates (order_id, title, description, created_by, created_at) VALUES (?, ?, ?, ?, NOW())',
        [orderId, `Status: ${status}`, notes, supplierId]
      );
    }
    
    logger.info(`Order ${orderId} status updated to ${status} by supplier ${supplierId}`);
    
    return { message: 'Order status updated successfully' };
  } catch (error) {
    logger.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Add order update (supplier action)
 */
const addOrderUpdate = async (orderId, supplierId, title, description, imageUrl = null) => {
  try {
    // Check if order exists and belongs to supplier
    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND supplier_id = ?',
      [orderId, supplierId]
    );
    
    if (!order) {
      throw new ApiError(404, 'Order not found or you do not have access');
    }
    
    // Add order update
    await db.query(
      'INSERT INTO order_updates (order_id, title, description, image_url, created_by, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [orderId, title, description, imageUrl, supplierId]
    );
    
    logger.info(`Order update added for order ${orderId} by supplier ${supplierId}`);
    
    return { message: 'Order update added successfully' };
  } catch (error) {
    logger.error('Error adding order update:', error);
    throw error;
  }
};

module.exports = {
  getCustomerOrders,
  getOrderById,
  getOrderStatistics,
  cancelOrder,
  confirmDelivery,
  completeOrder,
  getSupplierOrders,
  getSupplierOrderById,
  getSupplierOrderStatistics,
  updateOrderStatus,
  addOrderUpdate,
};

