/**
 * useCollaboration Hook
 * Phase 3.4: Collaboration Features
 * 
 * React hook for collaboration features
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getCollaborationService,
  Workspace,
  Member,
  SharedTranscript,
  Comment,
  Annotation,
  Notification,
  Activity,
  Role,
  Permissions,
} from '../services/collaboration.service';

export interface UseCollaborationOptions {
  autoLoadNotifications?: boolean;
  notificationPollingInterval?: number; // milliseconds
}

export interface UseCollaborationReturn {
  // Workspaces
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loadWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  selectWorkspace: (workspace: Workspace | null) => void;
  isLoadingWorkspaces: boolean;

  // Members
  members: Member[];
  loadMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (workspaceId: string, email: string, role: Role) => Promise<Member>;
  removeMember: (workspaceId: string, userId: string) => Promise<void>;
  updateMemberRole: (workspaceId: string, userId: string, role: Role) => Promise<Member>;
  isLoadingMembers: boolean;

  // Sharing
  sharedTranscripts: SharedTranscript[];
  loadSharedTranscripts: (workspaceId: string) => Promise<void>;
  shareTranscript: (transcriptId: string, workspaceId: string, permissions: Permissions) => Promise<SharedTranscript>;
  unshareTranscript: (transcriptId: string, workspaceId: string) => Promise<void>;
  updateSharePermissions: (transcriptId: string, workspaceId: string, permissions: Permissions) => Promise<SharedTranscript>;
  isLoadingShares: boolean;

  // Comments
  comments: Comment[];
  loadComments: (transcriptId: string) => Promise<void>;
  addComment: (transcriptId: string, content: string, timestamp?: number, parentId?: string) => Promise<Comment>;
  editComment: (commentId: string, content: string) => Promise<Comment>;
  deleteComment: (commentId: string) => Promise<void>;
  isLoadingComments: boolean;

  // Annotations
  annotations: Annotation[];
  loadAnnotations: (transcriptId: string) => Promise<void>;
  addAnnotation: (transcriptId: string, startTime: number, endTime: number, content: string, color?: string) => Promise<Annotation>;
  editAnnotation: (annotationId: string, content: string) => Promise<Annotation>;
  deleteAnnotation: (annotationId: string) => Promise<void>;
  isLoadingAnnotations: boolean;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  isLoadingNotifications: boolean;

  // Activity
  activity: Activity[];
  loadActivity: (workspaceId: string, limit?: number) => Promise<void>;
  isLoadingActivity: boolean;

  // State
  error: string | null;
  clearError: () => void;
}

export function useCollaboration(
  options: UseCollaborationOptions = {}
): UseCollaborationReturn {
  const {
    autoLoadNotifications = true,
    notificationPollingInterval = 30000, // 30 seconds
  } = options;

  // Service
  const collaborationService = useRef(getCollaborationService());

  // State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const [sharedTranscripts, setSharedTranscripts] = useState<SharedTranscript[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const [activity, setActivity] = useState<Activity[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Workspaces
  const loadWorkspaces = useCallback(async () => {
    setError(null);
    setIsLoadingWorkspaces(true);
    try {
      const data = await collaborationService.current.getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load workspaces';
      setError(message);
      console.error('Failed to load workspaces:', err);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, []);

  const createWorkspace = useCallback(async (name: string, description?: string) => {
    setError(null);
    try {
      const workspace = await collaborationService.current.createWorkspace(name, description);
      setWorkspaces(prev => [workspace, ...prev]);
      return workspace;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create workspace';
      setError(message);
      throw err;
    }
  }, []);

  const updateWorkspace = useCallback(async (id: string, updates: Partial<Workspace>) => {
    setError(null);
    try {
      const workspace = await collaborationService.current.updateWorkspace(id, updates);
      setWorkspaces(prev => prev.map(w => w.id === id ? workspace : w));
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(workspace);
      }
      return workspace;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update workspace';
      setError(message);
      throw err;
    }
  }, [currentWorkspace]);

  const deleteWorkspace = useCallback(async (id: string) => {
    setError(null);
    try {
      await collaborationService.current.deleteWorkspace(id);
      setWorkspaces(prev => prev.filter(w => w.id !== id));
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete workspace';
      setError(message);
      throw err;
    }
  }, [currentWorkspace]);

  const selectWorkspace = useCallback((workspace: Workspace | null) => {
    setCurrentWorkspace(workspace);
  }, []);

  // Members
  const loadMembers = useCallback(async (workspaceId: string) => {
    setError(null);
    setIsLoadingMembers(true);
    try {
      const data = await collaborationService.current.getMembers(workspaceId);
      setMembers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load members';
      setError(message);
      console.error('Failed to load members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  const inviteMember = useCallback(async (workspaceId: string, email: string, role: Role) => {
    setError(null);
    try {
      const member = await collaborationService.current.inviteMember(workspaceId, email, role);
      setMembers(prev => [...prev, member]);
      return member;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to invite member';
      setError(message);
      throw err;
    }
  }, []);

  const removeMember = useCallback(async (workspaceId: string, userId: string) => {
    setError(null);
    try {
      await collaborationService.current.removeMember(workspaceId, userId);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      setError(message);
      throw err;
    }
  }, []);

  const updateMemberRole = useCallback(async (workspaceId: string, userId: string, role: Role) => {
    setError(null);
    try {
      const member = await collaborationService.current.updateMemberRole(workspaceId, userId, role);
      setMembers(prev => prev.map(m => m.user_id === userId ? member : m));
      return member;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update member role';
      setError(message);
      throw err;
    }
  }, []);

  // Sharing
  const loadSharedTranscripts = useCallback(async (workspaceId: string) => {
    setError(null);
    setIsLoadingShares(true);
    try {
      const data = await collaborationService.current.getSharedTranscripts(workspaceId);
      setSharedTranscripts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load shared transcripts';
      setError(message);
      console.error('Failed to load shared transcripts:', err);
    } finally {
      setIsLoadingShares(false);
    }
  }, []);

  const shareTranscript = useCallback(async (transcriptId: string, workspaceId: string, permissions: Permissions) => {
    setError(null);
    try {
      const share = await collaborationService.current.shareTranscript(transcriptId, workspaceId, permissions);
      setSharedTranscripts(prev => [share, ...prev]);
      return share;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to share transcript';
      setError(message);
      throw err;
    }
  }, []);

  const unshareTranscript = useCallback(async (transcriptId: string, workspaceId: string) => {
    setError(null);
    try {
      await collaborationService.current.unshareTranscript(transcriptId, workspaceId);
      setSharedTranscripts(prev => prev.filter(s => !(s.transcript_id === transcriptId && s.workspace_id === workspaceId)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unshare transcript';
      setError(message);
      throw err;
    }
  }, []);

  const updateSharePermissions = useCallback(async (transcriptId: string, workspaceId: string, permissions: Permissions) => {
    setError(null);
    try {
      const share = await collaborationService.current.updateSharePermissions(transcriptId, workspaceId, permissions);
      setSharedTranscripts(prev => prev.map(s => 
        s.transcript_id === transcriptId && s.workspace_id === workspaceId ? share : s
      ));
      return share;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update permissions';
      setError(message);
      throw err;
    }
  }, []);

  // Comments - will be added in next chunk
  const loadComments = useCallback(async (transcriptId: string) => {
    setError(null);
    setIsLoadingComments(true);
    try {
      const data = await collaborationService.current.getComments(transcriptId);
      setComments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load comments';
      setError(message);
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  const addComment = useCallback(async (transcriptId: string, content: string, timestamp?: number, parentId?: string) => {
    setError(null);
    try {
      const comment = await collaborationService.current.addComment(transcriptId, content, timestamp, parentId);
      // Reload comments to get updated tree
      await loadComments(transcriptId);
      return comment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add comment';
      setError(message);
      throw err;
    }
  }, [loadComments]);

  const editComment = useCallback(async (commentId: string, content: string) => {
    setError(null);
    try {
      const comment = await collaborationService.current.editComment(commentId, content);
      // Update comment in state
      const updateCommentInTree = (comments: Comment[]): Comment[] => {
        return comments.map(c => {
          if (c.id === commentId) {
            return { ...c, content };
          }
          if (c.replies) {
            return { ...c, replies: updateCommentInTree(c.replies) };
          }
          return c;
        });
      };
      setComments(prev => updateCommentInTree(prev));
      return comment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to edit comment';
      setError(message);
      throw err;
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    setError(null);
    try {
      await collaborationService.current.deleteComment(commentId);
      // Remove comment from state
      const removeCommentFromTree = (comments: Comment[]): Comment[] => {
        return comments.filter(c => c.id !== commentId).map(c => {
          if (c.replies) {
            return { ...c, replies: removeCommentFromTree(c.replies) };
          }
          return c;
        });
      };
      setComments(prev => removeCommentFromTree(prev));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete comment';
      setError(message);
      throw err;
    }
  }, []);

  // Annotations, Notifications, Activity - will continue in the file
  const loadAnnotations = useCallback(async (transcriptId: string) => {
    setError(null);
    setIsLoadingAnnotations(true);
    try {
      const data = await collaborationService.current.getAnnotations(transcriptId);
      setAnnotations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load annotations';
      setError(message);
    } finally {
      setIsLoadingAnnotations(false);
    }
  }, []);

  const addAnnotation = useCallback(async (transcriptId: string, startTime: number, endTime: number, content: string, color?: string) => {
    setError(null);
    try {
      const annotation = await collaborationService.current.addAnnotation(transcriptId, startTime, endTime, content, color);
      setAnnotations(prev => [...prev, annotation]);
      return annotation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add annotation';
      setError(message);
      throw err;
    }
  }, []);

  const editAnnotation = useCallback(async (annotationId: string, content: string) => {
    setError(null);
    try {
      const annotation = await collaborationService.current.editAnnotation(annotationId, content);
      setAnnotations(prev => prev.map(a => a.id === annotationId ? annotation : a));
      return annotation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to edit annotation';
      setError(message);
      throw err;
    }
  }, []);

  const deleteAnnotation = useCallback(async (annotationId: string) => {
    setError(null);
    try {
      await collaborationService.current.deleteAnnotation(annotationId);
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete annotation';
      setError(message);
      throw err;
    }
  }, []);

  // Notifications
  const loadNotifications = useCallback(async () => {
    setError(null);
    setIsLoadingNotifications(true);
    try {
      const data = await collaborationService.current.getNotifications();
      setNotifications(data);
      const count = await collaborationService.current.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(message);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    setError(null);
    try {
      await collaborationService.current.markNotificationRead(notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(message);
      throw err;
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setError(null);
    try {
      await collaborationService.current.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      setError(message);
      throw err;
    }
  }, []);

  // Activity
  const loadActivity = useCallback(async (workspaceId: string, limit?: number) => {
    setError(null);
    setIsLoadingActivity(true);
    try {
      const data = await collaborationService.current.getActivity(workspaceId, limit);
      setActivity(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load activity';
      setError(message);
    } finally {
      setIsLoadingActivity(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load notifications
  useEffect(() => {
    if (autoLoadNotifications) {
      loadNotifications();
      const interval = setInterval(loadNotifications, notificationPollingInterval);
      return () => clearInterval(interval);
    }
  }, [autoLoadNotifications, notificationPollingInterval, loadNotifications]);

  return {
    workspaces,
    currentWorkspace,
    loadWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    selectWorkspace,
    isLoadingWorkspaces,
    members,
    loadMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
    isLoadingMembers,
    sharedTranscripts,
    loadSharedTranscripts,
    shareTranscript,
    unshareTranscript,
    updateSharePermissions,
    isLoadingShares,
    comments,
    loadComments,
    addComment,
    editComment,
    deleteComment,
    isLoadingComments,
    annotations,
    loadAnnotations,
    addAnnotation,
    editAnnotation,
    deleteAnnotation,
    isLoadingAnnotations,
    notifications,
    unreadCount,
    loadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    isLoadingNotifications,
    activity,
    loadActivity,
    isLoadingActivity,
    error,
    clearError,
  };
}

