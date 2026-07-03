import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  calendar: string;
  calendarColor: string;
  willRecord: boolean;
}

interface ConnectedCalendar {
  id: string;
  name: string;
  provider: 'google' | 'outlook' | 'apple';
  email: string;
  color: string;
  isEnabled: boolean;
}

const CalendarSyncScreen: React.FC = () => {
  const [autoDetect, setAutoDetect] = useState(true);
  const [reminderBefore, setReminderBefore] = useState(true);
  const [addToCalendar, setAddToCalendar] = useState(true);

  const [calendars, setCalendars] = useState<ConnectedCalendar[]>([
    {
      id: '1',
      name: 'Work',
      provider: 'google',
      email: 'user@company.com',
      color: '#4285F4',
      isEnabled: true,
    },
    {
      id: '2',
      name: 'Personal',
      provider: 'google',
      email: 'user@gmail.com',
      color: '#34C759',
      isEnabled: true,
    },
    {
      id: '3',
      name: 'Outlook',
      provider: 'outlook',
      email: 'user@outlook.com',
      color: '#0078D4',
      isEnabled: false,
    },
  ]);

  const upcomingEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Team Standup',
      date: 'Today',
      time: '10:00 AM',
      duration: 30,
      calendar: 'Work',
      calendarColor: '#4285F4',
      willRecord: true,
    },
    {
      id: '2',
      title: 'Product Review',
      date: 'Today',
      time: '2:00 PM',
      duration: 60,
      calendar: 'Work',
      calendarColor: '#4285F4',
      willRecord: true,
    },
    {
      id: '3',
      title: 'Doctor Appointment',
      date: 'Tomorrow',
      time: '9:30 AM',
      duration: 45,
      calendar: 'Personal',
      calendarColor: '#34C759',
      willRecord: false,
    },
    {
      id: '4',
      title: 'Client Call',
      date: 'Tomorrow',
      time: '3:00 PM',
      duration: 45,
      calendar: 'Work',
      calendarColor: '#4285F4',
      willRecord: true,
    },
    {
      id: '5',
      title: 'Weekly Planning',
      date: 'Jan 20',
      time: '11:00 AM',
      duration: 60,
      calendar: 'Work',
      calendarColor: '#4285F4',
      willRecord: true,
    },
  ];

  const toggleCalendar = (id: string) => {
    setCalendars(prev =>
      prev.map(cal => (cal.id === id ? { ...cal, isEnabled: !cal.isEnabled } : cal))
    );
  };

  const getProviderIcon = (provider: string): string => {
    switch (provider) {
      case 'google':
        return 'logo-google';
      case 'outlook':
        return 'mail';
      case 'apple':
        return 'logo-apple';
      default:
        return 'calendar';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Calendar Sync</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Calendars</Text>
          <View style={styles.calendarsCard}>
            {calendars.map((cal, idx) => (
              <View key={cal.id}>
                <View style={styles.calendarRow}>
                  <View style={[styles.calendarIcon, { backgroundColor: cal.color + '20' }]}>
                    <Ionicons
                      name={getProviderIcon(cal.provider) as any}
                      size={20}
                      color={cal.color}
                    />
                  </View>
                  <View style={styles.calendarInfo}>
                    <Text style={styles.calendarName}>{cal.name}</Text>
                    <Text style={styles.calendarEmail}>{cal.email}</Text>
                  </View>
                  <Switch
                    value={cal.isEnabled}
                    onValueChange={() => toggleCalendar(cal.id)}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
                {idx < calendars.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="search" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Detect Meetings</Text>
                  <Text style={styles.settingDescription}>Find video call links in events</Text>
                </View>
              </View>
              <Switch
                value={autoDetect}
                onValueChange={setAutoDetect}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Recording Reminder</Text>
                  <Text style={styles.settingDescription}>Notify 5 min before meetings</Text>
                </View>
              </View>
              <Switch
                value={reminderBefore}
                onValueChange={setReminderBefore}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="calendar" size={20} color="#34C759" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Add Recordings to Calendar</Text>
                  <Text style={styles.settingDescription}>Create events for recordings</Text>
                </View>
              </View>
              <Switch
                value={addToCalendar}
                onValueChange={setAddToCalendar}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View Calendar</Text>
            </TouchableOpacity>
          </View>
          {upcomingEvents.map(event => (
            <View key={event.id} style={styles.eventCard}>
              <View style={[styles.eventColorBar, { backgroundColor: event.calendarColor }]} />
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.willRecord && (
                    <View style={styles.recordBadge}>
                      <Ionicons name="radio-button-on" size={12} color="#FF3B30" />
                    </View>
                  )}
                </View>
                <View style={styles.eventMeta}>
                  <Text style={styles.eventDate}>{event.date}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.eventTime}>{event.time}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.eventDuration}>{event.duration} min</Text>
                </View>
                <View style={styles.eventFooter}>
                  <View style={styles.calendarBadge}>
                    <View style={[styles.calendarDot, { backgroundColor: event.calendarColor }]} />
                    <Text style={styles.calendarLabel}>{event.calendar}</Text>
                  </View>
                  <TouchableOpacity style={styles.toggleRecordButton}>
                    <Text
                      style={[
                        styles.toggleRecordText,
                        { color: event.willRecord ? '#FF3B30' : '#007AFF' },
                      ]}
                    >
                      {event.willRecord ? 'Cancel Recording' : 'Record'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.syncInfo}>
          <Ionicons name="sync" size={16} color="#8E8E93" />
          <Text style={styles.syncText}>Last synced 5 minutes ago</Text>
          <TouchableOpacity>
            <Text style={styles.syncNow}>Sync Now</Text>
          </TouchableOpacity>
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
  addButton: { padding: 4 },
  content: { flex: 1 },
  section: { paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllText: { fontSize: 14, color: '#007AFF' },
  calendarsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  calendarRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  calendarIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  calendarInfo: { flex: 1 },
  calendarName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  calendarEmail: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDescription: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  eventColorBar: { width: 4 },
  eventContent: { flex: 1, padding: 14 },
  eventHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eventTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', flex: 1 },
  recordBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B3020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  eventDate: { fontSize: 13, color: '#8E8E93' },
  metaDot: { marginHorizontal: 6, color: '#8E8E93' },
  eventTime: { fontSize: 13, color: '#8E8E93' },
  eventDuration: { fontSize: 13, color: '#8E8E93' },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  calendarBadge: { flexDirection: 'row', alignItems: 'center' },
  calendarDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  calendarLabel: { fontSize: 12, color: '#8E8E93' },
  toggleRecordButton: {},
  toggleRecordText: { fontSize: 13, fontWeight: '500' },
  syncInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16 },
  syncText: { fontSize: 13, color: '#8E8E93', marginLeft: 6 },
  syncNow: { fontSize: 13, color: '#007AFF', marginLeft: 10 },
  bottomPadding: { height: 40 },
});

export default CalendarSyncScreen;
