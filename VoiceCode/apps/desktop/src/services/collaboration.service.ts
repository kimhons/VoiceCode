/**
 * Collaboration Service
 * Phase 3.4: Collaboration Features
 *
 * Handles workspaces, sharing, comments, annotations, and notifications
 */

import { getSupabaseService } from './supabase.service';

// =====================================================
// TYPES
// =====================================================

export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Member {
  id: string;
  workspace_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Permissions {
  view: boolean;
  edit: boolean;
  comment: boolean;
}

export interface SharedTranscript {
  id: string;
  transcript_id: string;
  workspace_id: string;
  shared_by: string;
  permissions: Permissions;
  shared_at: string;
}

export interface Comment {
  id: string;
  transcript_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  timestamp?: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

export interface Annotation {
  id: string;
  transcript_id: string;
  user_id: string;
  start_time: number;
  end_time: number;
  content: string;
  color: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export type NotificationType =
  | 'comment'
  | 'mention'
  | 'share'
  | 'invite'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  workspace_id?: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// =====================================================
// COLLABORATION SERVICE
// =====================================================

export class CollaborationService {
  private supabase = getSupabaseService();

  // =====================================================
  // WORKSPACES
  // =====================================================

  async createWorkspace(
    name: string,
    description?: string
  ): Promise<Workspace> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .getClient()
      .from('workspaces')
      .insert({
        name,
        description,
        owner_id: user.id,
        settings: {},
      })
      .select()
      .single();

    if (error) throw error;
    const workspace = data as unknown as Workspace;

    // Add owner as member
    await this.supabase.getClient().from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    });

    // Log activity
    await this.logActivity(workspace.id, user.id, 'created', 'workspace', workspace.id);

    return workspace;
  }

  async updateWorkspace(
    id: string,
    updates: Partial<Workspace>
  ): Promise<Workspace> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .getClient()
      .from('workspaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(id, user.id, 'updated', 'workspace', id);

    return data as unknown as Workspace;
  }

  async deleteWorkspace(id: string): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .getClient()
      .from('workspaces')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;

    // Log activity
    await this.logActivity(id, user.id, 'deleted', 'workspace', id);
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .getClient()
      .from('workspaces')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Workspace[];
  }

  async getWorkspace(id: string): Promise<Workspace> {
    const { data, error } = await this.supabase
      .getClient()
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;
    return data as unknown as Workspace;
  }

  // =====================================================
  // MEMBERS
  // =====================================================

  async inviteMember(
    workspaceId: string,
    email: string,
    role: Role
  ): Promise<Member> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Find user by email
    const { data: userData, error: userError } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) throw new Error('User not found');
    const userRecord = userData as Record<string, unknown>;

    // Add member
    const { data, error } = await this.supabase
      .getClient()
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userRecord.id as string,
        role,
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification
    await this.createNotification(
      userRecord.id as string,
      'invite',
      'Workspace Invitation',
      `You've been invited to join a workspace`,
      `/workspaces/${workspaceId}`
    );

    // Log activity
    await this.logActivity(
      workspaceId,
      user.id,
      'invited',
      'member',
      userRecord.id as string
    );

    return data as unknown as Member;
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .getClient()
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) throw error;

    // Log activity
    await this.logActivity(workspaceId, user.id, 'removed', 'member', userId);
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: Role
  ): Promise<Member> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .getClient()
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(
      workspaceId,
      user.id,
      'updated_role',
      'member',
      userId,
      { role }
    );

    return data as unknown as Member;
  }

  async getMembers(workspaceId: string): Promise<Member[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('workspace_members')
      .select(
        `
        *,
        user:user_profiles(id, email, full_name, avatar_url)
      `
      )
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return (data || []) as Member[];
  }

  // =====================================================
  // SHARING
  // =====================================================

  async shareTranscript(
    transcriptId: string,
    workspaceId: string,
    permissions: Permissions
  ): Promise<SharedTranscript> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .getClient()
      .from('shared_transcripts')
      .insert({
        transcript_id: transcriptId,
        workspace_id: workspaceId,
        shared_by: user.id,
        permissions,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify workspace members
    const members = await this.getMembers(workspaceId);
    for (const member of members) {
      if (member.user_id !== user.id) {
        await this.createNotification(
          member.user_id,
          'share',
          'Transcript Shared',
          'A transcript has been shared with your workspace',
          `/transcripts/${transcriptId}`
        );
      }
    }

    // Log activity
    await this.logActivity(
      workspaceId,
      user.id,
      'shared',
      'transcript',
      transcriptId
    );

    return data as unknown as SharedTranscript;
  }

  async unshareTranscript(
    transcriptId: string,
    workspaceId: string
  ): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .getClient()
      .from('shared_transcripts')
      .delete()
      .eq('transcript_id', transcriptId)
      .eq('workspace_id', workspaceId);

    if (error) throw error;

    // Log activity
    await this.logActivity(
      workspaceId,
      user.id,
      'unshared',
      'transcript',
      transcriptId
    );
  }

  async updateSharePermissions(
    transcriptId: string,
    workspaceId: string,
    permissions: Permissions
  ): Promise<SharedTranscript> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .getClient()
      .from('shared_transcripts')
      .update({ permissions })
      .eq('transcript_id', transcriptId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(
      workspaceId,
      user.id,
      'updated_permissions',
      'transcript',
      transcriptId
    );

    return data as unknown as SharedTranscript;
  }

  async getSharedTranscripts(workspaceId: string): Promise<SharedTranscript[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('shared_transcripts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('shared_at', { ascending: false });

    if (error) throw error;
    return (data || []) as SharedTranscript[];
  }

  // =====================================================
  // COMMENTS
  // =====================================================

  async addComment(
    transcriptId: string,
    content: string,
    timestamp?: number,
    parentId?: string
  ): Promise<Comment> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .getClient()
      .from('comments')
      .insert({
        transcript_id: transcriptId,
        user_id: user.id,
        parent_id: parentId,
        content,
        timestamp,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify transcript owner
    const { data: transcript } = await this.supabase
      .getClient()
      .from('transcripts')
      .select('user_id')
      .eq('id', transcriptId)
      .single();

    const transcriptRecord = transcript as Record<string, unknown> | null;
    if (transcriptRecord && transcriptRecord.user_id !== user.id) {
      await this.createNotification(
        transcriptRecord.user_id as string,
        'comment',
        'New Comment',
        'Someone commented on your transcript',
        `/transcripts/${transcriptId}`
      );
    }

    return data as unknown as Comment;
  }

  async editComment(commentId: string, content: string): Promise<Comment> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .getClient()
      .from('comments')
      .update({ content })
      .eq('id', commentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Comment;
  }

  async deleteComment(commentId: string): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .getClient()
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  async getComments(transcriptId: string): Promise<Comment[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('comments')
      .select(
        `
        *,
        user:user_profiles(id, email, full_name, avatar_url)
      `
      )
      .eq('transcript_id', transcriptId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Build threaded comments
    const comments = (data || []) as Comment[];
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map
    comments.forEach((comment: Comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    comments.forEach((comment: Comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies!.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  }

  // =====================================================
  // ANNOTATIONS
  // =====================================================

  async addAnnotation(
    transcriptId: string,
    startTime: number,
    endTime: number,
    content: string,
    color: string = '#ffeb3b'
  ): Promise<Annotation> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .getClient()
      .from('annotations')
      .insert({
        transcript_id: transcriptId,
        user_id: user.id,
        start_time: startTime,
        end_time: endTime,
        content,
        color,
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Annotation;
  }

  async editAnnotation(
    annotationId: string,
    content: string
  ): Promise<Annotation> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .getClient()
      .from('annotations')
      .update({ content })
      .eq('id', annotationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Annotation;
  }

  async deleteAnnotation(annotationId: string): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .getClient()
      .from('annotations')
      .update({ is_deleted: true })
      .eq('id', annotationId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  async getAnnotations(transcriptId: string): Promise<Annotation[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('annotations')
      .select(
        `
        *,
        user:user_profiles(id, email, full_name, avatar_url)
      `
      )
      .eq('transcript_id', transcriptId)
      .eq('is_deleted', false)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return (data || []) as Annotation[];
  }

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  async getNotifications(): Promise<Notification[]> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .getClient()
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []) as Notification[];
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .getClient()
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  async markAllNotificationsRead(): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .getClient()
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
  }

  async getUnreadCount(): Promise<number> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { count, error } = await this.supabase
      .getClient()
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  // =====================================================
  // ACTIVITY
  // =====================================================

  async getActivity(
    workspaceId: string,
    limit: number = 50
  ): Promise<Activity[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('activity_log')
      .select(
        `
        *,
        user:user_profiles(id, email, full_name, avatar_url)
      `
      )
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Activity[];
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await this.supabase.getClient().rpc('create_notification', {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_message: message,
      p_link: link,
      p_metadata: metadata,
    });
  }

  private async logActivity(
    workspaceId: string,
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await this.supabase.getClient().rpc('log_activity', {
      p_workspace_id: workspaceId,
      p_user_id: userId,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_metadata: metadata,
    });
  }
}

// Singleton instance
let collaborationServiceInstance: CollaborationService | null = null;

export function getCollaborationService(): CollaborationService {
  if (!collaborationServiceInstance) {
    collaborationServiceInstance = new CollaborationService();
  }
  return collaborationServiceInstance;
}
