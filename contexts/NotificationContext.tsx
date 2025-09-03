import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import notificationService from '@/services/notificationService';

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  type: 'like' | 'comment' | 'follow' | 'message' | 'system' | 'vet_reminder';
  userId: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  likeNotifications: boolean;
  commentNotifications: boolean;
  followNotifications: boolean;
  messageNotifications: boolean;
  systemNotifications: boolean;
  vetReminderNotifications: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  loading: boolean;
  error: string | null;
  
  // Notification management
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Settings management
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  
  // Notification sending (for testing)
  sendTestNotification: () => Promise<void>;
  
  // Real-time updates
  startListening: () => void;
  stopListening: () => void;
  
  // Error handling
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    followNotifications: true,
    messageNotifications: true,
    systemNotifications: true,
    vetReminderNotifications: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    initializeNotifications();
    
    return () => {
      stopListening();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setError('Bildirim izni verilmedi');
        return;
      }

      // Get push token
      if (Device.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync();
        setExpoPushToken(token.data);
        
        // Register token with backend
        await notificationService.registerPushToken(token.data);
      }

      // Load notifications
      const userNotifications = await notificationService.getUserNotifications();
      setNotifications(userNotifications);
      
      // Calculate unread count
      const unread = userNotifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
      
      // Load settings
      const userSettings = await notificationService.getNotificationSettings();
      setSettings(userSettings);
      
      // Start listening for new notifications
      startListening();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return finalStatus === 'granted';
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      setError(null);
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      setError(null);
      await notificationService.markAllAsRead();
      
      // Update local state
      const now = new Date().toISOString();
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: now,
        }))
      );
      
      setUnreadCount(0);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
      setError(null);
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prevNotifications =>
        prevNotifications.filter(n => n.id !== notificationId)
      );
      
      // Update unread count if notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const clearAllNotifications = async (): Promise<void> => {
    try {
      setError(null);
      await notificationService.clearAllNotifications();
      
      setNotifications([]);
      setUnreadCount(0);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>): Promise<void> => {
    try {
      setError(null);
      const updatedSettings = { ...settings, ...newSettings };
      
      await notificationService.updateNotificationSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sendTestNotification = async (): Promise<void> => {
    try {
      setError(null);
      await notificationService.sendTestNotification();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startListening = () => {
    // Listen for incoming notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      const newNotification: Notification = {
        id: notification.request.identifier,
        title: notification.request.content.title || '',
        body: notification.request.content.body || '',
        data: notification.request.content.data,
        type: notification.request.content.data?.type || 'system',
        userId: 'current-user-id', // This should come from auth context
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      
      setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
      setUnreadCount(prevCount => prevCount + 1);
    });

    // Listen for notification responses (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const notificationId = response.notification.request.identifier;
      markAsRead(notificationId);
      
      // Handle navigation based on notification type
      const notificationData = response.notification.request.content.data;
      if (notificationData?.type === 'message') {
        // Navigate to chat
        // router.push(`/chat/${notificationData.chatId}`);
      } else if (notificationData?.type === 'like' || notificationData?.type === 'comment') {
        // Navigate to post
        // router.push(`/post/${notificationData.postId}`);
      }
    });

    // Listen for real-time notification updates from backend
    notificationService.onNotificationReceived((notification) => {
      setNotifications(prevNotifications => [notification, ...prevNotifications]);
      setUnreadCount(prevCount => prevCount + 1);
    });

    // Cleanup function
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  };

  const stopListening = () => {
    notificationService.removeAllListeners();
  };

  const clearError = () => {
    setError(null);
  };

  // Check if we're in quiet hours
  const isQuietHours = (): boolean => {
    if (!settings.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quietHours.startTime.split(':').map(Number);
    const [endHour, endMin] = settings.quietHours.endTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  // Schedule local notification
  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: any,
    delay: number = 0
  ): Promise<void> => {
    try {
      if (!settings.pushNotifications || isQuietHours()) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: delay > 0 ? { seconds: delay } : null,
      });
    } catch (err: any) {
      console.warn('Local notification scheduling failed:', err);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    settings,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateSettings,
    requestPermissions,
    sendTestNotification,
    startListening,
    stopListening,
    clearError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}