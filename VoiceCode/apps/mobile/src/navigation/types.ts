// VoiceCode Mobile - Navigation Types

import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Permissions: undefined;
  Auth: undefined;
  Main: undefined;
  Pricing: undefined;
};

export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type AuthStackNavigationProp = StackNavigationProp<AuthStackParamList>;

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Library: undefined;
  Collaboration: undefined;
  Settings: undefined;
  Profile: undefined;
  Enterprise: undefined;
};

export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// Home Stack
export type HomeStackParamList = {
  HomeScreen: undefined;
  RecordingScreen: { recordingId?: string };
  ReviewScreen: { recordingId: string };
  AudioTest: undefined;
  AISummary: { transcriptId: string; transcriptText: string };
  AIKeyPoints: { transcriptId: string; transcriptText: string };
  AIActionItems: { transcriptId: string; transcriptText: string };
  SpeakerIdentification: { transcriptId: string; transcriptText: string };
  Search: undefined;
  TagManagement: undefined;
  FolderManagement: undefined;
  AdvancedFilter: undefined;
  ExportOptions: { transcriptId: string; transcriptTitle: string; transcriptText: string };
  ShareTranscript: { transcriptId: string; transcriptTitle: string };
  TemplateSelection: { transcriptId: string; transcriptTitle: string; transcriptText: string };
  BatchExport: undefined;
  LiveCollaboration: { transcriptId?: string; transcriptTitle?: string };
};

export type HomeStackNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList>,
  MainTabNavigationProp
>;

// Library Stack
export type LibraryStackParamList = {
  LibraryScreen: undefined;
  TranscriptionDetail: { transcriptionId: string };
};

export type LibraryStackNavigationProp = CompositeNavigationProp<
  StackNavigationProp<LibraryStackParamList>,
  MainTabNavigationProp
>;

// Settings Stack
export type SettingsStackParamList = {
  SettingsScreen: undefined;
  RecordingSettings: undefined;
  TranscriptionSettings: undefined;
  AISettings: undefined;
  AppearanceSettings: undefined;
  PrivacySettings: undefined;
  SyncSettings: undefined;
  CloudSync: undefined;
  BackupSettings: undefined;
  AudioProcessing: undefined;
  SpeakerManagement: undefined;
  AudioEnhancementStudio: undefined;
  ProcessingQueueHistory: undefined;
  TeamManagement: undefined;
  CollaborationSettings: undefined;
  OfflineMode: undefined;
  CloudStorage: undefined;
  SyncConflictManager: undefined;
  OfflineRecordingManager: undefined;
  AdvancedExportFormats: undefined;
  CustomVocabularyManager: undefined;
  ExportCustomizationStudio: undefined;
  AdvancedFeaturesTesting: undefined;
};

export type SettingsStackNavigationProp = CompositeNavigationProp<
  StackNavigationProp<SettingsStackParamList>,
  MainTabNavigationProp
>;

// Profile Stack
export type ProfileStackParamList = {
  ProfileScreen: undefined;
  Subscription: undefined;
  SubscriptionScreen: undefined;
  AccountScreen: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  Analytics: undefined;
  Insights: undefined;
  Reports: undefined;
  Dashboard: undefined;
};

export type ProfileStackNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ProfileStackParamList>,
  MainTabNavigationProp
>;

// Enterprise Stack (Phase 3 Week 9)
export type EnterpriseStackParamList = {
  OrganizationManagement: undefined;
  WorkspaceIsolation: undefined;
  SecurityCenter: undefined;
  ComplianceManagement: undefined;
  AnalyticsDashboard: undefined;
  ReportBuilder: undefined;
};

export type EnterpriseStackNavigationProp = CompositeNavigationProp<
  StackNavigationProp<EnterpriseStackParamList>,
  MainTabNavigationProp
>;

// AI Stack (Phase 3 Week 10 Day 64-70)
export type AIStackParamList = {
  AISummary: { transcriptId: string; transcriptText: string };
  AIKeyPoints: { transcriptId: string; transcriptText: string };
  AIActionItems: { transcriptId: string; transcriptText: string };
  SpeakerIdentification: { transcriptId: string; transcriptText: string };
  AIModelSelection: undefined;
  CustomAITraining: undefined;
  LiveAIAssistant: undefined;
  AIContextEngine: undefined;
  AutomationBuilder: undefined;
  AIWorkflowOptimization: undefined;
  AIQualityControl: undefined;
};

export type AIStackNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AIStackParamList>,
  MainTabNavigationProp
>;

// Analytics Stack (Phase 3 Week 11 Day 71-72)
export type AnalyticsStackParamList = {
  ProductivityDashboard: undefined;
  TeamPerformance: undefined;
};

export type AnalyticsStackNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AnalyticsStackParamList>,
  MainTabNavigationProp
>;

// Screen Props Helper Types
export type ScreenProps<
  ParamList extends Record<string, any>,
  RouteName extends keyof ParamList,
> = {
  navigation: StackNavigationProp<ParamList, RouteName>;
  route: RouteProp<ParamList, RouteName>;
};
