/**
 * Profile Page
 * User profile and account management
 */

import React, { useState, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Camera,
  Save,
  Shield,
  Key,
  LogOut,
  Trash2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@hospital.org',
    phone: '+1 (555) 123-4567',
    title: 'Senior Physician',
    department: 'Internal Medicine',
    organization: 'City Medical Center',
    location: 'New York, NY',
    bio: 'Board-certified internist with 15+ years of experience in primary care and hospital medicine.',
    timezone: 'America/New_York',
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, []);

  const updateProfile = (key: string, value: string) => {
    setProfile({ ...profile, [key]: value });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: '700',
                  border: '4px solid white',
                }}
              >
                {profile.firstName[0]}
                {profile.lastName[0]}
              </div>
              <button
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <Camera size={16} color="#4f46e5" />
              </button>
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
                {profile.firstName} {profile.lastName}
              </h1>
              <p style={{ fontSize: '16px', opacity: 0.9 }}>{profile.title}</p>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>
                {profile.organization}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        {/* Personal Information */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <User size={18} /> Personal Information
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                First Name
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => updateProfile('firstName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Last Name
              </label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => updateProfile('lastName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '6px',
                }}
              >
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => updateProfile('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '6px',
                }}
              >
                <Phone size={14} /> Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => updateProfile('phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Briefcase size={18} /> Professional Information
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Job Title
              </label>
              <input
                type="text"
                value={profile.title}
                onChange={(e) => updateProfile('title', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Department
              </label>
              <input
                type="text"
                value={profile.department}
                onChange={(e) => updateProfile('department', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '6px',
                }}
              >
                <Building size={14} /> Organization
              </label>
              <input
                type="text"
                value={profile.organization}
                onChange={(e) => updateProfile('organization', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '6px',
                }}
              >
                <MapPin size={14} /> Location
              </label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => updateProfile('location', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <label
              style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Bio
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => updateProfile('bio', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* Security */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Shield size={18} /> Security
          </h3>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Key size={20} color="#6b7280" />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1f2937',
                  }}
                >
                  Change Password
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Update your password regularly for security
                </div>
              </div>
            </button>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Shield size={20} color="#6b7280" />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1f2937',
                  }}
                >
                  Two-Factor Authentication
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Add an extra layer of security to your account
                </div>
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  background: '#dcfce7',
                  color: '#166534',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                }}
              >
                Enabled
              </span>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #fecaca',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#dc2626',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={18} /> Danger Zone
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} /> Sign Out All Devices
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={16} /> Delete Account
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 32px',
              background: saveStatus === 'saved' ? '#10b981' : '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {saveStatus === 'saving' ? (
              'Saving...'
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle size={18} /> Saved
              </>
            ) : (
              <>
                <Save size={18} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  padding: '12px',
                  background: '#fef2f2',
                  borderRadius: '50%',
                }}
              >
                <AlertTriangle size={24} color="#dc2626" />
              </div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1f2937',
                }}
              >
                Delete Account
              </h3>
            </div>
            <p
              style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '20px',
              }}
            >
              This action cannot be undone. All your data, including
              transcriptions, settings, and preferences will be permanently
              deleted.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
