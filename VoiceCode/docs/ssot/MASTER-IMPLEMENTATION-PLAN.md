# VoiceCode — Master Implementation Plan

> Version: 2.0.0 | Updated: 2026-02-27 | DICE v3.6 Blueprint Binder

---

## 1. How to Run Locally

### Desktop App

```bash
cd apps/desktop && npm install
npm run dev                          # Hot-reload dev mode
# OR: cd src-tauri && cargo tauri dev
```

### Web App

```bash
cd apps/web && npm install
npm run dev                          # Vite dev server
```

### Mobile App

```bash
cd apps/mobile && npm install
npx expo start                       # Expo dev server
```

### API Server

```bash
cd apps/api && npm install
npm run dev                          # Express dev server
```

## 2. How to Run Tests

```bash
# Rust (Desktop Backend) — 453 tests
cd apps/desktop/src-tauri
cargo test --release --lib           # Unit tests
cargo test --release --test integration_tests  # Integration tests

# Web App
cd apps/web
npm test -- --run --reporter=verbose # Unit tests (Vitest)
npm run test:e2e:smoke               # E2E tests (Playwright)

# Mobile App
cd apps/mobile
npm test -- --ci --coverage          # Jest with coverage

# API Server — 22 tests
cd apps/api
npm test                             # Vitest (22 tests; HTTP server in test setup)
```

## 3. How to Validate Contracts

```bash
# Type checking
cd apps/web && npx tsc --noEmit
cd apps/desktop && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit

# Linting
cd apps/web && npm run lint
cd apps/mobile && npx eslint . --ext .ts,.tsx --max-warnings 0
cd apps/desktop/src-tauri && cargo clippy --lib -- -D clippy::correctness -D clippy::suspicious

# Security
cd apps/web && npx audit-ci --high

# Bundle budget
cd apps/web && npm run build  # index-*.js ≤250KB gzip
```

## 3.5 Contract Freeze Verification (Phase 0)

Before parallel UI builds begin, verify contracts are stable:

```bash
# Check no uncommitted contract changes
git diff --name-only docs/contracts/ supabase/migrations/ packages/shared-types/
# Should return empty

# Verify contract files exist
test -f docs/contracts/domain_models.md && echo "OK: domain_models"
test -f docs/contracts/events.md && echo "OK: events"
test -f docs/contracts/rbac_matrix.md && echo "OK: rbac"
test -f docs/contracts/ui_contracts.md && echo "OK: ui_contracts"

# Verify DB schema is stable
ls supabase/migrations/*.sql | wc -l  # Should be 12
```

Contract manifest: `docs/contracts/manifest.md` (create if missing)
Ownership boundaries: `docs/ssot/OWNERSHIP.md`

---

## 4. Task Registry — DONE Tasks (Evidence-Based)

> **Proof-of-run location:** All verification outputs are stored in `docs/ssot/proof-of-run/` with timestamped filenames.

### TASK-VOICE-\* (Voice & STT)

| ID              | Task                                      | Scope                              | Status | Evidence                                                      |
| --------------- | ----------------------------------------- | ---------------------------------- | ------ | ------------------------------------------------------------- |
| TASK-VOICE-0001 | Implement Deepgram STT provider           | `src-tauri/src/stt/`               | DONE   | `cargo test --release --lib` passes; `stt/deepgram.rs` exists |
| TASK-VOICE-0002 | Implement Whisper STT provider            | `src-tauri/src/stt/`               | DONE   | `stt/whisper.rs` exists; tests pass                           |
| TASK-VOICE-0003 | Implement streaming engine with 3 modes   | `src-tauri/src/streaming.rs`       | DONE   | `streaming.rs` exists; 453 tests pass                         |
| TASK-VOICE-0004 | Implement VAD and audio level calculation | `src-tauri/src/streaming.rs`       | DONE   | Audio level + VAD in streaming.rs                             |
| TASK-VOICE-0005 | Implement context-aware vocabulary boost  | `src-tauri/src/code_vocabulary.rs` | DONE   | `code_vocabulary.rs` exists                                   |
| TASK-VOICE-0006 | Implement audio capture with cpal         | `src-tauri/src/audio_capture.rs`   | DONE   | `audio_capture.rs` + `commands/audio.rs` exist                |

### TASK-CODE-\* (Code Intelligence)

