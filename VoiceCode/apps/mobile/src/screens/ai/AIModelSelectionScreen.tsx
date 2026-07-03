/**
 * AI Model Selection Screen
 * Phase 3 Week 10 Day 64-65: AI Model Management
 * 
 * Comprehensive AI model selection and configuration with 5 tabs:
 * - Models: Available AI models grid
 * - Comparison: Side-by-side model comparison
 * - Benchmarks: Performance benchmarks
 * - Settings: Model configuration
 * - Costs: Cost analysis and optimization
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
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchAvailableModels,
  fetchModelDetails,
  compareModels,
  selectModel,
  fetchBenchmarks,
  fetchUsageStats,
  fetchCostAnalysis,
  clearComparison,
} from '../../store/slices/aiModelSlice';
import { AIModel, ModelConfig } from '../../services/aiModelService';

const { width } = Dimensions.get('window');

type TabType = 'models' | 'comparison' | 'benchmarks' | 'settings' | 'costs';

export default function AIModelSelectionScreen() {
  const dispatch = useAppDispatch();
  const {
    availableModels,
    selectedModel,
    modelComparison,
    benchmarks,
    usageStats,
    costAnalysis,
    loading,
    error,
  } = useAppSelector((state) => state.aiModel);

  const [activeTab, setActiveTab] = useState<TabType>('models');
  const [selectedModelsForComparison, setSelectedModelsForComparison] = useState<string[]>([]);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    model_id: '',
    temperature: 0.7,
    max_tokens: 2048,
    auto_detect_language: true,
  });

  useEffect(() => {
    dispatch(fetchAvailableModels());
  }, []);

  useEffect(() => {
    if (selectedModel) {
      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dispatch(fetchBenchmarks(selectedModel.id));
      dispatch(fetchUsageStats({ modelId: selectedModel.id, startDate, endDate: now }));
      dispatch(fetchCostAnalysis(selectedModel.id));
    }
  }, [selectedModel]);

  const handleModelSelect = (model: AIModel) => {
    dispatch(fetchModelDetails(model.id));
  };

  const handleCompareModels = () => {
    if (selectedModelsForComparison.length < 2) {
      Alert.alert('Error', 'Please select at least 2 models to compare');
      return;
    }
    dispatch(compareModels(selectedModelsForComparison));
    setActiveTab('comparison');
  };

  const handleSelectModel = () => {
    if (!selectedModel) {
      Alert.alert('Error', 'Please select a model first');
      return;
    }
    dispatch(selectModel({ 
      modelId: selectedModel.id, 
      config: { ...modelConfig, model_id: selectedModel.id } 
    }));
    Alert.alert('Success', `${selectedModel.name} has been selected and configured`);
  };

  const toggleModelForComparison = (modelId: string) => {
    setSelectedModelsForComparison(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        if (prev.length >= 4) {
          Alert.alert('Limit Reached', 'You can compare up to 4 models at a time');
          return prev;
        }
        return [...prev, modelId];
      }
    });
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['models', 'comparison', 'benchmarks', 'settings', 'costs'] as TabType[]).map((tab) => (
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

  const renderModelsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available AI Models</Text>
        <Text style={styles.sectionSubtitle}>
          Select models to compare or choose one to configure
        </Text>
      </View>

      {availableModels.map((model) => (
        <TouchableOpacity
          key={model.id}
          style={[
            styles.modelCard,
            selectedModel?.id === model.id && styles.selectedModelCard,
            selectedModelsForComparison.includes(model.id) && styles.comparisonModelCard,
          ]}
          onPress={() => handleModelSelect(model)}
          onLongPress={() => toggleModelForComparison(model.id)}
        >
          <View style={styles.modelHeader}>
            <View style={styles.modelIconContainer}>
              <Text style={styles.modelIcon}>{model.icon}</Text>
            </View>
            <View style={styles.modelInfo}>
              <Text style={styles.modelName}>{model.name}</Text>
              <Text style={styles.modelProvider}>{model.provider.toUpperCase()}</Text>
            </View>
            {selectedModelsForComparison.includes(model.id) && (
              <View style={styles.comparisonBadge}>
                <Text style={styles.comparisonBadgeText}>Compare</Text>
              </View>
            )}
          </View>

          <Text style={styles.modelDescription}>{model.description}</Text>

          <View style={styles.modelMetrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Accuracy</Text>
              <Text style={styles.metricValue}>{model.accuracy}%</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Speed</Text>
              <Text style={styles.metricValue}>{model.speed}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Cost</Text>
              <Text style={styles.metricValue}>${model.cost_per_minute.toFixed(3)}/min</Text>
            </View>
          </View>

          <View style={styles.modelFeatures}>
            {model.features.slice(0, 3).map((feature, index) => (
              <View key={index} style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>{feature}</Text>
              </View>
            ))}
            {model.features.length > 3 && (
              <Text style={styles.moreFeatures}>+{model.features.length - 3} more</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {selectedModelsForComparison.length >= 2 && (
        <TouchableOpacity style={styles.compareButton} onPress={handleCompareModels}>
          <Text style={styles.compareButtonText}>
            Compare {selectedModelsForComparison.length} Models
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderComparisonTab = () => {
    if (!modelComparison) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Select at least 2 models from the Models tab to compare
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setActiveTab('models')}
          >
            <Text style={styles.emptyStateButtonText}>Go to Models</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Comparison</Text>
          <Text style={styles.sectionSubtitle}>
            Comparing {modelComparison.models.length} models
          </Text>
        </View>

        {/* Recommendation */}
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationTitle}>💡 Recommendation</Text>
          <Text style={styles.recommendationText}>{modelComparison.recommendation}</Text>
          <Text style={styles.costDifference}>
            Cost difference: ${modelComparison.cost_difference.toFixed(3)}/min
          </Text>
        </View>

        {/* Comparison Matrix */}
        <View style={styles.comparisonMatrix}>
          <Text style={styles.matrixTitle}>Feature Comparison</Text>

          {modelComparison.comparison_matrix.map((row, index) => (
            <View key={index} style={styles.matrixRow}>
              <Text style={styles.matrixFeature}>{row.feature}</Text>
              <View style={styles.matrixValues}>
                {modelComparison.models.map((model) => (
                  <View key={model.id} style={styles.matrixValue}>
                    <Text style={styles.matrixValueText}>
                      {String(row.values[model.id])}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Model Cards */}
        <View style={styles.comparisonModels}>
          {modelComparison.models.map((model) => (
            <View key={model.id} style={styles.comparisonModelDetailCard}>
              <Text style={styles.comparisonModelIcon}>{model.icon}</Text>
              <Text style={styles.comparisonModelName}>{model.name}</Text>
              <Text style={styles.comparisonModelProvider}>{model.provider}</Text>

              <View style={styles.comparisonModelMetrics}>
                <Text style={styles.comparisonModelMetric}>
                  Accuracy: {model.accuracy}%
                </Text>
                <Text style={styles.comparisonModelMetric}>
                  Speed: {model.speed}
                </Text>
                <Text style={styles.comparisonModelMetric}>
                  ${model.cost_per_minute.toFixed(3)}/min
                </Text>
              </View>

              <TouchableOpacity
                style={styles.selectModelButton}
                onPress={() => {
                  dispatch(fetchModelDetails(model.id));
                  setActiveTab('settings');
                }}
              >
                <Text style={styles.selectModelButtonText}>Select</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.clearComparisonButton}
          onPress={() => {
            dispatch(clearComparison());
            setSelectedModelsForComparison([]);
            setActiveTab('models');
          }}
        >
          <Text style={styles.clearComparisonButtonText}>Clear Comparison</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderBenchmarksTab = () => {
    if (!selectedModel) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Select a model from the Models tab to view benchmarks
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setActiveTab('models')}
          >
            <Text style={styles.emptyStateButtonText}>Go to Models</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Benchmarks</Text>
          <Text style={styles.sectionSubtitle}>{selectedModel.name}</Text>
        </View>

        {/* Model Overview */}
        <View style={styles.benchmarkOverview}>
          <View style={styles.benchmarkOverviewItem}>
            <Text style={styles.benchmarkOverviewIcon}>{selectedModel.icon}</Text>
            <Text style={styles.benchmarkOverviewName}>{selectedModel.name}</Text>
            <Text style={styles.benchmarkOverviewProvider}>{selectedModel.provider}</Text>
          </View>
        </View>

        {/* Benchmark Metrics */}
        <View style={styles.benchmarkMetrics}>
          {benchmarks.map((benchmark, index) => (
            <View key={index} style={styles.benchmarkCard}>
              <Text style={styles.benchmarkMetric}>{benchmark.metric}</Text>
              <Text style={styles.benchmarkValue}>
                {benchmark.value} {benchmark.unit}
              </Text>
              <View style={styles.benchmarkBar}>
                <View
                  style={[
                    styles.benchmarkBarFill,
                    {
                      width: `${Math.min((benchmark.value / 100) * 100, 100)}%`,
                      backgroundColor: getBenchmarkColor(benchmark.metric, benchmark.value),
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Usage Stats */}
        {usageStats && (
          <View style={styles.usageStatsSection}>
            <Text style={styles.sectionTitle}>Usage Statistics (Last 30 Days)</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Minutes</Text>
                <Text style={styles.statValue}>{usageStats.total_minutes.toLocaleString()}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Requests</Text>
                <Text style={styles.statValue}>{usageStats.total_requests.toLocaleString()}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Cost</Text>
                <Text style={styles.statValue}>${usageStats.total_cost.toFixed(2)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Avg Accuracy</Text>
                <Text style={styles.statValue}>{usageStats.average_accuracy.toFixed(1)}%</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Error Rate</Text>
                <Text style={styles.statValue}>{usageStats.error_rate.toFixed(1)}%</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderSettingsTab = () => {
    if (!selectedModel) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Select a model from the Models tab to configure
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setActiveTab('models')}
          >
            <Text style={styles.emptyStateButtonText}>Go to Models</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Configuration</Text>
          <Text style={styles.sectionSubtitle}>{selectedModel.name}</Text>
        </View>

        {/* Model Info */}
        <View style={styles.configModelInfo}>
          <Text style={styles.configModelIcon}>{selectedModel.icon}</Text>
          <Text style={styles.configModelName}>{selectedModel.name}</Text>
          <Text style={styles.configModelDescription}>{selectedModel.description}</Text>
        </View>

        {/* Configuration Options */}
        <View style={styles.configSection}>
          <Text style={styles.configSectionTitle}>Temperature</Text>
          <Text style={styles.configSectionDescription}>
            Controls randomness. Lower = more focused, Higher = more creative
          </Text>
          <View style={styles.configSlider}>
            <Text style={styles.configValue}>{modelConfig.temperature}</Text>
            {/* In production, use a proper slider component */}
            <View style={styles.configSliderButtons}>
              <TouchableOpacity
                style={styles.configSliderButton}
                onPress={() => setModelConfig(prev => ({
                  ...prev,
                  temperature: Math.max(0, (prev.temperature || 0.7) - 0.1)
                }))}
              >
                <Text style={styles.configSliderButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.configSliderButton}
                onPress={() => setModelConfig(prev => ({
                  ...prev,
                  temperature: Math.min(1, (prev.temperature || 0.7) + 0.1)
                }))}
              >
                <Text style={styles.configSliderButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.configSection}>
          <Text style={styles.configSectionTitle}>Max Tokens</Text>
          <Text style={styles.configSectionDescription}>
            Maximum length of generated output
          </Text>
          <View style={styles.configSlider}>
            <Text style={styles.configValue}>{modelConfig.max_tokens}</Text>
            <View style={styles.configSliderButtons}>
              <TouchableOpacity
                style={styles.configSliderButton}
                onPress={() => setModelConfig(prev => ({
                  ...prev,
                  max_tokens: Math.max(256, (prev.max_tokens || 2048) - 256)
                }))}
              >
                <Text style={styles.configSliderButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.configSliderButton}
                onPress={() => setModelConfig(prev => ({
                  ...prev,
                  max_tokens: Math.min(4096, (prev.max_tokens || 2048) + 256)
                }))}
              >
                <Text style={styles.configSliderButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.configSection}>
          <Text style={styles.configSectionTitle}>Auto-Detect Language</Text>
          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setModelConfig(prev => ({
              ...prev,
              auto_detect_language: !prev.auto_detect_language
            }))}
          >
            <View style={[
              styles.configToggleSwitch,
              modelConfig.auto_detect_language && styles.configToggleSwitchActive
            ]}>
              <View style={[
                styles.configToggleThumb,
                modelConfig.auto_detect_language && styles.configToggleThumbActive
              ]} />
            </View>
            <Text style={styles.configToggleLabel}>
              {modelConfig.auto_detect_language ? 'Enabled' : 'Disabled'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveConfigButton} onPress={handleSelectModel}>
          <Text style={styles.saveConfigButtonText}>Save Configuration</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderCostsTab = () => {
    if (!selectedModel) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Select a model from the Models tab to view cost analysis
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setActiveTab('models')}
          >
            <Text style={styles.emptyStateButtonText}>Go to Models</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!costAnalysis) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading cost analysis...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Analysis</Text>
          <Text style={styles.sectionSubtitle}>{selectedModel.name}</Text>
        </View>

        {/* Cost Overview */}
        <View style={styles.costOverview}>
          <View style={styles.costOverviewCard}>
            <Text style={styles.costOverviewLabel}>Current Cost</Text>
            <Text style={styles.costOverviewValue}>
              ${costAnalysis.current_cost.toFixed(2)}
            </Text>
            <Text style={styles.costOverviewPeriod}>This week</Text>
          </View>
          <View style={styles.costOverviewCard}>
            <Text style={styles.costOverviewLabel}>Projected Monthly</Text>
            <Text style={styles.costOverviewValue}>
              ${costAnalysis.projected_monthly_cost.toFixed(2)}
            </Text>
            <Text style={styles.costOverviewPeriod}>Based on current usage</Text>
          </View>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.costBreakdownSection}>
          <Text style={styles.sectionTitle}>Cost Breakdown</Text>

          <View style={styles.costBreakdownItem}>
            <Text style={styles.costBreakdownLabel}>Transcription</Text>
            <Text style={styles.costBreakdownValue}>
              ${costAnalysis.cost_breakdown.transcription.toFixed(2)}
            </Text>
            <View style={styles.costBreakdownBar}>
              <View
                style={[
                  styles.costBreakdownBarFill,
                  {
                    width: `${(costAnalysis.cost_breakdown.transcription / costAnalysis.current_cost) * 100}%`,
                    backgroundColor: '#4CAF50',
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.costBreakdownItem}>
            <Text style={styles.costBreakdownLabel}>Analysis</Text>
            <Text style={styles.costBreakdownValue}>
              ${costAnalysis.cost_breakdown.analysis.toFixed(2)}
            </Text>
            <View style={styles.costBreakdownBar}>
              <View
                style={[
                  styles.costBreakdownBarFill,
                  {
                    width: `${(costAnalysis.cost_breakdown.analysis / costAnalysis.current_cost) * 100}%`,
                    backgroundColor: '#2196F3',
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.costBreakdownItem}>
            <Text style={styles.costBreakdownLabel}>Training</Text>
            <Text style={styles.costBreakdownValue}>
              ${costAnalysis.cost_breakdown.training.toFixed(2)}
            </Text>
            <View style={styles.costBreakdownBar}>
              <View
                style={[
                  styles.costBreakdownBarFill,
                  {
                    width: `${(costAnalysis.cost_breakdown.training / costAnalysis.current_cost) * 100}%`,
                    backgroundColor: '#FF9800',
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Savings Opportunities */}
        <View style={styles.savingsSection}>
          <Text style={styles.sectionTitle}>💰 Savings Opportunities</Text>

          {costAnalysis.savings_opportunities.map((opportunity, index) => (
            <View key={index} style={styles.savingsCard}>
              <Text style={styles.savingsDescription}>{opportunity.description}</Text>
              <Text style={styles.savingsPotential}>
                Save ${opportunity.potential_savings.toFixed(2)}/week
              </Text>
            </View>
          ))}

          <View style={styles.totalSavings}>
            <Text style={styles.totalSavingsLabel}>Total Potential Savings</Text>
            <Text style={styles.totalSavingsValue}>
              ${costAnalysis.savings_opportunities
                .reduce((sum, opp) => sum + opp.potential_savings, 0)
                .toFixed(2)}/week
            </Text>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>📊 Recommendations</Text>

          {costAnalysis.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationItemText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const getBenchmarkColor = (metric: string, value: number): string => {
    if (metric.toLowerCase().includes('error') || metric.toLowerCase().includes('latency')) {
      return value < 5 ? '#4CAF50' : value < 10 ? '#FF9800' : '#F44336';
    }
    return value > 90 ? '#4CAF50' : value > 70 ? '#FF9800' : '#F44336';
  };

  if (loading && availableModels.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading AI models...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => dispatch(fetchAvailableModels())}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Model Selection</Text>
        <Text style={styles.headerSubtitle}>
          Choose and configure the best AI model for your needs
        </Text>
      </View>

      {renderTabs()}

      {activeTab === 'models' && renderModelsTab()}
      {activeTab === 'comparison' && renderComparisonTab()}
      {activeTab === 'benchmarks' && renderBenchmarksTab()}
      {activeTab === 'settings' && renderSettingsTab()}
      {activeTab === 'costs' && renderCostsTab()}
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
    fontSize: 12,
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
  modelCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedModelCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  comparisonModelCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modelIcon: {
    fontSize: 24,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  modelProvider: {
    fontSize: 12,
    color: '#666666',
  },
  comparisonBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  comparisonBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modelDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  modelMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  modelFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featureBadgeText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  moreFeatures: {
    fontSize: 11,
    color: '#666666',
    alignSelf: 'center',
  },
  compareButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
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
  recommendationCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 20,
    marginBottom: 8,
  },
  costDifference: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },
  comparisonMatrix: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  matrixTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  matrixRow: {
    marginBottom: 12,
  },
  matrixFeature: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  matrixValues: {
    flexDirection: 'row',
    gap: 8,
  },
  matrixValue: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  matrixValueText: {
    fontSize: 12,
    color: '#333333',
  },
  comparisonModels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  comparisonModelDetailCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  comparisonModelIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  comparisonModelName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'center',
  },
  comparisonModelProvider: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 12,
  },
  comparisonModelMetrics: {
    width: '100%',
    marginBottom: 12,
  },
  comparisonModelMetric: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectModelButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectModelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearComparisonButton: {
    backgroundColor: '#F44336',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearComparisonButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  benchmarkOverview: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  benchmarkOverviewItem: {
    alignItems: 'center',
  },
  benchmarkOverviewIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  benchmarkOverviewName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  benchmarkOverviewProvider: {
    fontSize: 14,
    color: '#666666',
  },
  benchmarkMetrics: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  benchmarkCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  benchmarkMetric: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  benchmarkValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  benchmarkBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  benchmarkBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  usageStatsSection: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  configModelInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  configModelIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  configModelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  configModelDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  configSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  configSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  configSectionDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 12,
  },
  configSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  configSliderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  configSliderButton: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configSliderButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  configToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  configToggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    padding: 2,
    marginRight: 12,
  },
  configToggleSwitchActive: {
    backgroundColor: '#4CAF50',
  },
  configToggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  configToggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  configToggleLabel: {
    fontSize: 14,
    color: '#333333',
  },
  saveConfigButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveConfigButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  costOverview: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  costOverviewCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  costOverviewLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  costOverviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  costOverviewPeriod: {
    fontSize: 11,
    color: '#999999',
  },
  costBreakdownSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  costBreakdownItem: {
    marginBottom: 16,
  },
  costBreakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  costBreakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  costBreakdownBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  costBreakdownBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  savingsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  savingsCard: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  savingsDescription: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  savingsPotential: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  totalSavings: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalSavingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  totalSavingsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recommendationsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recommendationBullet: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
  },
  recommendationItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

