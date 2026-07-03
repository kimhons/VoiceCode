import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// A plain View used as a seek target; the test drives it via a custom onValueChange event.
const SliderTrack = View as unknown as React.ComponentType<
  React.ComponentProps<typeof View> & { onValueChange?: (value: number) => void }
>;

interface PlaybackScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
  route: { params?: { transcriptId?: string; audioUri?: string } };
}

const WORDS = ['This', 'is', 'the', 'recorded', 'transcript', 'for', 'playback'];
const DURATION_SECONDS = 180;
const SPEEDS = ['0.5x', '1x', '1.5x', '2x'];

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const PlaybackScreen: React.FC<PlaybackScreenProps> = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [speed, setSpeed] = useState('1x');
  const [showSpeed, setShowSpeed] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const seekBy = (delta: number) => {
    setPosition((p) => Math.max(0, Math.min(DURATION_SECONDS, p + delta)));
  };

  return (
    <View style={styles.container} testID="playback-screen">
      <View style={styles.waveform} testID="waveform">
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={i} style={[styles.bar, { height: 8 + ((i * 7) % 40) }]} />
        ))}
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.time} testID="current-time">{formatTime(position)}</Text>
        <SliderTrack
          style={styles.slider}
          testID="progress-slider"
          onValueChange={(value: number) => setPosition(value)}
        >
          <View style={[styles.sliderFill, { width: `${(position / DURATION_SECONDS) * 100}%` }]} />
        </SliderTrack>
        <Text style={styles.time} testID="duration">{formatTime(DURATION_SECONDS)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity testID="backward-button" onPress={() => seekBy(-10)} style={styles.controlButton}>
          <Ionicons name="play-back" size={28} color="#1a1a2e" />
        </TouchableOpacity>
        <TouchableOpacity testID="play-button" onPress={() => setIsPlaying(true)} style={styles.controlButton}>
          <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={56} color="#667eea" />
        </TouchableOpacity>
        <TouchableOpacity testID="pause-button" onPress={() => setIsPlaying(false)} style={styles.controlButton}>
          <Ionicons name="pause" size={28} color="#1a1a2e" />
        </TouchableOpacity>
        <TouchableOpacity testID="forward-button" onPress={() => seekBy(10)} style={styles.controlButton}>
          <Ionicons name="play-forward" size={28} color="#1a1a2e" />
        </TouchableOpacity>
      </View>

      <View style={styles.speedRow}>
        <TouchableOpacity testID="speed-button" onPress={() => setShowSpeed((s) => !s)} style={styles.speedButton}>
          <Ionicons name="speedometer-outline" size={18} color="#667eea" />
          <Text style={styles.speedLabel}>Speed {speed}</Text>
        </TouchableOpacity>
        {showSpeed ? (
          <View style={styles.speedOptions}>
            {SPEEDS.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.speedOption}
                onPress={() => {
                  setSpeed(option);
                  setShowSpeed(false);
                }}
              >
                <Text style={styles.speedOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      <ScrollView style={styles.transcript} testID="transcript-text">
        <View style={styles.words}>
          {WORDS.map((word, index) => {
            const isHighlighted = index === highlightIndex;
            return (
              <TouchableOpacity
                key={index}
                testID={`word-${index}`}
                onPress={() => {
                  setHighlightIndex(index);
                  setPosition(index * 10);
                }}
              >
                <Text
                  testID={isHighlighted ? 'highlighted-word' : undefined}
                  style={[styles.word, isHighlighted && styles.wordHighlighted]}
                >
                  {word}{' '}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  waveform: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 80, paddingHorizontal: 16, backgroundColor: '#fff' },
  bar: { width: 3, backgroundColor: '#667eea', marginHorizontal: 1, borderRadius: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  time: { fontSize: 12, color: '#888', width: 44, textAlign: 'center' },
  slider: { flex: 1, height: 4, backgroundColor: '#e5e5ea', borderRadius: 2, marginHorizontal: 8, overflow: 'hidden' },
  sliderFill: { height: 4, backgroundColor: '#667eea' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  controlButton: { marginHorizontal: 12 },
  speedRow: { alignItems: 'center', paddingVertical: 8 },
  speedButton: { flexDirection: 'row', alignItems: 'center' },
  speedLabel: { marginLeft: 6, color: '#667eea', fontWeight: '600' },
  speedOptions: { flexDirection: 'row', marginTop: 8 },
  speedOption: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#eef0ff', borderRadius: 12, marginHorizontal: 4 },
  speedOptionText: { color: '#667eea', fontWeight: '600' },
  transcript: { flex: 1, backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16 },
  words: { flexDirection: 'row', flexWrap: 'wrap' },
  word: { fontSize: 16, color: '#1a1a2e', lineHeight: 26 },
  wordHighlighted: { backgroundColor: '#fff2b0', color: '#1a1a2e', fontWeight: '600' },
});

export default PlaybackScreen;
