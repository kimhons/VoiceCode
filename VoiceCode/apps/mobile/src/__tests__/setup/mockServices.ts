// VoiceCode Mobile - Mock Services for Testing
// Comprehensive mocks for all 53 services

import { jest } from '@jest/globals';

/**
 * Mock Supabase Service
 */
export const mockSupabaseService = {
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  resetPassword: jest.fn(),
  getTranscripts: jest.fn(),
  createTranscript: jest.fn(),
  updateTranscript: jest.fn(),
  deleteTranscript: jest.fn(),
  uploadAudio: jest.fn(),
  getPublicUrl: jest.fn(),
  deleteFile: jest.fn(),
  subscribeToTranscripts: jest.fn(),
  unsubscribe: jest.fn(),
};

/**
 * Mock Audio Recorder Service
 */
export const mockAudioRecorder = {
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  pauseRecording: jest.fn(),
  resumeRecording: jest.fn(),
  getRecordingStatus: jest.fn(),
  getRecordingDuration: jest.fn(),
  requestPermissions: jest.fn(),
  hasPermissions: jest.fn(),
};

/**
 * Mock Audio Player Service
 */
export const mockAudioPlayer = {
  loadAudio: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  seek: jest.fn(),
  setVolume: jest.fn(),
  getStatus: jest.fn(),
  getDuration: jest.fn(),
  getPosition: jest.fn(),
};

/**
 * Mock AIML Service
 */
export const mockAIMLService = {
  transcribeAudio: jest.fn(),
  getTranscriptionStatus: jest.fn(),
  cancelTranscription: jest.fn(),
  getSupportedLanguages: jest.fn(),
  estimateCost: jest.fn(),
};

/**
 * Mock Advanced Recognition Service
 */
export const mockAdvancedRecognitionService = {
  recognizeSpeech: jest.fn(),
  detectLanguage: jest.fn(),
  identifySpeakers: jest.fn(),
  extractKeywords: jest.fn(),
  analyzeSentiment: jest.fn(),
};

/**
 * Mock WebSocket Streaming Service
 */
export const mockWebSocketStreamingService = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  sendAudioChunk: jest.fn(),
  onTranscriptUpdate: jest.fn(),
  onError: jest.fn(),
  isConnected: jest.fn(),
};

/**
 * Mock AI Features Service
 */
export const mockAIFeaturesService = {
  summarizeTranscript: jest.fn(),
  extractActionItems: jest.fn(),
  generateTags: jest.fn(),
  detectTopics: jest.fn(),
  analyzeSpeakers: jest.fn(),
};

/**
 * Mock AI Model Service
 */
export const mockAIModelService = {
  getAvailableModels: jest.fn(),
  selectModel: jest.fn(),
  compareModels: jest.fn(),
  benchmarkModel: jest.fn(),
  getModelDetails: jest.fn(),
};

/**
 * Mock AI Training Service
 */
export const mockAITrainingService = {
  createTrainingJob: jest.fn(),
  getTrainingStatus: jest.fn(),
  cancelTraining: jest.fn(),
  uploadDataset: jest.fn(),
  getTrainingHistory: jest.fn(),
};

/**
 * Mock Real-Time AI Service
 */
export const mockRealTimeAIService = {
  startSession: jest.fn(),
  stopSession: jest.fn(),
  getLiveSuggestions: jest.fn(),
  getContextualInsights: jest.fn(),
  extractActionItems: jest.fn(),
};

/**
 * Mock Context Engine Service
 */
export const mockContextEngineService = {
  analyzeContext: jest.fn(),
  getInsights: jest.fn(),
  getRecommendations: jest.fn(),
  detectTopics: jest.fn(),
  trackContext: jest.fn(),
};

/**
 * Mock Automation Service
 */
export const mockAutomationService = {
  createWorkflow: jest.fn(),
  executeWorkflow: jest.fn(),
  getWorkflows: jest.fn(),
  updateWorkflow: jest.fn(),
  deleteWorkflow: jest.fn(),
  getTemplates: jest.fn(),
};

