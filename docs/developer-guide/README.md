# VoiceFlow Pro Developer Guide

Comprehensive guide for developers working with VoiceFlow Pro's architecture, codebase, and APIs.

## 🏗️ Architecture Overview

VoiceFlow Pro follows a modern, modular architecture designed for scalability, performance, and maintainability.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        VoiceFlow Pro                         │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer (React + TypeScript)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Web App     │ │ Desktop App │ │ Mobile Apps (React      │ │
│  │ (PWA)       │ │ (Tauri)     │ │ Native)                 │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  UI Component Layer                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │ VoiceRecording  │ │ Transcription   │ │ AudioVisualiz.  │ │
│  │ Component       │ │ Display         │ │ Component       │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  API Layer                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Voice API   │ │ Cloud API   │ │ System Integration API  │ │
│  │ (WebSocket) │ │ (REST)      │ │ (Tauri Commands)        │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Core Engine Layer                                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │ Voice Engine    │ │ AI Processing   │ │ Audio Processing│ │
│  │ (Whisper.js,    │ │ Engine          │ │ Pipeline        │ │
│  │  Web Speech)    │ │ (Text Enhancement│ │ (Noise Reduction│ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │ Local Storage   │ │ Cloud Sync      │ │ Model Storage   │ │
│  │ (IndexedDB)     │ │ (Supabase)      │ │ (File System)   │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, TypeScript | UI components and state management |
| **Desktop** | Tauri, Rust | Cross-platform desktop runtime |
| **Mobile** | React Native | iOS and Android native apps |
| **Web** | Vite, PWA | Progressive Web App |
| **Voice Engine** | Whisper.js, Web Speech API | Speech recognition |
| **AI Processing** | OpenAI GPT, Custom Models | Text enhancement |
| **Database** | Supabase (Cloud), SQLite (Local) | Data persistence |
| **Real-time** | WebSocket | Live transcription |
| **Audio Processing** | Web Audio API, WebRTC | Audio handling |

## 📁 Project Structure

### Monorepo Structure

```
voiceflow-pro/
├── apps/
│   ├── desktop/                 # Tauri desktop application
│   │   ├── src-tauri/          # Rust backend
│   │   │   ├── src/
│   │   │   │   └── main.rs
│   │   │   ├── Cargo.toml
│   │   │   ├── tauri.conf.json
│   │   │   └── icons/
│   │   ├── src/                # React frontend
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── contexts/
│   │   │   └── utils/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   ├── mobile/                 # React Native apps
│   │   ├── ios/               # iOS specific code
│   │   ├── android/           # Android specific code
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── navigation/
│   │   │   └── services/
│   │   ├── package.json
│   │   └── index.js
│   │
│   └── web/                    # PWA web application
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   └── stores/
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
│
├── packages/
│   ├── ui-components/          # Shared React component library
│   │   ├── src/components/
│   │   ├── src/contexts/
│   │   ├── src/hooks/
│   │   ├── src/types/
│   │   └── src/utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── voice-engine/           # Core voice recognition engine
│   │   ├── src/
│   │   │   ├── engines/
│   │   │   ├── processing/
│   │   │   ├── languages/
│   │   │   └── types/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ai-processing/          # AI enhancement engine
│   │   ├── src/
│   │   │   ├── models/
│   │   │   ├── processing/
│   │   │   └── utils/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── requirements.txt
│   │
│   └── shared/                 # Shared utilities and types
│       ├── src/types/
│       ├── src/utils/
│       ├── src/constants/
│       └── package.json
│
├── docs/                       # Documentation
│   ├── user-guide/
│   ├── developer-guide/
│   ├── api-reference/
│   └── examples/
│
├── tools/                      # Build tools and scripts
│   ├── build/
│   ├── deploy/
│   ├── testing/
│   └── migration/
│
├── package.json               # Root package.json
├── README.md
└── .gitignore
```

### Key Files

#### Root Configuration
- `package.json` - Workspace root with shared scripts
- `tsconfig.json` - TypeScript configuration for entire monorepo
- `lerna.json` - Monorepo management configuration
- `.eslintrc.js` - Global ESLint rules
- `.prettierrc` - Code formatting configuration

#### Application-Specific
- `apps/desktop/src-tauri/Cargo.toml` - Rust dependencies
- `apps/desktop/src-tauri/tauri.conf.json` - Tauri application configuration
- `apps/desktop/src/main.tsx` - React application entry point
- `packages/ui-components/package.json` - Component library configuration

## 🛠️ Development Setup

### Prerequisites

#### System Requirements
- **Node.js** 18+ with npm/yarn/pnpm
- **Rust** 1.70+ with Cargo
- **Python** 3.9+ for AI processing
- **Git** for version control

#### Platform-Specific Tools

**Windows:**
- Visual Studio Build Tools 2022
- Windows SDK 10+
- CMake 3.18+

**macOS:**
- Xcode 14+
- Xcode Command Line Tools
- CocoaPods (for iOS)

**Linux:**
- Build Essentials
- WebKitGTK 2.34+
- libssl-dev

### Initial Setup

#### 1. Clone Repository

```bash
git clone https://github.com/voiceflow-pro/voiceflow-pro.git
cd voiceflow-pro

# Install dependencies
npm install

# Or using pnpm (recommended)
pnpm install
```

#### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
cat > .env << EOF
# Development settings
NODE_ENV=development
VOICEFLOW_API_URL=http://localhost:3001
VOICEFLOW_WS_URL=ws://localhost:3001
VOICEFLOW_API_KEY=your_development_api_key

# Database settings
DATABASE_URL=postgresql://localhost:5432/voiceflow_dev

# AI Processing
OPENAI_API_KEY=your_openai_key
WHISPER_MODEL_PATH=./models

# Analytics (optional)
SENTRY_DSN=your_sentry_dsn
ANALYTICS_KEY=your_analytics_key
EOF
```

#### 3. Database Setup

```bash
# Start database (using Docker)
docker-compose up -d postgres

# Run migrations
npm run db:migrate
npm run db:seed

# Or using local PostgreSQL
createdb voiceflow_dev
npm run db:migrate
```

#### 4. Build Dependencies

```bash
# Install Rust dependencies
cd apps/desktop/src-tauri
cargo check
cargo build
cd ../../..

# Install Python dependencies for AI processing
cd packages/ai-processing
pip install -r requirements.txt
cd ../../..

# Build component packages
npm run build:packages
```

### Development Workflow

#### Available Scripts

```bash
# Development servers
npm run dev                    # Start all development servers
npm run dev:desktop           # Desktop app only
npm run dev:web              # Web app only
npm run dev:mobile           # Mobile app only

# Building
npm run build                # Build all apps
npm run build:desktop       # Build desktop app
npm run build:web          # Build web app
npm run build:mobile       # Build mobile apps
npm run build:packages     # Build all packages

# Testing
npm run test               # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e         # End-to-end tests
npm run test:coverage    # Test coverage report

# Linting and formatting
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues
npm run format           # Format code

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:reset        # Reset database

# Deployment
npm run deploy:staging  # Deploy to staging
npm run deploy:prod     # Deploy to production
```

#### Hot Reload Setup

```bash
# Terminal 1: Backend development
npm run dev:backend

# Terminal 2: Desktop frontend
npm run dev:desktop

# Terminal 3: Web frontend
npm run dev:web

# Terminal 4: Mobile development
npm run dev:mobile
```

## 🔧 Core Components

### Voice Engine Development

The voice engine is the core component responsible for speech recognition and processing.

#### File Structure

```
packages/voice-engine/
├── src/
│   ├── engines/
│   │   ├── web-speech-engine.ts    # Web Speech API implementation
│   │   ├── whisper-engine.ts       # Whisper.js implementation
│   │   └── base-engine.ts          # Abstract base engine
│   ├── processing/
│   │   ├── audio-processor.ts      # Audio preprocessing
│   │   ├── noise-reduction.ts      # Noise reduction algorithms
│   │   └── speech-enhancement.ts   # Speech quality enhancement
│   ├── languages/
│   │   ├── index.ts               # Language detection and mapping
│   │   └── supported-languages.ts # Language definitions
│   ├── types/
│   │   ├── index.ts               # Core types
│   │   ├── engine.ts              # Engine interfaces
│   │   └── audio.ts               # Audio-related types
│   └── index.ts                   # Main export
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── examples/
└── docs/
```

#### Creating a New Engine

```typescript
// packages/voice-engine/src/engines/custom-engine.ts
import { BaseEngine, EngineConfig, RecognitionResult } from './base-engine';
import { EventEmitter } from 'events';

export class CustomEngine extends BaseEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;

  async initialize(config: EngineConfig): Promise<void> {
    // Initialize audio context
    this.audioContext = new AudioContext();
    
    // Setup microphone
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        noiseSuppression: true,
        echoCancellation: true,
      }
    });

    // Initialize custom recognition
    await this.setupCustomRecognition(stream);
  }

  async startRecognition(): Promise<void> {
    // Start custom recognition logic
    this.mediaRecorder = new MediaRecorder(this.stream);
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.processAudioChunk(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
  }

  private async processAudioChunk(audioData: Blob): Promise<void> {
    // Custom audio processing
    const arrayBuffer = await audioData.arrayBuffer();
    const float32Array = new Float32Array(arrayBuffer);
    
    // Process with custom model
    const result = await this.processWithCustomModel(float32Array);
    
    // Emit result
    this.emit('result', result);
  }

  async stopRecognition(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  dispose(): void {
    // Cleanup resources
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
```

### UI Component Development

Components are built with React, TypeScript, and follow accessibility best practices.

#### Component Template

```typescript
// packages/ui-components/src/components/VoiceRecording/VoiceRecording.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccessibility } from '../../utils/accessibility';
import { cn } from '../../lib/utils';

export interface VoiceRecordingProps {
  onRecordingStart?: () => void;
  onRecordingStop?: (transcript: string) => void;
  onStateChange?: (state: RecordingState) => void;
  disabled?: boolean;
  showVolume?: boolean;
  showSettings?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'minimal';
  className?: string;
  'aria-label'?: string;
}

export type RecordingState = 'idle' | 'listening' | 'processing' | 'paused';

export const VoiceRecording: React.FC<VoiceRecordingProps> = ({
  onRecordingStart,
  onRecordingStop,
  onStateChange,
  disabled = false,
  showVolume = true,
  showSettings = false,
  size = 'medium',
  variant = 'primary',
  className,
  'aria-label': ariaLabel,
  ...props
}) => {
  const { theme, platformConfig } = useTheme();
  const { 
    announceToScreenReader, 
    focusManagement,
    keyboardNavigation 
  } = useAccessibility();

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState('');

  // Handle recording state changes
  useEffect(() => {
    onStateChange?.(recordingState);
    
    // Announce state to screen readers
    const announcements = {
      idle: 'Voice recording is ready',
      listening: 'Voice recording started',
      processing: 'Processing speech',
      paused: 'Voice recording paused'
    };
    
    announceToScreenReader(announcements[recordingState]);
  }, [recordingState, onStateChange, announceToScreenReader]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case ' ':
      case 'Enter':
        event.preventDefault();
        toggleRecording();
        break;
      case 'Escape':
        if (recordingState === 'listening') {
          stopRecording();
        }
        break;
    }
  }, [disabled, recordingState]);

  const toggleRecording = useCallback(async () => {
    if (disabled) return;

    switch (recordingState) {
      case 'idle':
      case 'paused':
        await startRecording();
        break;
      case 'listening':
        await stopRecording();
        break;
    }
  }, [recordingState, disabled]);

  const startRecording = useCallback(async () => {
    try {
      setRecordingState('listening');
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start voice engine
      onRecordingStart?.();
      
      // Monitor audio volume
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      microphone.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const volumeInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(average / 255);
      }, 100);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingState('idle');
    }
  }, [onRecordingStart]);

  const stopRecording = useCallback(async () => {
    try {
      setRecordingState('processing');
      
      // Stop voice engine and get transcript
      const finalTranscript = await voiceEngine.stopListening();
      setTranscript(finalTranscript);
      
      setRecordingState('idle');
      onRecordingStop?.(finalTranscript);
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setRecordingState('idle');
    }
  }, [onRecordingStop]);

  // Platform-specific styling
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: platformConfig.borderRadius[size],
      padding: platformConfig.spacing[size],
      fontSize: platformConfig.fontSize[size],
    };

    const variants = {
      primary: {
        backgroundColor: theme.colors.primary,
        color: theme.colors.onPrimary,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        color: theme.colors.onSecondary,
      },
      minimal: {
        backgroundColor: 'transparent',
        color: theme.colors.onSurface,
        border: `1px solid ${theme.colors.outline}`,
      },
    };

    return { ...baseStyle, ...variants[variant] };
  };

  return (
    <div 
      className={cn('voice-recording', className)}
      role="group"
      aria-label={ariaLabel || 'Voice recording control'}
      {...props}
    >
      <button
        type="button"
        className={cn(
          'voice-recording-button',
          `size-${size}`,
          `variant-${variant}`,
          `state-${recordingState}`
        )}
        style={getButtonStyle()}
        onClick={toggleRecording}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-pressed={recordingState === 'listening'}
        aria-describedby="recording-help"
      >
        {/* Icon changes based on state */}
        <span className="voice-icon">
          {recordingState === 'listening' ? '🔴' : '🎤'}
        </span>
        
        <span className="voice-text">
          {recordingState === 'idle' && 'Start Recording'}
          {recordingState === 'listening' && 'Stop Recording'}
          {recordingState === 'processing' && 'Processing...'}
          {recordingState === 'paused' && 'Resume Recording'}
        </span>
      </button>

      {showVolume && recordingState === 'listening' && (
        <div className="volume-indicator" aria-hidden="true">
          <div 
            className="volume-bar"
            style={{ width: `${volume * 100}%` }}
          />
        </div>
      )}

      {showSettings && (
        <button
          type="button"
          className="settings-button"
          aria-label="Recording settings"
          onClick={() => {/* Open settings */}}
        >
          ⚙️
        </button>
      )}

      <div id="recording-help" className="sr-only">
        Press space or enter to start or stop recording. Press escape to stop.
      </div>
    </div>
  );
};

