// VoiceCode Mobile - Screens Navigator
// Comprehensive navigator for all feature screens

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';

// Medical Screens
import {
  ClinicalNotesScreen,
  MedicalDictationScreen,
  SOAPNotesScreen,
  PatientEncounterScreen,
  ClinicalTemplateLibraryScreen,
  TemplateEditorScreen,
  MedicalTerminologyScreen,
  MedicalReportScreen,
  EHRIntegrationScreen,
  HIPAAComplianceScreen,
  CPTBillingCodesScreen,
  ICD10CodeSuggestionsScreen,
  SpecialtyTemplatesScreen,
  ScribePersonalizationScreen,
  SessionAnalyticsScreen,
  ProgressNotesScreen,
  DischargeNotesScreen,
  ReferralLetterScreen,
  PreConsultReviewScreen,
  TelehealthScribeScreen,
} from '../screens/medical';

// Recording Screens
import {
  LiveTranscriptionScreen,
  InteractiveTranscriptEditorScreen,
  SpeakerIdentificationScreen as RecordingSpeakerScreen,
  AudioQualityEnhancerScreen,
  RecordingLibraryScreen,
  TranscriptSearchScreen,
  VoiceCommandsScreen,
  BookmarksTimelineScreen,
  ExportShareScreen,
  RecordingSettingsScreen as RecordingSettingsMainScreen,
  MultiTrackRecordingScreen,
  TranscriptVersionHistoryScreen,
  BackgroundRecordingScreen,
  RecordingQueueScreen,
  AudioVisualizerScreen,
} from '../screens/recording';

// AI Screens
import {
  AISummaryScreen,
  AIKeyPointsScreen,
  AIActionItemsScreen,
  SpeakerIdentificationScreen,
  AIModelSelectionScreen,
  CustomAITrainingScreen,
  LiveAIAssistantScreen,
  AIContextEngineScreen,
  AutomationBuilderScreen,
  AIWorkflowOptimizationScreen,
  AIQualityControlScreen,
  SentimentAnalysisScreen,
} from '../screens/ai';

// Collaboration Screens
import {
  TeamManagementScreen,
  CollaborationSettingsScreen,
  SharedTranscriptsScreen,
  LiveCollaborationScreen,
  CommentsThreadScreen,
  ActivityFeedScreen,
  NotificationsSettingsScreen,
} from '../screens/collaboration';

// Integration Screens
import {
  SlackIntegrationScreen,
  ZoomIntegrationScreen,
  GoogleDriveIntegrationScreen,
  NotionIntegrationScreen,
  CalendarSyncScreen,
  WebhooksAPIScreen,
  MicrosoftTeamsIntegrationScreen,
  DropboxIntegrationScreen,
  SalesforceIntegrationScreen,
  HubSpotIntegrationScreen,
  AsanaIntegrationScreen,
  TrelloIntegrationScreen,
} from '../screens/integrations';

// Editing Screens
import {
  AudioTrimmerScreen,
  VideoClipEditorScreen,
  SubtitleEditorScreen,
  AudioMixerScreen,
  MediaConversionScreen,
  HighlightClipsScreen,
  BatchProcessingScreen,
  NoiseReductionScreen,
} from '../screens/editing';

// Security Screens
import {
  DataEncryptionScreen,
  AuditLogScreen,
  PrivacySettingsScreen as SecurityPrivacyScreen,
  TwoFactorAuthScreen,
  ComplianceDashboardScreen,
  SessionManagementScreen,
} from '../screens/security';

// Automation Screens
import {
  MeetingBotSettingsScreen,
  ScheduledRecordingsScreen,
  WorkflowBuilderScreen,
  AutomationTemplatesScreen,
  AutoJoinSettingsScreen,
  BotPermissionsScreen,
  RecordingRulesScreen,
} from '../screens/automation';

// Analytics Screens
import {
  ProductivityDashboardScreen,
  TeamPerformanceScreen,
  UsageAnalyticsScreen,
  ReportsGeneratorScreen,
  StorageAnalyticsScreen,
  MeetingInsightsScreen,
} from '../screens/analytics';

