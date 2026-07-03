# Wireframe: SCR-DESK-CODING

**Screen ID**: SCR-DESK-CODING
**Platform**: Desktop (Tauri)
**Flow**: FLOW-VOICE-CODE
**Priority**: P0 — Voice-to-code UX

## Layout (ASCII)

```
+------------------------------------------------------------------+
|  Coding Assistant                                    [Collapse]  |
+------------------------------------------------------------------+
|  Voice / Text input:                                             |
|  +--------------------------------------------------------+      |
|  | [Mic] "Create a function that validates email"   [Send]|      |
|  +--------------------------------------------------------+      |
|                                                                  |
|  Context: main.ts (TypeScript) • branch: main                     |
|  -----------------------------------------------------------------|
|  Generated code:                                                 |
|  +--------------------------------------------------------+      |
|  | function isValidEmail(s: string): boolean {            |      |
|  |   return /^[^@]+@[^@]+\.[^@]+$/.test(s);                |      |
|  | }                                                        |      |
|  +--------------------------------------------------------+      |
|  [Insert] [Replace] [Undo]  Suggestions: [Apply 1] [Apply 2]     |
|  -----------------------------------------------------------------|
|  Status: Ready | Last: 234 ms                                    |
+------------------------------------------------------------------+
```

## Components

- Voice/text input (mic + text field + send)
- Screen context line (file, language, git branch)
- Generated code block (syntax-highlighted)
- Actions: Insert, Replace, Undo
- Suggestion chips (if multiple)
- Status / latency

## Data displayed

- VoiceCommand / intent
- Generated code (from LLM or template)
- Undo history
- Confidence / status

## References

- FLOW-VOICE-CODE in `docs/ssot/UI-UX-BLUEPRINT.md`
- `docs/contracts/events.md` — voice-response, speech-transcript
