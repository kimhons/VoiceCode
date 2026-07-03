/**
 * HIPAA Compliance Dashboard
 * Monitor and manage HIPAA compliance status
 */

import React, { useState } from 'react';
import {
  Shield,
  Check,
  X,
  AlertTriangle,
  Clock,
  FileText,
  Lock,
  Eye,
  Users,
  Activity,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface ComplianceItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'compliant' | 'warning' | 'non-compliant' | 'pending';
  lastChecked: string;
  actions?: string[];
}

const complianceItems: ComplianceItem[] = [
  {
    id: '1',
    category: 'Access Controls',
    title: 'User Authentication',
    description: 'Multi-factor authentication enabled for all users',
    status: 'compliant',
    lastChecked: '1 hour ago',
  },
  {
    id: '2',
    category: 'Access Controls',
    title: 'Role-Based Access',
    description: 'Access permissions configured by user role',
    status: 'compliant',
    lastChecked: '1 hour ago',
  },
  {
    id: '3',
    category: 'Access Controls',
    title: 'Session Management',
    description: 'Automatic session timeout after 15 minutes of inactivity',
    status: 'compliant',
    lastChecked: '1 hour ago',
  },
  {
    id: '4',
    category: 'Data Protection',
    title: 'Encryption at Rest',
    description: 'All PHI encrypted using AES-256 encryption',
    status: 'compliant',
    lastChecked: '2 hours ago',
  },
  {
    id: '5',
    category: 'Data Protection',
    title: 'Encryption in Transit',
    description: 'TLS 1.3 encryption for all data transmission',
    status: 'compliant',
    lastChecked: '2 hours ago',
  },
  {
    id: '6',
    category: 'Data Protection',
    title: 'Backup Encryption',
    description: 'Encrypted backups stored in secure locations',
    status: 'compliant',
    lastChecked: '6 hours ago',
  },
  {
    id: '7',
    category: 'Audit Controls',
    title: 'Access Logging',
    description: 'All PHI access attempts are logged',
    status: 'compliant',
    lastChecked: '30 min ago',
  },
  {
    id: '8',
    category: 'Audit Controls',
    title: 'Audit Trail Retention',
    description: 'Audit logs retained for minimum 6 years',
    status: 'compliant',
    lastChecked: '1 day ago',
  },
  {
    id: '9',
    category: 'Audit Controls',
    title: 'Log Monitoring',
    description: 'Real-time monitoring for suspicious activity',
    status: 'warning',
    lastChecked: '1 hour ago',
    actions: ['Configure alert thresholds', 'Review monitoring rules'],
  },
  {
    id: '10',
    category: 'Administrative',
    title: 'BAA Agreements',
    description: 'Business Associate Agreements with all vendors',
    status: 'compliant',
    lastChecked: '1 week ago',
  },
  {
    id: '11',
    category: 'Administrative',
    title: 'Employee Training',
    description: 'Annual HIPAA training completion',
    status: 'warning',
    lastChecked: '2 days ago',
    actions: ['3 employees pending training', 'Send reminder emails'],
  },
  {
    id: '12',
    category: 'Administrative',
    title: 'Incident Response Plan',
    description: 'Documented breach response procedures',
    status: 'compliant',
    lastChecked: '1 month ago',
  },
  {
    id: '13',
    category: 'Technical',
    title: 'Automatic Logoff',
    description: 'Systems configured for automatic session termination',
    status: 'compliant',
    lastChecked: '1 hour ago',
  },
  {
    id: '14',
    category: 'Technical',
    title: 'Unique User IDs',
    description: 'Each user has unique identifier for tracking',
    status: 'compliant',
    lastChecked: '1 hour ago',
  },
  {
    id: '15',
    category: 'Physical',
    title: 'Facility Access',
    description: 'Physical access controls to data centers',
    status: 'compliant',
    lastChecked: '1 week ago',
  },
];

