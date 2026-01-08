/**
 * Telemetry and Analytics Service
 * Tracks usage metrics, errors, and performance for product optimization
 * Privacy-respecting with opt-out capability
 */

import * as vscode from 'vscode';

/**
 * Telemetry Event Types
 */
export type TelemetryEventType =
  | 'activation'
  | 'deactivation'
  | 'command_executed'
  | 'voice_recognition_started'
  | 'voice_recognition_completed'
  | 'voice_recognition_error'
  | 'ai_request_started'
  | 'ai_request_completed'
  | 'ai_request_error'
  | 'file_edit_applied'
  | 'file_edit_reverted'
  | 'provider_switched'
  | 'extension_activated'
  | 'extension_deactivated'
  | 'feature_used'
  | 'error_occurred'
  | 'performance_metric'
  | 'chat_feedback'
  | 'chat_request_completed';

/**
 * Telemetry Event
 */
export interface TelemetryEvent {
  type: TelemetryEventType;
  timestamp: Date;
  sessionId: string;
  properties: Record<string, string | number | boolean>;
  measurements?: Record<string, number>;
}

/**
 * Performance Metric
 */
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, string>;
}

/**
 * Usage Statistics
 */
export interface UsageStatistics {
  totalCommands: number;
  commandsByType: Record<string, number>;
  totalVoiceRecognitions: number;
  successfulRecognitions: number;
  failedRecognitions: number;
  totalAIRequests: number;
  aiRequestsByProvider: Record<string, number>;
  totalFileEdits: number;
  averageResponseTime: number;
  errorRate: number;
  sessionDuration: number;
  featuresUsed: string[];
}

/**
 * Error Report
 */
export interface ErrorReport {
  id: string;
  type: string;
  message: string;
  stack?: string;
  timestamp: Date;
  context: Record<string, string>;
  frequency: number;
}

/**
 * Telemetry Service
 */
export class TelemetryService {
  private config: vscode.WorkspaceConfiguration;
  private enabled: boolean = true;
  private sessionId: string;
  private events: TelemetryEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private errorReports: Map<string, ErrorReport> = new Map();
  private sessionStartTime: Date;
  private commandCounts: Map<string, number> = new Map();
  private providerCounts: Map<string, number> = new Map();
  private context?: vscode.ExtensionContext;


  
  // Event emitters
  private readonly _onEventRecorded = new vscode.EventEmitter<TelemetryEvent>();
  private readonly _onErrorReported = new vscode.EventEmitter<ErrorReport>();
  
  public readonly onEventRecorded = this._onEventRecorded.event;
  public readonly onErrorReported = this._onErrorReported.event;

  // Performance tracking
  private activeTimers: Map<string, number> = new Map();

  constructor(config: vscode.WorkspaceConfiguration) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
    this.enabled = config.get<boolean>('telemetryEnabled', true);
    
