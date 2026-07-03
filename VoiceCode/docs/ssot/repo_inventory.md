# VoiceCode Repository Inventory

> Generated: 2026-02-26 | DICE v3.6 Step 1 | Lossless Inventory

## 1. Repository Structure

| Property | Value |
|----------|-------|
| Root | Git monorepo at `VoiceCode/` |
| Package manager | npm workspaces. ⚠️ Also pnpm-workspace.yaml + yarn.lock (GAP-3PM) |
| Build system | Turborepo (turbo.json) |
| Workspaces | `apps/*`, `packages/*` |
| Node | ≥18 |
| Default branch | master |

## 2. Code Areas

### 2.1 apps/api/ — Express Alert Proxy
- Entry: server.ts (port 3001)
- Routes: GET /health, POST /api/alerts/{email,slack,webhook,test}
- Tests: server.test.ts (12 tests, Vitest+Supertest)
- ⚠️ No auth. ⚠️ SSRF on /api/alerts/webhook

### 2.2 apps/desktop/ — Tauri Desktop App (PRIMARY)
**Rust** (src-tauri/src/): 80+ .rs files, 110+ commands, 453 tests
- Modules: coding_agent, streaming, screen_context, code_intelligence(30), cli(18), vision(6), stt(5), integrations(8), file_tagging(3)
- CLI: voicecode binary (REPL + 11 subcommands)
- Events: voice-status, speech-transcript, voice-response, audio-metrics, streaming-event

**React** (src/): SPA panel architecture, no router
- 15+ components, 19 services, 16 hooks, Zustand state, 2 test files
- Config: Tauri 1.8, React 18, TS strict, Vite

### 2.3 apps/web/ — Vite React Web App
- Entry: src/main.tsx, React Router v6, 37 routes (8 public + 29 protected)
- 39 services (32+7 security), 23 hooks, 5 contexts
- 15 unit tests, 4 E2E (Playwright), 2 integration
- UI: Radix + Tailwind + shadcn/ui

### 2.4 apps/mobile/ — Expo React Native App
- Expo 52, RN 0.76.5, 150+ screens, 13 navigators
- 45+ services, 16 hooks, 4 contexts
- 100+ screen tests, 90+ service tests, 16 E2E, 22 integration
- Redux Toolkit + Persist, Stripe RN

### 2.5 services/agent-core/ — FastAPI+LangGraph
- Python 3.12, port 8000, 7 REST + 1 WS
- 5 specialized agents, 35 tools (6 categories)
- RAG: LlamaIndex+pgvector, hybrid search
- 8 unit + 5 integration tests
- Docker + docker-compose (+ Redis)
- ⚠️ ALL tools return MOCK data

### 2.6 services/ai-processor/ — EMPTY SHELL
### 2.7 services/voice-engine/ — EMPTY SHELL

### 2.8 supabase/ — Database
- 12 migrations, 10 tables, 3 SQL functions, 2 triggers
- 5 edge functions (Stripe checkout/payments/portal/webhook, push notifications)
- Full RLS on all tables

### 2.9 extensions/voiceflow-vscode/ — VS Code Extension (Feature-rich)
- 15 commands, 28 LM tools, chat participant, 30+ service files

### 2.10 extensions/vscode/ — VS Code Extension (Agent-focused)
- 52 commands, 7 LM tools, 17 agent files, MCP support

### 2.11 Shared Packages — Mostly EMPTY
- shared/, shared-types/, shared-utils/: EMPTY
- shared-ui/: 6 agent UI components only

### 2.12 Infrastructure — Skeletal
- infrastructure/docker/: EMPTY
- Platform packaging dirs: empty scripts
- Only agent-core has working Dockerfile

### 2.13 Scripts
- scripts/run_gates.sh: 14 quality gates
- scripts/run_gates.ps1: PowerShell version

## 3. Entry Points

### API Endpoints
| Service | Port | Routes | Auth |
|---------|------|--------|------|
| apps/api | 3001 | 5 | None |
| agent-core | 8000 | 7+1WS | JWT planned |
| supabase | Edge | 5 | JWT+Stripe |

### UI
| Platform | Entry | Screens | State |
|----------|-------|---------|-------|
| Web | main.tsx | 37 routes | Context |
| Desktop | App.tsx | 8 panels | Zustand |
| Mobile | App.tsx | 150+ | Redux |

### CLI
| Binary | Location | Commands |
|--------|----------|----------|
| voicecode | src-tauri/src/bin/voicecode.rs | REPL+11 subcommands |

## 4. CI/CD
| Workflow | Status |
|----------|--------|
| ci.yml | ⚠️ BROKEN — legacy paths |
| ui-e2e.yml | ⚠️ BROKEN — legacy paths |
| Integration/deploy jobs | PLACEHOLDER (echo only) |
| Performance tests | BYPASSED (|| echo) |

## 5. UI/UX Artifacts
No Figma, mockups, wireframes, or screenshots found.
- Web: Tailwind+Radix+shadcn/ui
- Desktop: Catppuccin dark, BEM CSS
- Mobile: Expo, custom components

## 6. Documentation
| Path | Purpose |
|------|---------|
| docs/ssot/*.md (9) | SSOT, Master Plan, health, traceability, deps, etc. |
| docs/contracts/*.md (4) | Domain models, events, RBAC, UI contracts |
| docs/archive/ | 250+ archived legacy docs |
| CLAUDE.md | AI agent project guide |
| README.md | Project overview |

## 7. Standalone Projects
| Path | Status |
|------|--------|
| VoiceCodeMobile/ | Scaffold, 5 screens, mostly empty |
| ui-e2e-work/ | Separate git repo |
| VoiceCode_Backup_*/ | Gitignored backup |

## 8. Gaps
| ID | Description | Severity |
|----|-------------|----------|
| GAP-CI | CI references non-existent legacy paths | CRITICAL |
| GAP-EMPTY-SVC | ai-processor, voice-engine empty | HIGH |
| GAP-MOCK | agent-core tools return mock data | HIGH |
| GAP-SSRF | webhook endpoint accepts arbitrary URLs | HIGH |
| GAP-AUTH-API | Alert API has no auth | HIGH |
| GAP-EMPTY-PKG | shared packages empty | MEDIUM |
| GAP-INFRA | No cloud/Docker infra | MEDIUM |
| GAP-WIREFRAMES | No design artifacts | MEDIUM |
| GAP-2EXT | Two overlapping VS Code extensions | MEDIUM |
| GAP-3PM | Three package managers | LOW |
