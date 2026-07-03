# VoiceCode - AI-Powered Voice Coding System

## Overview

VoiceCode is the first voice-directed coding system. Users speak natural coding commands (e.g., "create a function that validates email") and the system:
1. Captures screen context (active editor, language, file, git branch)
2. Transcribes speech via multi-provider STT (Deepgram, Whisper, Web Speech API)
3. Classifies intent (13 command types: Navigate, Generate, Edit, Explain, Execute, Git, Debug, Refactor, Document, Test, etc.)
4. Executes via the Coding Agent (calls LLM when API key configured, otherwise template-based)
5. Returns results to the React frontend

## Architecture

```
VoiceCode/
├── apps/
│   ├── desktop/                    # Tauri 1.8 desktop app (primary)
│   │   ├── src/                    # React/TypeScript frontend
│   │   │   ├── App.tsx             # Main app with panel integration
│   │   │   ├── components/         # UI panels
│   │   │   │   ├── CodingAssistantPanel.tsx  # Voice-to-code UI
│   │   │   │   ├── AgentControlPanel.tsx     # Multi-agent orchestration
│   │   │   │   ├── VisionPanel.tsx           # Screen capture / OCR
│   │   │   │   ├── AIFeaturesPanel.tsx       # AI text processing
│   │   │   │   └── FloatingDictationButton.tsx
│   │   │   └── services/           # Frontend services
│   │   │       ├── tauri-streaming.service.ts  # Tauri IPC streaming bridge
│   │   │       ├── websocket-streaming.service.ts
│   │   │       └── aiml-api.service.ts
│   │   └── src-tauri/              # Rust backend
│   │       └── src/
│   │           ├── lib.rs          # Library root (module declarations)
│   │           ├── main.rs         # Tauri app setup (80+ commands registered)
│   │           ├── coding_agent.rs # Voice command -> code generation
│   │           ├── streaming.rs    # Real-time STT streaming engine
│   │           ├── screen_context.rs # Active window/editor detection
│   │           ├── code_intelligence/ # AST, symbols, search, prompts
│   │           ├── cli/            # Multi-agent orchestration
│   │           ├── vision/         # OCR, computer use, browser agent
│   │           ├── stt/            # Deepgram, Whisper providers
│   │           └── integrations/   # AIML API, text enhancement
│   └── mobile/                     # React Native mobile app
└── .github/workflows/ci.yml       # CI pipeline
```

## Build & Run

### Prerequisites
- Node.js 18+
- Rust 1.72+ (with `cargo`)
- Tauri CLI: `cargo install tauri-cli`
- Windows: Visual Studio Build Tools (C++ workload)

### Commands

```bash
# Install dependencies
cd VoiceCode/apps/desktop
npm install

# Development (hot-reload)
npm run dev                     # or: cargo tauri dev

# Production build
npm run build                   # or: cargo tauri build

# Rust checks
cd src-tauri
cargo check                     # Type check
cargo test --release --lib      # Run tests (use --release; debug has DLL issue)
cargo clippy                    # Lint

# TypeScript checks
cd ..
npx tsc --noEmit               # Type check frontend
npm run lint                    # ESLint
```

### Environment Variables (Optional)

| Variable | Purpose | Default |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | Anthropic Claude for code generation | Template fallback |
| `OPENAI_API_KEY` | OpenAI for code gen + Whisper STT | Template fallback |
| `AIML_API_KEY` | AIML API aggregator | Template fallback |
| `DEEPGRAM_API_KEY` | Deepgram Nova-2 streaming STT | Browser Speech API |

Without any API keys, the app runs with template-based code generation and browser-native speech recognition.

## Key Modules

### Coding Agent (`coding_agent.rs`)
- Parses voice text into one of 10+ command types
- Safety gating: regex-matched dangerous patterns (rm -rf, force-push, drop database)
- Confidence scoring based on keyword match quality
- LLM-powered execution when API key available, template fallback otherwise
- Undo/redo with full result history
- Global singleton: `get_coding_agent()`

