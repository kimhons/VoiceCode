// VoiceCode Mobile - Review Screen
// Phase 0: Stub Screen

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector } from '../../store';
import { Text, Card, Button } from '../../components/common';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';

type ReviewScreenRouteProp = RouteProp<HomeStackParamList, 'ReviewScreen'>;

export const ReviewScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<ReviewScreenRouteProp>();
  const navigation = useNavigation();
  const { recordingId } = route.params;
  
  const { recordings } = useAppSelector(state => state.recording);
  const recording = recordings.find(r => r.id === recordingId);

  const [isPlaying, setIsPlaying] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      marginBottom: theme.spacing.sm,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.xs,
    },
    playButton: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
    },
  });

  if (!recording) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text variant="h6">Recording not found</Text>
        </View>
      </View>
    );
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text variant="h5" style={styles.sectionTitle}>
            {recording.title}
          </Text>
          
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <Text variant="h6" color="#fff">
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </Text>
          </TouchableOpacity>

          <Card>
            <View style={styles.infoRow}>
              <Text variant="body" color={theme.colors.textSecondary}>Duration</Text>
              <Text variant="body">{formatDuration(recording.duration)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="body" color={theme.colors.textSecondary}>File Size</Text>
              <Text variant="body">{formatFileSize(recording.fileSize)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="body" color={theme.colors.textSecondary}>Created</Text>
              <Text variant="body">{new Date(recording.createdAt).toLocaleDateString()}</Text>
            </View>
          </Card>
        </View>

        {recording.transcription && (
          <View style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>
              Transcription
            </Text>
            <Card>
              <Text variant="body">{recording.transcription}</Text>
            </Card>
          </View>
        )}

        <View style={styles.actionButtons}>
          <Button 
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
          >
            Save
          </Button>
          <Button 
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
          >
            Discard
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

