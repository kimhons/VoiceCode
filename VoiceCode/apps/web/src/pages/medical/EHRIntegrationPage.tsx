/**
 * EHR Integration Page
 * Connect and manage Electronic Health Record systems
 */

import React, { useState } from 'react';
import {
  Database,
  Check,
  X,
  Settings,
  RefreshCw,
  Shield,
  Link2,
  AlertTriangle,
  Clock,
  FileText,
  Upload,
  Download,
  Activity,
} from 'lucide-react';

interface EHRSystem {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  recordsSync: number;
  features: string[];
  compliance: string[];
}

const ehrSystems: EHRSystem[] = [
  {
    id: 'epic',
    name: 'Epic',
    logo: '🏥',
    status: 'connected',
    lastSync: '2 min ago',
    recordsSync: 1247,
    features: [
      'Patient lookup',
      'Note export',
      'Order entry',
      'Results review',
    ],
    compliance: ['HIPAA', 'HITECH', 'HL7 FHIR'],
  },
  {
    id: 'cerner',
    name: 'Cerner',
    logo: '💊',
    status: 'disconnected',
    recordsSync: 0,
    features: ['Patient demographics', 'Clinical notes', 'Medication list'],
    compliance: ['HIPAA', 'HL7'],
  },
  {
    id: 'allscripts',
    name: 'Allscripts',
    logo: '📋',
    status: 'disconnected',
    recordsSync: 0,
    features: ['Practice management', 'E-prescribing', 'Lab orders'],
    compliance: ['HIPAA', 'HITECH'],
  },
  {
    id: 'meditech',
    name: 'MEDITECH',
    logo: '🔬',
    status: 'error',
    lastSync: '1 day ago',
    recordsSync: 89,
    features: ['Inpatient records', 'Surgical notes', 'Discharge summaries'],
    compliance: ['HIPAA'],
  },
  {
    id: 'athena',
    name: 'athenahealth',
    logo: '☁️',
    status: 'disconnected',
    recordsSync: 0,
    features: ['Cloud-based EHR', 'Revenue cycle', 'Patient engagement'],
    compliance: ['HIPAA', 'SOC 2'],
  },
  {
    id: 'nextgen',
    name: 'NextGen',
    logo: '⚕️',
    status: 'disconnected',
    recordsSync: 0,
    features: ['Ambulatory EHR', 'Specialty templates', 'Population health'],
    compliance: ['HIPAA', 'MIPS'],
  },
];

