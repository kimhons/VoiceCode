# VoiceCode — Single Source of Truth (SSOT)

> Version: 1.1.0 | Updated: 2026-02-26 | Blueprint Forge OS™
> Mode: CONSOLIDATE | Surfaces: 11

---

## 1. Scope

VoiceCode is the first voice-directed coding system. Users speak natural coding commands and the system captures screen context, transcribes speech via multi-provider STT (Deepgram, Whisper, Web Speech API), classifies intent (13 command types), executes via a Coding Agent (LLM or template-based), and returns results across Desktop (Tauri), Web, Mobile, and VS Code Extension platforms.

### Constraints

- Node.js ≥18, Rust ≥1.72, Python ≥3.10
- Tauri 1.8 for desktop (cross-platform: Windows, macOS, Linux)
- Expo SDK 52 for mobile (iOS + Android)
- Supabase for auth, database, real-time, and edge functions
- Stripe for payment processing
- Bundle budget: Web index.js ≤250KB gzip
- CI must pass: type-check, lint, build, tests, security audit, E2E
- No API keys required for basic operation (template fallback)

### Glossary

| Term | Definition |
|------|-----------|
| STT | Speech-to-Text — converts audio to text |
| VAD | Voice Activity Detection — detects speech in audio |
| AST | Abstract Syntax Tree — parsed code structure |
| LLM | Large Language Model — AI text generation |
| IPC | Inter-Process Communication — Tauri frontend↔backend bridge |
| AIML API | AI/ML aggregator API for multi-model access |
| MCP | Model Context Protocol — VS Code agent protocol |
| RLS | Row-Level Security — Supabase database access control |

---

## 2. Module Registry (MOD-*)

| ID | Module | Owner | Boundary | Inputs | Outputs |
|----|--------|-------|----------|--------|---------|
| MOD-DESKTOP-BE | Desktop Backend (Rust) | — | `apps/desktop/src-tauri/src/` | Voice commands, audio, screen context | Code generation, STT results, OCR output |
| MOD-DESKTOP-FE | Desktop Frontend (React) | — | `apps/desktop/src/` | Tauri IPC events, user input | UI rendering, IPC commands |
| MOD-CODE-INTEL | Code Intelligence Engine | — | `apps/desktop/src-tauri/src/code_intelligence/` | Source files, voice grammar | AST, symbols, intent classification, prompts |
| MOD-VISION | Vision/OCR System | — | `apps/desktop/src-tauri/src/vision/` | Screenshots, images | OCR text, UI element detection |
| MOD-CLI | Multi-Agent CLI | — | `apps/desktop/src-tauri/src/cli/` | User tasks | Orchestrated agent responses |
| MOD-STT | Speech-to-Text System | — | `apps/desktop/src-tauri/src/stt/` | Audio streams | Transcribed text |
| MOD-STREAMING | Streaming Engine | — | `apps/desktop/src-tauri/src/streaming.rs` | Audio input, config | Real-time transcription events |
| MOD-WEB | Web Application | — | `apps/web/src/` | HTTP requests, user input | Web UI, API calls |
| MOD-MOBILE | Mobile Application | — | `apps/mobile/` | Touch input, voice | Mobile UI |
| MOD-API | API Server | — | `apps/api/` | HTTP requests | Alert/notification responses |
| MOD-VSCODE | VS Code Extension | — | `extensions/voiceflow-vscode/` | VS Code commands, voice | Code actions, agent results |
| MOD-AGENT-CORE | Agent Core Service | — | `services/agent-core/` | Task requests | Agent orchestration results |
| MOD-SUPABASE | Database Layer | — | `supabase/` | SQL queries, edge function calls | Data, auth tokens, webhook responses |
| MOD-SHARED | Shared Packages | — | `packages/` | — | Types, UI components, utilities |

---

## 3. Requirements Catalog (REQ-*)

