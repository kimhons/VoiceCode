# VoiceFlow Pro Desktop App - Setup & Testing Guide

## Build Artifacts

The application has been successfully built. Installers are located at:

- **MSI Installer**: `src-tauri/target/release/bundle/msi/VoiceFlow Pro_1.0.0_x64_en-US.msi`
- **NSIS Installer**: `src-tauri/target/release/bundle/nsis/VoiceFlow Pro_1.0.0_x64-setup.exe`

## Required API Keys

Set these environment variables before running the application:

### Core LLM Providers (Required - at least one)

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API for coding agent | **Yes** (primary) |
| `OPENAI_API_KEY` | OpenAI API for Whisper STT & GPT | Recommended |

### Speech-to-Text Providers (Required - at least one)

| Variable | Description | Required |
|----------|-------------|----------|
| `DEEPGRAM_API_KEY` | Deepgram for real-time transcription | Recommended |
| `OPENAI_API_KEY` | OpenAI Whisper for STT | Alternative |

### Additional AI Services (Optional)

| Variable | Description | Required |
|----------|-------------|----------|
| `AIML_API_KEY` | AI/ML API Gateway for multi-model access | Optional |
| `GOOGLE_API_KEY` | Google AI (Gemini) | Optional |

### Configuration Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VOICECODE_MAX_CONCURRENT_TASKS` | Max parallel agent tasks | 4 |

## Setting Environment Variables

### Windows (PowerShell - Session)
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
$env:OPENAI_API_KEY = "sk-..."
$env:DEEPGRAM_API_KEY = "..."
```

### Windows (Permanent - User Level)
```powershell
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-...", "User")
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "sk-...", "User")
[Environment]::SetEnvironmentVariable("DEEPGRAM_API_KEY", "...", "User")
```

### Using .env File (Development)
Create a `.env` file in `apps/desktop/src-tauri/`:
```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
AIML_API_KEY=...
```

## Installation

### Option 1: MSI Installer (Recommended)
1. Double-click `VoiceFlow Pro_1.0.0_x64_en-US.msi`
2. Follow the installation wizard
3. Launch from Start Menu

### Option 2: NSIS Installer
1. Run `VoiceFlow Pro_1.0.0_x64-setup.exe`
2. Follow the installation wizard
3. Launch from Start Menu or Desktop shortcut

### Option 3: Development Mode
```powershell
cd apps/desktop
npm run tauri:dev
```

## Testing Checklist

### 1. Basic Launch
- [ ] Application starts without errors
- [ ] Main window appears
- [ ] No console errors on startup

### 2. Voice Recognition
- [ ] Microphone permission granted
- [ ] Voice input detected
- [ ] Transcription appears in real-time
- [ ] Commands are recognized

### 3. Coding Agent Features
- [ ] Context engine initializes
- [ ] File indexing works
- [ ] Code navigation functions
- [ ] LLM responses received

### 4. Key Voice Commands to Test
```
"Create a function called hello world"
"Open file main.rs"
"Search for function named test"
"Run the current file"
"Undo last change"
```

### 5. MCP Integration
- [ ] MCP servers connect
- [ ] Tools are discoverable
- [ ] External agent integration works

## Troubleshooting

### API Key Issues
```
Error: Missing API key
```
- Verify environment variables are set
- Restart the application after setting keys
- Check for typos in variable names

### Audio Issues
```
Error: No audio input detected
```
- Check microphone permissions in Windows Settings
- Verify microphone is not muted
- Try selecting a different audio device

### Build Issues
If you need to rebuild:
```powershell
cd apps/desktop
npm run tauri:build
```

### Debug Mode
Run with verbose logging:
```powershell
$env:RUST_LOG = "debug"
npm run tauri:dev
```

## Architecture Overview

```
VoiceFlow Pro Desktop
├── Frontend (React/TypeScript)
│   └── UI Components, Voice UI
├── Backend (Rust/Tauri)
│   ├── STT Providers (Deepgram, Whisper)
│   ├── Code Intelligence Engine
│   │   ├── AST Parser
│   │   ├── Semantic Search
│   │   ├── Project Indexer
│   │   └── Unified Context
│   ├── CLI Module
│   │   ├── Memory System
│   │   ├── Permission System
│   │   └── MCP Client
│   └── Coding Agent
│       ├── Meta-Agent Orchestrator
│       └── Voice Grammar Parser
└── Native APIs
    ├── File System Access
    ├── Audio Capture
    └── Screen Context
```

## Next Steps

1. Install the application using one of the installers
2. Set up required API keys
3. Launch and test basic functionality
4. Report any issues found during testing

## Support

For issues or questions, check:
- `docs/ARCHITECTURE_UPGRADE_STATUS.md` - Implementation status
- Project issues on GitHub
