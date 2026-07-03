/**
 * Settings Page
 * User preferences and application configuration
 */

import React, { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Lock,
  Globe,
  Mic,
  Monitor,
  Moon,
  Sun,
  Save,
  CheckCircle,
  ChevronRight,
  Shield,
  Key,
  Smartphone,
  Mail,
  Volume2,
} from 'lucide-react';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
}

const sections: SettingsSection[] = [
  {
    id: 'profile',
    title: 'Profile',
    icon: User,
    description: 'Personal information and account details',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Email, push, and in-app notification preferences',
  },
  {
    id: 'audio',
    title: 'Audio & Recording',
    icon: Mic,
    description: 'Recording quality, input devices, and audio settings',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Monitor,
    description: 'Theme, display, and accessibility options',
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: Lock,
    description: 'Data privacy, security settings, and permissions',
  },
  {
    id: 'language',
    title: 'Language & Region',
    icon: Globe,
    description: 'Language preferences and regional settings',
  },
];

const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  const [settings, setSettings] = useState({
    // Profile
    name: 'John Smith',
    email: 'john@example.com',
    title: 'Healthcare Professional',
    organization: 'City Medical Center',

    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    transcriptionComplete: true,
    weeklyDigest: false,
    productUpdates: true,

    // Audio
    inputDevice: 'default',
    audioQuality: 'high',
    noiseReduction: true,
    autoGainControl: true,
    echoCancellation: true,

    // Appearance
    theme: 'system',
    fontSize: 'medium',
    compactMode: false,

    // Privacy
    dataRetention: '1year',
    shareAnalytics: true,
    twoFactorEnabled: false,

    // Language
    language: 'en',
    region: 'US',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  });

  const handleSave = async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const updateSetting = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '24px',
              }}
            >
              Profile Settings
            </h3>
            <div style={{ display: 'grid', gap: '20px' }}>
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
                  Full Name
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => updateSetting('name', e.target.value)}
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
                  Email Address
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => updateSetting('email', e.target.value)}
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
                  Job Title
                </label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => updateSetting('title', e.target.value)}
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
                  Organization
                </label>
                <input
                  type="text"
                  value={settings.organization}
                  onChange={(e) =>
                    updateSetting('organization', e.target.value)
                  }
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
        );

      case 'notifications':
        return (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '24px',
              }}
            >
              Notification Preferences
            </h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {[
                {
                  key: 'emailNotifications',
                  label: 'Email Notifications',
                  desc: 'Receive important updates via email',
                },
                {
                  key: 'pushNotifications',
                  label: 'Push Notifications',
                  desc: 'Browser and mobile push notifications',
                },
                {
                  key: 'transcriptionComplete',
                  label: 'Transcription Complete',
                  desc: 'Notify when transcriptions finish',
                },
                {
                  key: 'weeklyDigest',
                  label: 'Weekly Digest',
                  desc: 'Summary of your activity each week',
                },
                {
                  key: 'productUpdates',
                  label: 'Product Updates',
                  desc: 'New features and improvements',
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1f2937',
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {desc}
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting(key, !(settings as any)[key])}
                    style={{
                      width: '48px',
                      height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      background: (settings as any)[key]
                        ? '#4f46e5'
                        : '#e5e7eb',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: '3px',
                        left: (settings as any)[key] ? '23px' : '3px',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'audio':
        return (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '24px',
              }}
            >
              Audio & Recording Settings
            </h3>
            <div style={{ display: 'grid', gap: '20px' }}>
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
                  Input Device
                </label>
                <select
                  value={settings.inputDevice}
                  onChange={(e) => updateSetting('inputDevice', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                >
                  <option value="default">System Default</option>
                  <option value="mic1">Built-in Microphone</option>
                  <option value="mic2">External USB Microphone</option>
                </select>
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
                  Audio Quality
                </label>
                <select
                  value={settings.audioQuality}
                  onChange={(e) =>
                    updateSetting('audioQuality', e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                >
                  <option value="low">Low (faster processing)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (best accuracy)</option>
                </select>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {[
                  { key: 'noiseReduction', label: 'Noise Reduction' },
                  { key: 'autoGainControl', label: 'Auto Gain Control' },
                  { key: 'echoCancellation', label: 'Echo Cancellation' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '14px',
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(settings as any)[key]}
                      onChange={(e) => updateSetting(key, e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '24px',
              }}
            >
              Appearance Settings
            </h3>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    display: 'block',
                    marginBottom: '10px',
                  }}
                >
                  Theme
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Monitor },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => updateSetting('theme', value)}
                      style={{
                        flex: 1,
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        border:
                          settings.theme === value
                            ? '2px solid #4f46e5'
                            : '1px solid #e5e7eb',
                        borderRadius: '10px',
                        background:
                          settings.theme === value ? '#f0f9ff' : 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon
                        size={24}
                        color={settings.theme === value ? '#4f46e5' : '#6b7280'}
                      />
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color:
                            settings.theme === value ? '#4f46e5' : '#374151',
                        }}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
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
                  Font Size
                </label>
                <select
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) =>
                    updateSetting('compactMode', e.target.checked)
                  }
                  style={{ width: '18px', height: '18px' }}
                />
                Compact Mode (reduce spacing)
              </label>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '24px',
              }}
            >
              Privacy & Security
            </h3>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div
                style={{
                  padding: '16px',
                  background: '#fef2f2',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Shield size={24} color="#dc2626" />
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#991b1b',
                    }}
                  >
                    Two-Factor Authentication
                  </div>
                  <div style={{ fontSize: '12px', color: '#b91c1c' }}>
                    {settings.twoFactorEnabled
                      ? 'Enabled'
                      : 'Not enabled - Recommended for security'}
                  </div>
                </div>
                <button
                  style={{
                    marginLeft: 'auto',
                    padding: '8px 16px',
                    background: settings.twoFactorEnabled
                      ? '#f3f4f6'
                      : '#dc2626',
                    color: settings.twoFactorEnabled ? '#374151' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  {settings.twoFactorEnabled ? 'Manage' : 'Enable'}
                </button>
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
                  Data Retention
                </label>
                <select
                  value={settings.dataRetention}
                  onChange={(e) =>
                    updateSetting('dataRetention', e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                >
                  <option value="30days">30 days</option>
                  <option value="90days">90 days</option>
                  <option value="1year">1 year</option>
                  <option value="forever">Forever</option>
                </select>
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.shareAnalytics}
                  onChange={(e) =>
                    updateSetting('shareAnalytics', e.target.checked)
                  }
                  style={{ width: '18px', height: '18px' }}
                />
                Share anonymous usage analytics to improve the service
              </label>
              <button
                style={{
                  padding: '12px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Download My Data
              </button>
            </div>
          </div>
        );

      case 'language':
        return (
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '24px',
              }}
            >
              Language & Region
            </h3>
            <div style={{ display: 'grid', gap: '20px' }}>
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
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="zh">中文</option>
                </select>
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
                  Region
                </label>
                <select
                  value={settings.region}
                  onChange={(e) => updateSetting('region', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                >
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="EU">Europe</option>
                </select>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
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
                    Date Format
                  </label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) =>
                      updateSetting('dateFormat', e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'white',
                    }}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
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
                    Time Format
                  </label>
                  <select
                    value={settings.timeFormat}
                    onChange={(e) =>
                      updateSetting('timeFormat', e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'white',
                    }}
                  >
                    <option value="12h">12-hour (AM/PM)</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
          color: 'white',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <Settings size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Settings</h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Manage your account and application preferences
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: '24px',
          }}
        >
          {/* Sidebar */}
          <div>
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: 'none',
                      borderBottom: '1px solid #f3f4f6',
                      background:
                        activeSection === section.id ? '#f0f9ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Icon
                      size={20}
                      color={
                        activeSection === section.id ? '#4f46e5' : '#6b7280'
                      }
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight:
                            activeSection === section.id ? '600' : '500',
                          color:
                            activeSection === section.id
                              ? '#4f46e5'
                              : '#1f2937',
                        }}
                      >
                        {section.title}
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      color={
                        activeSection === section.id ? '#4f46e5' : '#d1d5db'
                      }
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '16px',
              }}
            >
              {renderSectionContent()}
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
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
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
