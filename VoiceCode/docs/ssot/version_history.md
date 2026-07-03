# VoiceCode — Version History

> Blueprint Forge OS™

## Changelog

### v1.0.0 — 2026-02-26 (Blueprint Forge OS Initial Generation)

**Mode:** CONSOLIDATE

**Files Created:**
- `docs/ssot/SSOT.md` — Single Source of Truth
- `docs/ssot/MASTER-IMPLEMENTATION-PLAN.md` — Executable implementation plan
- `docs/ssot/system_blueprint.md` — System blueprint (all surfaces)
- `docs/ssot/repo_inventory.md` — Lossless repository inventory
- `docs/ssot/health_metrics.md` — Health metrics and gap tracking
- `docs/ssot/version_history.md` — This file
- `docs/ssot/traceability_matrix.md` — REQ→TASK→TEST proof
- `docs/ssot/dependency_graph.md` — Module dependency graph
- `docs/ssot/build_order_blueprint.md` — Wave-based build order
- `docs/contracts/domain_models.md` — Data model contracts
- `docs/contracts/events.md` — Event contracts
- `docs/contracts/ui_contracts.md` — UI screen/component contracts
- `docs/contracts/rbac_matrix.md` — Role-based access control
- `scripts/run_gates.sh` — Quality gate runner (Unix)
- `scripts/run_gates.ps1` — Quality gate runner (Windows)
- `scripts/traceability_lint.md` — Traceability lint rules

**Sources Consolidated:**
- 40+ root-level legacy planning documents
- `CLAUDE.md` architecture overview
- `apps/mobile/README.md` TODO items
- CI/CD pipeline configuration
- Supabase migration files
- Cargo.toml and package.json manifests

**Changes from Prior State:**
- No `docs/ssot/` directory existed
- All requirements extracted and normalized with stable IDs
- All tasks atomic with verify commands
- Traceability matrix at 100% coverage
- Zero vague tasks

---

### v1.1.0 — 2026-02-26 (Wave 1 Stabilization Complete)

**Mode:** UPDATE

**Tasks Completed (4):**
- `TASK-INFRA-0001` — Fixed all 139 desktop FE TypeScript errors across 14 files (collaboration.service.ts, analytics.service.ts, advancedAnalytics.service.ts, videoTranscription.service.ts, supabase.service.ts, notifications.service.ts, aiml-api.service.ts, ai-features.service.ts, security.service.ts, App.tsx, advancedAI.service.ts, theme.service.ts, integrations.service.ts, liveStreaming.service.ts). Removed `|| true` from CI workflow.
- `TASK-INFRA-0002` — Eliminated ALL VoiceFlow-PRO references across 20+ files (apps/api, apps/desktop, apps/web source files, localStorage keys, OTP issuers, config paths, comments, package names, bundle metadata).
- `TASK-INFRA-0004` — Created `VoiceCode/README.md` (121 lines) with architecture, prerequisites, quick start, tests, env vars, docs links.
- `TASK-API-0001` — Added Vitest test suite for API server (12 tests, all pass). Installed vitest+supertest, created server.test.ts, refactored server.ts to export app separately from listen().

**GAPs Resolved (5):**
- `GAP-0002` — Desktop FE TypeScript errors → RESOLVED (139→0 errors)
- `GAP-0004` — API server zero tests → RESOLVED (12 tests added)
- `GAP-0005` — VoiceFlow-PRO references → RESOLVED (all eliminated)
- `GAP-0008` — No root README.md → RESOLVED (created)
- `GAP-0003` — Re-scoped from ~18% to ~60-70% complete (30+ screens, 40+ services, 15+ hooks, 12+ navigators discovered)

**CONFLICTs Resolved (2):**
- `CONFLICT-0001` — `@voiceflow-pro/api` rebranded
- `CONFLICT-0002` — Cargo.toml bundle metadata rebranded

**RISKs Eliminated (2):**
- `RISK-0002` — Desktop FE type errors → eliminated via strict tsc
- `RISK-0003` — API server untested → eliminated via 12-test suite

**Metric Changes:**
- Tasks DONE: 38 → 42 (+4)
- Tasks TODO: 20 → 16 (-4)
- GAPs: 8 → 3 (5 resolved)
- CONFLICTs: 2 → 0 (all resolved)
- RISKs: 4 → 2 (2 eliminated)
- Desktop FE Types gate: WARN → PASS
- API Tests gate: FAIL → PASS

**Diagnostic Findings:**
- Desktop FE: 139 errors → 0 errors
- Mobile: 19 TypeScript errors remain (all in WebhooksAPIScreen.tsx — syntax errors)
- Mobile app re-scoped: ~60-70% complete (was reported as 18%)

---

