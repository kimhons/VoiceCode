# VoiceCode Contract Manifest

> Version: 2.0.0 | Updated: 2026-02-27 | DICE v3.6 — Wave 0.5 Contract Freeze

## Purpose

This manifest lists all contract files that must be frozen before parallel UI builds begin (GATE-CONTRACT-FREEZE).
All contract documents were audited against the actual codebase on 2026-02-27 and corrected to match reality.

## Contract Files

| File | Type | Version | Last Updated | Freeze Status | Owner |
|------|------|---------|-------------|---------------|-------|
| `docs/contracts/domain_models.md` | Data Models | 2.0.0 | 2026-02-27 | FROZEN | MOD-DOCS |
| `docs/contracts/events.md` | Event Contracts | 2.0.0 | 2026-02-27 | FROZEN | MOD-DOCS |
| `docs/contracts/rbac_matrix.md` | RBAC Permissions | 2.0.0 | 2026-02-27 | FROZEN | MOD-DOCS |
| `docs/contracts/ui_contracts.md` | UI Component Specs | 2.0.0 | 2026-02-27 | FROZEN | MOD-DOCS |

## Database Schema

| Migration | Table | Status |
|-----------|-------|--------|
| 000000 | profiles | Frozen |
| 000001 | subscriptions | Frozen |
| 000002 | payments | Frozen |
| 000003 | transcripts | Frozen |
| 000004 | push_subscriptions | Frozen |
| 000005 | (analytics functions) | Frozen |
| 000006 | real_time_sessions | Frozen |
| 000007 | streaming_transcripts | Frozen |
| 000008 | live_suggestions | Frozen |
| 000009 | action_items | Frozen |
| 000010 | contextual_insights | Frozen |
| 000011 | context_analyses | Frozen |

Total migrations: 12

## Verification Commands

```bash
# Verify all contract files exist
for f in docs/contracts/domain_models.md docs/contracts/events.md docs/contracts/rbac_matrix.md docs/contracts/ui_contracts.md docs/contracts/manifest.md; do
  test -f "$f" && echo "OK: $f" || echo "MISSING: $f"
done

# Verify DB migrations count
ls supabase/migrations/*.sql 2>/dev/null | wc -l
# Expected: 12

# Verify shared-types status
ls packages/shared-types/src/ 2>/dev/null || echo "shared-types is empty (acceptable — documented in manifest)"
```

## Freeze Status

| Scope | Status | Date | Notes |
|-------|--------|------|-------|
| Data Models | FROZEN | 2026-02-27 | v2.0.0 — 11 tables, 3 functions fully documented |
| Events | FROZEN | 2026-02-27 | v2.0.0 — 6 active events, ~80 IPC commands documented |
| RBAC | FROZEN | 2026-02-27 | v2.0.0 — 3 DB roles, 3 app roles, 3 subscription tiers |
| UI Contracts | FROZEN | 2026-02-27 | v2.0.0 — 6 shared-ui components, 5 desktop screens, 8 web routes |
| DB Schema | FROZEN | 2026-02-27 | 12 migrations, no changes planned |
| Shared Types | NOT FROZEN | — | `packages/shared-types/` is empty; types are inline per component |

## Freeze Changelog (v1.0.0 → v2.0.0)

### Audit Date: 2026-02-27
### Auditor: Automated (DICE v3.6 Wave 0.5)

### `domain_models.md` — Major corrections
- **Added 5 undocumented tables:** `streaming_transcripts`, `live_suggestions`, `action_items`, `contextual_insights`, `context_analyses`
- **Fixed ~40 missing/wrong columns** across 6 existing tables (FK targets, column names, CHECK constraints, missing fields)
- **Key corrections:** All FKs reference `auth.users(id)` not `profiles(id)`; `stripe_payment_id` → `stripe_payment_intent_id`; `duration_ms` → `duration` (seconds); removed nonexistent `plan` column from subscriptions; `push_subscriptions.keys JSONB` → separate `p256dh` + `auth` TEXT columns
- **Added:** RLS policies, indexes, database functions, triggers per table

### `events.md` — Complete rewrite
- **Removed 3 phantom events** that don't exist in source code: `audio-level`, `agent-update`, `ocr-result`
- **Added 6 actual events** from Rust source: `voice-status`, `speech-transcript`, `voice-response`, `streaming-event`, `audio-metrics`, `global-dictation-toggle`
- **Fixed `streaming-event` payload:** Documented all 9 fields and 9 event_type values (was only 3)
- **Fixed all IPC command names:** 5 of 6 were wrong (e.g., `start_streaming` → `start_streaming_session`)
- **Added ~80 IPC commands** organized by category

### `rbac_matrix.md` — Accuracy corrections + new sections
- **Fixed `contextual_insights`:** READ → CRUD (actual RLS allows full CRUD)
- **Added `context_analyses`:** Was completely missing
- **Added `push_subscriptions` service_role policy**
- **New section: Application Roles** (`user`, `admin`, `superuser`) — client-side only, no server enforcement
- **New section: Subscription Tiers** (`free`, `pro`, `enterprise`) with limits — not enforced at API/DB level
- **New section: Known Gaps & Risks** — 6 security findings documented

### `ui_contracts.md` — Scope fix + new components
- **Fixed critical scope mismatch:** v1.0 documented desktop-app panels as shared-ui components (they aren't)
- **Added 6 actual shared-ui components** (CMP-SHARED-AGENT-001 through 006) with full props from source
- **Documented shared-types gap:** `packages/shared-types/` is empty; `QuickAction` duplicated 3x

### Security findings documented (not fixed — documentation only)
- Alert API: zero authentication (SSRF risk via arbitrary URL endpoints)
- Agent Core API: zero authentication (hardcoded user_id)
- Push notification auth: substring match instead of exact comparison
- Feature-gating: declared but never enforced at any layer

