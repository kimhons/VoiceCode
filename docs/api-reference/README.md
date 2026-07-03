# VoiceFlow Pro API Reference

## Overview

VoiceFlow Pro provides a comprehensive API suite for developers to integrate voice capabilities into their applications. This reference covers all available APIs, endpoints, and integration methods.

## 🏗️ API Architecture

### Core API Components

```
┌─────────────────────────────────────────────────────────────┐
│                     VoiceFlow Pro API Suite                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Voice Engine    │  │ UI Components   │  │ Desktop API  │ │
│  │ API             │  │ API             │  │              │ │
│  │                 │  │                 │  │ • Tauri      │ │
│  │ • Speech-to-    │  │ • React         │  │ • Commands   │ │
│  │   Text          │  │ • TypeScript    │  │ • Events     │ │
│  │ • Language      │  │ • Accessibility │  │ • System     │ │
│  │ • Processing    │  │ • Theming       │  │   Integration│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ AI Processing   │  │ Cloud Services  │  │ Web API      │ │
│  │ API             │  │ API             │  │              │ │
│  │                 │  │                 │  │ • REST       │ │
│  │ • Text          │  │ • Sync          │  │ • GraphQL    │ │
│  │   Enhancement   │  │ • Storage       │  │ • WebSocket  │ │
│  │ • Auto-editing  │  │ • Analytics     │  │ • Real-time  │ │
│  │ • Translation   │  │ • Users         │  │ • Webhooks   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🎤 Voice Engine API

### VoiceFlowPro Class

The core voice recognition engine providing speech-to-text capabilities.

#### Constructor

```typescript
import { VoiceFlowPro, ModelType } from 'voiceflow-voice-recognition-engine';

const voiceEngine = new VoiceFlowPro({
  primaryEngine: ModelType.WEB_SPEECH_API,
  fallbackEngine: ModelType.WHISPER_BASE,
  offlineFirst: true,
  qualityPreference: 'excellent'
});
```

#### Methods

##### `initialize(language?: string): Promise<void>`

Initialize the voice recognition engine.

**Parameters:**
- `language` (string, optional): Language code (e.g., 'en-US', 'es-ES')

**Example:**
```typescript
await voiceEngine.initialize('en-US');
// or
await voiceEngine.initialize(); // Auto-detect language
```

##### `startListening(config?: RecognitionConfig): Promise<void>`

Start voice recognition and listening.

**Parameters:**
- `config` (RecognitionConfig, optional): Recognition configuration

**Example:**
```typescript
await voiceEngine.startListening({
  continuous: true,
  interimResults: true,
  confidenceThreshold: 0.7
});

// Event listener
voiceEngine.onResult((result) => {
  console.log('Transcript:', result.transcript);
  console.log('Confidence:', result.confidence);
});
```

##### `stopListening(): Promise<void>`

Stop voice recognition.

**Example:**
```typescript
await voiceEngine.stopListening();
```

##### `setLanguage(languageCode: string): Promise<void>`

Set recognition language.

**Parameters:**
- `languageCode` (string): Valid language code (e.g., 'en-US', 'fr-FR')

**Example:**
```typescript
await voiceEngine.setLanguage('es-ES'); // Spanish
await voiceEngine.setLanguage('pt-BR'); // Portuguese (Brazil)
```

##### `switchEngine(modelType: ModelType): Promise<void>`

Manually switch recognition engine.

**Parameters:**
- `modelType` (ModelType): Target engine type

**Example:**
```typescript
// Switch to Whisper for offline processing
await voiceEngine.switchEngine(ModelType.WHISPER_BASE);

