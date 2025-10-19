import axios from '@/utils/axios';
import { 
  Notification, 
  NotificationTypeInfo, 
  NotificationStats, 
  RealTimeEvent
} from '@/types';

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  is_read?: boolean;
  priority?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class NotificationService {
  private baseUrl = '/notifications';
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastEventId = 0;

  /**
   * Get user notifications with pagination and filtering
   */
  async getNotifications(filters: NotificationFilters = {}): Promise<NotificationResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.type) params.append('type', filters.type);
      if (filters.is_read !== undefined) params.append('is_read', filters.is_read.toString());
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);

      const response = await axios.get(`${this.baseUrl}?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/count`);
      return response.data.data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await axios.get(`${this.baseUrl}/stats`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ affected_count: number }> {
    try {
      const response = await axios.put(`${this.baseUrl}/read-all`);
      return response.data.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/${notificationId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get notification types
   */
  async getNotificationTypes(): Promise<NotificationTypeInfo[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/types`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notification types:', error);
      throw error;
    }
  }

  /**
   * Get pending real-time events
   */
  async getPendingEvents(lastEventId: number = 0): Promise<RealTimeEvent[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/events?last_event_id=${lastEventId}`);
      return response.data.data.events;
    } catch (error) {
      console.error('Error fetching pending events:', error);
      throw error;
    }
  }

  /**
   * Start polling for real-time events
   */
  startPolling(
    onNewEvents: (events: RealTimeEvent[]) => void,
    onError: (error: any) => void,
    interval: number = 5000
  ): void {
    if (this.pollingInterval) {
      this.stopPolling();
    }

    this.pollingInterval = setInterval(async () => {
      try {
        const events = await this.getPendingEvents(this.lastEventId);
        
        if (events.length > 0) {
          this.lastEventId = Math.max(...events.map(e => e.id));
          onNewEvents(events);
        }
      } catch (error) {
        onError(error);
      }
    }, interval);
  }

  /**
   * Stop polling for real-time events
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Reset polling state
   */
  resetPolling(): void {
    this.lastEventId = 0;
    this.stopPolling();
  }

  /**
   * Get notification icon identifier based on type
   */
  getNotificationIcon(notificationType: string): string {
    const icons: { [key: string]: string } = {
      bid_received: 'clipboard',
      bid_accepted: 'check-circle',
      bid_rejected: 'x-circle',
      order_update: 'package',
      payment_received: 'dollar-sign',
      message_received: 'message-circle',
      system_alert: 'alert-triangle'
    };
    return icons[notificationType] || 'bell';
  }

  /**
   * Get notification color based on type
   */
  getNotificationColor(notificationType: string): string {
    const colors: { [key: string]: string } = {
      bid_received: 'blue',
      bid_accepted: 'green',
      bid_rejected: 'red',
      order_update: 'purple',
      payment_received: 'green',
      message_received: 'blue',
      system_alert: 'orange'
    };
    return colors[notificationType] || 'gray';
  }

  /**
   * Get priority color
   */
  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      low: 'gray',
      normal: 'blue',
      high: 'orange',
      urgent: 'red'
    };
    return colors[priority] || 'gray';
  }

  /**
   * Format notification time
   */
  formatNotificationTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Check if notification is actionable (has related_id)
   */
  isActionable(notification: Notification): boolean {
    return notification.related_id !== null && notification.related_id !== undefined;
  }

  /**
   * Get action URL for notification
   */
  getActionUrl(notification: Notification): string | null {
    if (!this.isActionable(notification)) {
      return null;
    }

    const { related_type, related_id } = notification;

    switch (related_type) {
      case 'bid':
        return `/customer/bids/${related_id}`;
      case 'order':
        return `/customer/orders/${related_id}`;
      case 'request':
        return `/customer/requests/${related_id}`;
      default:
        return null;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
