/**
 * Analytics Demo Component
 * Phase 4: Analytics & Reporting
 * 
 * Demo component showcasing analytics features with sample data
 */

import React, { useState } from 'react';
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

export const AnalyticsDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'scheduled'>('dashboard');

  // Sample data
  const usageData = [
    { date: '2024-01-01', transcripts: 5, minutes: 45, exports: 2 },
    { date: '2024-01-02', transcripts: 8, minutes: 72, exports: 3 },
    { date: '2024-01-03', transcripts: 12, minutes: 98, exports: 5 },
    { date: '2024-01-04', transcripts: 7, minutes: 63, exports: 2 },
    { date: '2024-01-05', transcripts: 15, minutes: 125, exports: 7 },
    { date: '2024-01-06', transcripts: 10, minutes: 88, exports: 4 },
    { date: '2024-01-07', transcripts: 13, minutes: 105, exports: 6 },
  ];

  const costData = [
    { date: '2024-01-01', api: 0.15, storage: 0.05, ai: 0.08 },
    { date: '2024-01-02', api: 0.22, storage: 0.05, ai: 0.12 },
    { date: '2024-01-03', api: 0.35, storage: 0.06, ai: 0.18 },
    { date: '2024-01-04', api: 0.18, storage: 0.06, ai: 0.10 },
    { date: '2024-01-05', api: 0.42, storage: 0.07, ai: 0.25 },
    { date: '2024-01-06', api: 0.28, storage: 0.07, ai: 0.15 },
    { date: '2024-01-07', api: 0.38, storage: 0.08, ai: 0.20 },
  ];

  const languageData = [
    { name: 'English', value: 45 },
    { name: 'Spanish', value: 20 },
    { name: 'French', value: 15 },
    { name: 'German', value: 12 },
    { name: 'Other', value: 8 },
  ];

  const modeData = [
    { name: 'Medical', value: 30 },
    { name: 'Developer', value: 25 },
    { name: 'Business', value: 20 },
    { name: 'Legal', value: 15 },
    { name: 'Education', value: 10 },
  ];

  const scheduledReports = [
    { id: '1', name: 'Weekly Summary', type: 'weekly', format: 'pdf', recipients: ['user@example.com'], is_active: true },
    { id: '2', name: 'Monthly Report', type: 'monthly', format: 'csv', recipients: ['admin@example.com'], is_active: true },
    { id: '3', name: 'Daily Stats', type: 'daily', format: 'json', recipients: ['team@example.com'], is_active: false },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>📊 Analytics Demo</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        This is a demo showcasing the analytics and reporting features with sample data.
      </p>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '2px solid #ddd',
      }}>
        {(['dashboard', 'reports', 'scheduled'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid #007bff' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              color: activeTab === tab ? '#007bff' : '#666',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'scheduled' ? 'Scheduled Reports' : tab}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {/* Overview Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#666' }}>Today</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>13</div>
              <div style={{ fontSize: '14px', color: '#666' }}>105 minutes • $0.66</div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#666' }}>This Week</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>70</div>
              <div style={{ fontSize: '14px', color: '#666' }}>596 minutes • $3.54</div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#666' }}>This Month</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>285</div>
              <div style={{ fontSize: '14px', color: '#666' }}>2,450 minutes • $14.25</div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#e7f3ff',
              border: '2px solid #007bff',
              borderRadius: '8px',
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#007bff' }}>Total</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', color: '#007bff' }}>1,247</div>
              <div style={{ fontSize: '14px', color: '#007bff' }}>10,523 minutes • 1.2M words</div>
            </div>
          </div>

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
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="transcripts" stroke="#8884d8" name="Transcripts" />
                  <Line type="monotone" dataKey="minutes" stroke="#82ca9d" name="Minutes" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Cost Breakdown */}
            <div style={{
              padding: '20px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}>
              <h3>💰 Cost Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="api" fill="#8884d8" name="API" />
                  <Bar dataKey="storage" fill="#82ca9d" name="Storage" />
                  <Bar dataKey="ai" fill="#ffc658" name="AI Features" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Charts */}
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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {languageData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* By Professional Mode */}
            <div style={{
              padding: '20px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}>
              <h3>💼 Transcripts by Mode</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={modeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#82ca9d"
                    dataKey="value"
                  >
                    {modeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Storage Usage */}
          <div style={{
            padding: '20px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}>
            <h3>💾 Storage Usage</h3>
            <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>2.45 GB</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Storage</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>$0.25</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Monthly Cost</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}>
          <h2>📋 Generate Report</h2>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Report Type</label>
            <select style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px',
            }}>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Custom</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Date</label>
              <input
                type="date"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Date</label>
              <input
                type="date"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
              Generate Report
            </button>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
              Export CSV
            </button>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
              Export JSON
            </button>
          </div>
        </div>
      )}

      {/* Scheduled Reports Tab */}
      {activeTab === 'scheduled' && (
        <div>
          <div style={{
            padding: '20px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <h2>📅 Create Scheduled Report</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Report Name</label>
              <input
                type="text"
                placeholder="e.g., Weekly Summary"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Frequency</label>
                <select style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                }}>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Format</label>
                <select style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                }}>
                  <option>CSV</option>
                  <option>JSON</option>
                  <option>PDF</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Recipients (comma-separated)</label>
              <input
                type="text"
                placeholder="user@example.com, admin@example.com"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                }}
              />
            </div>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
              Create Scheduled Report
            </button>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}>
            <h2>📋 Scheduled Reports</h2>
            {scheduledReports.map(report => (
              <div
                key={report.id}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{report.name}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {report.type} • {report.format.toUpperCase()} • {report.recipients.join(', ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{
                    padding: '5px 10px',
                    backgroundColor: report.is_active ? '#d4edda' : '#f8d7da',
                    color: report.is_active ? '#155724' : '#721c24',
                    borderRadius: '5px',
                    fontSize: '12px',
                  }}>
                    {report.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button style={{
                    padding: '5px 10px',
                    backgroundColor: '#ffc107',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}>
                    Edit
                  </button>
                  <button style={{
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDemo;