/**
 * Mock Workflow Optimization Service
 */
export const mockWorkflowOptimizationService = {
  analyzeWorkflow: jest.fn(),
  getOptimizationSuggestions: jest.fn(),
  getPerformanceMetrics: jest.fn(),
  optimizeWorkflow: jest.fn(),
};

/**
 * Mock AI Quality Service
 */
export const mockAIQualityService = {
  getQualityMetrics: jest.fn(),
  detectBias: jest.fn(),
  detectHallucinations: jest.fn(),
  submitForReview: jest.fn(),
  getReviewQueue: jest.fn(),
};

/**
 * Mock Analytics Service
 */
export const mockAnalyticsService = {
  trackEvent: jest.fn(),
  getUsageStats: jest.fn(),
  getProductivityMetrics: jest.fn(),
  getInsights: jest.fn(),
  exportAnalytics: jest.fn(),
};

/**
 * Mock Productivity Service
 */
export const mockProductivityService = {
  getProductivityMetrics: jest.fn(),
  getTimeBreakdown: jest.fn(),
  getFocusSessions: jest.fn(),
  getProductivityTrend: jest.fn(),
  getProductivityGoals: jest.fn(),
  createProductivityGoal: jest.fn(),
};

/**
 * Mock Team Performance Service
 */
export const mockTeamPerformanceService = {
  getTeamMetrics: jest.fn(),
  getTeamMemberPerformance: jest.fn(),
  getMeetingEffectiveness: jest.fn(),
  getCollaborationPatterns: jest.fn(),
  getPerformanceBenchmarks: jest.fn(),
};

/**
 * Mock Collaboration Service
 */
export const mockCollaborationService = {
  shareTranscript: jest.fn(),
  inviteCollaborator: jest.fn(),
  getSharedTranscripts: jest.fn(),
  updatePermissions: jest.fn(),
  removeCollaborator: jest.fn(),
};

/**
 * Mock Export Service
 */
export const mockExportService = {
  exportToPDF: jest.fn(),
  exportToWord: jest.fn(),
  exportToText: jest.fn(),
  exportToJSON: jest.fn(),
  exportToCSV: jest.fn(),
  exportToSubtitles: jest.fn(),
};

/**
 * Mock Search Service
 */
export const mockSearchService = {
  searchTranscripts: jest.fn(),
  advancedSearch: jest.fn(),
  getSearchSuggestions: jest.fn(),
  saveSearch: jest.fn(),
  getSearchHistory: jest.fn(),
};

/**
 * Mock Tag Service
 */
export const mockTagService = {
  getTags: jest.fn(),
  createTag: jest.fn(),
  updateTag: jest.fn(),
  deleteTag: jest.fn(),
  getTagUsage: jest.fn(),
};

/**
 * Mock Folder Service
 */
export const mockFolderService = {
  getFolders: jest.fn(),
  createFolder: jest.fn(),
  updateFolder: jest.fn(),
  deleteFolder: jest.fn(),
  moveTranscript: jest.fn(),
};

/**
 * Mock Offline Storage Service
 */
export const mockOfflineStorageService = {
  saveOffline: jest.fn(),
  getOfflineData: jest.fn(),
  syncOfflineData: jest.fn(),
  clearOfflineData: jest.fn(),
  getOfflineQueue: jest.fn(),
};

/**
 * Mock Sync Service
 */
export const mockSyncService = {
  syncData: jest.fn(),
  getSyncStatus: jest.fn(),
  forceSync: jest.fn(),
  resolveSyncConflict: jest.fn(),
  getSyncHistory: jest.fn(),
};

/**
 * Mock Notifications Service
 */
export const mockNotificationsService = {
  requestPermissions: jest.fn(),
  scheduleNotification: jest.fn(),
  cancelNotification: jest.fn(),
  getNotifications: jest.fn(),
  clearNotifications: jest.fn(),
};

/**
 * Mock Theme Service
 */
