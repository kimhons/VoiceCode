# VoiceCode — UI Contracts

> Version: 1.0.0 | Generated: 2026-02-26 | Blueprint Forge OS™

---

## Desktop Screens

| ID | Screen | Shortcut | Props/State | REQ |
|----|--------|----------|-------------|-----|
| SCR-DESKTOP-CODING | CodingAssistantPanel | Ctrl+Shift+C | mode, result, history, onSubmit, onUndo | REQ-CODE-0001 |
| SCR-DESKTOP-AGENT | AgentControlPanel | Ctrl+Shift+G | agents, strategy, task, history | REQ-AGENT-0001 |
| SCR-DESKTOP-VISION | VisionPanel | Ctrl+Shift+V | image, ocrTier, ocrResult, onCapture | REQ-VISION-0001 |
| SCR-DESKTOP-AI | AIFeaturesPanel | Ctrl+Shift+A | text, features, onProcess | REQ-DESKTOP-0002 |
| SCR-DESKTOP-DICTATION | FloatingDictationButton | Ctrl+Shift+D | isRecording, onToggle | REQ-VOICE-0001 |

## Web Routes

| Route | Page | Auth Required | REQ |
|-------|------|--------------|-----|
| `/` | LandingPage | No | REQ-WEB-0001 |
| `/login` | LoginPage | No | REQ-AUTH-0001 |
| `/signup` | SignupPage | No | REQ-AUTH-0002 |
| `/dashboard` | DashboardPage | Yes | REQ-WEB-0002 |
| `/pricing` | PricingPage | No | REQ-PAY-0001 |
| `/settings/*` | SettingsPanel | Yes | REQ-WEB-0003 |
| `/analytics/*` | AnalyticsDashboard | Yes | REQ-WEB-0004 |
| `/medical/*` | Medical pages | Yes | REQ-WEB-0005 |
| `/monitoring` | MonitoringPage | Yes | REQ-WEB-0006 |

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#1e1e2e` | Panel background (Catppuccin dark) |
| `--text-primary` | `#cdd6f4` | Primary text |
| `--accent` | Tailwind classes | Accent colors via Tailwind |
| CSS prefix: `cap-` | CodingAssistant | BEM-like component scoping |
| CSS prefix: `acp-` | AgentControl | BEM-like component scoping |
| CSS prefix: `vp-` | Vision | BEM-like component scoping |

---

*All UI contracts derived from component source files and CLAUDE.md style guide.*
