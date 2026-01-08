import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface GlobalDictationConfig {
  enabled: boolean;
  hotkey: string;
  auto_paste: boolean;
  show_notification: boolean;
  language: string;
  save_history: boolean;
  max_history_items: number;
  auto_punctuation: boolean;
  voice_commands_enabled: boolean;
}

interface DictationHistoryItem {
  id: string;
  text: string;
  timestamp: number;
  language: string;
  word_count: number;
  duration_ms: number;
  application: string | null;
}

interface HistoryStats {
  total_sessions: number;
  total_words: number;
  total_duration_ms: number;
  average_words_per_session: number;
  average_duration_ms: number;
}

interface Props {
  onClose: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'hi-IN', name: 'Hindi' },
];

export const GlobalDictationSettings: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'history' | 'languages'>('general');
  const [config, setConfig] = useState<GlobalDictationConfig | null>(null);
  const [history, setHistory] = useState<DictationHistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
    loadHistory();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const cfg = await invoke<GlobalDictationConfig>('get_global_dictation_config');
      setConfig(cfg);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const hist = await invoke<DictationHistoryItem[]>('get_dictation_history');
      setHistory(hist);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const loadStats = async () => {
    try {
      const st = await invoke<HistoryStats>('get_dictation_history_stats');
      setStats(st);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      await invoke('update_global_dictation_config', { config });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all dictation history?')) return;
    
    try {
      await invoke('clear_dictation_history');
      setHistory([]);
      loadStats();
      alert('History cleared successfully!');
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('Failed to clear history');
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await invoke('delete_dictation_history_item', { id });
      setHistory(history.filter(item => item.id !== id));
      loadStats();
    } catch (error) {
      console.error('Failed to delete history item:', error);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading || !config) {
    return (
      <div className="settings-modal">
        <div className="settings-content">
          <div className="loading">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-modal">
      <div className="settings-content global-dictation-settings">
        <div className="settings-header">
          <h2>🌍 Global Dictation Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-tabs">
          <button
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            ⚙️ General
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 History
          </button>
          <button
            className={`tab ${activeTab === 'languages' ? 'active' : ''}`}
            onClick={() => setActiveTab('languages')}
          >
            🌐 Languages
          </button>
        </div>

        <div className="settings-body">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>General Settings</h3>
              
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  />
                  Enable Global Dictation
                </label>
                <p className="setting-description">
                  Allow dictation into any text field system-wide
                </p>
              </div>

              <div className="setting-item">
                <label>Global Hotkey</label>
                <input
                  type="text"
                  value={config.hotkey}
                  onChange={(e) => setConfig({ ...config, hotkey: e.target.value })}
                  placeholder="CmdOrCtrl+Shift+D"
                />
                <p className="setting-description">
                  Keyboard shortcut to start/stop global dictation
                </p>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={config.auto_paste}
                    onChange={(e) => setConfig({ ...config, auto_paste: e.target.checked })}
                  />
                  Auto-paste text
                </label>
                <p className="setting-description">
                  Automatically paste dictated text into active field
                </p>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={config.show_notification}
                    onChange={(e) => setConfig({ ...config, show_notification: e.target.checked })}
                  />
                  Show notifications
                </label>
                <p className="setting-description">
                  Display system notifications for dictation events
                </p>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={config.auto_punctuation}
                    onChange={(e) => setConfig({ ...config, auto_punctuation: e.target.checked })}
                  />
                  Auto-punctuation
                </label>
                <p className="setting-description">
                  Automatically add punctuation based on speech patterns
                </p>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={config.voice_commands_enabled}
                    onChange={(e) => setConfig({ ...config, voice_commands_enabled: e.target.checked })}
                  />
                  Voice commands
                </label>
                <p className="setting-description">
                  Enable voice commands like "comma", "period", "new line"
                </p>
              </div>

              <div className="setting-actions">
                <button className="btn-primary" onClick={saveConfig} disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="settings-section">
              <h3>Dictation History</h3>
              
              {stats && (
                <div className="history-stats">
                  <div className="stat-card">
                    <div className="stat-value">{stats.total_sessions}</div>
                    <div className="stat-label">Total Sessions</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.total_words.toLocaleString()}</div>
                    <div className="stat-label">Total Words</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{formatDuration(stats.total_duration_ms)}</div>
                    <div className="stat-label">Total Time</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.average_words_per_session}</div>
                    <div className="stat-label">Avg Words/Session</div>
                  </div>
                </div>
              )}

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={config.save_history}
                    onChange={(e) => setConfig({ ...config, save_history: e.target.checked })}
                  />
                  Save dictation history
                </label>
              </div>

              <div className="setting-item">
                <label>Maximum history items</label>
                <input
                  type="number"
                  value={config.max_history_items}
                  onChange={(e) => setConfig({ ...config, max_history_items: parseInt(e.target.value) || 100 })}
                  min="10"
                  max="1000"
                />
              </div>

              <div className="history-actions">
                <button className="btn-danger" onClick={clearHistory}>
                  🗑️ Clear All History
                </button>
              </div>

              <div className="history-list">
                {history.length === 0 ? (
                  <p className="empty-state">No dictation history yet</p>
                ) : (
                  history.slice().reverse().map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-header">
                        <span className="history-date">{formatTimestamp(item.timestamp)}</span>
                        <span className="history-meta">
                          {item.word_count} words • {formatDuration(item.duration_ms)}
                        </span>
                        <button
                          className="delete-btn"
                          onClick={() => deleteHistoryItem(item.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="history-text">{item.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'languages' && (
            <div className="settings-section">
              <h3>Language Settings</h3>
              
              <div className="setting-item">
                <label>Dictation Language</label>
                <select
                  value={config.language}
                  onChange={(e) => setConfig({ ...config, language: e.target.value })}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <p className="setting-description">
                  Select the language for speech recognition
                </p>
              </div>

              <div className="language-info">
                <h4>Supported Languages</h4>
                <div className="language-grid">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <div key={lang.code} className="language-card">
                      <span className="language-flag">🌐</span>
                      <span className="language-name">{lang.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="setting-actions">
                <button className="btn-primary" onClick={saveConfig} disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

