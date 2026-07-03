import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const TrelloIntegrationScreen: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [autoCreateCards, setAutoCreateCards] = useState(true);
  const [addComments, setAddComments] = useState(true);
  const [attachFiles, setAttachFiles] = useState(false);

  const accountInfo = {
    username: 'johnsmith',
    email: 'john.smith@company.com',
  };

  const connectedBoards = [
    { id: '1', name: 'Product Roadmap', cards: 34, background: '#0079BF' },
    { id: '2', name: 'Sprint Planning', cards: 28, background: '#D29034' },
    { id: '3', name: 'Client Projects', cards: 56, background: '#519839' },
  ];

  const defaultList = 'To Do';

  const recentCards = [
    { title: 'Review client proposal', board: 'Client Projects', list: 'In Progress' },
    { title: 'Update API documentation', board: 'Product Roadmap', list: 'To Do' },
    { title: 'Schedule team sync', board: 'Sprint Planning', list: 'Done' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Trello</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View style={styles.trelloLogo}>
              <Ionicons name="grid" size={28} color="#0079BF" />
            </View>
            <View style={styles.connectionInfo}>
              <Text style={styles.connectionTitle}>@{accountInfo.username}</Text>
              <Text style={styles.connectionEmail}>{accountInfo.email}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: '#34C75920' }]}>
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              <Text style={[styles.statusText, { color: '#34C759' }]}>Connected</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="add-circle" size={20} color="#0079BF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Create Cards</Text>
                  <Text style={styles.settingDesc}>Create cards from action items</Text>
                </View>
              </View>
              <Switch
                value={autoCreateCards}
                onValueChange={setAutoCreateCards}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="chatbubble" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Add Comments</Text>
                  <Text style={styles.settingDesc}>Add meeting notes as comments</Text>
                </View>
              </View>
              <Switch
                value={addComments}
                onValueChange={setAddComments}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="attach" size={20} color="#AF52DE" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Attach Files</Text>
                  <Text style={styles.settingDesc}>Attach transcripts to cards</Text>
                </View>
              </View>
              <Switch
                value={attachFiles}
                onValueChange={setAttachFiles}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="list" size={20} color="#34C759" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Default List</Text>
                  <Text style={styles.settingDesc}>Where new cards are created</Text>
                </View>
              </View>
              <View style={styles.selectValue}>
                <Text style={styles.selectText}>{defaultList}</Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Boards</Text>
          {connectedBoards.map(board => (
            <TouchableOpacity key={board.id} style={styles.boardCard}>
              <View style={[styles.boardPreview, { backgroundColor: board.background }]}>
                <Ionicons name="grid" size={20} color="#FFF" />
              </View>
              <View style={styles.boardInfo}>
                <Text style={styles.boardName}>{board.name}</Text>
                <Text style={styles.boardCards}>{board.cards} cards created</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addBoardButton}>
            <Ionicons name="add" size={20} color="#0079BF" />
            <Text style={styles.addBoardText}>Connect Board</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Created</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentCards.map((card, idx) => (
            <View key={idx} style={styles.cardItem}>
              <View style={styles.cardIcon}>
                <Ionicons name="card" size={18} color="#0079BF" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardBoard}>{card.board}</Text>
                  <Text style={styles.cardDot}>•</Text>
                  <Text style={styles.cardList}>{card.list}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.disconnectButton}>
          <Ionicons name="unlink" size={20} color="#FF3B30" />
          <Text style={styles.disconnectText}>Disconnect Trello</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  placeholder: { width: 32 },
  content: { flex: 1 },
  connectionCard: { backgroundColor: '#FFF', margin: 16, borderRadius: 16, padding: 20 },
  connectionHeader: { flexDirection: 'row', alignItems: 'center' },
  trelloLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0079BF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionInfo: { flex: 1 },
  connectionTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  connectionEmail: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllText: { fontSize: 14, color: '#007AFF' },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  selectValue: { flexDirection: 'row', alignItems: 'center' },
  selectText: { fontSize: 15, color: '#8E8E93', marginRight: 4 },
  boardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  boardPreview: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  boardInfo: { flex: 1 },
  boardName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  boardCards: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  addBoardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0079BF',
    borderStyle: 'dashed',
  },
  addBoardText: { fontSize: 15, color: '#0079BF', marginLeft: 8 },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0079BF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardBoard: { fontSize: 12, color: '#0079BF' },
  cardDot: { fontSize: 12, color: '#C7C7CC', marginHorizontal: 6 },
  cardList: { fontSize: 12, color: '#8E8E93' },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FF3B3015',
  },
  disconnectText: { fontSize: 15, fontWeight: '500', color: '#FF3B30', marginLeft: 8 },
  bottomPadding: { height: 40 },
});

export default TrelloIntegrationScreen;
