/**
 * AgentFAB - Floating Action Button for agent access
 * Provides quick access to AI assistant throughout the mobile app
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAgentContext } from '../../contexts/AgentContext';
import { useTheme } from '../../contexts/ThemeContext';

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
  { id: '4', label: 'Search', icon: '🔍', command: 'search_transcripts' },
];

const medicalQuickActions: QuickAction[] = [
  { id: 'm1', label: 'SOAP Note', icon: '🏥', command: 'generate_soap_note' },
  { id: 'm2', label: 'Progress Note', icon: '📋', command: 'generate_progress_note' },
  { id: 'm3', label: 'Billing Codes', icon: '💰', command: 'suggest_billing_codes' },
];

export const AgentFAB: React.FC = () => {
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
  const { theme } = useTheme();

  const [inputValue, setInputValue] = React.useState('');
  const [loadingCommand, setLoadingCommand] = React.useState<string | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get actions based on mode
  const quickActions =
    professionalMode === 'medical'
      ? [...medicalQuickActions, ...defaultQuickActions]
      : defaultQuickActions;

  // Animate FAB on press
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFABOpen ? 1.1 : 1,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: isFABOpen ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: isFABOpen ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFABOpen, scaleAnim, rotateAnim, fadeAnim]);

  const handleAction = useCallback(
    async (action: QuickAction) => {
      setLoadingCommand(action.id);
      try {
        await executeCommand(action.command, {
          transcript_id: currentContext.transcriptId,
        });
      } catch (error) {
        console.error('Action failed:', error);
      } finally {
        setLoadingCommand(null);
        closeFAB();
      }
    },
    [executeCommand, currentContext.transcriptId, closeFAB]
  );

  const handleChat = useCallback(() => {
    navigateToChat(inputValue || undefined);
    setInputValue('');
  }, [navigateToChat, inputValue]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const styles = StyleSheet.create({
    fabContainer: {
      position: 'absolute',
      right: 20,
      bottom: 100,
      zIndex: 1000,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    fabIcon: {
      fontSize: 24,
      color: '#fff',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 16,
      paddingBottom: 40,
      maxHeight: Dimensions.get('window').height * 0.7,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    headerIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    contextBadge: {
      marginTop: 4,
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginBottom: 20,
      paddingHorizontal: 16,
      height: 48,
      backgroundColor: theme.colors.background,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    sendButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    sendIcon: {
      fontSize: 16,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    actionsContainer: {
      paddingHorizontal: 12,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 8,
      marginBottom: 8,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionButtonLoading: {
      opacity: 0.6,
    },
    actionIcon: {
      fontSize: 18,
      marginRight: 8,
    },
    actionLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textPrimary,
    },
    chatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 20,
      marginTop: 16,
      paddingVertical: 14,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
    },
    chatButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff',
      marginLeft: 8,
    },
  });

  return (
    <>
      {/* FAB Button */}
      <View style={styles.fabContainer}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity style={styles.fab} onPress={toggleFAB} activeOpacity={0.8}>
            <Animated.Text style={[styles.fabIcon, { transform: [{ rotate: rotation }] }]}>
              {isFABOpen ? '✕' : '🤖'}
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Action Sheet Modal */}
      <Modal visible={isFABOpen} transparent animationType="slide" onRequestClose={closeFAB}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeFAB} />
          <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.headerIcon}>🤖</Text>
              <View>
                <Text style={styles.headerTitle}>VoiceCode AI</Text>
                {currentContext.transcriptTitle && (
                  <Text style={styles.contextBadge}>📄 {currentContext.transcriptTitle}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask anything..."
                placeholderTextColor={theme.colors.textSecondary}
                value={inputValue}
                onChangeText={setInputValue}
                onSubmitEditing={handleChat}
                returnKeyType="send"
              />
              {inputValue.trim() && (
                <TouchableOpacity style={styles.sendButton} onPress={handleChat}>
                  <Text style={styles.sendIcon}>→</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.actionsContainer}
            >
              <View style={styles.actionsRow}>
                {quickActions.map(action => (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.actionButton,
                      loadingCommand === action.id && styles.actionButtonLoading,
                    ]}
                    onPress={() => handleAction(action)}
                    disabled={isLoading || loadingCommand !== null}
                  >
                    <Text style={styles.actionIcon}>
                      {loadingCommand === action.id ? '⏳' : action.icon}
                    </Text>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.chatButton} onPress={() => navigateToChat()}>
              <Text style={{ fontSize: 18 }}>💬</Text>
              <Text style={styles.chatButtonText}>Open Full Chat</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

export default AgentFAB;
