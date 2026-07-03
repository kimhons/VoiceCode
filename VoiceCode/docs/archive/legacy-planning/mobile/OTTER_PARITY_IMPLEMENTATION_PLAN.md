# Otter.ai Parity Implementation Plan

## Executive Summary

This document provides detailed implementation tasks to achieve feature parity with Otter.ai and exceed it in key areas. The plan is organized by priority and includes file paths, code patterns, and estimated complexity.

---

## Phase 1: Integrate Interactive Transcript Editor (Priority: Critical)

### Task 1.1: Upgrade TranscriptDetailScreen

**File:** `src/screens/library/TranscriptDetailScreen.tsx`

**Current State:** 52 lines, static text display only

**Target State:** Full interactive editor with audio playback

**Implementation Steps:**

1. Import the new components:
```typescript
import { InteractiveTranscriptEditor } from '../../components/transcript';
import { useTranscriptEditor } from '../../hooks/useTranscriptEditor';
import { audioPlayer, PlaybackStatus } from '../../services/AudioPlayer';
```

2. Add route params for transcript data:
```typescript
type RouteParams = {
  transcriptId: string;
  audioUrl?: string;
};
```

3. Integrate `useTranscriptEditor` hook for word-level editing

4. Add audio player state management:
```typescript
const [playbackState, setPlaybackState] = useState<PlaybackState>();
const [currentTime, setCurrentTime] = useState(0);
```

5. Handle timestamp tap to jump audio:
```typescript
const handleTimestampTap = (timestamp: number) => {
  audioPlayer.seekTo(timestamp * 1000); // Convert to ms
};
```

6. Replace static text with `InteractiveTranscriptEditor`:
```typescript
<InteractiveTranscriptEditor
  words={words}
  onWordsChange={updateWords}
  onTimestampTap={handleTimestampTap}
  currentTime={playbackState?.position / 1000}
  showConfidence={true}
/>
```

**Estimated Lines:** ~250 (from 52)

---

## Phase 2: Audio Player Component with Waveform Scrubbing

### Task 2.1: Create AudioPlayerBar Component

**File:** `src/components/playback/AudioPlayerBar.tsx` (NEW)

**Features:**
- Play/Pause button
- Progress bar with scrubbing
- Current time / Total duration display
- Playback speed selector (0.5x, 1x, 1.5x, 2x, 3x)
- Mini waveform visualization

**Implementation:**

```typescript
interface AudioPlayerBarProps {
  audioUrl: string;
  onTimeUpdate?: (timeSeconds: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}
```

**Key Components:**
1. Slider from `@react-native-community/slider` or custom gesture handler
2. Reuse `AudioWaveform` component for mini visualization
3. Speed selector dropdown/modal

**Dependencies:**
- `audioPlayer` service (already exists)
- `react-native-gesture-handler` for scrubbing

### Task 2.2: Create PlaybackSpeedSelector Component

**File:** `src/components/playback/PlaybackSpeedSelector.tsx` (NEW)

**Features:**
- Bottom sheet or modal with speed options
- Visual indicator of current speed
- Haptic feedback on selection

**Speed Options:**
```typescript
const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];
```

### Task 2.3: Create useAudioPlayback Hook

**File:** `src/hooks/useAudioPlayback.ts` (NEW)

**Purpose:** Wrapper around AudioPlayer service with React state

```typescript
interface UseAudioPlaybackReturn {
  isPlaying: boolean;
  isPaused: boolean;
  isLoaded: boolean;
  currentTime: number; // seconds
  duration: number; // seconds
  playbackSpeed: number;

  load: (uri: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
}
```

---

## Phase 3: Search Within Transcript

### Task 3.1: Create TranscriptSearchBar Component

**File:** `src/components/transcript/TranscriptSearchBar.tsx` (NEW)

**Features:**
- Search input with clear button
- Match count display ("3 of 15 matches")
- Previous/Next navigation buttons
- Keyboard dismiss on scroll

**Implementation:**

```typescript
interface TranscriptSearchBarProps {
  words: WordData[];
  onSearchResults: (matchingIndices: number[]) => void;
  onNavigateToMatch: (index: number) => void;
}
```

### Task 3.2: Add Search Highlighting to EditableWord

**File:** `src/components/transcript/EditableWord.tsx`

