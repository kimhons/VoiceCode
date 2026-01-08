/**
 * Supabase Analytics Dashboard Component
 * Uses RPC functions for advanced analytics with database integration
 */
import { useEffect, useState, useCallback } from 'react';
import { SupabaseService } from '../../services/supabase.service';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

interface RecordingsByDay {
  date: string;
  count: number;
  total_duration: number;
  avg_confidence: number;
}

interface LanguageDistribution {
  language: string;
  count: number;
  percentage: number;
}

interface UsageStats {
  total_transcripts: number;
  total_duration: number;
  total_words: number;
  avg_confidence: number;
  transcripts_this_month: number;
  duration_this_month: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function SupabaseAnalyticsDashboard() {
  const [recordingsByDay, setRecordingsByDay] = useState<RecordingsByDay[]>([]);
  const [languageDistribution, setLanguageDistribution] = useState<LanguageDistribution[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabaseService = new SupabaseService();
      const client = supabaseService.getClient();
      const user = supabaseService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const [recordingsRes, languagesRes, statsRes] = await Promise.all([
        client.rpc('get_recordings_by_day', { p_user_id: user.id, p_days: 30 }),
        client.rpc('get_language_distribution', { p_user_id: user.id }),
        client.rpc('get_usage_stats', { p_user_id: user.id }),
      ]);

      if (recordingsRes.error) throw recordingsRes.error;
      if (languagesRes.error) throw languagesRes.error;
      if (statsRes.error) throw statsRes.error;

      setRecordingsByDay(recordingsRes.data || []);
      setLanguageDistribution(languagesRes.data || []);
      setUsageStats(statsRes.data?.[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const exportToCSV = () => {
    const data = recordingsByDay.map(r => ({
      date: r.date,
      recordings: r.count,
      duration_minutes: Math.round(r.total_duration / 60),
      avg_confidence: (r.avg_confidence * 100).toFixed(1),
    }));

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceflow-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', color: 'red', padding: '1rem' }}>
        <p>{error}</p>
        <button onClick={loadAnalytics} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Supabase Analytics</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={loadAnalytics}>Refresh</button>
          <button onClick={exportToCSV}>Export CSV</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Recordings</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{usageStats?.total_transcripts || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#999' }}>{usageStats?.transcripts_this_month || 0} this month</div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Duration</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatDuration(usageStats?.total_duration || 0)}</div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Words</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{usageStats?.total_words?.toLocaleString() || 0}</div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '0.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Avg Confidence</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{((usageStats?.avg_confidence || 0) * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '0.5rem', padding: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Recordings Over Time</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recordingsByDay.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#0088FE" name="Recordings" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '0.5rem', padding: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Language Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={languageDistribution} dataKey="count" nameKey="language" cx="50%" cy="50%" outerRadius={100}>
                  {languageDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ gridColumn: 'span 2', border: '1px solid #ddd', borderRadius: '0.5rem', padding: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Recording Duration by Day</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recordingsByDay.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_duration" fill="#00C49F" name="Duration (sec)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupabaseAnalyticsDashboard;

