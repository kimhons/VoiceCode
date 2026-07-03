/**
 * AI Security Monitoring Dashboard
 * Real-time monitoring of AI operations, security incidents, and performance
 */

import React, { useState, useEffect, useCallback } from 'react';
import { aiAuditLoggingService } from '../../services/aiAuditLogging.service';
import { reportExportService, ExportFormat } from '../../services/reportExport.service';
import { alertNotificationService } from '../../services/alertNotification.service';

interface DashboardStats {
  totalOperations: number;
  totalCost: number;
  totalTokens: number;
  averageLatency: number;
  successRate: number;
  securityIncidents: number;
  topOperations: Array<{ operation: string; count: number }>;
  costByModel: Array<{ model: string; cost: number; percentage: number }>;
  recentIncidents: Array<{
    timestamp: Date;
    operation: string;
    severity: string;
    type: string;
  }>;
}

interface TimeRange {
  label: string;
  hours: number;
}

const TIME_RANGES: TimeRange[] = [
  { label: 'Last Hour', hours: 1 },
  { label: 'Last 24 Hours', hours: 24 },
  { label: 'Last 7 Days', hours: 168 },
  { label: 'Last 30 Days', hours: 720 },
];

export function AISecurityDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(TIME_RANGES[1]); // Default: 24h
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - timeRange.hours * 60 * 60 * 1000);

      const [usageStats, costBreakdown, securityEvents] = await Promise.all([
        aiAuditLoggingService.getUsageStatistics(userId, startDate, endDate),
        aiAuditLoggingService.getCostBreakdown(userId, startDate, endDate),
        aiAuditLoggingService.getSecurityIncidents(userId, startDate, endDate),
      ]);
      // Build costByModel array from costBreakdown.byModel record
      const modelEntries = Object.entries(costBreakdown.byModel);
      const totalModelCost = modelEntries.reduce((sum, [, value]) => sum + value, 0);
      const costByModel = modelEntries.map(([model, cost]) => ({
        model,
        cost,
        percentage: totalModelCost > 0 ? (cost / totalModelCost) * 100 : 0,
      }));

      // Derive top operations from operationBreakdown (sort descending)
      const topOperations = Object.entries(usageStats.operationBreakdown)
        .map(([operation, count]) => ({ operation, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Map securityEvents to recentIncidents expected shape
      const recentIncidents = securityEvents.slice(0, 10).map(({ log, flags }) => {
        // Pick highest severity flag for display
        const severityOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
        const highest = flags.reduce((prev, curr) =>
          severityOrder[curr.severity] > severityOrder[prev.severity] ? curr : prev
        );
        return {
          timestamp: new Date(log.timestamp),
            operation: log.operation,
          severity: highest.severity,
          type: highest.type,
        };
      });

      setStats({
        totalOperations: usageStats.totalOperations,
        totalCost: usageStats.totalCost,
        totalTokens: usageStats.totalTokens,
        averageLatency: usageStats.averageLatency,
        successRate: usageStats.successRate,
        securityIncidents: usageStats.securityIncidents,
        topOperations,
        costByModel,
        recentIncidents,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        No data available
      </div>
    );
  }

  const handleExport = async (format: ExportFormat) => {
    if (!stats) return;

    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - timeRange.hours * 60 * 60 * 1000);
      await reportExportService.exportSecurityReport(
        stats,
        stats.recentIncidents,
        { start: startDate, end: endDate },
        format
      );
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">AI Security Dashboard</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          {/* Export buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              title="Export as CSV"
            >
              📊 CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport('json')}
              className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
              title="Export as JSON"
            >
              📄 JSON
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              title="Export as PDF"
            >
              📑 PDF
            </button>
          </div>

          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">Auto-refresh (30s)</span>
          </label>

          {/* Time range selector */}
          <div className="flex gap-2 flex-wrap">
            {TIME_RANGES.map((range) => (
              <button
                type="button"
                key={range.label}
                onClick={() => setTimeRange(range)}
                className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange.label === range.label
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Operations */}
        <MetricCard
          title="Total Operations"
          value={stats.totalOperations.toLocaleString()}
          icon="📊"
          color="blue"
        />

        {/* Total Cost */}
        <MetricCard
          title="Total Cost"
          value={`$${stats.totalCost.toFixed(4)}`}
          icon="💰"
          color="green"
        />

        {/* Success Rate */}
        <MetricCard
          title="Success Rate"
          value={`${(stats.successRate * 100).toFixed(1)}%`}
          icon="✅"
          color="purple"
          trend={stats.successRate >= 0.95 ? 'up' : 'down'}
        />

        {/* Security Incidents */}
        <MetricCard
          title="Security Incidents"
          value={stats.securityIncidents.toString()}
          icon="🛡️"
          color={stats.securityIncidents > 0 ? 'red' : 'green'}
          alert={stats.securityIncidents > 0}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Tokens"
          value={(stats.totalTokens / 1000).toFixed(1) + 'K'}
          icon="🔤"
          color="indigo"
        />

        <MetricCard
          title="Avg Latency"
          value={`${stats.averageLatency}ms`}
          icon="⚡"
          color="yellow"
        />

        <MetricCard
          title="Cost per 1K Tokens"
          value={`$${((stats.totalCost / stats.totalTokens) * 1000).toFixed(4)}`}
          icon="📈"
          color="pink"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Model */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Cost by Model</h2>
          <div className="space-y-3">
            {stats.costByModel.map((item) => (
              <div key={item.model}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{item.model}</span>
                  <span className="text-gray-600">${item.cost.toFixed(4)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Operations */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Top Operations</h2>
          <div className="space-y-3">
            {stats.topOperations.map((item, idx) => (
              <div key={item.operation} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">{item.operation}</div>
                  <div className="text-xs text-gray-500">{item.count} operations</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Incidents */}
      {stats.securityIncidents > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-red-900 flex items-center gap-2">
            <span>🚨</span>
            Recent Security Incidents
          </h2>
          <div className="space-y-3">
            {stats.recentIncidents.map((incident, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-4 border border-red-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{incident.type}</div>
                    <div className="text-sm text-gray-600">{incident.operation}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        incident.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : incident.severity === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {incident.severity.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(incident.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down';
  alert?: boolean;
}

function MetricCard({ title, value, icon, color, trend, alert }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    red: 'bg-red-50 border-red-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    pink: 'bg-pink-50 border-pink-200',
  };

  return (
    <div
      className={`rounded-lg shadow-lg p-6 border-2 ${
        colorClasses[color as keyof typeof colorClasses]
      } ${alert ? 'animate-pulse' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
}

export default AISecurityDashboard;

