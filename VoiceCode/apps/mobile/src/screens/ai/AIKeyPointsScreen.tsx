// VoiceCode Mobile - AI Key Points Screen

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
import { extractKeyPoints } from '@/store/slices/aiSlice';
import { Text } from '@/components/common/Text';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/contexts/ThemeContext';

// Navigation types
type AIKeyPointsScreenRouteProp = RouteProp<
  { AIKeyPoints: { transcriptId: string; transcriptText: string } },
  'AIKeyPoints'
>;

type AIKeyPointsScreenNavigationProp = StackNavigationProp<any>;

/**
 * AI Key Points Screen
 * Displays AI-extracted key points from a transcription
 */
export const AIKeyPointsScreen: React.FC = () => {
  const route = useRoute<AIKeyPointsScreenRouteProp>();
  const navigation = useNavigation<AIKeyPointsScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { theme } = useTheme();

  const { transcriptId, transcriptText } = route.params;

  // Get AI state for this transcript
  const transcriptAI = useAppSelector(
    (state) => state.ai.transcripts[transcriptId]
  );

  const keyPoints = transcriptAI?.keyPoints.data;
  const loading = transcriptAI?.keyPoints.loading || false;
  const error = transcriptAI?.keyPoints.error;

  const [isRegenerating, setIsRegenerating] = useState(false);

  // Extract key points on mount if not already extracted
  useEffect(() => {
    if (!keyPoints && !loading && !error) {
      dispatch(extractKeyPoints({ transcriptId, transcriptText }));
    }
  }, [transcriptId, transcriptText, keyPoints, loading, error, dispatch]);

  // Set navigation options
  useEffect(() => {
    navigation.setOptions({
      title: 'Key Points',
    });
  }, [navigation]);

  /**
   * Copy all key points to clipboard
   */
  const handleCopyAll = async () => {
    if (keyPoints) {
      const text = keyPoints.keyPoints
        .map((point, index) => `${index + 1}. ${point}`)
        .join('\n');
      await Clipboard.setStringAsync(text);
      Alert.alert('Success', 'Key points copied to clipboard');
    }
  };

  /**
   * Copy single key point to clipboard
   */
  const handleCopyPoint = async (point: string) => {
    await Clipboard.setStringAsync(point);
    Alert.alert('Success', 'Key point copied to clipboard');
  };

  /**
   * Share key points
   */
  const handleShare = async () => {
    if (keyPoints) {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        Alert.alert('Share', 'Sharing functionality coming soon');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    }
  };

  /**
   * Regenerate key points
   */
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await dispatch(extractKeyPoints({ transcriptId, transcriptText })).unwrap();
      Alert.alert('Success', 'Key points regenerated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to regenerate key points');
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
            {isRegenerating ? 'Regenerating key points...' : 'Extracting key points...'}
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
            Failed to extract key points
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
   * Render key points
   */
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Key Points List */}
      <Card elevation={2} style={styles.keyPointsCard}>
        {keyPoints?.keyPoints.map((point, index) => (
          <View key={index} style={styles.keyPointItem}>
            <View style={styles.keyPointContent}>
              <View style={[styles.bullet, { backgroundColor: theme.colors.primary }]} />
              <Text variant="body" style={styles.keyPointText}>
                {point}
              </Text>
            </View>
            <TouchableOpacity
              testID={`copy-point-${index}`}
              onPress={() => handleCopyPoint(point)}
              style={styles.copyIconButton}
            >
              <Ionicons name="copy-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}

        {keyPoints?.confidence && (
          <View style={styles.confidenceContainer}>
            <Text variant="caption" style={styles.confidenceLabel}>
              Confidence:
            </Text>
            <Text variant="captionBold" style={styles.confidenceValue}>
              {(keyPoints.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        )}
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          testID="copy-all-button"
          onPress={handleCopyAll}
          variant="secondary"
          style={styles.actionButton}
        >
          <Ionicons name="copy-outline" size={20} color={theme.colors.textPrimary} />
          <Text variant="button" style={styles.buttonText}>
            Copy All
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
  keyPointsCard: {
    padding: 16,
    marginBottom: 16,
  },
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  keyPointContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  keyPointText: {
    flex: 1,
    lineHeight: 22,
  },
  copyIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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

