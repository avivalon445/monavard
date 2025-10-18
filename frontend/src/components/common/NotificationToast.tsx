import React, { useState, useEffect } from 'react';
import { Notification } from '@/types';
import { notificationService } from '@/services/notificationService';
import NotificationIcon from './NotificationIcon';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onAction
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show toast with animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-hide after 5 seconds
    const autoHideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoHideTimer);
    };
  }, [onClose]);

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getToastStyles = () => {
    const baseStyles = 'fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border transition-all duration-300 ease-in-out';
    
    if (isVisible) {
      return `${baseStyles} transform translate-x-0 opacity-100`;
    } else {
      return `${baseStyles} transform translate-x-full opacity-0`;
    }
  };

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-4 border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-4 border-l-orange-500 bg-orange-50';
      case 'normal':
        return 'border-l-4 border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-4 border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-50';
    }
  };

  const getIconColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'normal':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-blue-600';
    }
  };

  const isActionable = notificationService.isActionable(notification);
  const actionUrl = notificationService.getActionUrl(notification);

  return (
    <div className={getToastStyles()}>
      <div className={`p-4 ${getPriorityStyles()}`}>
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getIconColor()}`}>
            <NotificationIcon type={notificationService.getNotificationIcon(notification.type)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {notification.message}
                </p>
              </div>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Actions */}
            {isActionable && actionUrl && (
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleAction}
                  className="text-xs bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700 transition-colors duration-150"
                >
                  View Details
                </button>
                <button
                  onClick={onClose}
                  className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 transition-colors duration-150"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Time */}
            <p className="text-xs text-gray-500 mt-2">
              {notificationService.formatNotificationTime(notification.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
