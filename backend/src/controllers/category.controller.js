const categoryService = require('../services/category.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Get all active categories
 * @route   GET /api/categories
 * @access  Public
 */
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  
  res.json(
    new ApiResponse(200, 'Categories retrieved successfully', categories)
  );
});

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  
  if (!category) {
    return res.status(404).json(
      new ApiResponse(404, 'Category not found', null)
    );
  }
  
  res.json(
    new ApiResponse(200, 'Category retrieved successfully', category)
  );
});

module.exports = {
  getAllCategories,
  getCategoryById
};

