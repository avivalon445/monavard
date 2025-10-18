const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Dashboard Service
 * Handles all business logic for dashboard metrics and data
 */

/**
 * Get customer dashboard metrics and data
 */
const getCustomerDashboard = async (customerId) => {
  try {
    // Get all metrics in parallel for better performance
    const [
      requestsMetrics,
      bidsMetrics,
      ordersMetrics,
      financialMetrics,
      recentRequests,
      recentActivity
    ] = await Promise.all([
      getRequestsMetrics(customerId),
      getBidsMetrics(customerId),
      getOrdersMetrics(customerId),
      getFinancialMetrics(customerId),
      getRecentRequests(customerId),
      getRecentActivity(customerId)
    ]);

    return {
      metrics: {
        ...requestsMetrics,
        ...bidsMetrics,
        ...ordersMetrics,
        ...financialMetrics
      },
      recent_requests: recentRequests,
      recent_activity: recentActivity
    };
  } catch (error) {
    logger.error('Error fetching customer dashboard:', error);
    throw error;
  }
};

/**
 * Get requests metrics
 */
const getRequestsMetrics = async (customerId) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status IN ('open_for_bids', 'bids_received') THEN 1 ELSE 0 END) as active_requests,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_requests,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as requests_last_7d,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as requests_last_30d
      FROM requests
      WHERE customer_id = ?
    `;
    
    const [result] = await db.query(query, [customerId]);
    return result || {
      total_requests: 0,
      active_requests: 0,
      completed_requests: 0,
      requests_last_7d: 0,
      requests_last_30d: 0
    };
  } catch (error) {
    logger.error('Error fetching requests metrics:', error);
    throw error;
  }
};

/**
 * Get bids metrics
 */
const getBidsMetrics = async (customerId) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_bids,
        SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending_bids,
        SUM(CASE WHEN b.status = 'accepted' THEN 1 ELSE 0 END) as accepted_bids,
        SUM(CASE WHEN b.status = 'rejected' THEN 1 ELSE 0 END) as rejected_bids,
        SUM(CASE WHEN b.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as bids_last_7d,
        SUM(CASE WHEN b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as bids_last_30d
      FROM bids b
      INNER JOIN requests r ON b.request_id = r.id
      WHERE r.customer_id = ?
    `;
    
    const [result] = await db.query(query, [customerId]);
    return result || {
      total_bids: 0,
      pending_bids: 0,
      accepted_bids: 0,
      rejected_bids: 0,
      bids_last_7d: 0,
      bids_last_30d: 0
    };
  } catch (error) {
    logger.error('Error fetching bids metrics:', error);
    throw error;
  }
};

/**
 * Get orders metrics
 */
const getOrdersMetrics = async (customerId) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status IN ('confirmed', 'in_progress', 'production', 'quality_check') THEN 1 ELSE 0 END) as active_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as orders_last_7d,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as orders_last_30d
      FROM orders
      WHERE customer_id = ?
    `;
    
    const [result] = await db.query(query, [customerId]);
    return result || {
      total_orders: 0,
      active_orders: 0,
      completed_orders: 0,
      cancelled_orders: 0,
      orders_last_7d: 0,
      orders_last_30d: 0
    };
  } catch (error) {
    logger.error('Error fetching orders metrics:', error);
    throw error;
  }
};

/**
 * Get financial metrics
 */
const getFinancialMetrics = async (customerId) => {
  try {
    const query = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_spent,
        COALESCE(AVG(total_amount), 0) as avg_order_amount,
        COALESCE(SUM(commission_amount), 0) as total_commissions,
        COUNT(*) as paid_orders
      FROM orders
      WHERE customer_id = ? AND status NOT IN ('cancelled', 'pending')
    `;
    
    const [result] = await db.query(query, [customerId]);
    
    // Get average bid price separately
    const bidPriceQuery = `
      SELECT COALESCE(AVG(b.price), 0) as avg_bid_price
      FROM bids b
      INNER JOIN requests r ON b.request_id = r.id
      WHERE r.customer_id = ? AND b.status != 'cancelled'
    `;
    
    const [bidResult] = await db.query(bidPriceQuery, [customerId]);
    
    return {
      total_spent: result?.total_spent || 0,
      avg_order_amount: result?.avg_order_amount || 0,
      avg_bid_price: bidResult?.avg_bid_price || 0,
      total_commissions: result?.total_commissions || 0
    };
  } catch (error) {
    logger.error('Error fetching financial metrics:', error);
    throw error;
  }
};

/**
 * Get recent requests with bid information
 */
