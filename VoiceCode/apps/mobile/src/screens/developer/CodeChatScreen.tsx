import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlocks?: CodeBlock[];
}

interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

interface ConversationContext {
  projectName?: string;
  currentFile?: string;
  selectedCode?: string;
  recentFiles?: string[];
}

const CodeChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your AI coding assistant. I can help you understand code, debug issues, write new features, and have technical discussions. What would you like to work on?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [context, setContext] = useState<ConversationContext>({
    projectName: 'VoiceCode',
    currentFile: undefined,
    selectedCode: undefined,
  });
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(userMessage.content),
        timestamp: new Date(),
        codeBlocks: extractCodeSuggestions(userMessage.content),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  }, [inputText, isLoading]);

  const generateResponse = (query: string): string => {
    // Placeholder response generation
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('explain')) {
      return "I'd be happy to explain that code. The function works by iterating through the array and applying the transformation to each element. Would you like me to break down any specific part?";
    }
    if (lowerQuery.includes('debug') || lowerQuery.includes('error')) {
      return "Let me help you debug that. Based on the error message, it looks like there might be a null reference. Try adding a null check before accessing the property. Here's a suggested fix:";
    }
    if (lowerQuery.includes('refactor')) {
      return "Here's a refactored version that improves readability and follows best practices. I've extracted the logic into smaller functions and added proper error handling.";
    }
    return "I understand. Let me analyze that and provide some suggestions. Could you share more context about what you're trying to achieve?";
  };

  const extractCodeSuggestions = (query: string): CodeBlock[] | undefined => {
    if (query.toLowerCase().includes('example') || query.toLowerCase().includes('code')) {
      return [
        {
          language: 'typescript',
          code: `// Example code suggestion
function processData(items: string[]): string[] {
  return items
    .filter(item => item.length > 0)
    .map(item => item.trim());
}`,
          filename: 'example.ts',
        },
      ];
    }
    return undefined;
  };

  const toggleVoiceInput = useCallback(() => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
  }, [isRecording]);

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    return (
      <View
        key={message.id}
        style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}
      >
        <View style={styles.messageHeader}>
          <Ionicons
            name={isUser ? 'person' : 'code-slash'}
            size={16}
            color={isUser ? '#007AFF' : '#34C759'}
          />
          <Text style={styles.messageRole}>{isUser ? 'You' : 'AI Assistant'}</Text>
          <Text style={styles.messageTime}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.messageContent}>{message.content}</Text>
        {message.codeBlocks?.map((block, index) => (
          <View key={index} style={styles.codeBlock}>
            <View style={styles.codeHeader}>
              <Text style={styles.codeLanguage}>{block.language}</Text>
              {block.filename && <Text style={styles.codeFilename}>{block.filename}</Text>}
              <TouchableOpacity style={styles.copyButton}>
                <Ionicons name="copy-outline" size={16} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.codeText}>{block.code}</Text>
            </ScrollView>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Code Chat</Text>
        <View style={styles.contextBadge}>
          <Ionicons name="folder-outline" size={14} color="#666" />
          <Text style={styles.contextText}>{context.projectName || 'No project'}</Text>
        </View>
      </View>

      <View style={styles.contextBar}>
        <TouchableOpacity style={styles.contextButton}>
          <Ionicons name="attach" size={18} color="#007AFF" />
          <Text style={styles.contextButtonText}>Add Context</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contextButton}>
          <Ionicons name="document-text-outline" size={18} color="#007AFF" />
          <Text style={styles.contextButtonText}>Select File</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contextButton}>
          <Ionicons name="code-outline" size={18} color="#007AFF" />
          <Text style={styles.contextButtonText}>Paste Code</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
            onPress={toggleVoiceInput}
          >
            <Ionicons
              name={isRecording ? 'mic' : 'mic-outline'}
              size={24}
              color={isRecording ? '#FF3B30' : '#007AFF'}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about code, debug issues, or discuss architecture..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color={inputText.trim() ? '#007AFF' : '#CCC'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contextText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  contextBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  contextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contextButtonText: {
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    maxWidth: '95%',
  },
  userMessage: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginLeft: 'auto',
  },
  messageContent: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  codeBlock: {
    marginTop: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    overflow: 'hidden',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#2D2D2D',
  },
  codeLanguage: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
  },
  codeFilename: {
    fontSize: 11,
    color: '#888',
    marginLeft: 8,
  },
  copyButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#D4D4D4',
    padding: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#FFE5E5',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default CodeChatScreen;
