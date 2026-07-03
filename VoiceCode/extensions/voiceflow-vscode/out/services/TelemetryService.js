"use strict";
/**
 * Telemetry and Analytics Service
 * Tracks usage metrics, errors, and performance for product optimization
 * Privacy-respecting with opt-out capability
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryService = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Telemetry Service
 */
class TelemetryService {
    config;
    enabled = true;
    sessionId;
    events = [];
    performanceMetrics = [];
    errorReports = new Map();
    sessionStartTime;
    commandCounts = new Map();
    providerCounts = new Map();
    context;
    // Event emitters
    _onEventRecorded = new vscode.EventEmitter();
    _onErrorReported = new vscode.EventEmitter();
    onEventRecorded = this._onEventRecorded.event;
    onErrorReported = this._onErrorReported.event;
    // Performance tracking
    activeTimers = new Map();
    constructor(config) {
        this.config = config;
        this.sessionId = this.generateSessionId();
        this.sessionStartTime = new Date();
        this.enabled = config.get('telemetryEnabled', true);
        // Record extension activation
        this.recordEvent('extension_activated', {
            version: vscode.extensions.getExtension('voiceflow.voiceflow-pro')?.packageJSON.version || 'unknown',
        });
    }
    /**
     * Initialize with extension context and show consent dialog if needed
     */
    async initializeWithContext(context) {
        this.context = context;
        // Check if consent has been shown before
        const consentShown = context.globalState.get('voiceflow.telemetryConsentShown', false);
        const previousChoice = context.globalState.get('voiceflow.telemetryConsent');
        if (!consentShown) {
            await this.showConsentDialog(context);
        }
        else if (previousChoice !== undefined) {
            this.enabled = previousChoice;
        }
    }
    /**
     * Show the telemetry consent dialog
     */
    async showConsentDialog(context) {
        const message = 'VoiceFlow Pro collects anonymous usage data to improve the extension. ' +
            'This includes command usage, performance metrics, and error reports. ' +
            'No personal information or code content is collected. Would you like to help improve VoiceFlow Pro?';
        const learnMore = 'Learn More';
        const accept = 'Yes, I want to help';
        const decline = 'No, thanks';
        const selection = await vscode.window.showInformationMessage(message, { modal: false }, accept, decline, learnMore);
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
        }
        else {
            console.log('[TelemetryService] User declined telemetry collection');
        }
    }
    /**
     * Allow user to change consent later
     */
    async promptConsentChange() {
        if (!this.context) {
            vscode.window.showWarningMessage('TelemetryService not initialized with context');
            return;
        }
        const currentStatus = this.enabled ? 'enabled' : 'disabled';
        const action = this.enabled ? 'Disable' : 'Enable';
        const message = `Telemetry is currently ${currentStatus}. Would you like to ${action.toLowerCase()} it?`;
        const result = await vscode.window.showInformationMessage(message, { modal: false }, action, 'Cancel');
        if (result === action) {
            const newState = !this.enabled;
            this.enabled = newState;
            await this.context.globalState.update('voiceflow.telemetryConsent', newState);
            await this.config.update('telemetryEnabled', newState, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Telemetry has been ${newState ? 'enabled' : 'disabled'}.`);
        }
    }
    /**
     * Check if consent dialog has been shown
     */
    hasConsentBeenShown() {
        return this.context?.globalState.get('voiceflow.telemetryConsentShown') ?? false;
    }
    /**
     * Check if telemetry is enabled
     */
    isEnabled() {
        return this.enabled && vscode.env.isTelemetryEnabled;
    }
    /**
     * Enable or disable telemetry
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.recordEvent('feature_used', {
            feature: 'telemetry_toggle',
            enabled: enabled.toString(),
        });
    }
    /**
     * Record a telemetry event
     */
    recordEvent(type, properties = {}, measurements) {
        if (!this.isEnabled()) {
            return;
        }
        const event = {
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
    recordCommand(command, success, duration) {
        this.recordEvent('command_executed', {
            command,
            success,
        }, duration ? { duration } : undefined);
    }
    /**
     * Record voice recognition event
     */
    recordVoiceRecognition(success, transcript, confidence, duration) {
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
    recordAIRequest(provider, requestType, success, duration, tokenCount) {
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
    recordError(error, context = {}) {
        const errorId = this.generateErrorId(error);
        let report = this.errorReports.get(errorId);
        if (report) {
            report.frequency++;
            report.timestamp = new Date();
        }
        else {
            report = {
                id: errorId,
                type: error.name,
                message: error.message,
                stack: this.sanitizeStack(error.stack),
                timestamp: new Date(),
                context: this.sanitizeProperties(context),
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
    startTimer(name) {
        this.activeTimers.set(name, Date.now());
    }
    /**
     * Stop a performance timer and record the metric
     */
    stopTimer(name, metadata) {
        const startTime = this.activeTimers.get(name);
        if (!startTime) {
            return 0;
        }
        const duration = Date.now() - startTime;
        this.activeTimers.delete(name);
        const metric = {
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
    recordFeatureUsage(feature, details) {
        this.recordEvent('feature_used', {
            feature,
            ...details,
        });
    }
    /**
     * Get usage statistics
     */
    getStatistics() {
        const voiceEvents = this.events.filter(e => e.type === 'voice_recognition_completed' || e.type === 'voice_recognition_error');
        const successfulVoice = voiceEvents.filter(e => e.properties.success === true);
        const aiEvents = this.events.filter(e => e.type === 'ai_request_completed' || e.type === 'ai_request_error');
        const durations = this.performanceMetrics.map(m => m.duration);
        const avgDuration = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;
        const errorEvents = this.events.filter(e => e.type === 'error_occurred');
        const errorRate = this.events.length > 0
            ? errorEvents.length / this.events.length
            : 0;
        const featuresUsed = [...new Set(this.events
                .filter(e => e.type === 'feature_used')
                .map(e => String(e.properties.feature)))];
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
    getErrorReports() {
        return Array.from(this.errorReports.values())
            .sort((a, b) => b.frequency - a.frequency);
    }
    /**
     * Get recent events
     */
    getRecentEvents(count = 50) {
        return this.events.slice(-count);
    }
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return [...this.performanceMetrics];
    }
    /**
     * Get performance metrics by name
     */
    getMetricsByName(name) {
        return this.performanceMetrics.filter(m => m.name === name);
    }
    /**
     * Get average metric duration by name
     */
    getAverageMetricDuration(name) {
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
    recordServiceLoad(serviceName, duration, fromCache) {
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
    recordModelLoad(modelName, duration, fromCache, modelSize) {
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
    recordVoiceRecognitionPerformance(duration, audioLength, success, engine) {
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
    recordAIResponsePerformance(provider, duration, tokenCount, cached) {
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
    recordActivationPerformance(duration, userTier, servicesLoaded) {
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
    recordMemoryUsage(heapUsed, heapTotal) {
        const measurements = {};
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
    getPerformanceSummary() {
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
        const aiByProvider = {};
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
    async flushEvents() {
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
                const existingEvents = context.globalState.get('telemetryEvents', []);
                const allEvents = [...existingEvents, ...eventsToFlush].slice(-1000); // Keep last 1000 events
                await context.globalState.update('telemetryEvents', allEvents);
            }
        }
        catch (error) {
            // Restore events if flush failed
            this.events = [...eventsToFlush, ...this.events];
            console.error('Failed to flush telemetry events:', error);
        }
    }
    /**
     * Get extension context (for storage)
     */
    async getExtensionContext() {
        const extension = vscode.extensions.getExtension('voiceflow.voiceflow-pro');
        return extension?.exports?.context;
    }
    /**
     * Sanitize properties to remove PII
     */
    sanitizeProperties(properties) {
        const sanitized = {};
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
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    /**
     * Sanitize stack trace
     */
    sanitizeStack(stack) {
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
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    /**
     * Generate error ID for deduplication
     */
    generateErrorId(error) {
        return `${error.name}_${error.message.substring(0, 50)}`;
    }
    /**
     * Export telemetry data for debugging
     */
    exportData() {
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
    clearData() {
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
    dispose() {
        this.recordEvent('extension_deactivated', {
            sessionDuration: Date.now() - this.sessionStartTime.getTime(),
        });
        this.flushEvents();
        this._onEventRecorded.dispose();
        this._onErrorReported.dispose();
    }
}
exports.TelemetryService = TelemetryService;
exports.default = TelemetryService;
//# sourceMappingURL=TelemetryService.js.map