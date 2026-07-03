import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TemplatesScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
}

const CATEGORIES = ['All', 'Business', 'Personal', 'Education'];

const TemplatesScreen: React.FC<TemplatesScreenProps> = () => {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Meeting Notes',
      description: 'Structured summary for standups and syncs',
      category: 'Business',
    },
  ]);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const visible = templates.filter(
    (t) => activeCategory === 'All' || t.category === activeCategory
  );

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setConfirmingDelete(false);
  };

  return (
    <ScrollView style={styles.container} testID="templates-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Templates</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setCategoryOpen(true)}
            testID="category-filter"
            style={styles.iconButton}
          >
            <Ionicons name="filter-outline" size={22} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCreateModal(true)}
            testID="create-template"
            style={styles.addButton}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {categoryOpen ? (
        <View style={styles.categoryBar}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => {
                setActiveCategory(cat);
                setCategoryOpen(false);
              }}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.list} testID="template-list">
        {visible.map((template) => (
          <View key={template.id} style={styles.templateRow} testID={`template-${template.id}`}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateDescription} testID={`template-description-${template.id}`}>
              {template.description}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => setEditModal(true)}
                testID={`edit-template-${template.id}`}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMessage('Set as default template')}
                testID={`set-default-${template.id}`}
                style={styles.actionButton}
              >
                <Ionicons name="star-outline" size={16} color="#667eea" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setConfirmingDelete(true)}
                testID={`delete-template-${template.id}`}
                style={styles.actionButton}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>

            {confirmingDelete ? (
              <TouchableOpacity
                style={styles.confirmDelete}
                onPress={() => deleteTemplate(template.id)}
                testID="confirm-delete"
              >
                <Text style={styles.confirmDeleteText}>Confirm delete</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>

      {createModal ? (
        <View style={styles.modal} testID="create-template-modal">
          <Text style={styles.modalTitle}>New Template</Text>
          <TouchableOpacity style={styles.modalClose} onPress={() => setCreateModal(false)}>
            <Text style={styles.actionText}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {editModal ? (
        <View style={styles.modal} testID="edit-template-modal">
          <Text style={styles.modalTitle}>Edit Template</Text>
          <TouchableOpacity style={styles.modalClose} onPress={() => setEditModal(false)}>
            <Text style={styles.actionText}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 8, marginRight: 8 },
  addButton: {
    backgroundColor: '#667eea',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBar: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#eef0ff',
    margin: 4,
  },
  categoryChipActive: { backgroundColor: '#667eea' },
  categoryText: { color: '#667eea', fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  message: { textAlign: 'center', color: '#667eea', paddingVertical: 12 },
  list: { backgroundColor: '#fff', marginTop: 8 },
  templateRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  templateName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  templateDescription: { fontSize: 13, color: '#777', marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: 10 },
  actionButton: { marginRight: 16 },
  actionText: { color: '#667eea', fontWeight: '600' },
  deleteText: { color: '#e74c3c', fontWeight: '600' },
  confirmDelete: {
    marginTop: 10,
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmDeleteText: { color: '#fff', fontWeight: '600' },
  modal: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  modalClose: { alignSelf: 'flex-start' },
});

export default TemplatesScreen;
