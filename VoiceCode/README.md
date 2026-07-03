# VoiceCode

**The first voice-directed coding system.** Speak natural coding commands and VoiceCode captures your screen context, transcribes speech, classifies intent, and generates code — all in real time.

## Architecture

Turborepo monorepo with four apps, three backend services, and a VS Code extension:

```
VoiceCode/
├── apps/
│   ├── desktop/          # Tauri 1.8 (Rust + React) — primary app
│   ├── web/              # React + Vite web client
│   ├── mobile/           # React Native + Expo 52
│   └── api/              # Express 4.18 alert API
├── services/
│   ├── agent-core/       # Python/LangGraph agent orchestration
│   ├── ai-processor/     # Python AI pipeline
│   └── voice-engine/     # Node.js voice processing
├── extensions/
│   └── voiceflow-vscode/ # VS Code extension
├── packages/             # Shared libraries
├── supabase/             # Database migrations & edge functions
└── infrastructure/       # Docker, Terraform, K8s configs
```

## Prerequisites

| Tool      | Version | Notes                                           |
| --------- | ------- | ----------------------------------------------- |
| Node.js   | >= 18   | Required for all JS/TS packages                 |
| Rust      | >= 1.72 | Required for desktop app backend                |
| Tauri CLI | latest  | `cargo install tauri-cli`                       |
| Python    | >= 3.11 | Required for agent-core and ai-processor        |
| Platform  | -       | Windows: VS Build Tools (C++); macOS: Xcode CLT |

## Quick Start

```bash
# Clone and install
git clone https://github.com/kimhons/VoiceCode.git
cd VoiceCode
npm install

# Desktop app (primary)
cd apps/desktop
npm run dev                  # or: cargo tauri dev

# Web app
cd apps/web
npm run dev

# Mobile app
cd apps/mobile
npx expo start

# API server
cd apps/api
npm run dev
```

## Running Tests

```bash
# Rust backend (453 tests)
cd apps/desktop/src-tauri
cargo test --release --lib

# Desktop frontend
cd apps/desktop && npm test

# Web app
cd apps/web && npm test

# Mobile app
cd apps/mobile && npm test

# API server
cd apps/api && npm test

# Web E2E (Playwright)
cd apps/web && npx playwright test
```

> **Note:** On Windows, Rust tests must use `--release` due to a debug-mode DLL loader issue.

## Environment Variables

All API keys are **optional**. Without them, the app uses template-based code generation and browser-native speech recognition.

| Variable            | Purpose                                                                               | Default            |
| ------------------- | ------------------------------------------------------------------------------------- | ------------------ |
| `ANTHROPIC_API_KEY` | Claude for code generation                                                            | Template fallback  |
| `OPENAI_API_KEY`    | OpenAI for code gen + Whisper STT                                                     | Template fallback  |
| `AIML_API_KEY`      | AIML API aggregator (300+ models)                                                     | Template fallback  |
| `DEEPGRAM_API_KEY`  | Deepgram Nova-2 streaming STT                                                         | Browser Speech API |
| `SUPABASE_URL`      | Supabase project URL                                                                  | -                  |
| `SUPABASE_ANON_KEY` | Supabase anonymous key                                                                | -                  |
| `STRIPE_SECRET_KEY` | Stripe payments                                                                       | -                  |
| `API_SECRET`        | (API server) When set, alert endpoints require `x-api-key` or `Authorization: Bearer` | Auth disabled      |

Create a `.env` file in the relevant app directory. For production deploy, see **docs/DEPLOY_CHECKLIST.md**.

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Detailed architecture, module descriptions, and coding conventions
- **[docs/ssot/SSOT.md](./docs/ssot/SSOT.md)** - Single Source of Truth (requirements, modules, gaps, risks)
- **[docs/ssot/MASTER-IMPLEMENTATION-PLAN.md](./docs/ssot/MASTER-IMPLEMENTATION-PLAN.md)** - Task registry and wave plan
- **[docs/NEXT.md](./docs/NEXT.md)** - Developer runbook (what's next)
- **[docs/ANALYSIS_REPORT.md](./docs/ANALYSIS_REPORT.md)** - Project analysis and scorecard

## Key Features

- Voice-to-Code: Speak commands like "create a function that validates email"
- Screen Context: Detects active editor, language, file, and git branch
- Multi-Agent Orchestration: Race, consensus, pipeline, and decomposition strategies
- Vision/OCR: 3-tier OCR engine (Tesseract, PaddleOCR, Vision LLM)
- Cross-Platform: Desktop (Windows/macOS/Linux), Web, Mobile (iOS/Android)
- Safety Gates: Dangerous patterns blocked before execution
- 13 Intent Types: Navigate, Generate, Edit, Explain, Execute, Git, Debug, Refactor, Document, Test, and more

## License

MIT