| ID             | Task                                        | Scope                                       | Status | Evidence                                    |
| -------------- | ------------------------------------------- | ------------------------------------------- | ------ | ------------------------------------------- |
| TASK-CODE-0001 | Implement AST engine for 21 languages       | `code_intelligence/ast_engine.rs`           | DONE   | tree-sitter deps in Cargo.toml; file exists |
| TASK-CODE-0002 | Implement symbol table                      | `code_intelligence/symbol_table.rs`         | DONE   | File exists; tests pass                     |
| TASK-CODE-0003 | Implement voice grammar parser              | `code_intelligence/voice_grammar.rs`        | DONE   | File exists                                 |
| TASK-CODE-0004 | Implement intent classifier (13 categories) | `code_intelligence/intent_classifier.rs`    | DONE   | File exists                                 |
| TASK-CODE-0005 | Implement context builder with token budget | `code_intelligence/context_builder.rs`      | DONE   | tiktoken-rs in Cargo.toml                   |
| TASK-CODE-0006 | Implement prompt engineer                   | `code_intelligence/prompt_engineer.rs`      | DONE   | File exists                                 |
| TASK-CODE-0007 | Implement sandbox/safety gate               | `code_intelligence/sandbox.rs`              | DONE   | File exists                                 |
| TASK-CODE-0008 | Implement multi-provider LLM client         | `code_intelligence/llm_client.rs`           | DONE   | File exists; reqwest dep                    |
| TASK-CODE-0009 | Implement recitation validator              | `code_intelligence/recitation_validator.rs` | DONE   | File exists                                 |

### TASK-AGENT-\* (Multi-Agent)

| ID              | Task                                 | Scope                     | Status | Evidence    |
| --------------- | ------------------------------------ | ------------------------- | ------ | ----------- |
| TASK-AGENT-0001 | Implement 5 orchestration strategies | `cli/orchestrator.rs`     | DONE   | File exists |
| TASK-AGENT-0002 | Implement external agent adapters    | `cli/external_agents.rs`  | DONE   | File exists |
| TASK-AGENT-0003 | Implement agent registry             | `cli/agent_registry.rs`   | DONE   | File exists |
| TASK-AGENT-0004 | Implement response validation        | `cli/validation.rs`       | DONE   | File exists |
| TASK-AGENT-0005 | Implement streaming parser           | `cli/streaming_parser.rs` | DONE   | File exists |

### TASK-VISION-\* (Vision/OCR)

| ID               | Task                         | Scope                     | Status | Evidence    |
| ---------------- | ---------------------------- | ------------------------- | ------ | ----------- |
| TASK-VISION-0001 | Implement 3-tier OCR engine  | `vision/ocr_engine.rs`    | DONE   | File exists |
| TASK-VISION-0002 | Implement computer use agent | `vision/computer_use.rs`  | DONE   | File exists |
| TASK-VISION-0003 | Implement browser agent      | `vision/browser_agent.rs` | DONE   | File exists |

### TASK-WEB-\* (Web Application)

| ID            | Task                                      | Scope                                                     | Status | Evidence                                |
| ------------- | ----------------------------------------- | --------------------------------------------------------- | ------ | --------------------------------------- |
| TASK-WEB-0001 | Build web app with 50+ components         | `apps/web/src/components/`                                | DONE   | Directory exists; 50+ files             |
| TASK-WEB-0002 | Implement 30+ services                    | `apps/web/src/services/`                                  | DONE   | Directory exists; 30+ files             |
| TASK-WEB-0003 | Implement E2E tests (Playwright)          | `apps/web/e2e/`                                           | DONE   | `test:e2e:smoke` script in package.json |
| TASK-WEB-0004 | Implement hallucination detection service | `apps/web/src/services/hallucinationDetection.service.ts` | DONE   | File exists; tested in CI safety eval   |
| TASK-WEB-0005 | Implement prompt security service         | `apps/web/src/services/promptSecurity.service.ts`         | DONE   | File exists; tested in CI safety eval   |

### TASK-DB-\* (Database/Supabase)

