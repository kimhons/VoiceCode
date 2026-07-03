# Wireframe: SCR-MOB-HOME

**Screen ID**: SCR-MOB-HOME
**Platform**: Mobile (Expo / React Native)
**Flow**: —
**Priority**: P0 — Mobile entry point

## Layout (ASCII)

```
+---------------------------+
|  VoiceCode      [Profile] |
+---------------------------+
|                           |
|  Hello, {name}            |
|                           |
|  +-----------------------+|
|  |  [  ●  Start Record  ]||
|  +-----------------------+|
|                           |
|  Recent                   |
|  -------------------------|
|  • Meeting notes  2/27    |
|  • Interview     2/26     |
|  • Draft         2/25     |
|  -------------------------|
|  [See all]                |
|                           |
+---------------------------+
| [Home] [Record] [Library] [Settings]  (tab bar)
+---------------------------+
```

## Components

- Header (app name, profile/settings)
- Greeting
- Primary CTA: Start recording
- Recent items list (transcripts or recordings)
- Bottom tab nav: Home, Record, Library, Settings

## Data displayed

- User name
- Recent items (title, date)
- Optional subscription/upgrade prompt

## References

- `docs/ssot/UI-UX-BLUEPRINT.md` — Mobile screens
- REQ-MOBILE-0001 (home + navigation)
