import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EditProfileScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

const DEFAULT_AVATAR = 'https://voicecode.app/avatar-placeholder.png';

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('Alex Rivera');
  const [avatarUri, setAvatarUri] = useState<string | null>(DEFAULT_AVATAR);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);

  const updateName = (value: string) => {
    setName(value);
    setDirty(true);
    setError(null);
    setSuccess(null);
  };

  const chooseFromGallery = () => {
    setAvatarUri('https://voicecode.app/gallery-avatar.png');
    setShowAvatarOptions(false);
    setDirty(true);
  };

  const takePhoto = () => {
    setAvatarUri('https://voicecode.app/camera-avatar.png');
    setShowAvatarOptions(false);
    setDirty(true);
  };

  const removeAvatar = () => {
    setAvatarUri(null);
    setShowAvatarOptions(false);
    setDirty(true);
  };

  const save = () => {
    if (!name.trim()) {
      setError('Name is required');
      setSuccess(null);
      return;
    }
    setError(null);
    setSuccess('Profile saved');
    setDirty(false);
    navigation.goBack();
  };

  const cancel = () => {
    if (dirty) {
      setShowDiscard(true);
      return;
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} testID="edit-profile-screen">
      <View style={styles.avatarSection}>
        <Image
          testID="avatar-image"
          style={styles.avatar}
          source={avatarUri ? { uri: avatarUri } : require('../../../assets/icon.png')}
        />
        <TouchableOpacity style={styles.changeAvatar} onPress={() => setShowAvatarOptions(true)} testID="change-avatar">
          <Ionicons name="camera-outline" size={18} color="#667eea" />
          <Text style={styles.changeAvatarText}>Change photo</Text>
        </TouchableOpacity>
      </View>

      {showAvatarOptions ? (
        <View style={styles.avatarOptions}>
          <TouchableOpacity style={styles.optionRow} onPress={chooseFromGallery} testID="choose-from-gallery">
            <Ionicons name="images-outline" size={20} color="#667eea" style={styles.optionIcon} />
            <Text style={styles.optionText}>Choose from gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={takePhoto} testID="take-photo">
            <Ionicons name="camera-outline" size={20} color="#667eea" style={styles.optionIcon} />
            <Text style={styles.optionText}>Take photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={removeAvatar} testID="remove-avatar">
            <Ionicons name="trash-outline" size={20} color="#ef4444" style={styles.optionIcon} />
            <Text style={[styles.optionText, styles.removeText]}>Remove photo</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.label}>Display name</Text>
      <TextInput
        testID="name-input"
        style={styles.input}
        value={name}
        onChangeText={updateName}
        placeholder="Display name"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {showDiscard ? (
        <View style={styles.discard}>
          <Text style={styles.discardText}>Discard changes?</Text>
          <View style={styles.discardActions}>
            <TouchableOpacity onPress={() => setShowDiscard(false)} style={styles.discardKeep} testID="keep-editing">
              <Text style={styles.discardKeepText}>Keep editing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowDiscard(false);
                navigation.goBack();
              }}
              style={styles.discardConfirm}
              testID="confirm-discard"
            >
              <Text style={styles.discardConfirmText}>Leave</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={cancel} testID="cancel-button">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={save} testID="save-button">
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#e5e5ea' },
  changeAvatar: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  changeAvatarText: { marginLeft: 6, color: '#667eea', fontSize: 15, fontWeight: '600' },
  avatarOptions: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  optionIcon: { marginRight: 12 },
  optionText: { fontSize: 16, color: '#1a1a2e' },
  removeText: { color: '#ef4444' },
  label: { fontSize: 13, fontWeight: '600', color: '#888', paddingHorizontal: 16, marginTop: 20 },
  input: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a2e',
  },
  error: { color: '#ef4444', paddingHorizontal: 16, paddingTop: 8, fontWeight: '600' },
  success: { color: '#22c55e', paddingHorizontal: 16, paddingTop: 8, fontWeight: '600' },
  discard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  discardText: { fontSize: 16, color: '#1a1a2e', marginBottom: 12 },
  discardActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  discardKeep: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  discardKeepText: { color: '#667eea', fontWeight: '600' },
  discardConfirm: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  discardConfirmText: { color: '#fff', fontWeight: '600' },
  footer: { flexDirection: 'row', padding: 16 },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#c7c7cc',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelText: { color: '#555', fontSize: 16, fontWeight: '600' },
  saveButton: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default EditProfileScreen;
