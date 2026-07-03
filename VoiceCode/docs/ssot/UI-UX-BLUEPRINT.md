# VoiceCode UI/UX Blueprint

> DICE v3.6 Step 4 | Multimodal: Web + Mobile + Desktop
> Generated: 2026-02-26

## 1. Personas & RBAC

### Persona: Developer (Primary)
- Uses voice commands to write/edit/refactor code
- Needs: fast STT, code intelligence, multi-agent orchestration
- Platforms: Desktop (primary), Web, Mobile (review/monitoring)

### Persona: Medical Professional
- Uses voice dictation for clinical documentation
- Needs: medical vocabulary, SOAP notes, HIPAA compliance, EHR integration
- Platforms: Web (primary), Mobile (bedside), Desktop

### Persona: General User
- Uses voice-to-text for meetings, notes, memos
- Needs: accurate transcription, summaries, export, collaboration
- Platforms: Web, Mobile

### RBAC Scopes
| Role | Capabilities |
|------|-------------|
| free | Record, transcribe (limited), basic export |
| pro | Unlimited transcription, AI features, medical mode, collaboration |
| enterprise | Team management, SSO, audit logs, workspace isolation, compliance |
| admin | All + user management, billing, analytics |

Ref: `docs/contracts/rbac_matrix.md`

## 2. Shared Flow Catalog

### FLOW-VOICE-RECORD
- Intent: Capture audio and produce transcript
- Start: User taps/clicks record button
- Steps: Init audio → Start capture → Show waveform → Stop → Process STT → Show transcript
- End: Transcript displayed with confidence scores
- Branches: Pause/resume, cancel, streaming (real-time) vs batch
- APIs: Desktop IPC (`start_recording`, `stop_recording`, `transcribe_audio_*`), Web (WebSocket streaming), Mobile (expo-av)
- DMs: DM-Transcript, DM-StreamingTranscript
- Tests: TEST-VOICE-RECORD-*

### FLOW-AI-ANALYZE
- Intent: Apply AI analysis to transcript (summarize, key points, action items, sentiment)
- Start: User selects transcript + analysis type
- Steps: Select transcript → Choose analysis → Process via LLM → Display results
- End: Analysis results displayed
- APIs: Agent Core `/api/v1/agent/chat` or `/api/v1/agent/command`
- DMs: DM-Transcript, DM-ActionItem, DM-LiveSuggestion
- Tests: TEST-AI-*

### FLOW-EXPORT
- Intent: Export transcript to external format
- Start: User selects export format
- Steps: Select transcript → Choose format (PDF/DOCX/TXT/SRT/VTT/JSON) → Configure options → Generate → Download/share
- End: File downloaded or shared
- APIs: Client-side generation (jspdf, docx libs)
- DMs: DM-Transcript
- Tests: TEST-EXPORT-*

### FLOW-AUTH
- Intent: User authentication
- Start: User visits login/signup
- Steps: Enter credentials → Supabase auth → JWT issued → Redirect to app
- End: Authenticated session
- APIs: Supabase Auth
- DMs: DM-Profile
- Tests: TEST-AUTH-*

### FLOW-PAYMENT
- Intent: Subscribe to paid plan
- Start: User clicks upgrade
- Steps: Select plan → Stripe Checkout → Webhook confirms → Update profile tier
- End: Subscription active
- APIs: Supabase edge functions (create-checkout-session, stripe-webhook)
- DMs: DM-Subscription, DM-Payment, DM-Profile
- Tests: TEST-PAY-*

### FLOW-VOICE-CODE (Desktop Only)
- Intent: Convert voice command to code action
- Start: User speaks coding command
- Steps: Capture audio → STT → Intent classify → Parse command → Safety gate → Execute (LLM or template) → Insert result
- End: Code inserted/modified in editor
- APIs: Desktop IPC (coding_agent::*, code_intelligence::*)
- DMs: VoiceCommand, CodingCommand
- Tests: TEST-CODE-*
- Platform override: FLOW-VOICE-CODE-OVERRIDE-DESKTOP (exclusive to desktop)

### FLOW-COLLABORATION
- Intent: Real-time team collaboration on transcripts
- Start: User shares transcript or invites collaborator
- Steps: Share link → Collaborator joins → Real-time editing → Comments → Save
- End: Shared transcript with all edits
- APIs: Supabase Realtime
- DMs: DM-Transcript
- Tests: TEST-COLLAB-*

## 3. Platform Screen Inventories

### 3.1 Web Screens (SCR-WEB-*)

