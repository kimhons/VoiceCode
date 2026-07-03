# VoiceCode — Repository Inventory (LOSSLESS)

> Generated: 2026-02-26 | Mode: CONSOLIDATE | Blueprint Forge OS™

---

## 1. Detected Mode

**CONSOLIDATE** — Repository contains extensive production code across 4 applications, 3 backend services, 2 VS Code extensions, 4 shared packages, 11 Supabase migrations, and 40+ legacy planning documents.

## 2. Detected Surfaces

| Surface | Evidence | Status |
|---------|----------|--------|
| Desktop UI (Tauri/Rust + React) | `apps/desktop/` — 80+ Tauri commands, 15+ components, 15+ hooks, 20+ services | Production |
| Web UI (React/Vite) | `apps/web/` — 50+ components, 25+ hooks, 30+ services, Playwright E2E | Production |
| Mobile UI (React Native/Expo) | `apps/mobile/` — Foundation only, audio/transcription/payment TODO | Partial (~18%) |
| API (Express) | `apps/api/` — Alerts & notifications server | Production |
| VS Code Extension | `extensions/voiceflow-vscode/` — Voice commands, MCP, code gen | Production |
| Backend: Agent Core (Python) | `services/agent-core/` — LangGraph, 6 agents | Production |
| Backend: AI Processor (Python) | `services/ai-processor/` — AI text processing | Production |
| Backend: Voice Engine (Node.js) | `services/voice-engine/` — Voice processing | Production |
| Database (Supabase/PostgreSQL) | `supabase/` — 11 migrations, 5 edge functions | Production |
| Infrastructure (Docker) | `infrastructure/docker/` — Linux/macOS/Windows packaging | Production |
| CI/CD (GitHub Actions) | `.github/workflows/ci.yml` — 4 jobs, full quality gates | Production |

## 3. Root-Level Legacy Docs (40+ files — consolidation target)

| Path | Purpose |
|------|---------|
| `ANALYSIS_REPORT.md` | Platform analysis report |
| `AQUAVOICE_PARITY_AND_CODING_AGENT_PLAN.md` | AquaVoice feature parity plan |
| `COMPREHENSIVE_COMPETITIVE_ANALYSIS.md` | Competitive landscape |
| `COMPREHENSIVE_TECHNICAL_REVIEW.md` | Technical review |
| `CRITICAL_IMPLEMENTATION_TICKETS.md` | Priority tickets |
| `CRITICAL_TECHNICAL_DEBT_FIXES.md` | Technical debt |
| `CROSS_PLATFORM_OPTIMIZATION_SUMMARY.md` | Cross-platform optimization |
| `DEPLOYMENT_READINESS_SUMMARY.md` | Deployment readiness |
| `DESKTOP_AGENT_CODER_IMPLEMENTATION_PLAN.md` | Desktop agent plan |
| `EXECUTIVE_SUMMARY.md` | Executive summary |
| `IMPLEMENTATION_CHECKLIST.md` | Implementation checklist |
| `IMPLEMENTATION_ROADMAP.md` | Implementation roadmap |
| `IMPLEMENTATION_TASK_LIST.md` | Implementation task list |
| `PAYMENT_INTEGRATION_GUIDE.md` | Payment integration (Part 1) |
| `PAYMENT_INTEGRATION_GUIDE_PART2.md` | Payment integration (Part 2) |
| `PHASE1_MARKETPLACE_LAUNCH_PLAN.md` | Marketplace launch plan |
| `PHASE_3_WEB_APP_COMPLETE.md` | Phase 3 completion (Web) |
| `PHASE_4_DESKTOP_APP_COMPLETE.md` | Phase 4 completion (Desktop) |
| `PHASE_5_DOCUMENTATION_COMPLETE.md` | Phase 5 completion (Docs) |
| `PRIORITIZED_TASK_LIST.md` | Prioritized tasks |
| `REBRANDING_COMPLETE_95_PERCENT.md` | Rebranding status |
| `TELEMETRY_IMPLEMENTATION.md` | Telemetry implementation |
| `WEB_APP_LAUNCH_CHECKLIST.md` | Web app launch checklist |

