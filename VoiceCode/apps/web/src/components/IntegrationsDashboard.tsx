/**
 * Integrations Dashboard Component
 * Phase 5.8: Third-Party Integrations
 * 
 * Manage third-party integrations
 */

import React, { useState } from 'react';
import { useIntegrations } from '../hooks/useIntegrations';
import { IntegrationProvider } from '../services/integrations.service';
import './IntegrationsDashboard.css';

interface IntegrationsDashboardProps {
  userId: string;
}

interface IntegrationCard {
  provider: IntegrationProvider;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
}

const AVAILABLE_INTEGRATIONS: IntegrationCard[] = [
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Share transcripts and get notifications in Slack channels',
    icon: '💬',
    color: '#4A154B',
    features: ['Share transcripts', 'Real-time notifications', 'Channel integration'],
  },
  {
    provider: 'microsoft_teams',
    name: 'Microsoft Teams',
    description: 'Collaborate with your team using Microsoft Teams',
    icon: '👥',
    color: '#6264A7',
    features: ['Share transcripts', 'Team notifications', 'Channel integration'],
  },
  {
    provider: 'google_drive',
    name: 'Google Drive',
    description: 'Automatically save transcripts to Google Drive',
    icon: '📁',
    color: '#4285F4',
    features: ['Auto-sync', 'Folder organization', 'Export formats'],
  },
  {
    provider: 'dropbox',
    name: 'Dropbox',
    description: 'Backup transcripts to Dropbox automatically',
    icon: '📦',
    color: '#0061FF',
    features: ['Auto-sync', 'Folder organization', 'Version history'],
  },
  {
    provider: 'zoom',
    name: 'Zoom',
    description: 'Import and transcribe Zoom meeting recordings',
    icon: '🎥',
    color: '#2D8CFF',
    features: ['Auto-import recordings', 'Meeting transcription', 'Cloud recordings'],
  },
  {
    provider: 'notion',
    name: 'Notion',
    description: 'Sync transcripts to your Notion workspace',
    icon: '📝',
    color: '#000000',
    features: ['Database sync', 'Auto-create pages', 'Rich formatting'],
  },
  {
    provider: 'trello',
    name: 'Trello',
    description: 'Create Trello cards from transcripts and action items',
    icon: '📋',
    color: '#0079BF',
    features: ['Auto-create cards', 'Action items', 'Board integration'],
  },
  {
    provider: 'zapier',
    name: 'Zapier',
    description: 'Connect to 5,000+ apps with Zapier webhooks',
    icon: '⚡',
    color: '#FF4A00',
    features: ['Custom workflows', 'Event triggers', '5,000+ apps'],
  },
];

