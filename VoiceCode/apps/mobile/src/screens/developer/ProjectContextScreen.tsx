import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ProjectFile {
  path: string;
  type: 'file' | 'folder';
  language?: string;
  lastModified: Date;
  isIndexed: boolean;
}

interface ProjectContext {
  name: string;
  path: string;
  framework: string;
  language: string;
  files: ProjectFile[];
  indexedCount: number;
  totalFiles: number;
}

const ProjectContextScreen: React.FC = () => {
  const [project, setProject] = useState<ProjectContext>({
    name: 'VoiceCode',
    path: '/Users/dev/projects/voicecode',
    framework: 'React Native + Expo',
    language: 'TypeScript',
    files: [
      { path: 'src/screens', type: 'folder', lastModified: new Date(), isIndexed: true },
      { path: 'src/services', type: 'folder', lastModified: new Date(), isIndexed: true },
      { path: 'src/components', type: 'folder', lastModified: new Date(), isIndexed: true },
      { path: 'src/utils', type: 'folder', lastModified: new Date(), isIndexed: false },
      {
        path: 'package.json',
        type: 'file',
        language: 'JSON',
        lastModified: new Date(),
        isIndexed: true,
      },
    ],
    indexedCount: 145,
    totalFiles: 198,
  });

  const [autoIndex, setAutoIndex] = useState(true);
  const [includeNodeModules, setIncludeNodeModules] = useState(false);
  const [indexDepth, setIndexDepth] = useState(5);

  const getFileIcon = (file: ProjectFile) => {
    if (file.type === 'folder') return 'folder';
    switch (file.language) {
      case 'TypeScript':
        return 'logo-javascript';
      case 'JSON':
        return 'document-text';
      default:
        return 'document';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Project Context</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.projectCard}>
          <View style={styles.projectHeader}>
            <Ionicons name="folder-open" size={32} color="#007AFF" />
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{project.name}</Text>
              <Text style={styles.projectPath}>{project.path}</Text>
            </View>
          </View>

          <View style={styles.projectMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="code-slash" size={16} color="#666" />
              <Text style={styles.metaText}>{project.framework}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="language" size={16} color="#666" />
              <Text style={styles.metaText}>{project.language}</Text>
            </View>
          </View>

          <View style={styles.indexProgress}>
            <View style={styles.indexHeader}>
              <Text style={styles.indexLabel}>Indexing Progress</Text>
              <Text style={styles.indexCount}>
                {project.indexedCount}/{project.totalFiles}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(project.indexedCount / project.totalFiles) * 100}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indexing Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Auto-Index</Text>
              <Text style={styles.settingDescription}>
                Automatically index new and modified files
              </Text>
            </View>
            <Switch
              value={autoIndex}
              onValueChange={setAutoIndex}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Include node_modules</Text>
              <Text style={styles.settingDescription}>Index dependency files (slower)</Text>
            </View>
            <Switch
              value={includeNodeModules}
              onValueChange={setIncludeNodeModules}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Index Depth</Text>
              <Text style={styles.settingDescription}>Maximum folder depth to index</Text>
            </View>
            <View style={styles.depthSelector}>
              <TouchableOpacity
                style={styles.depthButton}
                onPress={() => setIndexDepth(Math.max(1, indexDepth - 1))}
              >
                <Ionicons name="remove" size={20} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.depthValue}>{indexDepth}</Text>
              <TouchableOpacity
                style={styles.depthButton}
                onPress={() => setIndexDepth(Math.min(10, indexDepth + 1))}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Indexed Directories</Text>
            <TouchableOpacity>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {project.files.map((file, index) => (
            <TouchableOpacity key={file.path} style={styles.fileItem}>
              <Ionicons
                name={getFileIcon(file) as any}
                size={20}
                color={file.type === 'folder' ? '#007AFF' : '#666'}
              />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{file.path}</Text>
                {file.language && <Text style={styles.fileLanguage}>{file.language}</Text>}
              </View>
              <View
                style={[
                  styles.indexBadge,
                  file.isIndexed ? styles.indexedBadge : styles.pendingBadge,
                ]}
              >
                <Text
                  style={[
                    styles.indexBadgeText,
                    file.isIndexed ? styles.indexedText : styles.pendingText,
                  ]}
                >
                  {file.isIndexed ? 'Indexed' : 'Pending'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Context Memory</Text>
          <View style={styles.memoryStats}>
            <View style={styles.memoryStat}>
              <Text style={styles.memoryValue}>2.4 MB</Text>
              <Text style={styles.memoryLabel}>Index Size</Text>
            </View>
            <View style={styles.memoryStat}>
              <Text style={styles.memoryValue}>145</Text>
              <Text style={styles.memoryLabel}>Files</Text>
            </View>
            <View style={styles.memoryStat}>
              <Text style={styles.memoryValue}>12.5K</Text>
              <Text style={styles.memoryLabel}>Symbols</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.clearButton}>
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            <Text style={styles.clearButtonText}>Clear Index Cache</Text>
          </TouchableOpacity>
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
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  projectCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectInfo: {
    marginLeft: 12,
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  projectPath: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  projectMeta: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  indexProgress: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  indexHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  indexLabel: {
    fontSize: 13,
    color: '#666',
  },
  indexCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  section: {
    backgroundColor: '#FFF',
    marginBottom: 16,
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
    marginBottom: 8,
  },
  addButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
  depthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  depthButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  depthValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginHorizontal: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  fileLanguage: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  indexBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  indexedBadge: {
    backgroundColor: '#E8F5E9',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  indexBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  indexedText: {
    color: '#34C759',
  },
  pendingText: {
    color: '#FF9500',
  },
  memoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  memoryStat: {
    alignItems: 'center',
  },
  memoryValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  memoryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 6,
  },
});

export default ProjectContextScreen;
