/**
 * Advanced Notifications Service
 * Phase 5.1: Advanced Notifications
 * 
 * Handles push notifications, email notifications, SMS notifications
 */

import { getSupabaseService } from './supabase.service';

// =====================================================
// TYPES
// =====================================================

export type NotificationType = 
  | 'transcript_complete' 
  | 'audio_processed' 
  | 'export_ready'
  | 'ai_analysis_complete'
  | 'comment_added'
  | 'mention'
  | 'share_received'
  | 'workspace_invite'
  | 'report_ready'
  | 'system_alert'
  | 'security_alert';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  data?: Record<string, any>;
  is_read: boolean;
  is_sent: boolean;
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  digest_mode: boolean;
  digest_frequency: 'daily' | 'weekly' | 'never';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string; // HH:MM format
  notification_types: Record<NotificationType, boolean>;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
}

// =====================================================
// NOTIFICATION TEMPLATES
// =====================================================

const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  transcript_complete: {
    type: 'transcript_complete',
    title: 'Transcript Complete',
    message: 'Your transcript "{{title}}" is ready!',
    priority: 'normal',
    channels: ['push', 'in_app'],
  },
  audio_processed: {
    type: 'audio_processed',
    title: 'Audio Processed',
    message: 'Your audio file "{{filename}}" has been processed.',
    priority: 'normal',
    channels: ['push', 'in_app'],
  },
  export_ready: {
    type: 'export_ready',
    title: 'Export Ready',
    message: 'Your export is ready for download.',
    priority: 'normal',
    channels: ['push', 'email', 'in_app'],
  },
  ai_analysis_complete: {
    type: 'ai_analysis_complete',
    title: 'AI Analysis Complete',
    message: 'AI analysis for "{{title}}" is complete.',
    priority: 'normal',
    channels: ['push', 'in_app'],
  },
  comment_added: {
    type: 'comment_added',
    title: 'New Comment',
    message: '{{user}} commented on "{{title}}"',
    priority: 'normal',
    channels: ['push', 'email', 'in_app'],
  },
  mention: {
    type: 'mention',
    title: 'You were mentioned',
    message: '{{user}} mentioned you in a comment',
    priority: 'high',
    channels: ['push', 'email', 'in_app'],
  },
  share_received: {
    type: 'share_received',
    title: 'Transcript Shared',
    message: '{{user}} shared "{{title}}" with you',
    priority: 'normal',
    channels: ['push', 'email', 'in_app'],
  },
  workspace_invite: {
    type: 'workspace_invite',
    title: 'Workspace Invitation',
    message: '{{user}} invited you to join "{{workspace}}"',
    priority: 'high',
    channels: ['push', 'email', 'in_app'],
  },
  report_ready: {
    type: 'report_ready',
    title: 'Report Ready',
    message: 'Your {{type}} report is ready',
    priority: 'normal',
    channels: ['email', 'in_app'],
  },
  system_alert: {
    type: 'system_alert',
    title: 'System Alert',
    message: '{{message}}',
    priority: 'normal',
    channels: ['push', 'in_app'],
  },
  security_alert: {
    type: 'security_alert',
    title: 'Security Alert',
    message: '{{message}}',
    priority: 'urgent',
    channels: ['push', 'email', 'sms', 'in_app'],
  },
};

// =====================================================
// NOTIFICATIONS SERVICE
// =====================================================

export class NotificationsService {
  private supabase = getSupabaseService();
  private pushSubscription: PushSubscription | null = null;

  // =====================================================
  // NOTIFICATION CREATION
  // =====================================================

  async createNotification(
    type: NotificationType,
    data: Record<string, any> = {},
    customChannels?: NotificationChannel[]
  ): Promise<Notification> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get template
    const template = NOTIFICATION_TEMPLATES[type];
    
    // Replace placeholders in title and message
    const title = this.replacePlaceholders(template.title, data);
    const message = this.replacePlaceholders(template.message, data);

    // Get user preferences
    const preferences = await this.getPreferences();
    
    // Determine channels based on preferences
    const channels = customChannels || this.getEnabledChannels(template.channels, preferences, type);

    // Check quiet hours
    if (preferences.quiet_hours_enabled && this.isQuietHours(preferences)) {
      // Only send urgent notifications during quiet hours
      if (template.priority !== 'urgent') {
        return this.queueNotification(type, title, message, template.priority, channels, data);
      }
    }

