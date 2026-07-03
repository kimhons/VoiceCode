import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface SentimentSegment {
  id: string;
  speaker: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  timestamp: string;
}

const SentimentAnalysisScreen: React.FC = () => {
  const [selectedView, setSelectedView] = useState('timeline');

  const overallSentiment = {
    positive: 62,
    neutral: 28,
    negative: 10,
  };

  const speakerSentiments = [
    { name: 'John Smith', positive: 75, neutral: 20, negative: 5, avatar: 'JS' },
    { name: 'Sarah Wilson', positive: 55, neutral: 35, negative: 10, avatar: 'SW' },
    { name: 'Mike Johnson', positive: 45, neutral: 30, negative: 25, avatar: 'MJ' },
  ];

  const segments: SentimentSegment[] = [
    {
      id: '1',
      speaker: 'John Smith',
      text: 'Great progress on the project! The team has done excellent work.',
      sentiment: 'positive',
      confidence: 92,
      timestamp: '0:15',
    },
    {
      id: '2',
      speaker: 'Sarah Wilson',
      text: 'I have some concerns about the timeline though.',
      sentiment: 'negative',
      confidence: 78,
      timestamp: '1:23',
    },
    {
      id: '3',
      speaker: 'Mike Johnson',
      text: 'Let me review the current status of deliverables.',
      sentiment: 'neutral',
      confidence: 85,
      timestamp: '2:45',
    },
    {
      id: '4',
      speaker: 'John Smith',
      text: 'Absolutely, this is a fantastic milestone for us.',
      sentiment: 'positive',
      confidence: 95,
      timestamp: '4:12',
    },
    {
      id: '5',
      speaker: 'Sarah Wilson',
      text: 'The client feedback has been very encouraging.',
      sentiment: 'positive',
      confidence: 88,
      timestamp: '5:30',
    },
  ];

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return '#34C759';
      case 'neutral':
        return '#FF9500';
      case 'negative':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getSentimentIcon = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return 'happy';
      case 'neutral':
        return 'remove';
      case 'negative':
        return 'sad';
      default:
        return 'ellipse';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Sentiment Analysis</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="share-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.recordingInfo}>
        <Text style={styles.recordingName}>Team Meeting Recording</Text>
        <Text style={styles.recordingMeta}>Jan 18, 2026 • 45:23</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Overall Sentiment</Text>
          <View style={styles.sentimentBar}>
            <View
              style={[
                styles.sentimentSegment,
                { width: `${overallSentiment.positive}%`, backgroundColor: '#34C759' },
              ]}
            />
            <View
              style={[
                styles.sentimentSegment,
                { width: `${overallSentiment.neutral}%`, backgroundColor: '#FF9500' },
              ]}
            />
            <View
              style={[
                styles.sentimentSegment,
                { width: `${overallSentiment.negative}%`, backgroundColor: '#FF3B30' },
              ]}
            />
          </View>
          <View style={styles.sentimentLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.legendLabel}>Positive</Text>
              <Text style={styles.legendValue}>{overallSentiment.positive}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendLabel}>Neutral</Text>
              <Text style={styles.legendValue}>{overallSentiment.neutral}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.legendLabel}>Negative</Text>
              <Text style={styles.legendValue}>{overallSentiment.negative}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Speaker</Text>
          {speakerSentiments.map((speaker, idx) => (
            <View key={idx} style={styles.speakerCard}>
              <View style={styles.speakerHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{speaker.avatar}</Text>
                </View>
                <Text style={styles.speakerName}>{speaker.name}</Text>
              </View>
              <View style={styles.speakerBar}>
                <View
                  style={[
                    styles.sentimentSegment,
                    { width: `${speaker.positive}%`, backgroundColor: '#34C759' },
                  ]}
                />
                <View
                  style={[
                    styles.sentimentSegment,
                    { width: `${speaker.neutral}%`, backgroundColor: '#FF9500' },
                  ]}
                />
                <View
                  style={[
                    styles.sentimentSegment,
                    { width: `${speaker.negative}%`, backgroundColor: '#FF3B30' },
                  ]}
                />
              </View>
              <View style={styles.speakerStats}>
                <Text style={[styles.speakerStatText, { color: '#34C759' }]}>
                  {speaker.positive}%
                </Text>
                <Text style={[styles.speakerStatText, { color: '#FF9500' }]}>
                  {speaker.neutral}%
                </Text>
                <Text style={[styles.speakerStatText, { color: '#FF3B30' }]}>
                  {speaker.negative}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedView === 'timeline' && styles.toggleButtonActive,
                ]}
                onPress={() => setSelectedView('timeline')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    selectedView === 'timeline' && styles.toggleTextActive,
                  ]}
                >
                  Timeline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, selectedView === 'list' && styles.toggleButtonActive]}
                onPress={() => setSelectedView('list')}
              >
                <Text
                  style={[styles.toggleText, selectedView === 'list' && styles.toggleTextActive]}
                >
                  List
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {segments.map(segment => (
            <TouchableOpacity key={segment.id} style={styles.segmentCard}>
              <View style={styles.segmentLeft}>
                <Text style={styles.timestamp}>{segment.timestamp}</Text>
                <View
                  style={[
                    styles.sentimentIndicator,
                    { backgroundColor: getSentimentColor(segment.sentiment) },
                  ]}
                >
                  <Ionicons
                    name={getSentimentIcon(segment.sentiment) as any}
                    size={14}
                    color="#FFF"
                  />
                </View>
              </View>
              <View style={styles.segmentContent}>
                <Text style={styles.segmentSpeaker}>{segment.speaker}</Text>
                <Text style={styles.segmentText}>{segment.text}</Text>
                <View style={styles.segmentMeta}>
                  <View
                    style={[
                      styles.confidenceBadge,
                      { backgroundColor: getSentimentColor(segment.sentiment) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.confidenceText,
                        { color: getSentimentColor(segment.sentiment) },
                      ]}
                    >
                      {segment.confidence}% confidence
                    </Text>
                  </View>
                </View>
              </View>
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
  exportButton: { padding: 4 },
  recordingInfo: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  recordingName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  recordingMeta: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  content: { flex: 1 },
  overviewCard: { backgroundColor: '#FFF', margin: 16, borderRadius: 16, padding: 20 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 16 },
  sentimentBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  sentimentSegment: { height: '100%' },
  sentimentLegend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  legendItem: { alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  legendLabel: { fontSize: 12, color: '#8E8E93' },
  legendValue: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginTop: 2 },
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
  viewToggle: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 8, padding: 2 },
  toggleButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  toggleButtonActive: { backgroundColor: '#FFF' },
  toggleText: { fontSize: 13, color: '#8E8E93' },
  toggleTextActive: { color: '#1C1C1E', fontWeight: '500' },
  speakerCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 8 },
  speakerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  speakerName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  speakerBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  speakerStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  speakerStatText: { fontSize: 12, fontWeight: '600' },
  segmentCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  segmentLeft: { alignItems: 'center', marginRight: 12 },
  timestamp: { fontSize: 11, color: '#8E8E93', marginBottom: 6 },
  sentimentIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentContent: { flex: 1 },
  segmentSpeaker: { fontSize: 13, fontWeight: '600', color: '#007AFF' },
  segmentText: { fontSize: 14, color: '#1C1C1E', marginTop: 4, lineHeight: 20 },
  segmentMeta: { flexDirection: 'row', marginTop: 8 },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  confidenceText: { fontSize: 11, fontWeight: '500' },
  bottomPadding: { height: 40 },
});

export default SentimentAnalysisScreen;
