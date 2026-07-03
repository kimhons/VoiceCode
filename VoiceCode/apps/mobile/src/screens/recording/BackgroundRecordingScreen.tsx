import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BackgroundRecordingScreen: React.FC = () => {
  const [backgroundEnabled, setBackgroundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [maxDuration, setMaxDuration] = useState('unlimited');

  const durationOptions = [
    { id: '30min', label: '30 minutes' },
    { id: '1hour', label: '1 hour' },
    { id: '2hours', label: '2 hours' },
    { id: 'unlimited', label: 'Unlimited' },
  ];

  const recentSessions = [
    {
      id: '1',
      name: 'Team Standup',
      duration: '23:45',
      date: 'Today, 10:30 AM',
      status: 'completed',
    },
    {
      id: '2',
      name: 'Client Call',
      duration: '45:12',
      date: 'Today, 2:15 PM',
      status: 'completed',
    },
    {
      id: '3',
      name: 'Background Recording',
      duration: '1:23:05',
      date: 'Yesterday',
      status: 'interrupted',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Background Recording</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: backgroundEnabled ? '#34C75920' : '#8E8E9320' },
            ]}
          >
            <Ionicons
              name="recording"
              size={32}
              color={backgroundEnabled ? '#34C759' : '#8E8E93'}
            />
          </View>
          <Text style={styles.statusTitle}>
            Background Recording {backgroundEnabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Text style={styles.statusDesc}>
            {backgroundEnabled
              ? 'App continues recording when minimized'
              : 'Recording stops when app is backgrounded'}
          </Text>
          <Switch
            value={backgroundEnabled}
            onValueChange={setBackgroundEnabled}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFF"
            style={styles.mainSwitch}
          />
        </View>

        {backgroundEnabled && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="notifications" size={20} color="#FF9500" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Status Notifications</Text>
                      <Text style={styles.settingDesc}>Show recording indicator</Text>
                    </View>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="save" size={20} color="#007AFF" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Auto-Save</Text>
                      <Text style={styles.settingDesc}>Save recordings automatically</Text>
                    </View>
                  </View>
                  <Switch
                    value={autoSaveEnabled}
                    onValueChange={setAutoSaveEnabled}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="battery-half" size={20} color="#34C759" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Low Power Mode</Text>
                      <Text style={styles.settingDesc}>Reduce quality to save battery</Text>
                    </View>
                  </View>
                  <Switch
                    value={lowPowerMode}
                    onValueChange={setLowPowerMode}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Maximum Duration</Text>
              <View style={styles.durationCard}>
                {durationOptions.map((opt, idx) => (
                  <View key={opt.id}>
                    <TouchableOpacity
                      style={styles.durationRow}
                      onPress={() => setMaxDuration(opt.id)}
                    >
                      <Text style={styles.durationLabel}>{opt.label}</Text>
                      <View
                        style={[styles.radioOuter, maxDuration === opt.id && styles.radioSelected]}
                      >
                        {maxDuration === opt.id && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                    {idx < durationOptions.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Background Sessions</Text>
              {recentSessions.map(session => (
                <TouchableOpacity key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionIcon}>
                    <Ionicons
                      name={session.status === 'completed' ? 'checkmark-circle' : 'alert-circle'}
                      size={20}
                      color={session.status === 'completed' ? '#34C759' : '#FF9500'}
                    />
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>{session.name}</Text>
                    <Text style={styles.sessionMeta}>
                      {session.date} • {session.duration}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            Background recording uses more battery. Ensure sufficient storage space for long
            recordings.
          </Text>
        </View>

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
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
  },
  statusIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  statusDesc: { fontSize: 14, color: '#8E8E93', marginTop: 8, textAlign: 'center' },
  mainSwitch: { marginTop: 16, transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  durationCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  durationRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  durationLabel: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { borderColor: '#007AFF' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#007AFF' },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  sessionMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#007AFF10',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
  },
  infoText: { flex: 1, fontSize: 13, color: '#007AFF', marginLeft: 10, lineHeight: 18 },
  bottomPadding: { height: 40 },
});

export default BackgroundRecordingScreen;
