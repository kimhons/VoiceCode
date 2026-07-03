/**
 * Notification Center Component
 * Phase 5.1: Advanced Notifications
 * 
 * Displays notifications with actions
 */

import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Notification, NotificationType } from '../services/notifications.service';

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loadNotifications,
    isLoadingNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    error,
    clearError,
  } = useNotifications({ autoLoad: true, autoRefresh: true });

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isOpen, setIsOpen] = useState(false);

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'normal': return '#007bff';
      case 'low': return '#6c757d';
      default: return '#007bff';
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'transcript_complete': return '📝';
      case 'audio_processed': return '🎵';
      case 'export_ready': return '📥';
      case 'ai_analysis_complete': return '🤖';
      case 'comment_added': return '💬';
      case 'mention': return '@';
      case 'share_received': return '🔗';
      case 'workspace_invite': return '👥';
      case 'report_ready': return '📊';
      case 'system_alert': return '⚙️';
      case 'security_alert': return '🔒';
      default: return '🔔';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    // Handle navigation based on notification data
    if (notification.data?.link) {
      window.location.href = notification.data.link;
    }
  };

  return (
    <div style={{ position: 'relative', fontFamily: 'Arial, sans-serif' }}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '10px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            backgroundColor: '#dc3545',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '50px',
          right: '0',
          width: '400px',
          maxHeight: '600px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '15px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{ margin: 0 }}>Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                padding: '5px 10px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
              }}
            >
              ×
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '10px 15px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>{error}</span>
              <button
                onClick={clearError}
                style={{
                  padding: '2px 8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Actions */}
          <div style={{
            padding: '10px 15px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  padding: '5px 10px',
                  backgroundColor: filter === 'all' ? '#007bff' : 'transparent',
                  color: filter === 'all' ? 'white' : '#007bff',
                  border: '1px solid #007bff',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                style={{
                  padding: '5px 10px',
                  backgroundColor: filter === 'unread' ? '#007bff' : 'transparent',
                  color: filter === 'unread' ? 'white' : '#007bff',
                  border: '1px solid #007bff',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Unread ({unreadCount})
              </button>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '450px',
          }}>
            {isLoadingNotifications ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔔</div>
                <div>No notifications</div>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: notification.is_read ? 'white' : '#f8f9fa',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.is_read ? 'white' : '#f8f9fa';
                  }}
                >
                  {/* Priority Indicator */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: getPriorityColor(notification.priority),
                  }} />

                  <div style={{ display: 'flex', gap: '10px', paddingLeft: '10px' }}>
                    {/* Icon */}
                    <div style={{ fontSize: '24px', flexShrink: 0 }}>
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: notification.is_read ? 'normal' : 'bold',
                        marginBottom: '5px',
                        fontSize: '14px',
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        marginBottom: '5px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {notification.message}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {formatTime(notification.created_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          style={{
                            padding: '3px 8px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        style={{
                          padding: '3px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 15px',
            borderTop: '1px solid #ddd',
            textAlign: 'center',
          }}>
            <button
              onClick={loadNotifications}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