const EHRIntegrationPage: React.FC = () => {
  const [systems, setSystems] = useState<EHRSystem[]>(ehrSystems);
  const [selectedSystem, setSelectedSystem] = useState<EHRSystem | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleConnect = async (id: string) => {
    setIsSyncing(id);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSystems(
      systems.map((s) =>
        s.id === id ? { ...s, status: 'connected', lastSync: 'Just now' } : s
      )
    );
    setIsSyncing(null);
  };

  const handleDisconnect = (id: string) => {
    setSystems(
      systems.map((s) =>
        s.id === id ? { ...s, status: 'disconnected', lastSync: undefined } : s
      )
    );
  };

  const handleSync = async (id: string) => {
    setIsSyncing(id);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setSystems(
      systems.map((s) =>
        s.id === id
          ? {
              ...s,
              lastSync: 'Just now',
              recordsSync: s.recordsSync + Math.floor(Math.random() * 50),
            }
          : s
      )
    );
    setIsSyncing(null);
  };

  const connectedCount = systems.filter((s) => s.status === 'connected').length;
  const totalRecords = systems.reduce((sum, s) => sum + s.recordsSync, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
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
            <Database size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              EHR Integration
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Connect your Electronic Health Record systems for seamless data
            exchange
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
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
                  padding: '10px',
                  background: '#e0e7ff',
                  borderRadius: '10px',
                }}
              >
                <Database size={20} color="#4f46e5" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1f2937',
                  }}
                >
                  {systems.length}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Available EHRs
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
                  padding: '10px',
                  background: '#dcfce7',
                  borderRadius: '10px',
                }}
              >
                <Check size={20} color="#16a34a" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#10b981',
                  }}
                >
                  {connectedCount}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
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
                  padding: '10px',
                  background: '#fef3c7',
                  borderRadius: '10px',
                }}
              >
                <FileText size={20} color="#d97706" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#f59e0b',
                  }}
                >
                  {totalRecords.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Records Synced
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
                  padding: '10px',
                  background: '#fce7f3',
                  borderRadius: '10px',
                }}
              >
                <Shield size={20} color="#be185d" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#ec4899',
                  }}
                >
                  100%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  HIPAA Compliant
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Shield size={20} color="#059669" />
          <div>
            <div
              style={{ fontSize: '14px', fontWeight: '500', color: '#065f46' }}
            >
              Secure & Compliant Connections
            </div>
            <div style={{ fontSize: '13px', color: '#047857' }}>
              All EHR integrations use encrypted connections and comply with
              HIPAA, HITECH, and HL7 FHIR standards.
            </div>
          </div>
        </div>

        {/* EHR Systems Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
          }}
        >
          {systems.map((system) => (
            <div
              key={system.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border:
                  system.status === 'connected'
                    ? '2px solid #10b981'
                    : system.status === 'error'
                      ? '2px solid #ef4444'
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
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <div style={{ fontSize: '32px' }}>{system.logo}</div>
                  <div>
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#1f2937',
                      }}
                    >
                      {system.name}
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background:
                            system.status === 'connected'
                              ? '#10b981'
                              : system.status === 'error'
                                ? '#ef4444'
                                : '#9ca3af',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '12px',
                          color:
                            system.status === 'connected'
                              ? '#10b981'
                              : system.status === 'error'
                                ? '#ef4444'
                                : '#6b7280',
                        }}
                      >
                        {system.status === 'connected'
                          ? 'Connected'
                          : system.status === 'error'
                            ? 'Connection Error'
                            : 'Not Connected'}
                      </span>
                    </div>
                  </div>
                </div>
                {system.status === 'connected' && (
                  <button
                    onClick={() => setSelectedSystem(system)}
                    style={{
                      padding: '8px',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Settings size={18} color="#6b7280" />
                  </button>
                )}
              </div>

              {/* Features */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    marginBottom: '8px',
                  }}
                >
                  Features
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {system.features.map((feature, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 8px',
                        background: '#f3f4f6',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#4b5563',
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Compliance */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    marginBottom: '8px',
                  }}
                >
                  Compliance
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {system.compliance.map((cert, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 8px',
                        background: '#dcfce7',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#166534',
                        fontWeight: '500',
                      }}
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sync Info & Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid #f3f4f6',
                }}
              >
                {system.status === 'connected' ? (
                  <>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={12} /> Last sync: {system.lastSync}
                      </div>
                      <div>
                        {system.recordsSync.toLocaleString()} records synced
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleSync(system.id)}
                        disabled={isSyncing === system.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        <RefreshCw
                          size={14}
                          style={{
                            animation:
                              isSyncing === system.id
                                ? 'spin 1s linear infinite'
                                : 'none',
                          }}
                        />
                        {isSyncing === system.id ? 'Syncing...' : 'Sync'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(system.id)}
                        style={{
                          padding: '8px 14px',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(system.id)}
                    disabled={isSyncing === system.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      background: '#4f46e5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    {isSyncing === system.id ? (
                      <>
                        <RefreshCw
                          size={16}
                          style={{ animation: 'spin 1s linear infinite' }}
                        />{' '}
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 size={16} /> Connect {system.name}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Data Flow Section */}
        <div
          style={{
            marginTop: '32px',
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '20px',
            }}
          >
            Data Flow Configuration
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
            }}
          >
            <div
              style={{
                padding: '20px',
                background: '#f9fafb',
                borderRadius: '10px',
                textAlign: 'center',
              }}
            >
              <Upload
                size={32}
                color="#4f46e5"
                style={{ marginBottom: '12px' }}
              />
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '4px',
                }}
              >
                Export to EHR
              </h4>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                Send transcriptions and notes to connected EHR systems
              </p>
            </div>
            <div
              style={{
                padding: '20px',
                background: '#f9fafb',
                borderRadius: '10px',
                textAlign: 'center',
              }}
            >
              <Download
                size={32}
                color="#10b981"
                style={{ marginBottom: '12px' }}
              />
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '4px',
                }}
              >
                Import from EHR
              </h4>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                Pull patient data and history for context
              </p>
            </div>
            <div
              style={{
                padding: '20px',
                background: '#f9fafb',
                borderRadius: '10px',
                textAlign: 'center',
              }}
            >
              <Activity
                size={32}
                color="#f59e0b"
                style={{ marginBottom: '12px' }}
              />
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '4px',
                }}
              >
                Real-time Sync
              </h4>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                Automatic bidirectional synchronization
              </p>
            </div>
          </div>
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

export default EHRIntegrationPage;
