# Wireframe: SCR-WEB-DASHBOARD

**Screen ID**: SCR-WEB-DASHBOARD
**Platform**: Web
**Route**: `/app` (or `/dashboard`)
**Flow**: —
**Priority**: P0 — Main entry point for web users

## Layout (ASCII)

```
+------------------------------------------------------------------+
|  [Logo] VoiceCode          [Search]     [Notifications] [Avatar]  |
+------------------------------------------------------------------+
|  Sidebar    |                                                    |
|  ---------  |   Welcome back, {name}                              |
|  Dashboard  |   -------------------------------------------------|
|  Transcribe |   [Recent transcripts list or empty state]          |
|  Editor     |   - Transcript 1 — 2026-02-27 — 2:34               |
|  Export     |   - Transcript 2 — 2026-02-26 — 15:00              |
|  Settings   |   [New recording CTA]                               |
|  ---------  |                                                    |
|  Upgrade    |   Quick actions: [Record] [Upload] [New]            |
+------------------------------------------------------------------+
```

## Components

- App shell (header + sidebar)
- User greeting
- Recent transcripts list or empty state
- Primary CTA: New recording / Transcribe
- Quick actions: Record, Upload, New

## Data displayed

- User name (from profile)
- Recent transcripts (title, date, duration)
- Subscription tier (if upgrade visible)

## References

- `docs/ssot/UI-UX-BLUEPRINT.md` — Web screens
- `docs/contracts/ui_contracts.md` — Component contracts
