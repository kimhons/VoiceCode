# VoiceCode Build Order Blueprint

> Version: 2.0.0 | Updated: 2026-02-27 | DICE v3.6

## Wave Execution Order

### Wave 0 — Foundation (COMPLETE)
All core modules implemented: voice, code intelligence, agents, vision, web, database.
- **Gate**: `cargo test --release --lib` (453 tests pass)
- **Status**: DONE

### Wave 0.5 — Contract Freeze (COMPLETE)
Freeze shared contracts before parallel UI work:
- **Tasks**: Audited all 4 contract docs against codebase; fixed ~80 discrepancies; versioned to v2.0.0; frozen
- **Gate**: All 5 contract files exist ✅; 12 migrations verified ✅; manifest.md v2.0.0 FROZEN ✅
- **Owner**: MOD-DOCS, MOD-SUPABASE
- **Status**: DONE (2026-02-27)

### Wave 1 — Stabilization (COMPLETE)
- TASK-INFRA-0001: Desktop tsc strict (139 errors fixed)
- TASK-INFRA-0002: VoiceFlow-PRO cleanup (20+ files)
- TASK-API-0001: API test suite (12 tests)
- TASK-INFRA-0004: README.md
- **Gate**: `tsc --noEmit` passes, API tests pass
- **Status**: DONE

### Wave 2 — CI + Mobile + Docs (COMPLETE)

**Lane A: CI Fix (P0)** ✅
- ~~TASK-CI-0002: Fix ci.yml~~ DONE | ~~TASK-CI-0003: Fix ui-e2e.yml~~ DONE

**Lane B: Mobile Polish** ✅
- ~~TASK-MOBILE-0001: Fix 33 TS errors~~ DONE | ~~TASK-MOBILE-0002: Test infra fix~~ DONE (1755/1828 pass)

**Lane C: API Hardening** ✅
- ~~TASK-API-0002: Zod request validation~~ DONE (22/22 tests pass)

**Lane D: Documentation** ✅
- ~~TASK-DOCS-0011: Contracts manifest~~ DONE (v2.0.0 FROZEN)

**Sequential:** ✅
- ~~TASK-MOBILE-0003: Stripe payment~~ DONE (PaymentService + subscriptionSlice + StripeProvider)

**Status**: DONE (2026-02-27)

### Wave 3 — Production Readiness (SHIP-SCOPE)
- TASK-INFRA-0003 completed (archive legacy docs — already done)
- API authentication for alert endpoints
- Agent Core: replace mock tools with real implementations
- End-to-end integration testing
- Performance benchmarks
- **Gate**: All quality gates pass, security audit clean

### Wave 4 — Marketplace (DEFERRED)
- VS Code Marketplace publication
- App Store / Play Store submission
- Extension consolidation
- Cloud infrastructure (Docker, K8s)
- **Gate**: Published on marketplaces

## Build Commands by Wave

```bash
# Wave 0.5 — Contract Freeze
git diff --name-only docs/contracts/ supabase/migrations/
test -f docs/contracts/manifest.md

# Wave 2 Lane A — CI
# (Manual: update workflow files, push, verify GitHub Actions)

# Wave 2 Lane B — Mobile
cd apps/mobile && npx tsc --noEmit
cd apps/mobile && npm test -- --ci --coverage

# Wave 2 Lane C — API
cd apps/api && npm test

# Wave 3 — Full quality gate
bash scripts/run_gates.sh
```

## Dependency-Driven Constraints

1. **Lane D (Backend) must freeze before Lanes A/B/C start** — UI consumers need stable APIs
2. **TASK-MOBILE-0003 depends on TASK-MOBILE-0001** — can't implement payments with broken types
3. **Wave 3 depends on Wave 2 CI fix** — can't validate without working CI
4. **Wave 4 depends on Wave 3** — can't publish broken software