export default VoiceRecording;
```

#### Testing Components

```typescript
// packages/ui-components/src/components/VoiceRecording/VoiceRecording.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { VoiceRecording } from './VoiceRecording';

// Mock voice engine
jest.mock('voiceflow-voice-engine', () => ({
  VoiceFlowPro: jest.fn().mockImplementation(() => ({
    startListening: jest.fn().mockResolvedValue(undefined),
    stopListening: jest.fn().mockResolvedValue('test transcript'),
    isListening: false,
  })),
}));

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <ThemeProvider defaultTheme="light">
      {component}
    </ThemeProvider>
  );
};

describe('VoiceRecording', () => {
  test('renders recording button', () => {
    renderWithProviders(<VoiceRecording />);
    
    const button = screen.getByRole('button', { 
      name: /voice recording control/i 
    });
    expect(button).toBeInTheDocument();
  });

  test('starts recording when clicked', async () => {
    renderWithProviders(<VoiceRecording />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Stop Recording')).toBeInTheDocument();
    });
  });

  test('calls onRecordingStart callback', async () => {
    const onRecordingStart = jest.fn();
    renderWithProviders(<VoiceRecording onRecordingStart={onRecordingStart} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(onRecordingStart).toHaveBeenCalledTimes(1);
    });
  });

  test('supports keyboard navigation', async () => {
    renderWithProviders(<VoiceRecording />);
    
    const button = screen.getByRole('button');
    button.focus();
    
    fireEvent.keyDown(button, { key: ' ', code: 'Space' });
    
    await waitFor(() => {
      expect(screen.getByText('Stop Recording')).toBeInTheDocument();
    });
  });

  test('handles recording errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    renderWithProviders(<VoiceRecording />);
    
    // Mock getUserMedia to simulate error
    navigator.mediaDevices.getUserMedia = jest.fn()
      .mockRejectedValue(new Error('Permission denied'));
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });
});
```

### Backend Development (Tauri/Rust)

#### Tauri Command Implementation

```rust
// apps/desktop/src-tauri/src/commands/voice_engine.rs
use tauri::{State, Window};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone)]
pub struct VoiceEngineState {
    pub is_listening: bool,
    pub current_language: String,
    pub confidence_threshold: f32,
}

