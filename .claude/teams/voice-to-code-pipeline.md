---
name: voice-to-code-pipeline
description: "End-to-end voice-to-code flow: STT → intent → code-gen → applied edit. The core product loop."
lead: coding-agent-engineer
agents: [stt-provider-engineer, coding-agent-engineer, tauri-rust-engineer, tauri-react-builder, vision-ocr-engineer]
---

# Voice-to-Code Pipeline Team

## Mission
Ship features along VoiceCode's core loop: user speaks → STT transcribes → coding agent classifies + generates → Rust applies → React updates UI.

## Workflow
1. **stt-provider-engineer** owns the audio → text segment (streaming or batch)
2. **vision-ocr-engineer** provides screen context (active file, language, cursor position)
3. **coding-agent-engineer** classifies the intent + builds the prompt + invokes LLM
4. **tauri-rust-engineer** wires the new Tauri commands + handles state + applies edits
5. **tauri-react-builder** updates the UI panels (CodingAssistantPanel) to surface results

## Latency budget (live dictation)
- STT first partial: < 300ms
- Intent classify: < 100ms
- Code-gen first token: < 1.5s
- Apply edit: < 200ms
- **Total perceived**: < 2s for short utterances

## Exit criteria
- Pipeline works for at least one new intent class end-to-end
- Streaming partials surfaced in UI (no "waiting for the whole thing")
- Cancellation works (user pauses → pipeline stops cleanly)
- Tests at every layer
- Telemetry on each stage's latency (so regressions get caught)

## Hard rules
- Privacy: audio + code context never logged in plaintext beyond debug builds
- Cancellation honored at every stage (channels closed, LLM aborted, edits not applied)
- Destructive intents (git push, file delete, etc.) require explicit user confirmation in UI
- Template fallback path always present — works without API key
