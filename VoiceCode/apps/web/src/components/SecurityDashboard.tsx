/**
 * Security Dashboard Component
 * Phase 5.5: Advanced Security
 * 
 * Comprehensive security management UI
 */

import React, { useState, useEffect } from 'react';
import { useSecurity } from '../hooks/useSecurity';
import './SecurityDashboard.css';

interface SecurityDashboardProps {
  userId: string;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ userId }) => {
  const {
    enable2FA,
    verify2FA,
    disable2FA,
    getAuditLogs,
    auditLogs,
    getActiveSessions,
    activeSessions,
    invalidateSession,
    addIPToWhitelist,
    removeIPFromWhitelist,
    isLoading,
    error,
    clearError,
  } = useSecurity({ userId });

  // State
  const [activeTab, setActiveTab] = useState<'2fa' | 'audit' | 'sessions' | 'ip'>('2fa');
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQR, setTwoFactorQR] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [newIPAddress, setNewIPAddress] = useState('');
  const [ipDescription, setIPDescription] = useState('');

  // Load data
  useEffect(() => {
    if (activeTab === 'audit') {
      getAuditLogs({ limit: 50 });
    } else if (activeTab === 'sessions') {
      getActiveSessions();
    }
  }, [activeTab, getAuditLogs, getActiveSessions]);

  // Handlers
  const handleEnable2FA = async () => {
    try {
      const result = await enable2FA('2fa_totp');
      setTwoFactorSecret(result.secret);
      setTwoFactorQR(result.qrCode);
      setBackupCodes(result.backupCodes);
      setShow2FASetup(true);
    } catch (err) {
      console.error('Failed to enable 2FA:', err);
    }
  };

  const handleVerify2FA = async () => {
    try {
      const success = await verify2FA(verificationCode);
      if (success) {
        alert('2FA enabled successfully!');
        setShow2FASetup(false);
        setVerificationCode('');
      } else {
        alert('Invalid verification code');
      }
    } catch (err) {
      console.error('Failed to verify 2FA:', err);
    }
  };

  const handleDisable2FA = async () => {
    const code = prompt('Enter your 2FA code to disable:');
    if (!code) return;

    try {
      const success = await disable2FA(code);
      if (success) {
        alert('2FA disabled successfully');
      } else {
        alert('Invalid code');
      }
    } catch (err) {
      console.error('Failed to disable 2FA:', err);
    }
  };

  const handleInvalidateSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to invalidate this session?')) return;

    try {
      await invalidateSession(sessionId);
      alert('Session invalidated');
    } catch (err) {
      console.error('Failed to invalidate session:', err);
    }
  };

  const handleAddIP = async () => {
    if (!newIPAddress) return;

    try {
      await addIPToWhitelist(newIPAddress, ipDescription);
      setNewIPAddress('');
      setIPDescription('');
      alert('IP added to whitelist');
    } catch (err) {
      console.error('Failed to add IP:', err);
    }
  };

  const handleRemoveIP = async (ipAddress: string) => {
    if (!confirm(`Remove ${ipAddress} from whitelist?`)) return;

    try {
      await removeIPFromWhitelist(ipAddress);
      alert('IP removed from whitelist');
    } catch (err) {
      console.error('Failed to remove IP:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div className="security-dashboard">
      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <h1>🔐 Security Dashboard</h1>
        <p>Manage your security settings and monitor activity</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === '2fa' ? 'active' : ''}
          onClick={() => setActiveTab('2fa')}
        >
          🔑 Two-Factor Auth
        </button>
        <button
          className={activeTab === 'audit' ? 'active' : ''}
          onClick={() => setActiveTab('audit')}
        >
          📋 Audit Logs
        </button>
        <button
          className={activeTab === 'sessions' ? 'active' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          💻 Active Sessions
        </button>
        <button
          className={activeTab === 'ip' ? 'active' : ''}
          onClick={() => setActiveTab('ip')}
        >
          🌐 IP Whitelist
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {/* Two-Factor Authentication */}
        {activeTab === '2fa' && (
          <div className="tab-panel">
            <h2>Two-Factor Authentication</h2>
            <p>Add an extra layer of security to your account</p>

            {!show2FASetup ? (
              <div className="action-section">
                <button className="btn-primary" onClick={handleEnable2FA} disabled={isLoading}>
                  Enable 2FA
                </button>
                <button className="btn-danger" onClick={handleDisable2FA} disabled={isLoading}>
                  Disable 2FA
                </button>
              </div>
            ) : (
              <div className="setup-2fa">
                <h3>Setup Two-Factor Authentication</h3>
                
                <div className="qr-section">
                  <p>Scan this QR code with your authenticator app:</p>
                  <img src={twoFactorQR} alt="QR Code" className="qr-code" />
                  <p className="secret-text">Or enter this secret manually: <code>{twoFactorSecret}</code></p>
                </div>

                <div className="backup-codes">
                  <h4>Backup Codes</h4>
                  <p>Save these codes in a safe place. You can use them to access your account if you lose your device.</p>
                  <div className="codes-grid">
                    {backupCodes.map((code, index) => (
                      <code key={index}>{code}</code>
                    ))}
                  </div>
                </div>

                <div className="verification-section">
                  <h4>Verify Setup</h4>
                  <p>Enter the 6-digit code from your authenticator app:</p>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="verification-input"
                  />
                  <button className="btn-primary" onClick={handleVerify2FA} disabled={isLoading}>
                    Verify & Enable
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audit Logs */}
        {activeTab === 'audit' && (
          <div className="tab-panel">
            <h2>Audit Logs</h2>
            <p>View all security-related activities on your account</p>

            <div className="audit-logs">
              {auditLogs.length === 0 ? (
                <p className="empty-state">No audit logs found</p>
              ) : (
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Resource</th>
                      <th>IP Address</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>{log.action}</td>
                        <td>{log.resource}</td>
                        <td>{log.ipAddress}</td>
                        <td>
                          <span
                            className="severity-badge"
                            style={{ backgroundColor: getSeverityColor(log.severity) }}
                          >
                            {log.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Active Sessions */}
        {activeTab === 'sessions' && (
          <div className="tab-panel">
            <h2>Active Sessions</h2>
            <p>Manage your active login sessions</p>

            <div className="sessions-list">
              {activeSessions.length === 0 ? (
                <p className="empty-state">No active sessions</p>
              ) : (
                activeSessions.map((session) => (
                  <div key={session.id} className="session-card">
                    <div className="session-info">
                      <h4>💻 {session.userAgent}</h4>
                      <p>IP: {session.ipAddress}</p>
                      <p>Last Activity: {new Date(session.lastActivityAt).toLocaleString()}</p>
                      <p>Expires: {new Date(session.expiresAt).toLocaleString()}</p>
                    </div>
                    <button
                      className="btn-danger"
                      onClick={() => handleInvalidateSession(session.id)}
                      disabled={isLoading}
                    >
                      Invalidate
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* IP Whitelist */}
        {activeTab === 'ip' && (
          <div className="tab-panel">
            <h2>IP Whitelist</h2>
            <p>Restrict access to specific IP addresses</p>

            <div className="add-ip-section">
              <h3>Add IP Address</h3>
              <div className="form-group">
                <input
                  type="text"
                  value={newIPAddress}
                  onChange={(e) => setNewIPAddress(e.target.value)}
                  placeholder="192.168.1.1"
                  className="ip-input"
                />
                <input
                  type="text"
                  value={ipDescription}
                  onChange={(e) => setIPDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="description-input"
                />
                <button className="btn-primary" onClick={handleAddIP} disabled={isLoading}>
                  Add IP
                </button>
              </div>
            </div>

            <div className="ip-list">
              <h3>Whitelisted IPs</h3>
              <p className="empty-state">No IPs in whitelist (feature requires backend integration)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;

