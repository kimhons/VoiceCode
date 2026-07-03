/**
 * VoiceFlow Pro - Recording Screen
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { Audio } from 'expo-av';
import { RootState, startRecording, stopRecording, addRecording } from '../store';

export default function RecordingScreen() {
  const dispatch = useDispatch();
  const isRecording = useSelector((state: RootState) => state.recordings.isRecording);
  const settings = useSelector((state: RootState) => state.settings);
  
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      setDuration(0);
      pulseAnim.setValue(1);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordPress = async () => {
    if (isRecording) {
      // Stop recording
      dispatch(stopRecording());
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        dispatch(addRecording({
          id: Date.now().toString(),
          title: `Recording ${new Date().toLocaleDateString()}`,
          duration: duration,
          createdAt: new Date().toISOString(),
          language: settings.language,
        }));
        recordingRef.current = null;
      }
    } else {
      // Start recording
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        dispatch(startRecording());
      } catch (err) {
        console.error('Failed to start recording', err);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isRecording ? 'Recording...' : 'Ready to Record'}</Text>
        <Text style={styles.language}>{settings.language}</Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatDuration(duration)}</Text>
      </View>

      <View style={styles.visualizer}>
        {[...Array(20)].map((_, i) => (
          <View key={i} style={[styles.bar, { height: isRecording ? Math.random() * 100 + 20 : 20 }]} />
        ))}
      </View>

      <View style={styles.controls}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={handleRecordPress}
          >
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={48} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          {isRecording ? 'Tap to stop recording' : 'Tap the microphone to start'}
        </Text>
        {settings.autoTranscribe && (
          <Text style={styles.autoTranscribe}>Auto-transcription enabled</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { alignItems: 'center', paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  language: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  timerContainer: { alignItems: 'center', marginTop: 40 },
  timer: { fontSize: 64, fontWeight: '200', color: '#fff', fontVariant: ['tabular-nums'] },
  visualizer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', height: 120, marginTop: 40, paddingHorizontal: 20 },
  bar: { width: 8, backgroundColor: '#007AFF', marginHorizontal: 2, borderRadius: 4 },
  controls: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  recordButton: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  recordButtonActive: { backgroundColor: '#FF3B30' },
  info: { alignItems: 'center', paddingBottom: 40 },
  infoText: { fontSize: 16, color: 'rgba(255,255,255,0.6)' },
  autoTranscribe: { fontSize: 12, color: '#34C759', marginTop: 8 },
});

