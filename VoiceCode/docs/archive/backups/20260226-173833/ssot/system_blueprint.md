# VoiceCode — System Blueprint

> Version: 1.0.0 | Generated: 2026-02-26 | Blueprint Forge OS™

---

## 1. UI/UX — Desktop Application (Tauri)

### Screen Cards

| ID | Screen | Path | Entry | REQ |
|----|--------|------|-------|-----|
| SCR-DESKTOP-MAIN | Main Application Window | `apps/desktop/src/App.tsx` | Tauri window launch | REQ-DESKTOP-0001 |
| SCR-DESKTOP-CODING | Coding Assistant Panel | `apps/desktop/src/components/CodingAssistantPanel.tsx` | Ctrl+Shift+C | REQ-CODE-0001 |
| SCR-DESKTOP-AGENT | Agent Control Panel | `apps/desktop/src/components/AgentControlPanel.tsx` | Ctrl+Shift+G | REQ-AGENT-0001 |
| SCR-DESKTOP-VISION | Vision/OCR Panel | `apps/desktop/src/components/VisionPanel.tsx` | Ctrl+Shift+V | REQ-VISION-0001 |
| SCR-DESKTOP-AI | AI Features Panel | `apps/desktop/src/components/AIFeaturesPanel.tsx` | Ctrl+Shift+A | REQ-DESKTOP-0002 |
| SCR-DESKTOP-DICTATION | Floating Dictation Button | `apps/desktop/src/components/FloatingDictationButton.tsx` | Ctrl+Shift+D | REQ-VOICE-0001 |

### Component Registry (Desktop)

| ID | Component | Path | Props | REQ |
|----|-----------|------|-------|-----|
| CMP-CODING-INPUT | Voice/Text Input | `CodingAssistantPanel.tsx` | mode, onSubmit | REQ-VOICE-0001 |
| CMP-CODING-OUTPUT | Code Output Display | `CodingAssistantPanel.tsx` | result, language | REQ-CODE-0001 |
| CMP-AGENT-STRATEGY | Strategy Selector | `AgentControlPanel.tsx` | strategies, onSelect | REQ-AGENT-0001 |
| CMP-VISION-CAPTURE | Screen Capture | `VisionPanel.tsx` | region, quality | REQ-VISION-0001 |
| CMP-VISION-OCR | OCR Tier Selector | `VisionPanel.tsx` | tier, onSelect | REQ-VISION-0002 |

### Keyboard Shortcuts

| Shortcut | Action | Screen |
|----------|--------|--------|
| Ctrl+Shift+C | Toggle Coding Assistant | SCR-DESKTOP-CODING |
| Ctrl+Shift+G | Toggle Agent Control | SCR-DESKTOP-AGENT |
| Ctrl+Shift+V | Toggle Vision/OCR | SCR-DESKTOP-VISION |
| Ctrl+Shift+A | Toggle AI Features | SCR-DESKTOP-AI |
| Ctrl+Shift+D | Toggle Global Dictation | SCR-DESKTOP-DICTATION |

---

## 2. UI/UX — Web Application

### Screen Cards

| ID | Screen | Path | Route | REQ |
|----|--------|------|-------|-----|
| SCR-WEB-LANDING | Landing Page | `apps/web/src/pages/LandingPage.tsx` | `/` | REQ-WEB-0001 |
| SCR-WEB-DASHBOARD | Dashboard | `apps/web/src/pages/DashboardPage.tsx` | `/dashboard` | REQ-WEB-0002 |
| SCR-WEB-LOGIN | Login | `apps/web/src/pages/LoginPage.tsx` | `/login` | REQ-AUTH-0001 |
| SCR-WEB-SIGNUP | Signup | `apps/web/src/pages/SignupPage.tsx` | `/signup` | REQ-AUTH-0002 |
| SCR-WEB-PRICING | Pricing | `apps/web/src/pages/PricingPage.tsx` | `/pricing` | REQ-PAY-0001 |
| SCR-WEB-SETTINGS | Settings | `apps/web/src/pages/settings/` | `/settings` | REQ-WEB-0003 |
| SCR-WEB-ANALYTICS | Analytics | `apps/web/src/pages/analytics/` | `/analytics` | REQ-WEB-0004 |
| SCR-WEB-MEDICAL | Medical Mode | `apps/web/src/pages/medical/` | `/medical` | REQ-WEB-0005 |
| SCR-WEB-MONITORING | Monitoring | `apps/web/src/pages/MonitoringPage.tsx` | `/monitoring` | REQ-WEB-0006 |

