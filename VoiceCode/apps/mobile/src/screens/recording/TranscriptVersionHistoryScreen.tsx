import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Version {
  id: string;
  versionNumber: string;
  date: string;
  time: string;
  author: string;
  changeType: 'auto' | 'manual' | 'ai';
  changeDescription: string;
  wordCount: number;
  isCurrent: boolean;
}

const TranscriptVersionHistoryScreen: React.FC = () => {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<string[]>([]);

  const versions: Version[] = [
    {
      id: '1',
      versionNumber: 'v1.5',
      date: 'Jan 18, 2026',
      time: '3:45 PM',
      author: 'You',
      changeType: 'manual',
      changeDescription: 'Fixed speaker names and timestamps',
      wordCount: 12450,
      isCurrent: true,
    },
    {
      id: '2',
      versionNumber: 'v1.4',
      date: 'Jan 18, 2026',
      time: '2:30 PM',
      author: 'AI Assistant',
      changeType: 'ai',
      changeDescription: 'AI-suggested corrections applied',
      wordCount: 12448,
      isCurrent: false,
    },
    {
      id: '3',
      versionNumber: 'v1.3',
      date: 'Jan 18, 2026',
      time: '1:15 PM',
      author: 'You',
      changeType: 'manual',
      changeDescription: 'Corrected technical terminology',
      wordCount: 12445,
      isCurrent: false,
    },
    {
      id: '4',
      versionNumber: 'v1.2',
      date: 'Jan 18, 2026',
      time: '11:00 AM',
      author: 'Auto-save',
      changeType: 'auto',
      changeDescription: 'Automatic save point',
      wordCount: 12440,
      isCurrent: false,
    },
    {
      id: '5',
      versionNumber: 'v1.1',
      date: 'Jan 18, 2026',
      time: '10:30 AM',
      author: 'You',
      changeType: 'manual',
      changeDescription: 'Added missing paragraphs',
      wordCount: 12435,
      isCurrent: false,
    },
    {
      id: '6',
      versionNumber: 'v1.0',
      date: 'Jan 18, 2026',
      time: '10:00 AM',
      author: 'System',
      changeType: 'auto',
      changeDescription: 'Initial transcription',
      wordCount: 12420,
      isCurrent: false,
    },
  ];

  const getChangeIcon = (type: string): string => {
    switch (type) {
      case 'ai':
        return 'sparkles';
      case 'manual':
        return 'create';
      default:
        return 'save';
    }
  };

  const getChangeColor = (type: string): string => {
    switch (type) {
      case 'ai':
        return '#AF52DE';
      case 'manual':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const toggleCompareVersion = (id: string) => {
    if (compareVersions.includes(id)) {
      setCompareVersions(prev => prev.filter(v => v !== id));
    } else if (compareVersions.length < 2) {
      setCompareVersions(prev => [...prev, id]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Version History</Text>
        <TouchableOpacity
          style={[styles.compareToggle, compareMode && styles.compareToggleActive]}
          onPress={() => {
            setCompareMode(!compareMode);
            setCompareVersions([]);
          }}
        >
          <Text style={[styles.compareText, compareMode && styles.compareTextActive]}>Compare</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.documentInfo}>
        <Ionicons name="document-text" size={24} color="#007AFF" />
        <View style={styles.docDetails}>
          <Text style={styles.docTitle}>Team Standup Meeting</Text>
          <Text style={styles.docMeta}>{versions.length} versions • Last edited 2 hours ago</Text>
        </View>
      </View>

      {compareMode && compareVersions.length === 2 && (
        <TouchableOpacity style={styles.compareButton}>
          <Ionicons name="git-compare" size={20} color="#FFF" />
          <Text style={styles.compareButtonText}>Compare Selected Versions</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.timeline}>
          {versions.map((version, index) => (
            <TouchableOpacity
              key={version.id}
              style={[
                styles.versionCard,
                selectedVersion === version.id && styles.versionCardSelected,
                compareMode && compareVersions.includes(version.id) && styles.versionCardCompare,
              ]}
              onPress={() => {
                if (compareMode) {
                  toggleCompareVersion(version.id);
                } else {
                  setSelectedVersion(selectedVersion === version.id ? null : version.id);
                }
              }}
            >
              <View style={styles.timelineConnector}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: getChangeColor(version.changeType) },
                  ]}
                >
                  {compareMode && compareVersions.includes(version.id) && (
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  )}
                </View>
                {index < versions.length - 1 && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.versionContent}>
                <View style={styles.versionHeader}>
                  <View style={styles.versionInfo}>
                    <Text style={styles.versionNumber}>{version.versionNumber}</Text>
                    {version.isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentText}>Current</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.versionTime}>{version.time}</Text>
                </View>

                <Text style={styles.versionDescription}>{version.changeDescription}</Text>

                <View style={styles.versionMeta}>
                  <View style={styles.authorBadge}>
                    <Ionicons
                      name={getChangeIcon(version.changeType) as any}
                      size={12}
                      color={getChangeColor(version.changeType)}
                    />
                    <Text
                      style={[styles.authorText, { color: getChangeColor(version.changeType) }]}
                    >
                      {version.author}
                    </Text>
                  </View>
                  <Text style={styles.wordCount}>{version.wordCount.toLocaleString()} words</Text>
                </View>

                {selectedVersion === version.id && !compareMode && (
                  <View style={styles.versionActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="eye" size={16} color="#007AFF" />
                      <Text style={styles.actionText}>Preview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="download" size={16} color="#34C759" />
                      <Text style={styles.actionText}>Download</Text>
                    </TouchableOpacity>
                    {!version.isCurrent && (
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="refresh" size={16} color="#FF9500" />
                        <Text style={styles.actionText}>Restore</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.storageInfo}>
          <Ionicons name="time" size={18} color="#8E8E93" />
          <Text style={styles.storageText}>Versions kept for 30 days</Text>
        </View>
        <TouchableOpacity style={styles.settingsLink}>
          <Text style={styles.settingsText}>Settings</Text>
          <Ionicons name="chevron-forward" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>
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
  compareToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
  },
  compareToggleActive: { backgroundColor: '#007AFF' },
  compareText: { fontSize: 14, fontWeight: '500', color: '#007AFF' },
  compareTextActive: { color: '#FFF' },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  docDetails: { marginLeft: 12 },
  docTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  docMeta: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 14,
    borderRadius: 12,
  },
  compareButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF', marginLeft: 8 },
  content: { flex: 1 },
  timeline: { padding: 16 },
  versionCard: { flexDirection: 'row', marginBottom: 4 },
  versionCardSelected: {},
  versionCardCompare: {},
  timelineConnector: { width: 24, alignItems: 'center' },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E5E5EA', marginTop: 4 },
  versionContent: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginLeft: 12,
    marginBottom: 8,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionInfo: { flexDirection: 'row', alignItems: 'center' },
  versionNumber: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  currentBadge: {
    backgroundColor: '#34C75920',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  currentText: { fontSize: 11, fontWeight: '600', color: '#34C759' },
  versionTime: { fontSize: 13, color: '#8E8E93' },
  versionDescription: { fontSize: 14, color: '#3C3C43', marginBottom: 10 },
  versionMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorBadge: { flexDirection: 'row', alignItems: 'center' },
  authorText: { fontSize: 12, fontWeight: '500', marginLeft: 4 },
  wordCount: { fontSize: 12, color: '#8E8E93' },
  versionActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  actionText: { fontSize: 13, color: '#007AFF', marginLeft: 4 },
  bottomPadding: { height: 20 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  storageInfo: { flexDirection: 'row', alignItems: 'center' },
  storageText: { fontSize: 13, color: '#8E8E93', marginLeft: 8 },
  settingsLink: { flexDirection: 'row', alignItems: 'center' },
  settingsText: { fontSize: 14, color: '#007AFF', marginRight: 4 },
});

export default TranscriptVersionHistoryScreen;
