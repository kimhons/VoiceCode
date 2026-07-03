# SPEC — Monorepo tooling repair + voiceflow→voicecode rebrand

## Objective
Restore the inner monorepo (`VoiceCode/VoiceCode/`, pnpm + turbo) to a buildable,
verifiable state and complete the voiceflow→voicecode rebrand, without regressing the
static-verification pipeline.

## Requirements
- FR-001: The monorepo SHALL declare a canonical package manager (pnpm) and remove conflicting lockfiles so `pnpm install` resolves workspaces deterministically.
- FR-002: `turbo.json` SHALL use the turbo v2 `tasks` key so `type-check`, `lint`, `test`, and `build` are runnable.
- FR-003: Committed build artifacts (`target/`, `coverage/`) SHALL be untracked and git-ignored.
- FR-004: `pnpm run type-check` SHALL pass with zero TypeScript errors across all workspaces.
- FR-005: `pnpm run lint` SHALL pass with zero errors and zero warnings across all workspaces.
- FR-006: The desktop Tauri crate SHALL pass `cargo check` with zero errors.
- FR-007: The voiceflow→voicecode rebrand SHALL be applied across source and docs without introducing type or lint errors.

## Boundaries
- Build/test failures for `mobile`/`api`/`web` that are PRE-EXISTING and unrelated to tooling/rebrand are OUT OF SCOPE here (tracked as follow-ups on PR #1).
- No behavioral/runtime changes beyond the rename and type-annotation fixes.

## Testing strategy
- Verify command: `cd VoiceCode && pnpm run type-check && pnpm run lint`
  (Rust: `cd VoiceCode/apps/desktop/src-tauri && cargo check`)

## Done =
`pnpm run type-check` and `pnpm run lint` both exit 0 (3/3 tasks each), `cargo check`
reports 0 errors, and the rebrand is complete with no new type/lint findings.
