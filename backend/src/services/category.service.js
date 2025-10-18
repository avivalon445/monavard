const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Category Service
 * Handles category-related operations
 */

/**
 * Get all active categories
 */
const getAllCategories = async () => {
  try {
    const categories = await db.query(
      `SELECT id, name, description, parent_id, is_active, created_at, updated_at
       FROM categories
       WHERE is_active = 1
       ORDER BY name ASC`
    );
    
    return categories;
  } catch (error) {
    logger.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Get category by ID
 */
const getCategoryById = async (categoryId) => {
  try {
    const categories = await db.query(
      `SELECT id, name, description, parent_id, is_active, created_at, updated_at
       FROM categories
       WHERE id = ? AND is_active = 1`,
      [categoryId]
    );
    
    return categories[0] || null;
  } catch (error) {
    logger.error('Error fetching category by ID:', error);
    throw error;
  }
};

module.exports = {
  getAllCategories,
  getCategoryById
};