const getRecentRequests = async (customerId) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.title,
        r.status,
        r.budget_min,
        r.budget_max,
        r.currency,
        r.created_at,
        r.delivery_date,
        COUNT(DISTINCT b.id) as bid_count,
        MIN(b.price) as min_bid_price,
        MAX(b.price) as max_bid_price,
        c.name as category_name
      FROM requests r
      LEFT JOIN bids b ON r.id = b.request_id AND b.status != 'cancelled'
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.customer_id = ?
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `;
    
    const requests = await db.query(query, [customerId]);
    return requests || [];
  } catch (error) {
    logger.error('Error fetching recent requests:', error);
    throw error;
  }
};

/**
 * Get recent activity (actions, bids, etc.)
 */
const getRecentActivity = async (customerId) => {
  try {
    const query = `
      SELECT 
        'bid_received' as activity_type,
        b.id,
        r.title as request_title,
        r.id as request_id,
        b.price,
        b.delivery_time_days,
        b.created_at,
        'pending' as status
      FROM bids b
      INNER JOIN requests r ON b.request_id = r.id
      WHERE r.customer_id = ? AND b.status = 'pending'
      
      UNION ALL
      
      SELECT 
        'request_created' as activity_type,
        r.id,
        r.title as request_title,
        r.id as request_id,
        r.budget_max as price,
        NULL as delivery_time_days,
        r.created_at,
        r.status
      FROM requests r
      WHERE r.customer_id = ?
      
      UNION ALL
      
      SELECT 
        'order_update' as activity_type,
        o.id,
        r.title as request_title,
        r.id as request_id,
        o.total_amount as price,
        NULL as delivery_time_days,
        o.updated_at as created_at,
        o.status
      FROM orders o
      INNER JOIN bids b ON o.bid_id = b.id
      INNER JOIN requests r ON b.request_id = r.id
      WHERE o.customer_id = ?
      
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const activity = await db.query(query, [customerId, customerId, customerId]);
    return activity || [];
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    throw error;
  }
};

/**
 * Get supplier dashboard metrics and data
 */
const getSupplierDashboard = async (supplierId) => {
  try {
    // Get all metrics in parallel for better performance
    const [
      bidsMetrics,
      requestsMetrics,
      ordersMetrics,
      financialMetrics,
      recentBids,
      availableRequests,
      recentActivity
    ] = await Promise.all([
      getSupplierBidsMetrics(supplierId),
      getSupplierRequestsMetrics(supplierId),
      getSupplierOrdersMetrics(supplierId),
      getSupplierFinancialMetrics(supplierId),
      getSupplierRecentBids(supplierId),
      getSupplierAvailableRequests(supplierId),
      getSupplierRecentActivity(supplierId)
    ]);

    return {
      metrics: {
        ...bidsMetrics,
        ...requestsMetrics,
        ...ordersMetrics,
        ...financialMetrics
      },
      recent_bids: recentBids,
      available_requests: availableRequests,
      recent_activity: recentActivity
    };
  } catch (error) {
    logger.error('Error fetching supplier dashboard:', error);
    throw error;
  }
};

/**
 * Get supplier bids metrics
 */
const getSupplierBidsMetrics = async (supplierId) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_bids,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bids,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_bids,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_bids,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bids,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as bids_last_7d,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as bids_last_30d,
        COALESCE(AVG(price), 0) as avg_bid_price,
        COALESCE(MIN(price), 0) as min_bid_price,
        COALESCE(MAX(price), 0) as max_bid_price,
        COALESCE(AVG(delivery_time_days), 0) as avg_delivery_time,
        CASE 
          WHEN COUNT(*) = 0 THEN 0 
          ELSE ROUND((SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) 
        END as win_rate
      FROM bids
      WHERE supplier_id = ?
    `;
    
    const [result] = await db.query(query, [supplierId]);
    return result || {
      total_bids: 0,
      pending_bids: 0,
      accepted_bids: 0,
      rejected_bids: 0,
      cancelled_bids: 0,
      bids_last_7d: 0,
      bids_last_30d: 0,
      avg_bid_price: 0,
      min_bid_price: 0,
      max_bid_price: 0,
      avg_delivery_time: 0,
      win_rate: 0
    };
  } catch (error) {
    logger.error('Error fetching supplier bids metrics:', error);
    throw error;
  }
};

/**
 * Get supplier requests metrics (requests they've bid on)
 */
const getSupplierRequestsMetrics = async (supplierId) => {
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT r.id) as requests_bid_on,
        SUM(CASE WHEN r.status IN ('open_for_bids', 'bids_received') THEN 1 ELSE 0 END) as active_requests_bid_on,
        SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_requests_bid_on,
        SUM(CASE WHEN b.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as requests_bid_last_7d,
        SUM(CASE WHEN b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as requests_bid_last_30d
      FROM bids b
      INNER JOIN requests r ON b.request_id = r.id
      WHERE b.supplier_id = ?
    `;
    
    const [result] = await db.query(query, [supplierId]);
    return result || {
      requests_bid_on: 0,
      active_requests_bid_on: 0,
      completed_requests_bid_on: 0,
      requests_bid_last_7d: 0,
      requests_bid_last_30d: 0
    };
  } catch (error) {
    logger.error('Error fetching supplier requests metrics:', error);
    throw error;
  }
};

