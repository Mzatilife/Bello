import React, { useState, useEffect } from 'react';
import NotificationModal from './NotificationModal';
import { notificationService, NotificationOptions } from '@/lib/notificationService';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  const [notification, setNotification] = useState<NotificationOptions | null>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((options) => {
      setNotification(options);
    });

    return unsubscribe;
  }, []);

  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <>
      {children}
      {notification && (
        <NotificationModal
          visible={true}
          onClose={closeNotification}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          buttons={notification.buttons}
          autoClose={notification.autoClose}
          autoCloseDelay={notification.autoCloseDelay}
        />
      )}
    </>
  );
}