// Accessibility Screens
import {
  VoiceControlSettingsScreen,
  AccessibilitySettingsScreen,
  KeyboardShortcutsScreen,
  TextToSpeechScreen,
  GestureControlScreen,
} from '../screens/accessibility';

export type ScreensStackParamList = {
  // Medical
  ClinicalNotes: undefined;
  MedicalDictation: undefined;
  SOAPNotes: undefined;
  PatientEncounter: undefined;
  ClinicalTemplateLibrary: undefined;
  TemplateEditor: undefined;
  MedicalTerminology: undefined;
  MedicalReport: undefined;
  EHRIntegration: undefined;
  HIPAACompliance: undefined;
  CPTBillingCodes: undefined;
  ICD10CodeSuggestions: undefined;
  SpecialtyTemplates: undefined;
  ScribePersonalization: undefined;
  SessionAnalytics: undefined;
  ProgressNotes: undefined;
  DischargeNotes: undefined;
  ReferralLetter: undefined;
  PreConsultReview: undefined;
  TelehealthScribe: undefined;

  // Recording
  LiveTranscription: undefined;
  InteractiveTranscriptEditor: undefined;
  RecordingSpeakerIdentification: undefined;
  AudioQualityEnhancer: undefined;
  RecordingLibrary: undefined;
  TranscriptSearch: undefined;
  VoiceCommands: undefined;
  BookmarksTimeline: undefined;
  ExportShare: undefined;
  RecordingSettingsMain: undefined;
  MultiTrackRecording: undefined;
  TranscriptVersionHistory: undefined;
  BackgroundRecording: undefined;
  RecordingQueue: undefined;
  AudioVisualizer: undefined;

  // AI
  AISummaryMain: { transcriptId?: string; transcriptText?: string };
  AIKeyPointsMain: { transcriptId?: string; transcriptText?: string };
  AIActionItemsMain: { transcriptId?: string; transcriptText?: string };
  SpeakerIdentificationMain: { transcriptId?: string; transcriptText?: string };
  AIModelSelection: undefined;
  CustomAITraining: undefined;
  LiveAIAssistant: undefined;
  AIContextEngine: undefined;
  AutomationBuilder: undefined;
  AIWorkflowOptimization: undefined;
  AIQualityControl: undefined;
  SentimentAnalysis: undefined;

  // Collaboration
  TeamManagement: undefined;
  CollaborationSettings: undefined;
  SharedTranscripts: undefined;
  LiveCollaboration: { transcriptId?: string; transcriptTitle?: string };
  CommentsThread: undefined;
  ActivityFeed: undefined;
  NotificationsSettings: undefined;

  // Integrations
  SlackIntegration: undefined;
  ZoomIntegration: undefined;
  GoogleDriveIntegration: undefined;
  NotionIntegration: undefined;
  CalendarSync: undefined;
  WebhooksAPI: undefined;
  MicrosoftTeamsIntegration: undefined;
  DropboxIntegration: undefined;
  SalesforceIntegration: undefined;
  HubSpotIntegration: undefined;
  AsanaIntegration: undefined;
  TrelloIntegration: undefined;

  // Editing
  AudioTrimmer: undefined;
  VideoClipEditor: undefined;
  SubtitleEditor: undefined;
  AudioMixer: undefined;
  MediaConversion: undefined;
  HighlightClips: undefined;
  BatchProcessing: undefined;
  NoiseReduction: undefined;

  // Security
  DataEncryption: undefined;
  AuditLog: undefined;
  SecurityPrivacy: undefined;
  TwoFactorAuth: undefined;
  ComplianceDashboard: undefined;
  SessionManagement: undefined;

  // Automation
  MeetingBotSettings: undefined;
  ScheduledRecordings: undefined;
  WorkflowBuilder: undefined;
  AutomationTemplates: undefined;
  AutoJoinSettings: undefined;
  BotPermissions: undefined;
  RecordingRules: undefined;

  // Analytics
  ProductivityDashboard: undefined;
  TeamPerformance: undefined;
  UsageAnalytics: undefined;
  ReportsGenerator: undefined;
  StorageAnalytics: undefined;
  MeetingInsights: undefined;

  // Accessibility
  VoiceControlSettings: undefined;
  AccessibilitySettings: undefined;
  KeyboardShortcuts: undefined;
  TextToSpeech: undefined;
  GestureControl: undefined;
};

