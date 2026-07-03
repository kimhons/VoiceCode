/**
 * Team Management Page
 * Manage team members, roles, and permissions
 */

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Settings,
  Shield,
  Mail,
  MoreVertical,
  Search,
  Filter,
  Check,
  X,
  Edit3,
  Trash2,
  Crown,
  User,
  Clock,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  avatar?: string;
  joinedDate: string;
  lastActive: string;
  transcriptionsCount: number;
}

const mockMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    joinedDate: '2025-06-15',
    lastActive: '2026-01-19',
    transcriptionsCount: 245,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'manager',
    status: 'active',
    joinedDate: '2025-08-20',
    lastActive: '2026-01-18',
    transcriptionsCount: 189,
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike@example.com',
    role: 'member',
    status: 'active',
    joinedDate: '2025-10-05',
    lastActive: '2026-01-19',
    transcriptionsCount: 156,
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@example.com',
    role: 'member',
    status: 'active',
    joinedDate: '2025-11-12',
    lastActive: '2026-01-17',
    transcriptionsCount: 98,
  },
  {
    id: '5',
    name: 'Alex Wilson',
    email: 'alex@example.com',
    role: 'viewer',
    status: 'pending',
    joinedDate: '2026-01-15',
    lastActive: '-',
    transcriptionsCount: 0,
  },
  {
    id: '6',
    name: 'Lisa Brown',
    email: 'lisa@example.com',
    role: 'member',
    status: 'inactive',
    joinedDate: '2025-07-01',
    lastActive: '2025-12-20',
    transcriptionsCount: 67,
  },
];

const TeamManagementPage: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>(mockMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('member');

  const roleConfig = {
    admin: { label: 'Admin', color: '#8b5cf6', icon: Crown },
    manager: { label: 'Manager', color: '#3b82f6', icon: Shield },
    member: { label: 'Member', color: '#10b981', icon: User },
    viewer: { label: 'Viewer', color: '#6b7280', icon: User },
  };

  const statusConfig = {
    active: { label: 'Active', color: '#10b981' },
    pending: { label: 'Pending', color: '#f59e0b' },
    inactive: { label: 'Inactive', color: '#6b7280' },
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || member.role === filterRole;
    const matchesStatus = !filterStatus || member.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'pending',
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: '-',
      transcriptionsCount: 0,
    };

    setMembers([...members, newMember]);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const updateRole = (id: string, role: TeamMember['role']) => {
    setMembers(members.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  const removeMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === 'active').length,
    pending: members.filter((m) => m.status === 'pending').length,
    admins: members.filter((m) => m.role === 'admin').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}
              >
                <Users size={32} />
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
                  Team Management
                </h1>
              </div>
              <p style={{ fontSize: '15px', opacity: 0.9 }}>
                Manage team members, roles, and permissions
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <UserPlus size={18} /> Invite Member
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '4px',
              }}
            >
              Total Members
            </div>
            <div
              style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937' }}
            >
              {stats.total}
            </div>
          </div>
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '4px',
              }}
            >
              Active
            </div>
            <div
              style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}
            >
              {stats.active}
            </div>
          </div>
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '4px',
              }}
            >
              Pending Invites
            </div>
            <div
              style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}
            >
              {stats.pending}
            </div>
          </div>
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '4px',
              }}
            >
              Admins
            </div>
            <div
              style={{ fontSize: '28px', fontWeight: '700', color: '#8b5cf6' }}
            >
              {stats.admins}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <select
            value={filterRole || ''}
            onChange={(e) => setFilterRole(e.target.value || null)}
            style={{
              padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
              background: 'white',
            }}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>

          <select
            value={filterStatus || ''}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            style={{
              padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
              background: 'white',
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Members Table */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  background: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}
                >
                  Member
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}
                >
                  Role
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}
                >
                  Transcriptions
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}
                >
                  Last Active
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const RoleIcon = roleConfig[member.role].icon;
                return (
                  <tr
                    key={member.id}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: `${roleConfig[member.role].color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: roleConfig[member.role].color,
                            fontWeight: '600',
                            fontSize: '14px',
                          }}
                        >
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#1f2937',
                            }}
                          >
                            {member.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={member.role}
                        onChange={(e) =>
                          updateRole(
                            member.id,
                            e.target.value as TeamMember['role']
                          )
                        }
                        style={{
                          padding: '6px 10px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: `${roleConfig[member.role].color}15`,
                          color: roleConfig[member.role].color,
                          cursor: 'pointer',
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          background: `${statusConfig[member.status].color}15`,
                          color: statusConfig[member.status].color,
                        }}
                      >
                        {statusConfig[member.status].label}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        fontSize: '13px',
                        color: '#6b7280',
                      }}
                    >
                      {member.transcriptionsCount}
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        fontSize: '13px',
                        color: '#6b7280',
                      }}
                    >
                      {member.lastActive}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '4px',
                        }}
                      >
                        <button
                          style={{
                            padding: '6px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Mail size={16} color="#6b7280" />
                        </button>
                        <button
                          onClick={() => removeMember(member.id)}
                          style={{
                            padding: '6px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '400px',
              maxWidth: '90%',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '20px',
              }}
            >
              Invite Team Member
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as TeamMember['role'])
                }
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagementPage;
