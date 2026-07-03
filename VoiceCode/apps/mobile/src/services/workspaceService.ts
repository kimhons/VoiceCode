/**
 * Workspace Service
 * Handles workspace management and data isolation
 */

import { supabase } from './supabase.service';
import { auditService } from './auditService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Workspace {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  
  // Isolation Settings
  data_isolation_level: 'strict' | 'moderate' | 'open';
  allow_cross_workspace_sharing: boolean;
  
  // Resource Limits
  max_storage_gb: number;
  max_users: number;
  max_transcripts?: number;
  
  // Settings
  settings: Record<string, any>;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'viewer';
  
  // Permissions
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  added_by: string;
}

export interface CreateWorkspaceInput {
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  data_isolation_level?: Workspace['data_isolation_level'];
  max_storage_gb?: number;
  max_users?: number;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  data_isolation_level?: Workspace['data_isolation_level'];
  allow_cross_workspace_sharing?: boolean;
  max_storage_gb?: number;
  max_users?: number;
  max_transcripts?: number;
  settings?: Record<string, any>;
}

export interface WorkspaceUsageStats {
  total_members: number;
  total_transcripts: number;
  storage_used_gb: number;
  storage_limit_gb: number;
  transcripts_this_month: number;
  active_members_30d: number;
}

// ============================================================================
// WORKSPACE SERVICE
// ============================================================================

class WorkspaceService {
  /**
   * Get all workspaces for an organization
   */
  async getOrganizationWorkspaces(organizationId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get workspaces for current user
   */
  async getUserWorkspaces(): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        workspace_members!inner(role)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(id: string): Promise<Workspace | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if slug is available within organization
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id')
      .eq('organization_id', input.organization_id)
      .eq('slug', input.slug)
      .single();

    if (existing) {
      throw new Error('Workspace slug already exists in this organization');
    }

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        ...input,
        created_by: user.id,
        data_isolation_level: input.data_isolation_level || 'strict',
        max_storage_gb: input.max_storage_gb || 10,
        max_users: input.max_users || 10,
      })
      .select()
      .single();

    if (workspaceError) throw workspaceError;

    // Add creator as admin
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'admin',
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_share: true,
        added_by: user.id,
      });

    if (memberError) throw memberError;

    // Log audit event
    await auditService.log({
      organization_id: input.organization_id,
      workspace_id: workspace.id,
      event_type: 'create',
      resource_type: 'workspace',
      resource_id: workspace.id,
      action: 'Workspace created',
    });

    return workspace;
  }

  /**
   * Update workspace
   */
  async updateWorkspace(id: string, input: UpdateWorkspaceInput): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Get workspace for organization_id
    const workspace = await this.getWorkspace(id);

    // Log audit event
    await auditService.log({
      organization_id: workspace?.organization_id,
      workspace_id: id,
      event_type: 'update',
      resource_type: 'workspace',
      resource_id: id,
      action: 'Workspace updated',
      metadata: { changes: input },
    });

    return data;
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(id: string): Promise<void> {
    const workspace = await this.getWorkspace(id);

    // Log audit event before deletion
    await auditService.log({
      organization_id: workspace?.organization_id,
      workspace_id: id,
      event_type: 'delete',
      resource_type: 'workspace',
      resource_id: id,
      action: 'Workspace deleted',
    });

    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get workspace members
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Add member to workspace
   */
  async addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceMember['role'] = 'member',
    permissions?: Partial<Pick<WorkspaceMember, 'can_create' | 'can_edit' | 'can_delete' | 'can_share'>>
  ): Promise<WorkspaceMember> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role,
        can_create: permissions?.can_create ?? true,
        can_edit: permissions?.can_edit ?? true,
        can_delete: permissions?.can_delete ?? false,
        can_share: permissions?.can_share ?? true,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    const workspace = await this.getWorkspace(workspaceId);

    // Log audit event
    await auditService.log({
      organization_id: workspace?.organization_id,
      workspace_id: workspaceId,
      event_type: 'create',
      resource_type: 'workspace_member',
      resource_id: data.id,
      action: `User ${userId} added to workspace`,
      metadata: { role, permissions },
    });

    return data;
  }

  /**
   * Update member permissions
   */
  async updateMemberPermissions(
    workspaceId: string,
    userId: string,
    updates: Partial<Pick<WorkspaceMember, 'role' | 'can_create' | 'can_edit' | 'can_delete' | 'can_share'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('workspace_members')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) throw error;

    const workspace = await this.getWorkspace(workspaceId);

    // Log audit event
    await auditService.log({
      organization_id: workspace?.organization_id,
      workspace_id: workspaceId,
      event_type: 'update',
      resource_type: 'workspace_member',
      action: `User ${userId} permissions updated`,
      metadata: { updates },
    });
  }

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.getWorkspace(workspaceId);

    // Log audit event before deletion
    await auditService.log({
      organization_id: workspace?.organization_id,
      workspace_id: workspaceId,
      event_type: 'delete',
      resource_type: 'workspace_member',
      action: `User ${userId} removed from workspace`,
    });

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Get workspace usage statistics
   */
  async getUsageStats(workspaceId: string): Promise<WorkspaceUsageStats> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    const { data: members } = await supabase
      .from('workspace_members')
      .select('id', { count: 'exact' })
      .eq('workspace_id', workspaceId);

    return {
      total_members: members?.length || 0,
      total_transcripts: 0, // TODO: Implement
      storage_used_gb: 0, // TODO: Implement
      storage_limit_gb: workspace.max_storage_gb,
      transcripts_this_month: 0, // TODO: Implement
      active_members_30d: 0, // TODO: Implement
    };
  }
}

export const workspaceService = new WorkspaceService();

