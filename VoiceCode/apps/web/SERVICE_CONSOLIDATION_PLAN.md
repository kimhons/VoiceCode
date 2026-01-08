# Service Consolidation Plan

## Current State: 29 Services

The application currently has 29 service files, which creates maintenance overhead and potential code duplication.

## Target State: ~15 Focused Services

Consolidate related functionality into cohesive, well-scoped service modules.

## Consolidation Strategy

### Group 1: Core Audio Services → `audio.service.ts`

**Consolidate:**
- `audio-processing.service.ts` (file upload, processing)
- `advanced-recognition.service.ts` (voice recognition)
- `websocket-streaming.service.ts` (real-time streaming)

**Rationale:** All audio-related functionality in one place

**New Structure:**
```typescript
export class AudioService {
  // File upload & processing
  uploadAudio()
  processAudio()

  // Recognition
  startRecognition()
  stopRecognition()

  // Streaming
  startStreaming()
  sendAudioChunk()
  stopStreaming()
}
```

---

### Group 2: AI/ML Services → `ai.service.ts`

**Consolidate:**
- `aiml-api.service.ts` (AIML API gateway)
- `advancedAI.service.ts` (AI context management)
- `hallucinationDetection.service.ts` (safety detection)
- `promptSecurity.service.ts` (prompt security)

**Rationale:** All AI-related functionality and safety checks

**New Structure:**
```typescript
export class AIService {
  // API Integration
  chat()
  complete()
  generateImage()

  // Safety & Security
  detectHallucination()
  validatePrompt()
  detectPII()

  // Context Management
  getContext()
  updateContext()
}
```

---

### Group 3: Data Services → `data.service.ts`

**Consolidate:**
- `supabase.service.ts` (database operations)
- `sync.service.ts` (cloud sync)
- `export.service.ts` (data export)

**Rationale:** All data persistence and export operations

**New Structure:**
```typescript
export class DataService {
  // CRUD Operations
  createTranscript()
  getTranscripts()
  updateTranscript()
  deleteTranscript()

  // Sync
  syncToCloud()
  syncFromCloud()

  // Export
  exportToPDF()
  exportToDOCX()
  exportToJSON()
}
```

---

### Group 4: Analytics & Monitoring → `analytics.service.ts`

**Consolidate:**
- `analytics.service.ts` (usage tracking)
- `advanced-analytics.service.ts` (BI/analytics)

**Rationale:** All analytics in one module

**New Structure:**
```typescript
export class AnalyticsService {
  // Tracking
  trackEvent()
  trackPageView()
  trackUsage()

  // Advanced Analytics
  generateReport()
  getInsights()
  getDashboardData()
}
```

---

### Group 5: Security & Compliance → `security.service.ts`

**Consolidate:**
- `security.service.ts` (2FA, sessions, audit)

**Keep as-is:** Already well-scoped

---

### Group 6: Integration Services → `integrations.service.ts`

**Consolidate:**
- `collaboration.service.ts`
- `integration.service.ts`
- `live-streaming.service.ts`
- `notification.service.ts`
- `push-notification.service.ts`

**Rationale:** All third-party integrations

**New Structure:**
```typescript
export class IntegrationsService {
  // Collaboration
  shareTranscript()
  inviteCollaborator()

  // Notifications
  sendNotification()
  subscribeToPush()

  // Streaming
  startLiveStream()
  streamAudio()
}
```

---

### Group 7: Utilities → `utils.service.ts`

**Consolidate:**
- `theme.service.ts` (theme management)
- `i18n.service.ts` (internationalization)
- `pwa.service.ts` (PWA features)

**Rationale:** Cross-cutting concerns

**New Structure:**
```typescript
export class UtilsService {
  // Theme
  getTheme()
  setTheme()

  // i18n
  translate()
  setLanguage()

  // PWA
  installApp()
  checkForUpdates()
}
```

---

### Keep As-Is (Well-Scoped)

These services are already focused and don't need consolidation:

