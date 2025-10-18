const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET /api/v1/users - Get all users (admin only)
router.get('/', authorize('admin'), (req, res) => {
  res.json({ message: 'Get all users - To be implemented' });
});

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', (req, res) => {
  res.json({ message: 'Get user by ID - To be implemented' });
});

// PUT /api/v1/users/:id - Update user
router.put('/:id', (req, res) => {
  res.json({ message: 'Update user - To be implemented' });
});

// DELETE /api/v1/users/:id - Delete user (admin only)
router.delete('/:id', authorize('admin'), (req, res) => {
  res.json({ message: 'Delete user - To be implemented' });
});

module.exports = router;

