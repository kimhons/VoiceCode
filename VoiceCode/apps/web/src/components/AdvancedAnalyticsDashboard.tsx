/**
 * Advanced Analytics Dashboard Component
 * Phase 5.7: Advanced Analytics
 * 
 * Comprehensive analytics visualization with charts and insights
 */

import React, { useState, useEffect } from 'react';
import { useAdvancedAnalytics } from '../hooks/useAdvancedAnalytics';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AdvancedAnalyticsDashboard.css';

interface AdvancedAnalyticsDashboardProps {
  userId: string;
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({ userId }) => {
  const {
    getAllAnalytics,
    usageAnalytics,
    costAnalytics,
    performanceAnalytics,
    roiMetrics,
    analyzeTrend,
    trendAnalysis,
    isLoading,
    error,
    clearError,
  } = useAdvancedAnalytics({ userId });

  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'cost' | 'performance' | 'roi' | 'trends'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    return { startDate, endDate };
  };

  // Load analytics on mount and date range change
  useEffect(() => {
    const { startDate, endDate } = getDateRange();
    getAllAnalytics(startDate, endDate);
  }, [dateRange]);

  // Load trend analysis
  useEffect(() => {
    if (activeTab === 'trends') {
      const { startDate, endDate } = getDateRange();
      analyzeTrend('transcripts', startDate, endDate);
    }
  }, [activeTab, dateRange]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

  return (
    <div className="advanced-analytics-dashboard">
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
          <h1>📊 Advanced Analytics</h1>
          <p>Comprehensive insights and performance metrics</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="date-range-selector">
          <button className={dateRange === '7d' ? 'active' : ''} onClick={() => setDateRange('7d')}>7 Days</button>
          <button className={dateRange === '30d' ? 'active' : ''} onClick={() => setDateRange('30d')}>30 Days</button>
          <button className={dateRange === '90d' ? 'active' : ''} onClick={() => setDateRange('90d')}>90 Days</button>
          <button className={dateRange === '1y' ? 'active' : ''} onClick={() => setDateRange('1y')}>1 Year</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          📊 Overview
        </button>
        <button className={activeTab === 'usage' ? 'active' : ''} onClick={() => setActiveTab('usage')}>
          📈 Usage
        </button>
        <button className={activeTab === 'cost' ? 'active' : ''} onClick={() => setActiveTab('cost')}>
          💰 Cost
        </button>
        <button className={activeTab === 'performance' ? 'active' : ''} onClick={() => setActiveTab('performance')}>
          ⚡ Performance
        </button>
        <button className={activeTab === 'roi' ? 'active' : ''} onClick={() => setActiveTab('roi')}>
          💎 ROI
        </button>
        <button className={activeTab === 'trends' ? 'active' : ''} onClick={() => setActiveTab('trends')}>
          📉 Trends
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="overview-panel">
            <div className="metrics-grid">
              {usageAnalytics && (
                <>
                  <div className="metric-card gradient-1">
                    <div className="metric-icon">📝</div>
                    <div className="metric-value">{usageAnalytics.totalTranscripts}</div>
                    <div className="metric-label">Total Transcripts</div>
                  </div>
                  <div className="metric-card gradient-2">
                    <div className="metric-icon">⏱️</div>
                    <div className="metric-value">{formatDuration(usageAnalytics.totalDuration)}</div>
                    <div className="metric-label">Total Duration</div>
                  </div>
                  <div className="metric-card gradient-3">
                    <div className="metric-icon">📊</div>
                    <div className="metric-value">{usageAnalytics.totalWords.toLocaleString()}</div>
                    <div className="metric-label">Total Words</div>
                  </div>
                  <div className="metric-card gradient-4">
                    <div className="metric-icon">🎯</div>
                    <div className="metric-value">{Math.round(usageAnalytics.averageAccuracy * 100)}%</div>
                    <div className="metric-label">Avg Accuracy</div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Stats */}
            {costAnalytics && roiMetrics && (
              <div className="quick-stats">
                <div className="stat-row">
                  <span className="stat-label">💰 Total Cost:</span>
                  <span className="stat-value">{formatCurrency(costAnalytics.totalCost)}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">💎 ROI:</span>
                  <span className="stat-value positive">{Math.round(roiMetrics.roi)}%</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">⏰ Time Saved:</span>
                  <span className="stat-value">{Math.round(roiMetrics.timeSaved)} hours</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">💵 Cost Saved:</span>
                  <span className="stat-value positive">{formatCurrency(roiMetrics.costSaved)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Usage Analytics */}
        {activeTab === 'usage' && usageAnalytics && (
          <div className="usage-panel">
            <div className="chart-section">
              <h2>Most Used Languages</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageAnalytics.mostUsedLanguages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="language" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-section">
              <h2>Most Used Modes</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={usageAnalytics.mostUsedModes}
                    dataKey="count"
                    nameKey="mode"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {usageAnalytics.mostUsedModes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="stats-list">
              <h2>Usage Statistics</h2>
              <div className="stat-item">
                <span>Transcripts per Day:</span>
                <strong>{usageAnalytics.transcriptsPerDay.toFixed(1)}</strong>
              </div>
              <div className="stat-item">
                <span>Peak Usage Hours:</span>
                <strong>{usageAnalytics.peakUsageHours.join(', ')}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Cost Analytics */}
        {activeTab === 'cost' && costAnalytics && (
          <div className="cost-panel">
            <div className="cost-metrics">
              <div className="cost-card">
                <h3>Cost per Transcript</h3>
                <div className="cost-value">{formatCurrency(costAnalytics.costPerTranscript)}</div>
              </div>
              <div className="cost-card">
                <h3>Cost per Minute</h3>
                <div className="cost-value">{formatCurrency(costAnalytics.costPerMinute)}</div>
              </div>
              <div className="cost-card">
                <h3>Cost per Word</h3>
                <div className="cost-value">{formatCurrency(costAnalytics.costPerWord)}</div>
              </div>
              <div className="cost-card">
                <h3>Projected Monthly</h3>
                <div className="cost-value">{formatCurrency(costAnalytics.projectedMonthlyCost)}</div>
              </div>
            </div>

            <div className="chart-section">
              <h2>Cost Breakdown</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costAnalytics.costBreakdown}
                    dataKey="cost"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.category}: ${entry.percentage.toFixed(1)}%`}
                  >
                    {costAnalytics.costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="savings-section">
              <h2>💡 Savings Opportunities</h2>
              {costAnalytics.savingsOpportunities.map((opp, index) => (
                <div key={index} className="savings-card">
                  <div className="savings-suggestion">{opp.suggestion}</div>
                  <div className="savings-amount">{formatCurrency(opp.potentialSavings)}/month</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Analytics */}
        {activeTab === 'performance' && performanceAnalytics && (
          <div className="performance-panel">
            <div className="performance-metrics">
              <div className="perf-card">
                <h3>Avg Transcription Time</h3>
                <div className="perf-value">{performanceAnalytics.averageTranscriptionTime.toFixed(1)}s</div>
              </div>
              <div className="perf-card">
                <h3>Processing Speed</h3>
                <div className="perf-value">{performanceAnalytics.averageProcessingSpeed.toFixed(1)} w/s</div>
              </div>
              <div className="perf-card">
                <h3>Success Rate</h3>
                <div className="perf-value">{performanceAnalytics.successRate.toFixed(1)}%</div>
              </div>
              <div className="perf-card">
                <h3>Avg Confidence</h3>
                <div className="perf-value">{Math.round(performanceAnalytics.averageConfidence * 100)}%</div>
              </div>
            </div>

            <div className="chart-section">
              <h2>Performance by Mode</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceAnalytics.performanceByMode}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mode" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgTime" fill="#667eea" name="Avg Time (s)" />
                  <Bar yAxisId="right" dataKey="successRate" fill="#43e97b" name="Success Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ROI Metrics */}
        {activeTab === 'roi' && roiMetrics && (
          <div className="roi-panel">
            <div className="roi-hero">
              <div className="roi-main">
                <h2>Return on Investment</h2>
                <div className="roi-value">{Math.round(roiMetrics.roi)}%</div>
                <p>You're saving {formatCurrency(roiMetrics.costSaved)} compared to manual transcription</p>
              </div>
            </div>

            <div className="roi-metrics">
              <div className="roi-card">
                <div className="roi-icon">⏰</div>
                <div className="roi-stat">
                  <div className="roi-label">Time Saved</div>
                  <div className="roi-number">{Math.round(roiMetrics.timeSaved)} hours</div>
                </div>
              </div>
              <div className="roi-card">
                <div className="roi-icon">💰</div>
                <div className="roi-stat">
                  <div className="roi-label">Cost Saved</div>
                  <div className="roi-number">{formatCurrency(roiMetrics.costSaved)}</div>
                </div>
              </div>
              <div className="roi-card">
                <div className="roi-icon">📈</div>
                <div className="roi-stat">
                  <div className="roi-label">Productivity Gain</div>
                  <div className="roi-number">{Math.round(roiMetrics.productivityGain)}%</div>
                </div>
              </div>
              <div className="roi-card">
                <div className="roi-icon">📅</div>
                <div className="roi-stat">
                  <div className="roi-label">Payback Period</div>
                  <div className="roi-number">{roiMetrics.paybackPeriod.toFixed(1)} months</div>
                </div>
              </div>
            </div>

            <div className="cost-comparison">
              <h2>Cost Comparison</h2>
              <div className="comparison-bars">
                <div className="comparison-item">
                  <span>Manual Transcription</span>
                  <div className="comparison-bar manual">
                    <div className="bar-fill" style={{ width: '100%' }} />
                    <span className="bar-label">{formatCurrency(roiMetrics.manualTranscriptionCost)}</span>
                  </div>
                </div>
                <div className="comparison-item">
                  <span>Automated Transcription</span>
                  <div className="comparison-bar automated">
                    <div className="bar-fill" style={{ width: `${(roiMetrics.automatedTranscriptionCost / roiMetrics.manualTranscriptionCost) * 100}%` }} />
                    <span className="bar-label">{formatCurrency(roiMetrics.automatedTranscriptionCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trends */}
        {activeTab === 'trends' && trendAnalysis && (
          <div className="trends-panel">
            <div className="trend-header">
              <h2>Trend Analysis: {trendAnalysis.metric}</h2>
              <div className={`trend-badge ${trendAnalysis.trend}`}>
                {trendAnalysis.trend === 'increasing' && '📈'}
                {trendAnalysis.trend === 'decreasing' && '📉'}
                {trendAnalysis.trend === 'stable' && '➡️'}
                {trendAnalysis.trend} {Math.abs(trendAnalysis.trendPercentage).toFixed(1)}%
              </div>
            </div>

            <div className="chart-section">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={[...trendAnalysis.dataPoints, ...trendAnalysis.forecast]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#667eea" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="value" stroke="#43e97b" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {trendAnalysis.anomalies.length > 0 && (
              <div className="anomalies-section">
                <h3>🔍 Anomalies Detected</h3>
                {trendAnalysis.anomalies.map((anomaly, index) => (
                  <div key={index} className="anomaly-card">
                    <div className="anomaly-date">{anomaly.date}</div>
                    <div className="anomaly-value">{anomaly.value}</div>
                    <div className="anomaly-reason">{anomaly.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner" />
            <p>Loading analytics...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;

