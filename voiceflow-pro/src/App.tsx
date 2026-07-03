import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { Window } from '@tauri-apps/api/window';

// Types for our enhanced application
interface Settings {
  language: string;
  voice_model: string;
  hotkey: string;
  auto_start: boolean;
  theme: string;
  notifications: boolean;
  voice_recognition: VoiceRecognitionSettings;
  text_processing: TextProcessingSettings;
}

interface VoiceRecognitionSettings {
  continuous: boolean;
  interim_results: boolean;
  max_alternatives: number;
  confidence_threshold: number;
  noise_reduction: boolean;
  privacy_mode: boolean;
}

interface TextProcessingSettings {
  context: string;
  tone: string;
  aggressiveness: number;
  remove_fillers: boolean;
  enable_caching: boolean;
  smart_punctuation: boolean;
  auto_correct: boolean;
}

interface ProcessingResult {
  id: string;
  original_text: string;
  processed_text: string;
  confidence_score: number;
  processing_time_ms: number;
  changes_made: Array<{
    change_type: string;
    original: string;
    replacement: string;
    confidence: number;
  }>;
}

interface Language {
  code: string;
  name: string;
  native_name: string;
  flag: string;
}

interface VoiceStatus {
  is_listening: boolean;
  is_processing: boolean;
  current_transcript: string;
  response: string;
  engine_type: string;
  session_id: string;
}

interface AppInfo {
  name: string;
  version: string;
  platform: string;
  description: string;
}

