import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  branch: string;
}

interface GitBranch {
  name: string;
  isCurrent: boolean;
  lastCommit: string;
}

interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

const GitVoiceScreen: React.FC = () => {
  const [currentBranch, setCurrentBranch] = useState('main');
  const [status, setStatus] = useState<GitStatus>({
    staged: ['src/components/Button.tsx'],
    unstaged: ['src/screens/HomeScreen.tsx', 'src/utils/helpers.ts'],
    untracked: ['temp.log'],
  });
  const [commits, setCommits] = useState<GitCommit[]>([
    {
      hash: 'a1b2c3d',
      message: 'Add voice recording feature',
      author: 'You',
      date: new Date(),
      branch: 'main',
    },
    {
      hash: 'e4f5g6h',
      message: 'Fix navigation bug',
      author: 'You',
      date: new Date(Date.now() - 86400000),
      branch: 'main',
    },
    {
      hash: 'i7j8k9l',
      message: 'Update dependencies',
      author: 'You',
      date: new Date(Date.now() - 172800000),
      branch: 'main',
    },
  ]);
  const [branches, setBranches] = useState<GitBranch[]>([
    { name: 'main', isCurrent: true, lastCommit: 'Add voice recording feature' },
    { name: 'feature/ai-chat', isCurrent: false, lastCommit: 'WIP: AI chat integration' },
    { name: 'fix/audio-bug', isCurrent: false, lastCommit: 'Fix audio playback issue' },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

  const voiceCommands = [
    { phrase: 'commit changes', action: 'Commit staged files' },
    { phrase: 'push to origin', action: 'Push to remote' },
    { phrase: 'pull latest', action: 'Pull from remote' },
    { phrase: 'switch branch', action: 'Change branch' },
    { phrase: 'create branch', action: 'New branch' },
    { phrase: 'stage all', action: 'Stage all changes' },
  ];

  const totalChanges = status.staged.length + status.unstaged.length + status.untracked.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Git Voice</Text>
        <View style={styles.branchBadge}>
          <Ionicons name="git-branch" size={14} color="#007AFF" />
          <Text style={styles.branchText}>{currentBranch}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.cardTitle}>Working Tree Status</Text>
            <View style={styles.changesBadge}>
              <Text style={styles.changesText}>{totalChanges} changes</Text>
            </View>
          </View>

          {status.staged.length > 0 && (
            <View style={styles.statusSection}>
              <Text style={styles.statusLabel}>Staged</Text>
              {status.staged.map(file => (
                <View key={file} style={styles.fileItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  <Text style={styles.fileName}>{file}</Text>
                </View>
              ))}
            </View>
          )}

          {status.unstaged.length > 0 && (
            <View style={styles.statusSection}>
              <Text style={styles.statusLabel}>Modified</Text>
              {status.unstaged.map(file => (
                <View key={file} style={styles.fileItem}>
                  <Ionicons name="create" size={16} color="#FF9500" />
                  <Text style={styles.fileName}>{file}</Text>
                </View>
              ))}
            </View>
          )}

          {status.untracked.length > 0 && (
            <View style={styles.statusSection}>
              <Text style={styles.statusLabel}>Untracked</Text>
              {status.untracked.map(file => (
                <View key={file} style={styles.fileItem}>
                  <Ionicons name="help-circle" size={16} color="#666" />
                  <Text style={styles.fileName}>{file}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={20} color="#34C759" />
            <Text style={styles.actionText}>Stage All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="arrow-up-circle" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Push</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="arrow-down-circle" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Pull</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="sync-circle" size={20} color="#FF9500" />
            <Text style={styles.actionText}>Sync</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.commitCard}>
          <Text style={styles.cardTitle}>Quick Commit</Text>
          <TextInput
            style={styles.commitInput}
            placeholder="Enter commit message or use voice..."
            placeholderTextColor="#999"
            value={commitMessage}
            onChangeText={setCommitMessage}
            multiline
          />
          <View style={styles.commitActions}>
            <TouchableOpacity
              style={[styles.voiceCommitButton, isRecording && styles.voiceCommitButtonActive]}
              onPress={() => setIsRecording(!isRecording)}
            >
              <Ionicons
                name={isRecording ? 'mic' : 'mic-outline'}
                size={20}
                color={isRecording ? '#FF3B30' : '#007AFF'}
              />
              <Text style={styles.voiceCommitText}>{isRecording ? 'Recording...' : 'Voice'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commitButton}>
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.commitButtonText}>Commit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.branchesCard}>
          <View style={styles.branchesHeader}>
            <Text style={styles.cardTitle}>Branches</Text>
            <TouchableOpacity style={styles.newBranchButton}>
              <Ionicons name="add" size={18} color="#007AFF" />
            </TouchableOpacity>
          </View>
          {branches.map(branch => (
            <TouchableOpacity
              key={branch.name}
              style={[styles.branchItem, branch.isCurrent && styles.branchItemCurrent]}
            >
              <Ionicons
                name={branch.isCurrent ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={branch.isCurrent ? '#007AFF' : '#999'}
              />
              <View style={styles.branchInfo}>
                <Text style={[styles.branchName, branch.isCurrent && styles.branchNameCurrent]}>
                  {branch.name}
                </Text>
                <Text style={styles.branchCommit} numberOfLines={1}>
                  {branch.lastCommit}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.cardTitle}>Recent Commits</Text>
          {commits.map(commit => (
            <View key={commit.hash} style={styles.commitItem}>
              <View style={styles.commitDot} />
              <View style={styles.commitInfo}>
                <Text style={styles.commitMessage}>{commit.message}</Text>
                <View style={styles.commitMeta}>
                  <Text style={styles.commitHash}>{commit.hash}</Text>
                  <Text style={styles.commitDate}>{commit.date.toLocaleDateString()}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.voiceCommandsCard}>
          <Text style={styles.cardTitle}>Voice Commands</Text>
          <View style={styles.commandsList}>
            {voiceCommands.map(cmd => (
              <View key={cmd.phrase} style={styles.commandItem}>
                <Text style={styles.commandPhrase}>&quot;{cmd.phrase}&quot;</Text>
                <Text style={styles.commandAction}>{cmd.action}</Text>
              </View>
            ))}
          </View>
        </View>
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
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  branchText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  changesBadge: {
    backgroundColor: '#FF950020',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  changesText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
  statusSection: {
    marginTop: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  fileName: {
    fontSize: 13,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    minWidth: 70,
  },
  actionText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  commitCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  commitInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 60,
    marginTop: 12,
  },
  commitActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  voiceCommitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 12,
  },
  voiceCommitButtonActive: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF3B30',
  },
  voiceCommitText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
  },
  commitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
  },
  commitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 6,
  },
  branchesCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  branchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  newBranchButton: {
    padding: 4,
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  branchItemCurrent: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  branchInfo: {
    flex: 1,
    marginLeft: 10,
  },
  branchName: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  branchNameCurrent: {
    fontWeight: '600',
    color: '#007AFF',
  },
  branchCommit: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  commitItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  commitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginTop: 6,
    marginRight: 12,
  },
  commitInfo: {
    flex: 1,
  },
  commitMessage: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  commitMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  commitHash: {
    fontSize: 11,
    color: '#007AFF',
    marginRight: 12,
  },
  commitDate: {
    fontSize: 11,
    color: '#666',
  },
  voiceCommandsCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 16,
  },
  commandsList: {
    marginTop: 8,
  },
  commandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commandPhrase: {
    fontSize: 13,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  commandAction: {
    fontSize: 13,
    color: '#666',
  },
});

export default GitVoiceScreen;
