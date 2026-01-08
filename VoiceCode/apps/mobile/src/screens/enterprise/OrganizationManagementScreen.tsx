/**
 * Organization Management Screen
 * Phase 3 Week 9 Day 57-58: Multi-Tenant Architecture
 * 
 * Features:
 * - Organization list with search/filter
 * - Organization creation and editing
 * - Member management with RBAC
 * - Billing and subscription management
 * - Usage analytics dashboard
 * - Settings and configuration
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
  Dimensions,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchUserOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  setCurrentOrganization,
  fetchOrganizationMembers,
  addOrganizationMember,
  removeOrganizationMember,
} from '../../store/slices/organizationSlice';
import { Organization, CreateOrganizationInput, UpdateOrganizationInput } from '../../services/organizationService';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TabType = 'overview' | 'members' | 'billing' | 'settings' | 'analytics';

interface OrganizationFormData {
  name: string;
  slug: string;
  description: string;
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  billing_email: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OrganizationManagementScreen() {
  const dispatch = useAppDispatch();
  const { organizations, currentOrganization, members, loading, error } = useAppSelector(
    (state) => state.organization
  );

  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    slug: '',
    description: '',
    industry: '',
    size: 'small',
    billing_email: '',
  });

  // Load organizations on mount
  useEffect(() => {
    dispatch(fetchUserOrganizations());
  }, [dispatch]);

  // Load members when organization changes
  useEffect(() => {
    if (currentOrganization) {
      dispatch(fetchOrganizationMembers(currentOrganization.id));
    }
  }, [currentOrganization, dispatch]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchUserOrganizations());
    setRefreshing(false);
  }, [dispatch]);

  const handleCreateOrganization = useCallback(async () => {
    if (!formData.name || !formData.slug) {
      Alert.alert('Error', 'Name and slug are required');
      return;
    }

    try {
      const input: CreateOrganizationInput = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        industry: formData.industry || undefined,
        size: formData.size,
        billing_email: formData.billing_email || undefined,
      };

      await dispatch(createOrganization(input)).unwrap();
      setShowCreateModal(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        industry: '',
        size: 'small',
        billing_email: '',
      });
      Alert.alert('Success', 'Organization created successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create organization');
    }
  }, [formData, dispatch]);

  const handleUpdateOrganization = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      const input: UpdateOrganizationInput = {
        name: formData.name || undefined,
        description: formData.description || undefined,
        industry: formData.industry || undefined,
        size: formData.size,
        billing_email: formData.billing_email || undefined,
      };

      await dispatch(updateOrganization({ id: currentOrganization.id, input })).unwrap();
      setShowEditModal(false);
      Alert.alert('Success', 'Organization updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update organization');
    }
  }, [currentOrganization, formData, dispatch]);

  const handleDeleteOrganization = useCallback(async (id: string) => {
    Alert.alert(
      'Delete Organization',
      'Are you sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteOrganization(id)).unwrap();
              Alert.alert('Success', 'Organization deleted');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete organization');
            }
          },
        },
      ]
    );
  }, [dispatch]);

  const handleSelectOrganization = useCallback((org: Organization) => {
    dispatch(setCurrentOrganization(org));
  }, [dispatch]);

  const handleOpenEditModal = useCallback(() => {
    if (currentOrganization) {
      setFormData({
        name: currentOrganization.name,
        slug: currentOrganization.slug,
        description: currentOrganization.description || '',
        industry: currentOrganization.industry || '',
        size: currentOrganization.size || 'small',
        billing_email: currentOrganization.billing_email || '',
      });
      setShowEditModal(true);
    }
  }, [currentOrganization]);

  // Filter organizations
  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render functions
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Organizations</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add-circle" size={24} color="#007AFF" />
        <Text style={styles.createButtonText}>New</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search organizations..."
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

  const renderOrganizationCard = ({ item }: { item: Organization }) => {
    const isSelected = currentOrganization?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.orgCard, isSelected && styles.orgCardSelected]}
        onPress={() => handleSelectOrganization(item)}
      >
        <View style={styles.orgCardHeader}>
          <View style={styles.orgIcon}>
            <Text style={styles.orgIconText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>{item.name}</Text>
            <Text style={styles.orgSlug}>@{item.slug}</Text>
          </View>
          <View style={styles.orgBadge}>
            <Text style={styles.orgBadgeText}>
              {item.subscription_tier.toUpperCase()}
            </Text>
          </View>
        </View>
        {item.description && (
          <Text style={styles.orgDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.orgFooter}>
          <View style={styles.orgStat}>
            <Ionicons name="people" size={16} color="#8E8E93" />
            <Text style={styles.orgStatText}>Members</Text>
          </View>
          <View style={styles.orgStat}>
            <Ionicons name="briefcase" size={16} color="#8E8E93" />
            <Text style={styles.orgStatText}>{item.industry || 'N/A'}</Text>
          </View>
          <View style={styles.orgStat}>
            <Ionicons name="resize" size={16} color="#8E8E93" />
            <Text style={styles.orgStatText}>{item.size || 'small'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['overview', 'members', 'billing', 'settings', 'analytics'] as TabType[]).map((tab) => (
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
    if (!currentOrganization) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="business" size={64} color="#C7C7CC" />
          <Text style={styles.emptyStateText}>Select an organization to view details</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Organization Details</Text>
            <TouchableOpacity onPress={handleOpenEditModal}>
              <Ionicons name="create-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{currentOrganization.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Slug</Text>
            <Text style={styles.detailValue}>@{currentOrganization.slug}</Text>
          </View>

          {currentOrganization.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{currentOrganization.description}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Industry</Text>
            <Text style={styles.detailValue}>{currentOrganization.industry || 'Not specified'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size</Text>
            <Text style={styles.detailValue}>{currentOrganization.size || 'Small'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subscription</Text>
            <View style={styles.subscriptionBadge}>
              <Text style={styles.subscriptionText}>
                {currentOrganization.subscription_tier.toUpperCase()}
              </Text>
              <View style={[
                styles.statusDot,
                currentOrganization.subscription_status === 'active' && styles.statusDotActive
              ]} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="people-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Manage Members</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="card-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Billing & Subscription</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Organization Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={() => handleDeleteOrganization(currentOrganization.id)}
          >
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Delete Organization</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderMembersTab = () => {
    if (!currentOrganization) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="people" size={64} color="#C7C7CC" />
          <Text style={styles.emptyStateText}>Select an organization to view members</Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowMemberModal(true)}
          >
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
              <View style={styles.memberActions}>
                <View style={[
                  styles.statusBadge,
                  item.status === 'active' && styles.statusBadgeActive,
                  item.status === 'invited' && styles.statusBadgeInvited,
                ]}>
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
                {item.role !== 'owner' && (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Remove Member',
                        'Are you sure you want to remove this member?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => {
                              dispatch(removeOrganizationMember({
                                organizationId: currentOrganization.id,
                                userId: item.user_id,
                              }));
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
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

  const renderBillingTab = () => {
    if (!currentOrganization) return null;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>

          <View style={styles.billingCard}>
            <View style={styles.billingHeader}>
              <Text style={styles.billingPlan}>
                {currentOrganization.subscription_tier.toUpperCase()} PLAN
              </Text>
              <View style={[
                styles.statusDot,
                currentOrganization.subscription_status === 'active' && styles.statusDotActive
              ]} />
            </View>

            <Text style={styles.billingPrice}>
              {currentOrganization.subscription_tier === 'free' ? 'Free' :
               currentOrganization.subscription_tier === 'pro' ? '$29/month' :
               currentOrganization.subscription_tier === 'business' ? '$99/month' :
               '$299/month'}
            </Text>

            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Information</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Billing Email</Text>
            <Text style={styles.detailValue}>
              {currentOrganization.billing_email || 'Not set'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stripe Customer ID</Text>
            <Text style={styles.detailValue}>
              {currentOrganization.stripe_customer_id || 'Not connected'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage This Month</Text>

          <View style={styles.usageCard}>
            <View style={styles.usageRow}>
              <Text style={styles.usageLabel}>Transcription Minutes</Text>
              <Text style={styles.usageValue}>0 / ∞</Text>
            </View>
            <View style={styles.usageBar}>
              <View style={[styles.usageBarFill, { width: '0%' }]} />
            </View>
          </View>

          <View style={styles.usageCard}>
            <View style={styles.usageRow}>
              <Text style={styles.usageLabel}>Storage</Text>
              <Text style={styles.usageValue}>0 GB / 100 GB</Text>
            </View>
            <View style={styles.usageBar}>
              <View style={[styles.usageBarFill, { width: '0%' }]} />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderSettingsTab = () => {
    if (!currentOrganization) return null;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Settings</Text>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color="#007AFF" />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#007AFF" />
              <Text style={styles.settingLabel}>Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={24} color="#007AFF" />
              <Text style={styles.settingLabel}>API Keys</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>

          <View style={styles.featureRow}>
            <Text style={styles.featureLabel}>SSO Authentication</Text>
            <Text style={styles.featureValue}>
              {currentOrganization.features?.sso ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          <View style={styles.featureRow}>
            <Text style={styles.featureLabel}>Advanced Analytics</Text>
            <Text style={styles.featureValue}>
              {currentOrganization.features?.analytics ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          <View style={styles.featureRow}>
            <Text style={styles.featureLabel}>Custom Branding</Text>
            <Text style={styles.featureValue}>
              {currentOrganization.features?.branding ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAnalyticsTab = () => {
    if (!currentOrganization) return null;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={32} color="#007AFF" />
              <Text style={styles.statValue}>{members.length}</Text>
              <Text style={styles.statLabel}>Total Members</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="briefcase" size={32} color="#34C759" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Workspaces</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="document-text" size={32} color="#FF9500" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Transcripts</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="time" size={32} color="#FF3B30" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color="#C7C7CC" />
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
          <Text style={styles.modalTitle}>Create Organization</Text>
          <TouchableOpacity onPress={handleCreateOrganization}>
            <Text style={styles.modalDone}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Organization Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Acme Inc."
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Slug * (URL-friendly)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="acme-inc"
              value={formData.slug}
              onChangeText={(text) => setFormData({ ...formData, slug: text.toLowerCase().replace(/\s+/g, '-') })}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Brief description of your organization"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Industry</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Technology, Healthcare, etc."
              value={formData.industry}
              onChangeText={(text) => setFormData({ ...formData, industry: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Organization Size</Text>
            <View style={styles.sizeButtons}>
              {(['small', 'medium', 'large', 'enterprise'] as const).map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeButton,
                    formData.size === size && styles.sizeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, size })}
                >
                  <Text style={[
                    styles.sizeButtonText,
                    formData.size === size && styles.sizeButtonTextActive
                  ]}>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Billing Email</Text>
            <TextInput
              style={styles.formInput}
              placeholder="billing@acme.com"
              value={formData.billing_email}
              onChangeText={(text) => setFormData({ ...formData, billing_email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
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
          <Text style={styles.modalTitle}>Edit Organization</Text>
          <TouchableOpacity onPress={handleUpdateOrganization}>
            <Text style={styles.modalDone}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Organization Name</Text>
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
            <Text style={styles.formLabel}>Industry</Text>
            <TextInput
              style={styles.formInput}
              value={formData.industry}
              onChangeText={(text) => setFormData({ ...formData, industry: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Billing Email</Text>
            <TextInput
              style={styles.formInput}
              value={formData.billing_email}
              onChangeText={(text) => setFormData({ ...formData, billing_email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
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
        {/* Organizations List */}
        <View style={styles.sidebar}>
          {loading && organizations.length === 0 ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          ) : (
            <FlatList
              data={filteredOrganizations}
              keyExtractor={(item) => item.id}
              renderItem={renderOrganizationCard}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="business-outline" size={64} color="#C7C7CC" />
                  <Text style={styles.emptyStateText}>
                    {searchQuery ? 'No organizations found' : 'No organizations yet'}
                  </Text>
                  {!searchQuery && (
                    <TouchableOpacity
                      style={styles.emptyStateButton}
                      onPress={() => setShowCreateModal(true)}
                    >
                      <Text style={styles.emptyStateButtonText}>Create Organization</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          )}
        </View>

        {/* Organization Details */}
        <View style={styles.mainContent}>
          {currentOrganization && renderTabs()}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'billing' && renderBillingTab()}
          {activeTab === 'settings' && renderSettingsTab()}
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
  orgCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  orgCardSelected: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  orgCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orgIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orgIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  orgSlug: {
    fontSize: 14,
    color: '#8E8E93',
  },
  orgBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orgBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orgDescription: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 12,
    lineHeight: 20,
  },
  orgFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  orgStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orgStatText: {
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
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  statusDotActive: {
    backgroundColor: '#34C759',
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
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#8E8E93',
  },
  statusBadgeActive: {
    backgroundColor: '#34C759',
  },
  statusBadgeInvited: {
    backgroundColor: '#FF9500',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  billingCard: {
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  billingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billingPlan: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  billingPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  usageCard: {
    marginBottom: 16,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 14,
    color: '#3C3C43',
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  usageBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
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
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  featureLabel: {
    fontSize: 16,
    color: '#3C3C43',
  },
  featureValue: {
    fontSize: 16,
    fontWeight: '500',
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
    fontSize: 32,
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
  sizeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  sizeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3C43',
  },
  sizeButtonTextActive: {
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

