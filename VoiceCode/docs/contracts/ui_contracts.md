# VoiceCode — UI Contracts

> Version: 2.0.0 | Updated: 2026-02-27 | Blueprint Forge OS™

---

## Shared UI Components (`@voicecode/shared-ui`)

> **Package:** `packages/shared-ui/src/agent/`
> **Barrel export:** `packages/shared-ui/src/agent/index.ts`
>
> **⚠ Shared Types Status:** `packages/shared-types/` is empty — no shared type definitions exist.
> Each component defines its own local interfaces. For example, the `QuickAction` interface is
> defined independently in `AgentCommandPalette.tsx`, `AgentFAB.tsx`, and `AgentQuickActions.tsx`
> with different shapes (different optional fields in each).

---

### CMP-SHARED-AGENT-001: `AgentCommandPalette`

**File:** `packages/shared-ui/src/agent/AgentCommandPalette.tsx`
**Platform:** Web
**Trigger:** `⌘K` / `Ctrl+K` (global keyboard shortcut)

#### Props (`AgentCommandPaletteProps`)

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | Yes | — | Controls palette visibility |
| `onClose` | `() => void` | Yes | — | Called on Escape or backdrop click |
| `onAction` | `(command: string, params?: Record<string, any>) => void` | Yes | — | Called when a quick action is selected |
| `onChat` | `(message: string) => void` | Yes | — | Called when free-text input is submitted |
| `context` | `{ currentPage?: string; transcriptId?: string; transcriptTitle?: string; professionalMode?: string }` | No | `{}` | Contextual information; when `professionalMode === 'medical'`, medical quick actions are prepended |
| `recentActions` | `Array<{ query: string; timestamp: Date }>` | No | `[]` | Recent actions displayed below quick actions |
| `isLoading` | `boolean` | No | `false` | Shows a loading state instead of action list |

#### Local Types

- **`QuickAction`** — `{ id: string; label: string; description?: string; icon?: string; command: string; params?: Record<string, any> }`

#### Built-in Quick Action Presets (module-scoped, not exported)

- `defaultQuickActions` — Summarize, Extract Action Items, Key Points, Search Transcripts
- `medicalQuickActions` — Generate SOAP Note, Progress Note, Discharge Summary, Billing Codes

#### Usage

```tsx
import { AgentCommandPalette } from '@voicecode/shared-ui';
```

---

### CMP-SHARED-AGENT-002: `AgentFAB`

**File:** `packages/shared-ui/src/agent/AgentFAB.tsx`
**Platform:** React Native (Expo) — uses `react-native` + `expo-haptics`
**Export Status:** ⚠ Commented out of barrel export (`index.ts`). Must be imported directly:

```tsx
import { AgentFAB } from '@voicecode/shared-ui/src/agent/AgentFAB';
```

