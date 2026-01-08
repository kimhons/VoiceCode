import React, { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
// import { Window } from '@tauri-apps/api/window'; // TODO: Use for window management
import { PricingModal } from './components/PricingModal';
import { GlobalDictationSettings } from './components/GlobalDictationSettings';
import { FloatingDictationButton } from './components/FloatingDictationButton';
import { AIFeaturesPanel } from './components/AIFeaturesPanel';
// WebSocket streaming disabled - using browser Speech Recognition API instead
// import { getStreamingService, StreamingTranscript } from './services/websocket-streaming.service';

// Types for our enhanced application
interface Settings {
  language: string;
  voice_model: string;
  hotkey: string;
  auto_start: boolean;
  theme: string;
  notifications: boolean;
  voice_commands_enabled?: boolean;
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

// TODO: Use VoiceStatus interface for real-time voice processing
// interface VoiceStatus {
//   is_listening: boolean;
//   is_processing: boolean;
//   current_transcript: string;
//   response: string;
//   engine_type: string;
//   session_id: string;
// }

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
  const [showPricing, setShowPricing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [confidence, setConfidence] = useState(0);

  // Browser Speech Recognition (using native browser API - no WebSocket needed)
  const recognitionRef = useRef<any>(null);
  const [interimTranscript, setInterimTranscript] = useState('');

  // Global dictation state
  const [isGlobalDictationActive, setIsGlobalDictationActive] = useState(false);
  const [globalDictationText, setGlobalDictationText] = useState('');
  const [showGlobalDictationSettings, setShowGlobalDictationSettings] = useState(false);

  // Floating button state
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const [floatingButtonPosition, setFloatingButtonPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');

  // AI Features Panel state
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Keyboard shortcut for AI panel (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAIPanel(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Reset processing state on mount to prevent stuck state
        setIsProcessing(false);
        setError('');

        // Load initial data
        const [settingsData, appData, languagesData] = await Promise.all([
          invoke<Settings>('get_settings'),
          invoke<AppInfo>('get_app_info'),
          invoke<Language[]>('get_supported_languages_tauri')
        ]);

        // Enable voice commands by default if not set
        if (settingsData.voice_commands_enabled === undefined) {
          settingsData.voice_commands_enabled = true;
        }

        setSettings(settingsData);
        setAppInfo(appData);
        setSupportedLanguages(languagesData);

        // Initialize voice recognition
        // TODO: Fix Window API usage
        // const mainWindow = new Window('main');
        // await invoke('initialize_voice_recognition', { window: mainWindow });

        // Initialize text processor
        await invoke('initialize_text_processor');

        console.log('VoiceFlow Pro initialized successfully');
      } catch (err) {
        console.error('Failed to initialize application:', err);
        setError('Failed to initialize application');
        setIsProcessing(false); // Ensure processing state is reset on error
      }
    };

    initializeApp();
  }, []);

  // Set up event listeners
  useEffect(() => {
    const unlistenFunctions: UnlistenFn[] = [];

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
        unlistenFunctions.push(await listen('speech-transcript', async (event) => {
          const transcriptData = event.payload as string;
          setTranscript(transcriptData);
          setIsProcessing(true);

          // If global dictation is active, update the global dictation text
          if (isGlobalDictationActive) {
            try {
              await invoke('update_global_dictation_text', { text: transcriptData });
              setGlobalDictationText(transcriptData);
            } catch (err) {
              console.error('Failed to update global dictation text:', err);
            }
          }
        }));

        // Voice response events
        unlistenFunctions.push(await listen('voice-response', (event) => {
          const responseData = event.payload as string;
          setResponse(responseData);
          setIsProcessing(false);
        }));

        // Audio metrics events
        unlistenFunctions.push(await listen('audio-metrics', (event) => {
          const metrics = event.payload as Record<string, unknown>;
          // Could be used to update audio visualization
          console.log('Audio metrics:', metrics);
        }));

        // System tray actions
        unlistenFunctions.push(await listen('tray-action', (event) => {
          const action = event.payload as string;
          handleTrayAction(action);
        }));

        // Global dictation toggle event (triggered by hotkey Ctrl+Shift+D)
        unlistenFunctions.push(await listen('global-dictation-toggle', async () => {
          if (isGlobalDictationActive) {
            // Stop global dictation
            try {
              const text = await invoke<string>('stop_global_dictation');
              setGlobalDictationText('');
              setIsGlobalDictationActive(false);
            } catch (err) {
              console.error('Failed to stop global dictation:', err);
            }
          } else {
            // Start global dictation
            try {
              await invoke('start_global_dictation');
              setIsGlobalDictationActive(true);
              setGlobalDictationText('');
              // Start voice recognition
              if (!isListening) {
                await startListening();
              }
            } catch (err) {
              console.error('Failed to start global dictation:', err);
            }
          }
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
  }, [isGlobalDictationActive, isListening]);

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

  // Voice command processing function
  const processVoiceCommands = (text: string): string => {
    if (!settings?.voice_commands_enabled) {
      return text;
    }

    let processedText = text;

    // Voice command mappings (case-insensitive)
    const commands: { [key: string]: string } = {
      // Punctuation
      'comma': ',',
      'period': '.',
      'question mark': '?',
      'exclamation point': '!',
      'exclamation mark': '!',
      'colon': ':',
      'semicolon': ';',
      'apostrophe': "'",
      'quote': '"',
      'open quote': '"',
      'close quote': '"',
      'dash': '-',
      'hyphen': '-',

      // Line breaks
      'new line': '\n',
      'new paragraph': '\n\n',
      'line break': '\n',

      // Special characters
      'at sign': '@',
      'hashtag': '#',
      'dollar sign': '$',
      'percent': '%',
      'ampersand': '&',
      'asterisk': '*',
      'plus': '+',
      'equals': '=',
      'underscore': '_',
      'slash': '/',
      'backslash': '\\',

      // Brackets
      'open parenthesis': '(',
      'close parenthesis': ')',
      'open bracket': '[',
      'close bracket': ']',
      'open brace': '{',
      'close brace': '}',
    };

    // Replace voice commands with their symbols
    for (const [command, symbol] of Object.entries(commands)) {
      const regex = new RegExp(`\\b${command}\\b`, 'gi');
      processedText = processedText.replace(regex, symbol);
    }

    // Handle "delete that" command - remove last word
    if (/\bdelete that\b/i.test(processedText)) {
      processedText = processedText.replace(/\bdelete that\b/i, '').trim();
      // Remove last word from transcript
      setTranscript(prev => {
        const words = prev.trim().split(/\s+/);
        words.pop();
        return words.join(' ');
      });
      return '';
    }

    // Handle "select all" command
    if (/\bselect all\b/i.test(processedText)) {
      // This would need to be handled by the UI
      console.log('Select all command detected');
      return processedText.replace(/\bselect all\b/i, '').trim();
    }

    return processedText;
  };

  // Initialize Browser Speech Recognition (using native browser API - no WebSocket)
  useEffect(() => {
    // Use browser's built-in speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = settings?.language || 'en-US';

      recognition.onstart = () => {
        console.log('✅ Speech recognition started');
        setError('');
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
            setConfidence(result[0].confidence || 0.9);
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalText) {
          // Process voice commands
          const processedText = processVoiceCommands(finalText);
          setTranscript(prev => prev + (prev ? ' ' : '') + processedText);
          setInterimTranscript('');
        } else {
          setInterimTranscript(interimText);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('🔌 Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setError('Speech recognition not supported in this browser');
    }
  }, [settings?.language]);

  const startListening = async () => {
    try {
      setError('');

      // Use browser speech recognition (native API - no WebSocket)
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        throw new Error('Speech recognition not initialized');
      }
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError('Failed to start listening: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const stopListening = async () => {
    try {
      // Stop browser speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } catch (err) {
      console.error('Failed to stop listening:', err);
      setError('Failed to stop listening');
    }
  };

  const processTranscript = async (transcriptText: string) => {
    try {
      setIsProcessing(true);
      setError(''); // Clear any previous errors

      const result = await invoke<ProcessingResult>('process_speech_with_ai', {
        transcript: transcriptText,
      });

      setResponse(result.processed_text);
      setProcessingResult(result);
      setConfidence(result.confidence_score);
      setIsProcessing(false);
    } catch (err) {
      console.error('Failed to process speech:', err);
      setError(`Failed to process speech: ${err}`);
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

  // TODO: Implement AI text processing
  // const processTextWithAI = async (text: string, context: string = 'email', tone: string = 'professional') => {
  //   try {
  //     const result = await invoke<ProcessingResult>('process_text', {
  //       text,
  //       context,
  //       tone,
  //       state: null
  //     });
      
  //     setProcessingResult(result);
  //     setResponse(result.processed_text);
  //     setConfidence(result.confidence_score);
  //   } catch (err) {
  //     console.error('Failed to process text:', err);
  //     setError('Failed to process text');
  //   }
  // };

  const openSettings = () => {
    setShowSettings(!showSettings);
  };

  const minimizeToTray = async () => {
    try {
      // TODO: Implement window management with proper Tauri API
      // const window = new Window('main');
      // await window.hide();
      console.log('Minimize to tray requested');
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
    <div className="dragon-app">
      {/* Professional Header like Dragon */}
      <header className="dragon-header">
        <div className="dragon-logo">
          <div className="dragon-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L4 10L16 16L28 10L16 4Z" fill="#FF6B35"/>
              <path d="M4 16L16 22L28 16" stroke="#FF6B35" strokeWidth="2"/>
              <path d="M4 22L16 28L28 22" stroke="#FF6B35" strokeWidth="2"/>
            </svg>
          </div>
          <div className="dragon-title">
            <h1>VoiceFlow Pro</h1>
            <p>Professional Dictation & Voice Recognition</p>
          </div>
          {isGlobalDictationActive && (
            <div className="global-dictation-badge">
              <span className="badge-icon">🌍</span>
              <span className="badge-text">Global Dictation Active</span>
              <span className="badge-hotkey">Ctrl+Shift+D to stop</span>
            </div>
          )}
        </div>
        <div className="dragon-toolbar">
          <button
            className={`dragon-btn-primary ${isListening ? 'recording' : ''}`}
            onClick={toggleListening}
            disabled={isProcessing}
          >
            <span className="btn-icon">{isListening ? '⏹' : '🎤'}</span>
            <span className="btn-text">{isListening ? 'Stop Dictation' : 'Start Dictation'}</span>
          </button>
          <div className="dragon-divider"></div>
          <button className="dragon-btn-tool" title="New Document">
            <span>📄</span>
          </button>
          <button className="dragon-btn-tool" title="Open">
            <span>📂</span>
          </button>
          <button className="dragon-btn-tool" title="Save">
            <span>💾</span>
          </button>
          <div className="dragon-divider"></div>
          <button
            className={`dragon-btn-tool ${showAIPanel ? 'active' : ''}`}
            onClick={() => setShowAIPanel(!showAIPanel)}
            title="AI Features (Ctrl+Shift+A)"
          >
            <span>🤖</span>
          </button>
          <button className="dragon-btn-tool" onClick={() => setShowPricing(true)} title="Upgrade">
            <span>⭐</span>
          </button>
          <button className="dragon-btn-tool" onClick={() => setShowGlobalDictationSettings(true)} title="Global Dictation Settings">
            <span>🌍</span>
          </button>
          <button className="dragon-btn-tool" onClick={openSettings} title="Settings">
            <span>⚙️</span>
          </button>
        </div>
      </header>

      {/* Dragon-style Status Bar */}
      <div className="dragon-status-bar">
        <div className="status-left">
          <div className={`status-indicator ${isListening ? 'active' : ''} ${error ? 'error' : ''}`}>
            <span className="status-dot"></span>
            <span className="status-label">
              {error ? 'Error' : isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Ready'}
            </span>
          </div>
          <div className="audio-level">
            <span className="audio-label">Audio Level:</span>
            <div className="audio-bars">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`audio-bar ${isListening && i < 7 ? 'active' : ''}`}></div>
              ))}
            </div>
          </div>
        </div>
        <div className="status-right">
          <div className="accuracy-display">
            <span>Accuracy: {Math.round(confidence * 100)}%</span>
          </div>
          <select className="dragon-language-select" value={settings?.language || 'en-US'} disabled={isListening}>
            {supportedLanguages.slice(0, 5).map(lang => (
              <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Dragon-style Content */}
      <main className="dragon-main">
        {/* Left Panel - Dictation Window */}
        <section className="dragon-dictation-panel">
          <div className="panel-header">
            <h3>📝 Dictation Window</h3>
            <div className="panel-tools">
              <button className="tool-btn" title="Clear">🗑️</button>
              <button className="tool-btn" title="Copy">📋</button>
              <button className="tool-btn" title="Export">💾</button>
            </div>
          </div>

          <div className="dragon-dictation-area">
            <div className="dictation-editor">
              {!transcript && !interimTranscript ? (
                <div className="dictation-placeholder">
                  <div className="placeholder-icon">🎤</div>
                  <h2>Ready to Dictate</h2>
                  <p>Click "Start Dictation" or press the hotkey to begin</p>
                  <div className="quick-tips">
                    <h4>Quick Tips:</h4>
                    <ul>
                      <li>Speak clearly and naturally</li>
                      <li>Say "comma", "period", "new line" for punctuation</li>
                      <li>Use voice commands like "select all", "delete that"</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="dictation-text">
                  {transcript}
                  {interimTranscript && (
                    <span className="interim-text">{transcript ? ' ' : ''}{interimTranscript}</span>
                  )}
                  {isProcessing && <span className="processing-cursor">|</span>}
                </div>
              )}
            </div>

            {transcript && (
              <div className="dictation-stats">
                <div className="stat">
                  <span className="stat-label">Words:</span>
                  <span className="stat-value">{transcript.split(' ').length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Characters:</span>
                  <span className="stat-value">{transcript.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Accuracy:</span>
                  <span className="stat-value">{Math.round(confidence * 100)}%</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Panel - AI Enhancement & Commands */}
        <aside className="dragon-sidebar">
          <div className="sidebar-section">
            <h3>🤖 AI Enhancement</h3>
            <div className="enhancement-controls">
              <label>
                <span>Context:</span>
                <select
                  value={settings?.text_processing.context || 'email'}
                  onChange={(e) => {
                    if (settings) {
                      setSettings({
                        ...settings,
                        text_processing: { ...settings.text_processing, context: e.target.value }
                      });
                    }
                  }}
                >
                  <option value="email">📧 Email</option>
                  <option value="document">📄 Document</option>
                  <option value="medical">🏥 Medical</option>
                  <option value="legal">⚖️ Legal</option>
                  <option value="technical">💻 Technical</option>
                </select>
              </label>
              <label>
                <span>Tone:</span>
                <select
                  value={settings?.text_processing.tone || 'professional'}
                  onChange={(e) => {
                    if (settings) {
                      setSettings({
                        ...settings,
                        text_processing: { ...settings.text_processing, tone: e.target.value }
                      });
                    }
                  }}
                >
                  <option value="professional">👔 Professional</option>
                  <option value="friendly">😊 Friendly</option>
                  <option value="formal">🎩 Formal</option>
                  <option value="casual">👕 Casual</option>
                </select>
              </label>
              <button className="enhance-btn" onClick={() => transcript && processTranscript(transcript)} disabled={!transcript || isProcessing}>
                ✨ Enhance Text
              </button>
            </div>

            {response && (
              <div className="enhanced-result">
                <h4>Enhanced Version:</h4>
                <div className="enhanced-text">{response}</div>
                <div className="result-actions">
                  <button onClick={() => copyToClipboard(response)}>📋 Copy</button>
                  <button onClick={exportTranscript}>💾 Save</button>
                </div>
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3>🎯 Voice Commands</h3>
            <div className="commands-list">
              <div className="command-item">
                <span className="command-name">"New Line"</span>
                <span className="command-desc">Start new paragraph</span>
              </div>
              <div className="command-item">
                <span className="command-name">"Period"</span>
                <span className="command-desc">Add period</span>
              </div>
              <div className="command-item">
                <span className="command-name">"Comma"</span>
                <span className="command-desc">Add comma</span>
              </div>
              <div className="command-item">
                <span className="command-name">"Delete That"</span>
                <span className="command-desc">Remove last word</span>
              </div>
              <div className="command-item">
                <span className="command-name">"Select All"</span>
                <span className="command-desc">Select all text</span>
              </div>
            </div>
          </div>

          {processingResult && (
            <div className="sidebar-section">
              <h3>📊 Statistics</h3>
              <div className="stats-list">
                <div className="stat-row">
                  <span>Processing Time:</span>
                  <span>{processingResult.processing_time_ms}ms</span>
                </div>
                <div className="stat-row">
                  <span>Changes Made:</span>
                  <span>{processingResult.changes_made.length}</span>
                </div>
                <div className="stat-row">
                  <span>Confidence:</span>
                  <span>{Math.round(confidence * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* AI Features Panel - Collapsible Right Panel */}
        {showAIPanel && (
          <aside className="ai-features-panel-container">
            <AIFeaturesPanel
              transcript={transcript || ''}
              autoAnalyze={false}
              onClose={() => setShowAIPanel(false)}
            />
          </aside>
        )}
      </main>

      {/* Dragon-style Footer */}
      <footer className="dragon-footer">
        <div className="footer-left">
          {appInfo && (
            <span className="app-version">{appInfo.name} v{appInfo.version} • {appInfo.platform}</span>
          )}
        </div>
        <div className="footer-center">
          {error && <span className="error-message">⚠️ {error}</span>}
        </div>
        <div className="footer-right">
          <span className="footer-link" onClick={() => setShowPricing(true)}>Upgrade to Pro</span>
          <span className="footer-separator">|</span>
          <span className="footer-link" onClick={openSettings}>Help & Support</span>
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

      {/* Pricing Modal */}
      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />

      {/* Global Dictation Settings Modal */}
      {showGlobalDictationSettings && (
        <GlobalDictationSettings onClose={() => setShowGlobalDictationSettings(false)} />
      )}

      {/* Floating Dictation Button */}
      <FloatingDictationButton
        onStartDictation={startListening}
        onStopDictation={stopListening}
        isRecording={isListening}
        position={floatingButtonPosition}
        size="medium"
        showTimer={true}
        enabled={showFloatingButton}
      />
    </div>
  );
};

export default App;