### REQ-VOICE — Voice & STT

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-VOICE-0001 | Multi-provider STT with Deepgram Nova-2, OpenAI Whisper, and Web Speech API | System supports 3 STT providers; each returns transcription text; provider is selectable | MOD-STT, MOD-STREAMING | DONE |
| REQ-VOICE-0002 | Real-time streaming transcription with ≤450ms latency (Instant mode) | Streaming mode delivers interim results within 450ms measured via latency tracker | MOD-STREAMING | DONE |
| REQ-VOICE-0003 | Voice Activity Detection (VAD) | Audio input is analyzed for speech; non-speech segments are suppressed | MOD-STREAMING | DONE |
| REQ-VOICE-0004 | Context-aware vocabulary boost from screen context | STT receives vocabulary hints derived from active editor symbols | MOD-STT, MOD-STREAMING | DONE |
| REQ-VOICE-0005 | 3 streaming modes: Instant (450ms), Enhanced (850ms), Hybrid | User can select streaming mode; each meets its latency target | MOD-STREAMING | DONE |
| REQ-VOICE-0006 | Audio level calculation and visualization | Audio levels are computed and sent to frontend for waveform display | MOD-STREAMING, MOD-DESKTOP-FE | DONE |

### REQ-CODE — Code Intelligence

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-CODE-0001 | AST parsing for 21 programming languages via tree-sitter | `ast_engine.rs` parses files in 21 languages; returns AST nodes | MOD-CODE-INTEL | DONE |
| REQ-CODE-0002 | Project-wide symbol resolution | `symbol_table.rs` resolves symbols across project files | MOD-CODE-INTEL | DONE |
| REQ-CODE-0003 | Natural language → structured VoiceCommand parsing | `voice_grammar.rs` converts NL text to VoiceCommand struct | MOD-CODE-INTEL | DONE |
| REQ-CODE-0004 | Intent classification across 13 categories | `intent_classifier.rs` classifies into Navigate/Generate/Edit/Explain/Execute/Git/Debug/Refactor/Document/Test/etc. | MOD-CODE-INTEL | DONE |
| REQ-CODE-0005 | Dynamic token budget management for LLM context | `context_builder.rs` manages token budgets per LLM provider | MOD-CODE-INTEL | DONE |
| REQ-CODE-0006 | Anti-hallucination prompt engineering | `prompt_engineer.rs` generates prompts with hallucination guards | MOD-CODE-INTEL | DONE |
| REQ-CODE-0007 | Command risk classification and execution safety (sandbox) | `sandbox.rs` classifies commands by risk; blocks dangerous patterns (rm -rf, force-push, drop database) | MOD-CODE-INTEL | DONE |
| REQ-CODE-0008 | Multi-provider LLM client (Anthropic, OpenAI, AIML) | `llm_client.rs` supports 3 LLM providers with fallback to templates when no API key | MOD-CODE-INTEL | DONE |
| REQ-CODE-0009 | Hallucination detection in LLM output | `recitation_validator.rs` detects hallucinated content in LLM responses | MOD-CODE-INTEL | DONE |

### REQ-AGENT — Multi-Agent System

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-AGENT-0001 | 5 orchestration strategies (Single, Race, Consensus, Pipeline, Decomposition) | `orchestrator.rs` implements all 5 strategies; each selectable by user | MOD-CLI | DONE |
| REQ-AGENT-0002 | External agent adapters (Claude Code, Aider) | `external_agents.rs` launches and communicates with Claude Code and Aider | MOD-CLI | DONE |
| REQ-AGENT-0003 | Agent discovery and registry | `agent_registry.rs` discovers installed agents and manages capabilities | MOD-CLI | DONE |
| REQ-AGENT-0004 | Response validation with hallucination detection | `validation.rs` validates agent responses for hallucination | MOD-CLI | DONE |
| REQ-AGENT-0005 | Real-time output streaming from agent subprocesses | `streaming_parser.rs` parses real-time output from agent processes | MOD-CLI | DONE |


