// VoiceCode Mobile - Live Transcription View
// Real-time transcription display with confidence indicators

import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { StreamingTranscript } from '../../services/WebSocketStreamingService';

export interface LiveTranscriptionViewProps {
  transcripts: StreamingTranscript[];
  isStreaming: boolean;
  autoScroll?: boolean;
  showConfidence?: boolean;
  showTimestamps?: boolean;
}

export const LiveTranscriptionView: React.FC<LiveTranscriptionViewProps> = ({
  transcripts,
  isStreaming,
  autoScroll = true,
  showConfidence = true,
  showTimestamps = false,
}) => {
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (autoScroll && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [transcripts, autoScroll]);

  // Fade in animation for new transcripts
  useEffect(() => {
    if (transcripts.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [transcripts.length, fadeAnim]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return theme.colors.success;
    if (confidence >= 0.7) return theme.colors.warning;
    return theme.colors.error;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: isStreaming
                  ? theme.colors.success
                  : theme.colors.textTertiary,
              },
            ]}
          />
          <Text style={[styles.headerText, { color: theme.colors.textPrimary }]}>
            {isStreaming ? 'Live Transcription' : 'Transcription Paused'}
          </Text>
        </View>
        {transcripts.length > 0 && (
          <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
            {transcripts.length} segments
          </Text>
        )}
      </View>

      {/* Transcription Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {transcripts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
              {isStreaming
                ? 'Listening... Start speaking to see transcription'
                : 'No transcription yet'}
            </Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {transcripts.map((transcript, index) => (
              <View
                key={`${transcript.timestamp}-${index}`}
                style={[
                  styles.transcriptItem,
                  {
                    backgroundColor: transcript.isFinal
                      ? 'transparent'
                      : theme.colors.surfaceVariant,
                    borderLeftColor: transcript.isFinal
                      ? theme.colors.primary
                      : theme.colors.textTertiary,
                  },
                ]}
              >
                {/* Timestamp */}
                {showTimestamps && (
                  <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>
                    {formatTimestamp(transcript.timestamp)}
                  </Text>
                )}

                {/* Transcript Text */}
                <Text
                  style={[
                    styles.transcriptText,
                    {
                      color: transcript.isFinal
                        ? theme.colors.textPrimary
                        : theme.colors.textSecondary,
                      fontStyle: transcript.isFinal ? 'normal' : 'italic',
                    },
                  ]}
                >
                  {transcript.text}
                </Text>

                {/* Confidence Indicator */}
                {showConfidence && (
                  <View style={styles.confidenceContainer}>
                    <View
                      style={[
                        styles.confidenceBar,
                        {
                          width: `${transcript.confidence * 100}%`,
                          backgroundColor: getConfidenceColor(transcript.confidence),
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.confidenceText,
                        { color: getConfidenceColor(transcript.confidence) },
                      ]}
                    >
                      {Math.round(transcript.confidence * 100)}%
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  countText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  transcriptItem: {
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderRadius: 8,
  },
  timestamp: {
    fontSize: 12,
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  confidenceBar: {
    height: 4,
    borderRadius: 2,
    flex: 1,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
});

