const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Analytics Service
 * Provides comprehensive analytics and insights for suppliers
 */

/**
 * Get comprehensive supplier analytics
 */
const getSupplierAnalytics = async (supplierId, filters = {}) => {
  try {
    const {
      dateRange = '30d', // 7d, 30d, 90d, 1y
      categoryId = null
    } = filters;

    // Get all analytics data in parallel for better performance
    const [
      overviewMetrics,
      performanceMetrics,
      financialAnalytics,
      bidAnalytics,
      orderAnalytics,
      categoryAnalytics,
      timeSeriesData,
      topCategories,
      recentActivity,
      competitiveAnalysis
    ] = await Promise.all([
      getOverviewMetrics(supplierId, dateRange),
      getPerformanceMetrics(supplierId, dateRange),
      getFinancialAnalytics(supplierId, dateRange),
      getBidAnalytics(supplierId, dateRange, categoryId),
      getOrderAnalytics(supplierId, dateRange, categoryId),
      getCategoryAnalytics(supplierId, dateRange),
      getTimeSeriesData(supplierId, dateRange),
      getTopCategories(supplierId, dateRange),
      getRecentActivity(supplierId, 10),
      getCompetitiveAnalysis(supplierId, dateRange)
    ]);

    return {
      overview: overviewMetrics,
      performance: performanceMetrics,
      financial: financialAnalytics,
      bids: bidAnalytics,
      orders: orderAnalytics,
      categories: categoryAnalytics,
      time_series: timeSeriesData,
      top_categories: topCategories,
      recent_activity: recentActivity,
      competitive: competitiveAnalysis,
      date_range: dateRange,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error fetching supplier analytics:', error);
    throw error;
  }
};

/**
 * Get overview metrics
 */
const getOverviewMetrics = async (supplierId, dateRange) => {
  try {
    const dateCondition = getDateCondition(dateRange);
    
    const query = `
      SELECT 
        COUNT(DISTINCT b.id) as total_bids,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) as won_bids,
        COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bids,
        COUNT(DISTINCT CASE WHEN b.status = 'rejected' THEN b.id END) as rejected_bids,
        COUNT(DISTINCT r.id) as requests_bid_on,
        COALESCE(AVG(b.delivery_time_days), 0) as avg_delivery_time
      FROM bids b
      LEFT JOIN requests r ON b.request_id = r.id
      LEFT JOIN orders o ON b.id = o.bid_id
      WHERE b.supplier_id = ? AND b.created_at ${dateCondition}
    `;
    
    const [result] = await db.query(query, [supplierId]);
    
    // Calculate win rate
    const totalBids = result.total_bids || 0;
    const wonBids = result.won_bids || 0;
    const winRate = totalBids > 0 ? ((wonBids / totalBids) * 100).toFixed(1) : 0;
    
    return {
      total_bids: totalBids,
      total_orders: result.total_orders || 0,
      total_revenue: result.total_revenue || 0,
      avg_order_value: result.avg_order_value || 0,
      won_bids: wonBids,
      pending_bids: result.pending_bids || 0,
      rejected_bids: result.rejected_bids || 0,
      requests_bid_on: result.requests_bid_on || 0,
      avg_delivery_time: Math.round(result.avg_delivery_time || 0),
      win_rate: parseFloat(winRate),
      conversion_rate: totalBids > 0 ? ((wonBids / totalBids) * 100).toFixed(1) : 0
    };
  } catch (error) {
    logger.error('Error fetching overview metrics:', error);
    throw error;
  }
};

/**
 * Get performance metrics
 */
const getPerformanceMetrics = async (supplierId, dateRange) => {
  try {
    const dateCondition = getDateCondition(dateRange);
    
    const query = `
      SELECT 
        COUNT(DISTINCT b.id) as total_bids,
        COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) as accepted_bids,
        COUNT(DISTINCT CASE WHEN b.status = 'rejected' THEN b.id END) as rejected_bids,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bids,
        COALESCE(AVG(b.price), 0) as avg_bid_price,
        COALESCE(MIN(b.price), 0) as min_bid_price,
        COALESCE(MAX(b.price), 0) as max_bid_price,
        COALESCE(AVG(b.delivery_time_days), 0) as avg_delivery_time,
        COALESCE(STDDEV(b.price), 0) as price_volatility,
        COUNT(DISTINCT r.category_id) as categories_bid_on
      FROM bids b
      LEFT JOIN requests r ON b.request_id = r.id
      WHERE b.supplier_id = ? AND b.created_at ${dateCondition}
    `;
    
    const [result] = await db.query(query, [supplierId]);
    
    const totalBids = result.total_bids || 0;
    const acceptedBids = result.accepted_bids || 0;
    const rejectedBids = result.rejected_bids || 0;
    const cancelledBids = result.cancelled_bids || 0;
    
    return {
      total_bids: totalBids,
      accepted_bids: acceptedBids,
      rejected_bids: rejectedBids,
      cancelled_bids: cancelledBids,
      acceptance_rate: totalBids > 0 ? ((acceptedBids / totalBids) * 100).toFixed(1) : 0,
      rejection_rate: totalBids > 0 ? ((rejectedBids / totalBids) * 100).toFixed(1) : 0,
      cancellation_rate: totalBids > 0 ? ((cancelledBids / totalBids) * 100).toFixed(1) : 0,
      avg_bid_price: result.avg_bid_price || 0,
      min_bid_price: result.min_bid_price || 0,
      max_bid_price: result.max_bid_price || 0,
      avg_delivery_time: Math.round(result.avg_delivery_time || 0),
      price_volatility: result.price_volatility || 0,
      categories_bid_on: result.categories_bid_on || 0
    };
  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    throw error;
  }
};

/**
 * Get financial analytics
 */
const getFinancialAnalytics = async (supplierId, dateRange) => {
  try {
    const dateCondition = getDateCondition(dateRange);
    
    const query = `
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        COALESCE(MIN(o.total_amount), 0) as min_order_value,
        COALESCE(MAX(o.total_amount), 0) as max_order_value,
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) as completed_revenue,
        COALESCE(SUM(CASE WHEN o.status = 'cancelled' THEN o.total_amount ELSE 0 END), 0) as cancelled_revenue,
        COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) as cancelled_orders,
        COALESCE(AVG(DATEDIFF(o.updated_at, o.created_at)), 0) as avg_order_duration_days
      FROM orders o
      WHERE o.supplier_id = ? AND o.created_at ${dateCondition}
    `;
    
    const [result] = await db.query(query, [supplierId]);
    
    const totalOrders = result.total_orders || 0;
    const completedOrders = result.completed_orders || 0;
    const cancelledOrders = result.cancelled_orders || 0;
    
    return {
      total_orders: totalOrders,
      total_revenue: result.total_revenue || 0,
      completed_revenue: result.completed_revenue || 0,
      cancelled_revenue: result.cancelled_revenue || 0,
      avg_order_value: result.avg_order_value || 0,
      min_order_value: result.min_order_value || 0,
      max_order_value: result.max_order_value || 0,
      completed_orders: completedOrders,
      cancelled_orders: cancelledOrders,
      completion_rate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0,
      cancellation_rate: totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : 0,
      avg_order_duration_days: Math.round(result.avg_order_duration_days || 0)
    };
  } catch (error) {
    logger.error('Error fetching financial analytics:', error);
    throw error;
  }
};

/**
 * Get bid analytics
 */
const getBidAnalytics = async (supplierId, dateRange, categoryId = null) => {
  try {
    const dateCondition = getDateCondition(dateRange);
    const categoryCondition = categoryId ? 'AND r.category_id = ?' : '';
    const params = categoryId ? [supplierId, categoryId] : [supplierId];
    
    const query = `
      SELECT 
        COUNT(DISTINCT b.id) as total_bids,
        COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) as accepted_bids,
        COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bids,
        COUNT(DISTINCT CASE WHEN b.status = 'rejected' THEN b.id END) as rejected_bids,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bids,
        COALESCE(AVG(b.price), 0) as avg_bid_price,
        COALESCE(AVG(b.delivery_time_days), 0) as avg_delivery_time,
        COUNT(DISTINCT r.id) as unique_requests_bid,
        COUNT(DISTINCT r.customer_id) as unique_customers
      FROM bids b
      INNER JOIN requests r ON b.request_id = r.id
      WHERE b.supplier_id = ? AND b.created_at ${dateCondition} ${categoryCondition}
    `;
    
    const [result] = await db.query(query, params);
    
    const totalBids = result.total_bids || 0;
    const acceptedBids = result.accepted_bids || 0;
    
    return {
      total_bids: totalBids,
      accepted_bids: acceptedBids,
      pending_bids: result.pending_bids || 0,
      rejected_bids: result.rejected_bids || 0,
      cancelled_bids: result.cancelled_bids || 0,
      acceptance_rate: totalBids > 0 ? ((acceptedBids / totalBids) * 100).toFixed(1) : 0,
      avg_bid_price: result.avg_bid_price || 0,
      avg_delivery_time: Math.round(result.avg_delivery_time || 0),
      unique_requests_bid: result.unique_requests_bid || 0,
      unique_customers: result.unique_customers || 0
    };
  } catch (error) {
    logger.error('Error fetching bid analytics:', error);
    throw error;
  }
};

/**
 * Get order analytics
 */
const getOrderAnalytics = async (supplierId, dateRange, categoryId = null) => {
  try {
    const dateCondition = getDateCondition(dateRange);
    const categoryCondition = categoryId ? 'AND r.category_id = ?' : '';
    const params = categoryId ? [supplierId, categoryId] : [supplierId];
    
    const query = `
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'confirmed' THEN o.id END) as confirmed_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'in_progress' THEN o.id END) as in_progress_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'production' THEN o.id END) as production_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'shipped' THEN o.id END) as shipped_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END) as delivered_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) as cancelled_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        COALESCE(AVG(DATEDIFF(o.delivery_date, o.created_at)), 0) as avg_delivery_days
      FROM orders o
      LEFT JOIN bids b ON o.bid_id = b.id
      LEFT JOIN requests r ON b.request_id = r.id
      WHERE o.supplier_id = ? AND o.created_at ${dateCondition} ${categoryCondition}
    `;
    
    const [result] = await db.query(query, params);
    
    return {
      total_orders: result.total_orders || 0,
      confirmed_orders: result.confirmed_orders || 0,
      in_progress_orders: result.in_progress_orders || 0,
      production_orders: result.production_orders || 0,
      shipped_orders: result.shipped_orders || 0,
      delivered_orders: result.delivered_orders || 0,
      completed_orders: result.completed_orders || 0,
      cancelled_orders: result.cancelled_orders || 0,
      total_revenue: result.total_revenue || 0,
      avg_order_value: result.avg_order_value || 0,
      avg_delivery_days: Math.round(result.avg_delivery_days || 0)
    };
  } catch (error) {
    logger.error('Error fetching order analytics:', error);
    throw error;
  }
};

/**
 * Get category analytics
 */
const getCategoryAnalytics = async (supplierId, dateRange) => {
  try {
    const dateCondition = getDateCondition(dateRange);
    
    const query = `
      SELECT 
        c.id,
        c.name,
        COUNT(DISTINCT b.id) as bids_count,
        COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) as accepted_bids,
        COUNT(DISTINCT o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COALESCE(AVG(b.price), 0) as avg_bid_price,
        COALESCE(AVG(b.delivery_time_days), 0) as avg_delivery_time
      FROM categories c
      LEFT JOIN requests r ON c.id = r.category_id
      LEFT JOIN bids b ON r.id = b.request_id AND b.supplier_id = ? AND b.created_at ${dateCondition}
      LEFT JOIN orders o ON b.id = o.bid_id
      GROUP BY c.id, c.name
      HAVING bids_count > 0
      ORDER BY bids_count DESC, revenue DESC
      LIMIT 10
    `;
    
    const results = await db.query(query, [supplierId]);
    
    return results.map(row => ({
      category_id: row.id,
      category_name: row.name,
      bids_count: row.bids_count,
      accepted_bids: row.accepted_bids,
      orders_count: row.orders_count,
      revenue: row.revenue,
      avg_bid_price: row.avg_bid_price,
      avg_delivery_time: Math.round(row.avg_delivery_time),
      acceptance_rate: row.bids_count > 0 ? ((row.accepted_bids / row.bids_count) * 100).toFixed(1) : 0
    }));
  } catch (error) {
    logger.error('Error fetching category analytics:', error);
    throw error;
  }
};

/**
 * Get time series data for charts
 */
const getTimeSeriesData = async (supplierId, dateRange) => {
  try {
    const { dateFormat, groupBy } = getDateGrouping(dateRange);
    const dateCondition = getDateCondition(dateRange);
    
    const query = `
      SELECT 
        DATE_FORMAT(b.created_at, '${dateFormat}') as date,
        COUNT(DISTINCT b.id) as bids_count,
        COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) as accepted_bids,
        COUNT(DISTINCT o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as revenue
      FROM bids b
      LEFT JOIN orders o ON b.id = o.bid_id
      WHERE b.supplier_id = ? AND b.created_at ${dateCondition}
      GROUP BY DATE_FORMAT(b.created_at, '${dateFormat}')
      ORDER BY date ASC
    `;
    
    const results = await db.query(query, [supplierId]);
    
    return results.map(row => ({
      date: row.date,
      bids_count: row.bids_count,
      accepted_bids: row.accepted_bids,
      orders_count: row.orders_count,
      revenue: row.revenue,
      acceptance_rate: row.bids_count > 0 ? ((row.accepted_bids / row.bids_count) * 100).toFixed(1) : 0
    }));
  } catch (error) {
    logger.error('Error fetching time series data:', error);
    throw error;
  }
};

/**
 * Get top performing categories
 */
const getTopCategories = async (supplierId, dateRange) => {
  try {
    const dateCondition = getDateCondition(dateRange);
    
    const query = `
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT b.id) as bids_count,
        COUNT(DISTINCT o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) as won_bids,
        COALESCE(AVG(b.price), 0) as avg_bid_price
      FROM categories c
      INNER JOIN requests r ON c.id = r.category_id
      INNER JOIN bids b ON r.id = b.request_id AND b.supplier_id = ? AND b.created_at ${dateCondition}
      LEFT JOIN orders o ON b.id = o.bid_id
      GROUP BY c.id, c.name
      HAVING bids_count > 0
      ORDER BY revenue DESC, won_bids DESC
      LIMIT 5
    `;
    
    const results = await db.query(query, [supplierId]);
    
    return results.map(row => ({
      category_name: row.category_name,
      bids_count: row.bids_count,
      orders_count: row.orders_count,
      revenue: row.revenue,
      won_bids: row.won_bids,
      avg_bid_price: row.avg_bid_price,
      win_rate: row.bids_count > 0 ? ((row.won_bids / row.bids_count) * 100).toFixed(1) : 0
    }));
  } catch (error) {
    logger.error('Error fetching top categories:', error);
    throw error;
  }
};

/**
 * Get recent activity
 */
const getRecentActivity = async (supplierId, limit = 10) => {
  try {
    const query = `
      (SELECT 
        'bid' as activity_type,
        b.id as activity_id,
        b.created_at as activity_date,
        b.status as status,
        r.title as title,
        b.price as amount,
        NULL as order_id
      FROM bids b
      INNER JOIN requests r ON b.request_id = r.id
      WHERE b.supplier_id = ?
      ORDER BY b.created_at DESC
      LIMIT ?)
      
      UNION ALL
      
      (SELECT 
        'order' as activity_type,
        o.id as activity_id,
        o.created_at as activity_date,
        o.status as status,
        r.title as title,
        o.total_amount as amount,
        o.id as order_id
      FROM orders o
      INNER JOIN bids b ON o.bid_id = b.id
      INNER JOIN requests r ON b.request_id = r.id
      WHERE o.supplier_id = ?
      ORDER BY o.created_at DESC
      LIMIT ?)
      
      ORDER BY activity_date DESC
      LIMIT ?
    `;
    
    const results = await db.query(query, [supplierId, limit, supplierId, limit, limit]);
    
    return results.map(row => ({
      activity_type: row.activity_type,
      activity_id: row.activity_id,
      activity_date: row.activity_date,
      status: row.status,
      title: row.title,
      amount: row.amount,
      order_id: row.order_id
    }));
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    throw error;
  }
};

/**
 * Get competitive analysis
 */
const getCompetitiveAnalysis = async (supplierId, dateRange) => {
  try {
    const dateCondition = getDateCondition(dateRange);
    
    const query = `
      SELECT 
        COUNT(DISTINCT r.id) as total_requests,
        COUNT(DISTINCT b.id) as total_bids,
        COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) as won_bids,
        COALESCE(AVG(b.price), 0) as avg_bid_price,
        COALESCE(AVG(b.delivery_time_days), 0) as avg_delivery_time,
        COUNT(DISTINCT r.category_id) as categories_active,
        COUNT(DISTINCT r.customer_id) as customers_served
      FROM requests r
      LEFT JOIN bids b ON r.id = b.request_id AND b.supplier_id = ? AND b.created_at ${dateCondition}
      WHERE r.created_at ${dateCondition}
    `;
    
    const [result] = await db.query(query, [supplierId]);
    
    const totalRequests = result.total_requests || 0;
    const totalBids = result.total_bids || 0;
    const wonBids = result.won_bids || 0;
    
    return {
      total_requests_available: totalRequests,
      total_bids_submitted: totalBids,
      won_bids: wonBids,
      bid_participation_rate: totalRequests > 0 ? ((totalBids / totalRequests) * 100).toFixed(1) : 0,
      win_rate: totalBids > 0 ? ((wonBids / totalBids) * 100).toFixed(1) : 0,
      avg_bid_price: result.avg_bid_price || 0,
      avg_delivery_time: Math.round(result.avg_delivery_time || 0),
      categories_active: result.categories_active || 0,
      customers_served: result.customers_served || 0
    };
  } catch (error) {
    logger.error('Error fetching competitive analysis:', error);
    throw error;
  }
};

/**
 * Helper function to get date condition based on range
 */
const getDateCondition = (dateRange) => {
  const conditions = {
    '7d': '>= DATE_SUB(NOW(), INTERVAL 7 DAY)',
    '30d': '>= DATE_SUB(NOW(), INTERVAL 30 DAY)',
    '90d': '>= DATE_SUB(NOW(), INTERVAL 90 DAY)',
    '1y': '>= DATE_SUB(NOW(), INTERVAL 1 YEAR)',
    'all': '>= "1970-01-01"'
  };
  return conditions[dateRange] || conditions['30d'];
};

/**
 * Helper function to get date grouping for time series
 */
const getDateGrouping = (dateRange) => {
  const groupings = {
    '7d': { dateFormat: '%Y-%m-%d', groupBy: 'day' },
    '30d': { dateFormat: '%Y-%m-%d', groupBy: 'day' },
    '90d': { dateFormat: '%Y-%m-%d', groupBy: 'day' },
    '1y': { dateFormat: '%Y-%m', groupBy: 'month' },
    'all': { dateFormat: '%Y-%m', groupBy: 'month' }
  };
  return groupings[dateRange] || groupings['30d'];
};

module.exports = {
  getSupplierAnalytics
};