impl Default for VoiceEngineState {
    fn default() -> Self {
        Self {
            is_listening: false,
            current_language: "en-US".to_string(),
            confidence_threshold: 0.7,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecognitionResult {
    pub transcript: String,
    pub confidence: f32,
    pub is_final: bool,
    pub language: String,
    pub timestamp: i64,
}

#[tauri::command]
pub async fn start_listening(
    window: Window,
    state: State<'_, Arc<Mutex<VoiceEngineState>>>,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    
    if state.is_listening {
        return Err("Already listening".to_string());
    }

    // Start voice recognition
    // This would integrate with your voice engine
    state.is_listening = true;
    
    // Notify frontend
    window.emit("voice-status", &json!({
        "status": "listening",
        "language": state.current_language
    })).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn stop_listening(
    window: Window,
    state: State<'_, Arc<Mutex<VoiceEngineState>>>,
) -> Result<RecognitionResult, String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    
    if !state.is_listening {
        return Err("Not currently listening".to_string());
    }

    // Stop voice recognition and get result
    let result = RecognitionResult {
        transcript: "Example transcription".to_string(),
        confidence: 0.95,
        is_final: true,
        language: state.current_language.clone(),
        timestamp: chrono::Utc::now().timestamp(),
    };

    state.is_listening = false;
    
    // Notify frontend
    window.emit("voice-status", &json!({
        "status": "idle"
    })).map_err(|e| e.to_string())?;

    Ok(result)
}

#[tauri::command]
pub async fn process_speech(
    window: Window,
    transcript: String,
    context: Option<String>,
) -> Result<serde_json::Value, String> {
    // Process transcript with AI
    let processed = ai_processing::enhance_text(&transcript, context.as_deref())
        .map_err(|e| e.to_string())?;

    Ok(json!({
        "original": transcript,
        "processed": processed.text,
        "suggestions": processed.suggestions,
        "confidence": processed.confidence
    }))
}

#[tauri::command]
pub fn get_settings(
    state: State<'_, Arc<Mutex<VoiceEngineState>>>,
) -> Result<serde_json::Value, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    
    Ok(json!({
        "language": state.current_language,
        "confidence_threshold": state.confidence_threshold,
        "is_listening": state.is_listening,
        "theme": "system",
        "auto_start": false,
        "minimize_to_tray": true
    }))
}

#[tauri::command]
pub fn set_language(
    language: String,
    state: State<'_, Arc<Mutex<VoiceEngineState>>>,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.current_language = language;
    Ok(())
}
```

#### Main Application Setup

```rust
// apps/desktop/src-tauri/src/main.rs
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod utils;
mod system_integration;

use commands::voice_engine::*;
use std::sync::{Arc, Mutex};

#[tokio::main]
async fn main() {
    // Initialize logging
    utils::init_logging();

    tauri::Builder::default()
        // Initialize state
        .manage(Arc::new(Mutex::new(VoiceEngineState::default())))
        
        // Register voice engine commands
        .invoke_handler(tauri::generate_handler![
            start_listening,
            stop_listening,
            process_speech,
            get_settings,
            set_language,
            register_global_shortcut,
            minimize_to_tray,
            show_notification
        ])
        
        // System tray
        .system_tray(system_tray::SystemTray::new())
        .on_system_tray_event(system_tray::handle_tray_event)
        
        // Window management
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // Hide window instead of closing
                let window = event.window();
                window.hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        
        // Build and run
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// System tray module
mod system_tray {
    use tauri::{CustomMenuItem, Menu, MenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
    use tauri::Window;

    pub fn SystemTray::new() -> SystemTray {
        let quit = CustomMenuItem::new("quit".to_string(), "Quit");
        let show = CustomMenuItem::new("show".to_string(), "Show VoiceFlow Pro");
        let settings = CustomMenuItem::new("settings".to_string(), "Settings");
        
        let tray_menu = SystemTrayMenu::new()
            .add_item(show)
            .add_item(settings)
            .add_native_item(SystemTrayMenuItem::Separator)
            .add_item(quit);

        SystemTray::new().with_menu(tray_menu)
    }

    pub fn handle_tray_event(event: SystemTrayEvent, window: &Window) {
        match event {
            SystemTrayEvent::LeftClick => {
                // Toggle window visibility
                if window.is_visible().unwrap() {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "show" => {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                    "settings" => {
                        // Open settings window
                        // Implementation depends on your settings UI
                    }
                    _ => {}
                }
            }
            _ => {}
        }
    }
}
```

### API Integration

#### Cloud API Client

```typescript
// packages/shared/src/api/client.ts
import { EventEmitter } from 'events';
import WebSocket from 'ws';

export interface VoiceFlowAPIClientConfig {
  apiKey: string;
  baseURL: string;
  wsURL?: string;
  timeout?: number;
  retries?: number;
}

export class VoiceFlowAPIClient extends EventEmitter {
  private config: VoiceFlowAPIClientConfig;
  private ws: WebSocket | null = null;
  private requestQueue: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();

  constructor(config: VoiceFlowAPIClientConfig) {
    super();
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retries!; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json() as T;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.config.retries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError!;
  }

  async transcribe(audioData: ArrayBuffer, options: TranscriptionOptions = {}): Promise<TranscriptionResult> {
    return this.request<TranscriptionResult>('/transcribe', {
      method: 'POST',
      body: JSON.stringify({
        audio: Buffer.from(audioData).toString('base64'),
        ...options,
      }),
    });
  }

  async processText(text: string, options: ProcessingOptions = {}): Promise<ProcessingResult> {
    return this.request<ProcessingResult>('/process', {
      method: 'POST',
      body: JSON.stringify({
        text,
        ...options,
      }),
    });
  }

  // WebSocket methods for real-time communication
  connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.ws = new WebSocket(this.config.wsURL!);

      this.ws.onopen = () => {
        // Authenticate
        this.ws!.send(JSON.stringify({
          type: 'auth',
          token: this.config.apiKey,
        }));
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      };

      this.ws.onerror = (error) => {
        reject(error);
      };

      this.ws.onclose = () => {
        this.emit('disconnected');
      };
    });
  }

  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'auth_success':
        this.emit('authenticated');
        break;
      case 'transcription':
        this.emit('transcription', message.data);
        break;
      case 'status':
        this.emit('status', message.data);
        break;
      case 'error':
        this.emit('error', message.error);
        break;
    }
  }

