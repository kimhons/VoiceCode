# Week 2 Visual Guide
## Search & Organization Enhancement

---

## 🔍 Enhanced SearchScreen

### Voice Search Flow

```
┌─────────────────────────────────────┐
│  🔍 Search transcripts...      🎤   │ ← Voice button
└─────────────────────────────────────┘

User taps 🎤 →

┌─────────────────────────────────────┐
│  🔍 Listening...               🎤   │ ← Animated mic (red)
└─────────────────────────────────────┘
        ↓ (2 seconds)
┌─────────────────────────────────────┐
│  🔍 meeting notes              ✕    │ ← Voice result
└─────────────────────────────────────┘
```

### Search History & Suggestions

```
Empty Input:
┌─────────────────────────────────────┐
│  🔍                            🎤   │
├─────────────────────────────────────┤
│ Recent Searches            Clear    │
│                                     │
│ 🕐 meeting notes              →    │
│ 🕐 project discussion         →    │
│ 🕐 interview transcript       →    │
│ 🕐 brainstorming session      →    │
└─────────────────────────────────────┘

Typing "meet":
┌─────────────────────────────────────┐
│  🔍 meet                       ✕    │
├─────────────────────────────────────┤
│ Suggestions                         │
│                                     │
│ 🔍 meeting notes              →    │
│ 🔍 meeting                    →    │
└─────────────────────────────────────┘
```

### Frosted Glass Effect (iOS)

```
┌─────────────────────────────────────┐
│  🔍 search query               ✕    │
├─────────────────────────────────────┤
│ ╔═══════════════════════════════╗  │
│ ║ Suggestions    [Blur Effect]  ║  │ ← BlurView
│ ║                               ║  │
│ ║ 🔍 suggestion 1          →   ║  │
│ ║ 🔍 suggestion 2          →   ║  │
│ ╚═══════════════════════════════╝  │
│                                     │
│ [Search Results Below]              │
└─────────────────────────────────────┘
```

---

## 🏷️ Enhanced TagManagementScreen

### Normal Mode

```
┌─────────────────────────────────────┐
│ Your Tags              3 tags Select│ ← Header
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Suggested Tags                  │ │
│ │ ⊕ Work  ⊕ Personal  ⊕ Meeting  │ │ ← Smart suggestions
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔵 Work                    ✏️ 🗑️ │ │ ← Tag card
│ │    5 transcripts                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🟠 Meeting                 ✏️ 🗑️ │ │
│ │    3 transcripts                │ │
│ └─────────────────────────────────┘ │
│                                     │
│                              ⊕      │ ← FAB
└─────────────────────────────────────┘
```

### Selection Mode

```
┌─────────────────────────────────────┐
│ ✕  2 selected    Select All    🗑️  │ ← Selection bar
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ☑️ 🔵 Work                       │ │ ← Selected
│ │    5 transcripts                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ☐ 🟠 Meeting                     │ │ ← Not selected
│ │    3 transcripts                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ☑️ 🟢 Personal                   │ │ ← Selected
│ │    2 transcripts                │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Long Press Interaction

```
User long-presses tag →

┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ 🔵 Work                    ✏️ 🗑️ │ │
│ │    5 transcripts                │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
        ↓ Haptic feedback
┌─────────────────────────────────────┐
│ ✕  1 selected    Select All    🗑️  │ ← Selection mode
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ☑️ 🔵 Work                       │ │ ← Auto-selected
│ │    5 transcripts                │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Smart Tag Suggestions

```
Existing Tags: Work, Meeting, Personal

Suggested:
┌─────────────────────────────────────┐
│ Suggested Tags                      │
│ ⊕ Interview  ⊕ Brainstorming  ⊕ Notes│
└─────────────────────────────────────┘

Tap "Interview" →
┌─────────────────────────────────────┐
│ ✓ Tag "Interview" created!          │ ← Success notification
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🟣 Interview               ✏️ 🗑️ │ │ ← New tag
│ │    0 transcripts                │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🎬 Animations

### Search Bar Scale Animation

```typescript
// User taps voice search
searchBarScale: 1.0 → 0.98 → 1.0
Duration: 100ms + 100ms
Physics: Timing (linear)
```

### History Fade In

```typescript
// User focuses search input
historyOpacity: 0 → 1
Duration: 200ms
Physics: Timing (ease-out)
```

### FAB Spring Animation

```typescript
// User taps FAB
fabScale: 1.0 → 0.9 → 1.0
Duration: 100ms + 100ms
Physics: Timing (ease-in-out)
```

### Selection Bar Slide

```typescript
// User enters selection mode
selectionBarHeight: 0 → 60
Duration: 200ms
Physics: Timing (ease-out)
```

---

## 🎯 Haptic Feedback

### SearchScreen
- **Voice Search**: Medium impact
- **Clear Search**: Light impact
- **Advanced Filters**: Medium impact
- **Suggestion Tap**: Light impact
- **Voice Success**: Success notification
- **Voice Error**: Error notification

### TagManagementScreen
- **Create Tag**: Medium impact
- **Edit Tag**: Medium impact
- **Delete Tag**: Medium impact
- **Long Press**: Medium impact (enter selection)
- **Toggle Selection**: Light impact
- **Bulk Delete**: Medium impact
- **Create Success**: Success notification
- **Delete Success**: Success notification
- **Error**: Error notification

---

## 🎨 Color Coding

### Tag Colors
```
🔵 #667eea  Purple
🟠 #f59e0b  Orange
🟢 #10b981  Green
🔴 #ef4444  Red
🔵 #3b82f6  Blue
🟣 #ec4899  Pink
🟣 #8b5cf6  Violet
🔵 #14b8a6  Teal
```

### State Colors
```
Primary:    #667eea  (Actions, links)
Success:    #10b981  (Confirmations)
Error:      #ef4444  (Destructive actions)
Warning:    #f59e0b  (Cautions)
Secondary:  #6b7280  (Disabled, placeholders)
```

---

## 📱 Platform Differences

### iOS
- BlurView for frosted glass
- SF Pro typography
- Subtle shadows
- Haptic Engine feedback

### Android
- Solid background (no blur)
- Roboto typography
- Material elevation
- Vibration feedback

---

## 🔍 Enhanced AdvancedFilterScreen (Day 14)

### Quick Filters

```
┌─────────────────────────────────────────────────────────┐
│  Advanced Filters                    📊                 │ ← Analytics button
├─────────────────────────────────────────────────────────┤
│  Quick Filters                                          │
│                                                         │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │📅 Today │ │📅 Week   │ │📅 Month   │ │⏱️ Long  │  │ ← Horizontal scroll
│  └─────────┘ └──────────┘ └───────────┘ └──────────┘  │
│                                                         │
│  Active filter: Blue background, white text            │
│  Inactive: White background, blue border               │
└─────────────────────────────────────────────────────────┘
```

### Saved Presets

```
┌─────────────────────────────────────────────────────────┐
│  Saved Presets                                    ➕    │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐ │
│  │ 📑 Work Meetings                            🗑️   │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 📑 Personal Notes                           🗑️   │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 📑 Long Interviews                          🗑️   │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

