# VoiceCode Traceability Matrix

> Version: 2.0.0 | Updated: 2026-02-27 | DICE v3.6

## REQ → MOD → TASK → TEST → FLOW → SCR Mapping

### Voice & STT (REQ-VOICE-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-VOICE-0001 | Multi-provider STT | MOD-STT | TASK-VOICE-0001, TASK-VOICE-0002 | TEST-STT-PROVIDERS (cargo test) | FLOW-VOICE-RECORD | SCR-DESK-MAIN, SCR-WEB-TRANSCRIBE, SCR-MOB-RECORD | DONE |
| REQ-VOICE-0002 | Streaming ≤450ms | MOD-STREAMING | TASK-VOICE-0003 | TEST-STT-LATENCY (cargo test) | FLOW-VOICE-RECORD | SCR-DESK-MAIN | DONE |
| REQ-VOICE-0003 | VAD | MOD-STREAMING | TASK-VOICE-0004 | TEST-STT-VAD (cargo test) | FLOW-VOICE-RECORD | SCR-DESK-MAIN | DONE |
| REQ-VOICE-0004 | Context vocab boost | MOD-STT, MOD-STREAMING | TASK-VOICE-0005 | TEST-STT-VOCAB (cargo test) | FLOW-VOICE-RECORD | SCR-DESK-MAIN | DONE |
| REQ-VOICE-0005 | 3 streaming modes | MOD-STREAMING | TASK-VOICE-0003 | TEST-STT-MODES (cargo test) | FLOW-VOICE-RECORD | SCR-DESK-MAIN | DONE |
| REQ-VOICE-0006 | Audio visualization | MOD-STREAMING, MOD-DESKTOP-FE | TASK-VOICE-0004 | TEST-AUDIO-VIZ (cargo test) | FLOW-VOICE-RECORD | SCR-DESK-MAIN | DONE |

### Code Intelligence (REQ-CODE-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-CODE-0001 | AST 21 languages | MOD-CODE-INTEL | TASK-CODE-0001 | TEST-AST (cargo test) | FLOW-VOICE-CODE | SCR-DESK-CODING | DONE |
| REQ-CODE-0002 | Symbol resolution | MOD-CODE-INTEL | TASK-CODE-0002 | TEST-SYMBOLS (cargo test) | FLOW-VOICE-CODE | SCR-DESK-CODING | DONE |
| REQ-CODE-0003 | NL→VoiceCommand | MOD-CODE-INTEL | TASK-CODE-0003 | TEST-GRAMMAR (cargo test) | FLOW-VOICE-CODE | SCR-DESK-CODING | DONE |
| REQ-CODE-0004 | Intent classification | MOD-CODE-INTEL | TASK-CODE-0004 | TEST-INTENT (cargo test) | FLOW-VOICE-CODE | SCR-DESK-CODING | DONE |
| REQ-CODE-0005 | Token budget | MOD-CODE-INTEL | TASK-CODE-0005 | TEST-BUDGET (cargo test) | FLOW-VOICE-CODE | SCR-DESK-CODING | DONE |
| REQ-CODE-0006 | Anti-hallucination | MOD-CODE-INTEL | TASK-CODE-0006 | TEST-PROMPTS (cargo test) | FLOW-VOICE-CODE | SCR-DESK-CODING | DONE |
| REQ-CODE-0007 | Sandbox safety | MOD-CODE-INTEL | TASK-CODE-0007 | TEST-SANDBOX (cargo test) | FLOW-VOICE-CODE | SCR-DESK-CODING | DONE |
| REQ-CODE-0008 | Multi-LLM client | MOD-CODE-INTEL | TASK-CODE-0008 | TEST-LLM (cargo test) | FLOW-VOICE-CODE | SCR-DESK-CODING | DONE |
| REQ-CODE-0009 | Recitation detection | MOD-CODE-INTEL | TASK-CODE-0009 | TEST-RECITATION (cargo test) | FLOW-VOICE-CODE | SCR-DESK-CODING | DONE |

### Multi-Agent (REQ-AGENT-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-AGENT-0001 | 5 strategies | MOD-CLI | TASK-AGENT-0001 | TEST-ORCH (cargo test) | — | SCR-DESK-AGENTS | DONE |
| REQ-AGENT-0002 | External agents | MOD-CLI | TASK-AGENT-0002 | TEST-EXT-AGENTS (cargo test) | — | SCR-DESK-AGENTS | DONE |
| REQ-AGENT-0003 | Agent registry | MOD-CLI | TASK-AGENT-0003 | TEST-REGISTRY (cargo test) | — | SCR-DESK-AGENTS | DONE |
| REQ-AGENT-0004 | Validation | MOD-CLI | TASK-AGENT-0004 | TEST-VALIDATION (cargo test) | — | SCR-DESK-AGENTS | DONE |
| REQ-AGENT-0005 | Streaming parser | MOD-CLI | TASK-AGENT-0005 | TEST-STREAM-PARSE (cargo test) | — | SCR-DESK-AGENTS | DONE |