const Stack = createStackNavigator<ScreensStackParamList>();

export const ScreensNavigator: React.FC = () => {
  const { theme } = useTheme();

  const screenOptions = {
    headerStyle: {
      backgroundColor: theme.colors.surface,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
    },
    headerTintColor: theme.colors.primary,
    headerTitleStyle: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: theme.colors.textPrimary,
    },
    headerBackTitleVisible: false,
    cardStyle: {
      backgroundColor: theme.colors.background,
    },
  };

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {/* Medical Screens */}
      <Stack.Screen
        name="ClinicalNotes"
        component={ClinicalNotesScreen}
        options={{ title: 'Clinical Notes' }}
      />
      <Stack.Screen
        name="MedicalDictation"
        component={MedicalDictationScreen}
        options={{ title: 'Medical Dictation' }}
      />
      <Stack.Screen
        name="SOAPNotes"
        component={SOAPNotesScreen}
        options={{ title: 'SOAP Notes' }}
      />
      <Stack.Screen
        name="PatientEncounter"
        component={PatientEncounterScreen}
        options={{ title: 'Patient Encounter' }}
      />
      <Stack.Screen
        name="ClinicalTemplateLibrary"
        component={ClinicalTemplateLibraryScreen}
        options={{ title: 'Template Library' }}
      />
      <Stack.Screen
        name="TemplateEditor"
        component={TemplateEditorScreen}
        options={{ title: 'Template Editor' }}
      />
      <Stack.Screen
        name="MedicalTerminology"
        component={MedicalTerminologyScreen}
        options={{ title: 'Medical Terminology' }}
      />
      <Stack.Screen
        name="MedicalReport"
        component={MedicalReportScreen}
        options={{ title: 'Medical Report' }}
      />
      <Stack.Screen
        name="EHRIntegration"
        component={EHRIntegrationScreen}
        options={{ title: 'EHR Integration' }}
      />
      <Stack.Screen
        name="HIPAACompliance"
        component={HIPAAComplianceScreen}
        options={{ title: 'HIPAA Compliance' }}
      />
      <Stack.Screen
        name="CPTBillingCodes"
        component={CPTBillingCodesScreen}
        options={{ title: 'CPT Billing Codes' }}
      />
      <Stack.Screen
        name="ICD10CodeSuggestions"
        component={ICD10CodeSuggestionsScreen}
        options={{ title: 'ICD-10 Codes' }}
      />
      <Stack.Screen
        name="SpecialtyTemplates"
        component={SpecialtyTemplatesScreen}
        options={{ title: 'Specialty Templates' }}
      />
      <Stack.Screen
        name="ScribePersonalization"
        component={ScribePersonalizationScreen}
        options={{ title: 'Scribe Personalization' }}
      />
      <Stack.Screen
        name="SessionAnalytics"
        component={SessionAnalyticsScreen}
        options={{ title: 'Session Analytics' }}
      />
      <Stack.Screen
        name="ProgressNotes"
        component={ProgressNotesScreen}
        options={{ title: 'Progress Notes' }}
      />
      <Stack.Screen
        name="DischargeNotes"
        component={DischargeNotesScreen}
        options={{ title: 'Discharge Notes' }}
      />
      <Stack.Screen
        name="ReferralLetter"
        component={ReferralLetterScreen}
        options={{ title: 'Referral Letter' }}
      />
      <Stack.Screen
        name="PreConsultReview"
        component={PreConsultReviewScreen}
        options={{ title: 'Pre-Consult Review' }}
      />
      <Stack.Screen
        name="TelehealthScribe"
        component={TelehealthScribeScreen}
        options={{ title: 'Telehealth Scribe' }}
      />

      {/* Recording Screens */}
      <Stack.Screen
        name="LiveTranscription"
        component={LiveTranscriptionScreen}
        options={{ title: 'Live Transcription' }}
      />
      <Stack.Screen
        name="InteractiveTranscriptEditor"
        component={InteractiveTranscriptEditorScreen}
        options={{ title: 'Edit Transcript' }}
      />
      <Stack.Screen
        name="RecordingSpeakerIdentification"
        component={RecordingSpeakerScreen}
        options={{ title: 'Speaker ID' }}
      />
      <Stack.Screen
        name="AudioQualityEnhancer"
        component={AudioQualityEnhancerScreen}
        options={{ title: 'Audio Quality' }}
      />
      <Stack.Screen
        name="RecordingLibrary"
        component={RecordingLibraryScreen}
        options={{ title: 'Recording Library' }}
      />
      <Stack.Screen
        name="TranscriptSearch"
        component={TranscriptSearchScreen}
        options={{ title: 'Search' }}
      />
      <Stack.Screen
        name="VoiceCommands"
        component={VoiceCommandsScreen}
        options={{ title: 'Voice Commands' }}
      />
      <Stack.Screen
        name="BookmarksTimeline"
        component={BookmarksTimelineScreen}
        options={{ title: 'Bookmarks' }}
      />
      <Stack.Screen
        name="ExportShare"
        component={ExportShareScreen}
        options={{ title: 'Export & Share' }}
      />
      <Stack.Screen
        name="RecordingSettingsMain"
        component={RecordingSettingsMainScreen}
        options={{ title: 'Recording Settings' }}
      />
      <Stack.Screen
        name="MultiTrackRecording"
        component={MultiTrackRecordingScreen}
        options={{ title: 'Multi-Track' }}
      />
      <Stack.Screen
        name="TranscriptVersionHistory"
        component={TranscriptVersionHistoryScreen}
        options={{ title: 'Version History' }}
      />
      <Stack.Screen
        name="BackgroundRecording"
        component={BackgroundRecordingScreen}
        options={{ title: 'Background Recording' }}
      />
      <Stack.Screen
        name="RecordingQueue"
        component={RecordingQueueScreen}
        options={{ title: 'Processing Queue' }}
      />
      <Stack.Screen
        name="AudioVisualizer"
        component={AudioVisualizerScreen}
        options={{ title: 'Audio Visualizer', headerShown: false }}
      />

      {/* AI Screens */}
      <Stack.Screen
        name="AISummaryMain"
        component={AISummaryScreen}
        options={{ title: 'AI Summary' }}
      />
      <Stack.Screen
        name="AIKeyPointsMain"
        component={AIKeyPointsScreen}
        options={{ title: 'Key Points' }}
      />
      <Stack.Screen
        name="AIActionItemsMain"
        component={AIActionItemsScreen}
        options={{ title: 'Action Items' }}
      />
      <Stack.Screen
        name="SpeakerIdentificationMain"
        component={SpeakerIdentificationScreen}
        options={{ title: 'Speaker ID' }}
      />
      <Stack.Screen
        name="AIModelSelection"
        component={AIModelSelectionScreen}
        options={{ title: 'AI Models' }}
      />
      <Stack.Screen
        name="CustomAITraining"
        component={CustomAITrainingScreen}
        options={{ title: 'Custom Training' }}
      />
      <Stack.Screen
        name="LiveAIAssistant"
        component={LiveAIAssistantScreen}
        options={{ title: 'AI Assistant' }}
      />
      <Stack.Screen
        name="AIContextEngine"
        component={AIContextEngineScreen}
        options={{ title: 'Context Engine' }}
      />
      <Stack.Screen
        name="AutomationBuilder"
        component={AutomationBuilderScreen}
        options={{ title: 'Automation Builder' }}
      />
      <Stack.Screen
        name="AIWorkflowOptimization"
        component={AIWorkflowOptimizationScreen}
        options={{ title: 'Workflow Optimization' }}
      />
      <Stack.Screen
        name="AIQualityControl"
        component={AIQualityControlScreen}
        options={{ title: 'Quality Control' }}
      />
      <Stack.Screen
        name="SentimentAnalysis"
        component={SentimentAnalysisScreen}
        options={{ title: 'Sentiment Analysis' }}
      />

      {/* Collaboration Screens */}
      <Stack.Screen
        name="TeamManagement"
        component={TeamManagementScreen}
        options={{ title: 'Team Management' }}
      />
      <Stack.Screen
        name="CollaborationSettings"
        component={CollaborationSettingsScreen}
        options={{ title: 'Collaboration' }}
      />
      <Stack.Screen
        name="SharedTranscripts"
        component={SharedTranscriptsScreen}
        options={{ title: 'Shared Transcripts' }}
      />
      <Stack.Screen
        name="LiveCollaboration"
        component={LiveCollaborationScreen}
        options={{ title: 'Live Collaboration' }}
      />
      <Stack.Screen
        name="CommentsThread"
        component={CommentsThreadScreen}
        options={{ title: 'Comments' }}
      />
      <Stack.Screen
        name="ActivityFeed"
        component={ActivityFeedScreen}
        options={{ title: 'Activity Feed' }}
      />
      <Stack.Screen
        name="NotificationsSettings"
        component={NotificationsSettingsScreen}
        options={{ title: 'Notifications' }}
      />

      {/* Integration Screens */}
      <Stack.Screen
        name="SlackIntegration"
        component={SlackIntegrationScreen}
        options={{ title: 'Slack' }}
      />
      <Stack.Screen
        name="ZoomIntegration"
        component={ZoomIntegrationScreen}
        options={{ title: 'Zoom' }}
      />
      <Stack.Screen
        name="GoogleDriveIntegration"
        component={GoogleDriveIntegrationScreen}
        options={{ title: 'Google Drive' }}
      />
      <Stack.Screen
        name="NotionIntegration"
        component={NotionIntegrationScreen}
        options={{ title: 'Notion' }}
      />
      <Stack.Screen
        name="CalendarSync"
        component={CalendarSyncScreen}
        options={{ title: 'Calendar Sync' }}
      />
      <Stack.Screen
        name="WebhooksAPI"
        component={WebhooksAPIScreen}
        options={{ title: 'Webhooks & API' }}
      />
      <Stack.Screen
        name="MicrosoftTeamsIntegration"
        component={MicrosoftTeamsIntegrationScreen}
        options={{ title: 'Microsoft Teams' }}
      />
      <Stack.Screen
        name="DropboxIntegration"
        component={DropboxIntegrationScreen}
        options={{ title: 'Dropbox' }}
      />
      <Stack.Screen
        name="SalesforceIntegration"
        component={SalesforceIntegrationScreen}
        options={{ title: 'Salesforce' }}
      />
      <Stack.Screen
        name="HubSpotIntegration"
        component={HubSpotIntegrationScreen}
        options={{ title: 'HubSpot' }}
      />
      <Stack.Screen
        name="AsanaIntegration"
        component={AsanaIntegrationScreen}
        options={{ title: 'Asana' }}
      />
      <Stack.Screen
        name="TrelloIntegration"
        component={TrelloIntegrationScreen}
        options={{ title: 'Trello' }}
      />

      {/* Editing Screens */}
      <Stack.Screen
        name="AudioTrimmer"
        component={AudioTrimmerScreen}
        options={{ title: 'Audio Trimmer' }}
      />
      <Stack.Screen
        name="VideoClipEditor"
        component={VideoClipEditorScreen}
        options={{ title: 'Video Editor' }}
      />
      <Stack.Screen
        name="SubtitleEditor"
        component={SubtitleEditorScreen}
        options={{ title: 'Subtitle Editor' }}
      />
      <Stack.Screen
        name="AudioMixer"
        component={AudioMixerScreen}
        options={{ title: 'Audio Mixer' }}
      />
      <Stack.Screen
        name="MediaConversion"
        component={MediaConversionScreen}
        options={{ title: 'Media Conversion' }}
      />
      <Stack.Screen
        name="HighlightClips"
        component={HighlightClipsScreen}
        options={{ title: 'Highlight Clips' }}
      />
      <Stack.Screen
        name="BatchProcessing"
        component={BatchProcessingScreen}
        options={{ title: 'Batch Processing' }}
      />
      <Stack.Screen
        name="NoiseReduction"
        component={NoiseReductionScreen}
        options={{ title: 'Noise Reduction' }}
      />

      {/* Security Screens */}
      <Stack.Screen
        name="DataEncryption"
        component={DataEncryptionScreen}
        options={{ title: 'Data Encryption' }}
      />
      <Stack.Screen name="AuditLog" component={AuditLogScreen} options={{ title: 'Audit Log' }} />
      <Stack.Screen
        name="SecurityPrivacy"
        component={SecurityPrivacyScreen}
        options={{ title: 'Privacy Settings' }}
      />
      <Stack.Screen
        name="TwoFactorAuth"
        component={TwoFactorAuthScreen}
        options={{ title: 'Two-Factor Auth' }}
      />
      <Stack.Screen
        name="ComplianceDashboard"
        component={ComplianceDashboardScreen}
        options={{ title: 'Compliance' }}
      />
      <Stack.Screen
        name="SessionManagement"
        component={SessionManagementScreen}
        options={{ title: 'Active Sessions' }}
      />

      {/* Automation Screens */}
      <Stack.Screen
        name="MeetingBotSettings"
        component={MeetingBotSettingsScreen}
        options={{ title: 'Meeting Bot' }}
      />
      <Stack.Screen
        name="ScheduledRecordings"
        component={ScheduledRecordingsScreen}
        options={{ title: 'Scheduled Recordings' }}
      />
      <Stack.Screen
        name="WorkflowBuilder"
        component={WorkflowBuilderScreen}
        options={{ title: 'Workflow Builder' }}
      />
      <Stack.Screen
        name="AutomationTemplates"
        component={AutomationTemplatesScreen}
        options={{ title: 'Automation Templates' }}
      />
      <Stack.Screen
        name="AutoJoinSettings"
        component={AutoJoinSettingsScreen}
        options={{ title: 'Auto-Join Settings' }}
      />
      <Stack.Screen
        name="BotPermissions"
        component={BotPermissionsScreen}
        options={{ title: 'Bot Permissions' }}
      />
      <Stack.Screen
        name="RecordingRules"
        component={RecordingRulesScreen}
        options={{ title: 'Recording Rules' }}
      />

      {/* Analytics Screens */}
      <Stack.Screen
        name="ProductivityDashboard"
        component={ProductivityDashboardScreen}
        options={{ title: 'Productivity' }}
      />
      <Stack.Screen
        name="TeamPerformance"
        component={TeamPerformanceScreen}
        options={{ title: 'Team Performance' }}
      />
      <Stack.Screen
        name="UsageAnalytics"
        component={UsageAnalyticsScreen}
        options={{ title: 'Usage Analytics' }}
      />
      <Stack.Screen
        name="ReportsGenerator"
        component={ReportsGeneratorScreen}
        options={{ title: 'Generate Report' }}
      />
      <Stack.Screen
        name="StorageAnalytics"
        component={StorageAnalyticsScreen}
        options={{ title: 'Storage' }}
      />
      <Stack.Screen
        name="MeetingInsights"
        component={MeetingInsightsScreen}
        options={{ title: 'Meeting Insights' }}
      />

      {/* Accessibility Screens */}
      <Stack.Screen
        name="VoiceControlSettings"
        component={VoiceControlSettingsScreen}
        options={{ title: 'Voice Control' }}
      />
      <Stack.Screen
        name="AccessibilitySettings"
        component={AccessibilitySettingsScreen}
        options={{ title: 'Accessibility' }}
      />
      <Stack.Screen
        name="KeyboardShortcuts"
        component={KeyboardShortcutsScreen}
        options={{ title: 'Keyboard Shortcuts' }}
      />
      <Stack.Screen
        name="TextToSpeech"
        component={TextToSpeechScreen}
        options={{ title: 'Text to Speech' }}
      />
      <Stack.Screen
        name="GestureControl"
        component={GestureControlScreen}
        options={{ title: 'Gesture Controls' }}
      />
    </Stack.Navigator>
  );
};

export default ScreensNavigator;
