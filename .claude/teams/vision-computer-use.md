---
name: vision-computer-use
description: "Screen capture, OCR, computer-use automation, browser agent — the vision axis."
lead: vision-ocr-engineer
agents: [vision-ocr-engineer, tauri-rust-engineer, coding-agent-engineer, tauri-react-builder]
---

# Vision + Computer Use Team

## Mission
The screen-understanding + automation axis. Capture what the user sees, extract structure, optionally drive the screen via mouse/keyboard.

## Workflow
1. **vision-ocr-engineer** owns screen capture + OCR + computer-use primitives in Rust
2. **tauri-rust-engineer** exposes Tauri commands that frontend can invoke (with permission gates)
3. **coding-agent-engineer** integrates vision context into prompts (e.g., "what's on my screen?")
4. **tauri-react-builder** builds the VisionPanel UI + permission/confirm prompts

## Safety surfaces (this team owns)
- macOS Screen Recording permission flow
- macOS Accessibility permission flow (for computer use)
- Windows UAC / UIAccess flag
- Linux X11 vs Wayland (Wayland restricts capture significantly)
- Trusted-mode toggle: when ON, computer use proceeds without per-action confirm
- Privacy-mode windows: explicitly skipped from capture

## Exit criteria
- Capture works on all 3 platforms with explicit permission flows
- OCR accuracy measured on a fixture set (don't ship without numbers)
- Computer-use actions all gated behind explicit confirmation OR trusted-mode
- Browser agent (if part of scope) drives a target browser reliably
- Tests using fixture screenshots — no live capture in CI

## Hard rules
- **No silent automation.** Every click/keystroke driven by computer use is logged with intent
- Privacy windows respected — `kCGWindowSharingNone` on macOS, equivalent elsewhere
- OCR results follow same privacy rules as STT (no raw content in logs)
- Computer use kill-switch: a global hotkey (Esc + something) immediately stops automation
- Cross-platform tests run in CI; per-platform tests in nightly