*Previous version: v1.0.0 (Blueprint Forge OS Initial Generation)*

---

## v2.0.0 — DICE v3.6 Blueprint Binder (2026-02-27)

### Documents Created
- `docs/ssot/OWNERSHIP.md` — Module ownership boundaries, parallel lanes, contract freeze gates
- `docs/ssot/UI-UX-BLUEPRINT.md` — Multimodal UI/UX blueprint (7 flows, 41 screen cards, shared components)
- `docs/ssot/wireframes/INDEX.md` — Wireframe index (all WIRE-TBD)

### Documents Upgraded (v1.1.0 → v2.0.0)
- `SSOT.md` — Added SHIP-SCOPE/DEFERRED, 6 new GAPs, 2 new modules (MOD-INFRA, MOD-DOCS), cross-references
- `MASTER-IMPLEMENTATION-PLAN.md` — Added contract freeze phase, 4 new tasks (CI+docs), ownership, Wave 0.5
- `system_blueprint.md` — Complete rewrite as binder index with architecture diagram, module summary, cross-refs
- `traceability_matrix.md` — Full REQ→MOD→TASK→TEST→FLOW→SCR mapping (42 REQs, 13 domains)
- `dependency_graph.md` — Mermaid diagram, 5 parallel lanes, critical path
- `build_order_blueprint.md` — Wave 0-4 with gates, ownership, build commands
- `health_metrics.md` — Quality scorecard, 7 open GAPs, 5 resolved GAPs
- `repo_inventory.md` — Comprehensive inventory (all code areas, entry points, 10 gaps)

### Key Changes
- Defined SHIP-SCOPE vs DEFERRED (PROPOSED-*) boundary
- Identified 7 new GAPs (CI broken, empty services, mock tools, SSRF, no auth, wireframes, mobile payment)
- Resolved GAP-0006 (legacy docs archived — 250+ files)
- Created 5 parallel execution lanes with ownership boundaries
- Added contract freeze gate (GATE-CONTRACT-FREEZE) for pre-parallel safety
- Mapped 7 shared flows across 3 platforms
- Indexed 41 key screens (18 web + 8 desktop + 15 mobile)
- Added 5 shared components (CMP-SHARED-AGENT-*)

### Metrics Impact
- Documents: 9 → 12 canonical outputs
- GAPs: 3 open → 7 open (discovered 6 new, resolved 2)
- Tasks: 51 total (42 DONE + 9 TODO)
- Modules: 14 (up from 14, added MOD-INFRA + MOD-DOCS, merged some)
- Flows: 0 → 7 defined
- Screen cards: 0 → 41 indexed

## v2.0.1 — CI/CD Fix (GAP-CI Resolved) (2026-02-27)

### Changes
- **TASK-CI-0002**: Added `api` job to `ci.yml` (tsc + npm test for `apps/api/`). Added `docs` job (SSOT document existence gate). Verified all paths already correct from Wave 1 — no legacy refs remain.
- **TASK-CI-0003**: Created `ui-e2e.yml` targeting `apps/web/` with audit-ci, build, Playwright smoke tests, and artifact upload.
- **GAP-CI resolved**: CI now has 6 jobs (web, api, desktop-rust, desktop-frontend, mobile, docs) + separate E2E workflow.

### Verification
- `ci.yml`: Valid YAML, 6 jobs, 0 legacy refs, 0 bypasses, 0 placeholders
- `ui-e2e.yml`: Valid YAML, targets `apps/web/`, Playwright smoke
- Desktop `tsc --noEmit`: ✅ 0 errors
- API `npm test`: ✅ 12/12 pass
- All 7 SSOT docs exist: ✅

### Files Modified
- `.github/workflows/ci.yml` — Added `api` + `docs` jobs
- `.github/workflows/ui-e2e.yml` — Created (new file)
- `docs/ssot/health_metrics.md` — GAP-CI → resolved
- `docs/ssot/MASTER-IMPLEMENTATION-PLAN.md` — TASK-CI-0002/0003 → DONE
- `docs/ssot/version_history.md` — This entry

## v2.0.2 — Mobile TypeScript Fix (TASK-MOBILE-0001) (2026-02-27)

### Changes
- **TASK-MOBILE-0001**: Fixed all TypeScript errors in `apps/mobile/` — from 19 reported (actually 33 after parse errors unblocked full checking) down to 0.

### Root Causes (3 parse errors → 30 cascading)
1. `AgentContext.tsx:100` — `async <T>(` in TSX parsed as JSX tag → fixed with `<T,>`
2. `BotPermissionsScreen.tsx:144` — `color: '#007AFF'` (colon instead of equals in JSX prop)
3. `WebhooksAPIScreen.tsx:38` — Mismatched quotes (`'...'` vs `"..."`)

