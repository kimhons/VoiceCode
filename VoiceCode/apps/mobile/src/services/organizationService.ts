/**
 * Organization Service
 * Handles organization CRUD operations and multi-tenant management
 */

import { supabase } from './supabase.service';
import { auditService } from './auditService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  
  // Billing
  subscription_tier: 'free' | 'pro' | 'business' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'suspended';
  billing_email?: string;
  stripe_customer_id?: string;
  
  // Settings
  settings: Record<string, any>;
  features: Record<string, boolean>;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  role_id?: string;
  status: 'active' | 'invited' | 'suspended';
  invited_by?: string;
  invited_at?: string;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  size?: Organization['size'];
  billing_email?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  industry?: string;
  size?: Organization['size'];
  billing_email?: string;
  settings?: Record<string, any>;
  features?: Record<string, boolean>;
}

export interface OrganizationUsageStats {
  total_users: number;
  total_workspaces: number;
  total_transcripts: number;
  total_storage_gb: number;
  total_minutes_transcribed: number;
  active_users_30d: number;
}

// ============================================================================
// ORGANIZATION SERVICE
// ============================================================================

class OrganizationService {
  /**
   * Get all organizations for the current user
   */
  async getUserOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_members!inner(role, status)
      `)
      .eq('organization_members.status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  }

  /**
   * Create a new organization
   */
  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if slug is available
    const existing = await this.getOrganizationBySlug(input.slug);
    if (existing) {
      throw new Error('Organization slug already exists');
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        ...input,
        created_by: user.id,
        subscription_tier: 'free',
        subscription_status: 'active',
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
      });

    if (memberError) throw memberError;

    // Log audit event
    await auditService.log({
      organization_id: org.id,
      event_type: 'create',
      resource_type: 'organization',
      resource_id: org.id,
      action: 'Organization created',
    });

    return org;
  }

  /**
   * Update organization
   */
  async updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await auditService.log({
      organization_id: id,
      event_type: 'update',
      resource_type: 'organization',
      resource_id: id,
      action: 'Organization updated',
      metadata: { changes: input },
    });

    return data;
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: string): Promise<void> {
    // Log audit event before deletion
    await auditService.log({
      organization_id: id,
      event_type: 'delete',
      resource_type: 'organization',
      resource_id: id,
      action: 'Organization deleted',
    });

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Add member to organization
   */
  async addMember(
    organizationId: string,
    userId: string,
    role: OrganizationMember['role'] = 'member'
  ): Promise<OrganizationMember> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role,
        status: 'invited',
        invited_by: user.id,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await auditService.log({
      organization_id: organizationId,
      event_type: 'create',
      resource_type: 'organization_member',
      resource_id: data.id,
      action: `User ${userId} invited to organization`,
      metadata: { role },
    });

    return data;
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationMember['role']
  ): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (error) throw error;

    // Log audit event
    await auditService.log({
      organization_id: organizationId,
      event_type: 'update',
      resource_type: 'organization_member',
      action: `User ${userId} role updated to ${role}`,
      metadata: { role },
    });
  }

  /**
   * Remove member from organization
   */
  async removeMember(organizationId: string, userId: string): Promise<void> {
    // Log audit event before deletion
    await auditService.log({
      organization_id: organizationId,
      event_type: 'delete',
      resource_type: 'organization_member',
      action: `User ${userId} removed from organization`,
    });

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Get organization usage statistics
   */
  async getUsageStats(organizationId: string): Promise<OrganizationUsageStats> {
    // This would aggregate data from various tables
    // Simplified version for now
    const { data: members } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId);

    return {
      total_users: members?.length || 0,
      total_workspaces: workspaces?.length || 0,
      total_transcripts: 0, // TODO: Implement
      total_storage_gb: 0, // TODO: Implement
      total_minutes_transcribed: 0, // TODO: Implement
      active_users_30d: 0, // TODO: Implement
    };
  }
}

export const organizationService = new OrganizationService();