// Switch to Web Speech API for speed
await voiceEngine.switchEngine(ModelType.WEB_SPEECH_API);
```

#### Events

##### `recognition:start`

Fired when voice recognition starts.

**Payload:**
```typescript
{
  timestamp: number;
  language: string;
  engine: ModelType;
}
```

##### `recognition:stop`

Fired when voice recognition stops.

**Payload:**
```typescript
{
  timestamp: number;
  duration: number; // milliseconds
  totalResults: number;
}
```

##### `recognition:result`

Fired when transcription result is available.

**Payload:**
```typescript
{
  transcript: string;
  confidence: number; // 0-1
  isFinal: boolean;
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
  language: string;
  timestamp: number;
  metadata: {
    audioLevel: number;
    signalQuality: number;
    processingTime: number;
    modelUsed: ModelType;
    noiseLevel: number;
  };
}
```

##### `recognition:error`

Fired when recognition error occurs.

**Payload:**
```typescript
{
  message: string;
  code: string;
  recoverable: boolean;
  model?: ModelType;
}
```

#### Configuration Types

##### `RecognitionConfig`

```typescript
interface RecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  confidenceThreshold?: number;
  noiseReduction?: boolean;
  autoLanguageDetection?: boolean;
  realTimeTranscription?: boolean;
}
```

##### `EngineConfig`

```typescript
interface EngineConfig {
  primaryEngine: ModelType;
  fallbackEngine: ModelType;
  autoEngineSelection: boolean;
  offlineFirst: boolean;
  qualityPreference: QualityLevel;
  performancePreference: PerformancePreference;
  privacyMode: boolean;
  cacheEnabled: boolean;
}
```

## 🖥️ Desktop API (Tauri)

### Rust Commands

VoiceFlow Pro's desktop application exposes Rust commands through Tauri for system integration.

#### `get_settings`

Retrieve application settings.

**TypeScript Interface:**
```typescript
interface Settings {
  language: string;
  voiceEngine: ModelType;
  hotkeys: HotkeyConfig;
  theme: 'light' | 'dark' | 'auto';
  privacyMode: boolean;
  autoStart: boolean;
  minimizeToTray: boolean;
}

async function getSettings(): Promise<Settings> {
  return await invoke('get_settings');
}
```

**Rust Implementation:**
```rust
#[tauri::command]
fn get_settings() -> Result<serde_json::Value, String> {
    // Retrieve settings from state or file
    Ok(serde_json::json!(settings))
}
```

#### `start_listening`

Start voice recognition from desktop app.

**TypeScript:**
```typescript
async function startListening(): Promise<void> {
  return await invoke('start_listening');
}
```

**Rust:**
```rust
#[tauri::command]
async fn start_listening(window: tauri::Window) -> Result<(), String> {
    // Start voice recognition
    voice_engine.start_listening().await?;
    Ok(())
}
```

#### `process_speech`

Process speech transcript with AI.

**TypeScript:**
```typescript
interface SpeechProcessRequest {
  transcript: string;
  context?: string;
  intent?: string;
}

interface SpeechProcessResponse {
  original: string;
  processed: string;
  suggestions: string[];
  confidence: number;
}

async function processSpeech(
  transcript: string, 
  context?: string
): Promise<SpeechProcessResponse> {
  return await invoke('process_speech', {
    transcript,
    context
  });
}
```

#### `register_global_shortcut`

Register system-wide keyboard shortcuts.

**TypeScript:**
```typescript
interface ShortcutConfig {
  shortcut: string; // e.g., "CmdOrCtrl+Space"
  action: string; // e.g., "toggle_listening"
  description?: string;
}

async function registerGlobalShortcut(
  shortcut: string, 
  action: string
): Promise<void> {
  return await invoke('register_global_shortcut', {
    shortcut,
    action
  });
}
```

### Events (Desktop)

#### `voice-status`

Communication between Rust backend and React frontend.

**Rust (emit):**
```rust
window.emit("voice-status", &VoiceStatus {
    is_listening: true,
    engine: current_engine.clone(),
    language: current_language.clone(),
})
.unwrap();
```

**TypeScript (listen):**
```typescript
import { listen } from '@tauri-apps/api/event';

await listen('voice-status', (event) => {
  const status = event.payload as VoiceStatus;
  console.log('Voice status:', status);
});
```

## 🌐 Cloud API

### REST API

Base URL: `https://api.voiceflowpro.com/v1`

#### Authentication

All API requests require authentication using API keys.

**Header:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

#### Endpoints

##### `POST /transcribe`

Transcribe audio using cloud processing.

**Request:**
```typescript
interface TranscribeRequest {
  audio: string; // base64 encoded audio
  language?: string;
  model?: 'whisper-tiny' | 'whisper-base' | 'whisper-small' | 'whisper-medium';
  timestamp_granularities?: ('word' | 'segment')[];
}

interface TranscribeResponse {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
  language: string;
  processing_time: number;
}
```