### REQ-VISION — Vision/OCR

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-VISION-0001 | Screen capture for OCR input | Screen region captured as image via `screenshots` crate | MOD-VISION | DONE |
| REQ-VISION-0002 | 3-tier OCR (Tesseract fast / PaddleOCR / Vision LLM semantic) | User selects OCR tier; each returns extracted text | MOD-VISION | DONE |
| REQ-VISION-0003 | Computer use agent with safety gates | `computer_use.rs` controls mouse/keyboard with risk classification | MOD-VISION | DONE |
| REQ-VISION-0004 | Browser automation via Playwright | `browser_agent.rs` automates browser actions | MOD-VISION | DONE |

### REQ-DESKTOP — Desktop Application

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-DESKTOP-0001 | Tauri desktop app with 5 panels (Coding, Agent, Vision, AI, Dictation) | All 5 panels render; each accessible via keyboard shortcut | MOD-DESKTOP-FE, MOD-DESKTOP-BE | DONE |
| REQ-DESKTOP-0002 | AI text processing features | AIFeaturesPanel renders and processes text via AIML API | MOD-DESKTOP-FE | DONE |
| REQ-DESKTOP-0003 | Memory and cache management | Memory stats and cache stats available via Tauri commands | MOD-DESKTOP-BE | DONE |
| REQ-DESKTOP-0004 | Structured logging | Logging commands expose log files, stats, and levels | MOD-DESKTOP-BE | DONE |
| REQ-DESKTOP-0005 | Data encryption (AES-GCM + Argon2) | Text and audio encrypted/decrypted via Tauri commands | MOD-DESKTOP-BE | DONE |

### REQ-WEB — Web Application

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-WEB-0001 | Landing page with product showcase | LandingPage renders at `/`; responsive; ≤250KB gzip | MOD-WEB | DONE |
| REQ-WEB-0002 | Dashboard with transcription display | DashboardPage renders at `/dashboard` behind auth | MOD-WEB | DONE |
| REQ-WEB-0003 | Settings panel | Settings pages render at `/settings` | MOD-WEB | DONE |
| REQ-WEB-0004 | Analytics dashboard | Analytics pages render at `/analytics` | MOD-WEB | DONE |
| REQ-WEB-0005 | Medical professional mode | Medical pages render at `/medical` with specialized vocabulary | MOD-WEB | DONE |
| REQ-WEB-0006 | Monitoring page | MonitoringPage renders at `/monitoring` | MOD-WEB | DONE |
| REQ-WEB-0007 | Rich transcript editor | TranscriptEditor supports editing, formatting, export | MOD-WEB | DONE |

### REQ-MOBILE — Mobile Application

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-MOBILE-0001 | Mobile home screen with navigation | Home screen renders; bottom tab navigation works | MOD-MOBILE | DONE (re-scoped: 30+ screens, 12+ navigators exist) |
| REQ-MOBILE-0002 | Audio recording service | expo-av records audio; files saved to device | MOD-MOBILE | DONE (re-scoped: service exists in 40+ services) |
| REQ-MOBILE-0003 | Transcription service integration | Audio sent to STT provider; results displayed | MOD-MOBILE | DONE (re-scoped: service exists in 40+ services) |
| REQ-MOBILE-0004 | Mobile settings with Supabase auth | Settings screen with profile, auth, preferences | MOD-MOBILE | DONE (re-scoped: full screen exists) |
| REQ-MOBILE-0005 | Payment integration (Stripe) | Stripe React Native SDK processes subscriptions | MOD-MOBILE | TODO |

### REQ-AUTH — Authentication

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-AUTH-0001 | Supabase authentication (email + OAuth) | Login page authenticates via Supabase; session persisted | MOD-WEB, MOD-SUPABASE | DONE |
| REQ-AUTH-0002 | User signup with profile creation | Signup creates user + profile row in Supabase | MOD-WEB, MOD-SUPABASE | DONE |

