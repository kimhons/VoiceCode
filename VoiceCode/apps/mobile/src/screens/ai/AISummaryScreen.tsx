// VoiceCode Mobile - AI Summary Screen

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useAppDispatch, useAppSelector } from '@/store';
import { generateSummary } from '@/store/slices/aiSlice';
import { Text } from '@/components/common/Text';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/contexts/ThemeContext';

// Navigation types
type AISummaryScreenRouteProp = RouteProp<
  { AISummary: { transcriptId: string; transcriptText: string } },
  'AISummary'
>;

type AISummaryScreenNavigationProp = StackNavigationProp<any>;

/**
 * AI Summary Screen
 * Displays AI-generated summary of a transcription
 */
export const AISummaryScreen: React.FC = () => {
  const route = useRoute<AISummaryScreenRouteProp>();
  const navigation = useNavigation<AISummaryScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { theme } = useTheme();

  const { transcriptId, transcriptText } = route.params;

  // Get AI state for this transcript
  const transcriptAI = useAppSelector(
    (state) => state.ai.transcripts[transcriptId]
  );

  const summary = transcriptAI?.summary.data;
  const loading = transcriptAI?.summary.loading || false;
  const error = transcriptAI?.summary.error;

  const [isRegenerating, setIsRegenerating] = useState(false);

  // Generate summary on mount if not already generated
  useEffect(() => {
    if (!summary && !loading && !error) {
      dispatch(generateSummary({ transcriptId, transcriptText }));
    }
  }, [transcriptId, transcriptText, summary, loading, error, dispatch]);

  // Set navigation options
  useEffect(() => {
    navigation.setOptions({
      title: 'AI Summary',
    });
  }, [navigation]);

  /**
   * Copy summary to clipboard
   */
  const handleCopy = async () => {
    if (summary) {
      await Clipboard.setStringAsync(summary.summaryText);
      Alert.alert('Success', 'Summary copied to clipboard');
    }
  };

  /**
   * Share summary
   */
  const handleShare = async () => {
    if (summary) {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // In a real implementation, we would create a file and share it
        Alert.alert('Share', 'Sharing functionality coming soon');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    }
  };

  /**
   * Regenerate summary
   */
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await dispatch(generateSummary({ transcriptId, transcriptText })).unwrap();
      Alert.alert('Success', 'Summary regenerated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to regenerate summary');
    } finally {
      setIsRegenerating(false);
    }
  };

  /**
   * Render loading state
   */
  if (loading || isRegenerating) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator
            testID="loading-indicator"
            size="large"
            color={theme.colors.primary}
          />
          <Text variant="body" style={styles.loadingText}>
            {isRegenerating ? 'Regenerating summary...' : 'Generating summary...'}
          </Text>
        </View>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text variant="h6" style={styles.errorTitle}>
            Failed to generate summary
          </Text>
          <Text variant="body" style={styles.errorMessage}>
            {error}
          </Text>
          <Button onPress={handleRegenerate} style={styles.retryButton}>
            Try Again
          </Button>
        </View>
      </View>
    );
  }

  /**
   * Render summary
   */
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Card elevation={2} style={styles.summaryCard}>
        <Text variant="body" style={styles.summaryText}>
          {summary?.summaryText}
        </Text>

        {summary?.confidence && (
          <View style={styles.confidenceContainer}>
            <Text variant="caption" style={styles.confidenceLabel}>
              Confidence:
            </Text>
            <Text variant="captionBold" style={styles.confidenceValue}>
              {(summary.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        )}
      </Card>

      <View style={styles.actionsContainer}>
        <Button
          testID="copy-button"
          onPress={handleCopy}
          variant="secondary"
          style={styles.actionButton}
        >
          <Ionicons name="copy-outline" size={20} color={theme.colors.textPrimary} />
          <Text variant="button" style={styles.buttonText}>
            Copy
          </Text>
        </Button>

        <Button
          testID="share-button"
          onPress={handleShare}
          variant="secondary"
          style={styles.actionButton}
        >
          <Ionicons name="share-outline" size={20} color={theme.colors.textPrimary} />
          <Text variant="button" style={styles.buttonText}>
            Share
          </Text>
        </Button>

        <Button
          testID="regenerate-button"
          onPress={handleRegenerate}
          variant="secondary"
          style={styles.actionButton}
        >
          <Ionicons name="refresh-outline" size={20} color={theme.colors.textPrimary} />
          <Text variant="button" style={styles.buttonText}>
            Regenerate
          </Text>
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  retryButton: {
    marginTop: 24,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 16,
  },
  summaryText: {
    lineHeight: 24,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  confidenceLabel: {
    marginRight: 8,
  },
  confidenceValue: {
    color: '#667eea',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    marginLeft: 4,
  },
});

