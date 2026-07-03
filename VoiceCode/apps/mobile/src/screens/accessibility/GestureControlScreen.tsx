import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface GestureMapping {
  id: string;
  gesture: string;
  action: string;
  icon: string;
  enabled: boolean;
}

const GestureControlScreen: React.FC = () => {
  const [gesturesEnabled, setGesturesEnabled] = useState(true);

  const [gestures, setGestures] = useState<GestureMapping[]>([
    {
      id: '1',
      gesture: 'Swipe Right',
      action: 'Skip forward 10s',
      icon: 'arrow-forward',
      enabled: true,
    },
    { id: '2', gesture: 'Swipe Left', action: 'Skip back 10s', icon: 'arrow-back', enabled: true },
    { id: '3', gesture: 'Double Tap', action: 'Play/Pause', icon: 'hand-left', enabled: true },
    { id: '4', gesture: 'Long Press', action: 'Add bookmark', icon: 'bookmark', enabled: true },
    {
      id: '5',
      gesture: 'Swipe Up',
      action: 'Increase volume',
      icon: 'volume-high',
      enabled: false,
    },
    {
      id: '6',
      gesture: 'Swipe Down',
      action: 'Decrease volume',
      icon: 'volume-low',
      enabled: false,
    },
    { id: '7', gesture: 'Pinch In', action: 'Zoom out timeline', icon: 'remove', enabled: true },
    { id: '8', gesture: 'Pinch Out', action: 'Zoom in timeline', icon: 'add', enabled: true },
  ]);

  const toggleGesture = (id: string) => {
    setGestures(prev => prev.map(g => (g.id === id ? { ...g, enabled: !g.enabled } : g)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Gesture Controls</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainToggle}>
          <View style={styles.toggleInfo}>
            <View
              style={[
                styles.toggleIcon,
                { backgroundColor: gesturesEnabled ? '#AF52DE20' : '#8E8E9320' },
              ]}
            >
              <Ionicons
                name="hand-left"
                size={24}
                color={gesturesEnabled ? '#AF52DE' : '#8E8E93'}
              />
            </View>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Gesture Controls</Text>
              <Text style={styles.toggleDesc}>Use touch gestures for quick actions</Text>
            </View>
          </View>
          <Switch
            value={gesturesEnabled}
            onValueChange={setGesturesEnabled}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFF"
          />
        </View>

        {gesturesEnabled && (
          <>
            <View style={styles.previewCard}>
              <View style={styles.previewArea}>
                <View style={styles.gestureGuide}>
                  <Ionicons name="swap-horizontal" size={32} color="#AF52DE" />
                </View>
                <Text style={styles.previewText}>Swipe to navigate</Text>
              </View>
              <TouchableOpacity style={styles.tryButton}>
                <Ionicons name="play" size={16} color="#007AFF" />
                <Text style={styles.tryText}>Try Gestures</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gesture Mappings</Text>
              <View style={styles.gesturesCard}>
                {gestures.map((gesture, idx) => (
                  <View key={gesture.id}>
                    <View style={styles.gestureRow}>
                      <View style={styles.gestureIcon}>
                        <Ionicons name={gesture.icon as any} size={20} color="#AF52DE" />
                      </View>
                      <View style={styles.gestureInfo}>
                        <Text style={styles.gestureName}>{gesture.gesture}</Text>
                        <Text style={styles.gestureAction}>{gesture.action}</Text>
                      </View>
                      <Switch
                        value={gesture.enabled}
                        onValueChange={() => toggleGesture(gesture.id)}
                        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                        thumbColor="#FFF"
                      />
                    </View>
                    {idx < gestures.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sensitivity</Text>
              <View style={styles.sensitivityCard}>
                <View style={styles.sensitivityRow}>
                  <Text style={styles.sensitivityLabel}>Swipe Distance</Text>
                  <View style={styles.sensitivityValue}>
                    <Text style={styles.valueText}>Medium</Text>
                    <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.sensitivityRow}>
                  <Text style={styles.sensitivityLabel}>Long Press Duration</Text>
                  <View style={styles.sensitivityValue}>
                    <Text style={styles.valueText}>0.5s</Text>
                    <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.sensitivityRow}>
                  <Text style={styles.sensitivityLabel}>Double Tap Speed</Text>
                  <View style={styles.sensitivityValue}>
                    <Text style={styles.valueText}>Fast</Text>
                    <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.customizeButton}>
              <Ionicons name="create" size={20} color="#007AFF" />
              <Text style={styles.customizeText}>Customize Gestures</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetButton}>
              <Ionicons name="refresh" size={18} color="#FF3B30" />
              <Text style={styles.resetText}>Reset to Defaults</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  placeholder: { width: 32 },
  content: { flex: 1 },
  mainToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 14,
    padding: 16,
  },
  toggleInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  toggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  toggleDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  previewCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewArea: { alignItems: 'center', marginBottom: 16 },
  gestureGuide: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#AF52DE15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewText: { fontSize: 14, color: '#8E8E93' },
  tryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF15',
    borderRadius: 20,
  },
  tryText: { fontSize: 14, fontWeight: '600', color: '#007AFF', marginLeft: 6 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gesturesCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  gestureRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  gestureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#AF52DE15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gestureInfo: { flex: 1 },
  gestureName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  gestureAction: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  sensitivityCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  sensitivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  sensitivityLabel: { fontSize: 15, color: '#1C1C1E' },
  sensitivityValue: { flexDirection: 'row', alignItems: 'center' },
  valueText: { fontSize: 15, color: '#8E8E93', marginRight: 4 },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  customizeText: { fontSize: 15, fontWeight: '500', color: '#007AFF', marginLeft: 8 },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    padding: 14,
  },
  resetText: { fontSize: 15, color: '#FF3B30', marginLeft: 6 },
  bottomPadding: { height: 40 },
});

export default GestureControlScreen;
