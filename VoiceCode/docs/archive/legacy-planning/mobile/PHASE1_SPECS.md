# Phase 1: Screen Specifications

## AI Features Screens

### 1. AISummaryScreen

**Purpose**: Display AI-generated summary of a transcription

**Navigation**: 
- From: TranscriptionDetailScreen → "View Summary" button
- To: None (leaf screen)

**Props/Params**:
```typescript
type AISummaryScreenParams = {
  transcriptId: string;
};
```

**State Requirements**:
- Summary text (from API)
- Loading state
- Error state
- Regenerate capability

**UI Components**:
- Header with transcript title
- Summary text display (scrollable)
- Copy button
- Share button
- Regenerate button
- Loading spinner
- Error message

**API Integration**:
```typescript
POST /api/ai/summary
Body: { transcriptId: string }
Response: { summary: string, confidence: number }
```

**Redux Actions**:
- `fetchSummary(transcriptId)`
- `regenerateSummary(transcriptId)`
- `copySummary(summary)`

---

### 2. AIKeyPointsScreen

**Purpose**: Show extracted key points from transcript

**Navigation**:
- From: TranscriptionDetailScreen → "Key Points" button
- To: None (leaf screen)

**Props/Params**:
```typescript
type AIKeyPointsScreenParams = {
  transcriptId: string;
};
```

**State Requirements**:
- Array of key points
- Loading state
- Error state

**UI Components**:
- Header with transcript title
- Bullet list of key points
- Copy all button
- Share button
- Export button

**API Integration**:
```typescript
POST /api/ai/key-points
Body: { transcriptId: string }
Response: { keyPoints: string[], confidence: number }
```

---

### 3. AIActionItemsScreen

**Purpose**: List action items identified by AI

**Navigation**:
- From: TranscriptionDetailScreen → "Action Items" button
- To: None (leaf screen)

**Props/Params**:
```typescript
type AIActionItemsScreenParams = {
  transcriptId: string;
};
```

**State Requirements**:
- Array of action items
- Completion status for each item
- Loading state
- Error state

**UI Components**:
- Header with transcript title
- Checklist of action items
- Mark as complete checkbox
- Add to calendar button
- Export button

**Data Model**:
```typescript
interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}
```

---

### 4. SpeakerIdentificationScreen

**Purpose**: Configure and view speaker labels

**Navigation**:
- From: TranscriptionDetailScreen → "Speakers" button
- To: None (leaf screen)

**Props/Params**:
```typescript
type SpeakerIdentificationScreenParams = {
  transcriptId: string;
};
```

**State Requirements**:
- Array of speakers
- Speaker labels
- Edit mode

**UI Components**:
- List of detected speakers
- Edit speaker name input
- Speaker color picker
- Save button
- Auto-detect toggle

**Data Model**:
```typescript
interface Speaker {
  id: string;
  label: string;
  color: string;
  segmentCount: number;
}
```

---

## Search & Organization Screens

### 5. SearchTranscriptsScreen

**Purpose**: Full-text search across all transcripts

**Navigation**:
- From: LibraryScreen → Search icon
- To: TranscriptionDetailScreen (on result tap)

**State Requirements**:
- Search query
- Search results
- Search history
- Filters applied
- Loading state

**UI Components**:
- Search input with autocomplete
- Filter chips (date, duration, tags)
- Search results list
- Recent searches
- Clear history button

**Search Features**:
- Full-text search
- Fuzzy matching
- Highlight matches
- Sort by relevance/date
- Pagination

**API Integration**:
```typescript
GET /api/search/transcripts?q={query}&filters={filters}&page={page}
Response: { results: Transcript[], total: number, page: number }
```

---

### 6. FilterTranscriptsScreen

**Purpose**: Advanced filtering by date, duration, tags, etc.

**Navigation**:
- From: LibraryScreen → Filter icon
- To: LibraryScreen (with filters applied)

**State Requirements**:
- Selected filters
- Available filter options
- Filter presets

**UI Components**:
- Date range picker
- Duration slider
- Tag multi-select
- Folder select
- Language select
- Professional mode select
- Save preset button
- Apply button
- Clear all button

