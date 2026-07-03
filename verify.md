# Verification Evidence — tooling repair + voiceflow→voicecode rebrand

**Feature:** monorepo tooling repair + rebrand  ·  **Commit:** 56cb586  ·  **Branch:** chore/e2e-smoke-and-security-gating  ·  **PR:** #1

## Checked (with evidence)
| What | Command / method | Result |
|---|---|---|
| Workspace resolution | `pnpm install` (project-scoped build approvals) | exit 0, 5 workspaces, pnpm-lock.yaml generated |
| Type check | `pnpm run type-check` (turbo) | ✅ 3 tasks successful, 0 TS errors (FR-004) |
| Lint | `pnpm run lint` (turbo) | ✅ 3 tasks successful, 0 errors / 0 warnings (FR-005) |
| Rust | `cargo check` (apps/desktop/src-tauri) | ✅ 0 errors, 2 non-blocking warnings (FR-006) |
| Artifacts untracked | `git ls-files \| grep target/\|coverage/` | 0 tracked (1354 removed) (FR-003) |
| Requirement coverage | `abs_ctl.py coverage` | 7/7 requirements → tasks (100%) |
| Spec integrity | `abs_ctl.py lock` | locked @ fff0d4330137, no `[NEEDS CLARIFICATION]`, no drift |

## NOT checked (and why)
- `pnpm run test` — mobile jest can't transform React Native (`SyntaxError: ErrorHandler`, babel/jest RN preset); 218 suites can't run. Pre-existing, OUT OF SCOPE (spec Boundaries).
- `desktop`/`web` production builds — pre-existing `ELIFECYCLE` failures, separate investigation.
- `@voicecode/api` tests — pre-existing failure.
- Cross-platform desktop (Windows/Linux) — not run in this environment.

## Residual risks
- The static pipeline is green but the build/test layer is red (pre-existing). This branch is NOT production-mergeable until those follow-ups are resolved — tracked on PR #1.
- Rebrand touched 461 source files; verified via type-check + lint, not runtime.

## Verdict
CONVERGED for the stated scope (FR-001…FR-007 all met): tooling repaired, rebrand complete,
static verification green. Build/test remediation is explicitly deferred follow-up work.