**Example:**
```typescript
const response = await fetch('https://api.voiceflowpro.com/v1/transcribe', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    audio: base64Audio,
    language: 'en-US',
    model: 'whisper-base'
  })
});
```

##### `POST /process`

Process and enhance text with AI.

**Request:**
```typescript
interface ProcessRequest {
  text: string;
  enhancements?: ('grammar' | 'style' | 'tone' | 'format')[];
  target_language?: string;
  context?: string;
}

interface ProcessResponse {
  original: string;
  processed: string;
  suggestions: Array<{
    original: string;
    suggestion: string;
    confidence: number;
    reason: string;
  }>;
  metadata: {
    processing_time: number;
    model_used: string;
    confidence_score: number;
  };
}
```

##### `POST /sync`

Synchronize data across devices.

**Request:**
```typescript
interface SyncRequest {
  device_id: string;
  last_sync: string; // ISO 8601 timestamp
  data: any; // Sync payload
}

interface SyncResponse {
  sync_id: string;
  last_modified: string;
  server_data: any;
  conflicts: Array<{
    local: any;
    remote: any;
    resolution: 'local' | 'remote' | 'merge';
  }>;
}
```

### WebSocket API

Real-time communication for live transcription and events.

#### Connection

```typescript
const ws = new WebSocket('wss://realtime.voiceflowpro.com/v1');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'YOUR_API_KEY'
  }));
};
```

#### Message Types

##### Client to Server

```typescript
// Start listening
{
  type: 'start_listening';
  language?: string;
  engine?: ModelType;
}

// Send audio data
{
  type: 'audio_chunk';
  data: base64Audio; // base64 encoded audio chunk
  timestamp: number;
}

// Stop listening
{
  type: 'stop_listening';
}
```

##### Server to Client

```typescript
// Transcription result
{
  type: 'transcription';
  text: string;
  is_final: boolean;
  confidence: number;
  timestamp: number;
}

// Voice status
{
  type: 'status';
  status: 'listening' | 'processing' | 'idle';
  engine: ModelType;
  language: string;
}

// Error
{
  type: 'error';
  code: string;
  message: string;
}
```

## 🎨 UI Components API

### React Component Library

VoiceFlow Pro provides a comprehensive React component library for building voice-enabled UIs.

#### VoiceRecording Component

```typescript
import { VoiceRecording } from 'voiceflow-pro-ui';

interface VoiceRecordingProps {
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onRecordingPause?: () => void;
  onRecordingResume?: () => void;
  onStateChange?: (state: RecordingState) => void;
  disabled?: boolean;
  showVolume?: boolean;
  showSettings?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'minimal';
  'aria-label'?: string;
}

<VoiceRecording
  onRecordingStart={() => console.log('Started')}
  onRecordingStop={(transcript) => console.log('Transcript:', transcript)}
  showVolume={true}
  showSettings={true}
  size="large"
  variant="primary"
/>
```

#### TranscriptionDisplay Component

```typescript
import { TranscriptionDisplay } from 'voiceflow-pro-ui';

interface TranscriptionSegment {
  id: string;
  text: string;
  confidence: number;
  startTime: number;
  endTime: number;
  isFinal: boolean;
  speaker?: string;
}

interface TranscriptionDisplayProps {
  segments?: TranscriptionSegment[];
  onSegmentEdit?: (id: string, text: string) => void;
  onTextCopy?: (text: string) => void;
  onTextExport?: (text: string, format: string) => void;
  editable?: boolean;
  showTimestamps?: boolean;
  showConfidence?: boolean;
  showSpeaker?: boolean;
  autoScroll?: boolean;
  maxHeight?: string;
}

<TranscriptionDisplay
  segments={segments}
  onSegmentEdit={(id, text) => console.log('Edit:', id, text)}
  editable={true}
  showTimestamps={true}
  showConfidence={true}
  autoScroll={true}
/>
```

#### LanguageSelector Component