// Enhanced App Component
const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState('');
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [confidence, setConfidence] = useState(0);

  // Initialize application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load initial data
        const [settingsData, appData, languagesData] = await Promise.all([
          invoke<Settings>('get_settings'),
          invoke<AppInfo>('get_app_info'),
          invoke<Language[]>('get_supported_languages_tauri')
        ]);
        
        setSettings(settingsData);
        setAppInfo(appData);
        setSupportedLanguages(languagesData);

        // Initialize voice recognition
        const mainWindow = new Window('main');
        await invoke('initialize_voice_recognition', { window: mainWindow });
        
        // Initialize text processor
        await invoke('initialize_text_processor');

        console.log('VoiceFlow Pro initialized successfully');
      } catch (err) {
        console.error('Failed to initialize application:', err);
        setError('Failed to initialize application');
      }
    };

    initializeApp();
  }, []);

  // Set up event listeners
  useEffect(() => {
    let unlistenFunctions: UnlistenFn[] = [];

    const setupEventListeners = async () => {
      try {
        // Voice status events
        unlistenFunctions.push(await listen('voice-status', (event) => {
          const status = event.payload as string;
          setIsListening(status === 'listening');
          if (status === 'listening') {
            setError('');
          }
        }));

        // Speech transcript events
        unlistenFunctions.push(await listen('speech-transcript', (event) => {
          const transcriptData = event.payload as string;
          setTranscript(transcriptData);
          setIsProcessing(true);
        }));

        // Voice response events
        unlistenFunctions.push(await listen('voice-response', (event) => {
          const responseData = event.payload as string;
          setResponse(responseData);
          setIsProcessing(false);
        }));

        // Audio metrics events
        unlistenFunctions.push(await listen('audio-metrics', (event) => {
          const metrics = event.payload as any;
          // Could be used to update audio visualization
          console.log('Audio metrics:', metrics);
        }));

        // System tray actions
        unlistenFunctions.push(await listen('tray-action', (event) => {
          const action = event.payload as string;
          handleTrayAction(action);
        }));

      } catch (err) {
        console.error('Failed to setup event listeners:', err);
        setError('Failed to setup event listeners');
      }
    };

    setupEventListeners();

    return () => {
      unlistenFunctions.forEach(unlisten => unlisten());
    };
  }, []);

  const handleTrayAction = useCallback(async (action: string) => {
    switch (action) {
      case 'start_listening':
        await startListening();
        break;
      case 'stop_listening':
        await stopListening();
        break;
      case 'settings':
        setShowSettings(!showSettings);
        break;
      default:
        break;
    }
  }, [showSettings]);

  const startListening = async () => {
    try {
      setError('');
      const mainWindow = new Window('main');
      await invoke('start_voice_listening', { window: mainWindow });
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError('Failed to start listening');
    }
  };

  const stopListening = async () => {
    try {
      await invoke('stop_voice_listening');
      setIsListening(false);
    } catch (err) {
      console.error('Failed to stop listening:', err);
      setError('Failed to stop listening');
    }
  };

  const processTranscript = async (transcriptText: string) => {
    try {
      setIsProcessing(true);
      
      const result = await invoke<ProcessingResult>('process_speech_with_ai', {
        transcript: transcriptText,
        state: null,
        window: new Window('main')
      });
      
      setResponse(result.processed_text);
      setProcessingResult(result);
      setConfidence(result.confidence_score);
      setIsProcessing(false);
    } catch (err) {
      console.error('Failed to process speech:', err);
      setError('Failed to process speech');
      setIsProcessing(false);
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  const processTextWithAI = async (text: string, context: string = 'email', tone: string = 'professional') => {
    try {
      const result = await invoke<ProcessingResult>('process_text', {
        text,
        context,
        tone,
        state: null
      });
      
      setProcessingResult(result);
      setResponse(result.processed_text);
      setConfidence(result.confidence_score);
    } catch (err) {
      console.error('Failed to process text:', err);
      setError('Failed to process text');
    }
  };

  const openSettings = () => {
    setShowSettings(!showSettings);
  };

  const minimizeToTray = async () => {
    try {
      const window = new Window('main');
      await window.hide();
    } catch (err) {
      console.error('Failed to minimize to tray:', err);
      setError('Failed to minimize window');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could show a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const exportTranscript = () => {
    const content = `VoiceFlow Pro Transcript\n\nOriginal:\n${transcript}\n\nProcessed:\n${response}\n\nConfidence: ${Math.round(confidence * 100)}%\nGenerated: ${new Date().toLocaleString()}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceflow-transcript-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = () => {
    if (error) return '❌';
    if (isProcessing) return '⏳';
    if (isListening) return '🎤';
    if (transcript && !response) return '📝';
    if (response) return '✅';
    return '🔇';
  };

  const getStatusText = () => {
    if (error) return error;
    if (isProcessing) return 'Processing with AI...';
    if (isListening) return 'Listening for your voice...';
    if (transcript && !response) return 'Speech captured, processing...';
    if (response) return 'Response ready';
    return 'Ready to listen';
  };

  const getStatusColor = () => {
    if (error) return '#ef4444';
    if (isProcessing) return '#f59e0b';
    if (isListening) return '#10b981';
    if (response) return '#3b82f6';
    return '#6b7280';
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">VF</div>
          <div className="logo-text">
            <h1>VoiceFlow Pro</h1>
            <p className="tagline">AI-Powered Voice Productivity</p>
          </div>
        </div>
        <div className="header-controls">
          <div className="status-indicator">
            <span className="status-icon">{getStatusIcon()}</span>
            <span className="status-text" style={{ color: getStatusColor() }}>
              {getStatusText()}
            </span>
          </div>
          <button
            className={`primary-button ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            disabled={isProcessing}
            title={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? '🛑 Stop' : '🎤 Listen'}
          </button>
          <button
            className="secondary-button"
            onClick={openSettings}
            title="Settings"
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Voice Recognition Section */}
        <section className="voice-section">
          <div className="section-header">
            <h2>🎤 Voice Recognition</h2>
            <div className="voice-controls">
              <select 
                value={settings?.language || 'en-US'}
                className="language-select"
                disabled={isListening}
              >
                {supportedLanguages.slice(0, 5).map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <div className="confidence-meter">
                <span>Confidence:</span>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
                <span>{Math.round(confidence * 100)}%</span>
              </div>
            </div>
          </div>
          
          <div className="transcript-container">
            <div className="transcript-box">
              <h3>📝 Live Transcript</h3>
              <div className={`transcript-content ${isProcessing ? 'processing' : ''} ${transcript ? 'has-content' : ''}`}>
                {isProcessing && !transcript ? (
                  <div className="processing-indicator">
                    <div className="spinner"></div>
                    Processing your speech...
                  </div>
                ) : transcript ? (
                  <div className="transcript-text">{transcript}</div>
                ) : (
                  <div className="placeholder">Your speech will appear here in real-time...</div>
                )}
              </div>
              {transcript && (
                <div className="transcript-actions">
                  <button 
                    className="action-button"
                    onClick={() => processTranscript(transcript)}
                    disabled={isProcessing}
                  >
                    🤖 Process with AI
                  </button>
                  <button 
                    className="action-button secondary"
                    onClick={() => copyToClipboard(transcript)}
                  >
                    📋 Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AI Processing Section */}
        <section className="ai-section">
          <div className="section-header">
            <h2>🤖 AI Text Processing</h2>
            <div className="processing-options">
              <select 
                value={settings?.text_processing.context || 'email'}
                className="context-select"
                onChange={(e) => {
                  if (settings) {
                    setSettings({
                      ...settings,
                      text_processing: {
                        ...settings.text_processing,
                        context: e.target.value
                      }
                    });
                  }
                }}
              >
                <option value="email">Email</option>
                <option value="document">Document</option>
                <option value="social">Social</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="technical">Technical</option>
                <option value="creative">Creative</option>
              </select>
              <select 
                value={settings?.text_processing.tone || 'professional'}
                className="tone-select"
                onChange={(e) => {
                  if (settings) {
                    setSettings({
                      ...settings,
                      text_processing: {
                        ...settings.text_processing,
                        tone: e.target.value
                      }
                    });
                  }
                }}
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="empathetic">Empathetic</option>
                <option value="confident">Confident</option>
                <option value="persuasive">Persuasive</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>

          <div className="response-container">
            <div className="response-box">
              <h3>✨ AI-Enhanced Response</h3>
              <div className="response-content">
                {response ? (
                  <div className="processed-text">{response}</div>
                ) : (
                  <div className="placeholder">AI-processed text will appear here...</div>
                )}
              </div>
              
              {response && (
                <div className="response-actions">
                  <button 
                    className="action-button"
                    onClick={() => copyToClipboard(response)}
                  >
                    📋 Copy
                  </button>
                  <button 
                    className="action-button secondary"
                    onClick={exportTranscript}
                  >
                    💾 Export
                  </button>
                </div>
              )}
            </div>

            {processingResult && (
              <div className="processing-stats">
                <h4>📊 Processing Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Confidence</span>
                    <span className="stat-value">{Math.round(confidence * 100)}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Processing Time</span>
                    <span className="stat-value">{processingResult.processing_time_ms}ms</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Changes Made</span>
                    <span className="stat-value">{processingResult.changes_made.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Words</span>
                    <span className="stat-value">
                      {processingResult.original_text.split(' ').length} → {processingResult.processed_text.split(' ').length}
                    </span>
                  </div>
                </div>
                
                {processingResult.changes_made.length > 0 && (
                  <div className="changes-list">
                    <h5>🔧 Recent Changes</h5>
                    {processingResult.changes_made.slice(0, 3).map((change, index) => (
                      <div key={index} className="change-item">
                        <span className="change-type">{change.change_type}</span>
                        <span className="change-text">
                          "{change.original}" → "{change.replacement}"
                        </span>
                        <span className="change-confidence">
                          {Math.round(change.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="app-info">
          {appInfo && (
            <>
              <span className="app-name">{appInfo.name}</span>
              <span className="version">v{appInfo.version}</span>
              <span className="platform">• {appInfo.platform}</span>
            </>
          )}
        </div>
        <div className="footer-actions">
          <button className="footer-button" onClick={minimizeToTray}>
            📱 Minimize to Tray
          </button>
          <button className="footer-button" onClick={() => setShowSettings(!showSettings)}>
            ⚙️ Preferences
          </button>
        </div>
      </footer>

      {/* Settings Modal (simplified for now) */}
      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <div className="settings-header">
              <h2>⚙️ Settings</h2>
              <button className="close-button" onClick={() => setShowSettings(false)}>
                ✕
              </button>
            </div>
            <div className="settings-body">
              <div className="setting-group">
                <h3>Voice Recognition</h3>
                <label>
                  <input type="checkbox" checked={settings?.voice_recognition.continuous || false} />
                  Continuous Recognition
                </label>
                <label>
                  <input type="checkbox" checked={settings?.voice_recognition.noise_reduction || false} />
                  Noise Reduction
                </label>
                <label>
                  <input type="checkbox" checked={settings?.voice_recognition.privacy_mode || false} />
                  Privacy Mode (Offline Processing)
                </label>
              </div>
              
              <div className="setting-group">
                <h3>AI Text Processing</h3>
                <label>
                  <input type="checkbox" checked={settings?.text_processing.auto_correct || false} />
                  Auto Correct Grammar
                </label>
                <label>
                  <input type="checkbox" checked={settings?.text_processing.smart_punctuation || false} />
                  Smart Punctuation
                </label>
                <label>
                  <input type="checkbox" checked={settings?.text_processing.remove_fillers || false} />
                  Remove Filler Words
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;