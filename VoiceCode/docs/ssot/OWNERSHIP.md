# VoiceCode Module Registry & Ownership

> DICE v3.6 Step 3 | Parallel-Agent Safety Boundaries
> Generated: 2026-02-26

## Purpose

This document defines exclusive write boundaries for each module. When multiple agents work in parallel, each agent MUST only write to its owned folders. Changes outside allowed paths require explicit coordination via contract freeze gates.

## Module Registry

### MOD-DESKTOP-BE — Desktop Rust Backend

| Property | Value |
|----------|-------|
| Purpose | Tauri Rust backend: voice processing, code intelligence, CLI, vision, STT |
| Owned folders (exclusive write) | `apps/desktop/src-tauri/src/`, `apps/desktop/src-tauri/Cargo.toml`, `apps/desktop/src-tauri/tests/` |
| Owned models | `StreamingEvent`, `VoiceCommand`, `CodingCommand`, `ScreenContext`, `AgentState` (Rust) |
| Exposed contracts | 110+ `#[tauri::command]` IPC functions, 7 Tauri events |
| Dependencies | MOD-DESKTOP-FE (IPC consumer), MOD-STT (providers) |
| Allowed calls | Tauri emit, filesystem, HTTP to external APIs |
| Tests | `cargo test --release --lib` (453 tests) |

### MOD-DESKTOP-FE — Desktop React Frontend

| Property | Value |
|----------|-------|
| Purpose | Tauri React frontend: panels, dictation, settings |
| Owned folders (exclusive write) | `apps/desktop/src/`, `apps/desktop/package.json`, `apps/desktop/vite.config.ts`, `apps/desktop/vitest.config.ts`, `apps/desktop/tsconfig.json` |
| Owned models | `SettingsConfig`, `VoiceRecordingState`, `ProfessionalMode` (TypeScript) |
| Exposed contracts | None (leaf consumer) |
| Dependencies | MOD-DESKTOP-BE (IPC provider), MOD-SUPABASE (auth/data) |
| Shared folders (read-only) | `packages/shared-ui/` |
| Tests | `npm run test` (Vitest) |

### MOD-WEB — Web Application

| Property | Value |
|----------|-------|
| Purpose | Vite React web app: 37 routes, full-featured SPA |
| Owned folders (exclusive write) | `apps/web/src/`, `apps/web/e2e/`, `apps/web/tests/`, `apps/web/package.json`, `apps/web/vite.config.ts` |
| Owned models | Web-specific types in `src/types/` |
| Exposed contracts | None (leaf consumer) |
| Dependencies | MOD-SUPABASE (auth/data), MOD-AGENT-CORE (AI API) |
| Shared folders (read-only) | `packages/shared-ui/`, `packages/shared-types/` |
| Tests | `npm run test` (Vitest), `npx playwright test` (E2E) |

### MOD-MOBILE — Mobile Application

| Property | Value |
|----------|-------|
| Purpose | Expo React Native app: 150+ screens, 13 navigators |
| Owned folders (exclusive write) | `apps/mobile/src/`, `apps/mobile/__tests__/`, `apps/mobile/package.json`, `apps/mobile/app.json` |
| Owned models | Mobile-specific types in `src/types/` |
| Exposed contracts | None (leaf consumer) |
| Dependencies | MOD-SUPABASE (auth/data), MOD-AGENT-CORE (AI API) |
| Shared folders (read-only) | `packages/shared-ui/`, `packages/shared-types/` |
| Tests | `npm test` (Jest) |

### MOD-AGENT-CORE — Agent Orchestration Service

| Property | Value |
|----------|-------|
| Purpose | FastAPI + LangGraph: 5 agents, 35 tools, RAG, WebSocket |
| Owned folders (exclusive write) | `services/agent-core/src/`, `services/agent-core/tests/`, `services/agent-core/requirements.txt`, `services/agent-core/pyproject.toml` |
| Owned models | `AgentState`, `AgentType`, `Intent`, `UserContext`, `ToolCall`, `ToolResult`, `ChatRequest`, `ChatResponse` |
| Exposed contracts | REST: `/api/v1/agent/*`, WS: `/ws/agent/{session_id}` |
| Dependencies | MOD-SUPABASE (data), OpenAI/Anthropic (LLM), pgvector (RAG) |
| Tests | `pytest` (8 unit + 5 integration) |

### MOD-API — Alert Proxy Service

| Property | Value |
|----------|-------|
| Purpose | Express alert proxy: email, Slack, webhook forwarding |
| Owned folders (exclusive write) | `apps/api/server.ts`, `apps/api/server.test.ts`, `apps/api/package.json`, `apps/api/tsconfig.json` |
| Owned models | None (stateless) |
| Exposed contracts | REST: `/health`, `/api/alerts/*` |
| Dependencies | None |
| Tests | `npm test` (Vitest, 12 tests) |

### MOD-SUPABASE — Database & Edge Functions

