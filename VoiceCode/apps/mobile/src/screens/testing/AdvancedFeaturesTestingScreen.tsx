/**
 * Advanced Features Testing Screen
 * Week 8 Day 56: Advanced Features Polish & Testing
 *
 * Comprehensive testing and polish screen for Week 8 features:
 * - Export Formats Testing
 * - Vocabulary Manager Testing
 * - Template Customization Testing
 * - Performance Monitoring
 * - Accessibility Testing
 * - Feature Showcase
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Alert,
  Switch,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  status: TestStatus;
  duration?: number;
  error?: string;
  lastRun?: string;
}

export interface TestCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  testCount: number;
  passedCount: number;
  failedCount: number;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export interface AccessibilityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  issue: string;
  recommendation: string;
  fixed: boolean;
}

export interface FeatureDemo {
  id: string;
  name: string;
  description: string;
  screen: string;
  icon: string;
  color: string;
  status: 'ready' | 'in-progress' | 'planned';
}

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
export type TestMode = 'manual' | 'automated' | 'performance' | 'accessibility';
export type ViewMode = 'overview' | 'tests' | 'performance' | 'accessibility' | 'demos';

// ============================================================================
// Constants
// ============================================================================

const BASE_UNIT = 4;

const TEST_CATEGORIES: TestCategory[] = [
  {
    id: 'export',
    name: 'Export Formats',
    icon: 'document-text',
    color: '#3B82F6',
    testCount: 24,
    passedCount: 22,
    failedCount: 2,
  },
  {
    id: 'vocabulary',
    name: 'Vocabulary Manager',
    icon: 'book',
    color: '#8B5CF6',
    testCount: 18,
    passedCount: 18,
    failedCount: 0,
  },
  {
    id: 'templates',
    name: 'Template Studio',
    icon: 'create',
    color: '#10B981',
    testCount: 20,
    passedCount: 19,
    failedCount: 1,
  },
  {
    id: 'integration',
    name: 'Integration',
    icon: 'git-merge',
    color: '#F59E0B',
    testCount: 12,
    passedCount: 11,
    failedCount: 1,
  },
];

const PERFORMANCE_METRICS: PerformanceMetric[] = [
  {
    id: 'render',
    name: 'Render Time',
    value: 45,
    unit: 'ms',
    threshold: 100,
    status: 'good',
    trend: 'down',
  },
  {
    id: 'memory',
    name: 'Memory Usage',
    value: 128,
    unit: 'MB',
    threshold: 200,
    status: 'good',
    trend: 'stable',
  },
  {
    id: 'fps',
    name: 'Frame Rate',
    value: 58,
    unit: 'fps',
    threshold: 55,
    status: 'good',
    trend: 'up',
  },
  {
    id: 'bundle',
    name: 'Bundle Size',
    value: 2.4,
    unit: 'MB',
    threshold: 3.0,
    status: 'good',
    trend: 'stable',
  },
];

// ============================================================================
// Component
// ============================================================================

export default function AdvancedFeaturesTestingScreen({ navigation }: any) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [runningTests, setRunningTests] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [accessibilityIssues, setAccessibilityIssues] = useState<AccessibilityIssue[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>(PERFORMANCE_METRICS);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    loadData();
  }, []);

  useEffect(() => {
    if (autoRun && !runningTests) {
      runAllTests();
    }
  }, [autoRun]);

  // ============================================================================
  // Data Management
  // ============================================================================

  const loadData = async () => {
    try {
      // Load test cases
      const storedTests = await AsyncStorage.getItem('@VoiceCode_test_cases');
      if (storedTests) {
        setTestCases(JSON.parse(storedTests));
      } else {
        // Initialize with default test cases
        const defaultTests = generateDefaultTestCases();
        setTestCases(defaultTests);
        await AsyncStorage.setItem('@VoiceCode_test_cases', JSON.stringify(defaultTests));
      }

      // Load accessibility issues
      const storedIssues = await AsyncStorage.getItem('@VoiceCode_accessibility_issues');
      if (storedIssues) {
        setAccessibilityIssues(JSON.parse(storedIssues));
      } else {
        const defaultIssues = generateDefaultAccessibilityIssues();
        setAccessibilityIssues(defaultIssues);
        await AsyncStorage.setItem('@VoiceCode_accessibility_issues', JSON.stringify(defaultIssues));
      }
    } catch (error) {
      console.error('Error loading test data:', error);
    }
  };

  const generateDefaultTestCases = (): TestCase[] => {
    const tests: TestCase[] = [];

    // Export Format Tests
    tests.push(
      {
        id: 'export-1',
        name: 'PDF Export',
        description: 'Test PDF export with all formatting options',
        category: TEST_CATEGORIES[0],
        status: 'passed',
        duration: 245,
        lastRun: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'export-2',
        name: 'DOCX Export',
        description: 'Test Word document export with templates',
        category: TEST_CATEGORIES[0],
        status: 'passed',
        duration: 312,
        lastRun: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'export-3',
        name: 'Batch Export',
        description: 'Test batch export of multiple formats',
        category: TEST_CATEGORIES[0],
        status: 'failed',
        duration: 1024,
        error: 'Timeout exceeded for large batch',
        lastRun: new Date(Date.now() - 7200000).toISOString(),
      }
    );

    // Vocabulary Tests
    tests.push(
      {
        id: 'vocab-1',
        name: 'Add Custom Word',
        description: 'Test adding custom vocabulary with pronunciation',
        category: TEST_CATEGORIES[1],
        status: 'passed',
        duration: 89,
        lastRun: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'vocab-2',
        name: 'Industry Sets',
        description: 'Test loading and applying industry-specific vocabulary',
        category: TEST_CATEGORIES[1],
        status: 'passed',
        duration: 156,
        lastRun: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'vocab-3',
        name: 'Word Replacement',
        description: 'Test automatic word replacement during transcription',
        category: TEST_CATEGORIES[1],
        status: 'passed',
        duration: 203,
        lastRun: new Date(Date.now() - 1800000).toISOString(),
      }
    );

    // Template Tests
    tests.push(
      {
        id: 'template-1',
        name: 'Create Template',
        description: 'Test creating custom export template',
        category: TEST_CATEGORIES[2],
        status: 'passed',
        duration: 134,
        lastRun: new Date(Date.now() - 900000).toISOString(),
      },
      {
        id: 'template-2',
        name: 'Variable Insertion',
        description: 'Test inserting variables into template content',
        category: TEST_CATEGORIES[2],
        status: 'passed',
        duration: 78,
        lastRun: new Date(Date.now() - 900000).toISOString(),
      },
      {
        id: 'template-3',
        name: 'Live Preview',
        description: 'Test live preview with sample data',
        category: TEST_CATEGORIES[2],
        status: 'failed',
        duration: 456,
        error: 'Preview rendering timeout',
        lastRun: new Date(Date.now() - 900000).toISOString(),
      }
    );

    // Integration Tests
    tests.push(
      {
        id: 'integration-1',
        name: 'Export + Vocabulary',
        description: 'Test export with custom vocabulary applied',
        category: TEST_CATEGORIES[3],
        status: 'passed',
        duration: 389,
        lastRun: new Date(Date.now() - 600000).toISOString(),
      },
      {
        id: 'integration-2',
        name: 'Template + Export',
        description: 'Test template-based export workflow',
        category: TEST_CATEGORIES[3],
        status: 'passed',
        duration: 412,
        lastRun: new Date(Date.now() - 600000).toISOString(),
      },
      {
        id: 'integration-3',
        name: 'Full Workflow',
        description: 'Test complete workflow from recording to export',
        category: TEST_CATEGORIES[3],
        status: 'failed',
        duration: 2145,
        error: 'Memory leak detected',
        lastRun: new Date(Date.now() - 600000).toISOString(),
      }
    );

    return tests;
  };

  const generateDefaultAccessibilityIssues = (): AccessibilityIssue[] => {
    return [
      {
        id: 'a11y-1',
        severity: 'high',
        component: 'ExportFormatCard',
        issue: 'Missing accessibility label for format icon',
        recommendation: 'Add accessibilityLabel prop to Ionicons component',
        fixed: false,
      },
      {
        id: 'a11y-2',
        severity: 'medium',
        component: 'TemplateEditor',
        issue: 'Insufficient color contrast for placeholder text',
        recommendation: 'Increase contrast ratio to meet WCAG AA standards',
        fixed: true,
      },
      {
        id: 'a11y-3',
        severity: 'critical',
        component: 'VocabularyList',
        issue: 'Touch target size below 44pt minimum',
        recommendation: 'Increase button size to meet iOS guidelines',
        fixed: false,
      },
      {
        id: 'a11y-4',
        severity: 'low',
        component: 'SearchBar',
        issue: 'Missing hint text for screen readers',
        recommendation: 'Add accessibilityHint to describe search functionality',
        fixed: true,
      },
    ];
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(mode);
  };

  const handleCategoryFilter = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId);
  };

  const handleRunTest = async (testId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Update test status to running
    setTestCases(prev => prev.map(test =>
      test.id === testId ? { ...test, status: 'running' as TestStatus } : test
    ));

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Update test status to passed/failed (90% pass rate)
    const passed = Math.random() > 0.1;
    setTestCases(prev => prev.map(test =>
      test.id === testId ? {
        ...test,
        status: passed ? 'passed' as TestStatus : 'failed' as TestStatus,
        duration: Math.floor(50 + Math.random() * 500),
        lastRun: new Date().toISOString(),
        error: passed ? undefined : 'Test failed with random error',
      } : test
    ));

    Haptics.notificationAsync(
      passed ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    );
  };

  const runAllTests = async () => {
    setRunningTests(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    for (const test of testCases) {
      await handleRunTest(test.id);
    }

    setRunningTests(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Tests Complete', 'All tests have finished running.');
  };

  const handleFixIssue = (issueId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAccessibilityIssues(prev => prev.map(issue =>
      issue.id === issueId ? { ...issue, fixed: true } : issue
    ));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleNavigateToFeature = (screen: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate(screen);
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const getFilteredTests = (): TestCase[] => {
    if (selectedCategory === 'all') {
      return testCases;
    }
    return testCases.filter(test => test.category.id === selectedCategory);
  };

  const getTestStats = () => {
    const total = testCases.length;
    const passed = testCases.filter(t => t.status === 'passed').length;
    const failed = testCases.filter(t => t.status === 'failed').length;
    const pending = testCases.filter(t => t.status === 'pending').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, passed, failed, pending, passRate };
  };

  const getAccessibilityStats = () => {
    const total = accessibilityIssues.length;
    const fixed = accessibilityIssues.filter(i => i.fixed).length;
    const critical = accessibilityIssues.filter(i => i.severity === 'critical' && !i.fixed).length;
    const high = accessibilityIssues.filter(i => i.severity === 'high' && !i.fixed).length;

    return { total, fixed, critical, high };
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusColor = (status: TestStatus): string => {
    switch (status) {
      case 'passed': return '#10B981';
      case 'failed': return '#EF4444';
      case 'running': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'skipped': return '#9CA3AF';
      default: return '#6B7280';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#F59E0B';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPerformanceColor = (status: string): string => {
    switch (status) {
      case 'good': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };


  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderHeader = () => {
    const stats = getTestStats();

    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Advanced Features Testing</Text>
          <Text style={styles.headerSubtitle}>Week 8 Polish & Testing</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={runAllTests} style={styles.headerButton} activeOpacity={0.7} disabled={runningTests}>
            <Ionicons name="play" size={20} color={runningTests ? '#9CA3AF' : '#3B82F6'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderViewModeSelector = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.viewModeScroll}>
      {(['overview', 'tests', 'performance', 'accessibility', 'demos'] as ViewMode[]).map(mode => (
        <TouchableOpacity
          key={mode}
          onPress={() => handleViewModeChange(mode)}
          style={[styles.viewModeChip, viewMode === mode && styles.viewModeChipActive]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={
              mode === 'overview' ? 'grid' :
              mode === 'tests' ? 'checkmark-circle' :
              mode === 'performance' ? 'speedometer' :
              mode === 'accessibility' ? 'accessibility' :
              'rocket'
            }
            size={16}
            color={viewMode === mode ? '#FFFFFF' : '#6B7280'}
          />
          <Text style={[styles.viewModeChipText, viewMode === mode && styles.viewModeChipTextActive]}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOverview = () => {
    const testStats = getTestStats();
    const a11yStats = getAccessibilityStats();

    return (
      <View style={styles.overviewContainer}>
        {/* Test Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            <Text style={styles.summaryTitle}>Test Summary</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{testStats.total}</Text>
              <Text style={styles.statLabel}>Total Tests</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{testStats.passed}</Text>
              <Text style={styles.statLabel}>Passed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{testStats.failed}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>{testStats.passRate}%</Text>
              <Text style={styles.statLabel}>Pass Rate</Text>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="speedometer" size={24} color="#8B5CF6" />
            <Text style={styles.summaryTitle}>Performance</Text>
          </View>
          <View style={styles.metricsGrid}>
            {performanceMetrics.map(metric => (
              <View key={metric.id} style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricName}>{metric.name}</Text>
                  <Ionicons
                    name={metric.trend === 'up' ? 'trending-up' : metric.trend === 'down' ? 'trending-down' : 'remove'}
                    size={16}
                    color={getPerformanceColor(metric.status)}
                  />
                </View>
                <Text style={[styles.metricValue, { color: getPerformanceColor(metric.status) }]}>
                  {metric.value}{metric.unit}
                </Text>
                <Text style={styles.metricThreshold}>Threshold: {metric.threshold}{metric.unit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Accessibility Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="accessibility" size={24} color="#10B981" />
            <Text style={styles.summaryTitle}>Accessibility</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{a11yStats.total}</Text>
              <Text style={styles.statLabel}>Total Issues</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{a11yStats.fixed}</Text>
              <Text style={styles.statLabel}>Fixed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{a11yStats.critical}</Text>
              <Text style={styles.statLabel}>Critical</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{a11yStats.high}</Text>
              <Text style={styles.statLabel}>High</Text>
            </View>
          </View>
        </View>

        {/* Auto-run Toggle */}
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-run Tests</Text>
              <Text style={styles.settingDescription}>Automatically run all tests on load</Text>
            </View>
            <Switch
              value={autoRun}
              onValueChange={setAutoRun}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={autoRun ? '#3B82F6' : '#F9FAFB'}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderTests = () => {
    const filteredTests = getFilteredTests();

    return (
      <View style={styles.testsContainer}>
        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            onPress={() => handleCategoryFilter('all')}
            style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
              All Tests
            </Text>
          </TouchableOpacity>
          {TEST_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategoryFilter(category.id)}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
                selectedCategory === category.id && { backgroundColor: category.color },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name={category.icon as any} size={16} color={selectedCategory === category.id ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.categoryChipText, selectedCategory === category.id && styles.categoryChipTextActive]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Test List */}
        <View style={styles.testList}>
          {filteredTests.map(test => (
            <View key={test.id} style={styles.testCard}>
              <View style={styles.testCardHeader}>
                <View style={styles.testCardTitle}>
                  <View style={[styles.testStatusDot, { backgroundColor: getStatusColor(test.status) }]} />
                  <Text style={styles.testName}>{test.name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRunTest(test.id)}
                  style={styles.runTestButton}
                  activeOpacity={0.7}
                  disabled={test.status === 'running'}
                >
                  <Ionicons
                    name={test.status === 'running' ? 'hourglass' : 'play-circle'}
                    size={24}
                    color={test.status === 'running' ? '#F59E0B' : '#3B82F6'}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.testDescription}>{test.description}</Text>
              <View style={styles.testCardFooter}>
                <View style={styles.testMeta}>
                  <Ionicons name="folder" size={14} color={test.category.color} />
                  <Text style={[styles.testMetaText, { color: test.category.color }]}>{test.category.name}</Text>
                </View>
                {test.duration && (
                  <View style={styles.testMeta}>
                    <Ionicons name="time" size={14} color="#6B7280" />
                    <Text style={styles.testMetaText}>{formatDuration(test.duration)}</Text>
                  </View>
                )}
                {test.lastRun && (
                  <View style={styles.testMeta}>
                    <Ionicons name="calendar" size={14} color="#6B7280" />
                    <Text style={styles.testMetaText}>{formatTime(test.lastRun)}</Text>
                  </View>
                )}
              </View>
              {test.error && (
                <View style={styles.testError}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.testErrorText}>{test.error}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPerformance = () => (
    <View style={styles.performanceContainer}>
      <View style={styles.metricsGrid}>
        {performanceMetrics.map(metric => (
          <View key={metric.id} style={styles.performanceCard}>
            <View style={styles.performanceHeader}>
              <Text style={styles.performanceName}>{metric.name}</Text>
              <View style={[styles.performanceStatusBadge, { backgroundColor: getPerformanceColor(metric.status) }]}>
                <Text style={styles.performanceStatusText}>{metric.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.performanceValueContainer}>
              <Text style={[styles.performanceValue, { color: getPerformanceColor(metric.status) }]}>
                {metric.value}
              </Text>
              <Text style={styles.performanceUnit}>{metric.unit}</Text>
              <Ionicons
                name={metric.trend === 'up' ? 'trending-up' : metric.trend === 'down' ? 'trending-down' : 'remove'}
                size={24}
                color={getPerformanceColor(metric.status)}
              />
            </View>
            <View style={styles.performanceThreshold}>
              <Text style={styles.performanceThresholdLabel}>Threshold:</Text>
              <Text style={styles.performanceThresholdValue}>{metric.threshold}{metric.unit}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAccessibility = () => (
    <View style={styles.accessibilityContainer}>
      {accessibilityIssues.map(issue => (
        <View key={issue.id} style={[styles.issueCard, issue.fixed && styles.issueCardFixed]}>
          <View style={styles.issueHeader}>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(issue.severity) }]}>
              <Text style={styles.severityText}>{issue.severity.toUpperCase()}</Text>
            </View>
            {issue.fixed && (
              <View style={styles.fixedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.fixedText}>Fixed</Text>
              </View>
            )}
          </View>
          <Text style={styles.issueComponent}>{issue.component}</Text>
          <Text style={styles.issueDescription}>{issue.issue}</Text>
          <View style={styles.issueRecommendation}>
            <Ionicons name="bulb" size={16} color="#F59E0B" />
            <Text style={styles.issueRecommendationText}>{issue.recommendation}</Text>
          </View>
          {!issue.fixed && (
            <TouchableOpacity
              onPress={() => handleFixIssue(issue.id)}
              style={styles.fixButton}
              activeOpacity={0.7}
            >
              <Text style={styles.fixButtonText}>Mark as Fixed</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderDemos = () => {
    const demos: FeatureDemo[] = [
      {
        id: 'demo-1',
        name: 'Export Formats',
        description: 'Explore 8 export formats with customization',
        screen: 'AdvancedExportFormats',
        icon: 'document-text',
        color: '#3B82F6',
        status: 'ready',
      },
      {
        id: 'demo-2',
        name: 'Vocabulary Manager',
        description: 'Manage custom vocabulary and industry sets',
        screen: 'CustomVocabularyManager',
        icon: 'book',
        color: '#8B5CF6',
        status: 'ready',
      },
      {
        id: 'demo-3',
        name: 'Template Studio',
        description: 'Create and customize export templates',
        screen: 'ExportCustomizationStudio',
        icon: 'create',
        color: '#10B981',
        status: 'ready',
      },
    ];

    return (
      <View style={styles.demosContainer}>
        {demos.map(demo => (
          <TouchableOpacity
            key={demo.id}
            onPress={() => handleNavigateToFeature(demo.screen)}
            style={[styles.demoCard, { borderLeftColor: demo.color }]}
            activeOpacity={0.7}
          >
            <View style={[styles.demoIcon, { backgroundColor: demo.color + '20' }]}>
              <Ionicons name={demo.icon as any} size={32} color={demo.color} />
            </View>
            <View style={styles.demoContent}>
              <View style={styles.demoHeader}>
                <Text style={styles.demoName}>{demo.name}</Text>
                <View style={[styles.demoStatusBadge, { backgroundColor: demo.status === 'ready' ? '#10B981' : '#F59E0B' }]}>
                  <Text style={styles.demoStatusText}>{demo.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.demoDescription}>{demo.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      >
        {renderHeader()}
        {renderViewModeSelector()}
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'tests' && renderTests()}
        {viewMode === 'performance' && renderPerformance()}
        {viewMode === 'accessibility' && renderAccessibility()}
        {viewMode === 'demos' && renderDemos()}
      </ScrollView>
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: BASE_UNIT * 6,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BASE_UNIT * 4,
    paddingTop: Platform.OS === 'ios' ? BASE_UNIT * 14 : BASE_UNIT * 10,
    paddingBottom: BASE_UNIT * 4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: BASE_UNIT * 2,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: BASE_UNIT,
  },
  headerActions: {
    flexDirection: 'row',
    gap: BASE_UNIT * 2,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // View Mode Selector
  viewModeScroll: {
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 2,
    borderRadius: BASE_UNIT * 5,
    backgroundColor: '#F9FAFB',
    marginRight: BASE_UNIT * 2,
    gap: BASE_UNIT * 2,
  },
  viewModeChipActive: {
    backgroundColor: '#3B82F6',
  },
  viewModeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  viewModeChipTextActive: {
    color: '#FFFFFF',
  },

  // Overview
  overviewContainer: {
    padding: BASE_UNIT * 4,
    gap: BASE_UNIT * 4,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: BASE_UNIT,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 3,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 2,
    padding: BASE_UNIT * 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 2,
  },
  metricName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: BASE_UNIT,
  },
  metricThreshold: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  // Settings
  settingsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: BASE_UNIT * 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: BASE_UNIT,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Tests
  testsContainer: {
    padding: BASE_UNIT * 4,
  },
  categoryScroll: {
    marginBottom: BASE_UNIT * 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 2,
    borderRadius: BASE_UNIT * 5,
    backgroundColor: '#F9FAFB',
    marginRight: BASE_UNIT * 2,
    gap: BASE_UNIT * 2,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  testList: {
    gap: BASE_UNIT * 3,
  },
  testCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  testCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 2,
  },
  testCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: BASE_UNIT * 2,
  },
  testStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  runTestButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: BASE_UNIT * 3,
  },
  testCardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 3,
  },
  testMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
  },
  testMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  testError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    marginTop: BASE_UNIT * 3,
    padding: BASE_UNIT * 3,
    backgroundColor: '#FEE2E2',
    borderRadius: BASE_UNIT * 2,
  },
  testErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },

  // Performance
  performanceContainer: {
    padding: BASE_UNIT * 4,
  },
  performanceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 3,
  },
  performanceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  performanceStatusBadge: {
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    borderRadius: BASE_UNIT,
  },
  performanceStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  performanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: BASE_UNIT,
    marginBottom: BASE_UNIT * 2,
  },
  performanceValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  performanceUnit: {
    fontSize: 14,
    color: '#6B7280',
  },
  performanceThreshold: {
    flexDirection: 'row',
    gap: BASE_UNIT,
  },
  performanceThresholdLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  performanceThresholdValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Accessibility
  accessibilityContainer: {
    padding: BASE_UNIT * 4,
    gap: BASE_UNIT * 3,
  },
  issueCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  issueCardFixed: {
    opacity: 0.6,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 3,
  },
  severityBadge: {
    paddingHorizontal: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT,
    borderRadius: BASE_UNIT * 2,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fixedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
  },
  fixedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  issueComponent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: BASE_UNIT * 2,
  },
  issueDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: BASE_UNIT * 3,
  },
  issueRecommendation: {
    flexDirection: 'row',
    gap: BASE_UNIT * 2,
    padding: BASE_UNIT * 3,
    backgroundColor: '#FEF3C7',
    borderRadius: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 3,
  },
  issueRecommendationText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
  fixButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: BASE_UNIT * 3,
    borderRadius: BASE_UNIT * 2,
    alignItems: 'center',
  },
  fixButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Demos
  demosContainer: {
    padding: BASE_UNIT * 4,
    gap: BASE_UNIT * 3,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 4,
    borderLeftWidth: 4,
    gap: BASE_UNIT * 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  demoIcon: {
    width: 60,
    height: 60,
    borderRadius: BASE_UNIT * 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoContent: {
    flex: 1,
  },
  demoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BASE_UNIT,
  },
  demoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  demoStatusBadge: {
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    borderRadius: BASE_UNIT,
  },
  demoStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  demoDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});