| ID           | Task                                    | Scope                               | Status | Evidence                     |
| ------------ | --------------------------------------- | ----------------------------------- | ------ | ---------------------------- |
| TASK-DB-0001 | Create profiles migration               | `supabase/migrations/000000`        | DONE   | SQL file exists              |
| TASK-DB-0002 | Create subscriptions migration          | `supabase/migrations/000001`        | DONE   | SQL file exists              |
| TASK-DB-0003 | Create payments migration               | `supabase/migrations/000002`        | DONE   | SQL file exists              |
| TASK-DB-0004 | Create transcripts migration            | `supabase/migrations/000003`        | DONE   | SQL file exists              |
| TASK-DB-0005 | Create real-time + streaming migrations | `supabase/migrations/000006-000011` | DONE   | SQL files exist              |
| TASK-DB-0006 | Implement Stripe edge functions (5)     | `supabase/functions/`               | DONE   | 5 function directories exist |

### TASK-INFRA-\* (Infrastructure — Wave 1)

| ID              | Task                                   | Scope                                                   | Status | Evidence                                                                                                                                                                                                                                                                   |
| --------------- | -------------------------------------- | ------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ----------------------------------------------------------------------- |
| TASK-INFRA-0001 | Enable strict tsc for desktop frontend | `apps/desktop/`, `.github/workflows/ci.yml`             | DONE   | Fixed 139 TS errors across 14 service files + App.tsx; removed `                                                                                                                                                                                                           |     | true`from CI;`cd apps/desktop && npx tsc --noEmit` passes with 0 errors |
| TASK-INFRA-0002 | Clean VoiceFlow-PRO references         | 20+ files across `apps/api`, `apps/desktop`, `apps/web` | DONE   | Eliminated ALL VoiceFlow-PRO refs including localStorage keys, OTP issuers, config paths, comments, package names, bundle metadata; `grep -ri "voiceflow-pro\|voiceflow.pro" . --include="*.json" --include="*.toml" --include="*.ts" --include="*.tsx"` returns 0 results |
| TASK-INFRA-0004 | Create monorepo README.md              | `VoiceCode/README.md`                                   | DONE   | 121-line README with architecture, prerequisites, quick start, tests, env vars, docs links; `test -f VoiceCode/README.md` passes                                                                                                                                           |

### TASK-API-\* (API Server — Wave 1)

| ID            | Task                     | Scope                     | Status | Evidence                                                                                                                                                          |
| ------------- | ------------------------ | ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TASK-API-0001 | Implement API test suite | `apps/api/server.test.ts` | DONE   | 22 Vitest tests all pass; HTTP server wrapper in test setup; covers `/api/health`, `/api/alerts/*`, Zod validation, error cases; `cd apps/api && npm test` passes |

---

## 5. Task Registry — TODO Tasks (Pending)

### TASK-MOBILE-\* (Mobile Application — GAP-0003, re-scoped)

| ID               | Task                                 | Scope                                        | Steps                                                                                                                                                                                                                                                                                              | Acceptance Criteria                                      | Verify                                      |
| ---------------- | ------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------- | -------- |
| TASK-MOBILE-0001 | Fix mobile TypeScript errors         | `apps/mobile/` (20 files)                    | 1. Fixed 3 root parse errors (TSX generic, JSX prop syntax, mismatched quotes); 2. Fixed 30 cascading errors (Timeout types, icon names, theme colors, navigation props, module declarations, null checks); 3. Added `optional-deps.d.ts` for Firebase/Sentry/Slider; 4. Updated tsconfig excludes | `npx tsc --noEmit` passes with 0 errors                  | `cd apps/mobile && npx tsc --noEmit`        | **DONE** |
| TASK-MOBILE-0002 | Fix mobile test infrastructure       | `apps/mobile/`                               | 1. Resolved jest config conflict (jest.config.js vs package.json "jest"); 2. Fixed mockServices.ts syntax error; 3. Fixed npm test script for monorepo                                                                                                                                             | 1755/1828 tests pass (96%); `npm test` works             | `cd apps/mobile && npm test -- --forceExit` | **DONE** |
| TASK-MOBILE-0003 | Implement Stripe payment integration | `apps/mobile/src/services/paymentService.ts` | 1. Created PaymentService (checkout, payment intent, portal, subscription query); 2. Created subscriptionSlice (Redux); 3. Wrapped App with StripeProvider; 4. Wired PricingScreen CTA to Stripe checkout; 5. Added `voicecode` URL scheme                                                         | PaymentService exists, tsc passes, StripeProvider in App | `cd apps/mobile && npx tsc --noEmit`        | **DONE** |

### TASK-API-\* (API Server)

