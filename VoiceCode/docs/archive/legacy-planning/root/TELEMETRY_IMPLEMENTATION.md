# 📊 Telemetry & Analytics Implementation - VoiceCode

## Priority: CRITICAL - Required for Growth

**Status**: Not Started  
**Target Completion**: Week 1 (Day 5)  
**Impact**: Critical - Cannot optimize without data

---

## Why Telemetry is Critical

### Current State: Flying Blind 🔴
- ❌ No idea which commands users actually use
- ❌ No error rate tracking
- ❌ No performance metrics
- ❌ No user engagement data
- ❌ No conversion funnel tracking

### With Telemetry: Data-Driven Decisions ✅
- ✅ Know which features to prioritize
- ✅ Identify and fix errors proactively
- ✅ Optimize performance bottlenecks
- ✅ Improve onboarding based on drop-off data
- ✅ Prove value to investors/users

---

## Architecture

### 1. Privacy-First Approach

**Principles**:
- ✅ **Opt-in by default** (respect user privacy)
- ✅ **No PII** (Personally Identifiable Information)
- ✅ **Anonymized user IDs** (UUID v4)
- ✅ **Local-first** (batch and send)
- ✅ **Transparent** (users can see what's collected)
- ✅ **GDPR compliant**

**Settings**:
```json
{
  "voiceflow.telemetry.enabled": true,
  "voiceflow.telemetry.level": "basic", // basic, detailed, full
  "voiceflow.telemetry.crashReports": true,
  "voiceflow.telemetry.performanceMetrics": true
}
```

### 2. Event Types

#### A. Usage Events
```typescript
interface UsageEvent {
  type: 'command_executed' | 'voice_recognition_started' | 'voice_recognition_stopped';
  timestamp: number;
  userId: string; // Anonymous UUID
  sessionId: string;
  command?: string; // Anonymized (e.g., "open_file" not "open_file:secrets.txt")
  duration?: number;
  success: boolean;
}
```

#### B. Error Events
```typescript
interface ErrorEvent {
  type: 'error';
  timestamp: number;
  userId: string;
  sessionId: string;
  errorType: string; // 'voice_recognition_failed', 'command_parse_error', etc.
  errorMessage: string; // Sanitized (no file paths, no PII)
  stackTrace?: string; // Sanitized
  context: {
    sttEngine: string;
    aiModel: string;
    platform: string;
    vscodeVersion: string;
    extensionVersion: string;
  };
}
```

#### C. Performance Events
```typescript
interface PerformanceEvent {
  type: 'performance';
  timestamp: number;
  userId: string;
  sessionId: string;
  metric: 'voice_recognition_latency' | 'command_execution_latency' | 'model_load_time';
  value: number; // milliseconds
  context: {
    sttEngine: string;
    modelSize?: string;
  };
}
```

#### D. Feature Adoption Events
```typescript
interface FeatureAdoptionEvent {
  type: 'feature_used';
  timestamp: number;
  userId: string;
  sessionId: string;
  feature: 'wake_word' | 'custom_commands' | 'ai_integration' | 'voice_training';
  firstUse: boolean;
}
```

### 3. Telemetry Service Implementation

```typescript
// services/TelemetryService.ts

import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

interface TelemetryEvent {
  type: string;
  timestamp: number;
  userId: string;
  sessionId: string;
  [key: string]: any;
}

export class TelemetryService {
  private userId: string;
  private sessionId: string;
  private eventQueue: TelemetryEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private enabled: boolean = true;
  
  constructor(private context: vscode.ExtensionContext) {
    this.userId = this.getOrCreateUserId();
    this.sessionId = uuidv4();
    this.enabled = this.getTelemetryEnabled();
    
    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => this.flush(), 30000);
    
    // Flush on extension deactivation
    context.subscriptions.push({
      dispose: () => this.dispose()
    });
  }
  
  private getOrCreateUserId(): string {
    let userId = this.context.globalState.get<string>('telemetry.userId');
    if (!userId) {
      userId = uuidv4();
      this.context.globalState.update('telemetry.userId', userId);
    }
    return userId;
  }
  
  private getTelemetryEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('voiceflow');
    return config.get<boolean>('telemetry.enabled', true);
  }
  
  // Track command execution
  trackCommand(command: string, success: boolean, duration: number): void {
    if (!this.enabled) return;
    
    this.trackEvent({
      type: 'command_executed',
      command: this.anonymizeCommand(command),
      success,
      duration
    });
  }
  
  // Track errors
  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.enabled) return;
    
    this.trackEvent({
      type: 'error',
      errorType: error.name,
      errorMessage: this.sanitizeErrorMessage(error.message),
      stackTrace: this.sanitizeStackTrace(error.stack),
      context: {
        ...context,
        platform: process.platform,
        vscodeVersion: vscode.version,
        extensionVersion: this.context.extension.packageJSON.version
      }
    });
  }
  
  // Track performance metrics
  trackPerformance(metric: string, value: number, context?: Record<string, any>): void {
    if (!this.enabled) return;
    
    this.trackEvent({
      type: 'performance',
      metric,
      value,
      context
    });
  }
  
  // Track feature usage
  trackFeature(feature: string, firstUse: boolean = false): void {
    if (!this.enabled) return;
    
    this.trackEvent({
      type: 'feature_used',
      feature,
      firstUse
    });
  }
  
  private trackEvent(event: Partial<TelemetryEvent>): void {
    const fullEvent: TelemetryEvent = {
      ...event,
      type: event.type || 'unknown',
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };
    
    this.eventQueue.push(fullEvent);
    
    // Flush if queue is large
    if (this.eventQueue.length >= 50) {
      this.flush();
    }
  }
  
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      // Send to telemetry endpoint (Supabase, PostHog, or custom)
      await this.sendEvents(events);
    } catch (error) {
      console.error('Failed to send telemetry:', error);
      // Re-queue events on failure (with limit)
      if (this.eventQueue.length < 1000) {
        this.eventQueue.unshift(...events);
      }
    }
  }
  
  private async sendEvents(events: TelemetryEvent[]): Promise<void> {
    // Option 1: Supabase (already integrated)
    // await supabase.from('telemetry_events').insert(events);
    
    // Option 2: PostHog (popular for product analytics)
    // await posthog.capture(events);
    
    // Option 3: Custom endpoint
    // await fetch('https://api.voicecode.com/telemetry', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(events)
    // });
    
    // For now, log to console (replace with actual implementation)
    console.log(`[Telemetry] Sent ${events.length} events`);
  }
  
  private anonymizeCommand(command: string): string {
    // Remove file paths, user data, etc.
    return command.split(':')[0]; // e.g., "open_file:secrets.txt" -> "open_file"
  }
  
  private sanitizeErrorMessage(message: string): string {
    // Remove file paths, user names, etc.
    return message
      .replace(/\/[^\s]+/g, '[PATH]')
      .replace(/C:\\[^\s]+/g, '[PATH]')
      .replace(/Users\/[^\s]+/g, '[USER]');
  }
  
  private sanitizeStackTrace(stack?: string): string | undefined {
    if (!stack) return undefined;
    return this.sanitizeErrorMessage(stack);
  }
  
  dispose(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(); // Final flush
  }
}
```

---

## Implementation Steps

### Week 1 - Day 5

1. ✅ Create `TelemetryService.ts`
2. ✅ Add telemetry settings to `package.json`
3. ✅ Integrate with existing services
4. ✅ Set up Supabase table for events
5. ✅ Add privacy policy to README
6. ✅ Test event collection
7. ✅ Create telemetry dashboard

---

## Metrics to Track

### Critical Metrics (Week 1)
- [ ] Daily Active Users (DAU)
- [ ] Command execution rate
- [ ] Error rate by type
- [ ] Voice recognition accuracy
- [ ] Average session duration

### Growth Metrics (Week 2-4)
- [ ] User retention (D1, D7, D30)
- [ ] Feature adoption rate
- [ ] Conversion to paid (when implemented)
- [ ] Churn rate
- [ ] NPS (Net Promoter Score)

---

## Privacy Policy

Add to README.md:

```markdown
## Privacy & Telemetry

VoiceCode collects anonymous usage data to improve the extension. We:

- ✅ **Never collect** personal information, code, or file contents
- ✅ **Anonymize** all user IDs and commands
- ✅ **Respect** your privacy with opt-in telemetry
- ✅ **Comply** with GDPR and privacy regulations

You can disable telemetry in settings:
```json
{
  "voiceflow.telemetry.enabled": false
}
```

For more details, see our [Privacy Policy](https://github.com/kimhons/VoiceCode-PRO/blob/master/PRIVACY.md).
```

---

## Dashboard (PostHog or Custom)

### Key Views
1. **Overview**: DAU, MAU, command count, error rate
2. **Commands**: Most used commands, success rate
3. **Performance**: Latency metrics, model load times
4. **Errors**: Error types, frequency, affected users
5. **Funnel**: Onboarding completion rate

---

## Success Criteria

- ✅ Telemetry captures 95%+ of events
- ✅ Privacy-compliant (no PII)
- ✅ Dashboard shows real-time data
- ✅ Error rate <5%
- ✅ User opt-out rate <10%