Tap preset → Apply filters immediately
Tap 🗑️ → Delete confirmation dialog
Tap ➕ → Open save preset modal
```

### Save Preset Modal

```
┌─────────────────────────────────────┐
│  Save Filter Preset                 │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Enter preset name...          │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌──────────┐      ┌──────────┐   │
│  │ Cancel   │      │   Save   │   │
│  └──────────┘      └──────────┘   │
└─────────────────────────────────────┘

Overlay: rgba(0,0,0,0.5)
Modal: Centered, rounded corners
Input: Auto-focused
```

### Filter Analytics Panel

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [Slide up from bottom]                                 │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🌫️ BlurView (iOS) / Solid (Android)              │ │
│  │                                                   │ │
│  │  Filter Analytics                            ✕   │ │
│  │                                                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │ │
│  │  │ 🔍       │  │ 📑       │  │ ⚡       │       │ │
│  │  │   5      │  │   3      │  │   5      │       │ │
│  │  │ Active   │  │ Presets  │  │ Quick    │       │ │
│  │  │ Filters  │  │          │  │ Filters  │       │ │
│  │  └──────────┘  └──────────┘  └──────────┘       │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘

Animation: Spring (damping: 15, stiffness: 150)
Height: 250px
Blur: intensity 80 (iOS)
```

### Multi-Criteria Filters

```
┌─────────────────────────────────────────────────────────┐
│  Date Range                                             │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ 📅 From: 1/1/26  │  │ 📅 To: 1/5/26    │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                         │
│  Duration                                               │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ Min: 5 min       │  │ Max: 60 min      │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                         │
│  Tags                                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                  │
│  │✓ Work   │ │✓ Meeting│ │  Notes  │                  │
│  └─────────┘ └─────────┘ └─────────┘                  │
│                                                         │
│  Folders                                                │
│  ┌─────────┐ ┌─────────┐                               │
│  │✓ 📁 Q1  │ │  📁 Q2  │                               │
│  └─────────┘ └─────────┘                               │
│                                                         │
│  Sort                                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │✓ Date   │ │ Duration│ │ Title   │ │ Relevance│     │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  ┌─────────┐ ┌─────────┐                               │
│  │✓ ↓ Desc │ │  ↑ Asc  │                               │
│  └─────────┘ └─────────┘                               │
└─────────────────────────────────────────────────────────┘

Selected: Blue background, white text
Unselected: White background, border
```

### Haptic Feedback Points (AdvancedFilterScreen)

```
1. Toggle tag                → Light impact
2. Toggle folder             → Light impact
3. Apply quick filter        → Medium impact + Success notification
4. Save preset               → Medium impact + Success notification
5. Delete preset             → Medium impact + Success notification
6. Show analytics            → Medium impact
7. Hide analytics            → Light impact
8. Apply filters             → Medium impact + Success notification
9. Clear filters             → Light impact
10. Date picker interaction  → Light impact
```

### Animation Details

```typescript
// Analytics Panel Slide
Animated.spring(analyticsSlide, {
  toValue: 0,
  useNativeDriver: true,
  damping: 15,
  stiffness: 150,
})

// Quick Filter Chip
Active: {
  backgroundColor: '#667eea',
  borderColor: '#667eea',
  color: '#fff',
}
Inactive: {
  backgroundColor: '#fff',
  borderColor: '#667eea',
  color: '#667eea',
}
```

### User Flow: Save Preset

```
1. User configures filters
   ↓
2. Taps "Save Current Filters as Preset"
   ↓ (Medium haptic)
3. Modal appears with input focused
   ↓
4. User enters name "Work Meetings"
   ↓
5. Taps "Save"
   ↓ (Medium haptic)
6. Preset saved to list
   ↓ (Success notification)
7. Modal closes
   ↓
8. Preset appears in "Saved Presets" section
```

### User Flow: Apply Quick Filter

```
1. User taps "Today" quick filter
   ↓ (Medium haptic)
2. Chip highlights (blue background)
   ↓
3. Date filters update:
   - dateFrom: Today 00:00:00
   - dateTo: Today 23:59:59
   - sortBy: date
   - sortOrder: desc
   ↓ (Success notification)
4. UI updates to show active filters
```

---

**Week 2 (Days 8-14): COMPLETE** ✅
**All 4 Screens Enhanced**: SearchScreen, TagManagementScreen, FolderManagementScreen, AdvancedFilterScreen

