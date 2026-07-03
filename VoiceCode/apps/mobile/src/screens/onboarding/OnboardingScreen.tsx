// VoiceCode Mobile - Onboarding Screen

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  ViewToken,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { Text, Button } from '../../components/common';

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

// React Navigation passes `navigation` as a prop to screens registered via
// `component={...}`. The prop is preferred; the hook is a fallback for standalone use.
type OnboardingScreenProps = Partial<StackScreenProps<RootStackParamList, 'Onboarding'>>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: [string, string];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Record Anywhere',
    description: 'Capture your thoughts, meetings, and ideas with crystal-clear audio recording.',
    icon: 'mic',
    gradientColors: ['#667eea', '#764ba2'],
  },
  {
    id: '2',
    title: 'Instant Transcription',
    description: 'Get accurate transcriptions in real-time with support for 50+ languages.',
    icon: 'document-text',
    gradientColors: ['#f093fb', '#f5576c'],
  },
  {
    id: '3',
    title: 'AI-Powered Enhancement',
    description:
      'Transform your transcriptions with AI — adjust tone, summarize, and extract insights.',
    icon: 'sparkles',
    gradientColors: ['#4facfe', '#00f2fe'],
  },
  {
    id: '4',
    title: 'Sync Everywhere',
    description: 'Access your recordings and transcriptions across all your devices seamlessly.',
    icon: 'cloud-done',
    gradientColors: ['#43e97b', '#38f9d7'],
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  navigation: navigationProp,
}) => {
  const { theme } = useTheme();
  const hookNavigation = useNavigation<OnboardingNavigationProp>();
  const navigation = navigationProp ?? hookNavigation;
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  const getItemLayout = (_data: ArrayLike<OnboardingSlide> | null | undefined, index: number) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  });

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    // Navigate to permissions screen where onboarding will be completed
    navigation.navigate('Permissions');
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer} testID={`slide-${index + 1}-image`}>
          <LinearGradient
            colors={item.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons name={item.icon} size={48} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <Text variant="h2" align="center" color={theme.colors.textPrimary} style={styles.title}>
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
          testID={`pagination-dot-${index}`}
          accessibilityState={{ selected: index === currentIndex }}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentIndex ? theme.colors.primary : theme.colors.border,
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
        testID="onboarding-slider"
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        bounces={false}
      />

      {renderPagination()}

      <View style={styles.footer}>
        {!isLastSlide && (
          <Button
            variant="ghost"
            onPress={handleSkip}
            style={styles.skipButton}
            testID="skip-button"
            accessibilityLabel="Skip onboarding"
          >
            Skip
          </Button>
        )}

        <Button
          variant="primary"
          onPress={handleNext}
          fullWidth={isLastSlide}
          style={styles.nextButton}
          testID={isLastSlide ? 'get-started-button' : 'next-button'}
          accessibilityLabel={isLastSlide ? 'Get started' : 'Next slide'}
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
  iconContainer: {
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
