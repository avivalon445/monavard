const db = require('../config/database');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Supplier Financial Service
 * Handles all business logic for supplier financial reports and analytics
 */

/**
 * Get comprehensive financial report for supplier
 */
const getFinancialReport = async (supplierId, filters = {}) => {
  try {
    const {
      date_from,
      date_to,
      report_type = 'summary', // summary, detailed, tax
      group_by = 'month' // day, week, month, quarter, year
    } = filters;
    
    // Set default date range if not provided
    let dateCondition = '';
    const params = [supplierId];
    
    if (date_from && date_to) {
      dateCondition = 'AND o.created_at BETWEEN ? AND ?';
      params.push(date_from, date_to);
    } else if (date_from) {
      dateCondition = 'AND o.created_at >= ?';
      params.push(date_from);
    } else if (date_to) {
      dateCondition = 'AND o.created_at <= ?';
      params.push(date_to);
    } else {
      // Default to last 12 months
      dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)';
    }
    
    // Get basic financial summary
    const [summary] = await db.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(o.commission_amount), 0) as total_commission,
        COALESCE(SUM(o.total_amount - o.commission_amount), 0) as net_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        COALESCE(MIN(o.total_amount), 0) as min_order_value,
        COALESCE(MAX(o.total_amount), 0) as max_order_value,
        COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) as completed_revenue,
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.commission_amount ELSE 0 END), 0) as completed_commission,
        COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN o.status = 'cancelled' THEN o.total_amount ELSE 0 END), 0) as cancelled_revenue
      FROM orders o
      WHERE o.supplier_id = ? ${dateCondition}
    `, params);
    
    // Get revenue by time period
    const revenueByPeriod = await getRevenueByPeriod(supplierId, group_by, dateCondition, params.slice(1));
    
    // Get revenue by category
    const revenueByCategory = await db.query(`
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
      FROM orders o
      INNER JOIN bids b ON o.bid_id = b.id
      INNER JOIN requests r ON b.request_id = r.id
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE o.supplier_id = ? ${dateCondition}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `, params);
    
    // Get payment status breakdown
    const paymentStatusBreakdown = await db.query(`
      SELECT 
        o.status,
        COUNT(*) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_amount,
        COALESCE(AVG(o.total_amount), 0) as avg_amount
      FROM orders o
      WHERE o.supplier_id = ? ${dateCondition}
      GROUP BY o.status
      ORDER BY total_amount DESC
    `, params);
    
    // Get top customers by revenue
    const topCustomers = await db.query(`
      SELECT 
        u.first_name,
        u.last_name,
        cp.company_name,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        MAX(o.created_at) as last_order_date
      FROM orders o
      INNER JOIN users u ON o.customer_id = u.id
      LEFT JOIN customer_profiles cp ON u.id = cp.user_id
      WHERE o.supplier_id = ? ${dateCondition}
      GROUP BY u.id, u.first_name, u.last_name, cp.company_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `, params);
    
    const report = {
      summary,
      revenue_by_period: revenueByPeriod,
      revenue_by_category: revenueByCategory,
      payment_status_breakdown: paymentStatusBreakdown,
      top_customers: topCustomers,
      filters: {
        date_from,
        date_to,
        report_type,
        group_by
      },
      generated_at: new Date().toISOString()
    };
    
    // Add detailed breakdown if requested
    if (report_type === 'detailed') {
      report.detailed_orders = await getDetailedOrders(supplierId, dateCondition, params.slice(1));
    }
    
    return report;
  } catch (error) {
    logger.error('Error generating financial report:', error);
    throw error;
  }
};

/**
 * Get revenue by time period
 */
const getRevenueByPeriod = async (supplierId, groupBy, dateCondition, dateParams) => {
  try {
    let dateFormat, periodName;
    
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        periodName = 'Daily';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        periodName = 'Weekly';
        break;
      case 'quarter':
        dateFormat = '%Y-%q';
        periodName = 'Quarterly';
        break;
      case 'year':
        dateFormat = '%Y';
        periodName = 'Yearly';
        break;
      default: // month
        dateFormat = '%Y-%m';
        periodName = 'Monthly';
    }
    
    const revenue = await db.query(`
      SELECT 
        DATE_FORMAT(o.created_at, '${dateFormat}') as period,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COALESCE(SUM(o.commission_amount), 0) as commission,
        COALESCE(SUM(o.total_amount - o.commission_amount), 0) as net_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value
      FROM orders o
      WHERE o.supplier_id = ? ${dateCondition}
      GROUP BY DATE_FORMAT(o.created_at, '${dateFormat}')
      ORDER BY period ASC
    `, [supplierId, ...dateParams]);
    
    return {
      period_type: periodName,
      data: revenue
    };
  } catch (error) {
    logger.error('Error fetching revenue by period:', error);
    throw error;
  }
};

/**
 * Get detailed orders for financial report
 */
const getDetailedOrders = async (supplierId, dateCondition, dateParams) => {
  try {
    const orders = await db.query(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.commission_amount,
        (o.total_amount - o.commission_amount) as net_amount,
        o.status,
        o.created_at,
        o.delivery_date,
        r.title as project_title,
        c.name as category_name,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        cp.company_name as customer_company
      FROM orders o
      INNER JOIN bids b ON o.bid_id = b.id
      INNER JOIN requests r ON b.request_id = r.id
      LEFT JOIN categories c ON r.category_id = c.id
      INNER JOIN users u ON o.customer_id = u.id
      LEFT JOIN customer_profiles cp ON u.id = cp.user_id
      WHERE o.supplier_id = ? ${dateCondition}
      ORDER BY o.created_at DESC
    `, [supplierId, ...dateParams]);
    
    return orders;
  } catch (error) {
    logger.error('Error fetching detailed orders:', error);
    throw error;
  }
};

