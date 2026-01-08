// VoiceFlow Pro Mobile - Home Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { Text, Card, Button } from '../../components/common';
import { RecordButton, AudioWaveform } from '../../components/recording';
import { usePermissions } from '../../hooks';
import { useRealtimeTranscription } from '../../hooks/useRealtimeTranscription';
import { audioRecorder, RecordingQuality, RecordingStatus } from '../../services';
import { startRecording, pauseRecording, resumeRecording, stopRecording } from '../../store/slices/recordingSlice';

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'HomeScreen'>;

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { currentRecording, recordings } = useAppSelector(state => state.recording);
  const { user } = useAppSelector(state => state.auth);
  const { hasMicrophonePermission, requestMicrophonePermission } = usePermissions();

  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(RecordingStatus.IDLE);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [useStreaming, setUseStreaming] = useState(true); // Default to streaming

  // Real-time transcription hook
  const {
    isConnected: isStreamingConnected,
    isRecording: isStreamingRecording,
    transcript: streamingTranscript,
    interimTranscript,
    error: streamingError,
    startRecording: startStreamingRecording,
    stopRecording: stopStreamingRecording,
  } = useRealtimeTranscription({
    apiKey: '63f13c49769f4049b8789d00ab4af4fd', // TODO: Get from settings
    language: 'en',
    punctuate: true,
    interimResults: true,
    recordingQuality: RecordingQuality.MEDIUM,
    onError: (error) => Alert.alert('Streaming Error', error),
  });

  // Update recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (recordingStatus === RecordingStatus.RECORDING) {
      interval = setInterval(() => {
        const duration = audioRecorder.getDuration();
        setRecordingDuration(duration);
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingStatus]);

  // Update audio metering
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (recordingStatus === RecordingStatus.RECORDING) {
      interval = setInterval(async () => {
        const metering = await audioRecorder.getMetering();
        if (metering) {
          // Convert dB to 0-100 scale
          const normalized = Math.max(0, Math.min(100, (metering.averagePower + 160) / 160 * 100));
          setAudioLevel(normalized);

          // Generate waveform data for visualization
          const waveformData = Array.from({ length: 30 }, () => normalized);
          // TODO: Update Redux with waveform data
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingStatus]);

  const handleStartRecording = async () => {
    try {
      // Check permission
      if (!hasMicrophonePermission) {
        const granted = await requestMicrophonePermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Microphone permission is required to record audio');
          return;
        }
      }

      if (useStreaming) {
        // Use real-time streaming
        await startStreamingRecording();
        setRecordingStatus(RecordingStatus.RECORDING);
      } else {
        // Use traditional recording
        await audioRecorder.startRecording(RecordingQuality.HIGH);
        setRecordingStatus(RecordingStatus.RECORDING);
      }

      setRecordingDuration(0);
      setAudioLevel(0);

      // Update Redux
      dispatch(startRecording());
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording: ' + error);
    }
  };

  const handlePauseRecording = async () => {
    try {
      await audioRecorder.pauseRecording();
      setRecordingStatus(RecordingStatus.PAUSED);
      dispatch(pauseRecording());
    } catch (error) {
      Alert.alert('Error', 'Failed to pause recording: ' + error);
    }
  };

  const handleResumeRecording = async () => {
    try {
      await audioRecorder.resumeRecording();
      setRecordingStatus(RecordingStatus.RECORDING);
      dispatch(resumeRecording());
    } catch (error) {
      Alert.alert('Error', 'Failed to resume recording: ' + error);
    }
  };

  const handleStopRecording = async () => {
    try {
      if (useStreaming) {
        // Stop streaming recording
        await stopStreamingRecording();
        setRecordingStatus(RecordingStatus.STOPPED);

        // Show transcript
        Alert.alert(
          'Transcription Complete',
          streamingTranscript || 'No transcript available',
          [
            { text: 'OK', onPress: () => {
              setRecordingStatus(RecordingStatus.IDLE);
              setRecordingDuration(0);
              setAudioLevel(0);
            }}
          ]
        );
      } else {
        // Stop traditional recording
        const { uri, metadata } = await audioRecorder.stopRecording();
        setRecordingStatus(RecordingStatus.STOPPED);

        // Update Redux
        dispatch(stopRecording());

        Alert.alert(
          'Recording Saved',
          `Duration: ${(metadata.duration / 1000).toFixed(1)}s\nSize: ${(metadata.fileSize / 1024).toFixed(1)} KB`,
          [
            { text: 'OK', onPress: () => {
              setRecordingStatus(RecordingStatus.IDLE);
              setRecordingDuration(0);
              setAudioLevel(0);
            }}
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording: ' + error);
    }
  };

  const handleViewRecording = (id: string) => {
    // TODO: Navigate to recording detail
    console.log('View Recording:', id);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="h2" color={theme.colors.textPrimary}>
              Welcome back{user?.name ? `, ${user.name}` : ''}!
            </Text>
            <Text variant="body" color={theme.colors.textSecondary} style={styles.subtitle}>
              Ready to capture your thoughts?
            </Text>
          </View>
          <Button
            onPress={() => navigation.navigate('AudioTest')}
            variant="outline"
            size="small"
          >
            Test Audio
          </Button>
        </View>

        {/* Streaming Toggle */}
        <Card style={styles.streamingCard} elevation={1}>
          <View style={styles.streamingToggle}>
            <View>
              <Text variant="body" color={theme.colors.textPrimary} style={{ fontWeight: '600' }}>
                🌐 Real-time Streaming
              </Text>
              <Text variant="caption" color={theme.colors.textSecondary}>
                {isStreamingConnected ? 'Connected' : 'Disconnected'} • Low latency transcription
              </Text>
            </View>
            <Switch
              value={useStreaming}
              onValueChange={setUseStreaming}
              disabled={recordingStatus !== RecordingStatus.IDLE}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={useStreaming ? theme.colors.background : theme.colors.textSecondary}
            />
          </View>
        </Card>

        {/* Live Transcript (Streaming Mode) */}
        {useStreaming && (streamingTranscript || interimTranscript) && (
          <Card style={styles.transcriptCard} elevation={1}>
            <Text variant="body" color={theme.colors.textPrimary} style={{ fontWeight: '600', marginBottom: 8 }}>
              📝 Live Transcript
            </Text>
            <Text variant="body" color={theme.colors.textPrimary}>
              {streamingTranscript}
              {interimTranscript && (
                <Text style={{ opacity: 0.5, fontStyle: 'italic' }}>
                  {streamingTranscript ? ' ' : ''}{interimTranscript}
                </Text>
              )}
            </Text>
          </Card>
        )}

        {/* Recording Section */}
        <Card style={styles.recordingCard} elevation={2}>
          <View style={styles.recordingContent}>
            {recordingStatus === RecordingStatus.RECORDING || recordingStatus === RecordingStatus.PAUSED ? (
              <>
                <Text variant="h3" align="center" color={theme.colors.textPrimary}>
                  {recordingStatus === RecordingStatus.PAUSED ? 'Paused' : useStreaming ? 'Streaming...' : 'Recording...'}
                </Text>
                <Text
                  variant="h1"
                  align="center"
                  color={theme.colors.primary}
                  style={styles.duration}
                >
                  {formatDuration(Math.floor(recordingDuration / 1000))}
                </Text>
                <AudioWaveform
                  audioData={Array.from({ length: 30 }, () => audioLevel)}
                  isActive={recordingStatus === RecordingStatus.RECORDING}
                  height={80}
                  barCount={30}
                />
              </>
            ) : (
              <>
                <Text variant="h3" align="center" color={theme.colors.textPrimary}>
                  Start Recording
                </Text>
                <Text
                  variant="body"
                  align="center"
                  color={theme.colors.textSecondary}
                  style={styles.recordingHint}
                >
                  Tap the button below to begin
                </Text>
              </>
            )}

            <View style={styles.recordButtonContainer}>
              <RecordButton
                isRecording={recordingStatus === RecordingStatus.RECORDING || recordingStatus === RecordingStatus.PAUSED}
                isPaused={recordingStatus === RecordingStatus.PAUSED}
                onPress={recordingStatus === RecordingStatus.IDLE ? handleStartRecording : handleStopRecording}
                size={100}
              />
            </View>

            {(recordingStatus === RecordingStatus.RECORDING || recordingStatus === RecordingStatus.PAUSED) && (
              <View style={styles.recordingActions}>
                <Button
                  variant="outline"
                  size="small"
                  onPress={recordingStatus === RecordingStatus.PAUSED ? handleResumeRecording : handlePauseRecording}
                >
                  {recordingStatus === RecordingStatus.PAUSED ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onPress={handleStopRecording}
                >
                  Stop
                </Button>
              </View>
            )}
          </View>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard} elevation={1}>
            <Text variant="h2" color={theme.colors.primary} align="center">
              {recordings.length}
            </Text>
            <Text variant="caption" color={theme.colors.textSecondary} align="center">
              Recordings
            </Text>
          </Card>

          <Card style={styles.statCard} elevation={1}>
            <Text variant="h2" color={theme.colors.secondary} align="center">
              {recordings.reduce((sum, r) => sum + r.duration, 0)}m
            </Text>
            <Text variant="caption" color={theme.colors.textSecondary} align="center">
              Total Time
            </Text>
          </Card>

          <Card style={styles.statCard} elevation={1}>
            <Text variant="h2" color={theme.colors.success} align="center">
              {recordings.filter(r => r.createdAt.startsWith(new Date().toISOString().split('T')[0])).length}
            </Text>
            <Text variant="caption" color={theme.colors.textSecondary} align="center">
              Today
            </Text>
          </Card>
        </View>

        {/* Recent Recordings */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text variant="h3" color={theme.colors.textPrimary}>
              Recent Recordings
            </Text>
            <TouchableOpacity>
              <Text variant="caption" color={theme.colors.primary}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {recordings.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text variant="body" color={theme.colors.textSecondary} align="center">
                No recordings yet. Start your first recording above!
              </Text>
            </Card>
          ) : (
            recordings.slice(0, 5).map(recording => (
              <Card
                key={recording.id}
                style={styles.recordingItem}
                pressable
                onPress={() => handleViewRecording(recording.id)}
                elevation={1}
              >
                <View style={styles.recordingItemContent}>
                  <View style={styles.recordingItemLeft}>
                    <Text variant="h6" color={theme.colors.textPrimary}>
                      {recording.title}
                    </Text>
                    <Text variant="caption" color={theme.colors.textSecondary}>
                      {formatDate(recording.createdAt)} • {formatDuration(recording.duration)}
                    </Text>
                  </View>
                  <View style={styles.recordingItemRight}>
                    <Text variant="caption" color={theme.colors.primary}>
                      →
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subtitle: {
    marginTop: 4,
  },
  streamingCard: {
    marginBottom: 16,
  },
  streamingToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  transcriptCard: {
    marginBottom: 16,
    maxHeight: 150,
  },
  recordingCard: {
    marginBottom: 24,
  },
  recordingContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  duration: {
    marginVertical: 16,
  },
  recordingHint: {
    marginTop: 8,
    marginBottom: 24,
  },
  recordButtonContainer: {
    marginVertical: 24,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyCard: {
    paddingVertical: 32,
  },
  recordingItem: {
    marginBottom: 12,
  },
  recordingItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingItemLeft: {
    flex: 1,
  },
  recordingItemRight: {
    marginLeft: 12,
  },
});