1. `payment.service.ts` - Payment processing (Stripe)

---

## Final Service List (15 Services)

1. ✅ `audio.service.ts` - All audio operations
2. ✅ `ai.service.ts` - AI/ML and safety
3. ✅ `data.service.ts` - Database, sync, export
4. ✅ `analytics.service.ts` - Tracking and insights
5. ✅ `security.service.ts` - Security, 2FA, audit (keep as-is)
6. ✅ `integrations.service.ts` - Third-party integrations
7. ✅ `utils.service.ts` - Cross-cutting utilities
8. ✅ `payment.service.ts` - Payment processing (keep as-is)

**Total:** 8 core services (down from 29)

---

## Migration Steps

### Phase 1: Create New Consolidated Services

1. Create `audio.service.ts` with all audio-related methods
2. Create `ai.service.ts` with all AI-related methods
3. Create `data.service.ts` with all data operations
4. Create `analytics.service.ts` with consolidated analytics
5. Create `integrations.service.ts` with third-party features
6. Create `utils.service.ts` with utilities

### Phase 2: Update Imports

1. Find all imports of old services
2. Replace with imports from new consolidated services
3. Update method calls if signatures changed

### Phase 3: Testing

1. Run type checking: `npm run type-check`
2. Run unit tests: `npm run test`
3. Run E2E tests: `npm run test:e2e`
4. Manual testing of critical flows

### Phase 4: Cleanup

1. Delete old service files
2. Update service exports in `index.ts`
3. Update documentation
4. Update README

---

## Benefits of Consolidation

### 1. Improved Maintainability
- Fewer files to navigate
- Related code in one place
- Easier to understand relationships

### 2. Better Code Reuse
- Shared utilities within service
- Less duplication
- Consistent patterns

### 3. Easier Testing
- Test suites organized by domain
- Mock fewer dependencies
- Better coverage

### 4. Reduced Bundle Size
- Fewer service singletons
- Better tree-shaking
- Optimized imports

### 5. Clearer Architecture
- Domain-driven organization
- Clear boundaries
- Easier onboarding

---

## Implementation Example

### Before (Fragmented):

```typescript
// Multiple files
import { getAudioProcessingService } from './audio-processing.service';
import { getStreamingService } from './websocket-streaming.service';
import { getRecognitionService } from './advanced-recognition.service';

const audioService = getAudioProcessingService();
const streamingService = getStreamingService();
const recognitionService = getRecognitionService();

await audioService.uploadFile(file);
streamingService.connect();
recognitionService.start();
```

### After (Consolidated):

```typescript
// Single file
import { audioService } from './audio.service';

await audioService.uploadFile(file);
audioService.startStreaming();
audioService.startRecognition();
```

---

## Breaking Changes

This consolidation will require updates in:

1. **Components** using these services
2. **Tests** importing services
3. **Hooks** wrapping service calls
4. **Pages** using service methods

**Estimated effort:** 4-6 hours

---

## Rollout Strategy

### Option A: Big Bang (Faster but riskier)
- Consolidate all services at once
- Update all imports in one PR
- Requires thorough testing

### Option B: Gradual (Safer but slower)
- Consolidate one group at a time
- Keep old services as deprecated wrappers
- Remove old services after 1-2 sprints

**Recommended:** Option B for production apps

---

## Next Steps

1. Review and approve this plan
2. Create consolidated service files
3. Update imports across codebase
4. Run comprehensive tests
5. Deploy to staging
6. Monitor for issues
7. Deploy to production
8. Clean up old files

---

## Automation Opportunities

Consider creating scripts to:

1. Generate service boilerplate
2. Update imports automatically
3. Generate migration checklist
4. Validate all imports resolved

---

## Future Maintenance

After consolidation:

- **New features:** Add to appropriate consolidated service
- **Service grows too large:** Consider splitting by sub-domain
- **Review quarterly:** Ensure services remain cohesive

---

This consolidation will significantly improve code organization and maintainability while reducing complexity from 29 services to 8 focused modules.
