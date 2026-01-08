/**
 * Analytics Dashboard Component
 * Phase 4: Analytics & Reporting
 * 
 * Displays analytics and metrics
 */

import React, { useEffect, useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const AnalyticsDashboard: React.FC = () => {
  const {
    dashboardMetrics,
    loadDashboard,
    isLoadingDashboard,
    usageStats,
    loadUsageStats,
    isLoadingUsageStats,
    costBreakdown,
    loadCostBreakdown,
    isLoadingCostBreakdown,
    transcriptStats,
    loadTranscriptStats,
    isLoadingTranscriptStats,
    storageUsage,
    loadStorageUsage,
    isLoadingStorageUsage,
    currentReport,
    generateReport,
    exportReport,
    isGeneratingReport,
    error,
    clearError,
  } = useAnalytics({ autoLoadDashboard: true });

  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    const now = new Date();
    let start: Date;

    switch (dateRange) {
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    setStartDate(start);
    setEndDate(now);
    loadUsageStats(start, now);
    loadCostBreakdown(start, now);
    loadTranscriptStats(start, now);
    loadStorageUsage();
  }, [dateRange, loadUsageStats, loadCostBreakdown, loadTranscriptStats, loadStorageUsage]);

  const handleGenerateReport = async () => {
    try {
      await generateReport('custom', startDate, endDate);
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  const handleExportReport = async (format: 'csv' | 'json') => {
    if (!currentReport) return;

    try {
      const blob = await exportReport(currentReport, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${currentReport.type}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export report:', err);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>📊 Analytics Dashboard</h1>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          color: '#721c24',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span><strong>Error:</strong> {error}</span>
          <button
            onClick={clearError}
            style={{
              padding: '5px 10px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Date Range Selector */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '5px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['week', 'month', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              style={{
                padding: '8px 16px',
                backgroundColor: dateRange === range ? '#007bff' : '#fff',
                color: dateRange === range ? '#fff' : '#000',
                border: '1px solid #007bff',
                borderRadius: '5px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {range}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isGeneratingReport ? 'not-allowed' : 'pointer',
            }}
          >
            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
          </button>
          {currentReport && (
            <>
              <button
                onClick={() => handleExportReport('csv')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExportReport('json')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Export JSON
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      {dashboardMetrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}>
          {/* Today */}
          <div style={{
            padding: '20px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#666' }}>Today</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
              {dashboardMetrics.today.transcripts}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {dashboardMetrics.today.minutes.toFixed(1)} minutes • ${dashboardMetrics.today.cost.toFixed(2)}
            </div>
          </div>

          {/* This Week */}
          <div style={{
            padding: '20px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#666' }}>This Week</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
              {dashboardMetrics.thisWeek.transcripts}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {dashboardMetrics.thisWeek.minutes.toFixed(1)} minutes • ${dashboardMetrics.thisWeek.cost.toFixed(2)}
            </div>
          </div>

          {/* This Month */}
          <div style={{
            padding: '20px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#666' }}>This Month</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
              {dashboardMetrics.thisMonth.transcripts}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {dashboardMetrics.thisMonth.minutes.toFixed(1)} minutes • ${dashboardMetrics.thisMonth.cost.toFixed(2)}
            </div>
          </div>

          {/* Total */}
          <div style={{
            padding: '20px',
            backgroundColor: '#e7f3ff',
            border: '2px solid #007bff',
            borderRadius: '8px',
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#007bff' }}>Total</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', color: '#007bff' }}>
              {dashboardMetrics.total.transcripts}
            </div>
            <div style={{ fontSize: '14px', color: '#007bff' }}>
              {dashboardMetrics.total.minutes.toFixed(1)} minutes • {dashboardMetrics.total.words.toLocaleString()} words
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
      }}>
        {/* Usage Over Time */}
        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}>
          <h3>📈 Usage Over Time</h3>
          {isLoadingUsageStats ? (
            <p>Loading...</p>
          ) : usageStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="transcripts_count" stroke="#8884d8" name="Transcripts" />
                <Line type="monotone" dataKey="total_minutes" stroke="#82ca9d" name="Minutes" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#666' }}>No data available</p>
          )}
        </div>

        {/* Cost Breakdown */}
        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}>
          <h3>💰 Cost Breakdown</h3>
          {isLoadingCostBreakdown ? (
            <p>Loading...</p>
          ) : costBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="api_cost" fill="#8884d8" name="API" />
                <Bar dataKey="storage_cost" fill="#82ca9d" name="Storage" />
                <Bar dataKey="ai_features_cost" fill="#ffc658" name="AI Features" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#666' }}>No data available</p>
          )}
        </div>
      </div>

      {/* Transcript Stats */}
      {transcriptStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}>
          {/* By Language */}
          <div style={{
            padding: '20px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}>
            <h3>🌐 Transcripts by Language</h3>
            {Object.keys(transcriptStats.by_language).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(transcriptStats.by_language).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.keys(transcriptStats.by_language).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#666' }}>No data available</p>
            )}
          </div>

          {/* By Professional Mode */}
          <div style={{
            padding: '20px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}>
            <h3>💼 Transcripts by Mode</h3>
            {Object.keys(transcriptStats.by_professional_mode).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(transcriptStats.by_professional_mode).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#82ca9d"
                    dataKey="value"
                  >
                    {Object.keys(transcriptStats.by_professional_mode).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#666' }}>No data available</p>
            )}
          </div>
        </div>
      )}

      {/* Storage Usage */}
      {storageUsage && (
        <div style={{
          padding: '20px',
          marginBottom: '20px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}>
          <h3>💾 Storage Usage</h3>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {storageUsage.total_gb.toFixed(2)} GB
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Storage</div>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                ${storageUsage.cost.toFixed(2)}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Monthly Cost</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading States */}
      {(isLoadingDashboard || isLoadingUsageStats || isLoadingCostBreakdown) && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
        }}>
          Loading analytics...
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;