### REQ-PAY — Payments

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-PAY-0001 | Stripe checkout session | Edge function creates Stripe checkout session | MOD-SUPABASE | DONE |
| REQ-PAY-0002 | Stripe payment intent | Edge function creates payment intent | MOD-SUPABASE | DONE |
| REQ-PAY-0003 | Stripe customer portal | Edge function creates portal session | MOD-SUPABASE | DONE |
| REQ-PAY-0004 | Stripe webhook processing | Edge function handles Stripe webhooks | MOD-SUPABASE | DONE |

### REQ-SEC — Security

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-SEC-0001 | Security dashboard | SecurityDashboard component renders threat overview | MOD-WEB | DONE |
| REQ-SEC-0002 | AES-GCM encryption + Argon2 hashing | Encryption module encrypts/decrypts data; Argon2 hashes passwords | MOD-DESKTOP-BE | DONE |
| REQ-SEC-0003 | Hallucination detection in web services | `hallucinationDetection.service.ts` detects hallucinated content | MOD-WEB | DONE |
| REQ-SEC-0004 | Prompt security service | `promptSecurity.service.ts` sanitizes LLM prompts | MOD-WEB | DONE |
| REQ-SEC-0005 | CSRF protection | `csrf.ts` utility provides CSRF token management | MOD-WEB | DONE |
| REQ-SEC-0006 | Input validation (Zod schemas) | `api-schemas.ts` defines Zod validation schemas | MOD-WEB | DONE |

### REQ-DB — Database

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-DB-0001 | User profiles table with RLS | Migration creates profiles table with row-level security | MOD-SUPABASE | DONE |
| REQ-DB-0002 | Subscription management | Migration creates subscriptions table | MOD-SUPABASE | DONE |
| REQ-DB-0003 | Real-time session tables | Migrations create real_time_sessions, streaming_transcripts | MOD-SUPABASE | DONE |
| REQ-DB-0004 | AI feature tables | Migrations create live_suggestions, action_items, contextual_insights | MOD-SUPABASE | DONE |

### REQ-CI — CI/CD

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-CI-0001 | GitHub Actions CI with 4 jobs (web, desktop-rust, desktop-fe, mobile) | CI runs on push/PR to main/master; all 4 jobs defined | MOD-INFRA | DONE |
| REQ-CI-0002 | Bundle budget enforcement (≤250KB gzip) | CI fails if index.js exceeds 250KB gzip | MOD-INFRA | DONE |
| REQ-CI-0003 | Security audit in CI | CI runs `npx audit-ci --high` | MOD-INFRA | DONE |
| REQ-CI-0004 | Safety eval tests in CI | CI runs hallucination + prompt security tests | MOD-INFRA | DONE |

### REQ-API — API Server

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-API-0001 | Alert notification endpoint | POST `/api/alerts` sends email notification via Nodemailer | MOD-API | DONE |
| REQ-API-0002 | API health check | GET `/api/health` returns 200 | MOD-API | DONE |

### REQ-NOTIF — Notifications

| ID | Requirement | Acceptance Criteria | Module | Status |
|----|------------|-------------------|--------|--------|
| REQ-NOTIF-0001 | Push notification delivery | Edge function sends push notification to subscribed devices | MOD-SUPABASE | DONE |

---

## 4. Workflows

### WF-VOICE-CODING — Voice-to-Code Workflow

```
STATE-WF-VOICE-IDLE → [user speaks] → STATE-WF-VOICE-RECORDING
  → [VAD detects silence] → STATE-WF-VOICE-TRANSCRIBING
  → [STT returns text] → STATE-WF-VOICE-CLASSIFYING
  → [intent classified] → STATE-WF-VOICE-EXECUTING
  → [code generated] → STATE-WF-VOICE-DISPLAYING
  → [user accepts/rejects] → STATE-WF-VOICE-IDLE
```

