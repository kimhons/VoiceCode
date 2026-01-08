/**
 * Collaboration Demo Component
 * Phase 3.4: Collaboration Features
 * 
 * Demonstrates collaboration features
 */

import React, { useState, useEffect } from 'react';
import { useCollaboration } from '../hooks/useCollaboration';

export const CollaborationDemo: React.FC = () => {
  const {
    workspaces,
    currentWorkspace,
    loadWorkspaces,
    createWorkspace,
    selectWorkspace,
    isLoadingWorkspaces,
    members,
    loadMembers,
    inviteMember,
    removeMember,
    isLoadingMembers,
    comments,
    loadComments,
    addComment,
    deleteComment,
    isLoadingComments,
    annotations,
    loadAnnotations,
    addAnnotation,
    deleteAnnotation,
    isLoadingAnnotations,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    isLoadingNotifications,
    error,
    clearError,
  } = useCollaboration({ autoLoadNotifications: true });

  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [newAnnotationContent, setNewAnnotationContent] = useState('');
  const [activeTab, setActiveTab] = useState<'workspaces' | 'comments' | 'annotations' | 'notifications'>('workspaces');

  // Sample transcript ID for demo
  const sampleTranscriptId = 'demo-transcript-1';

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (currentWorkspace) {
      loadMembers(currentWorkspace.id);
    }
  }, [currentWorkspace, loadMembers]);

  const handleCreateWorkspace = async () => {
    if (newWorkspaceName.trim()) {
      try {
        const workspace = await createWorkspace(newWorkspaceName, 'Demo workspace');
        selectWorkspace(workspace);
        setNewWorkspaceName('');
      } catch (err) {
        console.error('Failed to create workspace:', err);
      }
    }
  };

  const handleInviteMember = async () => {
    if (currentWorkspace && newMemberEmail.trim()) {
      try {
        await inviteMember(currentWorkspace.id, newMemberEmail, 'member');
        setNewMemberEmail('');
      } catch (err) {
        console.error('Failed to invite member:', err);
      }
    }
  };

  const handleAddComment = async () => {
    if (newCommentContent.trim()) {
      try {
        await addComment(sampleTranscriptId, newCommentContent);
        setNewCommentContent('');
      } catch (err) {
        console.error('Failed to add comment:', err);
      }
    }
  };

  const handleAddAnnotation = async () => {
    if (newAnnotationContent.trim()) {
      try {
        await addAnnotation(sampleTranscriptId, 10, 20, newAnnotationContent);
        setNewAnnotationContent('');
      } catch (err) {
        console.error('Failed to add annotation:', err);
      }
    }
  };

  const renderWorkspaces = () => (
    <div>
      <h3>👥 Workspaces</h3>
      
      {/* Create Workspace */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
      }}>
        <h4>Create Workspace</h4>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="Workspace name..."
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '5px',
            }}
          />
          <button
            onClick={handleCreateWorkspace}
            disabled={!newWorkspaceName.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: newWorkspaceName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Create
          </button>
        </div>
      </div>

      {/* Workspace List */}
      <div>
        <h4>Your Workspaces ({workspaces.length})</h4>
        {isLoadingWorkspaces ? (
          <p>Loading workspaces...</p>
        ) : workspaces.length === 0 ? (
          <p style={{ color: '#666' }}>No workspaces yet. Create one above!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {workspaces.map(workspace => (
              <div
                key={workspace.id}
                onClick={() => selectWorkspace(workspace)}
                style={{
                  padding: '15px',
                  backgroundColor: currentWorkspace?.id === workspace.id ? '#e7f3ff' : '#fff',
                  border: `2px solid ${currentWorkspace?.id === workspace.id ? '#007bff' : '#ddd'}`,
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{workspace.name}</div>
                {workspace.description && (
                  <div style={{ fontSize: '14px', color: '#666' }}>{workspace.description}</div>
                )}
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  Created {new Date(workspace.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members */}
      {currentWorkspace && (
        <div style={{ marginTop: '30px' }}>
          <h4>Members</h4>
          
          {/* Invite Member */}
          <div style={{
            padding: '15px',
            marginBottom: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
          }}>
            <h5>Invite Member</h5>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Email address..."
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                }}
              />
              <button
                onClick={handleInviteMember}
                disabled={!newMemberEmail.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: newMemberEmail.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Invite
              </button>
            </div>
          </div>

          {/* Member List */}
          {isLoadingMembers ? (
            <p>Loading members...</p>
          ) : members.length === 0 ? (
            <p style={{ color: '#666' }}>No members yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map(member => (
                <div
                  key={member.id}
                  style={{
                    padding: '12px',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {member.user?.full_name || member.user?.email || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {member.role} • Joined {new Date(member.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => removeMember(currentWorkspace.id, member.user_id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderComments = () => (
    <div>
      <h3>💬 Comments</h3>
      
      {/* Add Comment */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
      }}>
        <h4>Add Comment</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              resize: 'vertical',
            }}
          />
          <button
            onClick={handleAddComment}
            disabled={!newCommentContent.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: newCommentContent.trim() ? 'pointer' : 'not-allowed',
              alignSelf: 'flex-start',
            }}
          >
            Add Comment
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div>
        <h4>Comments ({comments.length})</h4>
        <button
          onClick={() => loadComments(sampleTranscriptId)}
          disabled={isLoadingComments}
          style={{
            padding: '8px 16px',
            marginBottom: '15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoadingComments ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoadingComments ? 'Loading...' : 'Load Comments'}
        </button>

        {comments.length === 0 ? (
          <p style={{ color: '#666' }}>No comments yet. Add one above!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {comments.map(comment => (
              <div
                key={comment.id}
                style={{
                  padding: '15px',
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {comment.user?.full_name || comment.user?.email || 'Unknown'}
                  </div>
                  <button
                    onClick={() => deleteComment(comment.id)}
                    style={{
                      padding: '3px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ marginBottom: '8px' }}>{comment.content}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {new Date(comment.created_at).toLocaleString()}
                  {comment.timestamp !== undefined && ` • @${comment.timestamp}s`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAnnotations = () => (
    <div>
      <h3>📝 Annotations</h3>
      
      {/* Add Annotation */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
      }}>
        <h4>Add Annotation</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            value={newAnnotationContent}
            onChange={(e) => setNewAnnotationContent(e.target.value)}
            placeholder="Write an annotation..."
            rows={2}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              resize: 'vertical',
            }}
          />
          <div style={{ fontSize: '12px', color: '#666' }}>
            Time range: 10s - 20s (demo)
          </div>
          <button
            onClick={handleAddAnnotation}
            disabled={!newAnnotationContent.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '5px',
              cursor: newAnnotationContent.trim() ? 'pointer' : 'not-allowed',
              alignSelf: 'flex-start',
            }}
          >
            Add Annotation
          </button>
        </div>
      </div>

      {/* Annotations List */}
      <div>
        <h4>Annotations ({annotations.length})</h4>
        <button
          onClick={() => loadAnnotations(sampleTranscriptId)}
          disabled={isLoadingAnnotations}
          style={{
            padding: '8px 16px',
            marginBottom: '15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoadingAnnotations ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoadingAnnotations ? 'Loading...' : 'Load Annotations'}
        </button>

        {annotations.length === 0 ? (
          <p style={{ color: '#666' }}>No annotations yet. Add one above!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {annotations.map(annotation => (
              <div
                key={annotation.id}
                style={{
                  padding: '15px',
                  backgroundColor: '#fff',
                  border: `3px solid ${annotation.color}`,
                  borderRadius: '5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {annotation.user?.full_name || annotation.user?.email || 'Unknown'}
                  </div>
                  <button
                    onClick={() => deleteAnnotation(annotation.id)}
                    style={{
                      padding: '3px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ marginBottom: '8px' }}>{annotation.content}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {annotation.start_time}s - {annotation.end_time}s •{' '}
                  {new Date(annotation.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>
          🔔 Notifications
          {unreadCount > 0 && (
            <span style={{
              marginLeft: '10px',
              padding: '3px 8px',
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '12px',
              fontSize: '14px',
            }}>
              {unreadCount}
            </span>
          )}
        </h3>
        {notifications.length > 0 && (
          <button
            onClick={markAllNotificationsRead}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Mark All Read
          </button>
        )}
      </div>

      {isLoadingNotifications ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p style={{ color: '#666' }}>No notifications yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => !notification.is_read && markNotificationRead(notification.id)}
              style={{
                padding: '15px',
                backgroundColor: notification.is_read ? '#fff' : '#e7f3ff',
                border: `2px solid ${notification.is_read ? '#ddd' : '#007bff'}`,
                borderRadius: '5px',
                cursor: notification.is_read ? 'default' : 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold' }}>{notification.title}</div>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  borderRadius: '3px',
                  fontSize: '12px',
                }}>
                  {notification.type}
                </span>
              </div>
              <div style={{ marginBottom: '8px' }}>{notification.message}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {new Date(notification.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>👥 Collaboration Features Demo</h1>

      {/* Info */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '5px',
      }}>
        <h3>✨ Features</h3>
        <ul style={{ marginBottom: 0 }}>
          <li><strong>👥 Workspaces:</strong> Create and manage team workspaces</li>
          <li><strong>🔗 Sharing:</strong> Share transcripts with permissions</li>
          <li><strong>💬 Comments:</strong> Add threaded comments to transcripts</li>
          <li><strong>📝 Annotations:</strong> Highlight and annotate transcript sections</li>
          <li><strong>🔔 Notifications:</strong> Real-time notifications for team activity</li>
        </ul>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          color: '#721c24',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span><strong>Error:</strong> {error}</span>
          <button
            onClick={clearError}
            style={{
              padding: '5px 10px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '2px solid #ddd',
      }}>
        {(['workspaces', 'comments', 'annotations', 'notifications'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: `3px solid ${activeTab === tab ? '#007bff' : 'transparent'}`,
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              color: activeTab === tab ? '#007bff' : '#666',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '5px',
      }}>
        {activeTab === 'workspaces' && renderWorkspaces()}
        {activeTab === 'comments' && renderComments()}
        {activeTab === 'annotations' && renderAnnotations()}
        {activeTab === 'notifications' && renderNotifications()}
      </div>
    </div>
  );
};

export default CollaborationDemo;

