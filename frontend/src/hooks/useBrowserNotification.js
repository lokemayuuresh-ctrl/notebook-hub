import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export const useBrowserNotification = () => {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = useCallback((title, body, onClick) => {
    // Always show toast notification
    toast(title, { description: body });

    // Also send browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  return { sendNotification, requestPermission };
};
