import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Explanation {
  summary: string;
  sections: ExplanationSection[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  language: string;
}

interface ExplanationSection {
  title: string;
  content: string;
  lineNumbers?: string;
}

const CodeExplainerScreen: React.FC = () => {
  const [codeInput, setCodeInput] = useState('');
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detailLevel, setDetailLevel] = useState<'brief' | 'detailed' | 'expert'>('detailed');
  const [isRecording, setIsRecording] = useState(false);

  const explainCode = useCallback(async () => {
    if (!codeInput.trim()) return;
    setIsLoading(true);

    // Simulate AI explanation
    setTimeout(() => {
      setExplanation({
        summary:
          'This code defines a React functional component that manages state and renders a user interface.',
        language: 'TypeScript/React',
        complexity: 'intermediate',
        sections: [
          {
            title: 'Component Definition',
            content:
              "The component is defined using arrow function syntax with React.FC type annotation, indicating it's a functional component with no props.",
            lineNumbers: '1-3',
          },
          {
            title: 'State Management',
            content:
              'useState hooks are used to manage local component state. This allows the component to re-render when state changes.',
            lineNumbers: '4-6',
          },
          {
            title: 'Event Handlers',
            content:
              'Callback functions wrapped in useCallback optimize performance by memoizing the function reference.',
            lineNumbers: '8-15',
          },
          {
            title: 'Render Logic',
            content:
              "The JSX return statement defines the component's visual output using a combination of View, Text, and TouchableOpacity components.",
            lineNumbers: '17-35',
          },
        ],
      });
      setIsLoading(false);
    }, 2000);
  }, [codeInput]);

  const toggleVoiceInput = useCallback(() => {
    setIsRecording(!isRecording);
    // TODO: Implement voice-to-text for code dictation or questions
  }, [isRecording]);

  const renderDetailButton = (level: typeof detailLevel, label: string) => (
    <TouchableOpacity
      style={[styles.detailButton, detailLevel === level && styles.detailButtonActive]}
      onPress={() => setDetailLevel(level)}
    >
      <Text
        style={[styles.detailButtonText, detailLevel === level && styles.detailButtonTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Code Explainer</Text>
        <TouchableOpacity style={styles.pasteButton}>
          <Ionicons name="clipboard-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.detailSelector}>
        {renderDetailButton('brief', 'Brief')}
        {renderDetailButton('detailed', 'Detailed')}
        {renderDetailButton('expert', 'Expert')}
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Paste or type your code:</Text>
          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="// Paste your code here..."
              placeholderTextColor="#999"
              value={codeInput}
              onChangeText={setCodeInput}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputActions}>
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
              onPress={toggleVoiceInput}
            >
              <Ionicons
                name={isRecording ? 'mic' : 'mic-outline'}
                size={24}
                color={isRecording ? '#FF3B30' : '#007AFF'}
              />
              <Text style={styles.voiceButtonText}>
                {isRecording ? 'Recording...' : 'Voice Question'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.explainButton, !codeInput.trim() && styles.explainButtonDisabled]}
              onPress={explainCode}
              disabled={!codeInput.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="bulb-outline" size={20} color="#FFF" />
                  <Text style={styles.explainButtonText}>Explain</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {explanation && (
          <View style={styles.explanationSection}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <View style={styles.languageBadge}>
                  <Text style={styles.languageText}>{explanation.language}</Text>
                </View>
              </View>
              <Text style={styles.summaryText}>{explanation.summary}</Text>
              <View style={styles.complexityRow}>
                <Text style={styles.complexityLabel}>Complexity:</Text>
                <View
                  style={[
                    styles.complexityBadge,
                    explanation.complexity === 'beginner' && styles.complexityBeginner,
                    explanation.complexity === 'intermediate' && styles.complexityIntermediate,
                    explanation.complexity === 'advanced' && styles.complexityAdvanced,
                  ]}
                >
                  <Text style={styles.complexityText}>{explanation.complexity}</Text>
                </View>
              </View>
            </View>

            {explanation.sections.map((section, index) => (
              <View key={index} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.lineNumbers && (
                    <Text style={styles.lineNumbers}>Lines {section.lineNumbers}</Text>
                  )}
                </View>
                <Text style={styles.sectionContent}>{section.content}</Text>
              </View>
            ))}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={18} color="#007AFF" />
                <Text style={styles.actionButtonText}>Ask Follow-up</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="copy-outline" size={18} color="#007AFF" />
                <Text style={styles.actionButtonText}>Copy Explanation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={18} color="#007AFF" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
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
  pasteButton: {
    padding: 8,
  },
  detailSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
    backgroundColor: '#F0F0F0',
  },
  detailButtonActive: {
    backgroundColor: '#007AFF',
  },
  detailButtonText: {
    fontSize: 14,
    color: '#666',
  },
  detailButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  inputSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  codeInputContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    minHeight: 150,
  },
  codeInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#D4D4D4',
    padding: 12,
    minHeight: 150,
  },
  inputActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 12,
  },
  voiceButtonActive: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF3B30',
  },
  voiceButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
  },
  explainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
  },
  explainButtonDisabled: {
    backgroundColor: '#CCC',
  },
  explainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 6,
  },
  explanationSection: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  languageBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  languageText: {
    fontSize: 12,
    color: '#007AFF',
  },
  summaryText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  complexityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  complexityLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  complexityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  complexityBeginner: {
    backgroundColor: '#E8F5E9',
  },
  complexityIntermediate: {
    backgroundColor: '#FFF3E0',
  },
  complexityAdvanced: {
    backgroundColor: '#FFEBEE',
  },
  complexityText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  lineNumbers: {
    fontSize: 12,
    color: '#007AFF',
  },
  sectionContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 4,
  },
});

export default CodeExplainerScreen;