### Vision (REQ-VISION-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-VISION-0001 | Screen capture | MOD-VISION | TASK-VISION-0001 | TEST-CAPTURE (cargo test) | — | SCR-DESK-VISION | DONE |
| REQ-VISION-0002 | 3-tier OCR | MOD-VISION | TASK-VISION-0001 | TEST-OCR (cargo test) | — | SCR-DESK-VISION | DONE |
| REQ-VISION-0003 | Computer use | MOD-VISION | TASK-VISION-0002 | TEST-CU (cargo test) | — | SCR-DESK-VISION | DONE |
| REQ-VISION-0004 | Browser automation | MOD-VISION | TASK-VISION-0003 | TEST-BROWSER (cargo test) | — | SCR-DESK-VISION | DONE |

### Desktop (REQ-DESKTOP-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-DESKTOP-0001 | 5 panels | MOD-DESKTOP-FE | TASK-WEB-0001 | TEST-PANELS (vitest) | — | SCR-DESK-* | DONE |
| REQ-DESKTOP-0002 | AI text processing | MOD-DESKTOP-FE | TASK-WEB-0001 | TEST-AI-FE (vitest) | FLOW-AI-ANALYZE | SCR-DESK-AI | DONE |
| REQ-DESKTOP-0003 | Memory/cache mgmt | MOD-DESKTOP-BE | — | TEST-MEM (cargo test) | — | — | DONE |
| REQ-DESKTOP-0004 | Structured logging | MOD-DESKTOP-BE | — | TEST-LOG (cargo test) | — | — | DONE |
| REQ-DESKTOP-0005 | Encryption | MOD-DESKTOP-BE | — | TEST-ENCRYPT (cargo test) | — | — | DONE |

### Web (REQ-WEB-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-WEB-0001 | Landing page | MOD-WEB | TASK-WEB-0001 | TEST-LANDING (vitest) | — | SCR-WEB-LANDING | DONE |
| REQ-WEB-0002 | Dashboard | MOD-WEB | TASK-WEB-0001 | TEST-DASH (vitest) | — | SCR-WEB-DASHBOARD | DONE |
| REQ-WEB-0003 | Settings | MOD-WEB | TASK-WEB-0002 | TEST-SETTINGS (vitest) | — | SCR-WEB-SETTINGS | DONE |
| REQ-WEB-0004 | Analytics | MOD-WEB | TASK-WEB-0002 | TEST-ANALYTICS (vitest) | — | SCR-WEB-ANALYTICS | DONE |
| REQ-WEB-0005 | Medical mode | MOD-WEB | TASK-WEB-0002 | TEST-MEDICAL (vitest) | FLOW-VOICE-RECORD | SCR-WEB-MEDICAL-DICTATION | DONE |
| REQ-WEB-0006 | Monitoring | MOD-WEB | TASK-WEB-0002 | TEST-MONITOR (vitest) | — | — | DONE |
| REQ-WEB-0007 | Transcript editor | MOD-WEB | TASK-WEB-0002 | TEST-EDITOR (vitest) | FLOW-AI-ANALYZE | SCR-WEB-EDITOR | DONE |

### Mobile (REQ-MOBILE-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-MOBILE-0001 | Home + navigation | MOD-MOBILE | — | TEST-MOB-NAV (jest) | — | SCR-MOB-HOME | DONE |
| REQ-MOBILE-0002 | Audio recording | MOD-MOBILE | — | TEST-MOB-AUDIO (jest) | FLOW-VOICE-RECORD | SCR-MOB-RECORD | DONE |
| REQ-MOBILE-0003 | Transcription | MOD-MOBILE | — | TEST-MOB-TRANS (jest) | FLOW-VOICE-RECORD | SCR-MOB-TRANSCRIPTION | DONE |
| REQ-MOBILE-0004 | Settings + auth | MOD-MOBILE | — | TEST-MOB-SETTINGS (jest) | FLOW-AUTH | SCR-MOB-SETTINGS | DONE |
| REQ-MOBILE-0005 | Stripe payment | MOD-MOBILE | TASK-MOBILE-0003 | TEST-MOB-PAY (jest) | FLOW-PAYMENT | SCR-MOB-PRICING | TODO |

### Auth (REQ-AUTH-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-AUTH-0001 | Supabase auth | MOD-WEB, MOD-SUPABASE | — | TEST-AUTH (vitest) | FLOW-AUTH | SCR-WEB-LOGIN | DONE |
| REQ-AUTH-0002 | Signup + profile | MOD-WEB, MOD-SUPABASE | — | TEST-SIGNUP (vitest) | FLOW-AUTH | SCR-WEB-SIGNUP | DONE |

