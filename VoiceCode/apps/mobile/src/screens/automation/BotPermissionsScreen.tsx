import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  required: boolean;
}

const BotPermissionsScreen: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([
    { id: 'audio', name: 'Audio Access', description: 'Record meeting audio', icon: 'mic', color: '#FF3B30', enabled: true, required: true },
    { id: 'video', name: 'Video Access', description: 'Capture video feed', icon: 'videocam', color: '#5856D6', enabled: true, required: false },
    { id: 'screen', name: 'Screen Share', description: 'View shared screens', icon: 'desktop', color: '#007AFF', enabled: true, required: false },
    { id: 'chat', name: 'Chat Messages', description: 'Read meeting chat', icon: 'chatbubbles', color: '#34C759', enabled: false, required: false },
    { id: 'participants', name: 'Participants', description: 'View attendee list', icon: 'people', color: '#FF9500', enabled: true, required: false },
    { id: 'calendar', name: 'Calendar', description: 'Access calendar events', icon: 'calendar', color: '#AF52DE', enabled: true, required: true },
  ]);

  const togglePermission = (id: string) => {
    setPermissions(prev => prev.map(p =>
      p.id === id && !p.required ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const platformPermissions = [
    { platform: 'Zoom', permissions: ['Audio', 'Video', 'Screen Share'], icon: 'videocam', color: '#2D8CFF' },
    { platform: 'Microsoft Teams', permissions: ['Audio', 'Video', 'Chat'], icon: 'chatbubbles', color: '#6264A7' },
    { platform: 'Google Meet', permissions: ['Audio', 'Video'], icon: 'logo-google', color: '#00897B' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Bot Permissions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
          <Text style={styles.infoText}>
            Control what the meeting bot can access. Some permissions are required for core functionality.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Core Permissions</Text>
          <View style={styles.permissionsCard}>
            {permissions.map((perm, idx) => (
              <View key={perm.id}>
                <View style={styles.permissionRow}>
                  <View style={[styles.permIcon, { backgroundColor: perm.color + '20' }]}>
                    <Ionicons name={perm.icon as any} size={20} color={perm.color} />
                  </View>
                  <View style={styles.permInfo}>
                    <View style={styles.permHeader}>
                      <Text style={styles.permName}>{perm.name}</Text>
                      {perm.required && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredText}>Required</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.permDesc}>{perm.description}</Text>
                  </View>
                  <Switch
                    value={perm.enabled}
                    onValueChange={() => togglePermission(perm.id)}
                    disabled={perm.required}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
                {idx < permissions.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform-Specific</Text>
          {platformPermissions.map((platform, idx) => (
            <TouchableOpacity key={idx} style={styles.platformCard}>
              <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                <Ionicons name={platform.icon as any} size={22} color={platform.color} />
              </View>
              <View style={styles.platformInfo}>
                <Text style={styles.platformName}>{platform.platform}</Text>
                <Text style={styles.platformPerms}>{platform.permissions.join(', ')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Handling</Text>
          <View style={styles.dataCard}>
            <View style={styles.dataRow}>
              <View style={styles.dataIcon}>
                <Ionicons name="lock-closed" size={18} color="#34C759" />
              </View>
              <View style={styles.dataInfo}>
                <Text style={styles.dataTitle}>End-to-End Encryption</Text>
                <Text style={styles.dataDesc}>All recordings are encrypted</Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color="#34C759" />
            </View>
            <View style={styles.dataDivider} />
            <View style={styles.dataRow}>
              <View style={styles.dataIcon}>
                <Ionicons name="trash" size={18} color="#FF9500" />
              </View>
              <View style={styles.dataInfo}>
                <Text style={styles.dataTitle}>Auto-Delete</Text>
                <Text style={styles.dataDesc}>Delete raw data after processing</Text>
              </View>
              <Switch
                value={true}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.dataDivider} />
            <View style={styles.dataRow}>
              <View style={styles.dataIcon}>
                <Ionicons name="cloud-offline" size={18} color="#007AFF" />
              </View>
              <View style={styles.dataInfo}>
                <Text style={styles.dataTitle}>Local Processing</Text>
                <Text style={styles.dataDesc}>Process sensitive data on device</Text>
              </View>
              <Switch
                value={false}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.resetButton}>
          <Ionicons name="refresh" size={18} color="#007AFF" />
          <Text style={styles.resetText}>Reset to Defaults</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  placeholder: { width: 32 },
  content: { flex: 1 },
  infoCard: { flexDirection: 'row', backgroundColor: '#007AFF15', margin: 16, borderRadius: 14, padding: 16 },
  infoText: { flex: 1, fontSize: 14, color: '#007AFF', marginLeft: 12, lineHeight: 20 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  permissionsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  permissionRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  permIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  permInfo: { flex: 1 },
  permHeader: { flexDirection: 'row', alignItems: 'center' },
  permName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  requiredBadge: { backgroundColor: '#FF950020', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  requiredText: { fontSize: 10, fontWeight: '600', color: '#FF9500' },
  permDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  platformCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 8 },
  platformIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  platformPerms: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  dataCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  dataRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  dataIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dataInfo: { flex: 1 },
  dataTitle: { fontSize: 15, color: '#1C1C1E' },
  dataDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  dataDivider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  resetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, padding: 14, backgroundColor: '#FFF', borderRadius: 12 },
  resetText: { fontSize: 15, color: '#007AFF', marginLeft: 8 },
  bottomPadding: { height: 40 },
});

export default BotPermissionsScreen;
