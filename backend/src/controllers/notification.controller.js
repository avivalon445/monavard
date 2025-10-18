const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get user notifications with pagination and filtering
 */
const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    page = 1,
    limit = 20,
    type,
    is_read,
    priority,
    sort_by = 'created_at',
    sort_order = 'DESC'
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: Math.min(parseInt(limit), 100), // Cap at 100
    type,
    is_read: is_read !== undefined ? is_read === 'true' : null,
    priority,
    sort_by,
    sort_order
  };

  const result = await notificationService.getUserNotifications(userId, options);

  res.json(
    new ApiResponse(200, result, 'Notifications retrieved successfully')
  );
});

/**
 * Get unread notification count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const count = await notificationService.getUnreadCount(userId);

  res.json(
    new ApiResponse(200, { count }, 'Unread count retrieved successfully')
  );
});

/**
 * Get notification statistics
 */
const getNotificationStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const stats = await notificationService.getNotificationStats(userId);

  res.json(
    new ApiResponse(200, stats, 'Notification statistics retrieved successfully')
  );
});

/**
 * Mark notification as read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await notificationService.markAsRead(id, userId);

  res.json(
    new ApiResponse(200, result, 'Notification marked as read')
  );
});

/**
 * Mark all notifications as read
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await notificationService.markAllAsRead(userId);

  res.json(
    new ApiResponse(200, result, 'All notifications marked as read')
  );
});

/**
 * Get pending real-time events
 */
const getPendingEvents = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { last_event_id = 0 } = req.query;

  const events = await notificationService.getPendingEvents(userId, parseInt(last_event_id));

  res.json(
    new ApiResponse(200, { events }, 'Pending events retrieved successfully')
  );
});

/**
 * Create notification (for admin/system use)
 */
const createNotification = asyncHandler(async (req, res) => {
  const {
    user_id,
    type,
    title,
    message,
    related_id,
    related_type,
    priority = 'normal',
    expires_at
  } = req.body;

  const notificationData = {
    user_id,
    type,
    title,
    message,
    related_id,
    related_type,
    priority,
    expires_at
  };

  const result = await notificationService.createNotification(notificationData);

  res.status(201).json(
    new ApiResponse(201, result, 'Notification created successfully')
  );
});

/**
 * Delete notification (for admin use)
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  // Check if notification belongs to user
  const db = require('../config/database');
  const checkQuery = 'SELECT id FROM notifications WHERE id = ? AND user_id = ?';
  const checkResult = await db.query(checkQuery, [id, userId]);

  if (checkResult.length === 0) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Notification not found or access denied')
    );
  }

  const deleteQuery = 'DELETE FROM notifications WHERE id = ? AND user_id = ?';
  await db.query(deleteQuery, [id, userId]);

  res.json(
    new ApiResponse(200, null, 'Notification deleted successfully')
  );
});

/**
 * Get notification types and their descriptions
 */
const getNotificationTypes = asyncHandler(async (req, res) => {
  const types = [
    {
      value: 'bid_received',
      label: 'New Bid Received',
      description: 'You have received a new bid for your request',
      icon: 'bid',
      color: 'blue'
    },
    {
      value: 'bid_accepted',
      label: 'Bid Accepted',
      description: 'Your bid has been accepted by the customer',
      icon: 'check',
      color: 'green'
    },
    {
      value: 'bid_rejected',
      label: 'Bid Rejected',
      description: 'Your bid was not selected',
      icon: 'x',
      color: 'red'
    },
    {
      value: 'order_update',
      label: 'Order Update',
      description: 'Your order status has been updated',
      icon: 'package',
      color: 'purple'
    },
    {
      value: 'payment_received',
      label: 'Payment Received',
      description: 'Payment has been received for your order',
      icon: 'dollar',
      color: 'green'
    },
    {
      value: 'message_received',
      label: 'New Message',
      description: 'You have received a new message',
      icon: 'message',
      color: 'blue'
    },
    {
      value: 'system_alert',
      label: 'System Alert',
      description: 'Important system notification',
      icon: 'alert',
      color: 'orange'
    }
  ];

  res.json(
    new ApiResponse(200, types, 'Notification types retrieved successfully')
  );
});

module.exports = {
  getUserNotifications,
  getUnreadCount,
  getNotificationStats,
  markAsRead,
  markAllAsRead,
  getPendingEvents,
  createNotification,
  deleteNotification,
  getNotificationTypes
};