### Streaming Engine (`streaming.rs`)
- 3 modes: Instant (450ms target), Enhanced (850ms), Hybrid (instant + background enhance)
- Multi-provider STT via `SttProviderManager`
- Context-aware vocabulary boost from screen context
- Audio level calculation, VAD, latency tracking
- Tauri event bridge: forwards `StreamingEvent` to frontend via `emit_all("streaming-event")`

### Code Intelligence (`code_intelligence/`)
- `ast_engine.rs`: tree-sitter parsing for 21 languages
- `symbol_table.rs`: project-wide symbol resolution
- `voice_grammar.rs`: Natural language -> structured VoiceCommand
- `intent_classifier.rs`: 13 intent categories
- `context_builder.rs`: Dynamic token budget management
- `prompt_engineer.rs`: Anti-hallucination prompt engineering
- `sandbox.rs`: Command risk classification and execution safety
- `llm_client.rs`: Multi-provider LLM client (Anthropic, OpenAI, AIML)
- `recitation_validator.rs`: Hallucination detection in LLM output

### Multi-Agent CLI (`cli/`)
- `orchestrator.rs`: 5 strategies (Single, Race, Consensus, Pipeline, Decomposition)
- `external_agents.rs`: Claude Code and Aider adapters
- `agent_registry.rs`: Agent discovery and management
- `validation.rs`: Response validation with hallucination detection
- `streaming_parser.rs`: Real-time output parsing from agent subprocesses

### Vision/OCR (`vision/`)
- `ocr_engine.rs`: 3-tier OCR (Tesseract fast / PaddleOCR standard / Vision LLM semantic)
- `computer_use.rs`: Screen interaction agent with safety gates
- `browser_agent.rs`: Playwright-based browser automation

### Frontend Panels
- **CodingAssistantPanel**: Voice/text input, code output with syntax display, undo, suggestions
- **AgentControlPanel**: Agent detection, strategy selection, task execution, history
- **VisionPanel**: Screen capture, OCR tier selection, context display, text extraction

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+C | Toggle Coding Assistant |
| Ctrl+Shift+G | Toggle Agent Control |
| Ctrl+Shift+V | Toggle Vision/OCR |
| Ctrl+Shift+A | Toggle AI Features |
| Ctrl+Shift+D | Toggle Global Dictation |

## Testing

```bash
# Rust unit tests (453 tests)
cd src-tauri
cargo test --release --lib

# Integration tests
cargo test --release --test integration_tests

# Frontend tests
cd ..
npm run test
```

**Known issue**: Debug-mode tests fail with `STATUS_ENTRYPOINT_NOT_FOUND (0xc0000139)` on Windows due to a DLL loader issue. Use `--release` flag as workaround. All 453 tests pass in release mode.

## Tauri Command Registration

All Tauri commands are registered in `main.rs` within the `invoke_handler`. The pattern is:
```rust
#[tauri::command]
pub async fn my_command(arg: String) -> Result<MyType, String> { ... }
```

Frontend calls:
```typescript
const result = await invoke<MyType>('my_command', { arg: 'value' });
```

## Streaming Events

Backend emits `streaming-event` via Tauri IPC. Frontend listens via:
```typescript
import { getTauriStreamingService } from './services/tauri-streaming.service';
const service = getTauriStreamingService();
service.on((event) => { /* event.event_type: 'final' | 'interim' | ... */ });
await service.init();
```

## Style Guide

- **Rust**: Follow existing patterns. Use `RwLock` for async state, `broadcast` for events, `Lazy` for singletons.
- **TypeScript**: Functional components with hooks. Catppuccin dark theme for panels (`#1e1e2e` bg, `#cdd6f4` text).
- **CSS**: BEM-like prefixes per component (`cap-` for CodingAssistant, `acp-` for AgentControl, `vp-` for Vision).
- **Naming**: Rust snake_case, TypeScript camelCase, CSS kebab-case with component prefix.
