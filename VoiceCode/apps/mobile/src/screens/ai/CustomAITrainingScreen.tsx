/**
 * Custom AI Training Screen
 * Phase 3 Week 10 Day 64-65: AI Model Management
 * 
 * Comprehensive AI model training and fine-tuning with 5 tabs:
 * - Data: Training data management
 * - Training: Fine-tuning interface
 * - Evaluation: Model evaluation metrics
 * - Testing: A/B testing
 * - Deployment: Deployment controls
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
// Simple ProgressBar component
const ProgressBar = ({ progress, color, style }: { progress: number; color: string; style?: any }) => (
  <View style={[{ height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' }, style]}>
    <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
  </View>
);
import { useAppDispatch, useAppSelector } from '../../store';
import {
  uploadTrainingData,
  validateTrainingData,
  startTraining,
  fetchTrainingStatus,
  evaluateModel,
  deployModel,
  rollbackModel,
  clearEvaluation,
} from '../../store/slices/aiTrainingSlice';
import { fetchAvailableModels } from '../../store/slices/aiModelSlice';
import { TrainingData, TrainingConfig, DeploymentStatus } from '../../services/aiTrainingService';

const { width } = Dimensions.get('window');

type TabType = 'data' | 'training' | 'evaluation' | 'testing' | 'deployment';

export default function CustomAITrainingScreen() {
  const dispatch = useAppDispatch();
  const {
    trainingData,
    trainingJobs,
    currentJob,
    evaluationResults,
    deployedModels,
    loading,
    error,
  } = useAppSelector((state) => state.aiTraining);
  const { availableModels } = useAppSelector((state) => state.aiModel);

  const [activeTab, setActiveTab] = useState<TabType>('data');
  const [newDataName, setNewDataName] = useState('');
  const [newDataDescription, setNewDataDescription] = useState('');
  const [selectedBaseModel, setSelectedBaseModel] = useState('');
  const [selectedTrainingData, setSelectedTrainingData] = useState('');
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    epochs: 3,
    batch_size: 8,
    learning_rate: 0.0001,
    validation_split: 0.2,
    early_stopping: true,
  });
  const [deploymentConfig, setDeploymentConfig] = useState({
    name: '',
    version: '1.0.0',
    deployment_status: 'draft' as DeploymentStatus,
  });

  useEffect(() => {
    dispatch(fetchAvailableModels());
  }, []);

  useEffect(() => {
    if (currentJob && currentJob.status === 'training') {
      const interval = setInterval(() => {
        dispatch(fetchTrainingStatus(currentJob.id));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentJob]);

  const handleUploadData = () => {
    if (!newDataName.trim()) {
      Alert.alert('Error', 'Please enter a name for the training data');
      return;
    }

    const data: Omit<TrainingData, 'id' | 'created_at' | 'updated_at'> = {
      name: newDataName,
      description: newDataDescription,
      audio_files: [],
      transcripts: [],
      metadata: {},
      validation_status: 'pending',
      file_count: 0,
      total_duration: 0,
    };

    dispatch(uploadTrainingData(data));
    setNewDataName('');
    setNewDataDescription('');
    Alert.alert('Success', 'Training data uploaded successfully');
  };

  const handleValidateData = (dataId: string) => {
    dispatch(validateTrainingData(dataId));
  };

  const handleStartTraining = () => {
    if (!selectedBaseModel) {
      Alert.alert('Error', 'Please select a base model');
      return;
    }
    if (!selectedTrainingData) {
      Alert.alert('Error', 'Please select training data');
      return;
    }

    dispatch(startTraining({
      name: `Fine-tuned ${selectedBaseModel}`,
      base_model_id: selectedBaseModel,
      training_data_id: selectedTrainingData,
      training_config: trainingConfig,
    }));
    setActiveTab('training');
  };

  const handleEvaluateModel = (modelId: string) => {
    const testDataId = trainingData[0]?.id || 'test_data_1';
    dispatch(evaluateModel({ modelId, testDataId }));
    setActiveTab('evaluation');
  };

  const handleDeployModel = () => {
    if (!currentJob) {
      Alert.alert('Error', 'No training job selected');
      return;
    }
    if (!deploymentConfig.name.trim()) {
      Alert.alert('Error', 'Please enter a deployment name');
      return;
    }

    dispatch(deployModel({
      name: deploymentConfig.name,
      version: deploymentConfig.version,
      base_model_id: currentJob.base_model_id,
      training_job_id: currentJob.id,
      deployment_status: deploymentConfig.deployment_status,
    }));
    Alert.alert('Success', `Model deployed to ${deploymentConfig.deployment_status}`);
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['data', 'training', 'evaluation', 'testing', 'deployment'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDataTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training Data Management</Text>
        <Text style={styles.sectionSubtitle}>
          Upload and manage training data for fine-tuning
        </Text>
      </View>

      {/* Upload New Data */}
      <View style={styles.uploadSection}>
        <Text style={styles.uploadTitle}>Upload New Training Data</Text>

        <TextInput
          style={styles.input}
          placeholder="Data Name"
          value={newDataName}
          onChangeText={setNewDataName}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={newDataDescription}
          onChangeText={setNewDataDescription}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadData}>
          <Text style={styles.uploadButtonText}>Upload Data</Text>
        </TouchableOpacity>
      </View>

      {/* Existing Training Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Existing Training Data</Text>
      </View>

      {trainingData.map((data) => (
        <View key={data.id} style={styles.dataCard}>
          <View style={styles.dataHeader}>
            <Text style={styles.dataName}>{data.name}</Text>
            <View style={[
              styles.statusBadge,
              data.validation_status === 'valid' && styles.statusBadgeValid,
              data.validation_status === 'invalid' && styles.statusBadgeInvalid,
            ]}>
              <Text style={styles.statusBadgeText}>{data.validation_status}</Text>
            </View>
          </View>

          <Text style={styles.dataDescription}>{data.description}</Text>

          <View style={styles.dataMetrics}>
            <View style={styles.dataMetric}>
              <Text style={styles.dataMetricLabel}>Files</Text>
              <Text style={styles.dataMetricValue}>{data.file_count}</Text>
            </View>
            <View style={styles.dataMetric}>
              <Text style={styles.dataMetricLabel}>Duration</Text>
              <Text style={styles.dataMetricValue}>{data.total_duration} min</Text>
            </View>
          </View>

          {data.validation_status === 'pending' && (
            <TouchableOpacity
              style={styles.validateButton}
              onPress={() => handleValidateData(data.id)}
            >
              <Text style={styles.validateButtonText}>Validate Data</Text>
            </TouchableOpacity>
          )}

          {data.validation_status === 'valid' && (
            <TouchableOpacity
              style={[
                styles.selectDataButton,
                selectedTrainingData === data.id && styles.selectDataButtonActive,
              ]}
              onPress={() => setSelectedTrainingData(data.id)}
            >
              <Text style={styles.selectDataButtonText}>
                {selectedTrainingData === data.id ? 'Selected' : 'Select for Training'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {trainingData.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No training data uploaded yet</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderTrainingTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fine-Tuning Configuration</Text>
        <Text style={styles.sectionSubtitle}>
          Configure and start model training
        </Text>
      </View>

      {/* Model Selection */}
      <View style={styles.configSection}>
        <Text style={styles.configLabel}>Base Model</Text>
        <View style={styles.modelSelector}>
          {availableModels.map((model) => (
            <TouchableOpacity
              key={model.id}
              style={[
                styles.modelOption,
                selectedBaseModel === model.id && styles.modelOptionActive,
              ]}
              onPress={() => setSelectedBaseModel(model.id)}
            >
              <Text style={styles.modelOptionIcon}>{model.icon}</Text>
              <Text style={styles.modelOptionName}>{model.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Training Configuration */}
      <View style={styles.configSection}>
        <Text style={styles.configLabel}>Training Parameters</Text>

        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Epochs</Text>
          <View style={styles.paramControl}>
            <TouchableOpacity
              style={styles.paramButton}
              onPress={() => setTrainingConfig(prev => ({
                ...prev,
                epochs: Math.max(1, prev.epochs - 1)
              }))}
            >
              <Text style={styles.paramButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.paramValue}>{trainingConfig.epochs}</Text>
            <TouchableOpacity
              style={styles.paramButton}
              onPress={() => setTrainingConfig(prev => ({
                ...prev,
                epochs: Math.min(10, prev.epochs + 1)
              }))}
            >
              <Text style={styles.paramButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Batch Size</Text>
          <View style={styles.paramControl}>
            <TouchableOpacity
              style={styles.paramButton}
              onPress={() => setTrainingConfig(prev => ({
                ...prev,
                batch_size: Math.max(1, prev.batch_size - 1)
              }))}
            >
              <Text style={styles.paramButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.paramValue}>{trainingConfig.batch_size}</Text>
            <TouchableOpacity
              style={styles.paramButton}
              onPress={() => setTrainingConfig(prev => ({
                ...prev,
                batch_size: Math.min(32, prev.batch_size + 1)
              }))}
            >
              <Text style={styles.paramButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Learning Rate</Text>
          <Text style={styles.paramValue}>{trainingConfig.learning_rate}</Text>
        </View>

        <View style={styles.paramRow}>
          <Text style={styles.paramLabel}>Validation Split</Text>
          <Text style={styles.paramValue}>{(trainingConfig.validation_split * 100).toFixed(0)}%</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.startTrainingButton}
        onPress={handleStartTraining}
        disabled={!selectedBaseModel || !selectedTrainingData}
      >
        <Text style={styles.startTrainingButtonText}>Start Training</Text>
      </TouchableOpacity>

      {/* Current Training Job */}
      {currentJob && (
        <View style={styles.trainingJobSection}>
          <Text style={styles.sectionTitle}>Current Training Job</Text>

          <View style={styles.jobCard}>
            <Text style={styles.jobName}>{currentJob.name}</Text>
            <Text style={styles.jobStatus}>Status: {currentJob.status}</Text>

            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Progress</Text>
              <ProgressBar
                progress={currentJob.progress / 100}
                color="#4CAF50"
                style={styles.progressBar}
              />
              <Text style={styles.progressText}>{currentJob.progress}%</Text>
            </View>

            {currentJob.metrics && (
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Loss</Text>
                  <Text style={styles.metricValue}>{currentJob.metrics.loss.toFixed(4)}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Accuracy</Text>
                  <Text style={styles.metricValue}>{currentJob.metrics.accuracy.toFixed(2)}%</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>WER</Text>
                  <Text style={styles.metricValue}>{currentJob.metrics.word_error_rate.toFixed(2)}%</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderEvaluationTab = () => {
    if (!evaluationResults) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No evaluation results available. Train a model first.
          </Text>
          {currentJob && currentJob.status === 'completed' && (
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => handleEvaluateModel(currentJob.id)}
            >
              <Text style={styles.emptyStateButtonText}>Evaluate Model</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Evaluation Results</Text>
          <Text style={styles.sectionSubtitle}>
            Performance metrics on test data
          </Text>
        </View>

        {/* Metrics Overview */}
        <View style={styles.metricsOverview}>
          <View style={styles.metricOverviewCard}>
            <Text style={styles.metricOverviewLabel}>Accuracy</Text>
            <Text style={styles.metricOverviewValue}>
              {evaluationResults.metrics.accuracy.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.metricOverviewCard}>
            <Text style={styles.metricOverviewLabel}>WER</Text>
            <Text style={styles.metricOverviewValue}>
              {evaluationResults.metrics.word_error_rate.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.metricOverviewCard}>
            <Text style={styles.metricOverviewLabel}>F1 Score</Text>
            <Text style={styles.metricOverviewValue}>
              {evaluationResults.metrics.f1_score.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Detailed Metrics */}
        <View style={styles.detailedMetrics}>
          <Text style={styles.sectionTitle}>Detailed Metrics</Text>

          <View style={styles.metricRow}>
            <Text style={styles.metricRowLabel}>Character Error Rate</Text>
            <Text style={styles.metricRowValue}>
              {evaluationResults.metrics.character_error_rate.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricRowLabel}>Precision</Text>
            <Text style={styles.metricRowValue}>
              {evaluationResults.metrics.precision.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricRowLabel}>Recall</Text>
            <Text style={styles.metricRowValue}>
              {evaluationResults.metrics.recall.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Sample Predictions */}
        <View style={styles.samplesSection}>
          <Text style={styles.sectionTitle}>Sample Predictions</Text>

          {evaluationResults.sample_predictions.map((sample, index) => (
            <View key={index} style={styles.sampleCard}>
              <Text style={styles.sampleAudio}>🎵 {sample.audio_file}</Text>

              <View style={styles.sampleComparison}>
                <View style={styles.sampleColumn}>
                  <Text style={styles.sampleLabel}>Expected</Text>
                  <Text style={styles.sampleText}>{sample.expected}</Text>
                </View>
                <View style={styles.sampleColumn}>
                  <Text style={styles.sampleLabel}>Predicted</Text>
                  <Text style={styles.sampleText}>{sample.predicted}</Text>
                </View>
              </View>

              <View style={styles.sampleConfidence}>
                <Text style={styles.confidenceLabel}>Confidence</Text>
                <ProgressBar
                  progress={sample.confidence}
                  color="#4CAF50"
                  style={styles.confidenceBar}
                />
                <Text style={styles.confidenceText}>
                  {(sample.confidence * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderTestingTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>A/B Testing</Text>
        <Text style={styles.sectionSubtitle}>
          Compare model performance in production
        </Text>
      </View>

      <View style={styles.comingSoonContainer}>
        <Text style={styles.comingSoonIcon}>🧪</Text>
        <Text style={styles.comingSoonTitle}>A/B Testing</Text>
        <Text style={styles.comingSoonText}>
          A/B testing functionality will be available soon. You&apos;ll be able to:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>• Compare two models side-by-side</Text>
          <Text style={styles.featureItem}>• Split traffic between models</Text>
          <Text style={styles.featureItem}>• Track performance metrics</Text>
          <Text style={styles.featureItem}>• Automatically select the winner</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderDeploymentTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model Deployment</Text>
        <Text style={styles.sectionSubtitle}>
          Deploy trained models to production
        </Text>
      </View>

      {/* Deployment Configuration */}
      {currentJob && currentJob.status === 'completed' && (
        <View style={styles.deploymentConfig}>
          <Text style={styles.configLabel}>Deployment Configuration</Text>

          <TextInput
            style={styles.input}
            placeholder="Deployment Name"
            value={deploymentConfig.name}
            onChangeText={(text) => setDeploymentConfig(prev => ({ ...prev, name: text }))}
          />

          <TextInput
            style={styles.input}
            placeholder="Version (e.g., 1.0.0)"
            value={deploymentConfig.version}
            onChangeText={(text) => setDeploymentConfig(prev => ({ ...prev, version: text }))}
          />

          <Text style={styles.configLabel}>Deployment Environment</Text>
          <View style={styles.environmentSelector}>
            {(['draft', 'staging', 'production'] as DeploymentStatus[]).map((env) => (
              <TouchableOpacity
                key={env}
                style={[
                  styles.environmentOption,
                  deploymentConfig.deployment_status === env && styles.environmentOptionActive,
                ]}
                onPress={() => setDeploymentConfig(prev => ({ ...prev, deployment_status: env }))}
              >
                <Text style={[
                  styles.environmentOptionText,
                  deploymentConfig.deployment_status === env && styles.environmentOptionTextActive,
                ]}>
                  {env.charAt(0).toUpperCase() + env.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.deployButton}
            onPress={handleDeployModel}
          >
            <Text style={styles.deployButtonText}>Deploy Model</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Deployed Models */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deployed Models</Text>
      </View>

      {deployedModels.map((model) => (
        <View key={model.id} style={styles.deployedModelCard}>
          <View style={styles.deployedModelHeader}>
            <View>
              <Text style={styles.deployedModelName}>{model.name}</Text>
              <Text style={styles.deployedModelVersion}>v{model.version}</Text>
            </View>
            <View style={[
              styles.deploymentStatusBadge,
              model.deployment_status === 'production' && styles.deploymentStatusProduction,
              model.deployment_status === 'staging' && styles.deploymentStatusStaging,
            ]}>
              <Text style={styles.deploymentStatusText}>{model.deployment_status}</Text>
            </View>
          </View>

          {model.endpoint_url && (
            <Text style={styles.endpointUrl}>{model.endpoint_url}</Text>
          )}

          <View style={styles.performanceMetrics}>
            <View style={styles.performanceMetric}>
              <Text style={styles.performanceMetricLabel}>RPS</Text>
              <Text style={styles.performanceMetricValue}>
                {model.performance_metrics.requests_per_second.toFixed(1)}
              </Text>
            </View>
            <View style={styles.performanceMetric}>
              <Text style={styles.performanceMetricLabel}>Latency</Text>
              <Text style={styles.performanceMetricValue}>
                {model.performance_metrics.average_latency.toFixed(0)}ms
              </Text>
            </View>
            <View style={styles.performanceMetric}>
              <Text style={styles.performanceMetricLabel}>Error Rate</Text>
              <Text style={styles.performanceMetricValue}>
                {model.performance_metrics.error_rate.toFixed(2)}%
              </Text>
            </View>
          </View>

          {model.deployment_status === 'production' && (
            <TouchableOpacity
              style={styles.rollbackButton}
              onPress={() => {
                Alert.alert(
                  'Rollback Model',
                  'Are you sure you want to rollback this model?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Rollback',
                      style: 'destructive',
                      onPress: () => dispatch(rollbackModel({ modelId: model.id, targetVersion: '0.9.0' })),
                    },
                  ]
                );
              }}
            >
              <Text style={styles.rollbackButtonText}>Rollback</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {deployedModels.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No models deployed yet</Text>
        </View>
      )}
    </ScrollView>
  );

  if (loading && trainingData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading training data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Custom AI Training</Text>
        <Text style={styles.headerSubtitle}>
          Fine-tune AI models with your own data
        </Text>
      </View>

      {renderTabs()}

      {activeTab === 'data' && renderDataTab()}
      {activeTab === 'training' && renderTrainingTab()}
      {activeTab === 'evaluation' && renderEvaluationTab()}
      {activeTab === 'testing' && renderTestingTab()}
      {activeTab === 'deployment' && renderDeploymentTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  uploadSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333333',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dataCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FFC107',
  },
  statusBadgeValid: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeInvalid: {
    backgroundColor: '#F44336',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dataDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  dataMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  dataMetric: {
    flex: 1,
  },
  dataMetricLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  dataMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  validateButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  validateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectDataButton: {
    backgroundColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectDataButtonActive: {
    backgroundColor: '#4CAF50',
  },
  selectDataButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  configSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  modelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modelOption: {
    flex: 1,
    minWidth: (width - 64) / 2,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modelOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  modelOptionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  modelOptionName: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paramLabel: {
    fontSize: 14,
    color: '#333333',
  },
  paramControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paramButton: {
    width: 32,
    height: 32,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paramButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  paramValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    minWidth: 40,
    textAlign: 'center',
  },
  startTrainingButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startTrainingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  trainingJobSection: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  jobName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  jobStatus: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  metricsOverview: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  metricOverviewCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricOverviewLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  metricOverviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  detailedMetrics: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  metricRowLabel: {
    fontSize: 14,
    color: '#333333',
  },
  metricRowValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  samplesSection: {
    padding: 16,
  },
  sampleCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  sampleAudio: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  sampleComparison: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  sampleColumn: {
    flex: 1,
  },
  sampleLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '600',
  },
  sampleText: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 18,
  },
  sampleConfidence: {
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
  },
  confidenceBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'right',
  },
  comingSoonContainer: {
    padding: 32,
    alignItems: 'center',
  },
  comingSoonIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  featureList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  deploymentConfig: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  environmentSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  environmentOption: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  environmentOptionActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  environmentOptionText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  environmentOptionTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  deployButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deployButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deployedModelCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  deployedModelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deployedModelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  deployedModelVersion: {
    fontSize: 12,
    color: '#666666',
  },
  deploymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#9E9E9E',
  },
  deploymentStatusProduction: {
    backgroundColor: '#4CAF50',
  },
  deploymentStatusStaging: {
    backgroundColor: '#FF9800',
  },
  deploymentStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  endpointUrl: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 12,
  },
  performanceMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  performanceMetric: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  performanceMetricLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
  },
  performanceMetricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  rollbackButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rollbackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
  },
});

