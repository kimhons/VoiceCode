/**
 * Enterprise Navigator
 * Phase 3 Week 9: Enterprise Features Navigation
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { EnterpriseStackParamList } from './types';

// Import enterprise screens
import {
  OrganizationManagementScreen,
  WorkspaceIsolationScreen,
  SecurityCenterScreen,
  ComplianceManagementScreen,
  AnalyticsDashboardScreen,
  ReportBuilderScreen,
} from '../screens/enterprise';

const Stack = createStackNavigator<EnterpriseStackParamList>();

export function EnterpriseNavigator() {
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
        name="OrganizationManagement"
        component={OrganizationManagementScreen}
        options={{ title: 'Organizations' }}
      />
      
      <Stack.Screen
        name="WorkspaceIsolation"
        component={WorkspaceIsolationScreen}
        options={{ title: 'Workspaces' }}
      />

      <Stack.Screen
        name="SecurityCenter"
        component={SecurityCenterScreen}
        options={{ title: 'Security Center' }}
      />

      <Stack.Screen
        name="ComplianceManagement"
        component={ComplianceManagementScreen}
        options={{ title: 'Compliance' }}
      />

      <Stack.Screen
        name="AnalyticsDashboard"
        component={AnalyticsDashboardScreen}
        options={{ title: 'Analytics' }}
      />

      <Stack.Screen
        name="ReportBuilder"
        component={ReportBuilderScreen}
        options={{ title: 'Reports' }}
      />
    </Stack.Navigator>
  );
}

