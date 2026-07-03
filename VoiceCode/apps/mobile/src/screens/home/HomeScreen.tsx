// VoiceCode Mobile - Home Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { Text, Card, Button } from '../../components/common';
import { RecordButton, AudioWaveform } from '../../components/recording';
import { usePermissions } from '../../hooks';
import { useRealtimeTranscription } from '../../hooks/useRealtimeTranscription';
import { audioRecorder, RecordingQuality, RecordingStatus } from '../../services';
import {
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
} from '../../store/slices/recordingSlice';

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'HomeScreen'>;

interface HomeScreenProps {
  navigation?: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation: navigationProp }) => {
  const { theme } = useTheme();
  const navigationFromHook = useNavigation<HomeScreenNavigationProp>();
  const navigation = navigationProp ?? navigationFromHook;
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
    onError: error => Alert.alert('Streaming Error', error),
  });

  // Update recording duration
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

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
    let interval: ReturnType<typeof setInterval>;

    if (recordingStatus === RecordingStatus.RECORDING) {
      interval = setInterval(async () => {
        const metering = await audioRecorder.getMetering();
        if (metering) {
          // Convert dB to 0-100 scale
          const normalized = Math.max(
            0,
            Math.min(100, ((metering.averagePower + 160) / 160) * 100)
          );
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
        Alert.alert('Transcription Complete', streamingTranscript || 'No transcript available', [
          {
            text: 'OK',
            onPress: () => {
              setRecordingStatus(RecordingStatus.IDLE);
              setRecordingDuration(0);
              setAudioLevel(0);
            },
          },
        ]);
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
            {
              text: 'OK',
              onPress: () => {
                setRecordingStatus(RecordingStatus.IDLE);
                setRecordingDuration(0);
                setAudioLevel(0);
              },
            },
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
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.greeting}>
              <Text style={[styles.welcomeText, { color: theme.colors.textSecondary }]}>
                Welcome back
              </Text>
              <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                {user?.name || 'there'} 👋
              </Text>
            </View>
          </View>
          <TouchableOpacity
            testID="settings-button"
            style={[styles.settingsButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('AudioTest')}
          >
            <Ionicons name="settings-outline" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Streaming Mode Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => recordingStatus === RecordingStatus.IDLE && setUseStreaming(!useStreaming)}
          disabled={recordingStatus !== RecordingStatus.IDLE}
        >
          <LinearGradient
            colors={
              useStreaming ? ['#667eea', '#764ba2'] : [theme.colors.surface, theme.colors.surface]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.streamingCard}
          >
            <View style={styles.streamingContent}>
              <View
                style={[
                  styles.streamingIconContainer,
                  {
                    backgroundColor: useStreaming
                      ? 'rgba(255,255,255,0.2)'
                      : theme.colors.background,
                  },
                ]}
              >
                <Ionicons
                  name={useStreaming ? 'radio' : 'radio-outline'}
                  size={24}
                  color={useStreaming ? '#FFFFFF' : theme.colors.textSecondary}
                />
              </View>
              <View style={styles.streamingTextContainer}>
                <Text
                  style={[
                    styles.streamingTitle,
                    { color: useStreaming ? '#FFFFFF' : theme.colors.textPrimary },
                  ]}
                >
                  Real-time Streaming
                </Text>
                <Text
                  style={[
                    styles.streamingSubtitle,
                    { color: useStreaming ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary },
                  ]}
                >
                  {isStreamingConnected ? '● Connected' : '○ Tap to enable'} • AI transcription
                </Text>
              </View>
              <Switch
                value={useStreaming}
                onValueChange={setUseStreaming}
                disabled={recordingStatus !== RecordingStatus.IDLE}
                trackColor={{ false: theme.colors.border, true: 'rgba(255,255,255,0.3)' }}
                thumbColor={useStreaming ? '#FFFFFF' : theme.colors.textSecondary}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Live Transcript (Streaming Mode) */}
        {useStreaming && (streamingTranscript || interimTranscript) && (
          <Card style={styles.transcriptCard} elevation={1}>
            <Text
              variant="body"
              color={theme.colors.textPrimary}
              style={{ fontWeight: '600', marginBottom: 8 }}
            >
              📝 Live Transcript
            </Text>
            <Text variant="body" color={theme.colors.textPrimary}>
              {streamingTranscript}
              {interimTranscript && (
                <Text style={{ opacity: 0.5, fontStyle: 'italic' }}>
                  {streamingTranscript ? ' ' : ''}
                  {interimTranscript}
                </Text>
              )}
            </Text>
          </Card>
        )}

        {/* Recording Section */}
        <View style={[styles.recordingCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.recordingContent}>
            {recordingStatus === RecordingStatus.RECORDING ||
            recordingStatus === RecordingStatus.PAUSED ? (
              <>
                <View style={styles.recordingStatusBadge}>
                  <View
                    style={[
                      styles.recordingDot,
                      {
                        backgroundColor:
                          recordingStatus === RecordingStatus.PAUSED
                            ? theme.colors.warning
                            : '#EF4444',
                      },
                    ]}
                  />
                  <Text style={[styles.recordingStatusText, { color: theme.colors.textSecondary }]}>
                    {recordingStatus === RecordingStatus.PAUSED
                      ? 'PAUSED'
                      : useStreaming
                        ? 'STREAMING'
                        : 'RECORDING'}
                  </Text>
                </View>
                <Text style={[styles.durationText, { color: theme.colors.textPrimary }]}>
                  {formatDuration(Math.floor(recordingDuration / 1000))}
                </Text>
                <AudioWaveform
                  audioData={Array.from({ length: 30 }, () => audioLevel)}
                  isActive={recordingStatus === RecordingStatus.RECORDING}
                  height={60}
                  barCount={30}
                />
              </>
            ) : (
              <>
                <View style={styles.recordingIdleContent}>
                  <Ionicons name="mic-outline" size={32} color={theme.colors.textSecondary} />
                  <Text style={[styles.recordingTitle, { color: theme.colors.textPrimary }]}>
                    Ready to Record
                  </Text>
                  <Text style={[styles.recordingHint, { color: theme.colors.textSecondary }]}>
                    Tap the button to start capturing
                  </Text>
                </View>
              </>
            )}

            <View testID="record-button" style={styles.recordButtonContainer}>
              <RecordButton
                isRecording={
                  recordingStatus === RecordingStatus.RECORDING ||
                  recordingStatus === RecordingStatus.PAUSED
                }
                isPaused={recordingStatus === RecordingStatus.PAUSED}
                onPress={
                  recordingStatus === RecordingStatus.IDLE
                    ? handleStartRecording
                    : handleStopRecording
                }
                size={88}
              />
            </View>

            {(recordingStatus === RecordingStatus.RECORDING ||
              recordingStatus === RecordingStatus.PAUSED) && (
              <View style={styles.recordingActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
                  onPress={
                    recordingStatus === RecordingStatus.PAUSED
                      ? handleResumeRecording
                      : handlePauseRecording
                  }
                >
                  <Ionicons
                    name={recordingStatus === RecordingStatus.PAUSED ? 'play' : 'pause'}
                    size={20}
                    color={theme.colors.textPrimary}
                  />
                  <Text style={[styles.actionButtonText, { color: theme.colors.textPrimary }]}>
                    {recordingStatus === RecordingStatus.PAUSED ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.stopButton]}
                  onPress={handleStopRecording}
                >
                  <Ionicons name="stop" size={20} color="#FFFFFF" />
                  <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Stop</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="folder-outline" size={20} color="#6366F1" />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {recordings.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Recordings
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {recordings.reduce((sum, r) => sum + r.duration, 0)}m
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Time
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="today-outline" size={20} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {
                recordings.filter(r =>
                  r.createdAt.startsWith(new Date().toISOString().split('T')[0])
                ).length
              }
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Today</Text>
          </View>
        </View>

        {/* Recent Recordings */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Recent Recordings
            </Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {recordings.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
              <View
                style={[styles.emptyIconContainer, { backgroundColor: theme.colors.background }]}
              >
                <Ionicons name="mic-off-outline" size={32} color={theme.colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                No recordings yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Start your first recording using the button above
              </Text>
            </View>
          ) : (
            recordings.slice(0, 5).map((recording, index) => (
              <TouchableOpacity
                key={recording.id}
                style={[styles.recordingItem, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleViewRecording(recording.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.recordingItemIcon,
                    { backgroundColor: index % 2 === 0 ? '#EEF2FF' : '#FEF3C7' },
                  ]}
                >
                  <Ionicons
                    name="document-text"
                    size={20}
                    color={index % 2 === 0 ? '#6366F1' : '#F59E0B'}
                  />
                </View>
                <View style={styles.recordingItemContent}>
                  <Text style={[styles.recordingItemTitle, { color: theme.colors.textPrimary }]}>
                    {recording.title}
                  </Text>
                  <Text style={[styles.recordingItemMeta, { color: theme.colors.textSecondary }]}>
                    {formatDate(recording.createdAt)} • {formatDuration(recording.duration)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
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
    paddingTop: 12,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    gap: 2,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '400',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamingCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  streamingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streamingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streamingTextContainer: {
    flex: 1,
  },
  streamingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  streamingSubtitle: {
    fontSize: 13,
  },
  transcriptCard: {
    marginBottom: 16,
    maxHeight: 150,
  },
  recordingCard: {
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
  },
  recordingContent: {
    alignItems: 'center',
  },
  recordingIdleContent: {
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  recordingHint: {
    fontSize: 14,
    marginTop: 4,
  },
  recordingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingStatusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  durationText: {
    fontSize: 48,
    fontWeight: '300',
    marginBottom: 16,
  },
  recordButtonContainer: {
    marginVertical: 20,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyCard: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  recordingItem: {
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordingItemContent: {
    flex: 1,
  },
  recordingItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordingItemMeta: {
    fontSize: 13,
  },
});
