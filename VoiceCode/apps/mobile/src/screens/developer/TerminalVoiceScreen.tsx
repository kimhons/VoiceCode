import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

const TerminalVoiceScreen: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '1', type: 'system', content: 'VoiceCode Terminal v1.0.0', timestamp: new Date() },
    {
      id: '2',
      type: 'system',
      content: 'Voice commands enabled. Say "help" for available commands.',
      timestamp: new Date(),
    },
    { id: '3', type: 'command', content: '$ npm run test', timestamp: new Date() },
    { id: '4', type: 'output', content: 'PASS  src/__tests__/App.test.tsx', timestamp: new Date() },
    { id: '5', type: 'output', content: 'Test Suites: 12 passed, 12 total', timestamp: new Date() },
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const executeCommand = useCallback((command: string) => {
    if (!command.trim()) return;

    const newCommand: TerminalLine = {
      id: Date.now().toString(),
      type: 'command',
      content: `$ ${command}`,
      timestamp: new Date(),
    };

    setLines(prev => [...prev, newCommand]);
    setCommandInput('');

    // Simulate command execution
    setTimeout(() => {
      let output: TerminalLine;
      const lowerCommand = command.toLowerCase();

      if (lowerCommand.startsWith('npm')) {
        output = {
          id: (Date.now() + 1).toString(),
          type: 'output',
          content: 'npm command executed successfully',
          timestamp: new Date(),
        };
      } else if (lowerCommand === 'ls' || lowerCommand === 'dir') {
        output = {
          id: (Date.now() + 1).toString(),
          type: 'output',
          content: 'src/  node_modules/  package.json  tsconfig.json  README.md',
          timestamp: new Date(),
        };
      } else if (lowerCommand === 'clear') {
        setLines([]);
        return;
      } else if (lowerCommand === 'help') {
        output = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content:
            'Available commands: npm, git, ls, cd, clear, help\nVoice: "run tests", "install packages", "check status"',
          timestamp: new Date(),
        };
      } else {
        output = {
          id: (Date.now() + 1).toString(),
          type: 'error',
          content: `Command not found: ${command}`,
          timestamp: new Date(),
        };
      }

      setLines(prev => [...prev, output]);
    }, 500);
  }, []);

  const toggleVoice = useCallback(() => {
    setIsRecording(prev => !prev);
    if (!isRecording) {
      setSuggestions(['run tests', 'git status', 'npm install', 'build project']);
    } else {
      setSuggestions([]);
    }
  }, [isRecording]);

  const handleVoiceSuggestion = (suggestion: string) => {
    const commandMap: Record<string, string> = {
      'run tests': 'npm run test',
      'git status': 'git status',
      'npm install': 'npm install',
      'build project': 'npm run build',
    };
    executeCommand(commandMap[suggestion] || suggestion);
    setSuggestions([]);
    setIsRecording(false);
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command':
        return '#50FA7B';
      case 'output':
        return '#F8F8F2';
      case 'error':
        return '#FF5555';
      case 'system':
        return '#6272A4';
      default:
        return '#F8F8F2';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Terminal</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="settings-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => setLines([])}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.terminalContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.terminal}
          contentContainerStyle={styles.terminalContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
        >
          {lines.map(line => (
            <Text key={line.id} style={[styles.terminalLine, { color: getLineColor(line.type) }]}>
              {line.content}
            </Text>
          ))}
        </ScrollView>
      </View>

      {isRecording && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Voice Commands</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => handleVoiceSuggestion(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
          onPress={toggleVoice}
        >
          <Ionicons
            name={isRecording ? 'mic' : 'mic-outline'}
            size={24}
            color={isRecording ? '#FF3B30' : '#50FA7B'}
          />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <Text style={styles.prompt}>$</Text>
          <TextInput
            style={styles.commandInput}
            placeholder="Enter command..."
            placeholderTextColor="#6272A4"
            value={commandInput}
            onChangeText={setCommandInput}
            onSubmitEditing={() => executeCommand(commandInput)}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
          />
        </View>
        <TouchableOpacity style={styles.sendButton} onPress={() => executeCommand(commandInput)}>
          <Ionicons name="return-down-back" size={20} color="#50FA7B" />
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={() => executeCommand('npm run test')}>
          <Ionicons name="flask" size={18} color="#007AFF" />
          <Text style={styles.quickActionText}>Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => executeCommand('npm run build')}
        >
          <Ionicons name="construct" size={18} color="#007AFF" />
          <Text style={styles.quickActionText}>Build</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => executeCommand('git status')}>
          <Ionicons name="git-branch" size={18} color="#007AFF" />
          <Text style={styles.quickActionText}>Status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => executeCommand('npm run lint')}>
          <Ionicons name="checkmark-circle" size={18} color="#007AFF" />
          <Text style={styles.quickActionText}>Lint</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#282A36',
    borderBottomWidth: 1,
    borderBottomColor: '#44475A',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8F8F2',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  terminalContainer: {
    flex: 1,
  },
  terminal: {
    flex: 1,
    backgroundColor: '#282A36',
  },
  terminalContent: {
    padding: 12,
  },
  terminalLine: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 2,
  },
  suggestionsContainer: {
    backgroundColor: '#44475A',
    padding: 12,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#6272A4',
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#6272A4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    color: '#F8F8F2',
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#282A36',
    borderTopWidth: 1,
    borderTopColor: '#44475A',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#44475A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#FF555530',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  prompt: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#50FA7B',
    marginRight: 8,
  },
  commandInput: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#F8F8F2',
    paddingVertical: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#282A36',
    borderTopWidth: 1,
    borderTopColor: '#44475A',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#44475A',
    borderRadius: 8,
  },
  quickActionText: {
    color: '#F8F8F2',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default TerminalVoiceScreen;
