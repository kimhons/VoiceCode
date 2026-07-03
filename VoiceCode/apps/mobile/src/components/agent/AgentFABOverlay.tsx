/**
 * AgentFABOverlay - Floating Action Button and Bottom Sheet for Mobile
 * Non-disruptive agent access from any screen
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAgentContext } from '../../contexts/AgentContext';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  command: string;
}

const defaultQuickActions: QuickAction[] = [
  { id: '1', label: 'Summarize', icon: '📝', command: 'summarize_transcript' },
  { id: '2', label: 'Action Items', icon: '✅', command: 'extract_action_items' },
  { id: '3', label: 'Key Points', icon: '💡', command: 'extract_key_points' },
];

const medicalQuickActions: QuickAction[] = [
  { id: 'm1', label: 'SOAP Note', icon: '🏥', command: 'generate_soap_note' },
  { id: 'm2', label: 'Progress Note', icon: '📋', command: 'generate_progress_note' },
  { id: 'm3', label: 'Billing Codes', icon: '💰', command: 'suggest_billing_codes' },
];

export const AgentFABOverlay: React.FC = () => {
  const {
    isFABOpen,
    toggleFAB,
    closeFAB,
    executeCommand,
    navigateToChat,
    professionalMode,
    currentContext,
    isLoading,
  } = useAgentContext();

  const [inputValue, setInputValue] = React.useState('');
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Get actions based on mode
  const quickActions = professionalMode === 'medical' ? medicalQuickActions : defaultQuickActions;

  // Animation effects
  useEffect(() => {
    if (isFABOpen) {
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
  }, [isFABOpen, scaleAnim, rotateAnim]);

  const handleAction = async (action: QuickAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await executeCommand(action.command, { transcript_id: currentContext.transcriptId });
      closeFAB();
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigateToChat(inputValue);
    setInputValue('');
    Keyboard.dismiss();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* FAB Button */}
      <TouchableOpacity style={styles.fab} onPress={toggleFAB} activeOpacity={0.8}>
        <Animated.Text style={[styles.fabIcon, { transform: [{ rotate }] }]}>
          {isFABOpen ? '✕' : '🤖'}
        </Animated.Text>
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Modal visible={isFABOpen} animationType="slide" transparent onRequestClose={closeFAB}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.backdrop} onPress={closeFAB} activeOpacity={1} />

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
            {currentContext.transcriptTitle && (
              <View style={styles.contextContainer}>
                <Text style={styles.contextText}>📄 {currentContext.transcriptTitle}</Text>
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
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputValue.trim() && styles.sendButtonDisabled]}
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
              {quickActions.map(action => (
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
    right: 24,
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

export default AgentFABOverlay;
