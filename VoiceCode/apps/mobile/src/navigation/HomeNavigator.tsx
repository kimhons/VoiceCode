// VoiceFlow Pro Mobile - Home Navigator

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeStackParamList } from './types';
import { useTheme } from '../contexts/ThemeContext';
import { HomeScreen } from '../screens/home';
import { AudioTestScreen } from '../screens/test/AudioTestScreen';
import {
  AISummaryScreen,
  AIKeyPointsScreen,
  AIActionItemsScreen,
  SpeakerIdentificationScreen,
} from '../screens/ai';
import { SearchScreen, TagManagementScreen, FolderManagementScreen, AdvancedFilterScreen } from '../screens/search';
import {
  ExportOptionsScreen,
  ShareTranscriptScreen,
  TemplateSelectionScreen,
  BatchExportScreen,
} from '../screens/export';

const Stack = createStackNavigator<HomeStackParamList>();

export const HomeNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerShown: false, // Home screen has its own header
        }}
      />
      <Stack.Screen
        name="RecordingScreen"
        component={HomeScreen} // TODO: Create RecordingScreen
        options={{
          title: 'Recording',
        }}
      />
      <Stack.Screen
        name="ReviewScreen"
        component={HomeScreen} // TODO: Create ReviewScreen
        options={{
          title: 'Review Recording',
        }}
      />
      <Stack.Screen
        name="AudioTest"
        component={AudioTestScreen}
        options={{
          title: 'Audio Services Test',
        }}
      />
      <Stack.Screen
        name="AISummary"
        component={AISummaryScreen}
        options={{
          title: 'AI Summary',
        }}
      />
      <Stack.Screen
        name="AIKeyPoints"
        component={AIKeyPointsScreen}
        options={{
          title: 'Key Points',
        }}
      />
      <Stack.Screen
        name="AIActionItems"
        component={AIActionItemsScreen}
        options={{
          title: 'Action Items',
        }}
      />
      <Stack.Screen
        name="SpeakerIdentification"
        component={SpeakerIdentificationScreen}
        options={{
          title: 'Speaker Identification',
        }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search',
        }}
      />
      <Stack.Screen
        name="TagManagement"
        component={TagManagementScreen}
        options={{
          title: 'Manage Tags',
        }}
      />
      <Stack.Screen
        name="FolderManagement"
        component={FolderManagementScreen}
        options={{
          title: 'Manage Folders',
        }}
      />
      <Stack.Screen
        name="AdvancedFilter"
        component={AdvancedFilterScreen}
        options={{
          title: 'Advanced Filters',
        }}
      />
      <Stack.Screen
        name="ExportOptions"
        component={ExportOptionsScreen}
        options={{
          title: 'Export Options',
        }}
      />
      <Stack.Screen
        name="ShareTranscript"
        component={ShareTranscriptScreen}
        options={{
          title: 'Share Transcript',
        }}
      />
      <Stack.Screen
        name="TemplateSelection"
        component={TemplateSelectionScreen}
        options={{
          title: 'Select Template',
        }}
      />
      <Stack.Screen
        name="BatchExport"
        component={BatchExportScreen}
        options={{
          title: 'Batch Export',
        }}
      />
    </Stack.Navigator>
  );
};

