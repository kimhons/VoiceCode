import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface AnalysisResult {
  type: 'ui_element' | 'code' | 'error' | 'text';
  content: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

interface CapturedScreen {
  id: string;
  uri: string;
  timestamp: Date;
  analysis?: AnalysisResult[];
}

const ScreenCaptureAnalysisScreen: React.FC = () => {
  const [capturedScreens, setCapturedScreens] = useState<CapturedScreen[]>([]);
  const [selectedScreen, setSelectedScreen] = useState<CapturedScreen | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'ui' | 'code' | 'error' | 'text'>('ui');

  const captureScreen = useCallback(async () => {
    // TODO: Implement actual screen capture
    const mockScreen: CapturedScreen = {
      id: Date.now().toString(),
      uri: 'https://via.placeholder.com/300x600',
      timestamp: new Date(),
    };
    setCapturedScreens(prev => [mockScreen, ...prev]);
    setSelectedScreen(mockScreen);
  }, []);

  const analyzeScreen = useCallback(async (screen: CapturedScreen) => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      const mockAnalysis: AnalysisResult[] = [
        { type: 'ui_element', content: 'Button: "Submit"', confidence: 0.95 },
        { type: 'text', content: 'Header: Welcome to App', confidence: 0.92 },
        { type: 'code', content: 'function handleClick() {...}', confidence: 0.88 },
      ];
      setSelectedScreen({ ...screen, analysis: mockAnalysis });
      setIsAnalyzing(false);
    }, 2000);
  }, []);

  const renderAnalysisModeButton = (mode: typeof analysisMode, icon: string, label: string) => (
    <TouchableOpacity
      style={[styles.modeButton, analysisMode === mode && styles.modeButtonActive]}
      onPress={() => setAnalysisMode(mode)}
    >
      <Ionicons name={icon as any} size={20} color={analysisMode === mode ? '#FFF' : '#007AFF'} />
      <Text style={[styles.modeButtonText, analysisMode === mode && styles.modeButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Screen Analysis</Text>
        <TouchableOpacity style={styles.captureButton} onPress={captureScreen}>
          <Ionicons name="camera" size={20} color="#FFF" />
          <Text style={styles.captureButtonText}>Capture</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeSelector}>
        {renderAnalysisModeButton('ui', 'grid-outline', 'UI Elements')}
        {renderAnalysisModeButton('code', 'code-slash', 'Code')}
        {renderAnalysisModeButton('error', 'warning-outline', 'Errors')}
        {renderAnalysisModeButton('text', 'text-outline', 'Text')}
      </View>

      <ScrollView style={styles.content}>
        {selectedScreen ? (
          <View style={styles.analysisContainer}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedScreen.uri }}
                style={styles.capturedImage}
                resizeMode="contain"
              />
              {isAnalyzing && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.analyzingText}>Analyzing screen...</Text>
                </View>
              )}
            </View>

            {!selectedScreen.analysis && !isAnalyzing && (
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={() => analyzeScreen(selectedScreen)}
              >
                <Ionicons name="scan" size={20} color="#FFF" />
                <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
              </TouchableOpacity>
            )}

            {selectedScreen.analysis && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Analysis Results</Text>
                {selectedScreen.analysis.map((result, index) => (
                  <View key={index} style={styles.resultItem}>
                    <View style={styles.resultHeader}>
                      <Ionicons
                        name={
                          result.type === 'ui_element'
                            ? 'grid'
                            : result.type === 'code'
                              ? 'code-slash'
                              : result.type === 'error'
                                ? 'warning'
                                : 'text'
                        }
                        size={16}
                        color="#007AFF"
                      />
                      <Text style={styles.resultType}>{result.type.replace('_', ' ')}</Text>
                      <Text style={styles.resultConfidence}>
                        {Math.round(result.confidence * 100)}%
                      </Text>
                    </View>
                    <Text style={styles.resultContent}>{result.content}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="camera-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateTitle}>No Screen Captured</Text>
            <Text style={styles.emptyStateText}>
              Capture a screenshot or share an image to analyze UI elements, extract code, or
              identify errors.
            </Text>
          </View>
        )}

        {capturedScreens.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent Captures</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {capturedScreens.map(screen => (
                <TouchableOpacity
                  key={screen.id}
                  style={[
                    styles.historyItem,
                    selectedScreen?.id === screen.id && styles.historyItemSelected,
                  ]}
                  onPress={() => setSelectedScreen(screen)}
                >
                  <Image source={{ uri: screen.uri }} style={styles.historyImage} />
                  <Text style={styles.historyTime}>
                    {screen.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  captureButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
  modeButtonTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  analysisContainer: {
    padding: 16,
  },
  imageContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  capturedImage: {
    width: '100%',
    height: 300,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  analyzeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  resultItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultType: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginLeft: 6,
  },
  resultConfidence: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 'auto',
  },
  resultContent: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  historyContainer: {
    padding: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  historyItem: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  historyItemSelected: {
    borderColor: '#007AFF',
  },
  historyImage: {
    width: 80,
    height: 120,
  },
  historyTime: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: '#F5F5F5',
  },
});

export default ScreenCaptureAnalysisScreen;
