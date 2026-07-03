/**
 * Notification Settings Component
 * Phase 5.1: Advanced Notifications
 * 
 * Manage notification preferences
 */

import React, { useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationType } from '../services/notifications.service';

export const NotificationSettings: React.FC = () => {
  const {
    preferences,
    loadPreferences,
    updatePreferences,
    isLoadingPreferences,
    subscribeToPush,
    unsubscribeFromPush,
    isPushSupported,
    isPushSubscribed,
    error,
    clearError,
  } = useNotifications({ autoLoad: true, autoRefresh: false });

  const [localPreferences, setLocalPreferences] = useState(preferences);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    if (!localPreferences) return;
    
    const updates = { [key]: value };
    setLocalPreferences({ ...localPreferences, ...updates });
    
    try {
      await updatePreferences(updates);
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  const handleNotificationTypeToggle = async (type: NotificationType, enabled: boolean) => {
    if (!localPreferences) return;
    
    const notificationTypes = {
      ...localPreferences.notification_types,
      [type]: enabled,
    };
    
    setLocalPreferences({ ...localPreferences, notification_types: notificationTypes });
    
    try {
      await updatePreferences({ notification_types: notificationTypes });
    } catch (err) {
      console.error('Failed to update notification type:', err);
    }
  };

  const handleTimeChange = async (key: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    if (!localPreferences) return;
    
    const updates = { [key]: value };
    setLocalPreferences({ ...localPreferences, ...updates });
    
    try {
      await updatePreferences(updates);
    } catch (err) {
      console.error('Failed to update time:', err);
    }
  };

  const handleDigestFrequencyChange = async (frequency: 'daily' | 'weekly' | 'never') => {
    if (!localPreferences) return;
    
    setLocalPreferences({ ...localPreferences, digest_frequency: frequency });
    
    try {
      await updatePreferences({ digest_frequency: frequency });
    } catch (err) {
      console.error('Failed to update digest frequency:', err);
    }
  };

  const handlePushToggle = async () => {
    if (isPushSubscribed) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
    }
  };

  if (isLoadingPreferences) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        Loading preferences...
      </div>
    );
  }

  if (!localPreferences) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        Failed to load preferences
      </div>
    );
  }

  const notificationTypeLabels: Record<NotificationType, string> = {
    transcript_complete: 'Transcript Complete',
    audio_processed: 'Audio Processed',
    export_ready: 'Export Ready',
    ai_analysis_complete: 'AI Analysis Complete',
    comment_added: 'New Comments',
    mention: 'Mentions',
    share_received: 'Shared Transcripts',
    workspace_invite: 'Workspace Invitations',
    report_ready: 'Reports Ready',
    system_alert: 'System Alerts',
    security_alert: 'Security Alerts',
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔔 Notification Settings</h1>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          color: '#721c24',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span><strong>Error:</strong> {error}</span>
          <button
            onClick={clearError}
            style={{
              padding: '5px 10px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Channels */}
      <div style={{
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}>
        <h2 style={{ marginTop: 0 }}>Notification Channels</h2>
        
        {/* Push Notifications */}
        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>Push Notifications</div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {isPushSupported ? 'Receive push notifications in your browser' : 'Not supported in this browser'}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: isPushSupported ? 'pointer' : 'not-allowed' }}>
            <input
              type="checkbox"
              checked={localPreferences.push_enabled && isPushSubscribed}
              onChange={(e) => {
                handleToggle('push_enabled', e.target.checked);
                if (isPushSupported) handlePushToggle();
              }}
              disabled={!isPushSupported}
              style={{ width: '20px', height: '20px' }}
            />
          </label>
        </div>

        {/* Email Notifications */}
        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>Email Notifications</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Receive notifications via email</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localPreferences.email_enabled}
              onChange={(e) => handleToggle('email_enabled', e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
          </label>
        </div>

        {/* SMS Notifications */}
        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>SMS Notifications</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Receive notifications via SMS (charges may apply)</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localPreferences.sms_enabled}
              onChange={(e) => handleToggle('sms_enabled', e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
          </label>
        </div>

        {/* In-App Notifications */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>In-App Notifications</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Show notifications in the app</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localPreferences.in_app_enabled}
              onChange={(e) => handleToggle('in_app_enabled', e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
          </label>
        </div>
      </div>

      {/* Digest Mode */}
      <div style={{
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}>
        <h2 style={{ marginTop: 0 }}>Digest Mode</h2>
        
        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>Enable Digest Mode</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Receive notifications in batches</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localPreferences.digest_mode}
              onChange={(e) => handleToggle('digest_mode', e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
          </label>
        </div>

        {localPreferences.digest_mode && (
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Frequency</label>
            <select
              value={localPreferences.digest_frequency}
              onChange={(e) => handleDigestFrequencyChange(e.target.value as 'daily' | 'weekly' | 'never')}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
              }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="never">Never</option>
            </select>
          </div>
        )}
      </div>

      {/* Quiet Hours */}
      <div style={{
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}>
        <h2 style={{ marginTop: 0 }}>Quiet Hours</h2>
        
        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>Enable Quiet Hours</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Pause non-urgent notifications during specific hours</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localPreferences.quiet_hours_enabled}
              onChange={(e) => handleToggle('quiet_hours_enabled', e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
          </label>
        </div>

        {localPreferences.quiet_hours_enabled && (
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Time</label>
              <input
                type="time"
                value={localPreferences.quiet_hours_start}
                onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Time</label>
              <input
                type="time"
                value={localPreferences.quiet_hours_end}
                onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}>
        <h2 style={{ marginTop: 0 }}>Notification Types</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>Choose which types of notifications you want to receive</p>
        
        {Object.entries(notificationTypeLabels).map(([type, label]) => (
          <div
            key={type}
            style={{
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
            }}
          >
            <div style={{ fontWeight: type === 'security_alert' ? 'bold' : 'normal' }}>
              {label}
              {type === 'security_alert' && (
                <span style={{ marginLeft: '5px', color: '#dc3545', fontSize: '12px' }}>(Always enabled)</span>
              )}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: type === 'security_alert' ? 'not-allowed' : 'pointer' }}>
              <input
                type="checkbox"
                checked={localPreferences.notification_types[type as NotificationType]}
                onChange={(e) => handleNotificationTypeToggle(type as NotificationType, e.target.checked)}
                disabled={type === 'security_alert'}
                style={{ width: '20px', height: '20px' }}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSettings;

