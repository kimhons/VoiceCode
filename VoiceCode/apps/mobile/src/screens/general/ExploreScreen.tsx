// VoiceCode Mobile - Explore Screen
// Central hub for accessing all app features

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface FeatureCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  route: string;
  description: string;
}

const ExploreScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const categories: FeatureCategory[] = [
    {
      id: 'recording',
      title: 'Recording',
      icon: 'mic',
      color: '#FF3B30',
      route: 'RecordingHub',
      description: 'Capture & transcribe',
    },
    {
      id: 'ai',
      title: 'AI Tools',
      icon: 'sparkles',
      color: '#AF52DE',
      route: 'AIHub',
      description: 'Smart insights',
    },
    {
      id: 'medical',
      title: 'Medical',
      icon: 'medkit',
      color: '#34C759',
      route: 'MedicalHub',
      description: 'Clinical notes',
    },
    {
      id: 'collaboration',
      title: 'Team',
      icon: 'people',
      color: '#007AFF',
      route: 'CollaborationHub',
      description: 'Share & collaborate',
    },
    {
      id: 'integrations',
      title: 'Connect',
      icon: 'apps',
      color: '#FF9500',
      route: 'IntegrationsHub',
      description: 'Zoom, Slack, more',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'stats-chart',
      color: '#5856D6',
      route: 'AnalyticsHub',
      description: 'Usage & insights',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover all features</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Access Grid */}
        <View style={styles.grid}>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => navigation.navigate(category.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: category.color + '15' }]}>
                <Ionicons name={category.icon as any} size={26} color={category.color} />
              </View>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* More Tools Section */}
        <Text style={styles.sectionTitle}>More Tools</Text>
        <TouchableOpacity style={styles.toolRow} onPress={() => navigation.navigate('EditingHub')}>
          <View style={[styles.toolIcon, { backgroundColor: '#5AC8FA15' }]}>
            <Ionicons name="cut" size={20} color="#5AC8FA" />
          </View>
          <View style={styles.toolText}>
            <Text style={styles.toolTitle}>Audio Editing</Text>
            <Text style={styles.toolDesc}>Trim, mix, enhance audio</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolRow}
          onPress={() => navigation.navigate('AutomationHub')}
        >
          <View style={[styles.toolIcon, { backgroundColor: '#00C7BE15' }]}>
            <Ionicons name="flash" size={20} color="#00C7BE" />
          </View>
          <View style={styles.toolText}>
            <Text style={styles.toolTitle}>Automation</Text>
            <Text style={styles.toolDesc}>Workflows & meeting bots</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolRow} onPress={() => navigation.navigate('SecurityHub')}>
          <View style={[styles.toolIcon, { backgroundColor: '#FF2D5515' }]}>
            <Ionicons name="shield-checkmark" size={20} color="#FF2D55" />
          </View>
          <View style={styles.toolText}>
            <Text style={styles.toolTitle}>Security</Text>
            <Text style={styles.toolDesc}>Privacy & compliance</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolRow}
          onPress={() => navigation.navigate('AccessibilityHub')}
        >
          <View style={[styles.toolIcon, { backgroundColor: '#8E8E9315' }]}>
            <Ionicons name="accessibility" size={20} color="#8E8E93" />
          </View>
          <View style={styles.toolText}>
            <Text style={styles.toolTitle}>Accessibility</Text>
            <Text style={styles.toolDesc}>Voice control & gestures</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F5F7',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1E' },
  subtitle: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  content: { flex: 1 },
  grid: { padding: 12, flexDirection: 'row', flexWrap: 'wrap' },
  categoryCard: {
    width: '46%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    margin: '2%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginBottom: 2 },
  categoryDescription: { fontSize: 12, color: '#8E8E93' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toolText: { flex: 1 },
  toolTitle: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  toolDesc: { fontSize: 13, color: '#8E8E93', marginTop: 1 },
  bottomPadding: { height: 40 },
});

export default ExploreScreen;
