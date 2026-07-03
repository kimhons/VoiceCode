import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface TutorialScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
    replace: (screen: string) => void;
  };
}

interface Step {
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { title: 'Speak to Code', description: 'Describe what you want and VoiceCode writes it.' },
  { title: 'Review Results', description: 'Check the generated output before applying.' },
  { title: 'Stay in Flow', description: 'Keep your hands free and your focus sharp.' },
];

const TutorialScreen: React.FC<TutorialScreenProps> = ({ navigation }) => {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const finish = () => navigation.replace('Home');
  const next = () => setIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const previous = () => setIndex((i) => Math.max(i - 1, 0));

  return (
    <View style={styles.container} testID="tutorial-screen">
      <TouchableOpacity style={styles.skip} onPress={finish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.step} testID="tutorial-step">
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.image}
          testID="step-image"
        />
        <Text style={styles.stepTitle} testID="step-title">
          {step.title}
        </Text>
        <Text style={styles.stepDescription} testID="step-description">
          {step.description}
        </Text>
      </View>

      <View style={styles.progress} testID="progress-indicator">
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryButton} onPress={previous} testID="previous-button">
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={next} testID="next-button">
          <Text style={styles.secondaryText}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={finish} testID="complete-button">
          <Text style={styles.primaryText}>{isLast ? 'Done' : 'Finish'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  skip: { alignSelf: 'flex-end', padding: 8 },
  skipText: { color: '#667eea', fontWeight: '600' },
  step: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: 120, height: 120, borderRadius: 24, marginBottom: 24 },
  stepTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', textAlign: 'center' },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  progress: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d5d8e8', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#667eea', width: 20 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  secondaryButton: { paddingVertical: 12, paddingHorizontal: 16 },
  secondaryText: { color: '#667eea', fontWeight: '600' },
  primaryButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  primaryText: { color: '#fff', fontWeight: '700' },
});

export default TutorialScreen;