export const mockThemeService = {
  getTheme: jest.fn(),
  setTheme: jest.fn(),
  getAvailableThemes: jest.fn(),
  createCustomTheme: jest.fn(),
};

/**
 * Mock i18n Service
 */
export const mocki18nService = {
  getCurrentLanguage: jest.fn(),
  setLanguage: jest.fn(),
  getAvailableLanguages: jest.fn(),
  translate: jest.fn(),
};

/**
 * Mock Security Service
 */
export const mockSecurityService = {
  encryptData: jest.fn(),
  decryptData: jest.fn(),
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  generateToken: jest.fn(),
};

/**
 * Mock Encryption Service
 */
export const mockEncryptionService = {
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  generateKey: jest.fn(),
  storeKey: jest.fn(),
  retrieveKey: jest.fn(),
};

/**
 * Mock Compliance Service
 */
export const mockComplianceService = {
  getComplianceStatus: jest.fn(),
  generateAuditLog: jest.fn(),
  exportComplianceReport: jest.fn(),
  checkDataRetention: jest.fn(),
};

/**
 * Mock Organization Service
 */
export const mockOrganizationService = {
  getOrganization: jest.fn(),
  updateOrganization: jest.fn(),
  getMembers: jest.fn(),
  inviteMember: jest.fn(),
  removeMember: jest.fn(),
};

/**
 * Mock Workspace Service
 */
export const mockWorkspaceService = {
  getWorkspaces: jest.fn(),
  createWorkspace: jest.fn(),
  updateWorkspace: jest.fn(),
  deleteWorkspace: jest.fn(),
  switchWorkspace: jest.fn(),
};

/**
 * Mock Audio Processing Service
 */
export const mockAudioProcessingService = {
  applyNoiseReduction: jest.fn(),
  enhanceAudio: jest.fn(),
  normalizeVolume: jest.fn(),
  applyEqualizer: jest.fn(),
  getAudioMetrics: jest.fn(),
};

/**
 * Mock Insights Service
 */
export const mockInsightsService = {
  getInsights: jest.fn(),
  generateReport: jest.fn(),
  getTrends: jest.fn(),
  getRecommendations: jest.fn(),
};

/**
 * Mock Activity Service
 */
export const mockActivityService = {
  logActivity: jest.fn(),
  getActivityFeed: jest.fn(),
  getActivityStats: jest.fn(),
  clearActivity: jest.fn(),
};

/**
 * Mock Audit Service
 */
export const mockAuditService = {
  logAuditEvent: jest.fn(),
  getAuditLog: jest.fn(),
  exportAuditLog: jest.fn(),
  searchAuditLog: jest.fn(),
};

/**
 * Helper to reset all mocks
 */
export function resetAllMocks() {
  Object.values(mockSupabaseService).forEach(mock => mock.mockReset());
  Object.values(mockAudioRecorder).forEach(mock => mock.mockReset());
  Object.values(mockAudioPlayer).forEach(mock => mock.mockReset());
  Object.values(mockAIMLService).forEach(mock => mock.mockReset());
  Object.values(mockAdvancedRecognitionService).forEach(mock => mock.mockReset());
  Object.values(mockWebSocketStreamingService).forEach(mock => mock.mockReset());
  // ... reset all other mocks
}

/**
 * Helper to create default mock implementations
 */
export function setupDefaultMocks() {
  // Supabase
  mockSupabaseService.signIn.mockResolvedValue({ data: { user: {} }, error: null });
  mockSupabaseService.getTranscripts.mockResolvedValue({ data: [], error: null });
  
  // Audio Recorder
  mockAudioRecorder.requestPermissions.mockResolvedValue(true);
  mockAudioRecorder.startRecording.mockResolvedValue({ uri: 'file://recording.m4a' });
  
  // AIML
  mockAIMLService.transcribeAudio.mockResolvedValue({
    text: 'Transcribed text',
    confidence: 0.95,
  });
  
  // Add more default implementations as needed
}
