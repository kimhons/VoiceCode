// VoiceCode Mobile - Batch Export Screen

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  createBatchExportJob,
  getBatchExportJobs,
} from '../../store/slices/exportSlice';
import { Ionicons } from '@expo/vector-icons';
import { ExportFormat } from '../../services/MobileExportService';

type BatchExportScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'BatchExport'
>;

interface Props {
  navigation: BatchExportScreenNavigationProp;
}

export function BatchExportScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const { batchJobs, batchJobsLoading } = useAppSelector((state) => state.export);

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [selectedTranscripts, setSelectedTranscripts] = useState<string[]>([]);

  useEffect(() => {
    const userId = 'current-user-id'; // TODO: Get from auth context
    dispatch(getBatchExportJobs(userId));
  }, [dispatch]);

  const handleCreateBatchJob = useCallback(async () => {
    if (selectedTranscripts.length === 0) {
      Alert.alert('No Transcripts Selected', 'Please select at least one transcript');
      return;
    }

    try {
      const userId = 'current-user-id'; // TODO: Get from auth context

      await dispatch(
        createBatchExportJob({
          userId,
          transcriptIds: selectedTranscripts,
          format: selectedFormat,
        })
      ).unwrap();

      Alert.alert('Batch Export Started', 'Your batch export job has been created');
      setSelectedTranscripts([]);
    } catch (error) {
      console.error('Batch export error:', error);
      Alert.alert('Error', 'Failed to create batch export job. Please try again.');
    }
  }, [selectedTranscripts, selectedFormat, dispatch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'processing':
        return theme.colors.primary;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.textTertiary;
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'processing':
        return 'sync';
      case 'failed':
        return 'close-circle';
      default:
        return 'time';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text
          variant="h3"
          style={[styles.title, { color: theme.colors.textPrimary }]}
          testID="batch-export-title"
        >
          Batch Export
        </Text>

        <Text
          variant="body"
          style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          testID="batch-export-subtitle"
        >
          Export multiple transcripts at once
        </Text>

        {/* Format Selection */}
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text
            variant="h4"
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
          >
            Export Format
          </Text>
          <View style={styles.formatContainer}>
            {(['pdf', 'docx', 'txt', 'json'] as ExportFormat[]).map((format) => (
              <TouchableOpacity
                key={format}
                style={[
                  styles.formatButton,
                  {
                    backgroundColor:
                      selectedFormat === format
                        ? theme.colors.primary
                        : theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedFormat(format)}
                testID={`format-${format}`}
              >
                <Text
                  variant="button"
                  style={{
                    color:
                      selectedFormat === format
                        ? '#FFFFFF'
                        : theme.colors.textPrimary,
                  }}
                >
                  {format.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCreateBatchJob}
            testID="create-batch-job-button"
          >
            <Ionicons name="cloud-download" size={20} color="#FFFFFF" />
            <Text variant="button" style={styles.createButtonText}>
              Start Batch Export
            </Text>
          </TouchableOpacity>
        </View>

        {/* Batch Jobs List */}
        <View style={styles.jobsSection}>
          <Text
            variant="h4"
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
          >
            Export Jobs
          </Text>

          {batchJobsLoading ? (
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
              testID="batch-jobs-loading"
            />
          ) : batchJobs.length === 0 ? (
            <View style={styles.emptyState} testID="no-batch-jobs">
              <Ionicons
                name="cloud-download-outline"
                size={48}
                color={theme.colors.textTertiary}
              />
              <Text
                variant="body"
                style={[styles.emptyText, { color: theme.colors.textSecondary }]}
              >
                No batch export jobs
              </Text>
            </View>
          ) : (
            batchJobs.map((job) => (
              <View
                key={job.id}
                style={[
                  styles.jobCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                testID={`batch-job-${job.id}`}
              >
                <View style={styles.jobHeader}>
                  <Ionicons
                    name={getStatusIcon(job.status)}
                    size={24}
                    color={getStatusColor(job.status)}
                  />
                  <View style={styles.jobInfo}>
                    <Text
                      variant="h4"
                      style={{ color: theme.colors.textPrimary }}
                      testID={`job-format-${job.id}`}
                    >
                      {job.format.toUpperCase()} Export
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {job.completedCount}/{job.totalCount} completed
                    </Text>
                  </View>
                  <Text
                    variant="caption"
                    style={{ color: getStatusColor(job.status) }}
                    testID={`job-status-${job.id}`}
                  >
                    {job.status.toUpperCase()}
                  </Text>
                </View>

                {job.status === 'processing' && (
                  <View style={styles.progressContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { backgroundColor: theme.colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: theme.colors.primary,
                            width: `${job.progress}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      variant="caption"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {job.progress}%
                    </Text>
                  </View>
                )}

                {job.errorMessage && (
                  <Text
                    variant="bodySmall"
                    style={[styles.errorText, { color: theme.colors.error }]}
                  >
                    {job.errorMessage}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  formatContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  formatButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
  },
  jobsSection: {
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
  },
  jobCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jobInfo: {
    flex: 1,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
  },
  errorText: {
    marginTop: 8,
  },
});