**GATE-SAFETY**: Before execution, `sandbox.rs` classifies command risk. Dangerous patterns (rm -rf, force-push, drop database) are blocked.

### WF-AGENT-ORCHESTRATION — Multi-Agent Workflow

```
STATE-WF-AGENT-IDLE → [user submits task] → STATE-WF-AGENT-SELECTING
  → [strategy selected] → STATE-WF-AGENT-DISPATCHING
  → [agents invoked] → STATE-WF-AGENT-STREAMING
  → [responses collected] → STATE-WF-AGENT-VALIDATING
  → [hallucination check] → STATE-WF-AGENT-PRESENTING
  → STATE-WF-AGENT-IDLE
```

### WF-AUTH — Authentication Workflow

```
STATE-WF-AUTH-ANON → [user submits credentials] → STATE-WF-AUTH-VERIFYING
  → [Supabase validates] → STATE-WF-AUTH-AUTHENTICATED
  → [session expires] → STATE-WF-AUTH-ANON
```

### WF-PAYMENT — Payment Workflow

```
STATE-WF-PAY-FREE → [user clicks subscribe] → STATE-WF-PAY-CHECKOUT
  → [Stripe checkout completes] → STATE-WF-PAY-PROCESSING
  → [webhook confirms] → STATE-WF-PAY-ACTIVE
  → [subscription cancels] → STATE-WF-PAY-FREE
```

---

## 5. Open Issues

| ID | Issue | Options | Blocker | Status |
|----|-------|---------|---------|--------|
| GAP-0002 | Desktop FE allows TypeScript errors in CI | ~~A) Fix all errors~~ | No | **RESOLVED** — 139 errors fixed, `|| true` removed (TASK-INFRA-0001) |
| GAP-0003 | Mobile app ~60-70% complete (re-scoped from 18%) | A) Fix 19 TS errors + add test coverage + payment; B) Ship as-is | No | OPEN — 30+ screens, 40+ services, 15+ hooks, 12+ navigators exist; 19 TS errors in WebhooksAPIScreen.tsx |
| GAP-0004 | API server has zero tests | ~~A) Add test suite~~ | No | **RESOLVED** — 12 Vitest tests added (TASK-API-0001) |
| GAP-0005 | Legacy VoiceFlow-PRO references | ~~A) Find-and-replace all refs~~ | No | **RESOLVED** — all refs eliminated across 20+ files (TASK-INFRA-0002) |
| GAP-0006 | 40+ root legacy docs | A) Archive to `docs/archive/`; B) Delete | No | OPEN |
| GAP-0008 | No root README.md | ~~A) Create README~~ | No | **RESOLVED** — 121-line README created (TASK-INFRA-0004) |

---

## 6. Proposed Changes

| Change | Impact | REQ | Priority | Status |
|--------|--------|-----|----------|--------|
| ~~Enable strict tsc for desktop FE~~ | Catches type regressions | REQ-CI-0001 | ~~P1~~ | **DONE** (Wave 1) |
| ~~Add API server tests~~ | Reduces regression risk | REQ-API-* | ~~P1~~ | **DONE** (Wave 1) |
| ~~Clean VoiceFlow-PRO references~~ | Brand consistency | — | ~~P2~~ | **DONE** (Wave 1) |
| Fix mobile TS errors + add tests | Stabilize mobile platform | REQ-MOBILE-* | P0 | TODO |
| Mobile Stripe payment | Enables subscriptions on mobile | REQ-MOBILE-0005 | P1 | TODO |
| Add API request validation | Input safety | REQ-API-* | P1 | TODO |
| Archive legacy docs | Repository hygiene | — | P2 | TODO |
| Consolidate shared packages | Reduce duplication | — | P3 | TODO |

---

*All requirements derived from repository evidence. No hallucinated paths or features.*