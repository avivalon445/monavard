import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import { Notification, NotificationStats, RealTimeEvent } from '@/types';

// State interface
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;
  isPolling: boolean;
  lastEventId: number;
}

// Action types
type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: number; updates: Partial<Notification> } }
  | { type: 'REMOVE_NOTIFICATION'; payload: number }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'SET_STATS'; payload: NotificationStats }
  | { type: 'SET_POLLING'; payload: boolean }
  | { type: 'SET_LAST_EVENT_ID'; payload: number }
  | { type: 'CLEAR_NOTIFICATIONS' };

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  stats: null,
  isLoading: false,
  error: null,
  isPolling: false,
  lastEventId: 0,
};

// Reducer
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    
    case 'ADD_NOTIFICATIONS':
      return { 
        ...state, 
        notifications: [...action.payload, ...state.notifications]
      };
    
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, ...action.payload.updates }
            : notification
        ),
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'SET_POLLING':
      return { ...state, isPolling: action.payload };
    
    case 'SET_LAST_EVENT_ID':
      return { ...state, lastEventId: action.payload };
    
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [], unreadCount: 0 };
    
    default:
      return state;
  }
};

// Context interface
interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;
  isPolling: boolean;

  // Actions
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchStats: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  clearError: () => void;
  refreshNotifications: () => Promise<void>;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Fetch notifications
  const fetchNotifications = useCallback(async (page: number = 1, limit: number = 20) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await notificationService.getNotifications({ page, limit });
      dispatch({ type: 'SET_NOTIFICATIONS', payload: response.notifications });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to fetch notifications' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      dispatch({ type: 'SET_UNREAD_COUNT', payload: count });
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const stats = await notificationService.getStats();
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error: any) {
      console.error('Error fetching notification stats:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      dispatch({ 
        type: 'UPDATE_NOTIFICATION', 
        payload: { 
          id, 
          updates: { is_read: true, read_at: new Date().toISOString() } 
        } 
      });
      
      // Update unread count
      if (state.unreadCount > 0) {
        dispatch({ type: 'SET_UNREAD_COUNT', payload: state.unreadCount - 1 });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to mark notification as read' });
    }
  }, [state.unreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update all notifications to read
      dispatch({
        type: 'UPDATE_NOTIFICATION',
        payload: {
          id: -1, // Special ID to update all
          updates: { is_read: true, read_at: new Date().toISOString() }
        }
      });
      
      dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to mark all notifications as read' });
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
      
      // Update unread count if the deleted notification was unread
      const notification = state.notifications.find(n => n.id === id);
      if (notification && !notification.is_read && state.unreadCount > 0) {
        dispatch({ type: 'SET_UNREAD_COUNT', payload: state.unreadCount - 1 });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to delete notification' });
    }
  }, [state.notifications, state.unreadCount]);

  // Start polling
  const startPolling = useCallback(() => {
    if (state.isPolling) return;

    dispatch({ type: 'SET_POLLING', payload: true });

    notificationService.startPolling(
      (events: RealTimeEvent[]) => {
        // Handle new events
        if (events.length > 0) {
          dispatch({ type: 'SET_LAST_EVENT_ID', payload: Math.max(...events.map(e => e.id)) });
          
          // Refresh notifications and unread count when new events arrive
          fetchNotifications();
          fetchUnreadCount();
        }
      },
      (error: any) => {
        console.error('Polling error:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Connection error' });
      },
      5000 // Poll every 5 seconds
    );
  }, [state.isPolling, fetchNotifications, fetchUnreadCount]);

  // Stop polling
  const stopPolling = useCallback(() => {
    notificationService.stopPolling();
    dispatch({ type: 'SET_POLLING', payload: false });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount(),
      fetchStats()
    ]);
  }, [fetchNotifications, fetchUnreadCount, fetchStats]);

  // Initial load
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const contextValue: NotificationContextType = {
    // State
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    stats: state.stats,
    isLoading: state.isLoading,
    error: state.error,
    isPolling: state.isPolling,

    // Actions
    fetchNotifications,
    fetchUnreadCount,
    fetchStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startPolling,
    stopPolling,
    clearError,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
