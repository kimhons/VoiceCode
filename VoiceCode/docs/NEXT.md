# VoiceCode — What's Next (Developer Runbook)

**Last updated**: 2026-02-27
**Role**: Project developer priorities after analysis.

---

## Immediate (this week)

| #   | Task                | Status                          |
| --- | ------------------- | ------------------------------- |
| 1   | Confirm CI green    | Push and verify 6 jobs          |
| 2   | Placeholder API key | Done (RecordingScreen env-only) |
| 3   | Sync health_metrics | Done (22 tests, wireframes)     |

---

## Short-term — Done (Wave 2–3)

| #   | Task              | Status                                                                |
| --- | ----------------- | --------------------------------------------------------------------- |
| 4   | GAP-AUTH-API      | Done — optional `API_SECRET`; when set, require `x-api-key` or Bearer |
| 5   | GAP-SSRF          | Done — private/local URLs blocked; 403 + test                         |
| 6   | Sanitize raw HTML | Done — DOMPurify in AgentChatPanel, ChatPage, TranscriptSearchPage    |
| 7   | GAP-MOCK          | Done — analytics mock gated to dev; VoiceFlow Pro → VoiceCode in App  |

---

## Medium-term (polish)

| #   | Task         | Notes                                            |
| --- | ------------ | ------------------------------------------------ |
| 8   | Triage TODOs | 55+ TODO/FIXME in apps; create issues or resolve |
| 9   | Wireframes   | P0 done (TASK-DOCS-0010); P1/P2 TBD              |

---

## Deferred / backlog

| #   | Task                                       | Why deferred                                               |
| --- | ------------------------------------------ | ---------------------------------------------------------- |
| 10  | GAP-EMPTY-SVC (ai-processor, voice-engine) | Empty stubs; not in ship scope.                            |
| 11  | GAP-2EXT — Consolidate VS Code extensions  | Clarify scope first.                                       |
| 12  | Package manager                            | Repo uses **npm**; keep CI on npm; avoid mixing yarn/pnpm. |

---

## Deploy checklist

See **docs/DEPLOY_CHECKLIST.md** — env, secrets, tests, security, CI, package manager.

---

## Commands to run before merge

```bash
# From repo root (VoiceCode/)
cd apps/desktop && npx tsc --noEmit
cd apps/desktop/src-tauri && cargo test --release --lib
cd apps/web && npm run type-check && npm run lint && npm run build && npm test -- --run
cd apps/api && npm test
cd apps/mobile && npx tsc --noEmit && npm test -- --ci --maxWorkers=2
```

---

## References

- **docs/ANALYSIS_REPORT.md** — Full scorecard, gaps, RALP plan.
- **docs/ssot/SSOT.md** — Requirements, modules, open issues.
- **docs/ssot/MASTER-IMPLEMENTATION-PLAN.md** — Task registry, waves.
- **docs/ssot/health_metrics.md** — Gates, GAPs, quality scorecard.
