// VoiceCode Pro Mobile - Audio Services Test Screen

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text, Button, Card } from '../../components/common';
import { usePermissions } from '../../hooks';
import { audioRecorder, audioPlayer, RecordingQuality, RecordingStatus, PlaybackStatus } from '../../services';

export const AudioTestScreen: React.FC = () => {
  const { theme } = useTheme();
  const { 
    permissions, 
    requestMicrophonePermission, 
    hasMicrophonePermission 
  } = usePermissions();

  // Recording state
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(RecordingStatus.IDLE);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  // Playback state
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>(PlaybackStatus.IDLE);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Update recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (recordingStatus === RecordingStatus.RECORDING) {
      interval = setInterval(() => {
        setRecordingDuration(audioRecorder.getDuration());
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
          // Convert dB to 0-100 scale for visualization
          const normalized = Math.max(0, Math.min(100, (metering.averagePower + 160) / 160 * 100));
          setAudioLevel(normalized);
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingStatus]);

  // Subscribe to playback updates
  useEffect(() => {
    audioPlayer.setStatusCallback((state) => {
      setPlaybackStatus(state.status);
      setPlaybackPosition(state.position);
      setPlaybackDuration(state.duration);
      setPlaybackRate(state.rate);
    });

    return () => {
      audioPlayer.setStatusCallback(null);
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      if (!hasMicrophonePermission) {
        const granted = await requestMicrophonePermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Microphone permission is required to record audio');
          return;
        }
      }

      await audioRecorder.startRecording(RecordingQuality.HIGH);
      setRecordingStatus(RecordingStatus.RECORDING);
      setRecordingDuration(0);
      setAudioLevel(0);
      Alert.alert('Recording Started', 'Recording in HIGH quality');
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording: ' + error);
    }
  };

  const handlePauseRecording = async () => {
    try {
      await audioRecorder.pauseRecording();
      setRecordingStatus(RecordingStatus.PAUSED);
      Alert.alert('Recording Paused');
    } catch (error) {
      Alert.alert('Error', 'Failed to pause recording: ' + error);
    }
  };

  const handleResumeRecording = async () => {
    try {
      await audioRecorder.resumeRecording();
      setRecordingStatus(RecordingStatus.RECORDING);
      Alert.alert('Recording Resumed');
    } catch (error) {
      Alert.alert('Error', 'Failed to resume recording: ' + error);
    }
  };

  const handleStopRecording = async () => {
    try {
      const { uri, metadata } = await audioRecorder.stopRecording();
      setRecordingStatus(RecordingStatus.STOPPED);
      setRecordingUri(uri);
      
      Alert.alert(
        'Recording Saved',
        `Duration: ${(metadata.duration / 1000).toFixed(1)}s\nSize: ${(metadata.fileSize / 1024).toFixed(1)} KB\nURI: ${uri}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording: ' + error);
    }
  };

  const handleCancelRecording = async () => {
    try {
      await audioRecorder.cancelRecording();
      setRecordingStatus(RecordingStatus.IDLE);
      setRecordingDuration(0);
      setAudioLevel(0);
      Alert.alert('Recording Cancelled');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel recording: ' + error);
    }
  };

  const handleLoadAudio = async () => {
    try {
      if (!recordingUri) {
        Alert.alert('No Recording', 'Please record audio first');
        return;
      }

      await audioPlayer.loadAudio(recordingUri);
      Alert.alert('Audio Loaded', 'Ready to play');
    } catch (error) {
      Alert.alert('Error', 'Failed to load audio: ' + error);
    }
  };

  const handlePlay = async () => {
    try {
      await audioPlayer.play();
    } catch (error) {
      Alert.alert('Error', 'Failed to play audio: ' + error);
    }
  };

  const handlePause = async () => {
    try {
      await audioPlayer.pause();
    } catch (error) {
      Alert.alert('Error', 'Failed to pause audio: ' + error);
    }
  };

  const handleStop = async () => {
    try {
      await audioPlayer.stop();
    } catch (error) {
      Alert.alert('Error', 'Failed to stop audio: ' + error);
    }
  };

  const handleChangeSpeed = async (rate: number) => {
    try {
      await audioPlayer.setRate(rate);
      Alert.alert('Speed Changed', `Playback speed: ${rate}x`);
    } catch (error) {
      Alert.alert('Error', 'Failed to change speed: ' + error);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Permissions Status */}
        <Card style={styles.card}>
          <Text variant="h3" style={styles.sectionTitle}>Permissions</Text>
          <Text variant="body">
            Microphone: {permissions.microphone.status}
          </Text>
          <Text variant="body">
            Media Library: {permissions.mediaLibrary.status}
          </Text>
        </Card>

        {/* Recording Controls */}
        <Card style={styles.card}>
          <Text variant="h3" style={styles.sectionTitle}>Recording</Text>
          
          <Text variant="body" style={styles.status}>
            Status: {recordingStatus}
          </Text>
          <Text variant="body" style={styles.status}>
            Duration: {formatTime(recordingDuration)}
          </Text>
          <Text variant="body" style={styles.status}>
            Audio Level: {audioLevel.toFixed(0)}%
          </Text>

          {/* Audio Level Visualizer */}
          <View style={styles.levelContainer}>
            <View 
              style={[
                styles.levelBar, 
                { 
                  width: `${audioLevel}%`,
                  backgroundColor: theme.colors.primary 
                }
              ]} 
            />
          </View>

          <View style={styles.buttonRow}>
            <Button
              title="Start"
              onPress={handleStartRecording}
              disabled={recordingStatus !== RecordingStatus.IDLE}
              size="small"
            />
            <Button
              title="Pause"
              onPress={handlePauseRecording}
              disabled={recordingStatus !== RecordingStatus.RECORDING}
              size="small"
            />
            <Button
              title="Resume"
              onPress={handleResumeRecording}
              disabled={recordingStatus !== RecordingStatus.PAUSED}
              size="small"
            />
          </View>

          <View style={styles.buttonRow}>
            <Button
              title="Stop"
              onPress={handleStopRecording}
              disabled={recordingStatus === RecordingStatus.IDLE || recordingStatus === RecordingStatus.STOPPED}
              variant="secondary"
              size="small"
            />
            <Button
              title="Cancel"
              onPress={handleCancelRecording}
              disabled={recordingStatus === RecordingStatus.IDLE}
              variant="outline"
              size="small"
            />
          </View>
        </Card>

        {/* Playback Controls */}
        <Card style={styles.card}>
          <Text variant="h3" style={styles.sectionTitle}>Playback</Text>
          
          <Text variant="body" style={styles.status}>
            Status: {playbackStatus}
          </Text>
          <Text variant="body" style={styles.status}>
            Position: {formatTime(playbackPosition)} / {formatTime(playbackDuration)}
          </Text>
          <Text variant="body" style={styles.status}>
            Speed: {playbackRate}x
          </Text>

          <Button
            title="Load Recording"
            onPress={handleLoadAudio}
            disabled={!recordingUri}
            style={styles.button}
          />

          <View style={styles.buttonRow}>
            <Button
              title="Play"
              onPress={handlePlay}
              disabled={playbackStatus !== PlaybackStatus.PAUSED && playbackStatus !== PlaybackStatus.STOPPED}
              size="small"
            />
            <Button
              title="Pause"
              onPress={handlePause}
              disabled={playbackStatus !== PlaybackStatus.PLAYING}
              size="small"
            />
            <Button
              title="Stop"
              onPress={handleStop}
              disabled={playbackStatus === PlaybackStatus.IDLE}
              size="small"
            />
          </View>

          <Text variant="body" style={styles.speedLabel}>Playback Speed:</Text>
          <View style={styles.buttonRow}>
            <Button title="0.5x" onPress={() => handleChangeSpeed(0.5)} size="small" variant="outline" />
            <Button title="1.0x" onPress={() => handleChangeSpeed(1.0)} size="small" variant="outline" />
            <Button title="1.5x" onPress={() => handleChangeSpeed(1.5)} size="small" variant="outline" />
            <Button title="2.0x" onPress={() => handleChangeSpeed(2.0)} size="small" variant="outline" />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  status: {
    marginBottom: 4,
  },
  levelContainer: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginVertical: 12,
    overflow: 'hidden',
  },
  levelBar: {
    height: '100%',
    borderRadius: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  button: {
    marginTop: 8,
  },
  speedLabel: {
    marginTop: 12,
    marginBottom: 4,
  },
});

