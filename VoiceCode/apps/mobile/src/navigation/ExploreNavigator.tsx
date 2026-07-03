// VoiceCode Mobile - Explore Navigator
// Provides access to all feature categories through hub screens

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';

// Explore Screen
import ExploreScreen from '../screens/general/ExploreScreen';

// Hub Screens
import MedicalHubScreen from '../screens/hubs/MedicalHubScreen';
import RecordingHubScreen from '../screens/hubs/RecordingHubScreen';
import AIHubScreen from '../screens/hubs/AIHubScreen';
import CollaborationHubScreen from '../screens/hubs/CollaborationHubScreen';
import IntegrationsHubScreen from '../screens/hubs/IntegrationsHubScreen';
import EditingHubScreen from '../screens/hubs/EditingHubScreen';
import SecurityHubScreen from '../screens/hubs/SecurityHubScreen';
import AutomationHubScreen from '../screens/hubs/AutomationHubScreen';
import AnalyticsHubScreen from '../screens/hubs/AnalyticsHubScreen';
import AccessibilityHubScreen from '../screens/hubs/AccessibilityHubScreen';

// Medical Screens
import MedicalDictationScreen from '../screens/medical/MedicalDictationScreen';
import ClinicalNotesScreen from '../screens/medical/ClinicalNotesScreen';
import SOAPNotesScreen from '../screens/medical/SOAPNotesScreen';
import PatientEncounterScreen from '../screens/medical/PatientEncounterScreen';

// AI Screens
import { AISummaryScreen, AIKeyPointsScreen, AIActionItemsScreen } from '../screens/ai';

// Analytics Screens
import { ProductivityDashboardScreen, TeamPerformanceScreen } from '../screens/analytics';

export type ExploreStackParamList = {
  ExploreMain: undefined;
  // Hubs
  MedicalHub: undefined;
  RecordingHub: undefined;
  AIHub: undefined;
  CollaborationHub: undefined;
  IntegrationsHub: undefined;
  EditingHub: undefined;
  SecurityHub: undefined;
  AutomationHub: undefined;
  AnalyticsHub: undefined;
  AccessibilityHub: undefined;
  // Medical Screens
  ClinicalNotes: undefined;
  MedicalDictation: undefined;
  SOAPNotes: undefined;
  PatientEncounter: undefined;
  // AI Screens
  AISummaryMain: { transcriptId?: string; transcriptText?: string };
  AIKeyPointsMain: { transcriptId?: string; transcriptText?: string };
  AIActionItemsMain: { transcriptId?: string; transcriptText?: string };
  // Analytics
  ProductivityDashboard: undefined;
  TeamPerformance: undefined;
  // Placeholder for other screens
  [key: string]: undefined | object;
};

const Stack = createStackNavigator<ExploreStackParamList>();

export const ExploreNavigator: React.FC = () => {
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
      {/* Main Explore Screen */}
      <Stack.Screen name="ExploreMain" component={ExploreScreen} options={{ headerShown: false }} />

      {/* Hub Screens */}
      <Stack.Screen
        name="MedicalHub"
        component={MedicalHubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RecordingHub"
        component={RecordingHubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="AIHub" component={AIHubScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="CollaborationHub"
        component={CollaborationHubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="IntegrationsHub"
        component={IntegrationsHubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditingHub"
        component={EditingHubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SecurityHub"
        component={SecurityHubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AutomationHub"
        component={AutomationHubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AnalyticsHub"
        component={AnalyticsHubScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AccessibilityHub"
        component={AccessibilityHubScreen}
        options={{ headerShown: false }}
      />

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
    </Stack.Navigator>
  );
};

export default ExploreNavigator;
