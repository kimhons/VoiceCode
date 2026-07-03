import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AutoJoinSettingsScreen: React.FC = () => {
  const [autoJoinEnabled, setAutoJoinEnabled] = useState(true);
  const [joinBeforeHost, setJoinBeforeHost] = useState(true);
  const [joinEarly, setJoinEarly] = useState(true);
  const [earlyMinutes, setEarlyMinutes] = useState(2);
  const [autoRecord, setAutoRecord] = useState(true);
  const [notifyOnJoin, setNotifyOnJoin] = useState(true);

  const connectedCalendars = [
    {
      id: '1',
      name: 'Google Calendar',
      email: 'john@company.com',
      enabled: true,
      color: '#4285F4',
    },
    {
      id: '2',
      name: 'Outlook Calendar',
      email: 'john.smith@company.com',
      enabled: true,
      color: '#0078D4',
    },
  ];

  const upcomingMeetings = [
    { id: '1', title: 'Team Standup', time: '10:00 AM', platform: 'Zoom', autoJoin: true },
    { id: '2', title: 'Client Review', time: '2:00 PM', platform: 'Teams', autoJoin: true },
    { id: '3', title: 'One-on-One', time: '4:30 PM', platform: 'Meet', autoJoin: false },
  ];

  const earlyOptions = [1, 2, 3, 5];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Auto-Join Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainToggle}>
          <View style={styles.toggleInfo}>
            <View
              style={[
                styles.toggleIcon,
                { backgroundColor: autoJoinEnabled ? '#34C75920' : '#8E8E9320' },
              ]}
            >
              <Ionicons name="enter" size={24} color={autoJoinEnabled ? '#34C759' : '#8E8E93'} />
            </View>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Auto-Join Meetings</Text>
              <Text style={styles.toggleDesc}>Automatically join scheduled meetings</Text>
            </View>
          </View>
          <Switch
            value={autoJoinEnabled}
            onValueChange={setAutoJoinEnabled}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFF"
          />
        </View>

        {autoJoinEnabled && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Join Behavior</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Join Before Host</Text>
                    <Text style={styles.settingDesc}>Join even if host hasn&apos;t arrived</Text>
                  </View>
                  <Switch
                    value={joinBeforeHost}
                    onValueChange={setJoinBeforeHost}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Join Early</Text>
                    <Text style={styles.settingDesc}>Join before meeting starts</Text>
                  </View>
                  <Switch
                    value={joinEarly}
                    onValueChange={setJoinEarly}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
                {joinEarly && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.earlyOptions}>
                      <Text style={styles.earlyLabel}>Minutes before start</Text>
                      <View style={styles.earlyButtons}>
                        {earlyOptions.map(min => (
                          <TouchableOpacity
                            key={min}
                            style={[
                              styles.earlyButton,
                              earlyMinutes === min && styles.earlyButtonActive,
                            ]}
                            onPress={() => setEarlyMinutes(min)}
                          >
                            <Text
                              style={[
                                styles.earlyText,
                                earlyMinutes === min && styles.earlyTextActive,
                              ]}
                            >
                              {min}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recording</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="radio-button-on" size={20} color="#FF3B30" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Auto-Record</Text>
                      <Text style={styles.settingDesc}>Start recording when joining</Text>
                    </View>
                  </View>
                  <Switch
                    value={autoRecord}
                    onValueChange={setAutoRecord}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="notifications" size={20} color="#FF9500" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Notify on Join</Text>
                      <Text style={styles.settingDesc}>Send notification when joined</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifyOnJoin}
                    onValueChange={setNotifyOnJoin}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Connected Calendars</Text>
              {connectedCalendars.map(cal => (
                <View key={cal.id} style={styles.calendarCard}>
                  <View style={[styles.calendarIcon, { backgroundColor: cal.color + '20' }]}>
                    <Ionicons name="calendar" size={20} color={cal.color} />
                  </View>
                  <View style={styles.calendarInfo}>
                    <Text style={styles.calendarName}>{cal.name}</Text>
                    <Text style={styles.calendarEmail}>{cal.email}</Text>
                  </View>
                  <Switch
                    value={cal.enabled}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
              {upcomingMeetings.map(meeting => (
                <View key={meeting.id} style={styles.meetingCard}>
                  <View style={styles.meetingInfo}>
                    <Text style={styles.meetingTitle}>{meeting.title}</Text>
                    <Text style={styles.meetingMeta}>
                      {meeting.time} • {meeting.platform}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.joinBadge,
                      { backgroundColor: meeting.autoJoin ? '#34C75920' : '#8E8E9320' },
                    ]}
                  >
                    <Text
                      style={[styles.joinText, { color: meeting.autoJoin ? '#34C759' : '#8E8E93' }]}
                    >
                      {meeting.autoJoin ? 'Auto-join' : 'Manual'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
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
  earlyOptions: { padding: 14 },
  earlyLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 10 },
  earlyButtons: { flexDirection: 'row' },
  earlyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  earlyButtonActive: { backgroundColor: '#007AFF' },
  earlyText: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  earlyTextActive: { color: '#FFF' },
  calendarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  calendarIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  calendarInfo: { flex: 1 },
  calendarName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  calendarEmail: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  meetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  meetingInfo: { flex: 1 },
  meetingTitle: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  meetingMeta: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  joinBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  joinText: { fontSize: 12, fontWeight: '500' },
  bottomPadding: { height: 40 },
});

export default AutoJoinSettingsScreen;
