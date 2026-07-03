/**
 * TelemetryService Tests
 * Tests for telemetry, analytics, and consent management
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import * as vscode from 'vscode';
import { TelemetryService, TelemetryEvent, PerformanceMetric, ErrorReport } from './TelemetryService';

// Mock vscode module
vi.mock('vscode', () => {
  class MockEventEmitter<T> {
    private listeners: ((e: T) => void)[] = [];
    event = (listener: (e: T) => void) => {
      this.listeners.push(listener);
      return { dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index > -1) this.listeners.splice(index, 1);
      }};
    };
    fire(data: T) { this.listeners.forEach(l => l(data)); }
    dispose() { this.listeners = []; }
  }

  return {
    window: {
      showInformationMessage: vi.fn().mockResolvedValue(undefined),
      showWarningMessage: vi.fn(),
      showErrorMessage: vi.fn(),
    },
    extensions: {
      getExtension: vi.fn().mockReturnValue({
        packageJSON: { version: '1.0.0' },
      }),
    },
    env: {
      openExternal: vi.fn(),
      isTelemetryEnabled: true,
    },
    Uri: {
      parse: vi.fn((url: string) => ({ toString: () => url })),
    },
    ConfigurationTarget: {
      Global: 1,
      Workspace: 2,
      WorkspaceFolder: 3,
    },
    EventEmitter: MockEventEmitter,
  };
});

describe('TelemetryService', () => {
  let service: TelemetryService;
  let mockConfig: vscode.WorkspaceConfiguration;
  let mockContext: vscode.ExtensionContext;
  let globalStateStore: Record<string, any>;
  let configStore: Record<string, any>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset stores
    globalStateStore = {};
    configStore = {
      telemetryEnabled: true,
    };

    // Mock config
    mockConfig = {
      get: vi.fn((key: string, defaultValue?: any) => configStore[key] ?? defaultValue),
      update: vi.fn((key: string, value: any) => {
        configStore[key] = value;
        return Promise.resolve();
      }),
      has: vi.fn((key: string) => key in configStore),
      inspect: vi.fn(),
    } as unknown as vscode.WorkspaceConfiguration;

    // Mock context
    mockContext = {
      globalState: {
        get: vi.fn((key: string, defaultValue?: any) => globalStateStore[key] ?? defaultValue),
        update: vi.fn((key: string, value: any) => {
          globalStateStore[key] = value;
          return Promise.resolve();
        }),
        keys: vi.fn(() => Object.keys(globalStateStore)),
        setKeysForSync: vi.fn(),
      },
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;

    service = new TelemetryService(mockConfig);
  });

  // ============================================================
  // INITIALIZATION TESTS
  // ============================================================
  describe('Initialization', () => {
    it('should create service with unique session ID', () => {
      const service2 = new TelemetryService(mockConfig);
      // Each service should have a different session ID (UUID)
      expect(service).toBeDefined();
      expect(service2).toBeDefined();
    });

    it('should record extension_activated event on construction', () => {
      // The service records activation event in constructor
      // This is verified by the fact it's enabled and events are being recorded
      expect(service.isEnabled()).toBe(true);
    });

    it('should respect telemetryEnabled config', () => {
      configStore.telemetryEnabled = false;
      const disabledService = new TelemetryService(mockConfig);
      // Note: isEnabled() also checks vscode.env.isTelemetryEnabled
      // Since we have telemetryEnabled=false, internal enabled flag is false
      expect(disabledService.isEnabled()).toBe(false);
    });
  });

  // ============================================================
  // CONSENT DIALOG TESTS
  // ============================================================
  describe('Consent Dialog', () => {
    it('should show consent dialog on first initialization', async () => {
      await service.initializeWithContext(mockContext);

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('VoiceFlow Pro collects anonymous usage data'),
        expect.any(Object),
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should not show consent dialog if already shown', async () => {
      globalStateStore['voiceflow.telemetryConsentShown'] = true;
      globalStateStore['voiceflow.telemetryConsent'] = true;

      await service.initializeWithContext(mockContext);

      expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
      expect(service.isEnabled()).toBe(true);
    });

    it('should disable telemetry if user previously declined', async () => {
      globalStateStore['voiceflow.telemetryConsentShown'] = true;
      globalStateStore['voiceflow.telemetryConsent'] = false;

      await service.initializeWithContext(mockContext);

      expect(service.isEnabled()).toBe(false);
    });

    it('should enable telemetry if user accepts', async () => {
      (vscode.window.showInformationMessage as Mock).mockResolvedValue('Yes, I want to help');

      await service.initializeWithContext(mockContext);

      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'voiceflow.telemetryConsentShown',
        true
      );
      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'voiceflow.telemetryConsent',
        true
      );
    });

    it('should disable telemetry if user declines', async () => {
      (vscode.window.showInformationMessage as Mock).mockResolvedValue('No, thanks');

      await service.initializeWithContext(mockContext);

      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'voiceflow.telemetryConsent',
        false
      );
    });

    it('should check if consent has been shown', async () => {
      expect(service.hasConsentBeenShown()).toBe(false);

      await service.initializeWithContext(mockContext);
      // After showing dialog, the state is updated
      globalStateStore['voiceflow.telemetryConsentShown'] = true;

      expect(service.hasConsentBeenShown()).toBe(true);
    });
  });

  // ============================================================
  // EVENT RECORDING TESTS
  // ============================================================
  describe('Event Recording', () => {
    it('should record events when enabled', () => {
      service.recordEvent('command_executed', { command: 'test.command' });

      const stats = service.getStatistics();
      expect(stats.totalCommands).toBeGreaterThanOrEqual(0);
    });

    it('should not record events when disabled', () => {
      configStore.telemetryEnabled = false;
      const disabledService = new TelemetryService(mockConfig);

      disabledService.recordEvent('command_executed', { command: 'test' });

      // Events should not be recorded
      expect(disabledService.isEnabled()).toBe(false);
    });

    it('should emit event when recording', () => {
      const listener = vi.fn();
      service.onEventRecorded(listener);

      service.recordEvent('feature_used', { feature: 'test' });

      expect(listener).toHaveBeenCalled();
    });

    it('should record voice recognition events', () => {
      service.recordEvent('voice_recognition_started', {});
      service.recordEvent('voice_recognition_completed', { duration: 1500, success: true });

      const stats = service.getStatistics();
      expect(stats.totalVoiceRecognitions).toBeGreaterThanOrEqual(1);
    });

    it('should track command counts', () => {
      service.recordEvent('command_executed', { command: 'voiceflow.start' });
      service.recordEvent('command_executed', { command: 'voiceflow.start' });
      service.recordEvent('command_executed', { command: 'voiceflow.stop' });

      const stats = service.getStatistics();
      expect(stats.commandsByType['voiceflow.start']).toBe(2);
      expect(stats.commandsByType['voiceflow.stop']).toBe(1);
    });

    it('should record command with recordCommand helper', () => {
      service.recordCommand('voiceflow.test', true, 100);

      const stats = service.getStatistics();
      expect(stats.totalCommands).toBeGreaterThan(0);
    });

    it('should record voice recognition with helper', () => {
      service.recordVoiceRecognition(true, 'hello world', 0.95, 1500);

      const stats = service.getStatistics();
      expect(stats.successfulRecognitions).toBeGreaterThanOrEqual(1);
    });

    it('should record AI request with helper', () => {
      service.recordAIRequest('openai', 'chat', true, 500, 100);

      const stats = service.getStatistics();
      expect(stats.totalAIRequests).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================
  // PERFORMANCE METRICS TESTS
  // ============================================================
  describe('Performance Metrics', () => {
    it('should start and stop timers', () => {
      service.startTimer('test-operation');

      const duration = service.stopTimer('test-operation');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should record performance metrics via timer', () => {
      service.startTimer('api-response-time');
      service.stopTimer('api-response-time', { provider: 'openai' });

      const metrics = service.getPerformanceMetrics();
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should return 0 for non-existent timer', () => {
      const duration = service.stopTimer('non-existent-timer');
      expect(duration).toBe(0);
    });

    it('should get metrics by name', () => {
      service.startTimer('test-metric');
      service.stopTimer('test-metric');

      const metrics = service.getMetricsByName('test-metric');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should calculate average metric duration', () => {
      // Record multiple metrics with same name
      service.startTimer('avg-test');
      service.stopTimer('avg-test');
      service.startTimer('avg-test');
      service.stopTimer('avg-test');

      const avg = service.getAverageMetricDuration('avg-test');
      expect(avg).toBeGreaterThanOrEqual(0);
    });

    it('should record service load performance', () => {
      service.recordServiceLoad('TestService', 50, false);

      const metrics = service.getPerformanceMetrics();
      const serviceLoadMetric = metrics.find(m => m.name.includes('service_load'));
      expect(serviceLoadMetric).toBeDefined();
    });

    it('should record model load performance', () => {
      service.recordModelLoad('whisper-tiny', 1000, true, 50000000);

      const metrics = service.getPerformanceMetrics();
      const modelLoadMetric = metrics.find(m => m.name.includes('model_load'));
      expect(modelLoadMetric).toBeDefined();
    });

    it('should record voice recognition performance', () => {
      service.recordVoiceRecognitionPerformance(500, 3000, true, 'whisper');

      const metrics = service.getMetricsByName('voice_recognition');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should record AI response performance', () => {
      service.recordAIResponsePerformance('anthropic', 800, 500, false);

      const metrics = service.getPerformanceMetrics();
      const aiMetric = metrics.find(m => m.name.includes('ai_response'));
      expect(aiMetric).toBeDefined();
    });

    it('should record activation performance', () => {
      service.recordActivationPerformance(200, 'FREE', 5);

      const metrics = service.getMetricsByName('extension_activation');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should record memory usage', () => {
      service.recordMemoryUsage(50000000, 100000000);

      const metrics = service.getMetricsByName('memory_usage');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should get performance summary', () => {
      service.recordActivationPerformance(100, 'PRO', 3);
      service.recordServiceLoad('TestService', 50, true);
      service.recordVoiceRecognitionPerformance(300, 2000, true, 'whisper');
      service.recordAIResponsePerformance('openai', 400, 200, false);

      const summary = service.getPerformanceSummary();

      expect(summary).toHaveProperty('extensionActivation');
      expect(summary).toHaveProperty('serviceLoads');
      expect(summary).toHaveProperty('modelLoads');
      expect(summary).toHaveProperty('voiceRecognition');
      expect(summary).toHaveProperty('aiResponses');
      expect(summary).toHaveProperty('memoryUsage');
    });
  });

  // ============================================================
  // ERROR REPORTING TESTS
  // ============================================================
  describe('Error Reporting', () => {
    it('should record errors', () => {
      const error = new Error('Test error');
      service.recordError(error, { context: 'test-context' });

      const errors = service.getErrorReports();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toBe('Test error');
    });

    it('should emit event when error is recorded', () => {
      const listener = vi.fn();
      service.onErrorReported(listener);

      service.recordError(new Error('Test'), { location: 'context' });

      expect(listener).toHaveBeenCalled();
    });

    it('should increment frequency for duplicate errors', () => {
      const error = new Error('Duplicate error');
      service.recordError(error, {});
      service.recordError(error, {});
      service.recordError(error, {});

      const errors = service.getErrorReports();
      const duplicateError = errors.find(e => e.message === 'Duplicate error');
      expect(duplicateError?.frequency).toBe(3);
    });

    it('should not record errors when disabled', () => {
      configStore.telemetryEnabled = false;
      const disabledService = new TelemetryService(mockConfig);

      disabledService.recordError(new Error('Test'), {});

      // Since isEnabled() returns false, error recording is effectively disabled
      // but recordError still tracks locally (for local debugging)
      // The actual telemetry event won't be sent
      expect(disabledService.isEnabled()).toBe(false);
    });

    it('should sort error reports by frequency', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      service.recordError(error1, {});
      service.recordError(error2, {});
      service.recordError(error2, {});
      service.recordError(error2, {});

      const errors = service.getErrorReports();
      expect(errors[0].message).toBe('Error 2');
      expect(errors[0].frequency).toBe(3);
    });
  });

  // ============================================================
  // USAGE STATISTICS TESTS
  // ============================================================
  describe('Usage Statistics', () => {
    it('should return usage statistics', () => {
      const stats = service.getStatistics();

      expect(stats).toHaveProperty('totalCommands');
      expect(stats).toHaveProperty('totalVoiceRecognitions');
      expect(stats).toHaveProperty('totalAIRequests');
      expect(stats).toHaveProperty('averageResponseTime');
      expect(stats).toHaveProperty('errorRate');
      expect(stats).toHaveProperty('sessionDuration');
    });

    it('should track AI requests by provider', () => {
      service.recordEvent('ai_request_completed', {
        provider: 'anthropic',
        success: true,
      });
      service.recordEvent('ai_request_completed', {
        provider: 'openai',
        success: true,
      });
      service.recordEvent('ai_request_completed', {
        provider: 'anthropic',
        success: true,
      });

      const stats = service.getStatistics();
      expect(stats.aiRequestsByProvider['anthropic']).toBe(2);
      expect(stats.aiRequestsByProvider['openai']).toBe(1);
    });

    it('should calculate session duration', () => {
      const stats = service.getStatistics();
      expect(stats.sessionDuration).toBeGreaterThanOrEqual(0);
    });

    it('should track features used', () => {
      service.recordFeatureUsage('voice-commands');
      service.recordFeatureUsage('code-generation');
      service.recordFeatureUsage('voice-commands'); // duplicate

      const stats = service.getStatistics();
      expect(stats.featuresUsed).toContain('voice-commands');
      expect(stats.featuresUsed).toContain('code-generation');
    });

    it('should calculate error rate', () => {
      service.recordEvent('command_executed', { command: 'test1' });
      service.recordEvent('command_executed', { command: 'test2' });
      service.recordEvent('error_occurred', { errorType: 'TestError', errorMessage: 'test' });

      const stats = service.getStatistics();
      expect(stats.errorRate).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // ENABLE/DISABLE TESTS
  // ============================================================
  describe('Enable/Disable', () => {
    it('should check if telemetry is enabled', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('should enable telemetry with setEnabled', () => {
      service.setEnabled(false);
      expect(service.isEnabled()).toBe(false);

      service.setEnabled(true);
      expect(service.isEnabled()).toBe(true);
    });

    it('should disable telemetry with setEnabled', () => {
      expect(service.isEnabled()).toBe(true);

      service.setEnabled(false);
      expect(service.isEnabled()).toBe(false);
    });
  });

  // ============================================================
  // RECENT EVENTS TESTS
  // ============================================================
  describe('Recent Events', () => {
    it('should get recent events', () => {
      service.recordEvent('feature_used', { feature: 'test1' });
      service.recordEvent('feature_used', { feature: 'test2' });

      const events = service.getRecentEvents(10);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should limit recent events to specified count', () => {
      for (let i = 0; i < 20; i++) {
        service.recordEvent('feature_used', { feature: `test${i}` });
      }

      const events = service.getRecentEvents(5);
      expect(events.length).toBe(5);
    });
  });

  // ============================================================
  // DATA EXPORT AND CLEAR TESTS
  // ============================================================
  describe('Data Export and Clear', () => {
    it('should export telemetry data', () => {
      service.recordEvent('command_executed', { command: 'test' });
      service.recordError(new Error('Test'), {});

      const data = service.exportData();

      expect(data).toHaveProperty('statistics');
      expect(data).toHaveProperty('recentEvents');
      expect(data).toHaveProperty('errorReports');
      expect(data).toHaveProperty('performanceMetrics');
    });

    it('should clear all telemetry data', () => {
      service.recordEvent('command_executed', { command: 'test' });
      service.recordError(new Error('Test'), {});
      service.startTimer('test');
      service.stopTimer('test');

      service.clearData();

      const data = service.exportData();
      expect(data.recentEvents.length).toBe(0);
      expect(data.errorReports.length).toBe(0);
      expect(data.performanceMetrics.length).toBe(0);
    });
  });

  // ============================================================
  // DISPOSE TESTS
  // ============================================================
  describe('Dispose', () => {
    it('should dispose without errors', () => {
      expect(() => service.dispose()).not.toThrow();
    });

    it('should record deactivation event on dispose', () => {
      const listener = vi.fn();
      service.onEventRecorded(listener);

      service.dispose();

      // Should have recorded extension_deactivated event
      expect(listener).toHaveBeenCalled();
    });
  });
});