/**
 * Get supplier orders metrics
 */
const getSupplierOrdersMetrics = async (supplierId) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status IN ('confirmed', 'in_progress', 'production', 'quality_check') THEN 1 ELSE 0 END) as active_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as orders_last_7d,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as orders_last_30d
      FROM orders
      WHERE supplier_id = ?
    `;
    
    const [result] = await db.query(query, [supplierId]);
    return result || {
      total_orders: 0,
      active_orders: 0,
      completed_orders: 0,
      cancelled_orders: 0,
      orders_last_7d: 0,
      orders_last_30d: 0
    };
  } catch (error) {
    logger.error('Error fetching supplier orders metrics:', error);
    throw error;
  }
};

/**
 * Get supplier financial metrics
 */
const getSupplierFinancialMetrics = async (supplierId) => {
  try {
    const query = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_order_amount,
        COALESCE(SUM(commission_amount), 0) as total_commissions_paid,
        COUNT(*) as completed_orders_count
      FROM orders
      WHERE supplier_id = ? AND status = 'completed'
    `;
    
    const [result] = await db.query(query, [supplierId]);
    return result || {
      total_revenue: 0,
      avg_order_amount: 0,
      total_commissions_paid: 0,
      completed_orders_count: 0
    };
  } catch (error) {
    logger.error('Error fetching supplier financial metrics:', error);
    throw error;
  }
};

/**
 * Get supplier recent bids
 */
const getSupplierRecentBids = async (supplierId) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.price,
        b.delivery_time_days,
        b.status,
        b.created_at,
        r.id as request_id,
        r.title as request_title,
        r.budget_min,
        r.budget_max,
        r.currency,
        c.name as category_name
      FROM bids b
      INNER JOIN requests r ON b.request_id = r.id
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE b.supplier_id = ?
      ORDER BY b.created_at DESC
      LIMIT 5
    `;
    
    const bids = await db.query(query, [supplierId]);
    return bids || [];
  } catch (error) {
    logger.error('Error fetching supplier recent bids:', error);
    throw error;
  }
};

/**
 * Get available requests for supplier (requests they haven't bid on)
 */
const getSupplierAvailableRequests = async (supplierId) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.title,
        r.description,
        r.budget_min,
        r.budget_max,
        r.currency,
        r.delivery_date,
        r.created_at,
        c.name as category_name,
        (SELECT COUNT(*) FROM bids b WHERE b.request_id = r.id) as bid_count
      FROM requests r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.status IN ('open_for_bids', 'bids_received') 
        AND r.expires_at > NOW()
        AND NOT EXISTS (
          SELECT 1 FROM bids b 
          WHERE b.request_id = r.id AND b.supplier_id = ?
        )
      ORDER BY r.created_at DESC
      LIMIT 5
    `;
    
    const requests = await db.query(query, [supplierId]);
    return requests || [];
  } catch (error) {
    logger.error('Error fetching supplier available requests:', error);
    throw error;
  }
};

/**
 * Get supplier recent activity
 */
const getSupplierRecentActivity = async (supplierId) => {
  try {
    // Get recent bid activities
    const bidActivityQuery = `
      SELECT 
        'bid_submitted' as activity_type,
        'Bid submitted' as action,
        r.title as project_name,
        b.created_at,
        b.status,
        r.id as request_id
      FROM bids b
      INNER JOIN requests r ON b.request_id = r.id
      WHERE b.supplier_id = ?
      ORDER BY b.created_at DESC
      LIMIT 3
    `;
    
    // Get recent order activities
    const orderActivityQuery = `
      SELECT 
        'order_created' as activity_type,
        'Order received' as action,
        r.title as project_name,
        o.created_at,
        o.status,
        o.id as order_id
      FROM orders o
      INNER JOIN bids b ON o.bid_id = b.id
      INNER JOIN requests r ON b.request_id = r.id
      WHERE o.supplier_id = ?
      ORDER BY o.created_at DESC
      LIMIT 2
    `;
    
    const [bidActivities, orderActivities] = await Promise.all([
      db.query(bidActivityQuery, [supplierId]),
      db.query(orderActivityQuery, [supplierId])
    ]);
    
    // Combine and sort activities
    const allActivities = [...(bidActivities || []), ...(orderActivities || [])];
    allActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return allActivities.slice(0, 5);
  } catch (error) {
    logger.error('Error fetching supplier recent activity:', error);
    throw error;
  }
};

module.exports = {
  getCustomerDashboard,
  getSupplierDashboard,
};