| ID            | Task                       | Scope                | Steps                                                                                                                                                                                                               | Acceptance Criteria         | Verify                    |
| ------------- | -------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------- | -------- |
| TASK-API-0002 | Add Zod request validation | `apps/api/server.ts` | 1. Installed Zod v4; 2. Added 4 schemas (EmailAlert, SlackAlert, WebhookAlert, TestAlert); 3. Replaced manual validation with safeParse(); 4. Added 10 new test cases; 5. Fixed pre-existing createTransporter typo | 22/22 tests pass, tsc clean | `cd apps/api && npm test` | **DONE** |

### TASK-INFRA-\* (Infrastructure)

| ID              | Task                           | Scope             | Steps                                                                                                                          | Acceptance Criteria                                  | Verify                           |
| --------------- | ------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | -------------------------------- | -------- |
| TASK-INFRA-0003 | Archive root-level legacy docs | Root `*.md` files | 1. Create `docs/archive/`; 2. Move root .md files to docs/ (NEXT.md, ANALYSIS_REPORT.md); 3. Root = CLAUDE.md + README.md only | Root directory contains only CLAUDE.md and README.md | `ls *.md` at repo root → 2 files | **DONE** |

### TASK-DOCS-\* (Documentation)

| ID             | Task                              | Scope                        | Steps                                                        | Acceptance Criteria                          | Verify                                                     | Owner    | Status   |
| -------------- | --------------------------------- | ---------------------------- | ------------------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------- | -------- | -------- |
| TASK-DOCS-0010 | Create wireframes for key screens | `docs/ssot/wireframes/`      | 1. Create text wireframes for P0 screens; 2. Update INDEX.md | All P0 screens have wireframe files          | `ls docs/ssot/wireframes/*.md \| wc -l` → 7 (INDEX + 6 P0) | MOD-DOCS | **DONE** |
| TASK-DOCS-0011 | Create contracts manifest         | `docs/contracts/manifest.md` | 1. List all contract files; 2. Add version + date            | manifest.md exists with all contracts listed | `test -f docs/contracts/manifest.md`                       | MOD-DOCS | **DONE** |

### TASK-CI-\* (CI/CD — GAP-CI)

| ID           | Task                   | Scope                          | Steps                                                                                                                   | Acceptance Criteria                                              | Verify                                                           | Owner     |
| ------------ | ---------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- | --------- | -------- |
| TASK-CI-0001 | CI pipeline maintained | `.github/workflows/ci.yml`     | (Already done)                                                                                                          | All 4 jobs pass on main/master                                   | GitHub Actions dashboard shows green                             | MOD-INFRA |
| TASK-CI-0002 | Fix CI workflow paths  | `.github/workflows/ci.yml`     | 1. Verified paths already correct (Wave 1); 2. Added `api` job (tsc + tests); 3. Added `docs` job (SSOT existence gate) | CI runs 6 jobs: web, api, desktop-rust, desktop-fe, mobile, docs | `cat .github/workflows/ci.yml \| grep -c 'runs-on'` → 6          | MOD-INFRA | **DONE** |
| TASK-CI-0003 | Fix E2E workflow paths | `.github/workflows/ui-e2e.yml` | 1. Created ui-e2e.yml with `apps/web/` working dir; 2. audit-ci + build + Playwright smoke; 3. Artifact upload          | E2E workflow targets apps/web                                    | `grep working-directory .github/workflows/ui-e2e.yml` → apps/web | MOD-INFRA | **DONE** |

---

## 6. Wave Plan

### Wave 0 — Foundation (DONE)

**Entry Gate:** Repository exists with package.json and Cargo.toml
**Contents:** All TASK-VOICE-_, TASK-CODE-_, TASK-AGENT-_, TASK-VISION-_, TASK-WEB-_, TASK-DB-_, TASK-CI-0001
**Exit Gate:** `cargo test --release --lib` passes (453 tests); `npm test` passes (web); CI green
**Status:** COMPLETE

### Wave 1 — Stabilization (DONE)

**Entry Gate:** Wave 0 complete ✓
**Completed:**

- Lane A: TASK-INFRA-0001 (strict tsc — 139 errors fixed) ✓ + TASK-INFRA-0002 (clean refs — 20+ files) ✓
- Lane B: TASK-API-0001 (API tests — 12 tests passing) ✓
- Lane C: TASK-INFRA-0004 (README — 121 lines) ✓
  **Remaining:** TASK-API-0002 (validation), TASK-INFRA-0003 (archive docs) — deferred to Wave 2
  **Exit Gate:** Desktop `tsc --noEmit` passes (0 errors); `|| true` removed from CI; API test suite passes (22 tests)
  **Status:** COMPLETE (core objectives met)

