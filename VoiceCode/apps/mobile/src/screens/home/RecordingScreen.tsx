// VoiceCode Mobile - Recording Screen
// Live transcription with real-time waveform visualization

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { audioRecorder } from '../../services/AudioRecorder';
import { getStreamingService, StreamingTranscript } from '../../services/WebSocketStreamingService';
import { LiveTranscriptionView } from '../../components/recording/LiveTranscriptionView';
import { AudioWaveform } from '../../components/recording/AudioWaveform';
import { RecordingQuality, RecordingStatus } from '../../types/recording';

const AIML_API_KEY = process.env.EXPO_PUBLIC_AIML_API_KEY ?? '';

const RecordingScreen: React.FC = () => {
  const { theme } = useTheme();
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(RecordingStatus.IDLE);
  const [duration, setDuration] = useState(0);
  const [transcripts, setTranscripts] = useState<StreamingTranscript[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const meteringInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initialize streaming service only when API key is configured (env-only, no placeholder)
  useEffect(() => {
    if (!AIML_API_KEY.trim()) {
      return;
    }
    const streamingService = getStreamingService(AIML_API_KEY);
    audioRecorder.setStreamingService(streamingService);

    streamingService.on('transcript', handleTranscript);
    streamingService.on('connected', () => {
      setIsStreaming(true);
    });
    streamingService.on('disconnected', () => {
      setIsStreaming(false);
    });
    streamingService.on('error', (error) => {
      Alert.alert('Streaming Error', error.error || 'Failed to connect to streaming service');
    });

    return () => {
      streamingService.off('transcript', handleTranscript);
      streamingService.disconnect();
    };
  }, []);

  // Handle incoming transcripts
  const handleTranscript = useCallback((transcript: StreamingTranscript) => {
    setTranscripts((prev) => {
      // If it's a final transcript, replace the last interim one
      if (transcript.isFinal) {
        const withoutLastInterim = prev.filter((t, i) => i !== prev.length - 1 || t.isFinal);
        return [...withoutLastInterim, transcript];
      }
      // If it's interim, replace the last interim or add new
      const withoutLastInterim = prev.filter((t) => t.isFinal);
      return [...withoutLastInterim, transcript];
    });
  }, []);

  // Update duration timer
  useEffect(() => {
    if (recordingStatus === RecordingStatus.RECORDING) {
      durationInterval.current = setInterval(() => {
        setDuration(audioRecorder.getDuration());
      }, 100);
    } else {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [recordingStatus]);

  // Update audio metering
  useEffect(() => {
    if (recordingStatus === RecordingStatus.RECORDING) {
      meteringInterval.current = setInterval(async () => {
        const metering = await audioRecorder.getMetering();
        if (metering) {
          // Normalize metering value (-160 to 0 dB) to 0-1 range
          const normalized = Math.max(0, Math.min(1, (metering.averagePower + 160) / 160));
          setAudioLevel(normalized);
        }
      }, 50);
    } else {
      if (meteringInterval.current) {
        clearInterval(meteringInterval.current);
        meteringInterval.current = null;
      }
      setAudioLevel(0);
    }

    return () => {
      if (meteringInterval.current) {
        clearInterval(meteringInterval.current);
      }
    };
  }, [recordingStatus]);

  // Pulse animation for recording button
  useEffect(() => {
    if (recordingStatus === RecordingStatus.RECORDING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recordingStatus, pulseAnim]);

  const handleStartRecording = async () => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Connect to streaming service
      const streamingService = getStreamingService();
      await streamingService.connect({
        language: 'en',
        model: '#g1_nova-2-general',
        punctuate: true,
        diarize: false,
        interimResults: true,
      });

      // Start recording with streaming
      await audioRecorder.startStreamingRecording(RecordingQuality.HIGH);
      setRecordingStatus(RecordingStatus.RECORDING);
      setTranscripts([]);

      // Button press animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handlePauseRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await audioRecorder.pauseRecording();
      setRecordingStatus(RecordingStatus.PAUSED);
    } catch (error) {
      console.error('Failed to pause recording:', error);
      Alert.alert('Error', 'Failed to pause recording');
    }
  };

  const handleResumeRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await audioRecorder.resumeRecording();
      setRecordingStatus(RecordingStatus.RECORDING);
    } catch (error) {
      console.error('Failed to resume recording:', error);
      Alert.alert('Error', 'Failed to resume recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const metadata = await audioRecorder.stopStreamingRecording();
      setRecordingStatus(RecordingStatus.STOPPED);
      setDuration(0);

      Alert.alert(
        'Recording Complete',
        `Duration: ${formatDuration(metadata.duration)}\nTranscripts: ${transcripts.length} segments`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset for next recording
              setRecordingStatus(RecordingStatus.IDLE);
              setTranscripts([]);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Voice Recording
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {recordingStatus === RecordingStatus.IDLE && 'Tap the microphone to start'}
          {recordingStatus === RecordingStatus.RECORDING && 'Recording with live transcription'}
          {recordingStatus === RecordingStatus.PAUSED && 'Recording paused'}
        </Text>
      </View>

      {/* Recording Controls */}
      <View style={styles.recordingContainer}>
        {/* Waveform Visualization */}
        <View
          style={[
            styles.waveform,
            {
              backgroundColor:
                recordingStatus === RecordingStatus.RECORDING
                  ? `${theme.colors.primary}10`
                  : theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.durationText, { color: theme.colors.primary }]}>
            {recordingStatus !== RecordingStatus.IDLE ? formatDuration(duration) : 'Ready'}
          </Text>

          {/* Real-time Audio Waveform */}
          <View style={styles.waveformVisualization}>
            <AudioWaveform
              audioLevel={audioLevel}
              isActive={recordingStatus === RecordingStatus.RECORDING}
              barCount={50}
              height={80}
              barWidth={3}
              barSpacing={2}
              useGradient={true}
            />
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsRow}>
          {recordingStatus !== RecordingStatus.IDLE && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: theme.colors.surface,
                  ...theme.elevation.sm,
                },
              ]}
              onPress={
                recordingStatus === RecordingStatus.PAUSED
                  ? handleResumeRecording
                  : handlePauseRecording
              }
            >
              <Ionicons
                name={recordingStatus === RecordingStatus.PAUSED ? 'play' : 'pause'}
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}

          {/* Main Record/Stop Button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                {
                  backgroundColor:
                    recordingStatus === RecordingStatus.IDLE
                      ? theme.colors.primary
                      : theme.colors.error,
                  ...theme.elevation.md,
                },
              ]}
              onPress={
                recordingStatus === RecordingStatus.IDLE
                  ? handleStartRecording
                  : handleStopRecording
              }
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons
                  name={recordingStatus === RecordingStatus.IDLE ? 'mic' : 'stop'}
                  size={48}
                  color="#ffffff"
                />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>

          {recordingStatus !== RecordingStatus.IDLE && (
            <View style={styles.secondaryButton} />
          )}
        </View>

        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
          {recordingStatus === RecordingStatus.IDLE && 'Tap to record'}
          {recordingStatus === RecordingStatus.RECORDING && 'Recording...'}
          {recordingStatus === RecordingStatus.PAUSED && 'Paused'}
        </Text>
      </View>

      {/* Live Transcription */}
      {recordingStatus !== RecordingStatus.IDLE && (
        <View style={styles.transcriptionContainer}>
          <LiveTranscriptionView
            transcripts={transcripts}
            isStreaming={isStreaming && recordingStatus === RecordingStatus.RECORDING}
            autoScroll={true}
            showConfidence={true}
            showTimestamps={false}
          />
        </View>
      )}

      {/* Footer Info */}
      {recordingStatus === RecordingStatus.IDLE && (
        <View style={styles.footer}>
          <Text style={[styles.infoText, { color: theme.colors.textTertiary }]}>
            High quality audio with live AI transcription
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  waveform: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  durationText: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  waveformVisualization: {
    width: 240,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  transcriptionContainer: {
    flex: 1,
    marginTop: 16,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default RecordingScreen;
