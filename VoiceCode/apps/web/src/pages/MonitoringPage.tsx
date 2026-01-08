/**
 * Unified Monitoring Page
 * Central hub for all monitoring dashboards
 */

import React, { useState } from 'react';
import AISecurityDashboard from '../components/monitoring/AISecurityDashboard';
import CostMonitoringDashboard from '../components/monitoring/CostMonitoringDashboard';
import PerformanceDashboard from '../components/monitoring/PerformanceDashboard';

type DashboardTab = 'security' | 'cost' | 'performance';

export function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('security');
  const [userId] = useState('user-123'); // Replace with actual user ID from auth

  const tabs: Array<{ id: DashboardTab; label: string; icon: string }> = [
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'cost', label: 'Cost', icon: '💰' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              VoiceFlow Pro Monitoring
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Real-time monitoring of AI operations, security, costs, and performance
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'security' && <AISecurityDashboard userId={userId} />}
        {activeTab === 'cost' && <CostMonitoringDashboard userId={userId} />}
        {activeTab === 'performance' && <PerformanceDashboard userId={userId} />}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <span className="font-medium">VoiceFlow Pro</span> - AI Security & Monitoring
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-900">Documentation</a>
              <a href="#" className="hover:text-gray-900">API Reference</a>
              <a href="#" className="hover:text-gray-900">Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonitoringPage;

