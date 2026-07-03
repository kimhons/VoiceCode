/**
 * Integrations Hub Page
 * Connect and manage third-party integrations
 */

import React, { useState } from 'react';
import {
  Plug,
  Check,
  X,
  ExternalLink,
  Settings,
  RefreshCw,
  Search,
  Filter,
  Zap,
  Calendar,
  Cloud,
  MessageSquare,
  Video,
  FileText,
  Database,
  Lock,
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  category:
    | 'communication'
    | 'storage'
    | 'calendar'
    | 'crm'
    | 'productivity'
    | 'video';
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  features: string[];
}

const integrations: Integration[] = [
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Auto-join and transcribe Zoom meetings',
    category: 'video',
    icon: '📹',
    status: 'connected',
    lastSync: '2 min ago',
    features: ['Auto-join meetings', 'Live transcription', 'Meeting summaries'],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync meetings and schedule recordings',
    category: 'calendar',
    icon: '📅',
    status: 'connected',
    lastSync: '5 min ago',
    features: ['Calendar sync', 'Auto-scheduling', 'Meeting prep'],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Share transcripts and get notifications',
    category: 'communication',
    icon: '💬',
    status: 'connected',
    lastSync: '1 min ago',
    features: ['Channel sharing', 'DM notifications', 'Slash commands'],
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Backup and sync transcriptions',
    category: 'storage',
    icon: '☁️',
    status: 'disconnected',
    features: ['Auto-backup', 'Folder sync', 'Sharing'],
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Integrate with Teams meetings and chats',
    category: 'video',
    icon: '👥',
    status: 'disconnected',
    features: ['Teams meetings', 'Chat integration', 'Bot support'],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Export notes and transcripts to Notion',
    category: 'productivity',
    icon: '📝',
    status: 'connected',
    lastSync: '30 min ago',
    features: ['Page creation', 'Database sync', 'Templates'],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Sync call notes with CRM records',
    category: 'crm',
    icon: '☁️',
    status: 'disconnected',
    features: ['Contact sync', 'Call logging', 'Activity tracking'],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Log calls and notes to HubSpot CRM',
    category: 'crm',
    icon: '🧡',
    status: 'disconnected',
    features: ['Contact management', 'Deal tracking', 'Notes sync'],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Store and share recordings in Dropbox',
    category: 'storage',
    icon: '📦',
    status: 'disconnected',
    features: ['File backup', 'Team folders', 'Sharing links'],
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    description: 'Sync with Microsoft Outlook calendar',
    category: 'calendar',
    icon: '📧',
    status: 'disconnected',
    features: ['Calendar sync', 'Meeting detection', 'Reminders'],
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Create tasks from action items',
    category: 'productivity',
    icon: '✅',
    status: 'disconnected',
    features: ['Task creation', 'Project sync', 'Assignees'],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Create tickets from meeting notes',
    category: 'productivity',
    icon: '🎫',
    status: 'disconnected',
    features: ['Issue creation', 'Sprint tracking', 'Comments'],
  },
];

const categoryConfig = {
  communication: {
    label: 'Communication',
    icon: MessageSquare,
    color: '#8b5cf6',
  },
  storage: { label: 'Cloud Storage', icon: Cloud, color: '#3b82f6' },
  calendar: { label: 'Calendar', icon: Calendar, color: '#10b981' },
  crm: { label: 'CRM', icon: Database, color: '#f59e0b' },
  productivity: { label: 'Productivity', icon: FileText, color: '#ec4899' },
  video: { label: 'Video Conferencing', icon: Video, color: '#ef4444' },
};

const IntegrationsHubPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || integration.category === selectedCategory;
    const matchesConnected =
      !showConnectedOnly || integration.status === 'connected';
    return matchesSearch && matchesCategory && matchesConnected;
  });

  const handleConnect = async (id: string) => {
    setConnectingId(id);
    // Simulate OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setConnectingId(null);
    // In real app, this would redirect to OAuth
    alert(`Redirecting to ${id} OAuth flow...`);
  };

  const stats = {
    total: integrations.length,
    connected: integrations.filter((i) => i.status === 'connected').length,
    available: integrations.filter((i) => i.status === 'disconnected').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <Plug size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              Integrations
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Connect your favorite tools and automate your workflow
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '12px',
                  background: '#fef3c7',
                  borderRadius: '10px',
                }}
              >
                <Plug size={24} color="#d97706" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1f2937',
                  }}
                >
                  {stats.total}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Available Integrations
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '12px',
                  background: '#dcfce7',
                  borderRadius: '10px',
                }}
              >
                <Check size={24} color="#16a34a" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#10b981',
                  }}
                >
                  {stats.connected}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Connected
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '12px',
                  background: '#e0e7ff',
                  borderRadius: '10px',
                }}
              >
                <Zap size={24} color="#4f46e5" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#4f46e5',
                  }}
                >
                  {stats.available}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Ready to Connect
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search integrations..."
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: !selectedCategory ? '#f59e0b' : '#f3f4f6',
                  color: !selectedCategory ? 'white' : '#6b7280',
                }}
              >
                All
              </button>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  style={{
                    padding: '8px 14px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    background:
                      selectedCategory === key ? config.color : '#f3f4f6',
                    color: selectedCategory === key ? 'white' : '#6b7280',
                  }}
                >
                  {config.label}
                </button>
              ))}
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: '#6b7280',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showConnectedOnly}
                onChange={(e) => setShowConnectedOnly(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              Connected only
            </label>
          </div>
        </div>

        {/* Integrations Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredIntegrations.map((integration) => {
            const category = categoryConfig[integration.category];
            const CategoryIcon = category.icon;

            return (
              <div
                key={integration.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border:
                    integration.status === 'connected'
                      ? `2px solid ${category.color}40`
                      : '2px solid transparent',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ fontSize: '32px' }}>{integration.icon}</div>
                    <div>
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '2px',
                        }}
                      >
                        {integration.name}
                      </h3>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '10px',
                          fontWeight: '500',
                          background: `${category.color}15`,
                          color: category.color,
                        }}
                      >
                        <CategoryIcon size={10} />
                        {category.label}
                      </span>
                    </div>
                  </div>

                  {integration.status === 'connected' && (
                    <button
                      style={{
                        padding: '6px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Settings size={16} color="#6b7280" />
                    </button>
                  )}
                </div>

                <p
                  style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    marginBottom: '16px',
                    lineHeight: '1.5',
                  }}
                >
                  {integration.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '16px',
                  }}
                >
                  {integration.features.map((feature, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '4px 8px',
                        background: '#f3f4f6',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#6b7280',
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {integration.status === 'connected' ? (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#10b981',
                        }}
                      >
                        <Check size={14} />
                        Connected
                        {integration.lastSync && (
                          <span style={{ color: '#9ca3af' }}>
                            • Synced {integration.lastSync}
                          </span>
                        )}
                      </div>
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={14} /> Disconnect
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#6b7280',
                        }}
                      >
                        <Lock size={14} />
                        Not connected
                      </div>
                      <button
                        onClick={() => handleConnect(integration.id)}
                        disabled={connectingId === integration.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          background: category.color,
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        {connectingId === integration.id ? (
                          <>
                            <RefreshCw
                              size={14}
                              style={{ animation: 'spin 1s linear infinite' }}
                            />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Zap size={14} /> Connect
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default IntegrationsHubPage;
