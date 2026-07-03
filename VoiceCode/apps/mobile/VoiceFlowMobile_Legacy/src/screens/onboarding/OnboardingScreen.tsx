// VoiceCode Pro Mobile - Onboarding Screen

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  ViewToken,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { Text, Button } from '../../components/common';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const ONBOARDING_KEY = '@VoiceCode_onboarding_complete';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Record Anywhere',
    description: 'Capture your thoughts, meetings, and ideas with high-quality audio recording.',
    emoji: '🎙️',
  },
  {
    id: '2',
    title: 'Instant Transcription',
    description: 'Get accurate transcriptions in real-time with support for multiple languages.',
    emoji: '📝',
  },
  {
    id: '3',
    title: 'AI-Powered Enhancement',
    description: 'Transform your transcriptions with AI - adjust tone, context, and style instantly.',
    emoji: '✨',
  },
  {
    id: '4',
    title: 'Sync Everywhere',
    description: 'Access your recordings and transcriptions across all your devices seamlessly.',
    emoji: '☁️',
  },
];

export const OnboardingScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    // Mark onboarding as complete
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    // Navigate to permissions screen
    navigation.navigate('Permissions');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text
          variant="h2"
          align="center"
          color={theme.colors.textPrimary}
          style={styles.title}
        >
          {item.title}
        </Text>
        <Text
          variant="body"
          align="center"
          color={theme.colors.textSecondary}
          style={styles.description}
        >
          {item.description}
        </Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor:
                index === currentIndex
                  ? theme.colors.primary
                  : theme.colors.border,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {renderPagination()}

      <View style={styles.footer}>
        {!isLastSlide && (
          <Button
            variant="ghost"
            onPress={handleSkip}
            style={styles.skipButton}
          >
            Skip
          </Button>
        )}

        <Button
          variant="primary"
          onPress={handleNext}
          fullWidth={isLastSlide}
          style={styles.nextButton}
        >
          {isLastSlide ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 120,
    marginBottom: 40,
  },
  title: {
    marginBottom: 16,
  },
  description: {
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  skipButton: {
    flex: 1,
    marginRight: 12,
  },
  nextButton: {
    flex: 2,
  },
});

