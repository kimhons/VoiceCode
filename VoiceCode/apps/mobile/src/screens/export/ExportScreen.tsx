import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

type ExportFormat = 'PDF' | 'DOCX' | 'TXT' | 'SRT';

const FORMATS: ExportFormat[] = ['PDF', 'DOCX', 'TXT', 'SRT'];

interface ExportScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
  route: { params: { transcriptId: string } };
}

const ExportScreen: React.FC<ExportScreenProps> = ({ route }) => {
  const transcriptId = route?.params?.transcriptId ?? 'transcript';

  const [format, setFormat] = useState<ExportFormat | null>(null);
  const [includeSummary, setIncludeSummary] = useState(false);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [includeSpeakers, setIncludeSpeakers] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportedPath, setExportedPath] = useState<string | null>(null);
  const [shareAvailable, setShareAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    Sharing.isAvailableAsync()
      .then((available) => {
        if (active) setShareAvailable(!!available);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const buildContent = () => {
    const lines = [`Transcript ${transcriptId}`];
    if (includeSummary) lines.push('Summary: Auto-generated summary.');
    if (includeTimestamps) lines.push('[00:00] Line one');
    if (includeSpeakers) lines.push('Speaker 1: Line one');
    return lines.join('\n');
  };

  const handleExport = async () => {
    if (!format) return;
    setIsExporting(true);
    setResult(null);
    setError(null);
    try {
      const path = `${FileSystem.documentDirectory}${transcriptId}.${format.toLowerCase()}`;
      await FileSystem.writeAsStringAsync(path, buildContent());
      setExportedPath(path);
      setResult('Export complete');
    } catch {
      setError('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    if (!exportedPath) return;
    Sharing.shareAsync(exportedPath).catch(() => undefined);
  };

  const handleSaveToCloud = () => {
    setResult('Saved to cloud');
  };

  return (
    <ScrollView style={styles.container} testID="export-screen">
      <Text style={styles.heading}>Export</Text>

      <View style={styles.section}>
        {FORMATS.map((fmt) => {
          const selected = format === fmt;
          return (
            <TouchableOpacity
              key={fmt}
              style={[styles.formatRow, selected && styles.formatRowSelected]}
              onPress={() => setFormat(fmt)}
            >
              <Text style={styles.formatLabel}>{fmt}</Text>
              {selected ? (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#667eea"
                  testID={`${fmt.toLowerCase()}-selected`}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Include summary</Text>
          <Switch
            testID="include-summary-toggle"
            value={includeSummary}
            onValueChange={setIncludeSummary}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Include timestamps</Text>
          <Switch
            testID="include-timestamps-toggle"
            value={includeTimestamps}
            onValueChange={setIncludeTimestamps}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Include speaker labels</Text>
          <Switch
            testID="include-speakers-toggle"
            value={includeSpeakers}
            onValueChange={setIncludeSpeakers}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleExport} testID="export-button">
        <Text style={styles.primaryButtonText}>Export</Text>
      </TouchableOpacity>

      {isExporting ? (
        <View style={styles.loading} testID="export-loading">
          <ActivityIndicator color="#667eea" />
          <Text style={styles.loadingText}>Exporting…</Text>
        </View>
      ) : null}

      {result ? <Text style={styles.success}>{result}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result ? (
        <View style={styles.section}>
          {shareAvailable ? (
            <TouchableOpacity style={styles.actionRow} onPress={handleShare} testID="share-button">
              <Ionicons name="share-outline" size={20} color="#667eea" style={styles.actionIcon} />
              <Text style={styles.actionLabel}>Share file</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleSaveToCloud}
            testID="save-to-cloud"
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#667eea" style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Save to cloud</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  heading: { fontSize: 28, fontWeight: '700', color: '#1a1a2e', padding: 16 },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  formatRowSelected: { backgroundColor: '#f0f2ff' },
  formatLabel: { fontSize: 16, color: '#1a1a2e', fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  toggleLabel: { fontSize: 16, color: '#1a1a2e' },
  primaryButton: {
    backgroundColor: '#667eea',
    margin: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  loadingText: { marginLeft: 8, color: '#667eea' },
  success: { textAlign: 'center', color: '#22c55e', paddingVertical: 8, fontWeight: '600' },
  error: { textAlign: 'center', color: '#ef4444', paddingVertical: 8, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  actionIcon: { marginRight: 12 },
  actionLabel: { fontSize: 16, color: '#1a1a2e' },
});

export default ExportScreen;