#### Props (`AgentFABProps`)

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onAction` | `(command: string, params?: Record<string, any>) => Promise<any>` | Yes | — | Called when a quick action is tapped (async — triggers haptic success/error feedback) |
| `onChat` | `(message: string) => void` | Yes | — | Called when free-text input is submitted |
| `context` | `{ currentScreen?: string; transcriptId?: string; transcriptTitle?: string; professionalMode?: string }` | No | `{}` | Contextual info; note `currentScreen` (not `currentPage` like CommandPalette) |
| `quickActions` | `QuickAction[]` | No | Determined by `context.professionalMode` | Override the built-in quick actions |
| `position` | `'bottom-right' \| 'bottom-left'` | No | `'bottom-right'` | FAB button position |

#### Local Types

- **`QuickAction`** — `{ id: string; label: string; icon: string; command: string }` (note: `icon` is required here, unlike CommandPalette; no `description` or `params` fields)

#### Built-in Quick Action Presets (module-scoped, not exported)

- `defaultQuickActions` — Summarize, Action Items, Key Points
- `medicalQuickActions` — SOAP Note, Progress Note, Billing Codes

#### Dependencies

- `react-native`: View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, Keyboard
- `expo-haptics`: Haptic feedback on toggle, action, and result

---

### CMP-SHARED-AGENT-003: `AgentInlineAssist`

**File:** `packages/shared-ui/src/agent/AgentInlineAssist.tsx`
**Platform:** Web

#### Props (`AgentInlineAssistProps`)

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `fieldName` | `string` | Yes | — | Name of the field to generate content for |
| `fieldValue` | `string` | No | — | Current field value, passed to `onGenerate` as `context.currentValue` |
| `context` | `Record<string, any>` | No | `{}` | Additional context passed to the generation function |
| `onGenerate` | `(fieldName: string, context?: Record<string, any>) => Promise<string>` | Yes | — | Async function that returns generated text |
| `onValueChange` | `(value: string) => void` | No | — | Called with the generated text to update the field |
| `position` | `'inside' \| 'outside'` | No | `'inside'` | Button placement relative to the field (style-only, not yet functionally differentiated) |
| `size` | `'sm' \| 'md'` | No | `'sm'` | Button size variant |

#### Usage

```tsx
import { AgentInlineAssist } from '@voicecode/shared-ui';
```

---

### CMP-SHARED-AGENT-004: `AgentFieldWrapper`

**File:** `packages/shared-ui/src/agent/AgentInlineAssist.tsx` (same file as `AgentInlineAssist`)
**Platform:** Web
**Description:** Wraps a form field (`<input>` or `<textarea>`) with a label and an embedded `AgentInlineAssist` button.

#### Props (`AgentFieldWrapperProps`)

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | Yes | — | Form field label text |
| `fieldName` | `string` | Yes | — | Field name passed to `AgentInlineAssist` |
| `value` | `string` | Yes | — | Current field value |
| `onChange` | `(value: string) => void` | Yes | — | Value change handler |
| `context` | `Record<string, any>` | No | — | Context passed to `onGenerate` |
| `onGenerate` | `(fieldName: string, context?: Record<string, any>) => Promise<string>` | Yes | — | Async generation function |
| `multiline` | `boolean` | No | `false` | Renders `<textarea>` when `true`, `<input>` when `false` |
| `rows` | `number` | No | `4` | Textarea rows (only applies when `multiline` is `true`) |
| `placeholder` | `string` | No | — | Input placeholder text |

#### Usage

```tsx
import { AgentFieldWrapper } from '@voicecode/shared-ui';
```

---

### CMP-SHARED-AGENT-005: `AgentQuickActions`

**File:** `packages/shared-ui/src/agent/AgentQuickActions.tsx`
**Platform:** Web

#### Props (`AgentQuickActionsProps`)

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `actions` | `QuickAction[]` | Yes | — | Array of actions to render as buttons |
| `context` | `Record<string, any>` | No | `{}` | Merged into action params when executing |
| `onAction` | `(command: string, params?: Record<string, any>) => Promise<any>` | Yes | — | Async action handler |
| `onOpenChat` | `(prefill?: string) => void` | No | — | Called when "Ask AI..." button is clicked |
| `orientation` | `'horizontal' \| 'vertical'` | No | `'horizontal'` | Layout direction |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `'md'` | Button size variant |
| `showChatButton` | `boolean` | No | `true` | Whether to show the "Ask AI..." chat button |

#### Local Types

- **`QuickAction`** — `{ id: string; label: string; icon?: string; command: string; params?: Record<string, any>; variant?: 'default' | 'primary' | 'success' | 'warning' }` (note: includes `variant` field, unique to this component)

#### Exported Preset Arrays

| Export Name | Actions | Description |
|-------------|---------|-------------|
| `TranscriptQuickActions` | Summarize (primary), Action Items, Key Points, Find Similar | General transcript processing |
| `MedicalQuickActions` | SOAP Note (primary), Progress Note, Discharge Summary, Billing Codes | Medical documentation |
| `MeetingQuickActions` | Meeting Minutes (primary), Decisions, Action Items, Follow-up Email | Meeting processing |

#### Usage

```tsx
import { AgentQuickActions, TranscriptQuickActions, MedicalQuickActions, MeetingQuickActions } from '@voicecode/shared-ui';
```

---

### CMP-SHARED-AGENT-006: `AgentSuggestionBanner`

**File:** `packages/shared-ui/src/agent/AgentSuggestionBanner.tsx`
**Platform:** Web

#### Props (`AgentSuggestionBannerProps`)

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `suggestions` | `Suggestion[]` | Yes | — | Array of suggestions to display |
| `onAction` | `(command: string, params?: Record<string, any>) => void` | Yes | — | Called when a suggestion's action button is clicked |
| `onDismiss` | `(suggestionId: string) => void` | Yes | — | Called when an individual suggestion is dismissed |
| `onDismissAll` | `() => void` | No | — | Called when "Dismiss all" is clicked; button only shown when present and >1 suggestion visible |
| `variant` | `'card' \| 'inline' \| 'minimal'` | No | `'card'` | Display variant — card (full panel), inline (pill chips), minimal (single-line with left border) |

#### Local Types

- **`Suggestion`** — `{ id: string; type: 'action' | 'insight' | 'tip'; text: string; icon?: string; command?: string; params?: Record<string, any> }`

#### Variant Behavior

| Variant | Rendering | Dismiss All | Multi-suggestion |
|---------|-----------|-------------|-----------------|
| `card` | Full panel with header, per-item action/dismiss buttons | Yes (when >1) | Yes |
| `inline` | Horizontal pill chips with × dismiss | No | Yes |
| `minimal` | Single-line banner with left accent border | No | Shows first only |

#### Usage

```tsx
import { AgentSuggestionBanner } from '@voicecode/shared-ui';
```

---

## Desktop-Specific Screens

> **⚠ These are NOT shared-ui components.** They live in `apps/desktop/src/components/` and are
> specific to the Tauri desktop application. They are documented here for cross-reference only.

| ID | Screen | File | Shortcut | Props/State | REQ |
|----|--------|------|----------|-------------|-----|
| SCR-DESKTOP-CODING | CodingAssistantPanel | `apps/desktop/src/components/CodingAssistantPanel.tsx` | Ctrl+Shift+C | mode, result, history, onSubmit, onUndo | REQ-CODE-0001 |
| SCR-DESKTOP-AGENT | AgentControlPanel | `apps/desktop/src/components/AgentControlPanel.tsx` | Ctrl+Shift+G | agents, strategy, task, history | REQ-AGENT-0001 |
| SCR-DESKTOP-VISION | VisionPanel | `apps/desktop/src/components/VisionPanel.tsx` | Ctrl+Shift+V | image, ocrTier, ocrResult, onCapture | REQ-VISION-0001 |
| SCR-DESKTOP-AI | AIFeaturesPanel | `apps/desktop/src/components/AIFeaturesPanel.tsx` | Ctrl+Shift+A | text, features, onProcess | REQ-DESKTOP-0002 |
| SCR-DESKTOP-DICTATION | FloatingDictationButton | `apps/desktop/src/components/FloatingDictationButton.tsx` | Ctrl+Shift+D | isRecording, onToggle | REQ-VOICE-0001 |

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

*All UI contracts derived from component source files in `packages/shared-ui/src/agent/` and `apps/desktop/src/components/`.*
