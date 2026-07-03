# Week 1 Code Examples
## Quick Reference for Apple-Caliber Design System

---

## 🎨 Typography Usage

### Basic Text Styles

```tsx
import { typography } from '@theme';

// Headings
<Text style={typography.h1}>Large Title</Text>
<Text style={typography.h2}>Title</Text>
<Text style={typography.h3}>Headline</Text>

// Body Text
<Text style={typography.body}>Regular body text</Text>
<Text style={typography.bodyLarge}>Large body text</Text>
<Text style={typography.bodySmall}>Small body text</Text>

// Labels & Captions
<Text style={typography.label}>Label</Text>
<Text style={typography.caption}>Caption text</Text>

// Buttons
<Text style={typography.button}>Button Text</Text>

// Code
<Text style={typography.code}>const code = true;</Text>
```

### Custom Combinations

```tsx
import { fontFamilies, fontSizes, fontWeights } from '@theme';

<Text style={{
  fontFamily: fontFamilies.display,
  fontSize: fontSizes['2xl'],
  fontWeight: fontWeights.bold,
  letterSpacing: -0.3,
}}>
  Custom Heading
</Text>
```

---

## 🌟 Elevation & Shadows

### Card with Elevation

```tsx
import { elevation } from '@theme';
import { useTheme } from '@contexts/ThemeContext';

const MyCard = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[
      styles.card,
      { backgroundColor: theme.colors.surface },
      elevation.md,  // Medium elevation
    ]}>
      <Text>Elevated Card</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
  },
});
```

### Button with Elevation

```tsx
<TouchableOpacity
  style={[
    styles.button,
    { backgroundColor: theme.colors.primary },
    elevation.sm,  // Small elevation
  ]}
  onPress={handlePress}
>
  <Text style={styles.buttonText}>Press Me</Text>
</TouchableOpacity>
```

---

## 🎭 Blur Effects

### Frosted Glass Overlay

```tsx
import { BlurView } from 'expo-blur';
import { blurIntensity } from '@theme';

<BlurView
  intensity={blurIntensity.regular}
  tint="light"
  style={styles.overlay}
>
  <Text style={styles.overlayText}>Frosted Glass</Text>
</BlurView>

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
});
```

### Modal with Blur Background

```tsx
<Modal transparent visible={isVisible}>
  <BlurView
    intensity={blurIntensity.strong}
    tint="dark"
    style={styles.modalBackground}
  >
    <View style={styles.modalContent}>
      <Text>Modal Content</Text>
    </View>
  </BlurView>
</Modal>
```

---

## 🎙️ Live Transcription

### Basic Implementation

```tsx
import { LiveTranscriptionView } from '@components/recording';
import { StreamingTranscript } from '@services/WebSocketStreamingService';

const [transcripts, setTranscripts] = useState<StreamingTranscript[]>([]);
const [isStreaming, setIsStreaming] = useState(false);

<LiveTranscriptionView
  transcripts={transcripts}
  isStreaming={isStreaming}
  autoScroll={true}
  showConfidence={true}
  showTimestamps={false}
/>
```

### With WebSocket Integration

```tsx
import { getStreamingService } from '@services/WebSocketStreamingService';

useEffect(() => {
  const streamingService = getStreamingService(API_KEY);
  
  streamingService.on('transcript', (transcript) => {
    setTranscripts(prev => {
      if (transcript.isFinal) {
        const withoutLastInterim = prev.filter((t, i) => 
          i !== prev.length - 1 || t.isFinal
        );
        return [...withoutLastInterim, transcript];
      }
      const withoutLastInterim = prev.filter(t => t.isFinal);
      return [...withoutLastInterim, transcript];
    });
  });
  
  streamingService.on('connected', () => setIsStreaming(true));
  streamingService.on('disconnected', () => setIsStreaming(false));
  
  return () => {
    streamingService.disconnect();
  };
}, []);
```

---

## 🌊 Audio Waveform

### Basic Waveform

```tsx
import { AudioWaveform } from '@components/recording';

const [audioLevel, setAudioLevel] = useState(0);
const [isRecording, setIsRecording] = useState(false);

<AudioWaveform
  audioLevel={audioLevel}
  isActive={isRecording}
  barCount={50}
  height={80}
  barWidth={3}
  barSpacing={2}
  useGradient={true}
/>
```

### With Audio Metering

```tsx
import { audioRecorder } from '@services/AudioRecorder';

useEffect(() => {
  if (isRecording) {
    const interval = setInterval(async () => {
      const metering = await audioRecorder.getMetering();
      if (metering) {
        // Normalize -160 to 0 dB → 0 to 1
        const normalized = Math.max(0, Math.min(1, 
          (metering.averagePower + 160) / 160
        ));
        setAudioLevel(normalized);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }
}, [isRecording]);
```

---

## 🎬 Haptic Feedback

### Button Press

```tsx
import * as Haptics from 'expo-haptics';

const handlePress = async () => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  // Your action here
};
```

### Different Feedback Types

```tsx
// Light impact (subtle)
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium impact (standard)
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy impact (strong)
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Success notification
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Error notification
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Warning notification
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
```

---

## 🎯 Spring Animations

### Button Press Animation

```tsx
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

const scale = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

const handlePressIn = () => {
  scale.value = withSpring(0.95, {
    damping: 15,
    stiffness: 150,
  });
};

const handlePressOut = () => {
  scale.value = withSpring(1, {
    damping: 15,
    stiffness: 150,
  });
};

<Animated.View style={animatedStyle}>
  <TouchableOpacity
    onPressIn={handlePressIn}
    onPressOut={handlePressOut}
  >
    <Text>Press Me</Text>
  </TouchableOpacity>
</Animated.View>
```

### Fade In Animation

```tsx
import { withTiming } from 'react-native-reanimated';

const opacity = useSharedValue(0);

useEffect(() => {
  opacity.value = withTiming(1, { duration: 300 });
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));

<Animated.View style={animatedStyle}>
  <Text>Fading In</Text>
</Animated.View>
```

---

## 🎨 Complete Component Example

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@contexts/ThemeContext';
import { typography, elevation, blurIntensity } from '@theme';
import { AudioWaveform } from '@components/recording';

const MyComponent = () => {
  const { theme } = useTheme();
  const [audioLevel, setAudioLevel] = useState(0.5);
  
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Button pressed!');
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Text style={[typography.h2, { color: theme.colors.textPrimary }]}>
        My Component
      </Text>
      
      {/* Card with Elevation */}
      <View style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
        elevation.md,
      ]}>
        <AudioWaveform
          audioLevel={audioLevel}
          isActive={true}
          barCount={40}
          height={60}
        />
      </View>
      
      {/* Button */}
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme.colors.primary },
          elevation.sm,
        ]}
        onPress={handlePress}
      >
        <Text style={[typography.button, { color: '#fff' }]}>
          Press Me
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});

export default MyComponent;
```

---

**Week 1: COMPLETE** ✅

