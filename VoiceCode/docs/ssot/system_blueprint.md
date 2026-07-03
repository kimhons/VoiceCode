# VoiceCode System Blueprint

> Version: 2.0.0 | Updated: 2026-02-27 | DICE v3.6 Binder Index

## 1. Architecture Overview

VoiceCode is a multimodal voice-directed coding system deployed across 3 platforms (Desktop, Web, Mobile) with a shared backend layer (Supabase + Agent Core).

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Desktop    │  │    Web      │  │   Mobile    │
│  Tauri+React│  │  Vite+React │  │  Expo+RN    │
│  110+ cmds  │  │  37 routes  │  │  150+ scrns │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
              ┌─────────┴─────────┐
              │    Supabase       │
              │  Auth + DB + RLS  │
              │  5 Edge Functions │
              │  10 Tables        │
              └─────────┬─────────┘
                        │
              ┌─────────┴─────────┐
              │   Agent Core      │
              │  FastAPI+LangGraph│
              │  5 Agents, 35 Tools│
              │  RAG (pgvector)   │
              └───────────────────┘
```

### Platform Responsibilities

| Platform | Primary Use Case | State Mgmt | Key Tech |
|----------|-----------------|------------|----------|
| Desktop | Voice-to-code development | Zustand | Tauri 1.8, Rust, React 18 |
| Web | Transcription, medical, collaboration | React Context | Vite, React Router v6, shadcn/ui |
| Mobile | Recording, review, on-the-go | Redux Toolkit | Expo 52, React Navigation v7 |

## 2. Module Registry Summary

12 modules defined. Full details: [`OWNERSHIP.md`](OWNERSHIP.md)

| Module | Purpose | Status |
|--------|---------|--------|
| MOD-DESKTOP-BE | Tauri Rust backend (110+ commands, 453 tests) | Production |
| MOD-DESKTOP-FE | Desktop React frontend (8 panels) | Production |
| MOD-WEB | Web app (37 routes, 39 services) | Production |
| MOD-MOBILE | Mobile app (150+ screens, 45+ services) | Near-production |
| MOD-AGENT-CORE | FastAPI+LangGraph (5 agents, 35 tools) | Mock-only |
| MOD-API | Express alert proxy (5 routes, 12 tests) | Production |
| MOD-SUPABASE | Database (10 tables, 5 edge functions) | Production |
| MOD-EXT-VSCODE | VS Code extension - feature-rich (28 LM tools) | Beta |
| MOD-EXT-VSCODE2 | VS Code extension - agent-focused (52 commands) | Beta |
| MOD-SHARED | Shared packages | Skeletal |
| MOD-INFRA | CI/CD, Docker, scripts | Broken (GAP-CI) |
| MOD-DOCS | Documentation | Active (DICE v3.6) |

## 3. UI/UX Blueprint Links

Full multimodal blueprint: [`UI-UX-BLUEPRINT.md`](UI-UX-BLUEPRINT.md)

### Shared Flows
| Flow | Purpose | Platforms |
|------|---------|-----------|
| FLOW-VOICE-RECORD | Audio capture → transcript | All |
| FLOW-AI-ANALYZE | AI analysis of transcript | All |
| FLOW-EXPORT | Export to PDF/DOCX/etc | All |
| FLOW-AUTH | User authentication | Web, Mobile |
| FLOW-PAYMENT | Stripe subscription | Web, Mobile, Desktop |
| FLOW-VOICE-CODE | Voice → code action | Desktop only |
| FLOW-COLLABORATION | Real-time team editing | Web, Mobile |

### Screen Counts
| Platform | Key Screens | Total |
|----------|-------------|-------|
| Web | 18 | 37 routes |
| Desktop | 8 | 8 panels |
| Mobile | 15 | 150+ screens |

Wireframes: [`wireframes/INDEX.md`](wireframes/INDEX.md) (WIRE-TBD for all — GAP-WIREFRAMES)

## 4. API & Data Links

### API Contracts
| Service | Spec Location | Routes |
|---------|--------------|--------|
| Alert API | `apps/api/server.ts` | 5 REST |
| Agent Core | `services/agent-core/src/api/main.py` | 7 REST + 1 WS |
| Supabase Edge | `supabase/functions/` | 5 Edge |

### Data Models
Full definitions: [`docs/contracts/domain_models.md`](../contracts/domain_models.md)

Key tables: profiles, subscriptions, payments, transcripts, real_time_sessions, streaming_transcripts, live_suggestions, action_items, contextual_insights, context_analyses

### Events
Event contracts: [`docs/contracts/events.md`](../contracts/events.md)

Key events: voice-status, speech-transcript, voice-response, audio-metrics, streaming-event

## 5. Workflow & State Machine Links

Defined in [`SSOT.md`](SSOT.md) §4:
- WF-VOICE-CODING (6 states + GATE-SAFETY)
- WF-AGENT-ORCHESTRATION (6 states)
- WF-AUTH (3 states)
- WF-PAYMENT (4 states)

## 6. Agent & Tool Summary

### Desktop CLI Agents (MOD-CLI)
5 orchestration strategies: Single, Race, Consensus, Pipeline, Decomposition
External: Claude Code, Aider adapters
Built-in: 17 agent files

### Backend Agents (MOD-AGENT-CORE)
LangGraph StateGraph with 5 specialized agents:
- Supervisor, Transcription, Medical, Productivity, Search
- 35 tools across 6 categories
- ⚠️ All tools return mock data (GAP-MOCK)

## 7. Security Notes

- Supabase RLS on all tables
- AES-GCM encryption + Argon2 hashing (desktop)
- Hallucination detection service (web)
- Prompt security/injection detection (web)
- CSRF protection (web)
- Zod input validation (web)
- Sandbox/safety gate for code execution (desktop)
- ⚠️ Alert API has no auth (GAP-AUTH-API)
- ⚠️ SSRF on webhook endpoint (GAP-SSRF)

RBAC: [`docs/contracts/rbac_matrix.md`](../contracts/rbac_matrix.md)

## 8. DevOps & CI Gates

### Current CI (⚠️ BROKEN — GAP-CI)
Workflows reference legacy paths. See TASK-CI-0002, TASK-CI-0003.

### Quality Gate Script
`scripts/run_gates.sh` — 14 gates:
1. Web: tsc, lint, build, tests, security audit
2. Rust: cargo check, clippy, tests, integration
3. Desktop FE: tsc
4. Mobile: tsc, lint, tests
5. Doc existence checks

### Ownership Enforcement
Policy defined in [`OWNERSHIP.md`](OWNERSHIP.md):
- Each module has exclusive write paths
- Contract freeze gate before parallel UI builds
- 5 parallel lanes defined (Desktop, Web, Mobile, Backend, Extensions)

## 9. Binder Cross-Reference

| Document | Path | Purpose |
|----------|------|---------|
| SSOT | `docs/ssot/SSOT.md` | Requirements, modules, workflows, gaps |
| Master Plan | `docs/ssot/MASTER-IMPLEMENTATION-PLAN.md` | Tasks, waves, verification |
| System Blueprint | `docs/ssot/system_blueprint.md` | This file — binder index |
| UI/UX Blueprint | `docs/ssot/UI-UX-BLUEPRINT.md` | Flows, screens, wireframes |
| Ownership | `docs/ssot/OWNERSHIP.md` | Module boundaries, parallel lanes |
| Traceability | `docs/ssot/traceability_matrix.md` | REQ→TASK→TEST mapping |
| Dependencies | `docs/ssot/dependency_graph.md` | Module dependency graph |
| Build Order | `docs/ssot/build_order_blueprint.md` | Wave execution order |
| Health Metrics | `docs/ssot/health_metrics.md` | Gaps, risks, coverage |
| Repo Inventory | `docs/ssot/repo_inventory.md` | Lossless file inventory |
| Version History | `docs/ssot/version_history.md` | Change log |
| Wireframe Index | `docs/ssot/wireframes/INDEX.md` | Wireframe catalog |
| Domain Models | `docs/contracts/domain_models.md` | Data model definitions |
| Events | `docs/contracts/events.md` | Event contracts |
| RBAC | `docs/contracts/rbac_matrix.md` | Role permissions |
| UI Contracts | `docs/contracts/ui_contracts.md` | Screen/component specs |