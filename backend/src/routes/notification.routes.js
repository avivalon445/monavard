const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUserNotifications,
  getUnreadCount,
  getNotificationStats,
  markAsRead,
  markAllAsRead,
  getPendingEvents,
  createNotification,
  deleteNotification,
  getNotificationTypes
} = require('../controllers/notification.controller');

// All routes require authentication
router.use(protect);

// GET /api/v1/notifications - Get user notifications with pagination and filtering
router.get('/', getUserNotifications);

// GET /api/v1/notifications/count - Get unread notification count
router.get('/count', getUnreadCount);

// GET /api/v1/notifications/stats - Get notification statistics
router.get('/stats', getNotificationStats);

// GET /api/v1/notifications/types - Get notification types
router.get('/types', getNotificationTypes);

// GET /api/v1/notifications/events - Get pending real-time events
router.get('/events', getPendingEvents);

// PUT /api/v1/notifications/:id/read - Mark notification as read
router.put('/:id/read', markAsRead);

// PUT /api/v1/notifications/read-all - Mark all notifications as read
router.put('/read-all', markAllAsRead);

// DELETE /api/v1/notifications/:id - Delete notification
router.delete('/:id', deleteNotification);

// POST /api/v1/notifications - Create notification (admin/system use)
router.post('/', authorize(['admin', 'system']), createNotification);

module.exports = router;