    // Record extension activation
    this.recordEvent('extension_activated', {
      version: vscode.extensions.getExtension('voiceflow.voiceflow-pro')?.packageJSON.version || 'unknown',
    });
  }

  /**
   * Initialize with extension context and show consent dialog if needed
   */
  async initializeWithContext(context: vscode.ExtensionContext): Promise<void> {
    this.context = context;

    // Check if consent has been shown before
    const consentShown = context.globalState.get<boolean>('voiceflow.telemetryConsentShown', false);
    const previousChoice = context.globalState.get<boolean>('voiceflow.telemetryConsent');

    if (!consentShown) {
      await this.showConsentDialog(context);
    } else if (previousChoice !== undefined) {
      this.enabled = previousChoice;
    }
  }

  /**
   * Show the telemetry consent dialog
   */
  private async showConsentDialog(context: vscode.ExtensionContext): Promise<void> {
    const message = 'VoiceFlow Pro collects anonymous usage data to improve the extension. ' +
      'This includes command usage, performance metrics, and error reports. ' +
      'No personal information or code content is collected. Would you like to help improve VoiceFlow Pro?';

    const learnMore = 'Learn More';
    const accept = 'Yes, I want to help';
    const decline = 'No, thanks';

    const selection = await vscode.window.showInformationMessage(
      message,
      { modal: false },
      accept,
      decline,
      learnMore
    );

    if (selection === learnMore) {
      vscode.env.openExternal(vscode.Uri.parse('https://voiceflow.pro/privacy'));
      await this.showConsentDialog(context);
      return;
    }

    const consent = selection === accept;
    this.enabled = consent;

    await context.globalState.update('voiceflow.telemetryConsentShown', true);
    await context.globalState.update('voiceflow.telemetryConsent', consent);
    await this.config.update('telemetryEnabled', consent, vscode.ConfigurationTarget.Global);

    if (consent) {
      this.recordEvent('feature_used', {
        feature: 'telemetry_consent',
        choice: 'accepted',
      });
      vscode.window.showInformationMessage('Thank you for helping improve VoiceFlow Pro!');
    } else {
      console.log('[TelemetryService] User declined telemetry collection');
    }
  }

  /**
   * Allow user to change consent later
   */
  async promptConsentChange(): Promise<void> {
    if (!this.context) {
      vscode.window.showWarningMessage('TelemetryService not initialized with context');
      return;
    }

    const currentStatus = this.enabled ? 'enabled' : 'disabled';
    const action = this.enabled ? 'Disable' : 'Enable';

    const message = `Telemetry is currently ${currentStatus}. Would you like to ${action.toLowerCase()} it?`;

    const result = await vscode.window.showInformationMessage(
      message,
      { modal: false },
      action,
      'Cancel'
    );

    if (result === action) {
      const newState = !this.enabled;
      this.enabled = newState;

      await this.context.globalState.update('voiceflow.telemetryConsent', newState);
      await this.config.update('telemetryEnabled', newState, vscode.ConfigurationTarget.Global);

      vscode.window.showInformationMessage(
        `Telemetry has been ${newState ? 'enabled' : 'disabled'}.`
      );
    }
  }

  /**
   * Check if consent dialog has been shown
   */
  hasConsentBeenShown(): boolean {
    return this.context?.globalState.get<boolean>('voiceflow.telemetryConsentShown') ?? false;
  }


  /**
   * Check if telemetry is enabled
   */
  public isEnabled(): boolean {
    return this.enabled && vscode.env.isTelemetryEnabled;
  }

  /**
   * Enable or disable telemetry
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.recordEvent('feature_used', {
      feature: 'telemetry_toggle',
      enabled: enabled.toString(),
    });
  }

  /**
   * Record a telemetry event
   */
  public recordEvent(
    type: TelemetryEventType,
    properties: Record<string, string | number | boolean> = {},
    measurements?: Record<string, number>
  ): void {
    if (!this.isEnabled()) {
      return;
    }

    const event: TelemetryEvent = {
      type,
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties: this.sanitizeProperties(properties),
      measurements,
    };

    this.events.push(event);
    this._onEventRecorded.fire(event);

    // Update counters
    if (type === 'command_executed' && properties.command) {
      const cmd = String(properties.command);
      this.commandCounts.set(cmd, (this.commandCounts.get(cmd) || 0) + 1);
    }

    if (type === 'ai_request_completed' && properties.provider) {
      const provider = String(properties.provider);
      this.providerCounts.set(provider, (this.providerCounts.get(provider) || 0) + 1);
    }

    // Flush events periodically
    if (this.events.length >= 100) {
      this.flushEvents();
    }
  }

  /**
   * Record a command execution
   */
  public recordCommand(command: string, success: boolean, duration?: number): void {
    this.recordEvent('command_executed', {
      command,
      success,
    }, duration ? { duration } : undefined);
  }

  /**
   * Record voice recognition event
   */
  public recordVoiceRecognition(
    success: boolean,
    transcript?: string,
    confidence?: number,
    duration?: number
  ): void {
    const eventType = success ? 'voice_recognition_completed' : 'voice_recognition_error';
    this.recordEvent(eventType, {
      success,
      hasTranscript: !!transcript,
      confidence: confidence || 0,
    }, duration ? { duration } : undefined);
  }

  /**
   * Record AI request
   */
  public recordAIRequest(
    provider: string,
    requestType: string,
    success: boolean,
    duration?: number,
    tokenCount?: number
  ): void {
    const eventType = success ? 'ai_request_completed' : 'ai_request_error';
    this.recordEvent(eventType, {
      provider,
      requestType,
      success,
    }, {
      ...(duration ? { duration } : {}),
      ...(tokenCount ? { tokenCount } : {}),
    });
  }

  /**
   * Record an error
   */
  public recordError(error: Error, context: Record<string, string> = {}): void {
    const errorId = this.generateErrorId(error);

    let report = this.errorReports.get(errorId);
    if (report) {
      report.frequency++;
      report.timestamp = new Date();
    } else {
      report = {
        id: errorId,
        type: error.name,
        message: error.message,
        stack: this.sanitizeStack(error.stack),
        timestamp: new Date(),
        context: this.sanitizeProperties(context) as Record<string, string>,
        frequency: 1,
      };
      this.errorReports.set(errorId, report);
    }

    this._onErrorReported.fire(report);
    this.recordEvent('error_occurred', {
      errorType: error.name,
      errorMessage: error.message.substring(0, 100),
      ...context,
    });
  }

  /**
   * Start a performance timer
   */
  public startTimer(name: string): void {
    this.activeTimers.set(name, Date.now());
  }

  /**
   * Stop a performance timer and record the metric
   */
  public stopTimer(name: string, metadata?: Record<string, string>): number {
    const startTime = this.activeTimers.get(name);
    if (!startTime) {
      return 0;
    }

    const duration = Date.now() - startTime;
    this.activeTimers.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      metadata,
    };

    this.performanceMetrics.push(metric);
    this.recordEvent('performance_metric', {
      metricName: name,
      ...metadata,
    }, { duration });

    return duration;
  }

  /**
   * Record a feature usage
   */
  public recordFeatureUsage(feature: string, details?: Record<string, string>): void {
    this.recordEvent('feature_used', {
      feature,
      ...details,
    });
  }

  /**
   * Get usage statistics
   */
  public getStatistics(): UsageStatistics {
    const voiceEvents = this.events.filter(e =>
      e.type === 'voice_recognition_completed' || e.type === 'voice_recognition_error'
    );
    const successfulVoice = voiceEvents.filter(e => e.properties.success === true);

    const aiEvents = this.events.filter(e =>
      e.type === 'ai_request_completed' || e.type === 'ai_request_error'
    );

    const durations = this.performanceMetrics.map(m => m.duration);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const errorEvents = this.events.filter(e => e.type === 'error_occurred');
    const errorRate = this.events.length > 0
      ? errorEvents.length / this.events.length
      : 0;

    const featuresUsed = [...new Set(
      this.events
        .filter(e => e.type === 'feature_used')
        .map(e => String(e.properties.feature))
    )];

    return {
      totalCommands: this.events.filter(e => e.type === 'command_executed').length,
      commandsByType: Object.fromEntries(this.commandCounts),
      totalVoiceRecognitions: voiceEvents.length,
      successfulRecognitions: successfulVoice.length,
      failedRecognitions: voiceEvents.length - successfulVoice.length,
      totalAIRequests: aiEvents.length,
      aiRequestsByProvider: Object.fromEntries(this.providerCounts),
      totalFileEdits: this.events.filter(e => e.type === 'file_edit_applied').length,
      averageResponseTime: avgDuration,
      errorRate,
      sessionDuration: Date.now() - this.sessionStartTime.getTime(),
      featuresUsed,
    };
  }

  /**
   * Get error reports
   */
  public getErrorReports(): ErrorReport[] {
    return Array.from(this.errorReports.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get recent events
   */
  public getRecentEvents(count: number = 50): TelemetryEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  /**
   * Get performance metrics by name
   */
  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.performanceMetrics.filter(m => m.name === name);
  }

  /**
   * Get average metric duration by name
   */
  public getAverageMetricDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) {
      return 0;
    }
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Record service load performance
   */
  public recordServiceLoad(serviceName: string, duration: number, fromCache: boolean): void {
    this.recordEvent('performance_metric', {
      metricName: 'service_load',
      serviceName,
      fromCache,
    }, { duration });

    this.performanceMetrics.push({
      name: `service_load_${serviceName}`,
      duration,
      timestamp: new Date(),
      metadata: { fromCache: String(fromCache) },
    });
  }

  /**
   * Record model load performance
   */
  public recordModelLoad(
    modelName: string,
    duration: number,
    fromCache: boolean,
    modelSize?: number
  ): void {
    this.recordEvent('performance_metric', {
      metricName: 'model_load',
      modelName,
      fromCache,
    }, {
      duration,
      ...(modelSize ? { modelSize } : {}),
    });

    this.performanceMetrics.push({
      name: `model_load_${modelName}`,
      duration,
      timestamp: new Date(),
      metadata: {
        fromCache: String(fromCache),
        ...(modelSize ? { modelSize: String(modelSize) } : {}),
      },
    });
  }

  /**
   * Record voice recognition performance
   */
  public recordVoiceRecognitionPerformance(
    duration: number,
    audioLength: number,
    success: boolean,
    engine?: string
  ): void {
    this.recordEvent('performance_metric', {
      metricName: 'voice_recognition',
      success,
      ...(engine ? { engine } : {}),
    }, {
      duration,
      audioLength,
    });

    this.performanceMetrics.push({
      name: 'voice_recognition',
      duration,
      timestamp: new Date(),
      metadata: {
        success: String(success),
        audioLength: String(audioLength),
        ...(engine ? { engine } : {}),
      },
    });
  }

  /**
   * Record AI provider response performance
   */
  public recordAIResponsePerformance(
    provider: string,
    duration: number,
    tokenCount?: number,
    cached?: boolean
  ): void {
    this.recordEvent('performance_metric', {
      metricName: 'ai_response',
      provider,
      ...(cached !== undefined ? { cached } : {}),
    }, {
      duration,
      ...(tokenCount ? { tokenCount } : {}),
    });

    this.performanceMetrics.push({
      name: `ai_response_${provider}`,
      duration,
      timestamp: new Date(),
      metadata: {
        ...(tokenCount ? { tokenCount: String(tokenCount) } : {}),
        ...(cached !== undefined ? { cached: String(cached) } : {}),
      },
    });
  }

  /**
   * Record extension activation performance
   */
  public recordActivationPerformance(
    duration: number,
    userTier: string,
    servicesLoaded: number
  ): void {
    this.recordEvent('performance_metric', {
      metricName: 'extension_activation',
      userTier,
    }, {
      duration,
      servicesLoaded,
    });

    this.performanceMetrics.push({
      name: 'extension_activation',
      duration,
      timestamp: new Date(),
      metadata: {
        userTier,
        servicesLoaded: String(servicesLoaded),
      },
    });
  }

  /**
   * Record memory usage snapshot
   */
  public recordMemoryUsage(heapUsed?: number, heapTotal?: number): void {
    const measurements: Record<string, number> = {};

    if (heapUsed !== undefined) {
      measurements.heapUsed = heapUsed;
    }
    if (heapTotal !== undefined) {
      measurements.heapTotal = heapTotal;
    }

    this.recordEvent('performance_metric', {
      metricName: 'memory_usage',
    }, measurements);

    this.performanceMetrics.push({
      name: 'memory_usage',
      duration: 0, // Not a duration metric
      timestamp: new Date(),
      metadata: {
        ...(heapUsed ? { heapUsed: String(heapUsed) } : {}),
        ...(heapTotal ? { heapTotal: String(heapTotal) } : {}),
      },
    });
  }

  /**
   * Get performance summary report
   */
  public getPerformanceSummary(): {
    extensionActivation: { avg: number; count: number };
    serviceLoads: { avg: number; count: number; cacheHitRate: number };
    modelLoads: { avg: number; count: number; cacheHitRate: number };
    voiceRecognition: { avg: number; count: number; successRate: number };
    aiResponses: { avg: number; count: number; byProvider: Record<string, { avg: number; count: number }> };
    memoryUsage: { latest?: number; avg: number };
  } {
    // Extension activation
    const activationMetrics = this.getMetricsByName('extension_activation');
    const activationAvg = this.getAverageMetricDuration('extension_activation');

    // Service loads
    const serviceLoadMetrics = this.performanceMetrics.filter(m => m.name.startsWith('service_load_'));
    const serviceCached = serviceLoadMetrics.filter(m => m.metadata?.fromCache === 'true').length;
    const serviceCacheHitRate = serviceLoadMetrics.length > 0
      ? (serviceCached / serviceLoadMetrics.length) * 100
      : 0;

    // Model loads
    const modelLoadMetrics = this.performanceMetrics.filter(m => m.name.startsWith('model_load_'));
    const modelCached = modelLoadMetrics.filter(m => m.metadata?.fromCache === 'true').length;
    const modelCacheHitRate = modelLoadMetrics.length > 0
      ? (modelCached / modelLoadMetrics.length) * 100
      : 0;

    // Voice recognition
    const voiceMetrics = this.getMetricsByName('voice_recognition');
    const voiceSuccess = voiceMetrics.filter(m => m.metadata?.success === 'true').length;
    const voiceSuccessRate = voiceMetrics.length > 0
      ? (voiceSuccess / voiceMetrics.length) * 100
      : 0;

    // AI responses by provider
    const aiMetrics = this.performanceMetrics.filter(m => m.name.startsWith('ai_response_'));
    const aiByProvider: Record<string, { avg: number; count: number }> = {};

    const providers = new Set(aiMetrics.map(m => m.name.replace('ai_response_', '')));
    providers.forEach(provider => {
      const providerMetrics = this.getMetricsByName(`ai_response_${provider}`);
      aiByProvider[provider] = {
        avg: this.getAverageMetricDuration(`ai_response_${provider}`),
        count: providerMetrics.length,
      };
    });

    const aiAvg = aiMetrics.length > 0
      ? aiMetrics.reduce((sum, m) => sum + m.duration, 0) / aiMetrics.length
      : 0;

    // Memory usage
    const memoryMetrics = this.getMetricsByName('memory_usage');
    const latestMemory = memoryMetrics.length > 0
      ? parseInt(memoryMetrics[memoryMetrics.length - 1].metadata?.heapUsed || '0')
      : undefined;
    const avgMemory = memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + parseInt(m.metadata?.heapUsed || '0'), 0) / memoryMetrics.length
      : 0;

    return {
      extensionActivation: {
        avg: activationAvg,
        count: activationMetrics.length,
      },
      serviceLoads: {
        avg: serviceLoadMetrics.length > 0
          ? serviceLoadMetrics.reduce((sum, m) => sum + m.duration, 0) / serviceLoadMetrics.length
          : 0,
        count: serviceLoadMetrics.length,
        cacheHitRate: serviceCacheHitRate,
      },
      modelLoads: {
        avg: modelLoadMetrics.length > 0
          ? modelLoadMetrics.reduce((sum, m) => sum + m.duration, 0) / modelLoadMetrics.length
          : 0,
        count: modelLoadMetrics.length,
        cacheHitRate: modelCacheHitRate,
      },
      voiceRecognition: {
        avg: this.getAverageMetricDuration('voice_recognition'),
        count: voiceMetrics.length,
        successRate: voiceSuccessRate,
      },
      aiResponses: {
        avg: aiAvg,
        count: aiMetrics.length,
        byProvider: aiByProvider,
      },
      memoryUsage: {
        latest: latestMemory,
        avg: avgMemory,
      },
    };
  }

  /**
   * Flush events to storage/server
   */
  private async flushEvents(): Promise<void> {
    if (!this.isEnabled() || this.events.length === 0) {
      return;
    }

    // Store events locally for now
    // In production, this would send to a telemetry server
    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      // Store in workspace state for persistence
      const context = await this.getExtensionContext();
      if (context) {
        const existingEvents = context.globalState.get<TelemetryEvent[]>('telemetryEvents', []);
        const allEvents = [...existingEvents, ...eventsToFlush].slice(-1000); // Keep last 1000 events
        await context.globalState.update('telemetryEvents', allEvents);
      }
    } catch (error) {
      // Restore events if flush failed
      this.events = [...eventsToFlush, ...this.events];
      console.error('Failed to flush telemetry events:', error);
    }
  }

  /**
   * Get extension context (for storage)
   */
  private async getExtensionContext(): Promise<vscode.ExtensionContext | undefined> {
    const extension = vscode.extensions.getExtension('voiceflow.voiceflow-pro');
    return extension?.exports?.context;
  }

  /**
   * Sanitize properties to remove PII
   */
  private sanitizeProperties(
    properties: Record<string, string | number | boolean>
  ): Record<string, string | number | boolean> {
    const sanitized: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(properties)) {
      // Skip potentially sensitive keys
      if (key.toLowerCase().includes('path') ||
          key.toLowerCase().includes('file') ||
          key.toLowerCase().includes('content') ||
          key.toLowerCase().includes('code')) {
        continue;
      }

      if (typeof value === 'string') {
        // Truncate long strings and remove potential PII
        sanitized[key] = value.substring(0, 200);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize stack trace
   */
  private sanitizeStack(stack?: string): string | undefined {
    if (!stack) {
      return undefined;
    }

    // Remove file paths and keep only function names and line numbers
    return stack
      .split('\n')
      .slice(0, 10)
      .map(line => line.replace(/\(.*\)/g, ''))
      .join('\n');
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate error ID for deduplication
   */
  private generateErrorId(error: Error): string {
    return `${error.name}_${error.message.substring(0, 50)}`;
  }

  /**
   * Export telemetry data for debugging
   */
  public exportData(): {
    statistics: UsageStatistics;
    recentEvents: TelemetryEvent[];
    errorReports: ErrorReport[];
    performanceMetrics: PerformanceMetric[];
  } {
    return {
      statistics: this.getStatistics(),
      recentEvents: this.getRecentEvents(100),
      errorReports: this.getErrorReports(),
      performanceMetrics: this.getPerformanceMetrics(),
    };
  }

  /**
   * Clear all telemetry data
   */
  public clearData(): void {
    this.events = [];
    this.performanceMetrics = [];
    this.errorReports.clear();
    this.commandCounts.clear();
    this.providerCounts.clear();
    this.activeTimers.clear();
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.recordEvent('extension_deactivated', {
      sessionDuration: Date.now() - this.sessionStartTime.getTime(),
    });

    this.flushEvents();
    this._onEventRecorded.dispose();
    this._onErrorReported.dispose();
  }
}

export default TelemetryService;