**Modifications:**
1. Add `isSearchMatch` prop
2. Add `isCurrentSearchMatch` prop
3. Highlight matching words with different background color
4. Animate current match focus

```typescript
// Add to EditableWordProps
isSearchMatch?: boolean;
isCurrentSearchMatch?: boolean;

// Add highlight style
{isSearchMatch && (
  <View style={[
    styles.searchHighlight,
    isCurrentSearchMatch && styles.currentSearchHighlight
  ]} />
)}
```

### Task 3.3: Integrate Search into InteractiveTranscriptEditor

**File:** `src/components/transcript/InteractiveTranscriptEditor.tsx`

**Modifications:**
1. Add `showSearch` prop (default false)
2. Add search state management
3. Scroll to current match on navigation
4. Pass match state to EditableWord components

---

## Phase 4: Speaker Diarization UI

### Task 4.1: Create SpeakerLabel Component

**File:** `src/components/transcript/SpeakerLabel.tsx` (NEW)

**Features:**
- Color-coded speaker badge
- Speaker name display
- Editable name on tap
- Consistent colors per speaker

**Implementation:**

```typescript
interface SpeakerLabelProps {
  speaker: Speaker;
  onEditName?: (newName: string) => void;
  isEditing?: boolean;
}

const SPEAKER_COLORS = [
  '#667eea', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6',
];
```

### Task 4.2: Create SpeakerSegmentView Component

**File:** `src/components/transcript/SpeakerSegmentView.tsx` (NEW)

**Features:**
- Groups words by speaker
- Shows speaker label at start of segment
- Visual separator between speakers
- Timeline indicator for segment duration

**Implementation:**

```typescript
interface SpeakerSegmentViewProps {
  segment: SpeakerSegment;
  speaker: Speaker;
  words: WordData[];
  onWordEdit: (index: number, newWord: string) => void;
  currentTime?: number;
}
```

### Task 4.3: Create useSpeakerDiarization Hook

**File:** `src/hooks/useSpeakerDiarization.ts` (NEW)

**Purpose:** Manage speaker identification and segment mapping

```typescript
interface UseSpeakerDiarizationReturn {
  speakers: Speaker[];
  segments: SpeakerSegment[];
  getSpeakerForWord: (wordIndex: number) => Speaker | null;
  updateSpeakerName: (speakerId: string, name: string) => void;
  mergeSpeakers: (speakerId1: string, speakerId2: string) => void;
}
```

### Task 4.4: Update RecordingScreen for Speaker Diarization

**File:** `src/screens/home/RecordingScreen.tsx`

**Modifications:**
1. Add `diarize: true` option to streaming config
2. Parse speaker info from transcription response
3. Display speaker labels in LiveTranscriptionView

```typescript
// In handleStartRecording
await streamingService.connect({
  language: 'en',
  model: '#g1_nova-2-general',
  punctuate: true,
  diarize: true, // Enable speaker diarization
  interimResults: true,
});
```

### Task 4.5: Update LiveTranscriptionView for Speakers

**File:** `src/components/recording/LiveTranscriptionView.tsx`

**Modifications:**
1. Add `showSpeakers` prop
2. Parse speaker info from StreamingTranscript
3. Display colored speaker labels inline

---

## Phase 5: Complete TranscriptDetailScreen Rebuild

### Task 5.1: Full Screen Implementation

**File:** `src/screens/library/TranscriptDetailScreen.tsx`

**Complete Rewrite (~400 lines):**

```typescript
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranscriptEditor } from '../../hooks/useTranscriptEditor';
import { useAudioPlayback } from '../../hooks/useAudioPlayback';
import { useSpeakerDiarization } from '../../hooks/useSpeakerDiarization';
import { InteractiveTranscriptEditor } from '../../components/transcript';
import { AudioPlayerBar } from '../../components/playback/AudioPlayerBar';
import { TranscriptSearchBar } from '../../components/transcript/TranscriptSearchBar';
import { TranscriptHeader } from '../../components/transcript/TranscriptHeader';
import { ExportModal } from '../../components/export/ExportModal';

// ... full implementation
```

**Sections:**
1. Header with title, date, export button
2. Search bar (collapsible)
3. Audio player bar (sticky bottom or top)
4. Interactive transcript editor (main content)
5. Speaker labels (if diarization available)
6. Export modal

---

## Phase 6: Component Index Updates