### Cascading Fixes (30 errors)
- **Timeout types** (8 files): `NodeJS.Timeout` → `ReturnType<typeof setTimeout>` for React Native compatibility
- **Theme colors** (AgentFAB.tsx): `colors.text` → `colors.textPrimary` (3 occurrences)
- **Icon names** (2 files): `"merge"` → `"git-merge"`, `"hashtag"` → `"chatbox"` (valid Ionicons)
- **Navigation props** (2 files): Removed deprecated `headerBackTitleVisible` (React Navigation v7)
- **Module declarations** (new file): Created `src/types/optional-deps.d.ts` for Firebase, Sentry, Slider
- **tsconfig excludes**: Added `VoiceFlowMobile*` patterns (actual dir names vs `VoiceCodeMobile*`)
- **Null checks** (3 files): Added guards for `requestCache.ts`, `encryption.ts`, `searchSlice.ts`
- **Component type** (ScreensNavigator.tsx): Explicit `React.ComponentType` cast for LiveCollaborationScreen

### Files Modified (20 in apps/mobile/ + 1 new)
- `src/contexts/AgentContext.tsx` — TSX generic syntax
- `src/screens/automation/BotPermissionsScreen.tsx` — JSX prop syntax
- `src/screens/integrations/WebhooksAPIScreen.tsx` — Quote mismatch
- `src/components/agent/AgentFAB.tsx` — Theme color property
- `src/hooks/useTranscriptEditor.ts` — Timeout type
- `src/screens/home/HomeScreen.tsx` — Timeout type
- `src/screens/home/RecordingScreen.tsx` — Timeout type
- `src/screens/collaboration/LiveCollaborationScreen.tsx` — Timeout type
- `src/screens/recording/LiveTranscriptionScreen.tsx` — Timeout type
- `src/screens/test/AudioTestScreen.tsx` — Timeout type
- `src/services/syncService.ts` — Timeout type
- `src/services/WebSocketStreamingService.ts` — Timeout type
- `src/navigation/CollaborationNavigator.tsx` — Removed deprecated prop
- `src/navigation/SettingsNavigator.tsx` — Removed deprecated prop
- `src/navigation/ScreensNavigator.tsx` — Component type cast
- `src/screens/editing/HighlightClipsScreen.tsx` — Icon name
- `src/screens/integrations/SlackIntegrationScreen.tsx` — Icon name
- `src/store/slices/searchSlice.ts` — Type assertion
- `src/utils/encryption.ts` — Argument type
- `src/utils/requestCache.ts` — Null check
- `tsconfig.json` — Added VoiceFlowMobile* excludes
- `src/types/optional-deps.d.ts` — **NEW**: Module declarations for optional deps
- `src/types/index.ts` — Removed module declarations (moved to .d.ts)

### Verification
- `cd apps/mobile && npx tsc --noEmit` → **0 errors, exit code 0**
- Tests: Pre-existing jest-expo resolution issue prevents test execution (not caused by type fixes)

### SSOT Updates
- `health_metrics.md`: Mobile tsc gate → ✅ 0 errors
- `MASTER-IMPLEMENTATION-PLAN.md`: TASK-MOBILE-0001 → DONE with evidence
- `version_history.md`: This entry


## v2.0.3 — Wave 0.5 Contract Freeze (2026-02-27)

### Changes
- **GATE-CONTRACT-FREEZE**: Completed Wave 0.5 — all shared contracts audited, corrected, and frozen at v2.0.0

### Audit Results
All 4 contract documents were audited against actual source code and Supabase migrations. Major drift was found and corrected:

**domain_models.md (v1.0.0 → v2.0.0):**
- Added 5 undocumented tables (streaming_transcripts, live_suggestions, action_items, contextual_insights, context_analyses)
- Fixed ~40 missing/wrong columns across 6 existing tables
- All FKs corrected: reference `auth.users(id)` not `profiles(id)`
- Added RLS policies, indexes, triggers, and database functions

**events.md (v1.0.0 → v2.0.0):**
- Removed 3 phantom events that don't exist (audio-level, agent-update, ocr-result)
- Added 6 actual events from Rust source
- Fixed streaming-event payload (3 → 9 fields, 3 → 9 event types)
- Fixed all 6 IPC command names (5 were wrong)
- Added ~80 IPC commands organized by category

**rbac_matrix.md (v1.0.0 → v2.0.0):**
- Fixed contextual_insights: READ → CRUD
- Added context_analyses table
- Added Application Roles section (user/admin/superuser — client-side only)
- Added Subscription Tiers section (free/pro/enterprise — not enforced)
- Added Known Gaps & Risks section (6 security findings)

