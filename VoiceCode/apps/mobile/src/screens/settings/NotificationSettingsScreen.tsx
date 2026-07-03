import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NotificationSettingsScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

const SOUND_OPTIONS = ['Default', 'Chime', 'Bell', 'None'];

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = () => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showPermission, setShowPermission] = useState(false);
  const [transcriptionComplete, setTranscriptionComplete] = useState(true);
  const [shareEnabled, setShareEnabled] = useState(true);
  const [commentEnabled, setCommentEnabled] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [quietHours, setQuietHours] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSounds, setShowSounds] = useState(false);
  const [sound, setSound] = useState('Default');

  const togglePush = (value: boolean) => {
    setPushEnabled(value);
    setShowPermission(value);
  };

  const Row = ({
    label,
    value,
    onValueChange,
    testID,
  }: {
    label: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
    testID: string;
  }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch testID={testID} value={value} onValueChange={onValueChange} />
    </View>
  );

  return (
    <ScrollView style={styles.container} testID="notification-settings-screen">
      <Text style={styles.sectionHeader}>Push Notifications</Text>
      <View style={styles.section}>
        <Row label="Enable Push Notifications" value={pushEnabled} onValueChange={togglePush} testID="push-toggle" />
        {showPermission ? (
          <Text style={styles.permission}>Notification permission is required to enable push.</Text>
        ) : null}
      </View>

      <Text style={styles.sectionHeader}>Notification Types</Text>
      <View style={styles.section}>
        <Row
          label="Transcription Complete"
          value={transcriptionComplete}
          onValueChange={setTranscriptionComplete}
          testID="transcription-complete-toggle"
        />
        <Row label="Shares" value={shareEnabled} onValueChange={setShareEnabled} testID="share-toggle" />
        <Row label="Comments" value={commentEnabled} onValueChange={setCommentEnabled} testID="comment-toggle" />
        <Row label="Sync" value={syncEnabled} onValueChange={setSyncEnabled} testID="sync-toggle" />
      </View>

      <Text style={styles.sectionHeader}>Quiet Hours</Text>
      <View style={styles.section}>
        <Row label="Enable Quiet Hours" value={quietHours} onValueChange={setQuietHours} testID="quiet-hours-toggle" />
        <TouchableOpacity style={styles.row} testID="start-time-picker" onPress={() => setShowTimePicker(true)}>
          <Text style={styles.rowLabel}>Start Time</Text>
          <Text style={styles.rowValue}>10:00 PM</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} testID="end-time-picker" onPress={() => setShowTimePicker(true)}>
          <Text style={styles.rowLabel}>End Time</Text>
          <Text style={styles.rowValue}>7:00 AM</Text>
        </TouchableOpacity>
        {showTimePicker ? (
          <View style={styles.timePicker} testID="time-picker">
            <Text style={styles.timePickerText}>Select a time</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionHeader}>Sound</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.row} testID="sound-selector" onPress={() => setShowSounds((s) => !s)}>
          <Text style={styles.rowLabel}>Notification Sound</Text>
          <Text style={styles.rowValue}>{sound}</Text>
        </TouchableOpacity>
        {showSounds
          ? SOUND_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.option}
                onPress={() => {
                  setSound(option);
                  setShowSounds(false);
                }}
              >
                <Text style={styles.optionText}>{option}</Text>
                {sound === option ? <Ionicons name="checkmark" size={18} color="#667eea" /> : null}
              </TouchableOpacity>
            ))
          : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  sectionHeader: { fontSize: 13, color: '#888', fontWeight: '600', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, textTransform: 'uppercase' },
  section: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  rowLabel: { fontSize: 16, color: '#1a1a2e' },
  rowValue: { fontSize: 15, color: '#888' },
  permission: { paddingHorizontal: 16, paddingVertical: 12, color: '#f59e0b', fontSize: 14 },
  timePicker: { padding: 16, alignItems: 'center' },
  timePickerText: { color: '#667eea', fontSize: 15 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#f0f0f0' },
  optionText: { fontSize: 15, color: '#1a1a2e' },
});

export default NotificationSettingsScreen;