/**
 * Get tax report for supplier
 */
const getTaxReport = async (supplierId, filters = {}) => {
  try {
    const { year = new Date().getFullYear(), country = null } = filters;
    
    const taxReport = await db.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as gross_revenue,
        COALESCE(SUM(o.commission_amount), 0) as platform_commission,
        COALESCE(SUM(o.total_amount - o.commission_amount), 0) as net_revenue,
        YEAR(o.created_at) as tax_year,
        MONTH(o.created_at) as tax_month,
        DATE_FORMAT(o.created_at, '%Y-%m') as period
      FROM orders o
      WHERE o.supplier_id = ? 
        AND YEAR(o.created_at) = ?
        AND o.status IN ('completed', 'delivered')
      GROUP BY YEAR(o.created_at), MONTH(o.created_at)
      ORDER BY tax_year DESC, tax_month DESC
    `, [supplierId, year]);
    
    // Calculate quarterly totals
    const quarterlyTotals = await db.query(`
      SELECT 
        QUARTER(o.created_at) as quarter,
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(o.total_amount), 0) as gross_revenue,
        COALESCE(SUM(o.commission_amount), 0) as platform_commission,
        COALESCE(SUM(o.total_amount - o.commission_amount), 0) as net_revenue
      FROM orders o
      WHERE o.supplier_id = ? 
        AND YEAR(o.created_at) = ?
        AND o.status IN ('completed', 'delivered')
      GROUP BY QUARTER(o.created_at)
      ORDER BY quarter ASC
    `, [supplierId, year]);
    
    // Calculate annual total
    const [annualTotal] = await db.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as annual_gross_revenue,
        COALESCE(SUM(o.commission_amount), 0) as annual_platform_commission,
        COALESCE(SUM(o.total_amount - o.commission_amount), 0) as annual_net_revenue
      FROM orders o
      WHERE o.supplier_id = ? 
        AND YEAR(o.created_at) = ?
        AND o.status IN ('completed', 'delivered')
    `, [supplierId, year]);
    
    return {
      tax_year: year,
      monthly_breakdown: taxReport,
      quarterly_totals: quarterlyTotals,
      annual_total: annualTotal,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error generating tax report:', error);
    throw error;
  }
};

/**
 * Get financial summary for dashboard
 */