```typescript
import { LanguageSelector } from 'voiceflow-pro-ui';

interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  confidence?: number;
}

interface LanguageSelectorProps {
  languages?: LanguageInfo[];
  value?: string;
  onChange?: (languageCode: string) => void;
  onAutoDetect?: () => void;
  searchable?: boolean;
  showNativeNames?: boolean;
  showFlags?: boolean;
  size?: 'small' | 'medium' | 'large';
}

<LanguageSelector
  value="en-US"
  onChange={(lang) => setLanguage(lang)}
  onAutoDetect={() => console.log('Auto-detecting')}
  searchable={true}
  showNativeNames={true}
  showFlags={true}
  size="medium"
/>
```

## 🔧 Plugin System

### Creating Custom Plugins

Developers can extend VoiceFlow Pro functionality through the plugin system.

#### VoiceRecognitionPlugin Interface

```typescript
interface VoiceRecognitionPlugin {
  name: string;
  version: string;
  
  // Lifecycle
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
  
  // Optional hooks
  processAudio?(audioData: Float32Array): Promise<Float32Array>;
  enhanceResult?(result: SpeechRecognitionResult): Promise<SpeechRecognitionResult>;
  detectLanguage?(audioData: Float32Array): Promise<Language | null>;
}
```

#### Example Plugin: Custom Noise Reduction

```typescript
import { VoiceRecognitionPlugin } from 'voiceflow-voice-recognition-engine';

class CustomNoiseReduction implements VoiceRecognitionPlugin {
  name = 'custom-noise-reduction';
  version = '1.0.0';
  
  private noiseProfile: Float32Array;
  
  async initialize(): Promise<void> {
    this.noiseProfile = new Float32Array(2048);
    console.log('Custom noise reduction initialized');
  }
  
  async processAudio(audioData: Float32Array): Promise<Float32Array> {
    // Apply custom noise reduction algorithm
    const processed = new Float32Array(audioData.length);
    
    for (let i = 0; i < audioData.length; i++) {
      // Simple noise reduction
      const noiseLevel = this.noiseProfile[i % this.noiseProfile.length] || 0;
      processed[i] = Math.max(0, audioData[i] - noiseLevel * 0.1);
      
      // Update noise profile
      this.noiseProfile[i % this.noiseProfile.length] = 
        (this.noiseProfile[i % this.noiseProfile.length] * 0.9) + 
        (audioData[i] * 0.1);
    }
    
    return processed;
  }
  
  async enhanceResult(result: SpeechRecognitionResult): Promise<SpeechRecognitionResult> {
    // Post-process transcription result
    if (result.confidence < 0.8) {
      result.transcript = this.improveLowConfidenceText(result.transcript);
    }
    
    return result;
  }
  
  private improveLowConfidenceText(text: string): string {
    // Custom text improvement logic
    return text
      .replace(/\b(?:u|ur|ur)\b/gi, 'your')
      .replace(/\b(?:dont|wont|cant|wont)\b/gi, (match) => match + "'t");
  }
  
  async cleanup(): Promise<void> {
    console.log('Custom noise reduction cleaned up');
  }
}

// Register plugin
const plugin = new CustomNoiseReduction();
await voiceEngine.registerPlugin(plugin);
```

## 📊 Error Handling

### Error Types

```typescript
enum ErrorCode {
  NO_MICROPHONE = 'no_microphone',
  PERMISSION_DENIED = 'permission_denied',
  NETWORK_ERROR = 'network_error',
  NOT_SUPPORTED = 'not_supported',
  MODEL_LOAD_FAILED = 'model_load_failed',
  AUDIO_PROCESSING_ERROR = 'audio_processing_error',
  LANGUAGE_NOT_SUPPORTED = 'language_not_supported',
  INSUFFICIENT_RESOURCES = 'insufficient_resources',
  TIMEOUT = 'timeout',
  INTERRUPTED = 'interrupted'
}
```

### Error Handling Best Practices

