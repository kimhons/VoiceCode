# Wireframe: SCR-DESK-MAIN

**Screen ID**: SCR-DESK-MAIN
**Platform**: Desktop (Tauri)
**Route**: Main window
**Flow**: FLOW-VOICE-RECORD
**Priority**: P0 — Desktop main interface

## Layout (ASCII)

```
+------------------------------------------------------------------+
|  VoiceCode Desktop                    [−] [□] [×]                |
+------------------------------------------------------------------+
|  Tabs: [Coding] [Agent] [Vision] [AI Features] [Dictation]       |
+------------------------------------------------------------------+
|                                                                  |
|  (Active tab content — default: Coding or floating panels)       |
|                                                                  |
|  - Coding: Voice input, code output, undo, suggestions            |
|  - Agent: Task input, strategy select, agent list, history       |
|  - Vision: Screen capture, OCR tier, extracted text               |
|  - AI: Text processing, summarization, enhancement                |
|  - Dictation: Global dictation toggle, language                  |
|                                                                  |
|  Shortcuts: Ctrl+Shift+C (Coding), Ctrl+Shift+G (Agent),         |
|             Ctrl+Shift+V (Vision), Ctrl+Shift+A (AI),             |
|             Ctrl+Shift+D (Dictation)                              |
+------------------------------------------------------------------+
```

## Components

- Main window chrome
- Tab bar: 5 panels (Coding, Agent, Vision, AI Features, Dictation)
- Panel content per tab
- Optional floating dictation button

## Data displayed

- Screen context (active editor, file, language) when Coding
- Agent status and history when Agent
- OCR result when Vision
- Session state for each panel

## References

- `docs/ssot/SSOT.md` — REQ-DESKTOP-0001 (5 panels)
- `docs/contracts/ui_contracts.md` — Desktop screens
