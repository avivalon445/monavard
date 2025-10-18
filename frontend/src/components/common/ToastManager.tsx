import React, { useState, useCallback, useEffect } from 'react';
import { Notification } from '@/types';
import { useNotifications } from '@/context/NotificationContext';
import { notificationService } from '@/services/notificationService';
import NotificationToast from './NotificationToast';

interface ToastNotification extends Notification {
  toastId: string; // Unique toast ID
}

const ToastManager: React.FC = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<number>>(new Set());
  const { notifications, markAsRead } = useNotifications();

  // Convert notification to toast
  const convertToToast = useCallback((notification: Notification): ToastNotification => ({
    ...notification,
    toastId: `toast-${notification.id}-${Date.now()}`
  }), []);

  // Add new toast
  const addToast = useCallback((notification: Notification) => {
    const toast = convertToToast(notification);
    setToasts(prev => [...prev, toast]);
    setShownNotificationIds(prev => new Set(prev).add(notification.id));
  }, [convertToToast]);

  // Remove toast
  const removeToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.toastId !== toastId));
  }, []);

  // Handle toast action
  const handleToastAction = useCallback((notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate to related page
    const actionUrl = notificationService.getActionUrl(notification);
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  }, [markAsRead]);

  // Monitor for new notifications and show toasts
  useEffect(() => {
    // Get the latest notification
    const latestNotification = notifications?.[0];
    
    if (latestNotification && 
        !latestNotification.is_read && 
        !shownNotificationIds.has(latestNotification.id)) {
      
      // Only show toast for recent notifications (within last 30 seconds)
      const notificationTime = new Date(latestNotification.created_at).getTime();
      const now = Date.now();
      
      if (now - notificationTime < 30000) {
        addToast(latestNotification);
      }
    }
  }, [notifications, shownNotificationIds, addToast]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.toastId}
          notification={toast}
          onClose={() => removeToast(toast.toastId)}
          onAction={() => handleToastAction(toast)}
        />
      ))}
    </div>
  );
};

export default ToastManager;