### Payments (REQ-PAY-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-PAY-0001 | Checkout session | MOD-SUPABASE | TASK-DB-0006 | TEST-PAY-CHECKOUT | FLOW-PAYMENT | SCR-WEB-PRICING | DONE |
| REQ-PAY-0002 | Payment intent | MOD-SUPABASE | TASK-DB-0006 | TEST-PAY-INTENT | FLOW-PAYMENT | — | DONE |
| REQ-PAY-0003 | Customer portal | MOD-SUPABASE | TASK-DB-0006 | TEST-PAY-PORTAL | FLOW-PAYMENT | — | DONE |
| REQ-PAY-0004 | Webhook processing | MOD-SUPABASE | TASK-DB-0006 | TEST-PAY-WEBHOOK | FLOW-PAYMENT | — | DONE |

### Security (REQ-SEC-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-SEC-0001 | Security dashboard | MOD-WEB | TASK-WEB-0002 | TEST-SEC-DASH (vitest) | — | — | DONE |
| REQ-SEC-0002 | AES-GCM + Argon2 | MOD-DESKTOP-BE | — | TEST-ENCRYPT (cargo test) | — | — | DONE |
| REQ-SEC-0003 | Hallucination detect | MOD-WEB | TASK-WEB-0004 | TEST-HALLUCINATE (vitest) | — | — | DONE |
| REQ-SEC-0004 | Prompt security | MOD-WEB | TASK-WEB-0005 | TEST-PROMPT-SEC (vitest) | — | — | DONE |
| REQ-SEC-0005 | CSRF protection | MOD-WEB | TASK-WEB-0002 | TEST-CSRF (vitest) | — | — | DONE |
| REQ-SEC-0006 | Zod validation | MOD-WEB | TASK-WEB-0002 | TEST-ZOD (vitest) | — | — | DONE |

### Database (REQ-DB-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-DB-0001 | Profiles + RLS | MOD-SUPABASE | TASK-DB-0001 | TEST-DB-PROFILES | — | — | DONE |
| REQ-DB-0002 | Subscriptions | MOD-SUPABASE | TASK-DB-0002 | TEST-DB-SUBS | — | — | DONE |
| REQ-DB-0003 | Realtime sessions | MOD-SUPABASE | TASK-DB-0005 | TEST-DB-RT | — | — | DONE |
| REQ-DB-0004 | AI feature tables | MOD-SUPABASE | TASK-DB-0005 | TEST-DB-AI | — | — | DONE |

### CI/CD (REQ-CI-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-CI-0001 | CI with 4 jobs | MOD-INFRA | TASK-CI-0002 | TEST-CI-PIPELINE | — | — | TODO (GAP-CI) |
| REQ-CI-0002 | Bundle budget | MOD-INFRA | — | TEST-BUNDLE | — | — | DONE |
| REQ-CI-0003 | Security audit | MOD-INFRA | — | TEST-AUDIT | — | — | DONE |
| REQ-CI-0004 | Safety evals | MOD-INFRA | — | TEST-SAFETY | — | — | DONE |

### API (REQ-API-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-API-0001 | Alert endpoint | MOD-API | TASK-API-0001 | TEST-API-ALERTS (vitest, 12 tests) | — | — | DONE |
| REQ-API-0002 | Health check | MOD-API | TASK-API-0001 | TEST-API-HEALTH (vitest) | — | — | DONE |

### Notifications (REQ-NOTIF-*)

| REQ | Requirement | MOD | TASK | TEST | FLOW | SCR | Status |
|-----|------------|-----|------|------|------|-----|--------|
| REQ-NOTIF-0001 | Push notifications | MOD-SUPABASE | TASK-DB-0006 | TEST-PUSH | — | — | DONE |

## Orphan Check

### SHIP-SCOPE Orphans (REQs without full coverage)
| REQ | Missing | GAP |
|-----|---------|-----|
| REQ-CI-0001 | CI workflow broken, TASK pending | GAP-CI |
| REQ-MOBILE-0005 | Payment not implemented | GAP — TASK-MOBILE-0003 |

### DEFERRED Orphans (Acceptable — not in SHIP-SCOPE)
- PROPOSED-EMPTY-SVC: ai-processor, voice-engine have no REQs (empty shells)
- PROPOSED-SHARED-PKG: shared packages have no REQs (empty)
- PROPOSED-INFRA: Docker/cloud infra has no REQs
- PROPOSED-EXT-MERGE: Extension consolidation has no REQs

All SHIP-SCOPE orphans have associated GAPs and TASKs.
