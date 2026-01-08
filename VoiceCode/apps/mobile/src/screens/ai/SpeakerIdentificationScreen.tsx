// VoiceFlow Pro Mobile - Speaker Identification Screen

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { identifySpeakers, updateSpeaker } from '@/store/slices/aiSlice';
import { Text } from '@/components/common/Text';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/contexts/ThemeContext';
import type { Speaker } from '@/services/AIMLService';

// Navigation types
type SpeakerIdentificationScreenRouteProp = RouteProp<
  { SpeakerIdentification: { transcriptId: string; transcriptText: string } },
  'SpeakerIdentification'
>;

type SpeakerIdentificationScreenNavigationProp = StackNavigationProp<any>;

// Predefined speaker colors
const SPEAKER_COLORS = [
  '#667eea', // Purple
  '#f59e0b', // Orange
  '#10b981', // Green
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
];

/**
 * Speaker Identification Screen
 * Configure and view speaker labels for a transcription
 */
export const SpeakerIdentificationScreen: React.FC = () => {
  const route = useRoute<SpeakerIdentificationScreenRouteProp>();
  const navigation = useNavigation<SpeakerIdentificationScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { theme } = useTheme();

  const { transcriptId, transcriptText } = route.params;

  // Get AI state for this transcript
  const transcriptAI = useAppSelector(
    (state) => state.ai.transcripts[transcriptId]
  );

  const speakers = transcriptAI?.speakers.data || [];
  const loading = transcriptAI?.speakers.loading || false;
  const error = transcriptAI?.speakers.error;

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');

  // Identify speakers on mount if not already identified
  useEffect(() => {
    if (speakers.length === 0 && !loading && !error) {
      dispatch(identifySpeakers({ transcriptId, transcriptText }));
    }
  }, [transcriptId, transcriptText, speakers.length, loading, error, dispatch]);

  // Set navigation options
  useEffect(() => {
    navigation.setOptions({
      title: 'Speaker Identification',
    });
  }, [navigation]);

  /**
   * Open edit modal for speaker
   */
  const handleEditSpeaker = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    setEditLabel(speaker.label);
    setEditColor(speaker.color);
  };

  /**
   * Save speaker changes
   */
  const handleSaveSpeaker = async () => {
    if (editingSpeaker) {
      try {
        await dispatch(
          updateSpeaker({
            transcriptId,
            id: editingSpeaker.id,
            label: editLabel,
            color: editColor,
          })
        ).unwrap();
        setEditingSpeaker(null);
        Alert.alert('Success', 'Speaker updated successfully');
      } catch (err) {
        Alert.alert('Error', 'Failed to update speaker');
      }
    }
  };

  /**
   * Regenerate speaker identification
   */
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await dispatch(identifySpeakers({ transcriptId, transcriptText })).unwrap();
      Alert.alert('Success', 'Speakers re-identified successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to re-identify speakers');
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
            {isRegenerating ? 'Re-identifying speakers...' : 'Identifying speakers...'}
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
            Failed to identify speakers
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
  if (speakers.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
          <Text variant="h6" style={styles.emptyTitle}>
            No speakers detected
          </Text>
          <Text variant="body" style={styles.emptyMessage}>
            This transcript doesn't contain multiple speakers.
          </Text>
          <Button onPress={handleRegenerate} style={styles.retryButton}>
            Try Again
          </Button>
        </View>
      </View>
    );
  }

  /**
   * Render speakers list
   */
  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Card */}
        <Card elevation={1} style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <Text variant="body" style={styles.infoText}>
              Tap on a speaker to edit their name and color
            </Text>
          </View>
        </Card>

        {/* Speakers List */}
        {speakers.map((speaker) => (
          <Card key={speaker.id} elevation={2} style={styles.speakerCard}>
            <TouchableOpacity
              testID={`speaker-${speaker.id}`}
              onPress={() => handleEditSpeaker(speaker)}
              style={styles.speakerContent}
            >
              <View style={styles.speakerHeader}>
                <View style={[styles.colorIndicator, { backgroundColor: speaker.color }]} />
                <View style={styles.speakerInfo}>
                  <Text variant="h6" style={styles.speakerLabel}>
                    {speaker.label}
                  </Text>
                  <Text variant="caption" style={styles.segmentCount}>
                    {speaker.segmentCount} {speaker.segmentCount === 1 ? 'segment' : 'segments'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </Card>
        ))}

        {/* Regenerate Button */}
        <Button
          testID="regenerate-button"
          onPress={handleRegenerate}
          variant="secondary"
          style={styles.regenerateButton}
        >
          <Ionicons name="refresh-outline" size={20} color={theme.colors.textPrimary} />
          <Text variant="button" style={styles.buttonText}>
            Re-identify Speakers
          </Text>
        </Button>
      </ScrollView>

      {/* Edit Speaker Modal */}
      <Modal
        visible={editingSpeaker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingSpeaker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <Text variant="h5" style={styles.modalTitle}>
              Edit Speaker
            </Text>

            {/* Speaker Name Input */}
            <Text variant="label" style={styles.inputLabel}>
              Speaker Name
            </Text>
            <TextInput
              testID="speaker-name-input"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                },
              ]}
              value={editLabel}
              onChangeText={setEditLabel}
              placeholder="Enter speaker name"
              placeholderTextColor={theme.colors.textSecondary}
            />

            {/* Color Picker */}
            <Text variant="label" style={styles.inputLabel}>
              Speaker Color
            </Text>
            <View style={styles.colorPicker}>
              {SPEAKER_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  testID={`color-${color}`}
                  onPress={() => setEditColor(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    editColor === color && styles.colorOptionSelected,
                  ]}
                >
                  {editColor === color && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                testID="cancel-button"
                onPress={() => setEditingSpeaker(null)}
                variant="secondary"
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                testID="save-button"
                onPress={handleSaveSpeaker}
                style={styles.modalButton}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  infoCard: {
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    flex: 1,
    opacity: 0.8,
  },
  speakerCard: {
    marginBottom: 12,
  },
  speakerContent: {
    padding: 16,
  },
  speakerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  speakerInfo: {
    flex: 1,
  },
  speakerLabel: {
    marginBottom: 4,
  },
  segmentCount: {
    opacity: 0.7,
  },
  regenerateButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  inputLabel: {
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
});