  startRealtimeTranscription(options: RealtimeOptions = {}): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify({
      type: 'start_listening',
      ...options,
    }));
  }

  sendAudioChunk(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify({
      type: 'audio_chunk',
      data: Buffer.from(audioData).toString('base64'),
      timestamp: Date.now(),
    }));
  }

  stopRealtimeTranscription(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'stop_listening',
      }));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Usage example
const apiClient = new VoiceFlowAPIClient({
  apiKey: process.env.VOICEFLOW_API_KEY!,
  baseURL: 'https://api.voiceflowpro.com/v1',
  wsURL: 'wss://realtime.voiceflowpro.com/v1',
});

// Transcribe audio file
const result = await apiClient.transcribe(audioBuffer, {
  language: 'en-US',
  model: 'whisper-base',
});

// Real-time transcription
await apiClient.connectWebSocket();

apiClient.on('transcription', (result) => {
  console.log('Live transcription:', result.text);
});

apiClient.startRealtimeTranscription({
  language: 'en-US',
  interimResults: true,
});

// Send audio chunks
// ... audio processing logic ...

apiClient.stopRealtimeTranscription();
```

## 🧪 Testing Strategy

### Unit Testing

```typescript
// packages/voice-engine/src/engines/whisper-engine.test.ts
import { WhisperEngine } from './whisper-engine';
import { ModelType } from '../types';

