# VoiceCode

**First voice-directed coding system.** User speaks natural commands ("create a function that validates email") → VoiceCode captures screen context → transcribes via multi-provider STT → classifies intent (13 command types) → invokes the Coding Agent (LLM or template) → applies the result.

## Repository layout

Two distinct workspaces live in this repo. They are NOT the same.

### `VoiceCode/VoiceCode/` — inner monorepo (pnpm + turbo)
```
apps/
  desktop/   Tauri 1.8 (Rust + React) — primary app, 80+ Tauri commands
  web/       React + Vite (Web Speech API for STT)
  mobile/    React Native + Expo 52 (monorepo edition)
  api/       Express + zod alert API
packages/
  shared/  shared-types/  shared-ui/  shared-utils/
services/
  agent-core/      Python + LangGraph multi-agent
  ai-processor/    Python AI pipeline
  voice-engine/    Node.js voice processing
extensions/
  voiceflow-vscode/   VS Code extension
  vscode/             secondary VS Code extension
supabase/            DB migrations + edge functions + Stripe payment flow
infrastructure/      Docker, Terraform, K8s
```

Authoritative project guide: `VoiceCode/VoiceCode/CLAUDE.md`.

### `VoiceCode/VoiceCodeMobile/` — STANDALONE mobile (NOT in monorepo)
Separate Expo project. Redux Toolkit + `@react-navigation/native` v7 + Supabase + `expo-av`. Independent `package.json`, deps, builds.

## Quickstart

### Inner monorepo
```bash
cd VoiceCode/VoiceCode
pnpm install          # turbo + workspaces
npm run desktop:dev   # Tauri dev
npm run web:dev
npm run mobile:start
npm run api:dev
```

### Standalone mobile
```bash
cd VoiceCode/VoiceCodeMobile
npm install
npm start
```

## Claude Code configuration

`.claude/` contains:

| Dir | What |
|---|---|
| `agents/` | 5 generic + 12 specialized agents (tauri-rust, tauri-react, vite-web, monorepo-mobile, standalone-mobile, express-api, stt-provider, coding-agent, vision-ocr, vscode-extension, python-service, supabase-edge-functions) |
| `teams/` | 4 team workflows (voice-to-code-pipeline, multi-platform-feature, ai-services-track, vision-computer-use) |
| `skills/` | 3 generic workflow skills |
| `rules/` | Verification commands + project conventions (covers both workspaces) |
| `hooks/` | Stack-aware post-edit lint |

Global setup at `~/.claude/` covers verification protocol, coding standards, security baseline, and the Expo/React Native rules.

## Critical conventions

- **Two mobile codebases** — confirm which one before writing code
- **Backup dirs** (`VoiceCode_Backup_*`) — read-only
- **Worktrees** (`VoiceCode.worktrees/`) — only your branch is yours
- **Privacy** — no raw audio/screen/code in logs anywhere in the stack
- **Computer-use safety** — every automation action gated by explicit user consent or trusted-mode flag

## When to use which team

| Task | Team |
|---|---|
| Add an intent class or improve voice-to-code latency | `voice-to-code-pipeline` |
| Ship a feature across desktop + web + mobile + VS Code | `multi-platform-feature` |
| Backend AI work — LangGraph node, Supabase function, STT provider | `ai-services-track` |
| Screen capture / OCR / computer-use automation | `vision-computer-use` |


## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

Using gstack skills: After install, skills like /qa, /ship, /review, /investigate,
and /browse are available. Use /browse for all web browsing.
Use ~/.claude/skills/gstack/... for gstack file paths (the global path).
