/**
 * Push Notification Service for VoiceCode Web App
 * Handles web push notifications using VAPID and service workers
 */
import { SupabaseService } from './supabase.service';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const supabaseService = new SupabaseService();

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Register service worker and subscribe to push
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return null;
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      console.warn('Push notification permission denied');
      return null;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const pushSubscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Extract keys
      const subscriptionJson = pushSubscription.toJSON();
      this.subscription = {
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh,
        auth: subscriptionJson.keys!.auth,
      };

      // Save to database
      await this.saveSubscription(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    if (!this.registration) {
      this.registration = await navigator.serviceWorker.getRegistration();
    }

    if (this.registration) {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscription(subscription.endpoint);
      }
    }

    this.subscription = null;
  }

  /**
   * Save subscription to database
   */
  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const client = supabaseService.getClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await client.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      platform: 'web',
      device_name: navigator.userAgent,
      is_active: true,
    }, {
      onConflict: 'user_id,endpoint',
    });

    if (error) throw error;
  }

  /**
   * Remove subscription from database
   */
  private async removeSubscription(endpoint: string): Promise<void> {
    const client = supabaseService.getClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    await client
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);
  }

  /**
   * Check if currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      this.registration = await navigator.serviceWorker.getRegistration();
    }

    if (!this.registration) return false;

    const subscription = await this.registration.pushManager.getSubscription();
    return subscription !== null;
  }

  /**
   * Convert VAPID key to Uint8Array
   */
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
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;

