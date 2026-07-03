/**
 * Workspace Isolation Screen
 * Phase 3 Week 9 Day 57-58: Multi-Tenant Architecture
 * 
 * Features:
 * - Workspace list with organization context
 * - Workspace creation and editing
 * - Data isolation controls (strict/moderate/open)
 * - Access policies configuration
 * - Workspace analytics (storage, users, activity)
 * - Resource allocation settings
 * - Cross-workspace sharing controls
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Switch,
  Dimensions,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchOrganizationWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  setCurrentWorkspace,
  fetchWorkspaceMembers,
  addWorkspaceMember,
  removeWorkspaceMember,
} from '../../store/slices/workspaceSlice';
import { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput } from '../../services/workspaceService';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TabType = 'overview' | 'isolation' | 'members' | 'resources' | 'analytics';

interface WorkspaceFormData {
  name: string;
  slug: string;
  description: string;
  data_isolation_level: 'strict' | 'moderate' | 'open';
  allow_cross_workspace_sharing: boolean;
  max_storage_gb: number;
  max_users: number;
  max_transcripts: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WorkspaceIsolationScreen() {
  const dispatch = useAppDispatch();
  const { workspaces, currentWorkspace, members, loading, error } = useAppSelector(
    (state) => state.workspace
  );
  const { currentOrganization } = useAppSelector((state) => state.organization);

  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState<WorkspaceFormData>({
    name: '',
    slug: '',
    description: '',
    data_isolation_level: 'strict',
    allow_cross_workspace_sharing: false,
    max_storage_gb: 10,
    max_users: 10,
    max_transcripts: 1000,
  });

  // Load workspaces on mount or when organization changes
  useEffect(() => {
    if (currentOrganization) {
      dispatch(fetchOrganizationWorkspaces(currentOrganization.id));
    }
  }, [currentOrganization, dispatch]);

  // Load members when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      dispatch(fetchWorkspaceMembers(currentWorkspace.id));
    }
  }, [currentWorkspace, dispatch]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    if (!currentOrganization) return;
    setRefreshing(true);
    await dispatch(fetchOrganizationWorkspaces(currentOrganization.id));
    setRefreshing(false);
  }, [currentOrganization, dispatch]);

  const handleCreateWorkspace = useCallback(async () => {
    if (!currentOrganization) {
      Alert.alert('Error', 'Please select an organization first');
      return;
    }

    if (!formData.name || !formData.slug) {
      Alert.alert('Error', 'Name and slug are required');
      return;
    }

    try {
      const input: CreateWorkspaceInput = {
        organization_id: currentOrganization.id,
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        data_isolation_level: formData.data_isolation_level,
        max_storage_gb: formData.max_storage_gb,
        max_users: formData.max_users,
      };

      await dispatch(createWorkspace(input)).unwrap();
      setShowCreateModal(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        data_isolation_level: 'strict',
        allow_cross_workspace_sharing: false,
        max_storage_gb: 10,
        max_users: 10,
        max_transcripts: 1000,
      });
      Alert.alert('Success', 'Workspace created successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create workspace');
    }
  }, [currentOrganization, formData, dispatch]);

  const handleUpdateWorkspace = useCallback(async () => {
    if (!currentWorkspace) return;

    try {
      const input: UpdateWorkspaceInput = {
        name: formData.name || undefined,
        description: formData.description || undefined,
        data_isolation_level: formData.data_isolation_level,
        allow_cross_workspace_sharing: formData.allow_cross_workspace_sharing,
        max_storage_gb: formData.max_storage_gb,
        max_users: formData.max_users,
        max_transcripts: formData.max_transcripts,
      };

      await dispatch(updateWorkspace({ id: currentWorkspace.id, input })).unwrap();
      setShowEditModal(false);
      Alert.alert('Success', 'Workspace updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update workspace');
    }
  }, [currentWorkspace, formData, dispatch]);

  const handleDeleteWorkspace = useCallback(async (id: string) => {
    Alert.alert(
      'Delete Workspace',
      'Are you sure? All data in this workspace will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteWorkspace(id)).unwrap();
              Alert.alert('Success', 'Workspace deleted');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete workspace');
            }
          },
        },
      ]
    );
  }, [dispatch]);

  const handleSelectWorkspace = useCallback((workspace: Workspace) => {
    dispatch(setCurrentWorkspace(workspace));
  }, [dispatch]);

  const handleOpenEditModal = useCallback(() => {
    if (currentWorkspace) {
      setFormData({
        name: currentWorkspace.name,
        slug: currentWorkspace.slug,
        description: currentWorkspace.description || '',
        data_isolation_level: currentWorkspace.data_isolation_level,
        allow_cross_workspace_sharing: currentWorkspace.allow_cross_workspace_sharing,
        max_storage_gb: currentWorkspace.max_storage_gb,
        max_users: currentWorkspace.max_users,
        max_transcripts: currentWorkspace.max_transcripts || 1000,
      });
      setShowEditModal(true);
    }
  }, [currentWorkspace]);

  // Filter workspaces
  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ws.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render functions
  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Workspaces</Text>
        {currentOrganization && (
          <Text style={styles.headerSubtitle}>
            {currentOrganization.name}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
        disabled={!currentOrganization}
      >
        <Ionicons name="add-circle" size={24} color={currentOrganization ? "#007AFF" : "#C7C7CC"} />
        <Text style={[styles.createButtonText, !currentOrganization && styles.createButtonDisabled]}>
          New
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search workspaces..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#8E8E93"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={20} color="#8E8E93" />
        </TouchableOpacity>
      )}
    </View>
  );

  const getIsolationColor = (level: string) => {
    switch (level) {
      case 'strict': return '#FF3B30';
      case 'moderate': return '#FF9500';
      case 'open': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getIsolationIcon = (level: string) => {
    switch (level) {
      case 'strict': return 'lock-closed';
      case 'moderate': return 'lock-open';
      case 'open': return 'globe';
      default: return 'help-circle';
    }
  };

  const renderWorkspaceCard = ({ item }: { item: Workspace }) => {
    const isSelected = currentWorkspace?.id === item.id;
    const isolationColor = getIsolationColor(item.data_isolation_level);

    return (
      <TouchableOpacity
        style={[styles.workspaceCard, isSelected && styles.workspaceCardSelected]}
        onPress={() => handleSelectWorkspace(item)}
      >
        <View style={styles.workspaceHeader}>
          <View style={[styles.workspaceIcon, { backgroundColor: isolationColor }]}>
            <Ionicons
              name={getIsolationIcon(item.data_isolation_level) as any}
              size={24}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.workspaceInfo}>
            <Text style={styles.workspaceName}>{item.name}</Text>
            <Text style={styles.workspaceSlug}>@{item.slug}</Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.workspaceDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.workspaceFooter}>
          <View style={[styles.isolationBadge, { backgroundColor: isolationColor }]}>
            <Text style={styles.isolationBadgeText}>
              {item.data_isolation_level.toUpperCase()}
            </Text>
          </View>
          <View style={styles.workspaceStat}>
            <Ionicons name="people" size={14} color="#8E8E93" />
            <Text style={styles.workspaceStatText}>{item.max_users} max</Text>
          </View>
          <View style={styles.workspaceStat}>
            <Ionicons name="server" size={14} color="#8E8E93" />
            <Text style={styles.workspaceStatText}>{item.max_storage_gb}GB</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['overview', 'isolation', 'members', 'resources', 'analytics'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => {
    if (!currentWorkspace) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase" size={64} color="#C7C7CC" />
          <Text style={styles.emptyStateText}>Select a workspace to view details</Text>
        </View>
      );
    }

    const isolationColor = getIsolationColor(currentWorkspace.data_isolation_level);

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workspace Details</Text>
            <TouchableOpacity onPress={handleOpenEditModal}>
              <Ionicons name="create-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{currentWorkspace.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Slug</Text>
            <Text style={styles.detailValue}>@{currentWorkspace.slug}</Text>
          </View>

          {currentWorkspace.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{currentWorkspace.description}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Data Isolation</Text>
            <View style={[styles.isolationBadge, { backgroundColor: isolationColor }]}>
              <Text style={styles.isolationBadgeText}>
                {currentWorkspace.data_isolation_level.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cross-Workspace Sharing</Text>
            <Text style={styles.detailValue}>
              {currentWorkspace.allow_cross_workspace_sharing ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('isolation')}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Configure Isolation</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('members')}>
            <Ionicons name="people-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Manage Members</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('resources')}>
            <Ionicons name="server-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Resource Limits</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={() => handleDeleteWorkspace(currentWorkspace.id)}
          >
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Delete Workspace</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderIsolationTab = () => {
    if (!currentWorkspace) return null;

    const isolationColor = getIsolationColor(currentWorkspace.data_isolation_level);

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Isolation Level</Text>
          <Text style={styles.sectionDescription}>
            Control how data is isolated within this workspace
          </Text>

          <View style={styles.isolationOptions}>
            <TouchableOpacity
              style={[
                styles.isolationOption,
                currentWorkspace.data_isolation_level === 'strict' && styles.isolationOptionActive,
              ]}
            >
              <View style={[styles.isolationOptionIcon, { backgroundColor: '#FF3B30' }]}>
                <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.isolationOptionTitle}>Strict</Text>
              <Text style={styles.isolationOptionDescription}>
                Complete data isolation. No cross-workspace access allowed.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.isolationOption,
                currentWorkspace.data_isolation_level === 'moderate' && styles.isolationOptionActive,
              ]}
            >
              <View style={[styles.isolationOptionIcon, { backgroundColor: '#FF9500' }]}>
                <Ionicons name="lock-open" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.isolationOptionTitle}>Moderate</Text>
              <Text style={styles.isolationOptionDescription}>
                Controlled sharing with explicit permissions required.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.isolationOption,
                currentWorkspace.data_isolation_level === 'open' && styles.isolationOptionActive,
              ]}
            >
              <View style={[styles.isolationOptionIcon, { backgroundColor: '#34C759' }]}>
                <Ionicons name="globe" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.isolationOptionTitle}>Open</Text>
              <Text style={styles.isolationOptionDescription}>
                Open collaboration across workspaces within organization.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Access Policies</Text>

          <View style={styles.policyRow}>
            <View style={styles.policyLeft}>
              <Text style={styles.policyLabel}>Cross-Workspace Sharing</Text>
              <Text style={styles.policyDescription}>
                Allow members to share data with other workspaces
              </Text>
            </View>
            <Switch
              value={currentWorkspace.allow_cross_workspace_sharing}
              onValueChange={(value) => {
                // Update workspace
              }}
            />
          </View>

          <View style={styles.policyRow}>
            <View style={styles.policyLeft}>
              <Text style={styles.policyLabel}>External Sharing</Text>
              <Text style={styles.policyDescription}>
                Allow sharing with users outside the organization
              </Text>
            </View>
            <Switch value={false} onValueChange={() => {}} />
          </View>

          <View style={styles.policyRow}>
            <View style={styles.policyLeft}>
              <Text style={styles.policyLabel}>Public Links</Text>
              <Text style={styles.policyDescription}>
                Allow creation of public sharing links
              </Text>
            </View>
            <Switch value={false} onValueChange={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Settings</Text>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={24} color="#007AFF" />
              <Text style={styles.settingLabel}>Encryption</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>AES-256</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="time-outline" size={24} color="#007AFF" />
              <Text style={styles.settingLabel}>Data Retention</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>90 days</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#007AFF" />
              <Text style={styles.settingLabel}>Compliance</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>GDPR, HIPAA</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderMembersTab = () => {
    if (!currentWorkspace) return null;

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="person-add" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {item.user_id.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>User {item.user_id.slice(0, 8)}</Text>
                <Text style={styles.memberRole}>{item.role}</Text>
              </View>
              <View style={styles.memberPermissions}>
                {item.can_create && <Ionicons name="create" size={16} color="#34C759" />}
                {item.can_edit && <Ionicons name="pencil" size={16} color="#007AFF" />}
                {item.can_delete && <Ionicons name="trash" size={16} color="#FF3B30" />}
                {item.can_share && <Ionicons name="share" size={16} color="#FF9500" />}
              </View>
              {item.role !== 'admin' && (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Remove Member',
                      'Remove this member from the workspace?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => {
                            dispatch(removeWorkspaceMember({
                              workspaceId: currentWorkspace.id,
                              userId: item.user_id,
                            }));
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyStateText}>No members yet</Text>
            </View>
          }
        />
      </View>
    );
  };

  const renderResourcesTab = () => {
    if (!currentWorkspace) return null;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resource Limits</Text>

          <View style={styles.resourceCard}>
            <View style={styles.resourceHeader}>
              <Ionicons name="people" size={24} color="#007AFF" />
              <Text style={styles.resourceTitle}>Users</Text>
            </View>
            <Text style={styles.resourceValue}>
              {members.length} / {currentWorkspace.max_users}
            </Text>
            <View style={styles.resourceBar}>
              <View style={[
                styles.resourceBarFill,
                { width: `${(members.length / currentWorkspace.max_users) * 100}%` }
              ]} />
            </View>
            <TouchableOpacity style={styles.resourceButton}>
              <Text style={styles.resourceButtonText}>Increase Limit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resourceCard}>
            <View style={styles.resourceHeader}>
              <Ionicons name="server" size={24} color="#34C759" />
              <Text style={styles.resourceTitle}>Storage</Text>
            </View>
            <Text style={styles.resourceValue}>
              0 GB / {currentWorkspace.max_storage_gb} GB
            </Text>
            <View style={styles.resourceBar}>
              <View style={[styles.resourceBarFill, { width: '0%', backgroundColor: '#34C759' }]} />
            </View>
            <TouchableOpacity style={styles.resourceButton}>
              <Text style={styles.resourceButtonText}>Increase Limit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resourceCard}>
            <View style={styles.resourceHeader}>
              <Ionicons name="document-text" size={24} color="#FF9500" />
              <Text style={styles.resourceTitle}>Transcripts</Text>
            </View>
            <Text style={styles.resourceValue}>
              0 / {currentWorkspace.max_transcripts || 'Unlimited'}
            </Text>
            <View style={styles.resourceBar}>
              <View style={[styles.resourceBarFill, { width: '0%', backgroundColor: '#FF9500' }]} />
            </View>
            <TouchableOpacity style={styles.resourceButton}>
              <Text style={styles.resourceButtonText}>Increase Limit</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Alerts</Text>

          <View style={styles.alertRow}>
            <View style={styles.alertLeft}>
              <Text style={styles.alertLabel}>Storage Warning</Text>
              <Text style={styles.alertDescription}>Alert at 80% capacity</Text>
            </View>
            <Switch value={true} onValueChange={() => {}} />
          </View>

          <View style={styles.alertRow}>
            <View style={styles.alertLeft}>
              <Text style={styles.alertLabel}>User Limit Warning</Text>
              <Text style={styles.alertDescription}>Alert at 90% capacity</Text>
            </View>
            <Switch value={true} onValueChange={() => {}} />
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAnalyticsTab = () => {
    if (!currentWorkspace) return null;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workspace Analytics</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={32} color="#007AFF" />
              <Text style={styles.statValue}>{members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="document-text" size={32} color="#34C759" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Transcripts</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="server" size={32} color="#FF9500" />
              <Text style={styles.statValue}>0 GB</Text>
              <Text style={styles.statLabel}>Storage Used</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="time" size={32} color="#FF3B30" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Timeline</Text>
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>No activity data yet</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create Workspace</Text>
          <TouchableOpacity onPress={handleCreateWorkspace}>
            <Text style={styles.modalDone}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Workspace Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Engineering Team"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Slug * (URL-friendly)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="engineering-team"
              value={formData.slug}
              onChangeText={(text) => setFormData({ ...formData, slug: text.toLowerCase().replace(/\s+/g, '-') })}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Brief description of this workspace"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Data Isolation Level</Text>
            <View style={styles.isolationButtons}>
              {(['strict', 'moderate', 'open'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.isolationButton,
                    formData.data_isolation_level === level && styles.isolationButtonActive,
                    { borderColor: getIsolationColor(level) }
                  ]}
                  onPress={() => setFormData({ ...formData, data_isolation_level: level })}
                >
                  <Ionicons
                    name={getIsolationIcon(level) as any}
                    size={20}
                    color={formData.data_isolation_level === level ? '#FFFFFF' : getIsolationColor(level)}
                  />
                  <Text style={[
                    styles.isolationButtonText,
                    formData.data_isolation_level === level && styles.isolationButtonTextActive
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Max Users</Text>
            <TextInput
              style={styles.formInput}
              placeholder="10"
              value={formData.max_users.toString()}
              onChangeText={(text) => setFormData({ ...formData, max_users: parseInt(text) || 10 })}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Max Storage (GB)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="10"
              value={formData.max_storage_gb.toString()}
              onChangeText={(text) => setFormData({ ...formData, max_storage_gb: parseInt(text) || 10 })}
              keyboardType="number-pad"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEditModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Workspace</Text>
          <TouchableOpacity onPress={handleUpdateWorkspace}>
            <Text style={styles.modalDone}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Workspace Name</Text>
            <TextInput
              style={styles.formInput}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Max Users</Text>
            <TextInput
              style={styles.formInput}
              value={formData.max_users.toString()}
              onChangeText={(text) => setFormData({ ...formData, max_users: parseInt(text) || 10 })}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Max Storage (GB)</Text>
            <TextInput
              style={styles.formInput}
              value={formData.max_storage_gb.toString()}
              onChangeText={(text) => setFormData({ ...formData, max_storage_gb: parseInt(text) || 10 })}
              keyboardType="number-pad"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Main render
  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}

      <View style={styles.content}>
        {/* Workspaces List */}
        <View style={styles.sidebar}>
          {!currentOrganization ? (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyStateText}>Select an organization first</Text>
            </View>
          ) : loading && workspaces.length === 0 ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          ) : (
            <FlatList
              data={filteredWorkspaces}
              keyExtractor={(item) => item.id}
              renderItem={renderWorkspaceCard}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="briefcase-outline" size={64} color="#C7C7CC" />
                  <Text style={styles.emptyStateText}>
                    {searchQuery ? 'No workspaces found' : 'No workspaces yet'}
                  </Text>
                  {!searchQuery && (
                    <TouchableOpacity
                      style={styles.emptyStateButton}
                      onPress={() => setShowCreateModal(true)}
                    >
                      <Text style={styles.emptyStateButtonText}>Create Workspace</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          )}
        </View>

        {/* Workspace Details */}
        <View style={styles.mainContent}>
          {currentWorkspace && renderTabs()}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'isolation' && renderIsolationTab()}
          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'resources' && renderResourcesTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
        </View>
      </View>

      {/* Modals */}
      {renderCreateModal()}
      {renderEditModal()}

      {/* Error Display */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  createButtonDisabled: {
    color: '#C7C7CC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: width * 0.35,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
  },
  mainContent: {
    flex: 1,
  },
  loader: {
    marginTop: 40,
  },
  workspaceCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  workspaceCardSelected: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  workspaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workspaceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workspaceInfo: {
    flex: 1,
  },
  workspaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  workspaceSlug: {
    fontSize: 14,
    color: '#8E8E93',
  },
  workspaceDescription: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 12,
    lineHeight: 20,
  },
  workspaceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  isolationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  isolationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  workspaceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workspaceStatText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  detailLabel: {
    fontSize: 16,
    color: '#3C3C43',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#FF3B30',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  isolationOptions: {
    gap: 12,
  },
  isolationOption: {
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  isolationOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  isolationOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  isolationOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  isolationOptionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  policyLeft: {
    flex: 1,
    marginRight: 16,
  },
  policyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#000000',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 16,
    color: '#8E8E93',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  memberPermissions: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 12,
  },
  resourceCard: {
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  resourceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  resourceBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  resourceBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  resourceButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  resourceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  alertLeft: {
    flex: 1,
    marginRight: 16,
  },
  alertLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 64) / 2,
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCancel: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  isolationButtons: {
    gap: 8,
  },
  isolationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  isolationButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  isolationButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3C3C43',
  },
  isolationButtonTextActive: {
    color: '#FFFFFF',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