export const IntegrationsDashboard: React.FC<IntegrationsDashboardProps> = ({ userId }) => {
  const {
    integrations,
    createIntegration,
    deleteIntegration,
    toggleIntegration,
    getIntegrationActions,
    actions,
    isLoading,
    error,
    clearError,
  } = useIntegrations({ userId, autoLoad: true });

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, any>>({});

  const handleAddIntegration = (provider: IntegrationProvider) => {
    setSelectedProvider(provider);
    setConfigForm({});
    setShowAddModal(true);
  };

  const handleSaveIntegration = async () => {
    if (!selectedProvider) return;

    try {
      const card = AVAILABLE_INTEGRATIONS.find((i) => i.provider === selectedProvider);
      if (!card) return;

      await createIntegration(selectedProvider, card.name, configForm);
      setShowAddModal(false);
      setSelectedProvider(null);
      setConfigForm({});
    } catch (err) {
      console.error('Failed to create integration:', err);
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    try {
      await deleteIntegration(integrationId);
    } catch (err) {
      console.error('Failed to delete integration:', err);
    }
  };

  const handleToggleIntegration = async (integrationId: string, enabled: boolean) => {
    try {
      await toggleIntegration(integrationId, enabled);
    } catch (err) {
      console.error('Failed to toggle integration:', err);
    }
  };

  const handleViewActions = async (integrationId: string) => {
    try {
      await getIntegrationActions(integrationId);
    } catch (err) {
      console.error('Failed to get actions:', err);
    }
  };

  const getIntegrationCard = (provider: IntegrationProvider): IntegrationCard | undefined => {
    return AVAILABLE_INTEGRATIONS.find((i) => i.provider === provider);
  };

  const isIntegrationConnected = (provider: IntegrationProvider): boolean => {
    return integrations.some((i) => i.provider === provider);
  };

  return (
    <div className="integrations-dashboard">
      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>🔗 Integrations</h1>
          <p>Connect VoiceFlow Pro with your favorite apps</p>
        </div>
      </div>

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <div className="connected-section">
          <h2>Connected Integrations</h2>
          <div className="integrations-grid">
            {integrations.map((integration) => {
              const card = getIntegrationCard(integration.provider);
              if (!card) return null;

              return (
                <div key={integration.id} className="integration-card connected">
                  <div className="card-header">
                    <div className="card-icon" style={{ backgroundColor: card.color }}>
                      {card.icon}
                    </div>
                    <div className="card-info">
                      <h3>{card.name}</h3>
                      <span className={`status-badge ${integration.enabled ? 'enabled' : 'disabled'}`}>
                        {integration.enabled ? '✓ Active' : '○ Disabled'}
                      </span>
                    </div>
                  </div>
                  <p className="card-description">{card.description}</p>
                  <div className="card-actions">
                    <button
                      className="btn-toggle"
                      onClick={() => handleToggleIntegration(integration.id, !integration.enabled)}
                    >
                      {integration.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn-view" onClick={() => handleViewActions(integration.id)}>
                      View Activity
                    </button>
                    <button className="btn-delete" onClick={() => handleDeleteIntegration(integration.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div className="available-section">
        <h2>Available Integrations</h2>
        <div className="integrations-grid">
          {AVAILABLE_INTEGRATIONS.map((card) => {
            const connected = isIntegrationConnected(card.provider);

            return (
              <div key={card.provider} className={`integration-card ${connected ? 'connected-overlay' : ''}`}>
                <div className="card-header">
                  <div className="card-icon" style={{ backgroundColor: card.color }}>
                    {card.icon}
                  </div>
                  <div className="card-info">
                    <h3>{card.name}</h3>
                    {connected && <span className="connected-badge">✓ Connected</span>}
                  </div>
                </div>
                <p className="card-description">{card.description}</p>
                <ul className="card-features">
                  {card.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
                {!connected && (
                  <button className="btn-connect" onClick={() => handleAddIntegration(card.provider)}>
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Integration Modal */}
      {showAddModal && selectedProvider && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Connect {AVAILABLE_INTEGRATIONS.find((i) => i.provider === selectedProvider)?.name}</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Slack Configuration */}
              {selectedProvider === 'slack' && (
                <div className="config-form">
                  <div className="form-group">
                    <label>Webhook URL</label>
                    <input
                      type="text"
                      placeholder="https://hooks.slack.com/services/..."
                      value={configForm.webhookUrl || ''}
                      onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Workspace Name</label>
                    <input
                      type="text"
                      placeholder="My Workspace"
                      value={configForm.workspaceName || ''}
                      onChange={(e) => setConfigForm({ ...configForm, workspaceName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Channel Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="#general"
                      value={configForm.channelName || ''}
                      onChange={(e) => setConfigForm({ ...configForm, channelName: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Teams Configuration */}
              {selectedProvider === 'microsoft_teams' && (
                <div className="config-form">
                  <div className="form-group">
                    <label>Webhook URL</label>
                    <input
                      type="text"
                      placeholder="https://outlook.office.com/webhook/..."
                      value={configForm.webhookUrl || ''}
                      onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Team Name</label>
                    <input
                      type="text"
                      placeholder="My Team"
                      value={configForm.teamName || ''}
                      onChange={(e) => setConfigForm({ ...configForm, teamName: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Zapier Configuration */}
              {selectedProvider === 'zapier' && (
                <div className="config-form">
                  <div className="form-group">
                    <label>Webhook URL</label>
                    <input
                      type="text"
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      value={configForm.webhookUrl || ''}
                      onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Events to Trigger</label>
                    <div className="checkbox-group">
                      {['transcript.created', 'transcript.completed', 'transcript.shared'].map((event) => (
                        <label key={event}>
                          <input
                            type="checkbox"
                            checked={(configForm.events || []).includes(event)}
                            onChange={(e) => {
                              const events = configForm.events || [];
                              if (e.target.checked) {
                                setConfigForm({ ...configForm, events: [...events, event] });
                              } else {
                                setConfigForm({ ...configForm, events: events.filter((ev: string) => ev !== event) });
                              }
                            }}
                          />
                          {event}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Other Integrations */}
              {!['slack', 'microsoft_teams', 'zapier'].includes(selectedProvider) && (
                <div className="oauth-notice">
                  <p>
                    This integration requires OAuth authentication. Click "Connect" to authorize VoiceFlow Pro to
                    access your {AVAILABLE_INTEGRATIONS.find((i) => i.provider === selectedProvider)?.name} account.
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveIntegration} disabled={isLoading}>
                {isLoading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      {actions.length > 0 && (
        <div className="activity-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {actions.map((action) => (
              <div key={action.id} className={`activity-item ${action.status}`}>
                <div className="activity-icon">{action.status === 'success' ? '✓' : '✗'}</div>
                <div className="activity-details">
                  <div className="activity-action">{action.action}</div>
                  <div className="activity-time">{new Date(action.createdAt).toLocaleString()}</div>
                  {action.error && <div className="activity-error">{action.error}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Loading integrations...</p>
        </div>
      )}
    </div>
  );
};

export default IntegrationsDashboard;

