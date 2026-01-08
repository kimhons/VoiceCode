/**
 * Live User Counter Component
 * Shows real-time user activity to create urgency and social proof
 */

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Activity } from 'lucide-react';

interface LiveUserCounterProps {
  isMobile?: boolean;
  colors?: any;
  spacing?: any;
  typography?: any;
}

export const LiveUserCounter: React.FC<LiveUserCounterProps> = ({
  isMobile,
  colors = {
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#1f2937',
    textSecondary: '#6b7280',
    primary: '#667eea',
    border: '#e5e7eb',
  },
  spacing = {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
  },
  typography = {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
}) => {
  const [activeUsers, setActiveUsers] = useState(1247);
  const [recentSignups, setRecentSignups] = useState<Array<{ name: string; time: string; location: string }>>([
    { name: 'Sarah M.', time: '2 min ago', location: 'New York, US' },
    { name: 'James K.', time: '5 min ago', location: 'London, UK' },
    { name: 'Maria G.', time: '8 min ago', location: 'Toronto, CA' },
  ]);

  // Simulate real-time user count changes
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers((prev) => {
        const change = Math.floor(Math.random() * 10) - 4; // Random change between -4 and +5
        return Math.max(1200, Math.min(1300, prev + change));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Simulate new signups
  useEffect(() => {
    const names = [
      'Alex T.', 'Emma W.', 'Michael R.', 'Sophia L.', 'David C.',
      'Olivia P.', 'Daniel M.', 'Isabella H.', 'Matthew B.', 'Ava S.',
    ];
    const locations = [
      'New York, US', 'London, UK', 'Toronto, CA', 'Sydney, AU',
      'Berlin, DE', 'Paris, FR', 'Tokyo, JP', 'Singapore, SG',
      'Mumbai, IN', 'São Paulo, BR',
    ];

    const interval = setInterval(() => {
      const newSignup = {
        name: names[Math.floor(Math.random() * names.length)],
        time: 'Just now',
        location: locations[Math.floor(Math.random() * locations.length)],
      };

      setRecentSignups((prev) => {
        const updated = [newSignup, ...prev.slice(0, 2)];
        // Update times
        return updated.map((signup, index) => ({
          ...signup,
          time: index === 0 ? 'Just now' : index === 1 ? '3 min ago' : '7 min ago',
        }));
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? spacing.md : spacing.lg,
      right: isMobile ? spacing.md : spacing.lg,
      zIndex: 1000,
      maxWidth: isMobile ? '280px' : '320px',
    }}>
      {/* Active Users Badge */}
      <div style={{
        backgroundColor: colors.background,
        borderRadius: spacing.lg,
        padding: spacing.md,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        border: `1px solid ${colors.border}`,
        marginBottom: spacing.md,
        animation: 'slideInRight 0.5s ease-out',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            position: 'relative',
          }}>
            <Activity className="w-5 h-5" />
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              border: '2px solid #ffffff',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
            }}>
              {activeUsers.toLocaleString()}
            </div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: colors.textSecondary,
            }}>
              users online now
            </div>
          </div>
          <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
        </div>
      </div>

      {/* Recent Signups */}
      <div style={{
        backgroundColor: colors.background,
        borderRadius: spacing.lg,
        padding: spacing.md,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        border: `1px solid ${colors.border}`,
        animation: 'slideInRight 0.5s ease-out 0.2s backwards',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.sm,
          paddingBottom: spacing.sm,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <Users className="w-4 h-4" style={{ color: colors.primary }} />
          <span style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text,
          }}>
            Recent Signups
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {recentSignups.map((signup, index) => (
            <div
              key={`${signup.name}-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.xs,
                borderRadius: spacing.sm,
                backgroundColor: index === 0 ? `${colors.primary}10` : 'transparent',
                animation: index === 0 ? 'fadeIn 0.5s ease-out' : 'none',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.bold,
              }}>
                {signup.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {signup.name}
                </div>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.textSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {signup.location}
                </div>
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: colors.textSecondary,
                whiteSpace: 'nowrap',
              }}>
                {signup.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default LiveUserCounter;