```typescript
async function robustVoiceRecognition() {
  try {
    // Initialize with fallback
    await voiceEngine.initialize('en-US');
  } catch (error) {
    if (error.code === ErrorCode.NO_MICROPHONE) {
      console.error('No microphone found. Please connect a microphone.');
      return;
    }
    
    if (error.code === ErrorCode.PERMISSION_DENIED) {
      console.error('Microphone permission denied. Please grant access.');
      return;
    }
    
    // Generic error handling
    console.error('Voice recognition failed:', error);
  }
  
  // Listen for errors
  voiceEngine.onError((error) => {
    console.error('Recognition error:', error.message);
    
    // Attempt recovery for recoverable errors
    if (error.recoverable) {
      switch (error.code) {
        case ErrorCode.NETWORK_ERROR:
          // Switch to offline mode
          voiceEngine.switchEngine(ModelType.WHISPER_BASE);
          break;
          
        case ErrorCode.MODEL_LOAD_FAILED:
          // Try smaller model
          voiceEngine.switchEngine(ModelType.WHISPER_TINY);
          break;
      }
    }
  });
}
```

## 🔒 Authentication & Security

### API Key Management

```typescript
// Store API key securely
const apiKey = process.env.VOICEFLOW_API_KEY;

// Include in requests
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};
```

### End-to-End Encryption

```typescript
// Enable privacy mode for sensitive data
const voiceEngine = new VoiceFlowPro({
  privacyMode: true,
  offlineFirst: true,
  cacheEnabled: false
});

// Verify encryption
voiceEngine.onResult((result) => {
  if (result.metadata.modelUsed.startsWith('whisper')) {
    console.log('Processed locally (encrypted)');
  } else {
    console.log('Processed online (may be stored)');
  }
});
```

## 📈 Rate Limits & Quotas

### API Rate Limits

- **Free Tier**: 100 requests/hour
- **Pro Tier**: 1,000 requests/hour  
- **Team Tier**: 10,000 requests/hour
- **Enterprise**: Custom limits

### Usage Monitoring

```typescript
const usage = await fetch('https://api.voiceflowpro.com/v1/usage', {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

const usageData = await usage.json();
console.log('API Usage:', usageData);
```

## 🧪 Testing APIs

### Unit Testing Voice Engine

```typescript
import { VoiceFlowPro, ModelType } from 'voiceflow-voice-recognition-engine';
import { jest } from '@jest/globals';

describe('Voice Engine API', () => {
  let voiceEngine: VoiceFlowPro;
  
  beforeEach(async () => {
    voiceEngine = new VoiceFlowPro({
      primaryEngine: ModelType.WHISPER_BASE,
      offlineFirst: true
    });
    
    // Mock getUserMedia for testing
    global.navigator.mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [{
          stop: jest.fn()
        }]
      })
    };
  });
  
  afterEach(async () => {
    await voiceEngine.dispose();
  });
  
  test('should initialize successfully', async () => {
    await expect(voiceEngine.initialize('en-US')).resolves.not.toThrow();
    expect(voiceEngine.isSupported).toBe(true);
  });
  
  test('should handle recognition results', async (done) => {
    voiceEngine.onResult((result) => {
      expect(result.transcript).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      done();
    });
    
    // Simulate recognition result
    voiceEngine.emit('recognition:result', {
      transcript: 'Test transcription',
      confidence: 0.9,
      isFinal: true,
      timestamp: Date.now(),
      language: 'en-US',
      alternatives: [],
      metadata: {
        audioLevel: 0.5,
        signalQuality: 0.9,
        processingTime: 100,
        modelUsed: ModelType.WHISPER_BASE,
        noiseLevel: 0.1
      }
    });
  });
});
```

## 🚀 Production Deployment

### Environment Configuration

```typescript
const config = {
  // Production settings
  apiUrl: 'https://api.voiceflowpro.com',
  wsUrl: 'wss://realtime.voiceflowpro.com',
  apiKey: process.env.VOICEFLOW_API_KEY,
  
  // Performance settings
  offlineFirst: true,
  cacheEnabled: true,
  autoEngineSelection: true,
  
  // Privacy settings
  privacyMode: false, // Set to true for GDPR compliance
  dataRetention: '30d', // Data retention period
};
```

### Error Monitoring

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

voiceEngine.onError((error) => {
  Sentry.captureException(error);
});
```

This API reference provides comprehensive documentation for all VoiceFlow Pro APIs. For more detailed examples and advanced use cases, see our [Developer Guide](../developer-guide/) or [Integration Examples](../examples/).
