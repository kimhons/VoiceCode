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

interface DebugSuggestion {
  id: string;
  type: 'fix' | 'investigation' | 'explanation';
  title: string;
  description: string;
  code?: string;
  confidence: number;
}

interface ErrorContext {
  message: string;
  stack?: string;
  file?: string;
  line?: number;
}

const DebuggingAssistantScreen: React.FC = () => {
  const [errorInput, setErrorInput] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<DebugSuggestion[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorContext | null>(null);

  const analyzeError = useCallback(async () => {
    if (!errorInput.trim()) return;
    setIsAnalyzing(true);

    // Parse error and set context
    setSelectedError({
      message: errorInput.split('\n')[0],
      stack: errorInput,
    });

    // Simulate AI analysis
    setTimeout(() => {
      setSuggestions([
        {
          id: '1',
          type: 'fix',
          title: 'Add null check before accessing property',
          description:
            'The error occurs because the object might be undefined. Add a null check or use optional chaining.',
          code: `// Before\nconst value = obj.property;\n\n// After\nconst value = obj?.property;`,
          confidence: 0.92,
        },
        {
          id: '2',
          type: 'investigation',
          title: 'Check data source initialization',
          description:
            'The object might not be initialized properly. Verify the data is loaded before accessing.',
          confidence: 0.78,
        },
        {
          id: '3',
          type: 'explanation',
          title: 'Understanding the error',
          description:
            'This "Cannot read property of undefined" error typically occurs when trying to access a property on a variable that hasn\'t been assigned a value yet.',
          confidence: 0.95,
        },
      ]);
      setIsAnalyzing(false);
    }, 2000);
  }, [errorInput]);

  const getSuggestionIcon = (type: DebugSuggestion['type']) => {
    switch (type) {
      case 'fix':
        return 'construct';
      case 'investigation':
        return 'search';
      case 'explanation':
        return 'bulb';
      default:
        return 'help-circle';
    }
  };

  const getSuggestionColor = (type: DebugSuggestion['type']) => {
    switch (type) {
      case 'fix':
        return '#34C759';
      case 'investigation':
        return '#FF9500';
      case 'explanation':
        return '#007AFF';
      default:
        return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debugging Assistant</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Ionicons name="time-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Paste error message or stack trace:</Text>
          <View style={styles.errorInputContainer}>
            <TextInput
              style={styles.errorInput}
              placeholder="TypeError: Cannot read property 'x' of undefined&#10;    at Component.render (file.js:10:5)"
              placeholderTextColor="#666"
              value={errorInput}
              onChangeText={setErrorInput}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Additional context (optional):</Text>
          <TextInput
            style={styles.contextInput}
            placeholder="Describe what you were trying to do..."
            placeholderTextColor="#999"
            value={contextInput}
            onChangeText={setContextInput}
            multiline
          />

          <View style={styles.inputActions}>
            <TouchableOpacity style={styles.voiceButton}>
              <Ionicons name="mic-outline" size={22} color="#007AFF" />
              <Text style={styles.voiceButtonText}>Describe Issue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.analyzeButton, !errorInput.trim() && styles.analyzeButtonDisabled]}
              onPress={analyzeError}
              disabled={!errorInput.trim() || isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="bug-outline" size={20} color="#FFF" />
                  <Text style={styles.analyzeButtonText}>Analyze</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {selectedError && !isAnalyzing && suggestions.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.errorSummary}>
              <Ionicons name="alert-circle" size={20} color="#FF3B30" />
              <Text style={styles.errorMessage} numberOfLines={2}>
                {selectedError.message}
              </Text>
            </View>

            <Text style={styles.suggestionsTitle}>Suggested Solutions</Text>

            {suggestions.map(suggestion => (
              <TouchableOpacity key={suggestion.id} style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <View
                    style={[
                      styles.suggestionIcon,
                      { backgroundColor: `${getSuggestionColor(suggestion.type)}20` },
                    ]}
                  >
                    <Ionicons
                      name={getSuggestionIcon(suggestion.type) as any}
                      size={18}
                      color={getSuggestionColor(suggestion.type)}
                    />
                  </View>
                  <View style={styles.suggestionTitleContainer}>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    <Text style={styles.suggestionType}>{suggestion.type}</Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {Math.round(suggestion.confidence * 100)}%
                    </Text>
                  </View>
                </View>

                <Text style={styles.suggestionDescription}>{suggestion.description}</Text>

                {suggestion.code && (
                  <View style={styles.codeBlock}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Text style={styles.codeText}>{suggestion.code}</Text>
                    </ScrollView>
                    <TouchableOpacity style={styles.copyCodeButton}>
                      <Ionicons name="copy-outline" size={16} color="#007AFF" />
                      <Text style={styles.copyCodeText}>Copy Fix</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.suggestionActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#34C759" />
                    <Text style={[styles.actionButtonText, { color: '#34C759' }]}>Apply Fix</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="chatbubble-outline" size={18} color="#007AFF" />
                    <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>Discuss</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!selectedError && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Debugging Tips</Text>
            <View style={styles.tipCard}>
              <Ionicons name="clipboard-outline" size={24} color="#007AFF" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Paste Complete Stack Traces</Text>
                <Text style={styles.tipText}>
                  Include the full error message and stack trace for better analysis
                </Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <Ionicons name="image-outline" size={24} color="#007AFF" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Share Screenshots</Text>
                <Text style={styles.tipText}>
                  Take screenshots of error dialogs for visual context
                </Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <Ionicons name="code-slash" size={24} color="#007AFF" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Include Relevant Code</Text>
                <Text style={styles.tipText}>Share the code around the error location</Text>
              </View>
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
  historyButton: {
    padding: 8,
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
  errorInputContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    minHeight: 120,
  },
  errorInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#FF6B6B',
    padding: 12,
    minHeight: 120,
  },
  contextInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 60,
  },
  inputActions: {
    flexDirection: 'row',
    marginTop: 16,
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
  voiceButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
  },
  analyzeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#CCC',
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 6,
  },
  resultsSection: {
    padding: 16,
  },
  errorSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorMessage: {
    flex: 1,
    fontSize: 13,
    color: '#FF3B30',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  suggestionType: {
    fontSize: 11,
    color: '#666',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34C759',
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  codeBlock: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#D4D4D4',
  },
  copyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  copyCodeText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
  suggestionActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionButtonText: {
    fontSize: 13,
    marginLeft: 4,
  },
  tipsSection: {
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
});

export default DebuggingAssistantScreen;
