/**
 * useNotifications Hook
 * Phase 5.1: Advanced Notifications
 * 
 * React hook for notifications
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getNotificationsService,
  Notification,
  NotificationPreferences,
  NotificationType,
  NotificationChannel,
} from '../services/notifications.service';

export interface UseNotificationsOptions {
  autoLoad?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export interface UseNotificationsReturn {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  isLoadingNotifications: boolean;

  // Actions
  createNotification: (type: NotificationType, data?: Record<string, any>, channels?: NotificationChannel[]) => Promise<Notification>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;

  // Preferences
  preferences: NotificationPreferences | null;
  loadPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  isLoadingPreferences: boolean;

  // Push Notifications
  pushSubscription: PushSubscription | null;
  subscribeToPush: () => Promise<void>;
  unsubscribeFromPush: () => Promise<void>;
  isPushSupported: boolean;
  isPushSubscribed: boolean;

  // State
  error: string | null;
  clearError: () => void;
}

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    autoLoad = true,
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
  } = options;

  // Service
  const notificationsService = useRef(getNotificationsService());

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);

  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const [isPushSupported] = useState('serviceWorker' in navigator && 'PushManager' in window);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setError(null);
    setIsLoadingNotifications(true);
    try {
      const [notifs, count] = await Promise.all([
        notificationsService.current.getNotifications(),
        notificationsService.current.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(message);
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  // Create notification
  const createNotification = useCallback(async (
    type: NotificationType,
    data?: Record<string, any>,
    channels?: NotificationChannel[]
  ) => {
    setError(null);
    try {
      const notification = await notificationsService.current.createNotification(type, data, channels);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      return notification;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create notification';
      setError(message);
      throw err;
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    setError(null);
    try {
      await notificationsService.current.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark as read';
      setError(message);
      throw err;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    setError(null);
    try {
      await notificationsService.current.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark all as read';
      setError(message);
      throw err;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    setError(null);
    try {
      await notificationsService.current.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete notification';
      setError(message);
      throw err;
    }
  }, [notifications]);

  // Clear all
  const clearAll = useCallback(async () => {
    setError(null);
    try {
      await notificationsService.current.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear all';
      setError(message);
      throw err;
    }
  }, []);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    setError(null);
    setIsLoadingPreferences(true);
    try {
      const prefs = await notificationsService.current.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load preferences';
      setError(message);
      console.error('Failed to load preferences:', err);
    } finally {
      setIsLoadingPreferences(false);
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    setError(null);
    try {
      const prefs = await notificationsService.current.updatePreferences(updates);
      setPreferences(prefs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(message);
      throw err;
    }
  }, []);

  // Subscribe to push
  const subscribeToPush = useCallback(async () => {
    setError(null);
    try {
      const subscription = await notificationsService.current.subscribeToPush();
      setPushSubscription(subscription);
      setIsPushSubscribed(!!subscription);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe to push';
      setError(message);
      throw err;
    }
  }, []);

  // Unsubscribe from push
  const unsubscribeFromPush = useCallback(async () => {
    setError(null);
    try {
      await notificationsService.current.unsubscribeFromPush();
      setPushSubscription(null);
      setIsPushSubscribed(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe from push';
      setError(message);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load
  useEffect(() => {
    if (autoLoad) {
      loadNotifications();
      loadPreferences();
    }
  }, [autoLoad, loadNotifications, loadPreferences]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadNotifications, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loadNotifications,
    isLoadingNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    preferences,
    loadPreferences,
    updatePreferences,
    isLoadingPreferences,
    pushSubscription,
    subscribeToPush,
    unsubscribeFromPush,
    isPushSupported,
    isPushSubscribed,
    error,
    clearError,
  };
}

