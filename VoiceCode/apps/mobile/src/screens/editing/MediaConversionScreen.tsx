import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ConversionFormat {
  id: string;
  name: string;
  extension: string;
  type: 'audio' | 'video';
  quality: string;
}

const MediaConversionScreen: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState('mp3');
  const [selectedQuality, setSelectedQuality] = useState('high');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioFormats: ConversionFormat[] = [
    {
      id: 'mp3',
      name: 'MP3',
      extension: '.mp3',
      type: 'audio',
      quality: 'Lossy, widely compatible',
    },
    { id: 'wav', name: 'WAV', extension: '.wav', type: 'audio', quality: 'Lossless, large files' },
    {
      id: 'aac',
      name: 'AAC',
      extension: '.aac',
      type: 'audio',
      quality: 'Better than MP3 at same bitrate',
    },
    {
      id: 'flac',
      name: 'FLAC',
      extension: '.flac',
      type: 'audio',
      quality: 'Lossless compression',
    },
    {
      id: 'ogg',
      name: 'OGG',
      extension: '.ogg',
      type: 'audio',
      quality: 'Open source, good quality',
    },
  ];

  const videoFormats: ConversionFormat[] = [
    {
      id: 'mp4',
      name: 'MP4',
      extension: '.mp4',
      type: 'video',
      quality: 'Universal compatibility',
    },
    { id: 'webm', name: 'WebM', extension: '.webm', type: 'video', quality: 'Web optimized' },
    { id: 'mov', name: 'MOV', extension: '.mov', type: 'video', quality: 'Apple devices' },
    { id: 'avi', name: 'AVI', extension: '.avi', type: 'video', quality: 'Windows compatible' },
  ];

  const qualityOptions = [
    { id: 'low', label: 'Low', description: 'Smaller file, reduced quality', bitrate: '64 kbps' },
    {
      id: 'medium',
      label: 'Medium',
      description: 'Balanced size and quality',
      bitrate: '128 kbps',
    },
    { id: 'high', label: 'High', description: 'Best quality, larger file', bitrate: '320 kbps' },
  ];

  const sourceFile = {
    name: 'Team Meeting Recording',
    format: 'WAV',
    size: '156.4 MB',
    duration: '45:32',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Convert Media</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sourceCard}>
          <View style={styles.sourceIcon}>
            <Ionicons name="document" size={28} color="#007AFF" />
          </View>
          <View style={styles.sourceInfo}>
            <Text style={styles.sourceName}>{sourceFile.name}</Text>
            <View style={styles.sourceMeta}>
              <Text style={styles.sourceFormat}>{sourceFile.format}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.sourceSize}>{sourceFile.size}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.sourceDuration}>{sourceFile.duration}</Text>
            </View>
          </View>
        </View>

        <View style={styles.conversionArrow}>
          <View style={styles.arrowLine} />
          <View style={styles.arrowIcon}>
            <Ionicons name="arrow-down" size={20} color="#007AFF" />
          </View>
          <View style={styles.arrowLine} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Formats</Text>
          <View style={styles.formatsGrid}>
            {audioFormats.map(format => (
              <TouchableOpacity
                key={format.id}
                style={[
                  styles.formatCard,
                  selectedFormat === format.id && styles.formatCardSelected,
                ]}
                onPress={() => setSelectedFormat(format.id)}
              >
                <View style={styles.formatHeader}>
                  <Text
                    style={[
                      styles.formatName,
                      selectedFormat === format.id && styles.formatNameSelected,
                    ]}
                  >
                    {format.name}
                  </Text>
                  {selectedFormat === format.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  )}
                </View>
                <Text style={styles.formatExt}>{format.extension}</Text>
                <Text style={styles.formatQuality}>{format.quality}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Formats</Text>
          <View style={styles.formatsGrid}>
            {videoFormats.map(format => (
              <TouchableOpacity
                key={format.id}
                style={[
                  styles.formatCard,
                  selectedFormat === format.id && styles.formatCardSelected,
                ]}
                onPress={() => setSelectedFormat(format.id)}
              >
                <View style={styles.formatHeader}>
                  <Text
                    style={[
                      styles.formatName,
                      selectedFormat === format.id && styles.formatNameSelected,
                    ]}
                  >
                    {format.name}
                  </Text>
                  {selectedFormat === format.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  )}
                </View>
                <Text style={styles.formatExt}>{format.extension}</Text>
                <Text style={styles.formatQuality}>{format.quality}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quality</Text>
          <View style={styles.qualityCard}>
            {qualityOptions.map((option, idx) => (
              <View key={option.id}>
                <TouchableOpacity
                  style={styles.qualityOption}
                  onPress={() => setSelectedQuality(option.id)}
                >
                  <View style={styles.qualityRadio}>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedQuality === option.id && styles.radioOuterSelected,
                      ]}
                    >
                      {selectedQuality === option.id && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <View style={styles.qualityInfo}>
                    <Text style={styles.qualityLabel}>{option.label}</Text>
                    <Text style={styles.qualityDesc}>{option.description}</Text>
                  </View>
                  <Text style={styles.qualityBitrate}>{option.bitrate}</Text>
                </TouchableOpacity>
                {idx < qualityOptions.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.outputPreview}>
          <Text style={styles.previewTitle}>Output Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Format</Text>
              <Text style={styles.previewValue}>{selectedFormat.toUpperCase()}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Quality</Text>
              <Text style={styles.previewValue}>
                {qualityOptions.find(q => q.id === selectedQuality)?.bitrate}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Est. Size</Text>
              <Text style={styles.previewValue}>~12.4 MB</Text>
            </View>
          </View>
        </View>

        {isConverting && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Converting...</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.convertButton} onPress={() => setIsConverting(true)}>
          <Ionicons name="swap-horizontal" size={20} color="#FFF" />
          <Text style={styles.convertText}>Convert to {selectedFormat.toUpperCase()}</Text>
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
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 14,
    padding: 16,
  },
  sourceIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sourceInfo: { flex: 1 },
  sourceName: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  sourceMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  sourceFormat: { fontSize: 13, fontWeight: '500', color: '#007AFF' },
  metaDot: { marginHorizontal: 6, color: '#8E8E93' },
  sourceSize: { fontSize: 13, color: '#8E8E93' },
  sourceDuration: { fontSize: 13, color: '#8E8E93' },
  conversionArrow: { alignItems: 'center', marginVertical: 8 },
  arrowLine: { width: 2, height: 20, backgroundColor: '#E5E5EA' },
  arrowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formatsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  formatCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    margin: '1%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatCardSelected: { borderColor: '#007AFF', backgroundColor: '#007AFF08' },
  formatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  formatName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  formatNameSelected: { color: '#007AFF' },
  formatExt: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  formatQuality: { fontSize: 11, color: '#8E8E93' },
  qualityCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  qualityOption: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  qualityRadio: { marginRight: 12 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: { borderColor: '#007AFF' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#007AFF' },
  qualityInfo: { flex: 1 },
  qualityLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  qualityDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  qualityBitrate: { fontSize: 13, color: '#8E8E93' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  outputPreview: { paddingHorizontal: 16, marginBottom: 20 },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  previewLabel: { fontSize: 14, color: '#8E8E93' },
  previewValue: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  progressSection: { paddingHorizontal: 16, marginBottom: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, color: '#1C1C1E' },
  progressPercent: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  progressBar: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 4 },
  bottomPadding: { height: 100 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 14,
  },
  convertText: { fontSize: 17, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});

export default MediaConversionScreen;
