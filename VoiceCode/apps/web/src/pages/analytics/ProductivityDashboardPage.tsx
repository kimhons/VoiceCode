/**
 * Productivity Dashboard Page
 * Analytics and insights for transcription usage and productivity
 */

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  Users,
  Calendar,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
}

interface ChartData {
  label: string;
  value: number;
}

const ProductivityDashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>(
    '30d'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const metrics: MetricCard[] = [
    {
      title: 'Total Transcriptions',
      value: '1,247',
      change: 12.5,
      trend: 'up',
      icon: FileText,
      color: '#3b82f6',
    },
    {
      title: 'Hours Transcribed',
      value: '156.4',
      change: 8.3,
      trend: 'up',
      icon: Clock,
      color: '#10b981',
    },
    {
      title: 'Time Saved',
      value: '312h',
      change: 15.2,
      trend: 'up',
      icon: TrendingUp,
      color: '#8b5cf6',
    },
    {
      title: 'Active Users',
      value: '24',
      change: -2.1,
      trend: 'down',
      icon: Users,
      color: '#f59e0b',
    },
  ];

  const weeklyData: ChartData[] = [
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 62 },
    { label: 'Wed', value: 58 },
    { label: 'Thu', value: 71 },
    { label: 'Fri', value: 55 },
    { label: 'Sat', value: 28 },
    { label: 'Sun', value: 19 },
  ];

  const categoryData: ChartData[] = [
    { label: 'Meetings', value: 45 },
    { label: 'Medical', value: 25 },
    { label: 'Interviews', value: 15 },
    { label: 'Lectures', value: 10 },
    { label: 'Other', value: 5 },
  ];

  const topUsers = [
    { name: 'John Smith', transcriptions: 156, hours: 23.4 },
    { name: 'Sarah Johnson', transcriptions: 142, hours: 21.1 },
    { name: 'Mike Chen', transcriptions: 128, hours: 19.2 },
    { name: 'Emily Davis', transcriptions: 97, hours: 14.5 },
    { name: 'Alex Wilson', transcriptions: 84, hours: 12.6 },
  ];

  const recentActivity = [
    {
      type: 'transcription',
      title: 'Team Meeting Notes',
      user: 'John S.',
      time: '2 min ago',
    },
    {
      type: 'export',
      title: 'Q1 Report Summary',
      user: 'Sarah J.',
      time: '15 min ago',
    },
    {
      type: 'share',
      title: 'Client Call Recording',
      user: 'Mike C.',
      time: '1 hour ago',
    },
    {
      type: 'transcription',
      title: 'Patient Consultation',
      user: 'Emily D.',
      time: '2 hours ago',
    },
    {
      type: 'ai',
      title: 'AI Summary Generated',
      user: 'John S.',
      time: '3 hours ago',
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const maxWeeklyValue = Math.max(...weeklyData.map((d) => d.value));

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
                <BarChart3 size={32} />
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
                  Productivity Dashboard
                </h1>
              </div>
              <p style={{ fontSize: '15px', opacity: 0.9 }}>
                Track your transcription usage and team productivity
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="7d" style={{ color: '#1f2937' }}>
                  Last 7 days
                </option>
                <option value="30d" style={{ color: '#1f2937' }}>
                  Last 30 days
                </option>
                <option value="90d" style={{ color: '#1f2937' }}>
                  Last 90 days
                </option>
                <option value="1y" style={{ color: '#1f2937' }}>
                  Last year
                </option>
              </select>
              <button
                onClick={handleRefresh}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw
                  size={16}
                  style={{
                    animation: isRefreshing
                      ? 'spin 1s linear infinite'
                      : 'none',
                  }}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
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
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      padding: '10px',
                      background: `${metric.color}15`,
                      borderRadius: '10px',
                    }}
                  >
                    <Icon size={22} color={metric.color} />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background:
                        metric.trend === 'up'
                          ? '#dcfce7'
                          : metric.trend === 'down'
                            ? '#fef2f2'
                            : '#f3f4f6',
                      color:
                        metric.trend === 'up'
                          ? '#16a34a'
                          : metric.trend === 'down'
                            ? '#dc2626'
                            : '#6b7280',
                    }}
                  >
                    {metric.trend === 'up' ? (
                      <ArrowUp size={12} />
                    ) : metric.trend === 'down' ? (
                      <ArrowDown size={12} />
                    ) : null}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '4px',
                  }}
                >
                  {metric.value}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {metric.title}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Weekly Chart */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '20px',
              }}
            >
              Weekly Activity
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '12px',
                height: '200px',
              }}
            >
              {weeklyData.map((day, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${(day.value / maxWeeklyValue) * 160}px`,
                      background:
                        'linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '20px',
              }}
            >
              By Category
            </h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {categoryData.map((cat, index) => {
                const colors = [
                  '#4f46e5',
                  '#10b981',
                  '#f59e0b',
                  '#ec4899',
                  '#6b7280',
                ];
                return (
                  <div key={index}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#374151' }}>
                        {cat.label}
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#1f2937',
                        }}
                      >
                        {cat.value}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: '8px',
                        background: '#f3f4f6',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${cat.value}%`,
                          height: '100%',
                          background: colors[index],
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}
        >
          {/* Top Users */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '20px',
              }}
            >
              Top Users
            </h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {topUsers.map((user, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background:
                        index === 0
                          ? '#fef3c7'
                          : index === 1
                            ? '#f3f4f6'
                            : index === 2
                              ? '#fed7aa'
                              : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: index === 0 ? '#d97706' : '#6b7280',
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1f2937',
                      }}
                    >
                      {user.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {user.hours}h transcribed
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4f46e5',
                    }}
                  >
                    {user.transcriptions}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '20px',
              }}
            >
              Recent Activity
            </h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderBottom:
                      index < recentActivity.length - 1
                        ? '1px solid #f3f4f6'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background:
                        activity.type === 'transcription'
                          ? '#10b981'
                          : activity.type === 'export'
                            ? '#3b82f6'
                            : activity.type === 'share'
                              ? '#8b5cf6'
                              : '#f59e0b',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#1f2937',
                      }}
                    >
                      {activity.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {activity.user}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {activity.time}
                  </div>
                </div>
              ))}
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

export default ProductivityDashboardPage;
