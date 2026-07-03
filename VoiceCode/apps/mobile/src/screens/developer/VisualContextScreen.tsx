import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ContextSource {
  id: string;
  name: string;
  type: 'screen' | 'camera' | 'file' | 'clipboard';
  enabled: boolean;
  description: string;
}

interface VisualContext {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  source: string;
}

const VisualContextScreen: React.FC = () => {
  const [contextSources, setContextSources] = useState<ContextSource[]>([
    {
      id: '1',
      name: 'Screen Sharing',
      type: 'screen',
      enabled: true,
      description: 'Share your screen for real-time analysis',
    },
    {
      id: '2',
      name: 'Camera Input',
      type: 'camera',
      enabled: false,
      description: 'Use camera to capture visual context',
    },
    {
      id: '3',
      name: 'File Attachments',
      type: 'file',
      enabled: true,
      description: 'Attach images and documents',
    },
    {
      id: '4',
      name: 'Clipboard Images',
      type: 'clipboard',
      enabled: true,
      description: 'Automatically detect clipboard images',
    },
  ]);

  const [recentContexts, setRecentContexts] = useState<VisualContext[]>([
    {
      id: '1',
      type: 'screenshot',
      content: 'Dashboard view with error modal',
      timestamp: new Date(Date.now() - 300000),
      source: 'Screen Sharing',
    },
    {
      id: '2',
      type: 'code_snippet',
      content: 'React component with TypeScript',
      timestamp: new Date(Date.now() - 600000),
      source: 'Clipboard',
    },
    {
      id: '3',
      type: 'diagram',
      content: 'System architecture flowchart',
      timestamp: new Date(Date.now() - 900000),
      source: 'File Upload',
    },
  ]);

  const [autoCapture, setAutoCapture] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);

  const toggleSource = (id: string) => {
    setContextSources(prev =>
      prev.map(source => (source.id === id ? { ...source, enabled: !source.enabled } : source))
    );
  };

  const getSourceIcon = (type: ContextSource['type']) => {
    switch (type) {
      case 'screen':
        return 'desktop-outline';
      case 'camera':
        return 'camera-outline';
      case 'file':
        return 'document-attach-outline';
      case 'clipboard':
        return 'clipboard-outline';
      default:
        return 'eye-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Visual Context</Text>
        <View style={styles.statusBadge}>
          <View
            style={[styles.statusDot, { backgroundColor: autoCapture ? '#34C759' : '#FF9500' }]}
          />
          <Text style={styles.statusText}>{autoCapture ? 'Active' : 'Paused'}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Context Sources</Text>
          <Text style={styles.sectionDescription}>
            Enable visual context sources to help AI understand what you&apos;re working on
          </Text>

          {contextSources.map(source => (
            <View key={source.id} style={styles.sourceItem}>
              <View style={styles.sourceIcon}>
                <Ionicons name={getSourceIcon(source.type) as any} size={24} color="#007AFF" />
              </View>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>{source.name}</Text>
                <Text style={styles.sourceDescription}>{source.description}</Text>
              </View>
              <Switch
                value={source.enabled}
                onValueChange={() => toggleSource(source.id)}
                trackColor={{ false: '#E0E0E0', true: '#34C759' }}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capture Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Auto-Capture</Text>
              <Text style={styles.settingDescription}>
                Automatically capture visual context during conversations
              </Text>
            </View>
            <Switch
              value={autoCapture}
              onValueChange={setAutoCapture}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Privacy Mode</Text>
              <Text style={styles.settingDescription}>
                Blur sensitive information before sending to AI
              </Text>
            </View>
            <Switch
              value={privacyMode}
              onValueChange={setPrivacyMode}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Visual Context</Text>
            <TouchableOpacity>
              <Text style={styles.clearButton}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {recentContexts.map(context => (
            <View key={context.id} style={styles.contextItem}>
              <View style={styles.contextIcon}>
                <Ionicons
                  name={
                    context.type === 'screenshot'
                      ? 'image'
                      : context.type === 'code_snippet'
                        ? 'code-slash'
                        : 'git-branch'
                  }
                  size={20}
                  color="#666"
                />
              </View>
              <View style={styles.contextInfo}>
                <Text style={styles.contextContent}>{context.content}</Text>
                <View style={styles.contextMeta}>
                  <Text style={styles.contextSource}>{context.source}</Text>
                  <Text style={styles.contextTime}>
                    {Math.round((Date.now() - context.timestamp.getTime()) / 60000)} min ago
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.contextAction}>
                <Ionicons name="ellipsis-vertical" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Visual Context Works</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoNumber}>
                <Text style={styles.infoNumberText}>1</Text>
              </View>
              <Text style={styles.infoText}>Capture screenshots, images, or diagrams</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoNumber}>
                <Text style={styles.infoNumberText}>2</Text>
              </View>
              <Text style={styles.infoText}>AI analyzes visual content automatically</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoNumber}>
                <Text style={styles.infoNumberText}>3</Text>
              </View>
              <Text style={styles.infoText}>Context is used to improve responses</Text>
            </View>
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
  statusBadge: {
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
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  clearButton: {
    fontSize: 14,
    color: '#FF3B30',
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  sourceDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  contextIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contextInfo: {
    flex: 1,
  },
  contextContent: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  contextMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  contextSource: {
    fontSize: 12,
    color: '#007AFF',
    marginRight: 8,
  },
  contextTime: {
    fontSize: 12,
    color: '#999',
  },
  contextAction: {
    padding: 4,
  },
  infoCard: {
    marginHorizontal: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoNumberText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
});

export default VisualContextScreen;