**Filter Options**:
```typescript
interface Filters {
  dateRange?: { start: Date; end: Date };
  durationRange?: { min: number; max: number };
  tags?: string[];
  folders?: string[];
  languages?: string[];
  professionalModes?: string[];
}
```

---

### 7. TagManagementScreen

**Purpose**: Create, edit, delete tags

**Navigation**:
- From: SettingsScreen → "Manage Tags"
- To: None (leaf screen)

**State Requirements**:
- Array of tags
- Edit mode
- Create mode

**UI Components**:
- List of existing tags
- Create tag button
- Edit tag modal
- Delete confirmation
- Tag color picker
- Tag usage count

**CRUD Operations**:
- Create tag
- Update tag (name, color)
- Delete tag (with confirmation)
- View tag usage

---

### 8. FolderManagementScreen

**Purpose**: Organize transcripts into folders

**Navigation**:
- From: SettingsScreen → "Manage Folders"
- To: None (leaf screen)

**State Requirements**:
- Array of folders
- Folder hierarchy
- Edit mode

**UI Components**:
- Folder tree view
- Create folder button
- Edit folder modal
- Delete confirmation
- Move folder
- Folder icon picker

---

### 9. BackgroundRecordingScreen

**Purpose**: Configure background recording settings

**Navigation**:
- From: RecordingSettingsScreen → "Background Recording"
- To: None (leaf screen)

**State Requirements**:
- Background recording enabled
- Battery optimization settings
- Notification settings

**UI Components**:
- Enable toggle
- Battery optimization warning
- Notification preview
- Permission request button
- Test background recording

---

### 10. VoiceActivationScreen

**Purpose**: Voice-activated recording configuration

**Navigation**:
- From: RecordingSettingsScreen → "Voice Activation"
- To: None (leaf screen)

**State Requirements**:
- Voice activation enabled
- Sensitivity level
- Silence threshold
- Auto-stop duration

**UI Components**:
- Enable toggle
- Sensitivity slider
- Silence threshold slider
- Auto-stop duration picker
- Test voice activation
- Microphone level indicator

---

## Analytics & Quality Screens

### 11. AudioQualityScreen

**Purpose**: Audio quality settings and monitoring

**Navigation**:
- From: RecordingSettingsScreen → "Audio Quality"
- To: None (leaf screen)

**State Requirements**:
- Sample rate
- Bit depth
- Channels (mono/stereo)
- Noise reduction level
- Audio quality metrics

**UI Components**:
- Sample rate selector
- Bit depth selector
- Channels toggle
- Noise reduction slider
- Quality preview
- Storage impact estimate

---

### 12. UsageDashboardScreen

**Purpose**: Usage statistics and limits

**Navigation**:
- From: ProfileScreen → "Usage"
- To: SubscriptionScreen (upgrade prompt)

**State Requirements**:
- Current usage
- Plan limits
- Usage history
- Billing cycle

**UI Components**:
- Usage progress bars
- Usage charts (daily/weekly/monthly)
- Plan details
- Upgrade button
- Usage breakdown

**Metrics Displayed**:
- Recording minutes used/remaining
- Transcription minutes used/remaining
- Storage used/remaining
- AI features used/remaining

---

### 13. TranscriptionStatsScreen

**Purpose**: Transcription accuracy and performance metrics

**Navigation**:
- From: UsageDashboardScreen → "Transcription Stats"
- To: None (leaf screen)

**State Requirements**:
- Accuracy metrics
- Performance metrics
- Language breakdown
- Error rates

**UI Components**:
- Accuracy chart
- Performance chart
- Language distribution
- Error log
- Export stats button

---

### 14. TimeTrackingScreen

**Purpose**: Track time spent on recordings/transcriptions

**Navigation**:
- From: UsageDashboardScreen → "Time Tracking"
- To: None (leaf screen)

**State Requirements**:
- Time tracking data
- Date range
- Category breakdown

**UI Components**:
- Time chart (daily/weekly/monthly)
- Category breakdown
- Export report button
- Date range picker

---

## Continued in PHASE1_SPECS_PART2.md...

