import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  icon: string;
  description: string;
}

interface ShareDestination {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
}

const ExportShareScreen: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState('docx');
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [includeSpeakerLabels, setIncludeSpeakerLabels] = useState(true);
  const [includeHighlights, setIncludeHighlights] = useState(true);
  const [includeAudio, setIncludeAudio] = useState(false);

  const exportFormats: ExportFormat[] = [
    {
      id: 'docx',
      name: 'Word',
      extension: '.docx',
      icon: 'document',
      description: 'Microsoft Word document',
    },
    {
      id: 'pdf',
      name: 'PDF',
      extension: '.pdf',
      icon: 'document-text',
      description: 'Portable Document Format',
    },
    { id: 'txt', name: 'Text', extension: '.txt', icon: 'text', description: 'Plain text file' },
    {
      id: 'srt',
      name: 'Subtitles',
      extension: '.srt',
      icon: 'closed-captioning',
      description: 'Subtitle file format',
    },
    {
      id: 'json',
      name: 'JSON',
      extension: '.json',
      icon: 'code',
      description: 'Structured data format',
    },
    {
      id: 'csv',
      name: 'CSV',
      extension: '.csv',
      icon: 'grid',
      description: 'Spreadsheet compatible',
    },
  ];

  const shareDestinations: ShareDestination[] = [
    { id: 'email', name: 'Email', icon: 'mail', color: '#007AFF', connected: true },
    { id: 'slack', name: 'Slack', icon: 'chatbubbles', color: '#4A154B', connected: true },
    { id: 'drive', name: 'Google Drive', icon: 'logo-google', color: '#4285F4', connected: true },
    { id: 'dropbox', name: 'Dropbox', icon: 'cloud', color: '#0061FF', connected: false },
    { id: 'notion', name: 'Notion', icon: 'document', color: '#000000', connected: true },
    { id: 'teams', name: 'MS Teams', icon: 'people', color: '#6264A7', connected: false },
  ];

  const recentShares = [
    { name: 'john@company.com', type: 'email', date: 'Yesterday' },
    { name: '#product-team', type: 'slack', date: '2 days ago' },
    { name: 'Project Docs', type: 'drive', date: 'Last week' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Export & Share</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.recordingPreview}>
          <View style={styles.previewIcon}>
            <Ionicons name="document-text" size={28} color="#007AFF" />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle}>Team Standup Meeting</Text>
            <Text style={styles.previewMeta}>Jan 18, 2026 • 45:32 • 12,450 words</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          <View style={styles.formatsGrid}>
            {exportFormats.map(format => (
              <TouchableOpacity
                key={format.id}
                style={[styles.formatCard, selectedFormat === format.id && styles.formatCardActive]}
                onPress={() => setSelectedFormat(format.id)}
              >
                <Ionicons
                  name={format.icon as any}
                  size={24}
                  color={selectedFormat === format.id ? '#007AFF' : '#8E8E93'}
                />
                <Text
                  style={[
                    styles.formatName,
                    selectedFormat === format.id && styles.formatNameActive,
                  ]}
                >
                  {format.name}
                </Text>
                <Text style={styles.formatExt}>{format.extension}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Options</Text>
          <View style={styles.optionsCard}>
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Ionicons name="time" size={20} color="#007AFF" />
                <Text style={styles.optionLabel}>Include Timestamps</Text>
              </View>
              <Switch
                value={includeTimestamps}
                onValueChange={setIncludeTimestamps}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Ionicons name="people" size={20} color="#FF9500" />
                <Text style={styles.optionLabel}>Include Speaker Labels</Text>
              </View>
              <Switch
                value={includeSpeakerLabels}
                onValueChange={setIncludeSpeakerLabels}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Ionicons name="color-wand" size={20} color="#AF52DE" />
                <Text style={styles.optionLabel}>Include Highlights</Text>
              </View>
              <Switch
                value={includeHighlights}
                onValueChange={setIncludeHighlights}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Ionicons name="musical-note" size={20} color="#FF3B30" />
                <Text style={styles.optionLabel}>Include Audio File</Text>
              </View>
              <Switch
                value={includeAudio}
                onValueChange={setIncludeAudio}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share To</Text>
          <View style={styles.destinationsGrid}>
            {shareDestinations.map(dest => (
              <TouchableOpacity key={dest.id} style={styles.destCard}>
                <View style={[styles.destIcon, { backgroundColor: dest.color + '20' }]}>
                  <Ionicons name={dest.icon as any} size={22} color={dest.color} />
                </View>
                <Text style={styles.destName}>{dest.name}</Text>
                {!dest.connected && (
                  <View style={styles.connectBadge}>
                    <Text style={styles.connectText}>Connect</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Shares</Text>
          {recentShares.map((share, idx) => (
            <TouchableOpacity key={idx} style={styles.recentCard}>
              <Ionicons
                name={
                  share.type === 'email'
                    ? 'mail'
                    : share.type === 'slack'
                      ? 'chatbubbles'
                      : 'folder'
                }
                size={18}
                color="#8E8E93"
              />
              <Text style={styles.recentName}>{share.name}</Text>
              <Text style={styles.recentDate}>{share.date}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.downloadButton}>
          <Ionicons name="download" size={20} color="#007AFF" />
          <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share" size={20} color="#FFF" />
          <Text style={styles.shareText}>Share</Text>
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
  placeholder: { width: 32 },
  content: { flex: 1 },
  recordingPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  previewInfo: { flex: 1 },
  previewTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  previewMeta: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  formatsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  formatCard: {
    width: '31%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    margin: '1%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatCardActive: { borderColor: '#007AFF', backgroundColor: '#007AFF08' },
  formatName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginTop: 8 },
  formatNameActive: { color: '#007AFF' },
  formatExt: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  optionsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  optionInfo: { flexDirection: 'row', alignItems: 'center' },
  optionLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  destinationsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  destCard: {
    width: '31%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    margin: '1%',
    alignItems: 'center',
  },
  destIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  destName: { fontSize: 13, fontWeight: '500', color: '#1C1C1E' },
  connectBadge: {
    backgroundColor: '#007AFF15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  connectText: { fontSize: 10, fontWeight: '600', color: '#007AFF' },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  recentName: { flex: 1, fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  recentDate: { fontSize: 13, color: '#8E8E93' },
  bottomPadding: { height: 100 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginRight: 10,
  },
  downloadText: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 8 },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});

export default ExportShareScreen;