## 4. Inner VoiceCode/ Docs

| Path | Purpose |
|------|---------|
| `CLAUDE.md` | Architecture overview (SSOT candidate) |
| `MOBILE_APP_ACTION_PLAN.md` | Mobile app action plan |
| `MOBILE_APP_IMPLEMENTATION_REPORT.md` | Mobile implementation report |
| `POST_INTEGRATION_CHECKLIST.md` | Post-integration checklist |
| `QUICK_START.md` | Quick start guide |
| `VSCODE_EXTENSION_ENHANCEMENT_PLAN.md` | VSCode extension plan |
| `docs/AGENT_UI_INTEGRATION_STRATEGY.md` | Agent UI integration |
| `docs/ARCHITECTURE_UPGRADE_STATUS.md` | Architecture upgrade |
| `docs/VISION_ARCHITECTURE.md` | Vision system architecture |

## 5. Key Code Areas

| Area | Path | Tech | Scale |
|------|------|------|-------|
| Desktop Frontend | `apps/desktop/src/` | React 18, TS, Zustand | 15+ components, 15+ hooks |
| Desktop Backend | `apps/desktop/src-tauri/src/` | Rust 1.72+, Tauri 1.8 | 80+ modules |
| Code Intelligence | `apps/desktop/src-tauri/src/code_intelligence/` | Rust, tree-sitter | 35+ files |
| Vision System | `apps/desktop/src-tauri/src/vision/` | Rust, OCR | 8 files |
| CLI/Agent System | `apps/desktop/src-tauri/src/cli/` | Rust, multi-agent | 15+ files |
| STT System | `apps/desktop/src-tauri/src/stt/` | Rust, Deepgram/Whisper | 5+ files |
| Web App | `apps/web/src/` | React 18.3, Vite 6, Tailwind | 50+ components, 30+ services |
| Mobile App | `apps/mobile/` | RN 0.76.5, Expo 52 | Foundation only |
| API Server | `apps/api/` | Express 4.18, TS | Alerts/notifications |
| VSCode Extension | `extensions/voiceflow-vscode/` | TS, VS Code API | Voice, MCP |
| Agent Core | `services/agent-core/` | Python, LangGraph | 6 agents |
| Supabase | `supabase/` | PostgreSQL, Edge Functions | 11 migrations, 5 functions |
| Shared Packages | `packages/` | TypeScript | types, ui, utils |

## 6. Entry Points

| Surface | Entry Point |
|---------|-------------|
| Desktop Frontend | `apps/desktop/src/main.tsx` |
| Desktop Backend | `apps/desktop/src-tauri/src/main.rs` |
| Desktop CLI | `apps/desktop/src-tauri/src/bin/voicecode.rs` |
| Web App | `apps/web/src/main.tsx` |
| Mobile App | `apps/mobile/index.ts` |
| API Server | `apps/api/server.ts` |
| VSCode Extension | `extensions/voiceflow-vscode/src/` |

## 7. Database Schema (11 Supabase Migrations)

| Migration | Table/Function |
|-----------|---------------|
| `000000` | `profiles` |
| `000001` | `subscriptions` |
| `000002` | `payments` |
| `000003` | `transcripts` |
| `000004` | `push_subscriptions` |
| `000005` | Analytics functions |
| `000006` | `real_time_sessions` |
| `000007` | `streaming_transcripts` |
| `000008` | `live_suggestions` |
| `000009` | `action_items` |
| `000010` | `contextual_insights` |
| `000011` | `context_analyses` |

## 8. Gaps

| ID | Issue | Severity |
|----|-------|----------|
| GAP-0001 | No SSOT.md existed | High |
| GAP-0002 | Desktop frontend TS errors allowed in CI | Medium |
| GAP-0003 | Mobile app ~18% complete | High |
| GAP-0004 | API server has zero tests | Medium |
| GAP-0005 | Legacy VoiceFlow-PRO references remain | Low |
| GAP-0006 | 40+ root legacy docs need consolidation | Medium |
| GAP-0007 | Shared packages overlapping structure | Low |
| GAP-0008 | No README.md at monorepo root | Medium |
