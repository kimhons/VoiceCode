import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface NotionDatabase {
  id: string;
  name: string;
  icon: string;
  type: 'database' | 'page';
  itemCount?: number;
  isSelected: boolean;
}

const NotionIntegrationScreen: React.FC = () => {
  const [autoExport, setAutoExport] = useState(true);
  const [includeFormatting, setIncludeFormatting] = useState(true);
  const [createSubpages, setCreateSubpages] = useState(true);
  const [syncBidirectional, setSyncBidirectional] = useState(false);

  const [databases, setDatabases] = useState<NotionDatabase[]>([
    {
      id: '1',
      name: 'Meeting Notes',
      icon: '📝',
      type: 'database',
      itemCount: 156,
      isSelected: true,
    },
    {
      id: '2',
      name: 'Project Documentation',
      icon: '📁',
      type: 'database',
      itemCount: 89,
      isSelected: false,
    },
    {
      id: '3',
      name: 'Knowledge Base',
      icon: '📚',
      type: 'database',
      itemCount: 234,
      isSelected: true,
    },
    {
      id: '4',
      name: 'Action Items',
      icon: '✅',
      type: 'database',
      itemCount: 67,
      isSelected: false,
    },
    { id: '5', name: 'Team Wiki', icon: '🌐', type: 'page', isSelected: false },
  ]);

  const toggleDatabase = (id: string) => {
    setDatabases(prev =>
      prev.map(db => (db.id === id ? { ...db, isSelected: !db.isSelected } : db))
    );
  };

  const templateMappings = [
    { voiceCode: 'Meeting Transcript', notion: 'Meeting Notes', enabled: true },
    { voiceCode: 'AI Summary', notion: 'Quick Notes', enabled: true },
    { voiceCode: 'Action Items', notion: 'Action Items', enabled: false },
  ];

  const recentExports = [
    { title: 'Q1 Planning Session', database: 'Meeting Notes', date: '1 hour ago' },
    { title: 'Product Roadmap Discussion', database: 'Meeting Notes', date: 'Yesterday' },
    { title: 'API Documentation Update', database: 'Knowledge Base', date: '3 days ago' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Notion Integration</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.connectionCard}>
          <View style={styles.notionIcon}>
            <Text style={styles.notionIconText}>N</Text>
          </View>
          <View style={styles.connectionInfo}>
            <Text style={styles.workspaceName}>My Workspace</Text>
            <View style={styles.statusRow}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.disconnectButton}>
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="sync" size={20} color="#000" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Export</Text>
                  <Text style={styles.settingDescription}>
                    Automatically export new transcripts
                  </Text>
                </View>
              </View>
              <Switch
                value={autoExport}
                onValueChange={setAutoExport}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="text" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Preserve Formatting</Text>
                  <Text style={styles.settingDescription}>Keep headers, lists, and styles</Text>
                </View>
              </View>
              <Switch
                value={includeFormatting}
                onValueChange={setIncludeFormatting}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="layers" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Create Subpages</Text>
                  <Text style={styles.settingDescription}>Organize sections as subpages</Text>
                </View>
              </View>
              <Switch
                value={createSubpages}
                onValueChange={setCreateSubpages}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="swap-horizontal" size={20} color="#AF52DE" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Two-Way Sync</Text>
                  <Text style={styles.settingDescription}>Sync edits from Notion back</Text>
                </View>
              </View>
              <Switch
                value={syncBidirectional}
                onValueChange={setSyncBidirectional}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Databases & Pages</Text>
            <TouchableOpacity>
              <Ionicons name="refresh" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.databasesCard}>
            {databases.map((db, idx) => (
              <View key={db.id}>
                <TouchableOpacity style={styles.databaseRow} onPress={() => toggleDatabase(db.id)}>
                  <Text style={styles.dbIcon}>{db.icon}</Text>
                  <View style={styles.dbInfo}>
                    <Text style={styles.dbName}>{db.name}</Text>
                    {db.itemCount && <Text style={styles.dbCount}>{db.itemCount} items</Text>}
                  </View>
                  <View style={[styles.checkbox, db.isSelected && styles.checkboxSelected]}>
                    {db.isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                </TouchableOpacity>
                {idx < databases.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Template Mappings</Text>
          <View style={styles.mappingsCard}>
            {templateMappings.map((mapping, idx) => (
              <View key={idx}>
                <View style={styles.mappingRow}>
                  <View style={styles.mappingContent}>
                    <Text style={styles.mappingSource}>{mapping.voiceCode}</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color="#8E8E93"
                      style={styles.mappingArrow}
                    />
                    <Text style={styles.mappingTarget}>{mapping.notion}</Text>
                  </View>
                  <View
                    style={[
                      styles.mappingStatus,
                      mapping.enabled ? styles.mappingEnabled : styles.mappingDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mappingStatusText,
                        { color: mapping.enabled ? '#34C759' : '#8E8E93' },
                      ]}
                    >
                      {mapping.enabled ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                {idx < templateMappings.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.addMappingButton}>
            <Ionicons name="add" size={18} color="#007AFF" />
            <Text style={styles.addMappingText}>Add Mapping</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Exports</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentExports.map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.exportCard}>
              <View style={styles.exportIcon}>
                <Ionicons name="document-text" size={18} color="#000" />
              </View>
              <View style={styles.exportInfo}>
                <Text style={styles.exportTitle}>{item.title}</Text>
                <View style={styles.exportMeta}>
                  <Text style={styles.exportDatabase}>{item.database}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.exportDate}>{item.date}</Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={18} color="#007AFF" />
            </TouchableOpacity>
          ))}
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
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 14,
    padding: 16,
  },
  notionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notionIconText: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  connectionInfo: { flex: 1 },
  workspaceName: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  connectedText: { fontSize: 13, color: '#34C759' },
  disconnectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FF3B3020',
  },
  disconnectText: { fontSize: 13, fontWeight: '500', color: '#FF3B30' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
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
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  databasesCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  databaseRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  dbIcon: { fontSize: 24, marginRight: 12 },
  dbInfo: { flex: 1 },
  dbName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  dbCount: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  mappingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  mappingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  mappingContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  mappingSource: { fontSize: 14, color: '#1C1C1E' },
  mappingArrow: { marginHorizontal: 10 },
  mappingTarget: { fontSize: 14, fontWeight: '500', color: '#000' },
  mappingStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  mappingEnabled: { backgroundColor: '#34C75920' },
  mappingDisabled: { backgroundColor: '#8E8E9320' },
  mappingStatusText: { fontSize: 12, fontWeight: '500' },
  addMappingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addMappingText: { fontSize: 14, color: '#007AFF', marginLeft: 6 },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  exportIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#00000010',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exportInfo: { flex: 1 },
  exportTitle: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  exportMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  exportDatabase: { fontSize: 12, color: '#000', fontWeight: '500' },
  metaDot: { marginHorizontal: 6, color: '#8E8E93' },
  exportDate: { fontSize: 12, color: '#8E8E93' },
  bottomPadding: { height: 40 },
});

export default NotionIntegrationScreen;