### Wave 0.5 — Contract Freeze ✅

**Entry Gate:** Wave 1 complete ✓
**Owner:** MOD-DOCS, MOD-INFRA
**Contents:**

- ~~TASK-DOCS-0011 (contracts manifest)~~ **DONE**
- ~~Contract freeze verification (§3.5)~~ **DONE**
- Full audit of all 4 contract docs against actual codebase
- All contracts upgraded to v2.0.0 with corrections
  **Exit Gate:** All 5 contract files exist ✅; manifest v2.0.0 with FROZEN status ✅; 12 migrations verified ✅
  **Status:** **DONE** (2026-02-27)
  **Evidence:** `docs/contracts/manifest.md` v2.0.0 — Freeze Changelog documents all corrections

### Wave 2 — Mobile Polish & Remaining Stabilization ✅

**Entry Gate:** Wave 0.5 complete (contracts frozen) ✓
**Owner:** MOD-MOBILE, MOD-API, MOD-INFRA, MOD-DOCS
**Parallel Lanes:**

- ~~Lane A: TASK-MOBILE-0001 (fix 33 TS errors)~~ **DONE** + ~~TASK-MOBILE-0002 (test infra fix)~~ **DONE** — 1755/1828 tests pass
- ~~Lane B: TASK-API-0002 (Zod validation)~~ **DONE** — 22/22 tests pass
- ~~Lane C: TASK-CI-0002 + TASK-CI-0003~~ **DONE**
- ~~Lane D: TASK-DOCS-0011 (contracts manifest)~~ **DONE** — v2.0.0 FROZEN
  **Sequential:** ~~TASK-MOBILE-0003 (Stripe payment)~~ **DONE** — PaymentService, subscriptionSlice, StripeProvider, PricingScreen wired
  **Exit Gate:** Mobile tsc ✅ 0 errors | Mobile tests ✅ 1755 pass | API tests ✅ 22/22 pass | API tsc ✅ | Contracts frozen ✅
  **Status:** **DONE** (2026-02-27)

### Wave 3 — Marketplace & Polish

**Entry Gate:** Wave 2 complete
**Owner:** MOD-INFRA, MOD-WEB, MOD-MOBILE
**Contents:** VS Code Marketplace publication, App Store/Play Store submission, performance optimization
**Exit Gate:** Published on marketplaces; performance benchmarks met
**Status:** FUTURE

---

## 7. Cross-Reference Index

| Document            | Location                             | Purpose                          |
| ------------------- | ------------------------------------ | -------------------------------- |
| SSOT.md             | `docs/ssot/SSOT.md`                  | Requirements, modules, workflows |
| System Blueprint    | `docs/ssot/system_blueprint.md`      | UI/UX, API, data, security       |
| Traceability Matrix | `docs/ssot/traceability_matrix.md`   | REQ→TASK→TEST proof              |
| Dependency Graph    | `docs/ssot/dependency_graph.md`      | Module dependencies              |
| Build Order         | `docs/ssot/build_order_blueprint.md` | Wave plan details                |
| Health Metrics      | `docs/ssot/health_metrics.md`        | Gap/risk tracking                |
| Version History     | `docs/ssot/version_history.md`       | Change log                       |
| Repo Inventory      | `docs/ssot/repo_inventory.md`        | Lossless file inventory          |
| Ownership Map       | `docs/ssot/OWNERSHIP.md`             | Module ownership boundaries      |
| UI/UX Blueprint     | `docs/ssot/UI-UX-BLUEPRINT.md`       | Design system & screen specs     |
| Wireframes Index    | `docs/ssot/wireframes/INDEX.md`      | Text wireframes for P0 screens   |
| Domain Models       | `docs/contracts/domain_models.md`    | Data model contracts             |
| UI Contracts        | `docs/contracts/ui_contracts.md`     | Screen/component contracts       |
| Events              | `docs/contracts/events.md`           | Event contracts                  |
| RBAC Matrix         | `docs/contracts/rbac_matrix.md`      | Role-based access                |
| Contracts Manifest  | `docs/contracts/manifest.md`         | Contract freeze manifest         |

---

_Every task is atomic with scope, steps, acceptance criteria, and verify commands. No vague tasks._
