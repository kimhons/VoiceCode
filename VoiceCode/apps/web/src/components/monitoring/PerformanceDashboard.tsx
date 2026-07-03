/**
 * Performance Monitoring Dashboard
 * Track latency, throughput, and system performance
 */

import React, { useState, useEffect } from 'react';
import { aiAuditLoggingService } from '../../services/aiAuditLogging.service';
import { reportExportService, ExportFormat } from '../../services/reportExport.service';

interface PerformanceMetrics {
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  errorRate: number;
  slowestOperations: Array<{
    operation: string;
    avgLatency: number;
    count: number;
  }>;
  latencyTrend: Array<{
    timestamp: Date;
    latency: number;
  }>;
}

export function PerformanceDashboard({ userId }: { userId: string }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadMetrics = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24h

      const stats = await aiAuditLoggingService.getUsageStatistics(userId, startDate, endDate);

      // Simulate performance metrics (you'd implement these in the service)
      const latencies = Array.from({ length: 100 }, () => Math.random() * 2000 + 100);
      latencies.sort((a, b) => a - b);

      const latencyTrend = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(startDate.getTime() + i * 60 * 60 * 1000),
        latency: Math.random() * 500 + 200,
      }));

      setMetrics({
        averageLatency: stats.averageLatency,
        p50Latency: latencies[Math.floor(latencies.length * 0.5)],
        p95Latency: latencies[Math.floor(latencies.length * 0.95)],
        p99Latency: latencies[Math.floor(latencies.length * 0.99)],
        throughput: stats.totalOperations / 24, // ops per hour
        errorRate: 1 - stats.successRate,
        slowestOperations: [
          { operation: 'text_enhancement', avgLatency: 1250, count: 45 },
          { operation: 'transcription', avgLatency: 980, count: 120 },
          { operation: 'translation', avgLatency: 850, count: 67 },
        ],
        latencyTrend,
      });
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [userId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadMetrics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!metrics) {
    return <div className="text-center text-gray-500 py-8">No data available</div>;
  }

  const handleExport = async (format: ExportFormat) => {
    if (!metrics) return;

    try {
      await reportExportService.exportPerformanceReport(
        metrics,
        { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date() },
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
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Performance Monitoring</h1>
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
        </div>
      </div>

      {/* Latency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LatencyCard
          title="Average Latency"
          value={`${metrics.averageLatency.toFixed(0)}ms`}
          status={getLatencyStatus(metrics.averageLatency)}
        />
        <LatencyCard
          title="P50 Latency"
          value={`${metrics.p50Latency.toFixed(0)}ms`}
          status={getLatencyStatus(metrics.p50Latency)}
        />
        <LatencyCard
          title="P95 Latency"
          value={`${metrics.p95Latency.toFixed(0)}ms`}
          status={getLatencyStatus(metrics.p95Latency)}
        />
        <LatencyCard
          title="P99 Latency"
          value={`${metrics.p99Latency.toFixed(0)}ms`}
          status={getLatencyStatus(metrics.p99Latency)}
        />
      </div>

      {/* Throughput & Error Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Throughput</h3>
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {metrics.throughput.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">operations per hour</div>
          <div className="mt-4 text-xs text-gray-500">
            {(metrics.throughput / 60).toFixed(2)} ops/min
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Error Rate</h3>
          <div
            className={`text-4xl font-bold mb-2 ${
              metrics.errorRate < 0.01
                ? 'text-green-600'
                : metrics.errorRate < 0.05
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}
          >
            {(metrics.errorRate * 100).toFixed(2)}%
          </div>
          <div className="text-sm text-gray-600">of all operations</div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  metrics.errorRate < 0.01
                    ? 'bg-green-500'
                    : metrics.errorRate < 0.05
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(metrics.errorRate * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Latency Trend Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Latency Trend (24h)</h2>
        <div className="h-64 flex items-end gap-1">
          {metrics.latencyTrend.map((point, idx) => {
            const maxLatency = Math.max(...metrics.latencyTrend.map(p => p.latency));
            const height = (point.latency / maxLatency) * 100;
            const status = getLatencyStatus(point.latency);
            
            return (
              <div
                key={idx}
                className="flex-1 group relative"
                style={{ height: '100%' }}
              >
                <div
                  className={`hover:opacity-80 transition-opacity rounded-t cursor-pointer ${
                    status === 'good'
                      ? 'bg-green-500'
                      : status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                >
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                    <div className="font-bold">
                      {point.timestamp.toLocaleTimeString()}
                    </div>
                    <div>Latency: {point.latency.toFixed(0)}ms</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{metrics.latencyTrend[0]?.timestamp.toLocaleTimeString()}</span>
          <span>
            {metrics.latencyTrend[metrics.latencyTrend.length - 1]?.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Slowest Operations */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Slowest Operations</h2>
        <div className="space-y-4">
          {metrics.slowestOperations.map((op, idx) => (
            <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-medium text-gray-900">{op.operation}</div>
                  <div className="text-sm text-gray-500">{op.count} operations</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {op.avgLatency.toFixed(0)}ms
                  </div>
                  <div className="text-xs text-gray-500">avg latency</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    op.avgLatency < 500
                      ? 'bg-green-500'
                      : op.avgLatency < 1000
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      (op.avgLatency / Math.max(...metrics.slowestOperations.map(o => o.avgLatency))) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-purple-900 flex items-center gap-2">
          <span>⚡</span>
          Performance Recommendations
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {metrics.averageLatency > 1000 && (
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              <span>
                <strong>High latency detected:</strong> Consider implementing caching or using a
                faster model for simple operations
              </span>
            </li>
          )}
          {metrics.errorRate > 0.05 && (
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              <span>
                <strong>High error rate:</strong> Review error logs and implement retry logic with
                exponential backoff
              </span>
            </li>
          )}
          {metrics.p99Latency > 2000 && (
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              <span>
                <strong>P99 latency is high:</strong> Some requests are taking too long. Consider
                implementing timeouts
              </span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Use context management to reduce processing time by up to 30%</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Implement request batching for better throughput</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Helper function to determine latency status
function getLatencyStatus(latency: number): 'good' | 'warning' | 'critical' {
  if (latency < 500) return 'good';
  if (latency < 1000) return 'warning';
  return 'critical';
}

// Latency Card Component
interface LatencyCardProps {
  title: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
}

function LatencyCard({ title, value, status }: LatencyCardProps) {
  const statusColors = {
    good: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    critical: 'bg-red-50 border-red-200',
  };

  const statusIcons = {
    good: '✅',
    warning: '⚠️',
    critical: '🚨',
  };

  return (
    <div className={`rounded-lg shadow-lg p-6 border-2 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        <span className="text-xl">{statusIcons[status]}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

export default PerformanceDashboard;