### Task 6.1: Update Component Exports

**Files to update:**

1. `src/components/transcript/index.ts`:
```typescript
export { EditableWord } from './EditableWord';
export { InteractiveTranscriptEditor } from './InteractiveTranscriptEditor';
export { TranscriptSearchBar } from './TranscriptSearchBar';
export { SpeakerLabel } from './SpeakerLabel';
export { SpeakerSegmentView } from './SpeakerSegmentView';
export type { WordData } from './EditableWord';
```

2. `src/components/playback/index.ts` (NEW):
```typescript
export { AudioPlayerBar } from './AudioPlayerBar';
export { PlaybackSpeedSelector } from './PlaybackSpeedSelector';
```

3. `src/hooks/index.ts`:
```typescript
export { useAudioPlayback } from './useAudioPlayback';
export { useSpeakerDiarization } from './useSpeakerDiarization';
export { useWordEditor } from './useWordEditor';
```

---

## Implementation Order (Recommended)

### Sprint 1: Core Playback (Days 1-2)
1. [ ] Task 2.3: useAudioPlayback hook
2. [ ] Task 2.1: AudioPlayerBar component
3. [ ] Task 2.2: PlaybackSpeedSelector component

### Sprint 2: TranscriptDetail Integration (Days 3-4)
4. [ ] Task 1.1: Upgrade TranscriptDetailScreen
5. [ ] Task 5.1: Full screen implementation

### Sprint 3: Search Feature (Day 5)
6. [ ] Task 3.1: TranscriptSearchBar component
7. [ ] Task 3.2: Search highlighting in EditableWord
8. [ ] Task 3.3: Search integration

### Sprint 4: Speaker Diarization (Days 6-7)
9. [ ] Task 4.3: useSpeakerDiarization hook
10. [ ] Task 4.1: SpeakerLabel component
11. [ ] Task 4.2: SpeakerSegmentView component
12. [ ] Task 4.4: RecordingScreen diarization
13. [ ] Task 4.5: LiveTranscriptionView speakers

### Sprint 5: Polish & Testing (Day 8)
14. [ ] Task 6.1: Update exports
15. [ ] Integration testing
16. [ ] UI polish and animations

---

## File Summary

### New Files (10)
| File | Lines | Purpose |
|------|-------|---------|
| `components/playback/AudioPlayerBar.tsx` | ~200 | Audio playback controls |
| `components/playback/PlaybackSpeedSelector.tsx` | ~100 | Speed selection modal |
| `components/playback/index.ts` | ~10 | Exports |
| `components/transcript/TranscriptSearchBar.tsx` | ~150 | Search functionality |
| `components/transcript/SpeakerLabel.tsx` | ~80 | Speaker badge |
| `components/transcript/SpeakerSegmentView.tsx` | ~120 | Grouped speaker segments |
| `hooks/useAudioPlayback.ts` | ~100 | Playback state hook |
| `hooks/useSpeakerDiarization.ts` | ~80 | Speaker management hook |

### Modified Files (4)
| File | Changes |
|------|---------|
| `screens/library/TranscriptDetailScreen.tsx` | Complete rewrite (~400 lines) |
| `components/transcript/EditableWord.tsx` | Add search highlight props |
| `components/transcript/InteractiveTranscriptEditor.tsx` | Add search integration |
| `components/recording/LiveTranscriptionView.tsx` | Add speaker labels |

### Total Estimated New Code
- **~1,200 lines** of new code
- **~100 lines** of modifications

---

## Dependencies (Already Installed)

All required packages are already in package.json:
- `expo-av` - Audio playback
- `react-native-reanimated` - Animations
- `react-native-gesture-handler` - Touch handling
- `expo-haptics` - Haptic feedback
- `@expo/vector-icons` - Icons

---

## Success Criteria

### Otter Parity Checklist
- [ ] Tap word to edit inline
- [ ] Tap timestamp to jump audio
- [ ] Audio player with scrubbing progress bar
- [ ] Playback speed control (0.5x - 3x)
- [ ] Search within transcript
- [ ] Speaker labels with colors

### Beyond Otter (Advantages)
- [x] Spring animations on interactions
- [x] Swipe-to-delete words
- [x] Undo/redo editing history
- [x] Confidence indicators per word
- [ ] Waveform visualization in player
- [ ] Real-time streaming toggle