const getFinancialSummary = async (supplierId, period = '30d') => {
  try {
    let dateCondition;
    switch (period) {
      case '7d':
        dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case '30d':
        dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case '90d':
        dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        break;
      case '1y':
        dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        break;
      default:
        dateCondition = 'AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }
    
    const [summary] = await db.query(`
      SELECT 
        COUNT(DISTINCT o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(o.commission_amount), 0) as total_commission,
        COALESCE(SUM(o.total_amount - o.commission_amount), 0) as net_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) as completed_revenue,
        COUNT(DISTINCT CASE WHEN o.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN o.id END) as orders_today
      FROM orders o
      WHERE o.supplier_id = ? ${dateCondition}
    `, [supplierId]);
    
    // Get previous period for comparison
    const previousPeriodCondition = dateCondition.replace('NOW()', 'DATE_SUB(NOW(), INTERVAL ' + 
      (period === '7d' ? '7' : period === '30d' ? '30' : period === '90d' ? '90' : '365') + ' DAY)') +
      ' AND o.created_at < DATE_SUB(NOW(), INTERVAL ' + 
      (period === '7d' ? '7' : period === '30d' ? '30' : period === '90d' ? '90' : '365') + ' DAY)';
    
    const [previousSummary] = await db.query(`
      SELECT 
        COUNT(DISTINCT o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(o.commission_amount), 0) as total_commission,
        COALESCE(SUM(o.total_amount - o.commission_amount), 0) as net_revenue
      FROM orders o
      WHERE o.supplier_id = ? ${previousPeriodCondition}
    `, [supplierId]);
    
    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };
    
    return {
      current_period: summary,
      previous_period: previousSummary,
      growth: {
        revenue_growth: calculateGrowth(summary.total_revenue, previousSummary.total_revenue),
        orders_growth: calculateGrowth(summary.orders_count, previousSummary.orders_count),
        net_revenue_growth: calculateGrowth(summary.net_revenue, previousSummary.net_revenue)
      },
      period,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error fetching financial summary:', error);
    throw error;
  }
};

/**
 * Get commission breakdown
 */
const getCommissionBreakdown = async (supplierId, filters = {}) => {
  try {
    const { date_from, date_to } = filters;
    
    let dateCondition = '';
    const params = [supplierId];
    
    if (date_from && date_to) {
      dateCondition = 'AND o.created_at BETWEEN ? AND ?';
      params.push(date_from, date_to);
    } else if (date_from) {
      dateCondition = 'AND o.created_at >= ?';
      params.push(date_from);
    } else if (date_to) {
      dateCondition = 'AND o.created_at <= ?';
      params.push(date_to);
    }
    
    const commissionBreakdown = await db.query(`
      SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m') as period,
        COUNT(*) as order_count,
        COALESCE(SUM(o.total_amount), 0) as gross_revenue,
        COALESCE(SUM(o.commission_amount), 0) as commission_paid,
        COALESCE(AVG(o.commission_amount / o.total_amount * 100), 0) as avg_commission_rate,
        COALESCE(SUM(o.total_amount - o.commission_amount), 0) as net_earnings
      FROM orders o
      WHERE o.supplier_id = ? ${dateCondition}
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY period DESC
    `, params);
    
    // Calculate total commission summary
    const [totalSummary] = await db.query(`
      SELECT 
        COALESCE(SUM(o.total_amount), 0) as total_gross_revenue,
        COALESCE(SUM(o.commission_amount), 0) as total_commission_paid,
        COALESCE(AVG(o.commission_amount / o.total_amount * 100), 0) as overall_commission_rate,
        COALESCE(SUM(o.total_amount - o.commission_amount), 0) as total_net_earnings
      FROM orders o
      WHERE o.supplier_id = ? ${dateCondition}
    `, params);
    
    return {
      monthly_breakdown: commissionBreakdown,
      total_summary: totalSummary,
      filters,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error fetching commission breakdown:', error);
    throw error;
  }
};

module.exports = {
  getFinancialReport,
  getTaxReport,
  getFinancialSummary,
  getCommissionBreakdown
};
