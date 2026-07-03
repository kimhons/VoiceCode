import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface StorageItem {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  type: 'recordings' | 'transcripts' | 'exports' | 'cache' | 'other';
  color: string;
}

const StorageAnalyticsScreen: React.FC = () => {
  const totalStorage = 50; // GB
  const usedStorage = 32.4; // GB
  const usedPercentage = (usedStorage / totalStorage) * 100;

  const storageBreakdown: StorageItem[] = [
    {
      id: '1',
      name: 'Audio Recordings',
      size: '18.5 GB',
      sizeBytes: 18500,
      type: 'recordings',
      color: '#007AFF',
    },
    {
      id: '2',
      name: 'Video Recordings',
      size: '8.2 GB',
      sizeBytes: 8200,
      type: 'recordings',
      color: '#5856D6',
    },
    {
      id: '3',
      name: 'Transcripts',
      size: '2.1 GB',
      sizeBytes: 2100,
      type: 'transcripts',
      color: '#34C759',
    },
    {
      id: '4',
      name: 'Exports',
      size: '1.8 GB',
      sizeBytes: 1800,
      type: 'exports',
      color: '#FF9500',
    },
    { id: '5', name: 'Cache', size: '1.4 GB', sizeBytes: 1400, type: 'cache', color: '#FF3B30' },
    { id: '6', name: 'Other', size: '0.4 GB', sizeBytes: 400, type: 'other', color: '#8E8E93' },
  ];

  const largestFiles = [
    { name: 'Q4 All Hands Meeting', size: '856 MB', date: 'Dec 15, 2025', type: 'video' },
    { name: 'Annual Strategy Session', size: '645 MB', date: 'Jan 5, 2026', type: 'video' },
    { name: 'Client Presentation Recording', size: '423 MB', date: 'Jan 10, 2026', type: 'audio' },
    { name: 'Training Workshop', size: '398 MB', date: 'Dec 20, 2025', type: 'video' },
  ];

  const cleanupSuggestions = [
    { title: 'Old recordings (>90 days)', size: '4.2 GB', count: 45, icon: 'time' },
    { title: 'Duplicate files', size: '1.8 GB', count: 12, icon: 'copy' },
    { title: 'Unused exports', size: '0.9 GB', count: 23, icon: 'document' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Storage</Text>
        <TouchableOpacity style={styles.manageButton}>
          <Text style={styles.manageText}>Manage</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.storageCard}>
          <View style={styles.storageCircle}>
            <View style={styles.circleContent}>
              <Text style={styles.usedValue}>{usedStorage}</Text>
              <Text style={styles.usedUnit}>GB</Text>
            </View>
            <Text style={styles.totalText}>of {totalStorage} GB used</Text>
          </View>

          <View style={styles.storageBar}>
            {storageBreakdown.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.storageSegment,
                  {
                    width: `${(item.sizeBytes / (usedStorage * 1000)) * 100}%`,
                    backgroundColor: item.color,
                    borderTopLeftRadius: idx === 0 ? 4 : 0,
                    borderBottomLeftRadius: idx === 0 ? 4 : 0,
                    borderTopRightRadius: idx === storageBreakdown.length - 1 ? 4 : 0,
                    borderBottomRightRadius: idx === storageBreakdown.length - 1 ? 4 : 0,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.storageAvailable}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.availableText}>
              {(totalStorage - usedStorage).toFixed(1)} GB available
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Breakdown</Text>
          {storageBreakdown.map(item => (
            <TouchableOpacity key={item.id} style={styles.breakdownCard}>
              <View style={[styles.breakdownIcon, { backgroundColor: item.color + '20' }]}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              </View>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownName}>{item.name}</Text>
                <View style={styles.breakdownBar}>
                  <View
                    style={[
                      styles.breakdownFill,
                      {
                        width: `${(item.sizeBytes / (usedStorage * 1000)) * 100}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.breakdownSize}>{item.size}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cleanup Suggestions</Text>
          <View style={styles.cleanupCard}>
            {cleanupSuggestions.map((suggestion, idx) => (
              <View key={idx}>
                <View style={styles.cleanupRow}>
                  <View style={styles.cleanupIcon}>
                    <Ionicons name={suggestion.icon as any} size={20} color="#FF9500" />
                  </View>
                  <View style={styles.cleanupInfo}>
                    <Text style={styles.cleanupTitle}>{suggestion.title}</Text>
                    <Text style={styles.cleanupMeta}>
                      {suggestion.count} items • {suggestion.size}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.cleanupButton}>
                    <Text style={styles.cleanupButtonText}>Clean</Text>
                  </TouchableOpacity>
                </View>
                {idx < cleanupSuggestions.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
          <View style={styles.savingsCard}>
            <Ionicons name="sparkles" size={20} color="#34C759" />
            <Text style={styles.savingsText}>Clean all to save 6.9 GB</Text>
            <TouchableOpacity style={styles.cleanAllButton}>
              <Text style={styles.cleanAllText}>Clean All</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Largest Files</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {largestFiles.map((file, idx) => (
            <TouchableOpacity key={idx} style={styles.fileCard}>
              <View style={styles.fileIcon}>
                <Ionicons
                  name={file.type === 'video' ? 'videocam' : 'mic'}
                  size={20}
                  color={file.type === 'video' ? '#5856D6' : '#007AFF'}
                />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{file.name}</Text>
                <Text style={styles.fileDate}>{file.date}</Text>
              </View>
              <Text style={styles.fileSize}>{file.size}</Text>
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
  manageButton: { padding: 4 },
  manageText: { fontSize: 17, color: '#007AFF' },
  content: { flex: 1 },
  storageCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  storageCircle: { alignItems: 'center', marginBottom: 20 },
  circleContent: { flexDirection: 'row', alignItems: 'baseline' },
  usedValue: { fontSize: 48, fontWeight: '700', color: '#1C1C1E' },
  usedUnit: { fontSize: 24, fontWeight: '600', color: '#8E8E93', marginLeft: 4 },
  totalText: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  storageBar: {
    flexDirection: 'row',
    width: '100%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
    marginBottom: 16,
  },
  storageSegment: { height: '100%' },
  storageAvailable: { flexDirection: 'row', alignItems: 'center' },
  availableText: { fontSize: 14, color: '#34C759', marginLeft: 6 },
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
  breakdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  breakdownIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  breakdownInfo: { flex: 1 },
  breakdownName: { fontSize: 14, fontWeight: '500', color: '#1C1C1E', marginBottom: 6 },
  breakdownBar: { height: 4, backgroundColor: '#F2F2F7', borderRadius: 2 },
  breakdownFill: { height: '100%', borderRadius: 2 },
  breakdownSize: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginLeft: 12 },
  cleanupCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  cleanupRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  cleanupIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FF950020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cleanupInfo: { flex: 1 },
  cleanupTitle: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  cleanupMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  cleanupButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#FF950020',
    borderRadius: 14,
  },
  cleanupButtonText: { fontSize: 13, fontWeight: '600', color: '#FF9500' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C75915',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  savingsText: { flex: 1, fontSize: 14, color: '#34C759', fontWeight: '500', marginLeft: 10 },
  cleanAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#34C759',
    borderRadius: 16,
  },
  cleanAllText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  fileDate: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  fileSize: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  bottomPadding: { height: 40 },
});

export default StorageAnalyticsScreen;
