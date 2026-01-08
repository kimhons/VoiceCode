/**
 * Telemetry and Analytics Service
 * Tracks usage metrics, errors, and performance for product optimization
 * Privacy-respecting with opt-out capability
 */
import * as vscode from 'vscode';
/**
 * Telemetry Event Types
 */
export type TelemetryEventType = 'activation' | 'deactivation' | 'command_executed' | 'voice_recognition_started' | 'voice_recognition_completed' | 'voice_recognition_error' | 'ai_request_started' | 'ai_request_completed' | 'ai_request_error' | 'file_edit_applied' | 'file_edit_reverted' | 'provider_switched' | 'extension_activated' | 'extension_deactivated' | 'feature_used' | 'error_occurred' | 'performance_metric' | 'chat_feedback' | 'chat_request_completed';
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
export declare class TelemetryService {
    private config;
    private enabled;
    private sessionId;
    private events;
    private performanceMetrics;
    private errorReports;
    private sessionStartTime;
    private commandCounts;
    private providerCounts;
    private context?;
    private readonly _onEventRecorded;
    private readonly _onErrorReported;
    readonly onEventRecorded: vscode.Event<TelemetryEvent>;
    readonly onErrorReported: vscode.Event<ErrorReport>;
    private activeTimers;
    constructor(config: vscode.WorkspaceConfiguration);
    /**
     * Initialize with extension context and show consent dialog if needed
     */
    initializeWithContext(context: vscode.ExtensionContext): Promise<void>;
    /**
     * Show the telemetry consent dialog
     */
    private showConsentDialog;
    /**
     * Allow user to change consent later
     */
    promptConsentChange(): Promise<void>;
    /**
     * Check if consent dialog has been shown
     */
    hasConsentBeenShown(): boolean;
    /**
     * Check if telemetry is enabled
     */
    isEnabled(): boolean;
    /**
     * Enable or disable telemetry
     */
    setEnabled(enabled: boolean): void;
    /**
     * Record a telemetry event
     */
    recordEvent(type: TelemetryEventType, properties?: Record<string, string | number | boolean>, measurements?: Record<string, number>): void;
    /**
     * Record a command execution
     */
    recordCommand(command: string, success: boolean, duration?: number): void;
    /**
     * Record voice recognition event
     */
    recordVoiceRecognition(success: boolean, transcript?: string, confidence?: number, duration?: number): void;
    /**
     * Record AI request
     */
    recordAIRequest(provider: string, requestType: string, success: boolean, duration?: number, tokenCount?: number): void;
    /**
     * Record an error
     */
    recordError(error: Error, context?: Record<string, string>): void;
    /**
     * Start a performance timer
     */
    startTimer(name: string): void;
    /**
     * Stop a performance timer and record the metric
     */
    stopTimer(name: string, metadata?: Record<string, string>): number;
    /**
     * Record a feature usage
     */
    recordFeatureUsage(feature: string, details?: Record<string, string>): void;
    /**
     * Get usage statistics
     */
    getStatistics(): UsageStatistics;
    /**
     * Get error reports
     */
    getErrorReports(): ErrorReport[];
    /**
     * Get recent events
     */
    getRecentEvents(count?: number): TelemetryEvent[];
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): PerformanceMetric[];
    /**
     * Get performance metrics by name
     */
    getMetricsByName(name: string): PerformanceMetric[];
    /**
     * Get average metric duration by name
     */
    getAverageMetricDuration(name: string): number;
    /**
     * Record service load performance
     */
    recordServiceLoad(serviceName: string, duration: number, fromCache: boolean): void;
    /**
     * Record model load performance
     */
    recordModelLoad(modelName: string, duration: number, fromCache: boolean, modelSize?: number): void;
    /**
     * Record voice recognition performance
     */
    recordVoiceRecognitionPerformance(duration: number, audioLength: number, success: boolean, engine?: string): void;
    /**
     * Record AI provider response performance
     */
    recordAIResponsePerformance(provider: string, duration: number, tokenCount?: number, cached?: boolean): void;
    /**
     * Record extension activation performance
     */
    recordActivationPerformance(duration: number, userTier: string, servicesLoaded: number): void;
    /**
     * Record memory usage snapshot
     */
    recordMemoryUsage(heapUsed?: number, heapTotal?: number): void;
    /**
     * Get performance summary report
     */
    getPerformanceSummary(): {
        extensionActivation: {
            avg: number;
            count: number;
        };
        serviceLoads: {
            avg: number;
            count: number;
            cacheHitRate: number;
        };
        modelLoads: {
            avg: number;
            count: number;
            cacheHitRate: number;
        };
        voiceRecognition: {
            avg: number;
            count: number;
            successRate: number;
        };
        aiResponses: {
            avg: number;
            count: number;
            byProvider: Record<string, {
                avg: number;
                count: number;
            }>;
        };
        memoryUsage: {
            latest?: number;
            avg: number;
        };
    };
    /**
     * Flush events to storage/server
     */
    private flushEvents;
    /**
     * Get extension context (for storage)
     */
    private getExtensionContext;
    /**
     * Sanitize properties to remove PII
     */
    private sanitizeProperties;
    /**
     * Sanitize stack trace
     */
    private sanitizeStack;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Generate error ID for deduplication
     */
    private generateErrorId;
    /**
     * Export telemetry data for debugging
     */
    exportData(): {
        statistics: UsageStatistics;
        recentEvents: TelemetryEvent[];
        errorReports: ErrorReport[];
        performanceMetrics: PerformanceMetric[];
    };
    /**
     * Clear all telemetry data
     */
    clearData(): void;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default TelemetryService;
//# sourceMappingURL=TelemetryService.d.ts.map