# Wireframe: SCR-MOB-RECORD

**Screen ID**: SCR-MOB-RECORD
**Platform**: Mobile (Expo / React Native)
**Route**: Recording screen (tab or stack)
**Flow**: FLOW-VOICE-RECORD
**Priority**: P0 — Mobile recording

## Layout (ASCII)

```
+---------------------------+
|  [Back]  Recording   [•••] |
+---------------------------+
|                           |
|      ~~~~~~~~~~~~~~~      |
|   (waveform / level)      |
|      ~~~~~~~~~~~~~~~      |
|                           |
|   +-------------------+   |
|   |    [  ●  STOP  ]  |   |
|   +-------------------+   |
|   00:42                  |
|                           |
|   Live transcript:        |
|   +-------------------+   |
|   | "So the next step  |   |
|   |  is to..."         |   |
|   +-------------------+   |
|                           |
|   [Pause] [Quality]       |
|                           |
+---------------------------+
| [Home] [Record] [Library] [Settings]
+---------------------------+
```

## Components

- Header (back, title, menu)
- Waveform / audio level
- Record/Stop button, duration
- Live transcript area
- Pause, quality/settings

## Data displayed

- Recording duration
- Streaming transcript (interim/final)
- Audio level
- Recording status (idle/recording/paused)

## References

- FLOW-VOICE-RECORD
- REQ-MOBILE-0002 (audio recording), REQ-MOBILE-0003 (transcription)
