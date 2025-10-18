const db = require('../config/database');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Get user notifications with pagination and filtering
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      type = null,
      is_read = null,
      priority = null,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    
    // Build WHERE conditions
    const whereConditions = ['n.user_id = ?'];
    const params = [userId];
    
    if (type) {
      whereConditions.push('n.type = ?');
      params.push(type);
    }
    
    if (is_read !== null) {
      whereConditions.push('n.is_read = ?');
      params.push(is_read ? 1 : 0);
    }
    
    if (priority) {
      whereConditions.push('n.priority = ?');
      params.push(priority);
    }

    const query = `
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.related_id,
        n.related_type,
        n.is_read,
        n.is_pushed,
        n.priority,
        n.expires_at,
        n.created_at,
        n.read_at,
        CASE 
          WHEN n.expires_at IS NOT NULL AND n.expires_at < NOW() THEN 1
          ELSE 0
        END as is_expired
      FROM notifications n
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY n.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    const notifications = await db.query(query, params);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      WHERE ${whereConditions.join(' AND ')}
    `;
    
    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = await db.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    
    return {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching user notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count for user
 */
const getUnreadCount = async (userId) => {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? 
        AND is_read = 0
        AND (expires_at IS NULL OR expires_at > NOW())
    `;
    
    const result = await db.query(query, [userId]);
    return result[0]?.count || 0;
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const query = `
      UPDATE notifications 
      SET is_read = 1, read_at = NOW()
      WHERE id = ? AND user_id = ?
    `;
    
    const result = await db.query(query, [notificationId, userId]);
    
    if (result.affectedRows === 0) {
      throw new ApiError(404, 'Notification not found or access denied');
    }
    
    logger.info(`Notification ${notificationId} marked as read by user ${userId}`);
    return { message: 'Notification marked as read' };
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for user
 */
const markAllAsRead = async (userId) => {
  try {
    const query = `
      UPDATE notifications 
      SET is_read = 1, read_at = NOW()
      WHERE user_id = ? AND is_read = 0
    `;
    
    const result = await db.query(query, [userId]);
    
    logger.info(`All notifications marked as read for user ${userId} (${result.affectedRows} notifications)`);
    return { 
      message: 'All notifications marked as read',
      affected_count: result.affectedRows
    };
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Create a new notification
 */
const createNotification = async (notificationData) => {
  try {
    const {
      user_id,
      type,
      title,
      message,
      related_id = null,
      related_type = null,
      priority = 'normal',
      expires_at = null
    } = notificationData;

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      throw new ApiError(400, 'Missing required notification fields');
    }

    const query = `
      INSERT INTO notifications (
        user_id, type, title, message, related_id, 
        related_type, priority, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      user_id, type, title, message, related_id,
      related_type, priority, expires_at
    ];
    
    const result = await db.query(query, params);
    
    // Also create real-time event
    await createRealTimeEvent({
      event_type: type,
      user_id: user_id,
      target_user_id: user_id,
      data: JSON.stringify({
        notification_id: result.insertId,
        related_id,
        related_type,
        title,
        message
      })
    });
    
    logger.info(`Notification created for user ${user_id}: ${type}`);
    return {
      id: result.insertId,
      message: 'Notification created successfully'
    };
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create real-time event
 */
const createRealTimeEvent = async (eventData) => {
  try {
    const {
      event_type,
      user_id,
      target_user_id,
      data = null
    } = eventData;

    const query = `
      INSERT INTO real_time_events (event_type, user_id, target_user_id, data)
      VALUES (?, ?, ?, ?)
    `;
    
    await db.query(query, [event_type, user_id, target_user_id, data]);
    
    logger.info(`Real-time event created: ${event_type} for user ${target_user_id}`);
  } catch (error) {
    logger.error('Error creating real-time event:', error);
    // Don't throw error for real-time events as they're not critical
  }
};

/**
 * Get pending real-time events for user
 */
const getPendingEvents = async (userId, lastEventId = 0) => {
  try {
    const query = `
      SELECT id, event_type, data, created_at
      FROM real_time_events
      WHERE target_user_id = ? 
        AND id > ?
        AND is_delivered = 0
      ORDER BY created_at ASC
      LIMIT 50
    `;
    
    const events = await db.query(query, [userId, lastEventId]);
    
    // Mark events as delivered
    if (events.length > 0) {
      const eventIds = events.map(e => e.id);
      const updateQuery = `
        UPDATE real_time_events 
        SET is_delivered = 1, delivered_at = NOW()
        WHERE id IN (${eventIds.map(() => '?').join(',')})
      `;
      
      await db.query(updateQuery, eventIds);
    }
    
    return events;
  } catch (error) {
    logger.error('Error fetching pending events:', error);
    throw error;
  }
};

/**
 * Delete expired notifications
 */
const deleteExpiredNotifications = async () => {
  try {
    const query = `
      DELETE FROM notifications 
      WHERE expires_at IS NOT NULL AND expires_at < NOW()
    `;
    
    const result = await db.query(query);
    
    if (result.affectedRows > 0) {
      logger.info(`Deleted ${result.affectedRows} expired notifications`);
    }
    
    return result.affectedRows;
  } catch (error) {
    logger.error('Error deleting expired notifications:', error);
    throw error;
  }
};

/**
 * Get notification statistics for user
 */
const getNotificationStats = async (userId) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN priority = 'high' AND is_read = 0 THEN 1 ELSE 0 END) as high_priority_unread,
        SUM(CASE WHEN type = 'bid_received' AND is_read = 0 THEN 1 ELSE 0 END) as new_bids,
        SUM(CASE WHEN type = 'order_update' AND is_read = 0 THEN 1 ELSE 0 END) as order_updates,
        SUM(CASE WHEN type = 'message_received' AND is_read = 0 THEN 1 ELSE 0 END) as new_messages
      FROM notifications
      WHERE user_id = ?
        AND (expires_at IS NULL OR expires_at > NOW())
    `;
    
    const result = await db.query(query, [userId]);
    return result[0] || {
      total: 0,
      unread: 0,
      high_priority_unread: 0,
      new_bids: 0,
      order_updates: 0,
      new_messages: 0
    };
  } catch (error) {
    logger.error('Error fetching notification stats:', error);
    throw error;
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  createRealTimeEvent,
  getPendingEvents,
  deleteExpiredNotifications,
  getNotificationStats
};
