import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const NotificationsSettingsScreen: React.FC = () => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [notifyShares, setNotifyShares] = useState(true);
  const [notifyEdits, setNotifyEdits] = useState(false);
  const [notifyRecordings, setNotifyRecordings] = useState(true);
  const [notifyTeamActivity, setNotifyTeamActivity] = useState(true);

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Methods</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: '#FF3B3020' }]}>
                  <Ionicons name="notifications" size={20} color="#FF3B30" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>Receive alerts on your device</Text>
                </View>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: '#007AFF20' }]}>
                  <Ionicons name="mail" size={20} color="#007AFF" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Email Notifications</Text>
                  <Text style={styles.settingDescription}>Receive updates via email</Text>
                </View>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Settings</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-high" size={20} color="#FF9500" />
                <Text style={styles.settingLabel}>Sound</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="phone-portrait" size={20} color="#AF52DE" />
                <Text style={styles.settingLabel}>Vibration</Text>
              </View>
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="chatbubble" size={20} color="#FF9500" />
                <Text style={styles.settingLabel}>Comments & Replies</Text>
              </View>
              <Switch
                value={notifyComments}
                onValueChange={setNotifyComments}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="at" size={20} color="#AF52DE" />
                <Text style={styles.settingLabel}>Mentions</Text>
              </View>
              <Switch
                value={notifyMentions}
                onValueChange={setNotifyMentions}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="share" size={20} color="#34C759" />
                <Text style={styles.settingLabel}>Shares & Invites</Text>
              </View>
              <Switch
                value={notifyShares}
                onValueChange={setNotifyShares}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="create" size={20} color="#007AFF" />
                <Text style={styles.settingLabel}>Document Edits</Text>
              </View>
              <Switch
                value={notifyEdits}
                onValueChange={setNotifyEdits}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="mic" size={20} color="#FF3B30" />
                <Text style={styles.settingLabel}>Recording Complete</Text>
              </View>
              <Switch
                value={notifyRecordings}
                onValueChange={setNotifyRecordings}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="people" size={20} color="#5856D6" />
                <Text style={styles.settingLabel}>Team Activity</Text>
              </View>
              <Switch
                value={notifyTeamActivity}
                onValueChange={setNotifyTeamActivity}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: '#5856D620' }]}>
                  <Ionicons name="moon" size={20} color="#5856D6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Quiet Hours</Text>
                  <Text style={styles.settingDescription}>Pause notifications at night</Text>
                </View>
              </View>
              <Switch
                value={quietHoursEnabled}
                onValueChange={setQuietHoursEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            {quietHoursEnabled && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="time" size={20} color="#8E8E93" />
                    <Text style={styles.settingLabel}>Schedule</Text>
                  </View>
                  <View style={styles.settingValue}>
                    <Text style={styles.valueText}>10:00 PM - 7:00 AM</Text>
                    <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                  </View>
                </TouchableOpacity>
              </>
            )}
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: '#FF950020' }]}>
                  <Ionicons name="newspaper" size={20} color="#FF9500" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Daily Digest</Text>
                  <Text style={styles.settingDescription}>Summary of all activity</Text>
                </View>
              </View>
              <Switch
                value={digestEnabled}
                onValueChange={setDigestEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.resetButton}>
          <Text style={styles.resetText}>Reset to Defaults</Text>
        </TouchableOpacity>

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
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  settingDescription: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  settingValue: { flexDirection: 'row', alignItems: 'center' },
  valueText: { fontSize: 14, color: '#8E8E93', marginRight: 4 },
  resetButton: { alignItems: 'center', padding: 16 },
  resetText: { fontSize: 15, color: '#FF3B30' },
  bottomPadding: { height: 40 },
});

export default NotificationsSettingsScreen;
