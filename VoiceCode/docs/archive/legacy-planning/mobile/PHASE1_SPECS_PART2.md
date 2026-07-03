# Phase 1: Screen Specifications (Part 2)

## Help & Security Screens

### 15. HelpCenterScreen

**Purpose**: In-app help and documentation

**Navigation**:
- From: ProfileScreen → "Help Center"
- To: FAQsScreen, ContactSupportScreen

**State Requirements**:
- Help categories
- Search query
- Recent articles

**UI Components**:
- Search bar
- Category cards
- Popular articles
- Contact support button
- Video tutorials
- Getting started guide

**Help Categories**:
- Getting Started
- Recording
- Transcription
- AI Features
- Sharing & Export
- Account & Billing
- Troubleshooting

---

### 16. FAQsScreen

**Purpose**: Frequently asked questions

**Navigation**:
- From: HelpCenterScreen → "FAQs"
- To: None (leaf screen)

**State Requirements**:
- FAQ list
- Expanded/collapsed state
- Search query

**UI Components**:
- Search bar
- Accordion list of FAQs
- Category filters
- Helpful/Not helpful buttons
- Contact support link

**FAQ Structure**:
```typescript
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
}
```

---

### 17. TwoFactorAuthScreen

**Purpose**: 2FA setup and management

**Navigation**:
- From: AccountScreen → "Two-Factor Authentication"
- To: None (leaf screen)

**State Requirements**:
- 2FA enabled status
- Setup step
- QR code
- Backup codes

**UI Components**:
- Enable/disable toggle
- Setup wizard
- QR code display
- Verification code input
- Backup codes display
- Download backup codes button
- Trusted devices list

**Setup Flow**:
1. Enable 2FA toggle
2. Display QR code
3. Verify code
4. Show backup codes
5. Confirmation

**API Integration**:
```typescript
POST /api/auth/2fa/enable
POST /api/auth/2fa/verify
POST /api/auth/2fa/disable
GET /api/auth/2fa/backup-codes
```

---

### 18. SessionManagementScreen

**Purpose**: Active sessions and device management

**Navigation**:
- From: AccountScreen → "Active Sessions"
- To: None (leaf screen)

**State Requirements**:
- Active sessions list
- Current session
- Session history

**UI Components**:
- Current session card
- Active sessions list
- Session details (device, location, last active)
- Revoke session button
- Revoke all other sessions button
- Session history

**Session Data**:
```typescript
interface Session {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'web';
  location: string;
  ipAddress: string;
  lastActive: Date;
  isCurrent: boolean;
}
```

**Actions**:
- View session details
- Revoke individual session
- Revoke all other sessions
- View session history

---

## Export & Sharing Screens

### 19. ExportOptionsScreen

**Purpose**: Configure export formats and options

**Navigation**:
- From: TranscriptionDetailScreen → "Export"
- To: None (modal/bottom sheet)

**State Requirements**:
- Selected format
- Export options
- Export progress

**UI Components**:
- Format selector (TXT, PDF, DOCX, SRT, VTT, JSON)
- Options checkboxes:
  - Include timestamps
  - Include speaker labels
  - Include summary
  - Include key points
  - Include action items
- Export button
- Progress indicator
- Share after export toggle

**Export Formats**:
```typescript
type ExportFormat = 'txt' | 'pdf' | 'docx' | 'srt' | 'vtt' | 'json';

interface ExportOptions {
  format: ExportFormat;
  includeTimestamps: boolean;
  includeSpeakers: boolean;
  includeSummary: boolean;
  includeKeyPoints: boolean;
  includeActionItems: boolean;
}
```

**API Integration**:
```typescript
POST /api/export
Body: { transcriptId: string, options: ExportOptions }
Response: { fileUrl: string, fileName: string }
```

---

### 20. ShareTranscriptScreen

**Purpose**: Share transcripts via email, link, etc.

**Navigation**:
- From: TranscriptionDetailScreen → "Share"
- To: None (modal/bottom sheet)