| Screen ID | Route | FLOW | Status |
|-----------|-------|------|--------|
| SCR-WEB-LANDING | `/` | — | DONE |
| SCR-WEB-PRICING | `/pricing` | FLOW-PAYMENT | DONE |
| SCR-WEB-LOGIN | `/login` | FLOW-AUTH | DONE |
| SCR-WEB-SIGNUP | `/signup` | FLOW-AUTH | DONE |
| SCR-WEB-DASHBOARD | `/app` | — | DONE |
| SCR-WEB-TRANSCRIBE | `/transcribe` | FLOW-VOICE-RECORD | DONE |
| SCR-WEB-EDITOR | `/editor` | FLOW-AI-ANALYZE | DONE |
| SCR-WEB-EXPORT | `/export` | FLOW-EXPORT | DONE |
| SCR-WEB-MEDICAL-DICTATION | `/medical/dictation` | FLOW-VOICE-RECORD | DONE |
| SCR-WEB-SOAP | `/medical/soap-notes` | FLOW-AI-ANALYZE | DONE |
| SCR-WEB-SETTINGS | `/settings` | — | DONE |
| SCR-WEB-ANALYTICS | `/analytics` | — | DONE |
| SCR-WEB-TEAM | `/team` | FLOW-COLLABORATION | DONE |
| SCR-WEB-INTEGRATIONS | `/integrations` | — | DONE |
| SCR-WEB-CHAT | `/chat` | FLOW-AI-ANALYZE | DONE |
| SCR-WEB-SEARCH | `/search` | — | DONE |
| SCR-WEB-RECORDINGS | `/recordings` | FLOW-VOICE-RECORD | DONE |
| SCR-WEB-PROFILE | `/profile` | — | DONE |

(18 key screens listed; 19 more protected routes exist — see repo_inventory.md for full list)

### 3.2 Desktop Screens (SCR-DESK-*)

| Screen ID | Panel/Toggle | FLOW | Status |
|-----------|-------------|------|--------|
| SCR-DESK-MAIN | App.tsx (always) | FLOW-VOICE-RECORD | DONE |
| SCR-DESK-CODING | CodingAssistantPanel | FLOW-VOICE-CODE | DONE |
| SCR-DESK-AGENTS | AgentControlPanel | — | DONE |
| SCR-DESK-VISION | VisionPanel | — | DONE |
| SCR-DESK-CODEINTEL | CodeIntelligenceDashboard | — | DONE |
| SCR-DESK-AI | AIFeaturesPanel | FLOW-AI-ANALYZE | DONE |
| SCR-DESK-PRICING | PricingModal | FLOW-PAYMENT | DONE |
| SCR-DESK-DICTATION | GlobalDictationSettings | FLOW-VOICE-RECORD | DONE |

### 3.3 Mobile Screens (SCR-MOB-*) — Key Screens

| Screen ID | Path | FLOW | Status |
|-----------|------|------|--------|
| SCR-MOB-HOME | home/HomeScreen | — | DONE |
| SCR-MOB-RECORD | home/RecordingScreen | FLOW-VOICE-RECORD | DONE |
| SCR-MOB-TRANSCRIPTION | home/TranscriptionScreen | FLOW-VOICE-RECORD | DONE |
| SCR-MOB-LOGIN | auth/LoginScreen | FLOW-AUTH | DONE |
| SCR-MOB-SIGNUP | auth/SignupScreen | FLOW-AUTH | DONE |
| SCR-MOB-AI-SUMMARY | ai/AISummaryScreen | FLOW-AI-ANALYZE | DONE |
| SCR-MOB-MEDICAL-DICT | medical/MedicalDictationScreen | FLOW-VOICE-RECORD | DONE |
| SCR-MOB-SOAP | medical/SOAPNotesScreen | FLOW-AI-ANALYZE | DONE |
| SCR-MOB-EXPORT | export/ExportOptionsScreen | FLOW-EXPORT | DONE |
| SCR-MOB-SETTINGS | settings/* | — | DONE |
| SCR-MOB-LIBRARY | library/LibraryScreen | — | DONE |
| SCR-MOB-COLLAB | collaboration/CollaborationHubScreen | FLOW-COLLABORATION | DONE |
| SCR-MOB-PRICING | pricing/PricingScreen | FLOW-PAYMENT | DONE |
| SCR-MOB-PROFILE | profile/ProfileScreen | — | DONE |
| SCR-MOB-SEARCH | search/SearchScreen | — | DONE |

(15 key screens listed; 135+ more exist — see repo_inventory.md §2.4)

## 4. Wireframes

All wireframes live under `docs/ssot/wireframes/`. See `docs/ssot/wireframes/INDEX.md`.

Current status: WIRE-TBD for all screens. No wireframe artifacts exist in the repository.

GAP-WIREFRAMES: Create wireframes for key screens. TASK-DOCS-0010 tracks this.

## 5. Screen Card Template

Every SCR-* should eventually have a full card with:
- Screen ID, purpose, roles, platform
- Entry/exit conditions
- UI states (loading/empty/error/offline/success)
- User actions + system actions
- Components (CMP-*), Data (DM-*), Endpoints (API-*)
- Workflow links (WF/STATE/GATE)
- Edge cases (EDGE-*), Tests (TEST-*)
- File evidence, Traceability (REQ-* + TASK-*)

Full screen cards will be created per-module as implementation tasks proceed. For now, the Screen Inventory tables above serve as the index with FLOW mappings.

## 6. Shared Components

| Component ID | Name | Platforms | Purpose |
|-------------|------|-----------|---------|
| CMP-SHARED-AGENT-PALETTE | AgentCommandPalette | Web, Desktop | Agent command palette UI |
| CMP-SHARED-AGENT-FAB | AgentFAB | Web, Mobile | Floating action button for agent |
| CMP-SHARED-AGENT-INLINE | AgentInlineAssist | Web, Desktop | Inline agent assistance |
| CMP-SHARED-AGENT-QUICK | AgentQuickActions | Web, Desktop | Quick action buttons |
| CMP-SHARED-AGENT-BANNER | AgentSuggestionBanner | Web, Mobile | Suggestion banner |

Source: `packages/shared-ui/src/agent/`