describe('WhisperEngine', () => {
  let engine: WhisperEngine;

  beforeEach(async () => {
    engine = new WhisperEngine({
      modelType: ModelType.WHISPER_BASE,
      offlineFirst: true,
      qualityPreference: 'excellent',
    });
    await engine.initialize('en-US');
  });

  afterEach(async () => {
    await engine.dispose();
  });

  test('should initialize successfully', () => {
    expect(engine.isSupported).toBe(true);
    expect(engine.isInitialized).toBe(true);
  });

  test('should start and stop listening', async () => {
    await engine.startListening();
    expect(engine.isListening).toBe(true);

    await engine.stopListening();
    expect(engine.isListening).toBe(false);
  });

  test('should handle audio transcription', async (done) => {
    engine.onResult((result) => {
      expect(result.transcript).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      done();
    });

    await engine.startListening();
    
    // Simulate audio data
    const mockAudioData = new Float32Array(16000); // 1 second of 16kHz audio
    engine.processAudioChunk(mockAudioData);
    
    await engine.stopListening();
  });

  test('should handle language switching', async () => {
    await engine.setLanguage('es-ES');
    expect(engine.getCurrentLanguage()).toBe('es-ES');
  });

  test('should handle errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Simulate error
    engine.emit('error', {
      message: 'Test error',
      code: 'TEST_ERROR',
      recoverable: true,
    });

    await engine.startListening();
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Recognition error:',
      expect.objectContaining({
        message: 'Test error',
        code: 'TEST_ERROR',
      })
    );
    
    consoleSpy.mockRestore();
  });
});
```

### Integration Testing

```typescript
// integration/voice-engine-integration.test.ts
import { VoiceFlowPro } from 'voiceflow-voice-recognition-engine';
import { createTestEnvironment } from './test-utils';

