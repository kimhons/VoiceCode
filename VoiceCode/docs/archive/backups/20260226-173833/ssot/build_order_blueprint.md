# VoiceCode — Build Order Blueprint

> Version: 1.0.0 | Generated: 2026-02-26 | Blueprint Forge OS™

---

## Wave Plan

### Wave 0 — Foundation (COMPLETE)

**Entry Gate:** Repository initialized with package.json and Cargo.toml
**Parallel Lanes:**
- Lane A: MOD-SUPABASE (migrations + edge functions)
- Lane B: MOD-CODE-INTEL + MOD-STT + MOD-VISION (Rust modules)
- Lane C: MOD-SHARED (TypeScript packages)
- Lane D: MOD-AGENT-CORE (Python service)
- Lane E: MOD-VSCODE (VS Code extension)

**Sequential after lanes:** MOD-STREAMING → MOD-CLI → MOD-DESKTOP-BE → MOD-DESKTOP-FE → MOD-WEB
**Exit Gate:** `cargo test --release --lib` (453 pass); `npm test` (web pass); CI green
**Status:** ✅ COMPLETE

### Wave 1 — Stabilization (NEXT)

**Entry Gate:** Wave 0 complete
**Parallel Lanes:**
| Lane | Tasks | Duration Est. |
|------|-------|--------------|
| A | TASK-INFRA-0001 (strict tsc) + TASK-INFRA-0002 (clean refs) | 2-3 days |
| B | TASK-API-0001 (API tests) + TASK-API-0002 (validation) | 1-2 days |
| C | TASK-INFRA-0003 (archive docs) + TASK-INFRA-0004 (README) | 1 day |

**Exit Gate:**
```bash
cd apps/desktop && npx tsc --noEmit          # Must pass (no || true)
cd apps/api && npm test                       # Must pass
ls *.md                                       # Only CLAUDE.md, README.md
grep -ri "voiceflow-pro" . --include="*.json" --include="*.toml"  # 0 results
```
**Contract Freeze:** None — no interface changes

### Wave 2 — Mobile Completion

**Entry Gate:** Wave 1 exit gate passes
**Parallel Lanes:**
| Lane | Tasks | Duration Est. |
|------|-------|--------------|
| A | TASK-MOBILE-0001 (home) + TASK-MOBILE-0004 (settings) | 3-4 days |
| B | TASK-MOBILE-0002 (audio) + TASK-MOBILE-0003 (transcription) | 4-5 days |

**Sequential:** TASK-MOBILE-0005 (payment — depends on Lane A + B)
**Exit Gate:**
```bash
cd apps/mobile && npx tsc --noEmit            # Must pass
cd apps/mobile && npx eslint . --ext .ts,.tsx --max-warnings 0  # Must pass
cd apps/mobile && npm test -- --ci --coverage  # ≥80% statements
```
**Contract Freeze:** MOD-SUPABASE ↔ MOD-MOBILE API contract frozen before mobile dev starts

### Wave 3 — Marketplace & Distribution (FUTURE)

**Entry Gate:** Wave 2 exit gate passes
**Contents:** VS Code Marketplace, App Store, Play Store, performance optimization
**Exit Gate:** Published on all target marketplaces
**Status:** FUTURE — not yet planned in detail

---

## Parallel Development Rules

1. Modules at the same dependency level CAN be built in parallel
2. Cross-module contracts MUST be frozen before parallel work begins
3. Contract changes require all dependent modules to re-test
4. Each lane has its own exit gate that must pass independently
5. Wave N+1 cannot start until all Wave N exit gates pass

---

*Build order derived from dependency graph topological sort.*
