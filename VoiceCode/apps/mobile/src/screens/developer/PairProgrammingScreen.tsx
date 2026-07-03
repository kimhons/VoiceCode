import React, { useState, useCallback } from 'react';
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

interface ProgrammingSession {
  id: string;
  task: string;
  status: 'active' | 'paused' | 'completed';
  startTime: Date;
  language: string;
  currentStep: number;
  totalSteps: number;
}

interface AIContribution {
  id: string;
  type: 'suggestion' | 'code' | 'question' | 'explanation';
  content: string;
  timestamp: Date;
}

const PairProgrammingScreen: React.FC = () => {
  const [session, setSession] = useState<ProgrammingSession | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const [contributions, setContributions] = useState<AIContribution[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState<'navigator' | 'driver'>('navigator');

  const startSession = useCallback(() => {
    if (!taskInput.trim()) return;

    const newSession: ProgrammingSession = {
      id: Date.now().toString(),
      task: taskInput,
      status: 'active',
      startTime: new Date(),
      language: 'TypeScript',
      currentStep: 1,
      totalSteps: 5,
    };

    setSession(newSession);
    setContributions([
      {
        id: '1',
        type: 'explanation',
        content: `Great! Let's work on "${taskInput}" together. I'll help guide you through the implementation. First, let's break down the task into smaller steps.`,
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'suggestion',
        content: 'Step 1: Set up the basic component structure with proper TypeScript interfaces.',
        timestamp: new Date(),
      },
    ]);
    setTaskInput('');
  }, [taskInput]);

  const toggleVoice = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  const renderModeSelector = () => (
    <View style={styles.modeSelector}>
      <TouchableOpacity
        style={[styles.modeButton, mode === 'navigator' && styles.modeButtonActive]}
        onPress={() => setMode('navigator')}
      >
        <Ionicons name="compass" size={20} color={mode === 'navigator' ? '#FFF' : '#007AFF'} />
        <Text style={[styles.modeButtonText, mode === 'navigator' && styles.modeButtonTextActive]}>
          AI Navigator
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, mode === 'driver' && styles.modeButtonActive]}
        onPress={() => setMode('driver')}
      >
        <Ionicons name="car" size={20} color={mode === 'driver' ? '#FFF' : '#007AFF'} />
        <Text style={[styles.modeButtonText, mode === 'driver' && styles.modeButtonTextActive]}>
          AI Driver
        </Text>
      </TouchableOpacity>
    </View>
  );

  const getContributionIcon = (type: AIContribution['type']) => {
    switch (type) {
      case 'suggestion':
        return 'bulb';
      case 'code':
        return 'code-slash';
      case 'question':
        return 'help-circle';
      case 'explanation':
        return 'chatbubble';
      default:
        return 'ellipse';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pair Programming</Text>
        {session && (
          <View style={styles.sessionBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: session.status === 'active' ? '#34C759' : '#FF9500' },
              ]}
            />
            <Text style={styles.sessionStatus}>{session.status}</Text>
          </View>
        )}
      </View>

      {renderModeSelector()}

      <ScrollView style={styles.content}>
        {!session ? (
          <View style={styles.startSection}>
            <View style={styles.welcomeCard}>
              <Ionicons name="people" size={48} color="#007AFF" />
              <Text style={styles.welcomeTitle}>AI Pair Programming</Text>
              <Text style={styles.welcomeText}>
                Work together with AI to write better code. Choose your collaboration mode and start
                coding!
              </Text>
            </View>

            <View style={styles.modeExplanation}>
              <View style={styles.explanationCard}>
                <Text style={styles.explanationTitle}>🧭 Navigator Mode</Text>
                <Text style={styles.explanationText}>
                  AI guides you through the implementation, suggesting approaches and reviewing your
                  code
                </Text>
              </View>
              <View style={styles.explanationCard}>
                <Text style={styles.explanationTitle}>🚗 Driver Mode</Text>
                <Text style={styles.explanationText}>
                  AI writes the code while you guide the direction and make high-level decisions
                </Text>
              </View>
            </View>

            <View style={styles.taskInputSection}>
              <Text style={styles.inputLabel}>What would you like to build?</Text>
              <TextInput
                style={styles.taskInput}
                placeholder="e.g., Create a user authentication form with validation"
                placeholderTextColor="#999"
                value={taskInput}
                onChangeText={setTaskInput}
                multiline
              />
              <TouchableOpacity
                style={[styles.startButton, !taskInput.trim() && styles.startButtonDisabled]}
                onPress={startSession}
                disabled={!taskInput.trim()}
              >
                <Ionicons name="play" size={20} color="#FFF" />
                <Text style={styles.startButtonText}>Start Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.sessionContent}>
            <View style={styles.taskCard}>
              <Text style={styles.taskLabel}>Current Task</Text>
              <Text style={styles.taskText}>{session.task}</Text>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Progress</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(session.currentStep / session.totalSteps) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {session.currentStep}/{session.totalSteps}
                </Text>
              </View>
            </View>

            <View style={styles.contributionsSection}>
              <Text style={styles.contributionsTitle}>Collaboration</Text>
              {contributions.map(contribution => (
                <View key={contribution.id} style={styles.contributionCard}>
                  <View style={styles.contributionHeader}>
                    <View style={styles.contributionIcon}>
                      <Ionicons
                        name={getContributionIcon(contribution.type) as any}
                        size={16}
                        color="#007AFF"
                      />
                    </View>
                    <Text style={styles.contributionType}>{contribution.type}</Text>
                    <Text style={styles.contributionTime}>
                      {contribution.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.contributionContent}>{contribution.content}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sessionActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="pause" size={20} color="#FF9500" />
                <Text style={[styles.actionButtonText, { color: '#FF9500' }]}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="refresh" size={20} color="#007AFF" />
                <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>Reset Step</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={[styles.actionButtonText, { color: '#34C759' }]}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {session && (
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
            onPress={toggleVoice}
          >
            <Ionicons
              name={isRecording ? 'mic' : 'mic-outline'}
              size={24}
              color={isRecording ? '#FF3B30' : '#007AFF'}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message or question..."
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.sendButton}>
            <Ionicons name="send" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
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
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  sessionStatus: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  modeSelector: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  startSection: {
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modeExplanation: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  explanationCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  taskInputSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  taskInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 80,
    marginBottom: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
  },
  startButtonDisabled: {
    backgroundColor: '#CCC',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  sessionContent: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  taskLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  taskText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  contributionsSection: {
    marginBottom: 16,
  },
  contributionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  contributionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  contributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contributionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contributionType: {
    fontSize: 12,
    color: '#007AFF',
    textTransform: 'capitalize',
    marginLeft: 8,
    flex: 1,
  },
  contributionTime: {
    fontSize: 11,
    color: '#999',
  },
  contributionContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
  messageInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default PairProgrammingScreen;