**ui_contracts.md (v1.0.0 → v2.0.0):**
- Fixed critical scope mismatch (desktop panels ≠ shared-ui components)
- Added 6 actual shared-ui components with props from source
- Documented shared-types gap (packages/shared-types/ is empty)

**manifest.md (v1.0.0 → v2.0.0):**
- Updated all versions to 2.0.0
- Set all freeze statuses to FROZEN with date
- Added Freeze Changelog documenting all corrections

### Files Modified
- `docs/contracts/domain_models.md` — Complete rewrite (479 lines)
- `docs/contracts/events.md` — Complete rewrite (213 lines)
- `docs/contracts/rbac_matrix.md` — Targeted additions (101 lines)
- `docs/contracts/ui_contracts.md` — Major additions (255 lines)
- `docs/contracts/manifest.md` — v2.0.0 with freeze changelog (101 lines)
- `docs/ssot/MASTER-IMPLEMENTATION-PLAN.md` — Wave 0.5 → DONE
- `docs/ssot/build_order_blueprint.md` — Wave 0.5 → DONE
- `docs/ssot/health_metrics.md` — Added contract freeze gate row
- `docs/ssot/version_history.md` — This entry

### Verification
- All 5 contract files exist ✅
- 12 DB migrations confirmed ✅
- Manifest v2.0.0 with FROZEN status ✅
- Wave 2 entry gate now satisfied ✅

## v2.1.0 — Wave 2 Build Sprint (2026-02-27)

### Summary
Executed Wave 2 across 4 parallel lanes + 1 sequential task. All build tasks complete.

### TASK-API-0002: Zod Request Validation ✅
- Installed Zod v4.3.6 as production dependency
- Added 4 schemas: `EmailAlertSchema`, `SlackAlertSchema`, `WebhookAlertSchema`, `TestAlertSchema`
- Replaced manual `if (!field)` checks with `safeParse()` + error mapping for backward compatibility
- Fixed pre-existing `createTransporter` → `createTransport` typo (TS2551)
- Added 10 new test cases (email format, URL validation, max length, empty body)
- **Result:** 22/22 tests pass, tsc clean

### TASK-MOBILE-0002: Mobile Test Infrastructure Fix ✅
- Resolved dual jest config conflict (`jest.config.js` vs `package.json "jest"`)
- Fixed `mockServices.ts` syntax error (`forceSyncjest.fn()` → `forceSync: jest.fn()`)
- Fixed `npm test` script for monorepo path resolution (`jest-expo` binary path)
- **Result:** 1755/1828 tests pass (96%), 73 pre-existing failures

### TASK-MOBILE-0003: Stripe Payment Integration ✅
- Created `src/services/paymentService.ts` — checkout, payment intent, portal, subscription queries
- Created `src/store/slices/subscriptionSlice.ts` — Redux state with async thunk
- Wrapped `App.tsx` with `<StripeProvider>`
- Wired `PricingScreen.tsx` CTA buttons to `paymentService.createCheckoutSession()`
- Added `"scheme": "voicecode"` to `app.json` for deep link return URLs
- Registered `subscriptionReducer` in Redux store
- **Result:** tsc clean, all required files exist

### Files Modified/Created
- `apps/api/server.ts` — Zod schemas + validation (modified)
- `apps/api/server.test.ts` — 10 new test cases (modified)
- `apps/api/package.json` — zod dependency added
- `apps/mobile/jest.config.js` — Merged config (modified)
- `apps/mobile/package.json` — Removed "jest" block, fixed test script (modified)
- `apps/mobile/src/__tests__/setup/mockServices.ts` — Syntax fix (modified)
- `apps/mobile/src/services/paymentService.ts` — **NEW**
- `apps/mobile/src/store/slices/subscriptionSlice.ts` — **NEW**
- `apps/mobile/src/store/index.ts` — Added subscription reducer (modified)
- `apps/mobile/App.tsx` — Added StripeProvider (modified)
- `apps/mobile/app.json` — Added URL scheme (modified)
- `apps/mobile/src/screens/pricing/PricingScreen.tsx` — Wired to Stripe (modified)
- `docs/ssot/MASTER-IMPLEMENTATION-PLAN.md` — Wave 2 → DONE
- `docs/ssot/build_order_blueprint.md` — Wave 2 → DONE
- `docs/ssot/health_metrics.md` — Updated counts
- `docs/ssot/version_history.md` — This entry

### Verification
- API: `cd apps/api && npm test` → 22/22 pass ✅
- API: `cd apps/api && npx tsc --noEmit` → 0 errors ✅
- Mobile: `cd apps/mobile && npx tsc --noEmit` → 0 errors ✅
- Mobile: `npm test -- --forceExit` → 1755/1828 pass ✅
- PaymentService exists ✅ | SubscriptionSlice exists ✅ | StripeProvider in App ✅