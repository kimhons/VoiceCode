# Project Conventions

## Two distinct workspaces — confirm before writing

This repository contains TWO mobile codebases. Don't conflate them:

1. **`VoiceCode/apps/mobile/`** — Inside the pnpm/turbo monorepo. Shares `packages/shared*` with desktop/web. Use `monorepo-mobile-builder` agent.
2. **`VoiceCode/VoiceCodeMobile/`** — Standalone Expo project. Redux Toolkit + `@react-navigation/native` v7. Has its own `package.json` and `node_modules`. Use `standalone-mobile-engineer` agent.

If unclear which the user means, ASK before writing code.

## Inner monorepo structure (`VoiceCode/VoiceCode/`)
```
apps/
  desktop/        Tauri 1.8 (Rust + React) — primary app
  web/            React + Vite
  mobile/         React Native + Expo (monorepo-mobile)
  api/            Express alert API
packages/
  shared/         shared
  shared-types/   shared types
  shared-ui/      shared UI components
  shared-utils/   shared utilities
services/
  agent-core/     Python LangGraph
  ai-processor/   Python AI pipeline
  voice-engine/   Node.js voice processing
extensions/
  voiceflow-vscode/   VS Code extension (primary)
  vscode/             VS Code extension (verify scope)
supabase/         DB migrations + edge functions + Stripe payment flow
infrastructure/   Docker, Terraform, K8s
```

## Backup directories — DO NOT EDIT
- `VoiceCode_Backup_20260103_211606` — restore point
- `VoiceCode.worktrees/` — active git worktrees from in-progress branches; only the relevant branch is yours

## Hard rules
- pnpm + turbo for the inner monorepo (`VoiceCode/VoiceCode/`)
- Plain npm for `VoiceCodeMobile/` (standalone)
- `npx expo install` for Expo packages (both mobile codebases)
- Cargo for Rust side; no direct `rustc` invocations
- Cross-platform desktop testing (Windows / macOS / Linux) — at least 2 before merge
- Two state libs in play (Redux Toolkit in `VoiceCodeMobile/`, possibly different in `apps/mobile`) — don't unify without ADR

## Privacy posture
Voice + screen + code are all sensitive. Hard rules across the stack:
- No raw audio bytes in logs (metadata only — duration, format, provider)
- No raw screen captures in logs
- No raw code content in LLM telemetry (truncate or hash)
- Privacy-mode windows respected on capture
- Computer-use actions gated by explicit consent
