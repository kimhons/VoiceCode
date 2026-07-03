---
name: multi-platform-feature
description: "Ship a user-facing feature across all 4 surfaces: desktop, web, monorepo-mobile, VS Code extension."
lead: tauri-react-builder
agents: [tauri-react-builder, tauri-rust-engineer, vite-web-builder, monorepo-mobile-builder, vscode-extension-builder]
---

# Multi-Platform Feature Team

## Mission
A feature that needs to land on every VoiceCode surface — desktop (Tauri), web (Vite), mobile (Expo in monorepo), VS Code extension.

## Workflow
1. Shared types/UI added to `packages/shared-types` + `packages/shared-ui` if reusable
2. **tauri-rust-engineer** + **tauri-react-builder** ship the desktop version (usually the lead surface)
3. **vite-web-builder** ports to web — adjust for browser constraints (Web Speech API instead of native STT)
4. **monorepo-mobile-builder** ports to mobile — adjust for touch + permissions
5. **vscode-extension-builder** exposes the feature via a VS Code command if applicable

## Surface differences (per platform)
| Surface | STT | Code apply | Screen context |
|---|---|---|---|
| Desktop | Deepgram/Whisper (native) | Direct file write | Native window capture |
| Web | Web Speech API | Copy-paste or upload | Limited (no native FS) |
| Mobile | Native (Expo audio) | Shareable text output | None |
| VS Code ext | Defers to desktop app | Direct editor API | VS Code workspace API |

## Exit criteria
- Feature works on all surfaces (with platform-appropriate UX)
- Shared types/UI updated where reusable
- Tests at every surface
- Screenshots on relevant platforms (desktop / web / android / ios)

## Hard rules
- Don't fork shared types per platform — one source of truth in `packages/shared-types`
- Don't force a desktop UX onto web/mobile when platform conventions differ
- VS Code extension features must work without the desktop app running (if standalone) OR clearly require it (with helpful error)
- This is `apps/mobile` (in the monorepo) — NOT `/VoiceCodeMobile/` (separate project)
