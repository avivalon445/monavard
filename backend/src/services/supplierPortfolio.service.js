const db = require('../config/database');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Supplier Portfolio Service
 * Handles all business logic for supplier portfolio management
 */

/**
 * Get supplier portfolio items
 */
const getSupplierPortfolio = async (supplierId, filters = {}) => {
  try {
    const { category_id, is_featured, limit = 20, offset = 0 } = filters;
    
    let query = `
      SELECT 
        sp.*,
        c.name as category_name,
        sp.supplier_id as profile_id
      FROM supplier_portfolio sp
      LEFT JOIN categories c ON sp.category_id = c.id
      WHERE sp.supplier_id = ?
    `;
    const params = [supplierId];
    
    if (category_id) {
      query += ' AND sp.category_id = ?';
      params.push(category_id);
    }
    
    if (is_featured !== undefined) {
      query += ' AND sp.is_featured = ?';
      params.push(is_featured ? 1 : 0);
    }
    
    query += ' ORDER BY sp.is_featured DESC, sp.display_order ASC, sp.created_at DESC';
    
    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    
    const portfolio = await db.query(query, params);
    
    // Convert is_featured to boolean for each portfolio item
    portfolio.forEach(item => {
      item.is_featured = Boolean(item.is_featured);
    });
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM supplier_portfolio WHERE supplier_id = ?';
    const countParams = [supplierId];
    
    if (category_id) {
      countQuery += ' AND category_id = ?';
      countParams.push(category_id);
    }
    
    if (is_featured !== undefined) {
      countQuery += ' AND is_featured = ?';
      countParams.push(is_featured ? 1 : 0);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult.total;
    
    return {
      portfolio,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching supplier portfolio:', error);
    throw error;
  }
};

/**
 * Get single portfolio item
 */
const getPortfolioItem = async (supplierId, itemId) => {
  try {
    const [item] = await db.query(
      `SELECT 
        sp.*,
        c.name as category_name
       FROM supplier_portfolio sp
       LEFT JOIN categories c ON sp.category_id = c.id
       WHERE sp.id = ? AND sp.supplier_id = ?`,
      [itemId, supplierId]
    );
    
    if (!item) {
      throw new ApiError(404, 'Portfolio item not found');
    }
    
    // Convert is_featured to boolean
    item.is_featured = Boolean(item.is_featured);
    
    return item;
  } catch (error) {
    logger.error('Error fetching portfolio item:', error);
    throw error;
  }
};

/**
 * Create new portfolio item
 */
const createPortfolioItem = async (supplierId, portfolioData) => {
  try {
    const {
      title,
      description,
      category_id,
      image_url,
      project_url,
      completion_date,
      client_name,
      project_value,
      technologies,
      is_featured = false,
      display_order = 0
    } = portfolioData;
    
    // Validate required fields
    if (!title || !description) {
      throw new ApiError(400, 'Title and description are required');
    }
    
    // Convert technologies to JSON if it's an array
    const technologiesJson = technologies ? JSON.stringify(technologies) : null;
    
    // Insert portfolio item
    const result = await db.query(
      `INSERT INTO supplier_portfolio 
       (supplier_id, title, description, category_id, image_url, project_url, completion_date, 
        client_name, project_value, technologies, is_featured, display_order, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        supplierId, title, description, category_id, image_url, project_url,
        completion_date, client_name, project_value, technologiesJson, is_featured ? 1 : 0, display_order
      ]
    );
    
    const itemId = result.insertId;
    
    logger.info(`Portfolio item created for supplier ${supplierId}: ${itemId}`);
    return { id: itemId, message: 'Portfolio item created successfully' };
  } catch (error) {
    logger.error('Error creating portfolio item:', error);
    throw error;
  }
};

/**
 * Update portfolio item
 */
const updatePortfolioItem = async (supplierId, itemId, updateData) => {
  try {
    const allowedFields = [
      'title', 'description', 'category_id', 'image_url', 'project_url',
      'completion_date', 'client_name', 'project_value', 'technologies',
      'is_featured', 'display_order'
    ];
    
    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    });
    
    if (Object.keys(filteredData).length === 0) {
      throw new ApiError(400, 'No valid fields to update');
    }
    
    // Convert technologies to JSON if it's an array
    if (filteredData.technologies) {
      filteredData.technologies = JSON.stringify(filteredData.technologies);
    }
    
    // Convert boolean to int for is_featured
    if (filteredData.is_featured !== undefined) {
      filteredData.is_featured = filteredData.is_featured ? 1 : 0;
    }
    
    const setClause = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(filteredData);
    values.push(supplierId, itemId);
    
    const result = await db.query(
      `UPDATE supplier_portfolio SET ${setClause} WHERE supplier_id = ? AND id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      throw new ApiError(404, 'Portfolio item not found');
    }
    
    logger.info(`Portfolio item updated for supplier ${supplierId}: ${itemId}`);
    return { message: 'Portfolio item updated successfully' };
  } catch (error) {
    logger.error('Error updating portfolio item:', error);
    throw error;
  }
};

/**
 * Delete portfolio item
 */
const deletePortfolioItem = async (supplierId, itemId) => {
  try {
    const result = await db.query(
      'DELETE FROM supplier_portfolio WHERE supplier_id = ? AND id = ?',
      [supplierId, itemId]
    );
    
    if (result.affectedRows === 0) {
      throw new ApiError(404, 'Portfolio item not found');
    }
    
    logger.info(`Portfolio item deleted for supplier ${supplierId}: ${itemId}`);
    return { message: 'Portfolio item deleted successfully' };
  } catch (error) {
    logger.error('Error deleting portfolio item:', error);
    throw error;
  }
};

/**
 * Update portfolio item display order
 */
const updatePortfolioOrder = async (supplierId, orderData) => {
  try {
    // Start transaction
    await db.query('START TRANSACTION');
    
    try {
      for (const item of orderData) {
        await db.query(
          'UPDATE supplier_portfolio SET display_order = ? WHERE supplier_id = ? AND id = ?',
          [item.display_order, supplierId, item.id]
        );
      }
      
      await db.query('COMMIT');
      
      logger.info(`Portfolio order updated for supplier ${supplierId}`);
      return { message: 'Portfolio order updated successfully' };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Error updating portfolio order:', error);
    throw error;
  }
};

/**
 * Toggle portfolio item featured status
 */
const toggleFeaturedStatus = async (supplierId, itemId) => {
  try {
    const result = await db.query(
      'UPDATE supplier_portfolio SET is_featured = NOT is_featured WHERE supplier_id = ? AND id = ?',
      [supplierId, itemId]
    );
    
    if (result.affectedRows === 0) {
      throw new ApiError(404, 'Portfolio item not found');
    }
    
    // Get updated status
    const [item] = await db.query(
      'SELECT is_featured FROM supplier_portfolio WHERE supplier_id = ? AND id = ?',
      [supplierId, itemId]
    );
    
    logger.info(`Portfolio featured status toggled for supplier ${supplierId}: ${itemId}`);
    return { 
      is_featured: Boolean(item.is_featured),
      message: `Portfolio item ${item.is_featured ? 'featured' : 'unfeatured'} successfully`
    };
  } catch (error) {
    logger.error('Error toggling featured status:', error);
    throw error;
  }
};

/**
 * Get portfolio statistics
 */
const getPortfolioStatistics = async (supplierId) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured_items,
        COUNT(DISTINCT category_id) as categories_covered,
        MIN(created_at) as first_item_date,
        MAX(created_at) as last_item_date,
        AVG(CASE WHEN project_value IS NOT NULL THEN project_value ELSE 0 END) as avg_project_value,
        SUM(CASE WHEN project_value IS NOT NULL THEN project_value ELSE 0 END) as total_project_value
      FROM supplier_portfolio 
      WHERE supplier_id = ?
    `, [supplierId]);
    
    // Get category breakdown
    const categoryBreakdown = await db.query(`
      SELECT 
        c.name as category_name,
        COUNT(*) as item_count,
        AVG(CASE WHEN sp.project_value IS NOT NULL THEN sp.project_value ELSE 0 END) as avg_value
      FROM supplier_portfolio sp
      LEFT JOIN categories c ON sp.category_id = c.id
      WHERE sp.supplier_id = ?
      GROUP BY c.id, c.name
      ORDER BY item_count DESC
    `, [supplierId]);
    
    return {
      ...stats,
      category_breakdown: categoryBreakdown
    };
  } catch (error) {
    logger.error('Error fetching portfolio statistics:', error);
    throw error;
  }
};

/**
 * Get portfolio categories for supplier
 */
const getPortfolioCategories = async (supplierId) => {
  try {
    const categories = await db.query(`
      SELECT DISTINCT 
        c.id,
        c.name,
        COUNT(sp.id) as item_count
      FROM categories c
      INNER JOIN supplier_portfolio sp ON c.id = sp.category_id
      WHERE sp.supplier_id = ?
      GROUP BY c.id, c.name
      ORDER BY item_count DESC, c.name ASC
    `, [supplierId]);
    
    return categories;
  } catch (error) {
    logger.error('Error fetching portfolio categories:', error);
    throw error;
  }
};

module.exports = {
  getSupplierPortfolio,
  getPortfolioItem,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  updatePortfolioOrder,
  toggleFeaturedStatus,
  getPortfolioStatistics,
  getPortfolioCategories
};