describe('Voice Engine Integration', () => {
  let voiceEngine: VoiceFlowPro;
  let testEnv: ReturnType<typeof createTestEnvironment>;

  beforeAll(async () => {
    testEnv = createTestEnvironment();
    await testEnv.setup();
  });

  afterAll(async () => {
    await testEnv.teardown();
  });

  beforeEach(async () => {
    voiceEngine = new VoiceFlowPro({
      primaryEngine: 'web-speech-api',
      fallbackEngine: 'whisper-base',
      offlineFirst: false,
    });
    await voiceEngine.initialize('en-US');
  });

  afterEach(async () => {
    await voiceEngine.dispose();
  });

  test('should work with audio processing pipeline', async (done) => {
    // Setup audio processing
    const audioContext = new AudioContext();
    const stream = await audioContext.createMediaStreamSource(new MediaStream());
    
    // Connect components
    const audioProcessor = testEnv.createAudioProcessor();
    audioProcessor.connect(voiceEngine);
    
    // Simulate audio input
    const testAudio = testEnv.loadTestAudio('speech-sample.wav');
    audioProcessor.processAudio(testAudio);
    
    // Verify transcription
    voiceEngine.onResult((result) => {
      expect(result.transcript).toContain('hello world');
      done();
    });
    
    await voiceEngine.startListening();
  });

  test('should handle network errors gracefully', async () => {
    // Simulate network failure
    testEnv.simulateNetworkFailure();
    
    await expect(voiceEngine.startListening()).rejects.toThrow();
    
    // Verify fallback to offline mode
    expect(voiceEngine.getCurrentEngine()).toBe('whisper-base');
  });
});
```

### E2E Testing

```typescript
// e2e/voice-recording.e2e.test.ts
import { test, expect } from '@playwright/test';

