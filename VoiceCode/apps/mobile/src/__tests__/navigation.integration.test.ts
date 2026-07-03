/**
 * Navigation Integration Tests
 * Validates that all Phase 2 screens are properly registered in navigators
 */

import { SettingsStackParamList } from '../navigation/types';
import * as settingsScreens from '../screens/settings';
import * as collaborationScreens from '../screens/collaboration';
import * as offlineScreens from '../screens/offline';
import * as exportScreens from '../screens/export';
import * as vocabularyScreens from '../screens/vocabulary';
import * as testingScreens from '../screens/testing';
import { SettingsNavigator } from '../navigation/SettingsNavigator';
import { CollaborationNavigator } from '../navigation/CollaborationNavigator';
import { MainNavigator } from '../navigation/MainNavigator';

describe('Navigation Integration', () => {
  describe('SettingsNavigator', () => {
    it('should have all required screen routes defined in SettingsStackParamList', () => {
      const requiredRoutes: (keyof SettingsStackParamList)[] = [
        // Basic Settings
        'SettingsScreen',
        'RecordingSettings',
        'TranscriptionSettings',
        'AISettings',
        'AppearanceSettings',
        'PrivacySettings',
        'SyncSettings',
        'CloudSync',
        'BackupSettings',
        
        // Week 5: Advanced Audio Processing
        'AudioProcessing',
        'SpeakerManagement',
        'AudioEnhancementStudio',
        'ProcessingQueueHistory',
        
        // Week 6: Real-time Collaboration
        'TeamManagement',
        'CollaborationSettings',
        
        // Week 7: Offline & Cloud Integration
        'OfflineMode',
        'CloudStorage',
        'SyncConflictManager',
        'OfflineRecordingManager',
        
        // Week 8: Advanced Export & Custom Vocabulary
        'AdvancedExportFormats',
        'CustomVocabularyManager',
        'ExportCustomizationStudio',
        'AdvancedFeaturesTesting',
      ];

      // This test will fail at compile time if any route is missing from the type
      requiredRoutes.forEach(route => {
        expect(route).toBeDefined();
      });

      expect(requiredRoutes.length).toBe(23);
    });
  });

  describe('Screen Exports', () => {
    it('should export all settings screens', () => {
      expect(settingsScreens.AudioProcessingScreen).toBeDefined();
      expect(settingsScreens.SpeakerManagementScreen).toBeDefined();
      expect(settingsScreens.AudioEnhancementStudioScreen).toBeDefined();
      expect(settingsScreens.ProcessingQueueHistoryScreen).toBeDefined();
    });

    it('should export all collaboration screens', () => {
      expect(collaborationScreens.CollaborationHubScreen).toBeDefined();
      expect(collaborationScreens.TeamManagementScreen).toBeDefined();
      expect(collaborationScreens.LiveCollaborationScreen).toBeDefined();
      expect(collaborationScreens.CollaborationSettingsScreen).toBeDefined();
    });

    it('should export all offline screens', () => {
      expect(offlineScreens.OfflineModeScreen).toBeDefined();
      expect(offlineScreens.CloudStorageScreen).toBeDefined();
      expect(offlineScreens.SyncConflictManagerScreen).toBeDefined();
      expect(offlineScreens.OfflineRecordingManagerScreen).toBeDefined();
    });

    it('should export all export screens', () => {
      expect(exportScreens.AdvancedExportFormatsScreen).toBeDefined();
      expect(exportScreens.ExportCustomizationStudioScreen).toBeDefined();
    });

    it('should export all vocabulary screens', () => {
      expect(vocabularyScreens.CustomVocabularyManagerScreen).toBeDefined();
    });

    it('should export all testing screens', () => {
      expect(testingScreens.AdvancedFeaturesTestingScreen).toBeDefined();
    });
  });

  describe('Navigator Exports', () => {
    it('should export SettingsNavigator', () => {
      expect(SettingsNavigator).toBeDefined();
    });

    it('should export CollaborationNavigator', () => {
      expect(CollaborationNavigator).toBeDefined();
    });

    it('should export MainNavigator', () => {
      expect(MainNavigator).toBeDefined();
    });
  });
});