### Key Components (Web)

| ID | Component | Path | REQ |
|----|-----------|------|-----|
| CMP-WEB-TRANSCRIPTION | Transcription Display | `components/TranscriptionDisplay.tsx` | REQ-VOICE-0001 |
| CMP-WEB-AUDIO-VIZ | Audio Visualization | `components/AudioVisualization.tsx` | REQ-VOICE-0006 |
| CMP-WEB-SECURITY | Security Dashboard | `components/SecurityDashboard.tsx` | REQ-SEC-0001 |
| CMP-WEB-ANALYTICS | Analytics Dashboard | `components/AnalyticsDashboard.tsx` | REQ-WEB-0004 |
| CMP-WEB-AI-INSIGHTS | AI Insights Dashboard | `components/AIInsightsDashboard.tsx` | REQ-WEB-0005 |
| CMP-WEB-EDITOR | Transcript Editor | `components/TranscriptEditor.tsx` | REQ-WEB-0007 |
| CMP-WEB-PROTECTED | Protected Route | `components/ProtectedRoute.tsx` | REQ-AUTH-0001 |

---

## 3. UI/UX — Mobile Application

### Screen Cards

| ID | Screen | Path | Status | REQ |
|----|--------|------|--------|-----|
| SCR-MOBILE-HOME | Home Screen | `apps/mobile/src/screens/` | TODO | REQ-MOBILE-0001 |
| SCR-MOBILE-RECORD | Recording Screen | `apps/mobile/src/screens/` | TODO | REQ-MOBILE-0002 |
| SCR-MOBILE-TRANSCRIPT | Transcript View | `apps/mobile/src/screens/` | TODO | REQ-MOBILE-0003 |
| SCR-MOBILE-SETTINGS | Settings | `apps/mobile/src/screens/` | Foundation | REQ-MOBILE-0004 |
| SCR-MOBILE-PROFILE | Profile | `apps/mobile/src/screens/` | Foundation | REQ-MOBILE-0005 |

---

## 4. API Endpoints

### Desktop Backend (80+ Tauri Commands)

| ID | Command | Module | REQ |
|----|---------|--------|-----|
| API-DESKTOP-VOICE-START | `start_streaming` | MOD-STREAMING | REQ-VOICE-0002 |
| API-DESKTOP-VOICE-STOP | `stop_streaming` | MOD-STREAMING | REQ-VOICE-0002 |
| API-DESKTOP-CODE-EXEC | `execute_voice_command` | MOD-CODE-INTEL | REQ-CODE-0004 |
| API-DESKTOP-AGENT-RUN | `run_agent_task` | MOD-CLI | REQ-AGENT-0001 |
| API-DESKTOP-VISION-CAPTURE | `capture_screen` | MOD-VISION | REQ-VISION-0001 |
| API-DESKTOP-VISION-OCR | `run_ocr` | MOD-VISION | REQ-VISION-0002 |
| API-DESKTOP-ENCRYPT | `encrypt_text` | MOD-DESKTOP-BE | REQ-SEC-0002 |
| API-DESKTOP-DECRYPT | `decrypt_text` | MOD-DESKTOP-BE | REQ-SEC-0002 |
| API-DESKTOP-MEM-STATS | `get_memory_stats` | MOD-DESKTOP-BE | REQ-DESKTOP-0003 |
| API-DESKTOP-CACHE | `get_cache_stats` | MOD-DESKTOP-BE | REQ-DESKTOP-0003 |

### Express API Server

| ID | Endpoint | Method | Purpose | REQ |
|----|----------|--------|---------|-----|
| API-SERVER-ALERTS | `/api/alerts` | POST | Send alert notifications | REQ-API-0001 |
| API-SERVER-HEALTH | `/api/health` | GET | Health check | REQ-API-0002 |

