/**
 * AI Chat Screen - Mobile-Optimized Conversation Interface
 * Features: Streaming responses, voice input, haptic feedback,
 * conversation history, and VoiceCode integration
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: Attachment[];
  feedback?: 'positive' | 'negative';
}

interface Attachment {
  id: string;
  name: string;
  type: 'transcript' | 'file' | 'audio';
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
  isPinned?: boolean;
}

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  prompt: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    id: '1',
    icon: 'document-text',
    label: 'SOAP Note',
    prompt: 'Generate a SOAP note from my latest transcription',
    color: '#6366f1',
  },
  {
    id: '2',
    icon: 'list',
    label: 'Action Items',
    prompt: 'Extract all action items from the transcript',
    color: '#10b981',
  },
  {
    id: '3',
    icon: 'sparkles',
    label: 'Summarize',
    prompt: 'Give me a brief summary',
    color: '#f59e0b',
  },
  {
    id: '4',
    icon: 'bulb',
    label: 'Key Insights',
    prompt: 'What are the key insights discussed?',
    color: '#ec4899',
  },
];

const sampleConversations: Conversation[] = [
  { id: '1', title: 'Patient Consultation Analysis', updatedAt: new Date(), isPinned: true },
  { id: '2', title: 'Team Meeting Summary', updatedAt: new Date(Date.now() - 86400000) },
  { id: '3', title: 'Clinical Documentation Help', updatedAt: new Date(Date.now() - 172800000) },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChatScreen: React.FC = () => {
  // Navigation available if needed
  const _navigation = useNavigation();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations] = useState<Conversation[]>(sampleConversations);
  const [selectedModel, setSelectedModel] = useState('GPT-4');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Simulate streaming response
  const streamResponse = useCallback(
    async (userMessage: string) => {
      const assistantId = Date.now().toString();

      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        },
      ]);

      const responses = [
        "I'll analyze that for you. ",
        'Based on the context provided, ',
        'here are my findings:\n\n',
        '**Key Points:**\n',
        '• The main topic discussed was ',
        userMessage.includes('medical') ? 'patient care.\n' : 'the project.\n',
        '• Several action items were identified.\n',
        '• Follow-up is recommended.\n\n',
        '**Summary:**\n',
        'The conversation covered important topics. ',
        'Would you like me to elaborate?',
      ];

      let fullContent = '';
      for (const chunk of responses) {
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        fullContent += chunk;
        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? { ...m, content: fullContent } : m))
        );
        scrollToBottom();
      }

      setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, isStreaming: false } : m)));
      setIsGenerating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [scrollToBottom]
  );

  // Send message
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isGenerating) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);
    scrollToBottom();

    await streamResponse(inputValue);
  }, [inputValue, isGenerating, streamResponse, scrollToBottom]);

  // Copy message
  const copyMessage = useCallback((id: string, content: string) => {
    // In real app, use Clipboard API
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Toggle feedback
  const toggleFeedback = useCallback((id: string, type: 'positive' | 'negative') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, feedback: m.feedback === type ? undefined : type } : m))
    );
  }, []);

  // Use quick action
  const useQuickAction = useCallback((prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInputValue(prompt);
    inputRef.current?.focus();
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRecording(!isRecording);
  }, [isRecording]);

  // New chat
  const newChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages([]);
    setShowHistory(false);
  }, []);

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render message
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isUser = item.role === 'user';

      return (
        <View
          style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}
        >
          {/* Avatar */}
          <View style={[styles.avatar, isUser ? styles.userAvatar : styles.assistantAvatar]}>
            {isUser ? (
              <Ionicons name="person" size={18} color="#fff" />
            ) : (
              <MaterialCommunityIcons name="robot" size={18} color="#fff" />
            )}
          </View>

          {/* Content */}
          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageSender}>{isUser ? 'You' : 'VoiceCode AI'}</Text>
              <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
            </View>

            <Text style={styles.messageText}>
              {item.content}
              {item.isStreaming && <Text style={styles.cursor}>▊</Text>}
            </Text>

            {/* Actions */}
            {!item.isStreaming && (
              <View style={styles.messageActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => copyMessage(item.id, item.content)}
                >
                  <Ionicons
                    name={copiedId === item.id ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={copiedId === item.id ? '#10b981' : '#6b7280'}
                  />
                  <Text
                    style={[styles.actionText, copiedId === item.id && styles.actionTextSuccess]}
                  >
                    {copiedId === item.id ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>

                {!isUser && (
                  <>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => toggleFeedback(item.id, 'positive')}
                    >
                      <Ionicons
                        name={item.feedback === 'positive' ? 'thumbs-up' : 'thumbs-up-outline'}
                        size={16}
                        color={item.feedback === 'positive' ? '#10b981' : '#6b7280'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => toggleFeedback(item.id, 'negative')}
                    >
                      <Ionicons
                        name={item.feedback === 'negative' ? 'thumbs-down' : 'thumbs-down-outline'}
                        size={16}
                        color={item.feedback === 'negative' ? '#ef4444' : '#6b7280'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="refresh-outline" size={16} color="#6b7280" />
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="volume-high-outline" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    },
    [copiedId, copyMessage, toggleFeedback]
  );

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="robot-happy" size={48} color="#fff" />
      </View>
      <Text style={styles.emptyTitle}>How can I help you today?</Text>
      <Text style={styles.emptySubtitle}>Ask me anything about your transcriptions</Text>

      {/* Quick Actions */}
      <View style={styles.quickActionsGrid}>
        {quickActions.map(action => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickActionCard}
            onPress={() => {
              setInputValue(action.prompt);
              inputRef.current?.focus();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon as any} size={22} color={action.color} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => setShowHistory(true)}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.modelSelector} onPress={() => setShowModelPicker(true)}>
          <MaterialCommunityIcons name="robot" size={18} color="#8b5cf6" />
          <Text style={styles.modelText}>{selectedModel}</Text>
          <Ionicons name="chevron-down" size={16} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerButton} onPress={newChat}>
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderEmptyState()}
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="attach" size={22} color="#6b7280" />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Ask anything..."
              placeholderTextColor="#6b7280"
              multiline
              maxLength={4000}
            />

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                onPress={toggleRecording}
              >
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={20}
                  color={isRecording ? '#fff' : '#6b7280'}
                />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (inputValue.trim() || isGenerating) && styles.sendButtonActive,
              ]}
              onPress={isGenerating ? () => setIsGenerating(false) : sendMessage}
              disabled={!inputValue.trim() && !isGenerating}
            >
              {isGenerating ? (
                <Ionicons name="stop" size={20} color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>AI can make mistakes. Verify important information.</Text>
        </View>
      </KeyboardAvoidingView>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Conversations</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.newChatButton} onPress={newChat}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>

          <ScrollView style={styles.conversationsList}>
            {conversations.some(c => c.isPinned) && (
              <View style={styles.conversationSection}>
                <Text style={styles.sectionTitle}>📌 Pinned</Text>
                {conversations
                  .filter(c => c.isPinned)
                  .map(conv => (
                    <TouchableOpacity
                      key={conv.id}
                      style={styles.conversationItem}
                      onPress={() => setShowHistory(false)}
                    >
                      <Ionicons name="chatbubble-outline" size={18} color="#9ca3af" />
                      <Text style={styles.conversationTitle} numberOfLines={1}>
                        {conv.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}

            <View style={styles.conversationSection}>
              <Text style={styles.sectionTitle}>Recent</Text>
              {conversations
                .filter(c => !c.isPinned)
                .map(conv => (
                  <TouchableOpacity
                    key={conv.id}
                    style={styles.conversationItem}
                    onPress={() => setShowHistory(false)}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color="#9ca3af" />
                    <Text style={styles.conversationTitle} numberOfLines={1}>
                      {conv.title}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Model Picker Modal */}
      <Modal
        visible={showModelPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowModelPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModelPicker(false)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Model</Text>
            {['GPT-4', 'GPT-4 Turbo', 'GPT-3.5 Turbo', 'Claude 3'].map(model => (
              <TouchableOpacity
                key={model}
                style={[styles.pickerOption, selectedModel === model && styles.pickerOptionActive]}
                onPress={() => {
                  setSelectedModel(model);
                  setShowModelPicker(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    selectedModel === model && styles.pickerOptionTextActive,
                  ]}
                >
                  {model}
                </Text>
                {selectedModel === model && <Ionicons name="checkmark" size={20} color="#8b5cf6" />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerButton: {
    padding: 8,
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
    borderRadius: 20,
  },
  modelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  userMessage: {},
  assistantMessage: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: -4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    backgroundColor: '#374151',
  },
  assistantAvatar: {
    backgroundColor: '#6366f1',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  messageSender: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageTime: {
    color: '#6b7280',
    fontSize: 12,
  },
  messageText: {
    color: '#e5e7eb',
    fontSize: 15,
    lineHeight: 22,
  },
  cursor: {
    color: '#8b5cf6',
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionText: {
    color: '#6b7280',
    fontSize: 12,
  },
  actionTextSuccess: {
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#1f2937',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  attachButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  voiceButton: {
    padding: 8,
    borderRadius: 20,
  },
  voiceButtonActive: {
    backgroundColor: '#ef4444',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#6366f1',
  },
  disclaimer: {
    color: '#6b7280',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  newChatText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  conversationSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    marginBottom: 6,
  },
  conversationTitle: {
    flex: 1,
    color: '#e5e7eb',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 8,
  },
  pickerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 8,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
  },
  pickerOptionActive: {
    backgroundColor: '#374151',
  },
  pickerOptionText: {
    color: '#e5e7eb',
    fontSize: 15,
  },
  pickerOptionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default ChatScreen;
