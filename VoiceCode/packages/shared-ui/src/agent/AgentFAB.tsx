/**
 * AgentFAB - Floating Action Button for Mobile
 * Non-disruptive bottom-right trigger for agent access
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  command: string;
}

interface AgentFABProps {
  onAction: (command: string, params?: Record<string, any>) => Promise<any>;
  onChat: (message: string) => void;
  context?: {
    currentScreen?: string;
    transcriptId?: string;
    transcriptTitle?: string;
    professionalMode?: string;
  };
  quickActions?: QuickAction[];
  position?: 'bottom-right' | 'bottom-left';
}

const defaultQuickActions: QuickAction[] = [
  { id: '1', label: 'Summarize', icon: '📝', command: 'summarize_transcript' },
  {
    id: '2',
    label: 'Action Items',
    icon: '✅',
    command: 'extract_action_items',
  },
  { id: '3', label: 'Key Points', icon: '💡', command: 'extract_key_points' },
];

const medicalQuickActions: QuickAction[] = [
  { id: 'm1', label: 'SOAP Note', icon: '🏥', command: 'generate_soap_note' },
  {
    id: 'm2',
    label: 'Progress Note',
    icon: '📋',
    command: 'generate_progress_note',
  },
  {
    id: 'm3',
    label: 'Billing Codes',
    icon: '💰',
    command: 'suggest_billing_codes',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AgentFAB: React.FC<AgentFABProps> = ({
  onAction,
  onChat,
  context = {},
  quickActions,
  position = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Determine actions based on context
  const actions =
    quickActions ||
    (context.professionalMode === 'medical'
      ? medicalQuickActions
      : defaultQuickActions);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, scaleAnim, rotateAnim]);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOpen(!isOpen);
    setInputValue('');
  };

  const handleAction = async (action: QuickAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);

    try {
      await onAction(action.command, { transcript_id: context.transcriptId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsOpen(false);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChat(inputValue);
    setInputValue('');
    setIsOpen(false);
    Keyboard.dismiss();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* FAB Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          position === 'bottom-left' ? styles.fabLeft : styles.fabRight,
        ]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <Animated.Text style={[styles.fabIcon, { transform: [{ rotate }] }]}>
          {isOpen ? '✕' : '🤖'}
        </Animated.Text>
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setIsOpen(false)}
            activeOpacity={1}
          />

          <Animated.View
            style={[
              styles.sheet,
              {
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Drag Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerIcon}>🤖</Text>
              <Text style={styles.headerTitle}>VoiceCode AI</Text>
            </View>

            {/* Context */}
            {context.transcriptTitle && (
              <View style={styles.contextContainer}>
                <Text style={styles.contextText}>
                  📄 {context.transcriptTitle}
                </Text>
              </View>
            )}

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask anything..."
                placeholderTextColor="#6b7280"
                value={inputValue}
                onChangeText={setInputValue}
                onSubmitEditing={handleSubmit}
                returnKeyType="send"
                multiline={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputValue.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!inputValue.trim()}
              >
                <Text style={styles.sendIcon}>↑</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.actionsContainer}
            >
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionButton}
                  onPress={() => handleAction(action)}
                  disabled={isLoading}
                >
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                AI can make mistakes. Verify important information.
              </Text>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  fabRight: {
    right: 24,
  },
  fabLeft: {
    left: 24,
  },
  fabIcon: {
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4b5563',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  contextContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  contextText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  sendIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    minWidth: 90,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default AgentFAB;
