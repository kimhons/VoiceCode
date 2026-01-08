/**
 * Unified Dashboard Page
 * Combined monitoring dashboard with usage statistics, security, cost, and performance
 */

import React, { useState } from 'react';
import { UsageDashboard } from '@/components/UsageDashboard';
import AISecurityDashboard from '../components/monitoring/AISecurityDashboard';
import CostMonitoringDashboard from '../components/monitoring/CostMonitoringDashboard';
import PerformanceDashboard from '../components/monitoring/PerformanceDashboard';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Shield, DollarSign, Zap } from 'lucide-react';

type DashboardTab = 'usage' | 'security' | 'cost' | 'performance';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('usage');

  const tabs: Array<{ id: DashboardTab; label: string; icon: React.ReactNode }> = [
    { id: 'usage', label: 'Usage & Stats', icon: <BarChart3 size={20} /> },
    { id: 'security', label: 'Security', icon: <Shield size={20} /> },
    { id: 'cost', label: 'Cost Monitoring', icon: <DollarSign size={20} /> },
    { id: 'performance', label: 'Performance', icon: <Zap size={20} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '40px 24px',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.9 }}>
            Monitor your transcription usage, security, costs, and performance
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          gap: '8px',
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 24px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #667eea' : '3px solid transparent',
                color: activeTab === tab.id ? '#667eea' : '#6b7280',
                fontWeight: activeTab === tab.id ? '600' : '500',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {activeTab === 'usage' && <UsageDashboard />}
        {activeTab === 'security' && <AISecurityDashboard userId={user?.id || 'guest'} />}
        {activeTab === 'cost' && <CostMonitoringDashboard userId={user?.id || 'guest'} />}
        {activeTab === 'performance' && <PerformanceDashboard userId={user?.id || 'guest'} />}
      </div>
    </div>
  );
};

export default DashboardPage;

