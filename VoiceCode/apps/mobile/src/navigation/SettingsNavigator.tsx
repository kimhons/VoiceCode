// VoiceCode Mobile - Settings Navigator
// Phase 2 Integration: Provides navigation to all settings and advanced features

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SettingsStackParamList } from './types';
import { useTheme } from '../contexts/ThemeContext';

// Settings Screens
import SettingsScreen from '../screens/profile/SettingsScreen';
import { RecordingSettingsScreen } from '../screens/settings/RecordingSettingsScreen';
import { TranscriptionSettingsScreen } from '../screens/settings/TranscriptionSettingsScreen';
import { AISettingsScreen } from '../screens/settings/AISettingsScreen';
import { AppearanceSettingsScreen } from '../screens/settings/AppearanceSettingsScreen';
import { PrivacySettingsScreen } from '../screens/settings/PrivacySettingsScreen';
import { SyncSettingsScreen } from '../screens/settings/SyncSettingsScreen';
import { CloudSyncScreen } from '../screens/settings/CloudSyncScreen';
import { BackupScreen } from '../screens/settings/BackupScreen';

// Week 5: Advanced Audio Processing
import { AudioProcessingScreen } from '../screens/settings';
import { SpeakerManagementScreen } from '../screens/settings';
import { AudioEnhancementStudioScreen } from '../screens/settings';
import { ProcessingQueueHistoryScreen } from '../screens/settings';

// Week 6: Real-time Collaboration
import { TeamManagementScreen } from '../screens/collaboration';
import { CollaborationSettingsScreen } from '../screens/collaboration';

// Week 7: Offline & Cloud Integration
import { OfflineModeScreen } from '../screens/offline';
import { CloudStorageScreen } from '../screens/offline';
import { SyncConflictManagerScreen } from '../screens/offline';
import { OfflineRecordingManagerScreen } from '../screens/offline';

// Week 8: Advanced Export & Custom Vocabulary
import { AdvancedExportFormatsScreen, ExportCustomizationStudioScreen } from '../screens/export';
import { CustomVocabularyManagerScreen } from '../screens/vocabulary';

// Testing
import { AdvancedFeaturesTestingScreen } from '../screens/testing';

const Stack = createStackNavigator<SettingsStackParamList>();

export const SettingsNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontFamily: 'SF Pro Display',
          fontSize: 17,
          fontWeight: '600',
          letterSpacing: -0.4,
          color: theme.colors.textPrimary,
        },
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      {/* Main Settings Screen */}
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerShown: false, // Settings screen has its own header
        }}
      />

      {/* Basic Settings */}
      <Stack.Screen
        name="RecordingSettings"
        component={RecordingSettingsScreen}
        options={{ title: 'Recording Settings' }}
      />
      <Stack.Screen
        name="TranscriptionSettings"
        component={TranscriptionSettingsScreen}
        options={{ title: 'Transcription Settings' }}
      />
      <Stack.Screen
        name="AISettings"
        component={AISettingsScreen}
        options={{ title: 'AI Settings' }}
      />
      <Stack.Screen
        name="AppearanceSettings"
        component={AppearanceSettingsScreen}
        options={{ title: 'Appearance' }}
      />
      <Stack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{ title: 'Privacy & Security' }}
      />
      <Stack.Screen
        name="SyncSettings"
        component={SyncSettingsScreen}
        options={{ title: 'Sync Settings' }}
      />
      <Stack.Screen
        name="CloudSync"
        component={CloudSyncScreen}
        options={{ title: 'Cloud Sync' }}
      />
      <Stack.Screen
        name="BackupSettings"
        component={BackupScreen}
        options={{ title: 'Backup & Restore' }}
      />

      {/* Week 5: Advanced Audio Processing */}
      <Stack.Screen
        name="AudioProcessing"
        component={AudioProcessingScreen}
        options={{ title: 'Audio Processing' }}
      />
      <Stack.Screen
        name="SpeakerManagement"
        component={SpeakerManagementScreen}
        options={{ title: 'Speaker Management' }}
      />
      <Stack.Screen
        name="AudioEnhancementStudio"
        component={AudioEnhancementStudioScreen}
        options={{ title: 'Audio Enhancement Studio' }}
      />
      <Stack.Screen
        name="ProcessingQueueHistory"
        component={ProcessingQueueHistoryScreen}
        options={{ title: 'Processing Queue' }}
      />

      {/* Week 6: Real-time Collaboration */}
      <Stack.Screen
        name="TeamManagement"
        component={TeamManagementScreen}
        options={{ title: 'Team Management' }}
      />
      <Stack.Screen
        name="CollaborationSettings"
        component={CollaborationSettingsScreen}
        options={{ title: 'Collaboration Settings' }}
      />

      {/* Week 7: Offline & Cloud Integration */}
      <Stack.Screen
        name="OfflineMode"
        component={OfflineModeScreen}
        options={{ title: 'Offline Mode' }}
      />
      <Stack.Screen
        name="CloudStorage"
        component={CloudStorageScreen}
        options={{ title: 'Cloud Storage' }}
      />
      <Stack.Screen
        name="SyncConflictManager"
        component={SyncConflictManagerScreen}
        options={{ title: 'Sync Conflicts' }}
      />
      <Stack.Screen
        name="OfflineRecordingManager"
        component={OfflineRecordingManagerScreen}
        options={{ title: 'Offline Recordings' }}
      />

      {/* Week 8: Advanced Export & Custom Vocabulary */}
      <Stack.Screen
        name="AdvancedExportFormats"
        component={AdvancedExportFormatsScreen}
        options={{ title: 'Advanced Export' }}
      />
      <Stack.Screen
        name="CustomVocabularyManager"
        component={CustomVocabularyManagerScreen}
        options={{ title: 'Custom Vocabulary' }}
      />
      <Stack.Screen
        name="ExportCustomizationStudio"
        component={ExportCustomizationStudioScreen as any}
        options={{ title: 'Export Customization' }}
      />

      {/* Testing */}
      <Stack.Screen
        name="AdvancedFeaturesTesting"
        component={AdvancedFeaturesTestingScreen as any}
        options={{ title: 'Advanced Features Testing' }}
      />
    </Stack.Navigator>
  );
};