| Property | Value |
|----------|-------|
| Purpose | PostgreSQL schema, RLS, edge functions (Stripe, push) |
| Owned folders (exclusive write) | `supabase/migrations/`, `supabase/functions/`, `supabase/config.toml` |
| Owned models | All DB tables: profiles, subscriptions, payments, transcripts, real_time_sessions, streaming_transcripts, live_suggestions, action_items, contextual_insights, context_analyses, push_subscriptions |
| Exposed contracts | Supabase client API, Edge function endpoints |
| Dependencies | Stripe API, Web Push |
| Tests | Edge function tests (TBD) |

### MOD-EXT-VSCODE — VS Code Extension (voiceflow-vscode)

| Property | Value |
|----------|-------|
| Purpose | Feature-rich VS Code extension: 15 commands, 28 LM tools, chat |
| Owned folders (exclusive write) | `extensions/voiceflow-vscode/` |
| Dependencies | MOD-SUPABASE, MOD-AGENT-CORE |
| Tests | `vitest run` |

### MOD-EXT-VSCODE2 — VS Code Extension (vscode)

| Property | Value |
|----------|-------|
| Purpose | Agent-focused VS Code extension: 52 commands, MCP, orchestration |
| Owned folders (exclusive write) | `extensions/vscode/` |
| Dependencies | MOD-AGENT-CORE |

### MOD-SHARED — Shared Packages

| Property | Value |
|----------|-------|
| Purpose | Shared types, UI components, utilities |
| Owned folders (exclusive write) | `packages/shared/`, `packages/shared-types/`, `packages/shared-ui/`, `packages/shared-utils/` |
| Exposed contracts | Shared types, shared UI components |
| Status | ⚠️ Mostly empty (GAP-EMPTY-PKG) |

### MOD-INFRA — Infrastructure & CI/CD

| Property | Value |
|----------|-------|
| Purpose | Docker, CI/CD, platform packaging, scripts |
| Owned folders (exclusive write) | `infrastructure/`, `.github/workflows/`, `scripts/`, `turbo.json`, root `package.json` |
| Dependencies | All modules (CI builds all) |
| Status | ⚠️ CI broken (GAP-CI), Docker empty (GAP-INFRA) |

### MOD-DOCS — Documentation

| Property | Value |
|----------|-------|
| Purpose | SSOT, contracts, archives, project docs |
| Owned folders (exclusive write) | `docs/`, `CLAUDE.md`, `README.md` |
| Dependencies | All modules (documents all) |


## Ownership Matrix

| Module | Exclusive Write Paths | Read-Only Shared |
|--------|----------------------|------------------|
| MOD-DESKTOP-BE | `apps/desktop/src-tauri/` | — |
| MOD-DESKTOP-FE | `apps/desktop/src/`, `apps/desktop/*.{json,ts}` | `packages/shared-ui/` |
| MOD-WEB | `apps/web/` | `packages/shared-*` |
| MOD-MOBILE | `apps/mobile/` | `packages/shared-*` |
| MOD-AGENT-CORE | `services/agent-core/` | — |
| MOD-API | `apps/api/` | — |
| MOD-SUPABASE | `supabase/` | — |
| MOD-EXT-VSCODE | `extensions/voiceflow-vscode/` | — |
| MOD-EXT-VSCODE2 | `extensions/vscode/` | — |
| MOD-SHARED | `packages/` | — |
| MOD-INFRA | `infrastructure/`, `.github/`, `scripts/`, root configs | — |
| MOD-DOCS | `docs/`, `*.md` at root | — |

## Contract Freeze Gates

### GATE-CONTRACT-FREEZE — Pre-Parallel Build Gate

Before any parallel UI build (MOD-WEB, MOD-MOBILE, MOD-DESKTOP-FE working simultaneously):

1. **API contracts frozen**: `docs/contracts/` files must be reviewed and versioned
2. **DB schema frozen**: No pending migrations in `supabase/migrations/`
3. **Shared types frozen**: `packages/shared-types/` exports must be stable
4. **IPC contracts frozen**: `#[tauri::command]` signatures in MOD-DESKTOP-BE must be stable

**Verification command**:
```bash
# Check no uncommitted contract changes
git diff --name-only docs/contracts/ supabase/migrations/ packages/shared-types/
# Should return empty
```

### GATE-OWNERSHIP-CHECK — CI Policy

Any PR that modifies files outside its module's owned folders MUST:
1. Be explicitly flagged in PR description
2. Reference the contract or shared resource being modified
3. Get approval from the owning module's maintainer

## Parallel Lane Definitions

### Lane A: Desktop (MOD-DESKTOP-BE + MOD-DESKTOP-FE)
- Can work independently after GATE-CONTRACT-FREEZE
- IPC boundary is internal to lane

### Lane B: Web (MOD-WEB)
- Can work independently after GATE-CONTRACT-FREEZE
- Consumes Supabase + Agent Core APIs

### Lane C: Mobile (MOD-MOBILE)
- Can work independently after GATE-CONTRACT-FREEZE
- Consumes Supabase + Agent Core APIs

### Lane D: Backend (MOD-AGENT-CORE + MOD-API + MOD-SUPABASE)
- Must freeze contracts BEFORE Lanes A/B/C begin
- Can evolve implementation without breaking frozen interfaces

### Lane E: Extensions (MOD-EXT-VSCODE + MOD-EXT-VSCODE2)
- Independent of UI lanes
- Depends on Agent Core API stability