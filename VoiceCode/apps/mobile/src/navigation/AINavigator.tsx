/**
 * AI Navigator
 * Phase 3 Week 10 Day 64-67: AI Features Navigation
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AIStackParamList } from './types';

// Import AI screens
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
} from '../screens/ai';

const Stack = createStackNavigator<AIStackParamList>();

export function AINavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="AISummary"
        component={AISummaryScreen}
        options={{ title: 'AI Summary' }}
      />
      
      <Stack.Screen
        name="AIKeyPoints"
        component={AIKeyPointsScreen}
        options={{ title: 'Key Points' }}
      />

      <Stack.Screen
        name="AIActionItems"
        component={AIActionItemsScreen}
        options={{ title: 'Action Items' }}
      />

      <Stack.Screen
        name="SpeakerIdentification"
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
        options={{ title: 'Live AI Assistant' }}
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
    </Stack.Navigator>
  );
}

