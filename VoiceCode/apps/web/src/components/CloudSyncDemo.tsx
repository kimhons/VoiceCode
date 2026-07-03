/**
 * Cloud Sync Demo Component
 * Phase 2.3: Cloud Sync & Storage
 * 
 * Demonstrates cloud sync, offline storage, and collaboration features
 */

import React, { useState } from 'react';
import { useCloudSync } from '../hooks/useCloudSync';
import { Transcript } from '../services/supabase.service';

export const CloudSyncDemo: React.FC = () => {
  const {
    // Authentication
    isAuthenticated,
    user,
    signIn,
    signUp,
    signOut,

    // Sync
    syncStatus,
    syncProgress,
    sync,
    setAutoSync,

    // Transcripts
    transcripts,
    isLoading,
    error,
    saveTranscript,
    updateTranscript,
    deleteTranscript,
    searchTranscripts,
    refreshTranscripts,

    // Offline
    isOnline,
    offlineCount,
    clearOfflineData,
  } = useCloudSync({
    autoSync: true,
    syncInterval: 5,
    offlineFirst: true,
  });

  // Local state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Transcript[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);

  // Handle sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to sign in');
    }
  };

  // Handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(email, password, fullName);
      setEmail('');
      setPassword('');
      setFullName('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to sign up');
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const results = await searchTranscripts(searchQuery);
    setSearchResults(results);
  };

  // Handle create transcript
  const handleCreateTranscript = async () => {
    const transcript = await saveTranscript({
      user_id: user?.id || '',
      title: 'New Transcript',
      content: 'This is a test transcript created at ' + new Date().toLocaleString(),
      language: 'en',
      professional_mode: 'general',
      duration: 60,
      word_count: 10,
      confidence: 0.95,
      metadata: {
        device: 'web',
        platform: 'browser',
        version: '1.0.0',
      },
      is_deleted: false,
    });
    alert('Transcript created: ' + transcript.id);
  };

  // Handle sync
  const handleSync = async () => {
    try {
      const result = await sync();
      alert(`Sync complete!\nUploaded: ${result.uploaded}\nDownloaded: ${result.downloaded}\nConflicts: ${result.conflicts}\nErrors: ${result.errors}\nDuration: ${result.duration}ms`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Sync failed');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>☁️ Cloud Sync Demo</h1>

      {/* Connection Status */}
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        backgroundColor: isOnline ? '#d4edda' : '#f8d7da',
        border: `1px solid ${isOnline ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '5px'
      }}>
        <h3>Connection Status</h3>
        <p>
          <strong>Status:</strong> {isOnline ? '🟢 Online' : '🔴 Offline'}<br />
          <strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}<br />
          <strong>Pending Sync:</strong> {offlineCount} items<br />
          <strong>Auto Sync:</strong> {syncStatus.autoSync ? '✅ Enabled' : '❌ Disabled'}<br />
          <strong>Last Sync:</strong> {syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleString() : 'Never'}
        </p>
      </div>

      {/* Authentication */}
      {!isAuthenticated ? (
        <div style={{ marginBottom: '20px' }}>
          <h3>🔐 Authentication</h3>
          <form onSubmit={handleSignIn} style={{ marginBottom: '10px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <button type="submit" style={{ padding: '5px 15px' }}>Sign In</button>
          </form>
          <form onSubmit={handleSignUp}>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <button type="submit" style={{ padding: '5px 15px' }}>Sign Up</button>
          </form>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <h3>👤 User Profile</h3>
          <p>
            <strong>Email:</strong> {user?.email}<br />
            <strong>Name:</strong> {user?.full_name || 'Not set'}<br />
            <strong>Tier:</strong> {user?.subscription_tier}<br />
            <strong>Total Transcripts:</strong> {user?.usage_stats.total_transcripts || 0}
          </p>
          <button onClick={signOut} style={{ padding: '5px 15px' }}>Sign Out</button>
        </div>
      )}

      {/* Sync Controls */}
      {isAuthenticated && (
        <div style={{ marginBottom: '20px' }}>
          <h3>🔄 Sync Controls</h3>
          <button onClick={handleSync} disabled={syncStatus.isSyncing} style={{ marginRight: '10px', padding: '5px 15px' }}>
            {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button onClick={() => setAutoSync(!syncStatus.autoSync)} style={{ marginRight: '10px', padding: '5px 15px' }}>
            {syncStatus.autoSync ? 'Disable Auto Sync' : 'Enable Auto Sync'}
          </button>
          <button onClick={refreshTranscripts} style={{ marginRight: '10px', padding: '5px 15px' }}>
            Refresh
          </button>
          <button onClick={clearOfflineData} style={{ padding: '5px 15px', backgroundColor: '#dc3545', color: 'white' }}>
            Clear Offline Data
          </button>

          {syncProgress && (
            <div style={{ marginTop: '10px' }}>
              <p>Syncing: {syncProgress.current}</p>
              <progress value={syncProgress.percentage} max={100} style={{ width: '100%' }} />
              <p>{syncProgress.completed} / {syncProgress.total} ({syncProgress.percentage.toFixed(0)}%)</p>
            </div>
          )}
        </div>
      )}

      {/* Transcript Actions */}
      {isAuthenticated && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📝 Transcript Actions</h3>
          <button onClick={handleCreateTranscript} style={{ padding: '5px 15px' }}>
            Create Test Transcript
          </button>
        </div>
      )}

      {/* Search */}
      {isAuthenticated && (
        <div style={{ marginBottom: '20px' }}>
          <h3>🔍 Search Transcripts</h3>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginRight: '10px', padding: '5px', width: '300px' }}
          />
          <button onClick={handleSearch} style={{ padding: '5px 15px' }}>Search</button>

          {searchResults.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h4>Search Results ({searchResults.length})</h4>
              <ul>
                {searchResults.map(t => (
                  <li key={t.id}>
                    <strong>{t.title}</strong> - {new Date(t.created_at).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Transcripts List */}
      {isAuthenticated && (
        <div>
          <h3>📄 Transcripts ({transcripts.length})</h3>
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>Error: {error}</p>
          ) : transcripts.length === 0 ? (
            <p>No transcripts yet. Create one to get started!</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {transcripts.map(transcript => (
                <div
                  key={transcript.id}
                  style={{
                    padding: '10px',
                    marginBottom: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    backgroundColor: selectedTranscript?.id === transcript.id ? '#e7f3ff' : 'white'
                  }}
                  onClick={() => setSelectedTranscript(transcript)}
                >
                  <h4>{transcript.title}</h4>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    {transcript.language} • {transcript.professional_mode} • {transcript.word_count} words • {transcript.duration}s
                  </p>
                  <p style={{ fontSize: '12px', color: '#999' }}>
                    Created: {new Date(transcript.created_at).toLocaleString()}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTranscript(transcript.id);
                    }}
                    style={{ padding: '3px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Transcript Details */}
      {selectedTranscript && (
        <div style={{ marginTop: '20px', padding: '15px', border: '2px solid #007bff', borderRadius: '5px' }}>
          <h3>Selected Transcript</h3>
          <p><strong>ID:</strong> {selectedTranscript.id}</p>
          <p><strong>Title:</strong> {selectedTranscript.title}</p>
          <p><strong>Content:</strong></p>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap' }}>
            {selectedTranscript.content}
          </pre>
          <p><strong>Confidence:</strong> {(selectedTranscript.confidence * 100).toFixed(1)}%</p>
          <button onClick={() => setSelectedTranscript(null)} style={{ padding: '5px 15px' }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default CloudSyncDemo;