const HIPAACompliancePage: React.FC = () => {
  const [items] = useState<ComplianceItem[]>(complianceItems);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  const categories = [...new Set(items.map((i) => i.category))];

  const stats = {
    total: items.length,
    compliant: items.filter((i) => i.status === 'compliant').length,
    warnings: items.filter((i) => i.status === 'warning').length,
    nonCompliant: items.filter((i) => i.status === 'non-compliant').length,
  };

  const complianceScore = Math.round((stats.compliant / stats.total) * 100);

  const filteredItems = selectedCategory
    ? items.filter((i) => i.category === selectedCategory)
    : items;

  const runAudit = async () => {
    setIsRunningAudit(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsRunningAudit(false);
  };

  const getStatusIcon = (status: ComplianceItem['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle size={18} color="#10b981" />;
      case 'warning':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'non-compliant':
        return <XCircle size={18} color="#ef4444" />;
      case 'pending':
        return <Clock size={18} color="#6b7280" />;
    }
  };

  const getStatusStyle = (status: ComplianceItem['status']) => {
    switch (status) {
      case 'compliant':
        return { bg: '#dcfce7', color: '#166534' };
      case 'warning':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'non-compliant':
        return { bg: '#fef2f2', color: '#991b1b' };
      case 'pending':
        return { bg: '#f3f4f6', color: '#4b5563' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: 'white',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}
              >
                <Shield size={32} />
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
                  HIPAA Compliance
                </h1>
              </div>
              <p style={{ fontSize: '15px', opacity: 0.9 }}>
                Monitor and maintain healthcare data compliance
              </p>
            </div>
            <button
              onClick={runAudit}
              disabled={isRunningAudit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <RefreshCw
                size={18}
                style={{
                  animation: isRunningAudit
                    ? 'spin 1s linear infinite'
                    : 'none',
                }}
              />
              {isRunningAudit ? 'Running Audit...' : 'Run Compliance Audit'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Compliance Score */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: `conic-gradient(#10b981 ${complianceScore}%, #e5e7eb ${complianceScore}%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <div
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: '700',
                    color: '#10b981',
                  }}
                >
                  {complianceScore}%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Compliant
                </div>
              </div>
            </div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '4px',
              }}
            >
              Overall Compliance Score
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              Based on {stats.total} compliance checks
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px',
                }}
              >
                <CheckCircle size={20} color="#10b981" />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Compliant
                </span>
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#10b981',
                }}
              >
                {stats.compliant}
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px',
                }}
              >
                <AlertTriangle size={20} color="#f59e0b" />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Warnings
                </span>
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#f59e0b',
                }}
              >
                {stats.warnings}
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px',
                }}
              >
                <XCircle size={20} color="#ef4444" />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Non-Compliant
                </span>
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#ef4444',
                }}
              >
                {stats.nonCompliant}
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px',
                }}
              >
                <Activity size={20} color="#6366f1" />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Total Checks
                </span>
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#6366f1',
                }}
              >
                {stats.total}
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                background: !selectedCategory ? '#059669' : '#f3f4f6',
                color: !selectedCategory ? 'white' : '#6b7280',
              }}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: selectedCategory === cat ? '#059669' : '#f3f4f6',
                  color: selectedCategory === cat ? 'white' : '#6b7280',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Compliance Items */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {filteredItems.map((item, index) => {
            const statusStyle = getStatusStyle(item.status);
            return (
              <div
                key={item.id}
                style={{
                  padding: '20px',
                  borderBottom:
                    index < filteredItems.length - 1
                      ? '1px solid #f3f4f6'
                      : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}
              >
                {getStatusIcon(item.status)}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '4px',
                    }}
                  >
                    <h4
                      style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#1f2937',
                      }}
                    >
                      {item.title}
                    </h4>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        background: '#f3f4f6',
                        color: '#6b7280',
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '8px',
                    }}
                  >
                    {item.description}
                  </p>
                  {item.actions && (
                    <div
                      style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                    >
                      {item.actions.map((action, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 10px',
                            background: '#fef3c7',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#92400e',
                          }}
                        >
                          ⚡ {action}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      textTransform: 'capitalize',
                    }}
                  >
                    {item.status}
                  </span>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      marginTop: '6px',
                    }}
                  >
                    <Clock
                      size={10}
                      style={{ display: 'inline', marginRight: '4px' }}
                    />
                    {item.lastChecked}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            <Download size={16} /> Export Compliance Report
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            <FileText size={16} /> View Audit History
          </button>
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

export default HIPAACompliancePage;
