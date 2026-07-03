// VoiceCode Mobile - AI Action Items Screen

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
import * as Sharing from 'expo-sharing';
import { useAppDispatch, useAppSelector } from '@/store';
import { extractActionItems, updateActionItem } from '@/store/slices/aiSlice';
import { Text } from '@/components/common/Text';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/contexts/ThemeContext';
import type { ActionItem } from '@/services/AIMLService';

// Navigation types
type AIActionItemsScreenRouteProp = RouteProp<
  { AIActionItems: { transcriptId: string; transcriptText: string } },
  'AIActionItems'
>;

type AIActionItemsScreenNavigationProp = StackNavigationProp<any>;

/**
 * AI Action Items Screen
 * Displays AI-extracted action items from a transcription
 */
export const AIActionItemsScreen: React.FC = () => {
  const route = useRoute<AIActionItemsScreenRouteProp>();
  const navigation = useNavigation<AIActionItemsScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { theme } = useTheme();

  const { transcriptId, transcriptText } = route.params;

  // Get AI state for this transcript
  const transcriptAI = useAppSelector(
    (state) => state.ai.transcripts[transcriptId]
  );

  const actionItems = transcriptAI?.actionItems.data || [];
  const loading = transcriptAI?.actionItems.loading || false;
  const error = transcriptAI?.actionItems.error;

  const [isRegenerating, setIsRegenerating] = useState(false);

  // Extract action items on mount if not already extracted
  useEffect(() => {
    if (actionItems.length === 0 && !loading && !error) {
      dispatch(extractActionItems({ transcriptId, transcriptText }));
    }
  }, [transcriptId, transcriptText, actionItems.length, loading, error, dispatch]);

  // Set navigation options
  useEffect(() => {
    navigation.setOptions({
      title: 'Action Items',
    });
  }, [navigation]);

  /**
   * Toggle action item completion status
   */
  const handleToggleComplete = async (item: ActionItem) => {
    try {
      await dispatch(
        updateActionItem({
          transcriptId,
          id: item.id,
          updates: { completed: !item.completed },
        })
      ).unwrap();
    } catch (err) {
      Alert.alert('Error', 'Failed to update action item');
    }
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return theme.colors.textSecondary;
    }
  };

  /**
   * Share action items
   */
  const handleShare = async () => {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      Alert.alert('Share', 'Sharing functionality coming soon');
    } else {
      Alert.alert('Error', 'Sharing is not available on this device');
    }
  };

  /**
   * Regenerate action items
   */
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await dispatch(extractActionItems({ transcriptId, transcriptText })).unwrap();
      Alert.alert('Success', 'Action items regenerated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to regenerate action items');
    } finally {
      setIsRegenerating(false);
    }
  };

  /**
   * Add to calendar (placeholder)
   */
  const handleAddToCalendar = (item: ActionItem) => {
    Alert.alert('Add to Calendar', 'Calendar integration coming soon');
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
            {isRegenerating ? 'Regenerating action items...' : 'Extracting action items...'}
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
            Failed to extract action items
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
   * Render empty state
   */
  if (actionItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Ionicons name="checkmark-circle-outline" size={64} color={theme.colors.textSecondary} />
          <Text variant="h6" style={styles.emptyTitle}>
            No action items found
          </Text>
          <Text variant="body" style={styles.emptyMessage}>
            This transcript doesn&apos;t contain any action items.
          </Text>
          <Button onPress={handleRegenerate} style={styles.retryButton}>
            Try Again
          </Button>
        </View>
      </View>
    );
  }

  /**
   * Render action items
   */
  const completedItems = actionItems.filter((item) => item.completed);
  const pendingItems = actionItems.filter((item) => !item.completed);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Statistics */}
      <Card elevation={1} style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="h4" style={styles.statValue}>
              {pendingItems.length}
            </Text>
            <Text variant="caption" style={styles.statLabel}>
              Pending
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="h4" style={styles.statValue}>
              {completedItems.length}
            </Text>
            <Text variant="caption" style={styles.statLabel}>
              Completed
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="h4" style={styles.statValue}>
              {actionItems.length}
            </Text>
            <Text variant="caption" style={styles.statLabel}>
              Total
            </Text>
          </View>
        </View>
      </Card>

      {/* Pending Action Items */}
      {pendingItems.length > 0 && (
        <>
          <Text variant="h6" style={styles.sectionTitle}>
            Pending
          </Text>
          {pendingItems.map((item) => (
            <Card key={item.id} elevation={2} style={styles.actionItemCard}>
              <View style={styles.actionItemHeader}>
                <TouchableOpacity
                  testID={`checkbox-${item.id}`}
                  onPress={() => handleToggleComplete(item)}
                  style={styles.checkbox}
                >
                  <Ionicons
                    name="square-outline"
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
                <View style={styles.actionItemContent}>
                  <Text variant="body" style={styles.actionItemText}>
                    {item.text}
                  </Text>
                  {item.priority && (
                    <View style={styles.priorityBadge}>
                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: getPriorityColor(item.priority) },
                        ]}
                      />
                      <Text
                        variant="caption"
                        style={[
                          styles.priorityText,
                          { color: getPriorityColor(item.priority) },
                        ]}
                      >
                        {item.priority.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {item.dueDate && (
                <View style={styles.dueDateContainer}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                  <Text variant="caption" style={styles.dueDateText}>
                    Due: {new Date(item.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                testID={`calendar-${item.id}`}
                onPress={() => handleAddToCalendar(item)}
                style={styles.calendarButton}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                <Text variant="caption" style={styles.calendarButtonText}>
                  Add to Calendar
                </Text>
              </TouchableOpacity>
            </Card>
          ))}
        </>
      )}

      {/* Completed Action Items */}
      {completedItems.length > 0 && (
        <>
          <Text variant="h6" style={styles.sectionTitle}>
            Completed
          </Text>
          {completedItems.map((item) => (
            <Card key={item.id} elevation={1} style={styles.actionItemCard}>
              <View style={styles.actionItemHeader}>
                <TouchableOpacity
                  testID={`checkbox-${item.id}`}
                  onPress={() => handleToggleComplete(item)}
                  style={styles.checkbox}
                >
                  <Ionicons
                    name="checkbox"
                    size={24}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
                <View style={styles.actionItemContent}>
                  <Text
                    variant="body"
                    style={[styles.actionItemText, styles.completedText]}
                  >
                    {item.text}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
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
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  retryButton: {
    marginTop: 24,
  },
  statsCard: {
    padding: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    marginTop: 4,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
  },
  actionItemCard: {
    padding: 16,
    marginBottom: 12,
  },
  actionItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  actionItemContent: {
    flex: 1,
  },
  actionItemText: {
    lineHeight: 22,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 36,
  },
  dueDateText: {
    marginLeft: 6,
    opacity: 0.7,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginLeft: 36,
  },
  calendarButtonText: {
    marginLeft: 6,
    color: '#667eea',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
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

