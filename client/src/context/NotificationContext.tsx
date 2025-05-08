import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning';  // Only warning type for budget and large expense alerts
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  // Derive WebSocket URL from API URL
  const WS_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('http', 'ws')
    : 'ws://localhost:3002';

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      console.log('Received WebSocket message:', event.data);
      const data = JSON.parse(event.data);
      
      // Only handle warning notifications (budget limits and large expenses)
      if (data.type === 'warning') {
        // Create new notification
        const newNotification: Notification = {
          id: Date.now().toString(),
          title: data.title,
          message: data.message,
          type: 'warning',
          timestamp: new Date(),
          read: false,
        };

        // Add to notifications list
        setNotifications(prev => [newNotification, ...prev]);

        // Show toast
        toast({
          title: data.title,
          description: data.message,
          variant: 'destructive',
        });
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [toast, WS_URL]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      markAsRead, 
      clearAll, 
      unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 