const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const supplierPortfolioController = require('../controllers/supplierPortfolio.controller');
const { validateJoi } = require('../middleware/validator');
const { 
  portfolioItemSchema,
  updatePortfolioItemSchema,
  portfolioOrderSchema
} = require('../validators/supplier.validator');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('supplier'));

// Portfolio routes
router.get('/', supplierPortfolioController.getSupplierPortfolio);
router.get('/stats', supplierPortfolioController.getPortfolioStatistics);
router.get('/categories', supplierPortfolioController.getPortfolioCategories);
router.get('/:id', supplierPortfolioController.getPortfolioItem);

// Portfolio item management
router.post('/', validateJoi(portfolioItemSchema, 'body'), supplierPortfolioController.createPortfolioItem);
router.put('/:id', validateJoi(updatePortfolioItemSchema, 'body'), supplierPortfolioController.updatePortfolioItem);
router.delete('/:id', supplierPortfolioController.deletePortfolioItem);

// Portfolio management
router.put('/:id/featured', supplierPortfolioController.toggleFeaturedStatus);
router.put('/order', validateJoi(portfolioOrderSchema, 'body'), supplierPortfolioController.updatePortfolioOrder);

module.exports = router;
