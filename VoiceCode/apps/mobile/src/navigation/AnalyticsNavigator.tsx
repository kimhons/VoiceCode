/**
 * Analytics Navigator
 * Phase 3 Week 11 Day 71-72: Productivity Analytics
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AnalyticsStackParamList } from './types';

// Import Analytics Screens
import {
  ProductivityDashboardScreen,
  TeamPerformanceScreen,
} from '../screens/analytics';

const Stack = createStackNavigator<AnalyticsStackParamList>();

export default function AnalyticsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ProductivityDashboard"
        component={ProductivityDashboardScreen}
        options={{ title: 'Productivity Dashboard' }}
      />
      <Stack.Screen
        name="TeamPerformance"
        component={TeamPerformanceScreen}
        options={{ title: 'Team Performance' }}
      />
    </Stack.Navigator>
  );
}

