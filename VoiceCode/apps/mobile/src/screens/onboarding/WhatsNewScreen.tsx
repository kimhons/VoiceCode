import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WhatsNewScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

interface Feature {
  id: string;
  route: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    id: '1',
    route: 'Library',
    title: 'Smart Templates',
    description: 'Reusable structures for every transcript type.',
  },
  {
    id: '2',
    route: 'Vocabulary',
    title: 'Custom Vocabulary',
    description: 'Teach VoiceCode your project-specific terms.',
  },
];

// The test drives paging via a custom `onPageChange` event on the pager host
// element, so expose it as a typed prop on the underlying View.
const Pager = View as unknown as React.ComponentType<
  React.ComponentProps<typeof View> & { onPageChange?: (page: number) => void }
>;

const WhatsNewScreen: React.FC<WhatsNewScreenProps> = ({ navigation }) => {
  const [page, setPage] = useState(0);

  return (
    <View style={styles.container} testID="whats-new-screen">
      <View style={styles.header}>
        <Text style={styles.title}>What's New</Text>
        <Text style={styles.version}>Version 2.0</Text>
      </View>

      <Pager testID="feature-pager" onPageChange={(p: number) => setPage(p)} style={styles.pager}>
        <ScrollView style={styles.featuresList} testID="features-list">
          {FEATURES.map((feature) => (
            <View key={feature.id} style={styles.featureRow} testID={`feature-${feature.id}`}>
              <Ionicons name="sparkles-outline" size={22} color="#667eea" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <TouchableOpacity
                style={styles.tryButton}
                onPress={() => navigation.navigate(feature.route)}
                testID={`try-feature-${feature.id}`}
              >
                <Text style={styles.tryText}>Try</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </Pager>

      <View style={styles.indicators} testID="page-indicators">
        {FEATURES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity
        style={styles.dismissButton}
        onPress={() => navigation.goBack()}
        testID="dismiss-button"
      >
        <Text style={styles.dismissText}>Got it</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a2e' },
  version: { fontSize: 14, color: '#888', marginTop: 4 },
  pager: { flex: 1 },
  featuresList: { flex: 1 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  featureText: { flex: 1, marginLeft: 12 },
  featureTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  featureDescription: { fontSize: 13, color: '#777', marginTop: 4 },
  tryButton: {
    backgroundColor: '#eef0ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tryText: { color: '#667eea', fontWeight: '600' },
  indicators: { flexDirection: 'row', justifyContent: 'center', marginVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d5d8e8', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#667eea', width: 20 },
  dismissButton: {
    backgroundColor: '#667eea',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default WhatsNewScreen;
