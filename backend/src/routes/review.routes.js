const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// POST /api/v1/reviews - Create review
router.post('/', (req, res) => {
  res.json({ message: 'Create review - To be implemented' });
});

// GET /api/v1/reviews/:orderId - Get reviews for an order
router.get('/:orderId', (req, res) => {
  res.json({ message: 'Get reviews for order - To be implemented' });
});

// GET /api/v1/reviews/user/:userId - Get user reviews
router.get('/user/:userId', (req, res) => {
  res.json({ message: 'Get user reviews - To be implemented' });
});

module.exports = router;