### Supabase Edge Functions

| ID | Function | Purpose | REQ |
|----|----------|---------|-----|
| API-SUPA-CHECKOUT | `create-checkout-session` | Stripe checkout | REQ-PAY-0001 |
| API-SUPA-INTENT | `create-payment-intent` | Stripe payment intent | REQ-PAY-0002 |
| API-SUPA-PORTAL | `create-portal-session` | Stripe customer portal | REQ-PAY-0003 |
| API-SUPA-PUSH | `send-push-notification` | Push notifications | REQ-NOTIF-0001 |
| API-SUPA-WEBHOOK | `stripe-webhook` | Stripe webhook handler | REQ-PAY-0004 |


---

## 5. Data Models (DM-*)

| ID | Model | Storage | Owner | Retention | REQ |
|----|-------|---------|-------|-----------|-----|
| DM-PROFILE | User Profile | Supabase `profiles` | MOD-SUPABASE | Permanent | REQ-DB-0001 |
| DM-SUBSCRIPTION | Subscription | Supabase `subscriptions` | MOD-SUPABASE | Permanent | REQ-DB-0002 |
| DM-PAYMENT | Payment Record | Supabase `payments` | MOD-SUPABASE | 7 years (compliance) | REQ-PAY-0001 |
| DM-TRANSCRIPT | Transcript | Supabase `transcripts` | MOD-SUPABASE | User-controlled | REQ-DB-0003 |
| DM-SESSION | Real-Time Session | Supabase `real_time_sessions` | MOD-SUPABASE | 30 days | REQ-DB-0003 |
| DM-STREAMING | Streaming Transcript | Supabase `streaming_transcripts` | MOD-SUPABASE | Session-scoped | REQ-DB-0003 |
| DM-SUGGESTION | Live Suggestion | Supabase `live_suggestions` | MOD-SUPABASE | 30 days | REQ-DB-0004 |
| DM-ACTION-ITEM | Action Item | Supabase `action_items` | MOD-SUPABASE | User-controlled | REQ-DB-0004 |
| DM-INSIGHT | Contextual Insight | Supabase `contextual_insights` | MOD-SUPABASE | 30 days | REQ-DB-0004 |
| DM-PUSH-SUB | Push Subscription | Supabase `push_subscriptions` | MOD-SUPABASE | Until unsubscribed | REQ-NOTIF-0001 |
| DM-VOICE-CMD | Voice Command (runtime) | Rust in-memory | MOD-CODE-INTEL | Session-scoped | REQ-CODE-0003 |
| DM-AST-NODE | AST Node (runtime) | Rust in-memory (LRU cache) | MOD-CODE-INTEL | Cache-evicted | REQ-CODE-0001 |
| DM-AGENT-RESULT | Agent Result (runtime) | Rust in-memory | MOD-CLI | Session-scoped | REQ-AGENT-0001 |

---

## 6. Workflows (WF-*)

### WF-VOICE-CODING — Voice-to-Code

| State | Trigger | Next State | GATE |
|-------|---------|-----------|------|
| STATE-WF-VOICE-IDLE | User speaks / presses record | STATE-WF-VOICE-RECORDING | — |
| STATE-WF-VOICE-RECORDING | VAD detects silence / user stops | STATE-WF-VOICE-TRANSCRIBING | — |
| STATE-WF-VOICE-TRANSCRIBING | STT returns text | STATE-WF-VOICE-CLASSIFYING | — |
| STATE-WF-VOICE-CLASSIFYING | Intent classified | STATE-WF-VOICE-EXECUTING | GATE-SAFETY |
| STATE-WF-VOICE-EXECUTING | Code generated | STATE-WF-VOICE-DISPLAYING | — |
| STATE-WF-VOICE-DISPLAYING | User accepts/rejects | STATE-WF-VOICE-IDLE | — |

**GATE-SAFETY:** `sandbox.rs` blocks dangerous commands (rm -rf, force-push, drop database). Risk levels: Safe, Low, Medium, High, Critical. High/Critical blocked by default.

### WF-AGENT-ORCHESTRATION — Multi-Agent

