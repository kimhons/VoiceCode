# Wireframe: SCR-WEB-TRANSCRIBE

**Screen ID**: SCR-WEB-TRANSCRIBE
**Platform**: Web
**Route**: `/transcribe`
**Flow**: FLOW-VOICE-RECORD
**Priority**: P0 — Core recording experience

## Layout (ASCII)

```
+------------------------------------------------------------------+
|  [Logo] VoiceCode     [Back]                    [Settings] [User]|
+------------------------------------------------------------------+
|                                                                  |
|              +--------------------------------+                   |
|              |     [  ●  Record  ]            |                   |
|              |   Recording / Paused / Idle     |                   |
|              +--------------------------------+                   |
|                                                                  |
|   Waveform:  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  (audio level)     |
|                                                                  |
|   Live transcript:                                               |
|   +--------------------------------------------------------+     |
|   | Interim: "Create a function that validates..."          |     |
|   | Final: "Create a function that validates email."        |     |
|   +--------------------------------------------------------+     |
|                                                                  |
|   [Language] [Mode: Instant / Enhanced / Hybrid] [Vocabulary]     |
|                                                                  |
+------------------------------------------------------------------+
```

## Components

- Record button (start/stop/pause)
- Audio waveform / level indicator
- Live transcript area (interim + final)
- Language and streaming mode selectors
- Optional vocabulary / custom terms

## Data displayed

- Streaming transcript segments (isFinal, text, confidence)
- Audio level (VAD)
- Recording duration

## References

- FLOW-VOICE-RECORD in `docs/ssot/UI-UX-BLUEPRINT.md`
- `docs/contracts/events.md` — streaming-event