test.describe('Voice Recording E2E', () => {
  test('should complete voice recording workflow', async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:3000');
    
    // Grant microphone permission
    await page.evaluate(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        // Mock successful permission
        return new MediaStream([{
          id: 'mock-track',
          stop: () => {},
          enabled: true,
        }]);
      };
    });
    
    // Start recording
    await page.click('[data-testid="voice-recording-button"]');
    
    // Verify recording state
    await expect(page.locator('[data-testid="recording-state"]'))
      .toContainText('listening');
    
    // Simulate speech input
    await page.evaluate(() => {
      // Trigger mock transcription result
      const event = new CustomEvent('mock-transcription', {
        detail: { text: 'Hello world this is a test', confidence: 0.95 }
      });
      window.dispatchEvent(event);
    });
    
    // Stop recording
    await page.click('[data-testid="voice-recording-button"]');
    
    // Verify transcript display
    await expect(page.locator('[data-testid="transcript-display"]'))
      .toContainText('Hello world this is a test');
  });

  test('should handle accessibility features', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="voice-recording-button"]'))
      .toBeFocused();
    
    // Test keyboard activation
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="recording-state"]'))
      .toContainText('listening');
    
    // Test screen reader announcements
    const messages: string[] = [];
    page.on('console', msg => messages.push(msg.text()));
    
    await page.click('[data-testid="voice-recording-button"]');
    
    // Verify announcement was made
    await expect(messages).toContain('Voice recording is ready');
  });
});
```

## 📦 Building and Deployment

### Build Configuration

```json
{
  "scripts": {
    "build": "npm run build:packages && npm run build:apps",
    "build:packages": "npm run build:ui-components && npm run build:voice-engine",
    "build:ui-components": "tsc -p packages/ui-components/tsconfig.json",
    "build:voice-engine": "tsc -p packages/voice-engine/tsconfig.json && node scripts/build-engine.js",
    "build:apps": "npm run build:desktop && npm run build:web && npm run build:mobile",
    "build:desktop": "cd apps/desktop && npm run build",
    "build:web": "cd apps/web && npm run build",
    "build:mobile": "cd apps/mobile && npm run build:ios && npm run build:android",
    "build:docs": "typedoc --out docs/api packages/*/src/index.ts"
  }
}
```

### Docker Build

```dockerfile
# Multi-stage build for voice engine
FROM node:18-alpine AS builder