**State Requirements**:
- Share method
- Recipients
- Permissions
- Share link

**UI Components**:
- Share method selector:
  - Email
  - Link
  - Messaging apps
  - Social media
- Email input (for email share)
- Permission settings:
  - View only
  - Can comment
  - Can edit
- Expiration date picker
- Password protection toggle
- Generate link button
- Copy link button
- Send button

**Share Methods**:
```typescript
type ShareMethod = 'email' | 'link' | 'messaging' | 'social';

interface ShareOptions {
  method: ShareMethod;
  recipients?: string[];
  permission: 'view' | 'comment' | 'edit';
  expiresAt?: Date;
  password?: string;
}
```

**API Integration**:
```typescript
POST /api/share
Body: { transcriptId: string, options: ShareOptions }
Response: { shareUrl: string, shareId: string }
```

---

## Navigation Integration

### Updated Navigation Types

```typescript
// Add to HomeStackParamList
export type HomeStackParamList = {
  // ... existing screens
  AISummary: { transcriptId: string };
  AIKeyPoints: { transcriptId: string };
  AIActionItems: { transcriptId: string };
  SpeakerIdentification: { transcriptId: string };
};

// Add to LibraryStackParamList
export type LibraryStackParamList = {
  // ... existing screens
  SearchTranscripts: undefined;
  FilterTranscripts: undefined;
};

// Add to SettingsStackParamList
export type SettingsStackParamList = {
  // ... existing screens
  TagManagement: undefined;
  FolderManagement: undefined;
  BackgroundRecording: undefined;
  VoiceActivation: undefined;
  AudioQuality: undefined;
  HelpCenter: undefined;
  FAQs: undefined;
};

// Add to ProfileStackParamList
export type ProfileStackParamList = {
  // ... existing screens
  UsageDashboard: undefined;
  TranscriptionStats: undefined;
  TimeTracking: undefined;
  TwoFactorAuth: undefined;
  SessionManagement: undefined;
};

// Add new modal stack for export/share
export type ModalStackParamList = {
  ExportOptions: { transcriptId: string };
  ShareTranscript: { transcriptId: string };
};
```

---

## Redux Store Updates

### New Slices Required

1. **aiSlice** - AI features state
2. **searchSlice** - Search state
3. **tagsSlice** - Tags management
4. **foldersSlice** - Folders management
5. **analyticsSlice** - Usage analytics
6. **sessionsSlice** - Session management

### Example: aiSlice

```typescript
interface AIState {
  summaries: Record<string, { text: string; loading: boolean; error: string | null }>;
  keyPoints: Record<string, { points: string[]; loading: boolean; error: string | null }>;
  actionItems: Record<string, { items: ActionItem[]; loading: boolean; error: string | null }>;
}

const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    summaries: {},
    keyPoints: {},
    actionItems: {},
  } as AIState,
  reducers: {
    fetchSummaryStart: (state, action: PayloadAction<string>) => {
      state.summaries[action.payload] = { text: '', loading: true, error: null };
    },
    fetchSummarySuccess: (state, action: PayloadAction<{ id: string; text: string }>) => {
      state.summaries[action.payload.id] = { text: action.payload.text, loading: false, error: null };
    },
    fetchSummaryFailure: (state, action: PayloadAction<{ id: string; error: string }>) => {
      state.summaries[action.payload.id] = { text: '', loading: false, error: action.payload.error };
    },
  },
});
```

---

## Testing Requirements

Each screen must have:
- Unit tests for components
- Integration tests for navigation
- API integration tests (mocked)
- Snapshot tests for UI
- Accessibility tests

**Minimum Coverage**: 80% for all metrics

---

## Performance Requirements

- Screen load time: <3 seconds
- API response time: <2 seconds
- Search results: <1 second
- Export generation: <5 seconds
- Memory usage: <100MB per screen

---

## Accessibility Requirements

- All interactive elements have accessible labels
- Screen reader support
- Keyboard navigation support
- Color contrast WCAG AA compliant
- Font scaling support
- Haptic feedback for actions