| State | Trigger | Next State |
|-------|---------|-----------|
| STATE-WF-AGENT-IDLE | User submits task | STATE-WF-AGENT-SELECTING |
| STATE-WF-AGENT-SELECTING | Strategy selected | STATE-WF-AGENT-DISPATCHING |
| STATE-WF-AGENT-DISPATCHING | Agents invoked | STATE-WF-AGENT-STREAMING |
| STATE-WF-AGENT-STREAMING | Responses collected | STATE-WF-AGENT-VALIDATING |
| STATE-WF-AGENT-VALIDATING | Hallucination check passes | STATE-WF-AGENT-PRESENTING |
| STATE-WF-AGENT-PRESENTING | User reviews | STATE-WF-AGENT-IDLE |

---

## 7. Security

### Encryption
- **At rest:** AES-GCM encryption for sensitive data (`encryption.rs`)
- **Key derivation:** Argon2 password hashing (`argon2` crate)
- **Key storage:** Platform keychain via Tauri secure store

### Input Validation
- **Web:** Zod schemas (`api-schemas.ts`)
- **Desktop:** Rust type system + regex validation (`validation.rs`)
- **Mobile:** TypeScript types + runtime validation

### Authentication
- **Provider:** Supabase Auth (email + OAuth)
- **Session:** JWT tokens with httpOnly cookies
- **RLS:** Row-Level Security on all Supabase tables

### Safety Gates
- **Command sandbox:** `sandbox.rs` — risk classification for code execution
- **Hallucination detection:** `recitation_validator.rs` (Rust), `hallucinationDetection.service.ts` (Web)
- **Prompt security:** `promptSecurity.service.ts` — injection prevention
- **CSRF:** `csrf.ts` — token-based CSRF protection

### Threat Model
| Threat | Mitigation | REQ |
|--------|-----------|-----|
| Prompt injection | Prompt sanitization, safety eval tests | REQ-SEC-0004 |
| Hallucinated code execution | Recitation validator, sandbox gate | REQ-CODE-0007, REQ-CODE-0009 |
| Unauthorized data access | Supabase RLS, JWT auth | REQ-AUTH-0001 |
| Malicious voice commands | Command risk classification, dangerous pattern regex | REQ-CODE-0007 |
| XSS/CSRF | Input validation, CSRF tokens, CSP headers | REQ-SEC-0005, REQ-SEC-0006 |

---

## 8. DevOps & CI/CD

### CI Pipeline (`.github/workflows/ci.yml`)

| Job | Quality Gates | Status |
|-----|--------------|--------|
| web | type-check → lint → build → bundle budget → security audit → tests → safety eval → E2E | ACTIVE |
| desktop-rust | cargo check → clippy → unit tests → integration tests → release build | ACTIVE |
| desktop-frontend | tsc --noEmit (allows failures) | ACTIVE (WARN) |
| mobile | tsc → eslint → jest with coverage | ACTIVE |

### Observability
- **Logging:** Structured logging via `tracing` (Rust), console (TypeScript)
- **Performance:** Latency tracking in streaming engine
- **Memory:** Memory stats and leak detection commands
- **Cache:** LRU cache with stats reporting

### Release Strategy
- **Desktop:** Tauri build → platform installers (Windows .msi, macOS .dmg, Linux .AppImage)
- **Web:** Vite build → Vercel deployment
- **Mobile:** EAS Build → App Store / Play Store
- **Extension:** VS Code Marketplace packaging

---

## 9. Testing Strategy

| Surface | Framework | Type | Coverage Target |
|---------|-----------|------|----------------|
| Desktop Backend | cargo test | Unit + Integration | 453 tests passing |
| Web App | Vitest | Unit | ≥80% statements |
| Web App | Playwright | E2E | Smoke + critical flows |
| Mobile App | Jest | Unit | ≥80% statements, ≥75% branches |
| API Server | — | — | GAP-0004: No tests yet |

### Safety Evaluation Tests
- `hallucinationDetection.service.test.ts` — LLM output validation
- `promptSecurity.service.test.ts` — Prompt injection prevention
- `safety-eval.redteam.test.ts` — Red team attack scenarios

---

*All blueprint entries link to REQ + TASK + traceability row. No orphan interfaces.*