    // Create notification
    const { data: notification, error } = await this.supabase.client
      .from('notifications')
      .insert({
        user_id: user.id,
        type,
        title,
        message,
        priority: template.priority,
        channels,
        data,
        is_read: false,
        is_sent: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification through channels
    await this.sendNotification(notification);

    return notification;
  }

  private replacePlaceholders(text: string, data: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
  }

  private getEnabledChannels(
    defaultChannels: NotificationChannel[],
    preferences: NotificationPreferences,
    type: NotificationType
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    // Check if notification type is enabled
    if (!preferences.notification_types[type]) {
      return ['in_app']; // Always show in-app
    }

    for (const channel of defaultChannels) {
      if (channel === 'push' && preferences.push_enabled) channels.push('push');
      if (channel === 'email' && preferences.email_enabled) channels.push('email');
      if (channel === 'sms' && preferences.sms_enabled) channels.push('sms');
      if (channel === 'in_app' && preferences.in_app_enabled) channels.push('in_app');
    }

    return channels.length > 0 ? channels : ['in_app'];
  }

  private isQuietHours(preferences: NotificationPreferences): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = preferences.quiet_hours_start;
    const end = preferences.quiet_hours_end;

    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Quiet hours span midnight
      return currentTime >= start || currentTime <= end;
    }
  }

  private async queueNotification(
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority,
    channels: NotificationChannel[],
    data: Record<string, any>
  ): Promise<Notification> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data: notification, error } = await this.supabase.client
      .from('notifications')
      .insert({
        user_id: user.id,
        type,
        title,
        message,
        priority,
        channels,
        data,
        is_read: false,
        is_sent: false,
      })
      .select()
      .single();

    if (error) throw error;
    return notification;
  }

  // =====================================================
  // NOTIFICATION SENDING
  // =====================================================

  private async sendNotification(notification: Notification): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const channel of notification.channels) {
      if (channel === 'push') {
        promises.push(this.sendPushNotification(notification));
      } else if (channel === 'email') {
        promises.push(this.sendEmailNotification(notification));
      } else if (channel === 'sms') {
        promises.push(this.sendSMSNotification(notification));
      }
    }

    await Promise.allSettled(promises);

    // Mark as sent
    await this.supabase.client
      .from('notifications')
      .update({ is_sent: true, sent_at: new Date().toISOString() })
      .eq('id', notification.id);
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    if (!this.pushSubscription) {
      console.warn('Push subscription not available');
      return;
    }

    try {
      // In a real implementation, this would call your push notification service
      // For now, we'll use the Web Push API
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // This would be handled by your service worker
        console.log('Push notification sent:', notification.title);
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      // Call Supabase Edge Function to send email
      const { error } = await this.supabase.client.functions.invoke('send-email', {
        body: {
          notification_id: notification.id,
          title: notification.title,
          message: notification.message,
          data: notification.data,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  private async sendSMSNotification(notification: Notification): Promise<void> {
    try {
      // Call Supabase Edge Function to send SMS
      const { error } = await this.supabase.client.functions.invoke('send-sms', {
        body: {
          notification_id: notification.id,
          message: `${notification.title}: ${notification.message}`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
    }
  }

  // =====================================================
  // PUSH SUBSCRIPTION
  // =====================================================

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      });

      this.pushSubscription = subscription;

      // Save subscription to database
      await this.savePushSubscription(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<void> {
    if (!this.pushSubscription) return;

    try {
      await this.pushSubscription.unsubscribe();
      this.pushSubscription = null;

      // Remove subscription from database
      await this.removePushSubscription();
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }

  private async savePushSubscription(subscription: PushSubscription): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) return;

    await this.supabase.client
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: subscription.toJSON(),
      });
  }

  private async removePushSubscription(): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) return;

    await this.supabase.client
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id);
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // =====================================================
  // NOTIFICATION RETRIEVAL
  // =====================================================

  async getNotifications(limit: number = 50): Promise<Notification[]> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getUnreadCount(): Promise<number> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { count, error } = await this.supabase.client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.supabase.client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);
  }

  async markAllAsRead(): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await this.supabase.client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.supabase.client
      .from('notifications')
      .delete()
      .eq('id', notificationId);
  }

  async clearAll(): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await this.supabase.client
      .from('notifications')
      .delete()
      .eq('user_id', user.id);
  }

  // =====================================================
  // PREFERENCES
  // =====================================================

  async getPreferences(): Promise<NotificationPreferences> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.client
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      // Return default preferences
      return this.getDefaultPreferences();
    }

    return data;
  }

  async updatePreferences(updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.client
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private getDefaultPreferences(): NotificationPreferences {
    const notificationTypes: Record<NotificationType, boolean> = {
      transcript_complete: true,
      audio_processed: true,
      export_ready: true,
      ai_analysis_complete: true,
      comment_added: true,
      mention: true,
      share_received: true,
      workspace_invite: true,
      report_ready: true,
      system_alert: true,
      security_alert: true,
    };

    return {
      user_id: '',
      push_enabled: true,
      email_enabled: true,
      sms_enabled: false,
      in_app_enabled: true,
      digest_mode: false,
      digest_frequency: 'daily',
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      notification_types: notificationTypes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

// Singleton instance
let notificationsServiceInstance: NotificationsService | null = null;

export function getNotificationsService(): NotificationsService {
  if (!notificationsServiceInstance) {
    notificationsServiceInstance = new NotificationsService();
  }
  return notificationsServiceInstance;
}

