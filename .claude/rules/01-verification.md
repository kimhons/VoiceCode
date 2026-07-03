# Verification Commands

Global protocol: `~/.claude/rules/verification-protocol.md`. VoiceCode has multiple workspaces — pick the right command set.

## VoiceCode/ (inner monorepo — pnpm + turbo)
Run from `VoiceCode/VoiceCode/`:

| Step | Command |
|---|---|
| Lint (all) | `npm run lint` (turbo) |
| Type check (all) | `npm run type-check` |
| Tests (all) | `npm run test` |
| E2E (all) | `npm run test:e2e` |
| Build (all) | `npm run build` |
| Desktop dev | `npm run desktop:dev` |
| Desktop build | `npm run desktop:build` |
| Web dev | `npm run web:dev` |
| Web build | `npm run web:build` |
| Mobile (monorepo) | `npm run mobile:start` / `mobile:android` / `mobile:ios` |
| API dev | `npm run api:dev` |
| Clean | `npm run clean` |

### Desktop (Tauri) extras
From `VoiceCode/VoiceCode/apps/desktop/`:
- Rust check: `cd src-tauri && cargo check`
- Clippy: `cd src-tauri && cargo clippy -- -D warnings`
- Rust tests: `cd src-tauri && cargo test`
- AI feature: `cargo check/test/build --features ai-ml-api`

### Python services
From `VoiceCode/VoiceCode/services/<svc>/`:
- Tests: `pytest`
- Lint: `ruff check .`
- Format: `ruff format .`

### Supabase
From `VoiceCode/VoiceCode/supabase/`:
- Local: `supabase start` then `supabase functions serve`
- Deploy: `pwsh ./deploy-functions.ps1`

## VoiceCodeMobile/ (standalone — NOT in monorepo)
Run from `VoiceCode/VoiceCodeMobile/`:

| Step | Command |
|---|---|
| Start | `npm start` (expo) |
| Android | `npm run android` |
| iOS | `npm run ios` |
| Test | `npm test` (jest) |
| Coverage | `npm run test:coverage` |
| Lint | `npm run lint` |
| Type check | `npm run type-check` |
| Build (EAS) | `npm run build:android` / `build:ios` / `build:all` |
| Submit (EAS) | `npm run submit:android` / `submit:ios` |
| OTA update | `npm run update` |

## Critical paths (100% coverage targets)
- STT streaming pipeline (`apps/desktop/src-tauri/src/streaming.rs`)
- Coding agent intent classifier (`coding_agent.rs`)
- Supabase RLS policies on user data tables
- Stripe webhook handlers (if any) in `supabase/functions/`
- Computer-use safety gates in `vision/`