WORKDIR /app

# Install Rust
RUN apk add --no-cache rust cargo

# Copy package files
COPY package*.json ./
COPY apps/desktop/src-tauri/Cargo.* ./apps/desktop/src-tauri/

# Install dependencies
RUN npm ci

# Build Rust components
WORKDIR /app/apps/desktop/src-tauri
RUN cargo build --release

# Build TypeScript packages
WORKDIR /app
RUN npm run build:packages

# Final image
FROM node:18-alpine AS runner

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    ca-certificates \
    ttf-freefont \
    sqlite \
    libsecret

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/apps/desktop/src-tauri/target/release ./bin

# Create non-root user
RUN addgroup -g 1001 -S voiceflow && \
    adduser -S voiceflow -u 1001

USER voiceflow

EXPOSE 3000

CMD ["npm", "start"]
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - run: npm ci
      - run: npm test -- --coverage

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install system dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libgtk-3-dev \
            libwebkit2gtk-4.0-dev \
            libssl-dev \
            libappindicator3-dev \
            librsvg2-dev
      
      - run: npm ci
      - run: npm run build

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to staging
        run: |
          # Deploy logic here
          echo "Deploying to staging..."
```

## 📚 Additional Resources

### Documentation Links
- [User Guide](../user-guide/README.md) - Complete user documentation
- [API Reference](../api-reference/README.md) - Full API documentation
- [Installation Guide](../installation/README.md) - Platform-specific setup
- [Examples](../examples/) - Code examples and tutorials

### Development Tools
- [Storybook](https://storybook.voiceflowpro.com) - Component documentation
- [API Documentation](https://api-docs.voiceflowpro.com) - Interactive API docs
- [Design System](https://design.voiceflowpro.com) - UI design guidelines

### Community
- [GitHub Repository](https://github.com/voiceflow-pro/voiceflow-pro)
- [Discord Community](https://discord.gg/voiceflowpro)
- [Developer Blog](https://blog.voiceflowpro.com)

---

**Ready to contribute?** Check out our [Contributing Guidelines](CONTRIBUTING.md) and start building the future of voice productivity!
