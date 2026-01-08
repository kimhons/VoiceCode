/**
 * Trust Badges Component
 * Display security, compliance, and payment trust indicators
 */

import React from 'react';
import { Shield, Lock, CheckCircle, Award, CreditCard } from 'lucide-react';

interface TrustBadgesProps {
  isMobile?: boolean;
  colors?: any;
  spacing?: any;
  typography?: any;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ isMobile, colors, spacing, typography }) => {
  const badges = [
    {
      icon: Shield,
      title: 'GDPR Compliant',
      description: 'EU data protection',
      color: '#10b981',
    },
    {
      icon: Lock,
      title: 'SSL Encrypted',
      description: '256-bit encryption',
      color: '#667eea',
    },
    {
      icon: CheckCircle,
      title: 'HIPAA Compliant',
      description: 'Healthcare ready',
      color: '#3b82f6',
    },
    {
      icon: Award,
      title: 'SOC 2 Type II',
      description: 'Security certified',
      color: '#f59e0b',
    },
  ];

  const paymentMethods = [
    { name: 'Visa', emoji: '💳' },
    { name: 'Mastercard', emoji: '💳' },
    { name: 'American Express', emoji: '💳' },
    { name: 'PayPal', emoji: '🅿️' },
    { name: 'Apple Pay', emoji: '🍎' },
    { name: 'Google Pay', emoji: 'G' },
  ];

  return (
    <div style={{
      backgroundColor: colors?.surface || '#ffffff',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      borderTop: `1px solid ${colors?.border || '#e5e7eb'}`,
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Security Badges */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{
            fontSize: typography?.fontSize?.lg || '1.125rem',
            fontWeight: typography?.fontWeight?.bold || 700,
            color: colors?.text || '#111827',
            textAlign: 'center',
            marginBottom: spacing?.xl || '2rem',
          }}>
            Enterprise-Grade Security & Compliance
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: spacing?.lg || '1.5rem',
          }}>
            {badges.map((badge, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: colors?.background || '#f9fafb',
                  borderRadius: spacing?.md || '0.75rem',
                  padding: spacing?.lg || '1.5rem',
                  textAlign: 'center',
                  border: `2px solid ${colors?.border || '#e5e7eb'}`,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = badge.color;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors?.border || '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: `${badge.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  marginBottom: spacing?.sm || '0.75rem',
                }}>
                  <badge.icon className="w-6 h-6" style={{ color: badge.color }} />
                </div>
                <div style={{
                  fontSize: typography?.fontSize?.base || '1rem',
                  fontWeight: typography?.fontWeight?.bold || 700,
                  color: colors?.text || '#111827',
                  marginBottom: spacing?.xs || '0.5rem',
                }}>
                  {badge.title}
                </div>
                <div style={{
                  fontSize: typography?.fontSize?.sm || '0.875rem',
                  color: colors?.textSecondary || '#6b7280',
                }}>
                  {badge.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Money-Back Guarantee */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: spacing?.lg || '0.75rem',
          padding: isMobile ? '2rem 1.5rem' : '2.5rem 3rem',
          textAlign: 'center',
          marginBottom: '3rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-50%',
            left: '-10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              marginBottom: spacing?.md || '1rem',
            }}>
              <CheckCircle className="w-8 h-8" style={{ color: '#ffffff' }} />
            </div>
            <h3 style={{
              fontSize: isMobile ? typography?.fontSize?.xl || '1.25rem' : typography?.fontSize?.['2xl'] || '1.5rem',
              fontWeight: typography?.fontWeight?.bold || 700,
              color: '#ffffff',
              marginBottom: spacing?.sm || '0.75rem',
            }}>
              30-Day Money-Back Guarantee
            </h3>
            <p style={{
              fontSize: typography?.fontSize?.base || '1rem',
              color: 'rgba(255, 255, 255, 0.95)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              Try VoiceFlow Pro risk-free. If you're not completely satisfied within 30 days, we'll refund your money—no questions asked.
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h3 style={{
            fontSize: typography?.fontSize?.base || '1rem',
            fontWeight: typography?.fontWeight?.semibold || 600,
            color: colors?.textSecondary || '#6b7280',
            textAlign: 'center',
            marginBottom: spacing?.md || '1rem',
          }}>
            Secure Payment Methods
          </h3>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? '1rem' : '1.5rem',
            flexWrap: 'wrap',
          }}>
            {paymentMethods.map((method, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  backgroundColor: colors?.background || '#f9fafb',
                  borderRadius: spacing?.md || '0.75rem',
                  border: `1px solid ${colors?.border || '#e5e7eb'}`,
                  fontSize: typography?.fontSize?.sm || '0.875rem',
                  color: colors?.textSecondary || '#6b7280',
                  fontWeight: typography?.fontWeight?.medium || 500,
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{method.emoji}</span>
                {!isMobile && method.name}
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: spacing?.lg || '1.5rem',
          }}>
            <CreditCard className="w-4 h-4" style={{ color: colors?.textSecondary || '#6b7280' }} />
            <p style={{
              fontSize: typography?.fontSize?.xs || '0.75rem',
              color: colors?.textSecondary || '#6b7280',
              margin: 0,
            }}>
              All transactions are secure and encrypted
            </p>
          </div>
        </div>

        {/* Additional Trust Indicators */}
        <div style={{
          marginTop: '3rem',
          paddingTop: '2rem',
          borderTop: `1px solid ${colors?.border || '#e5e7eb'}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isMobile ? '1.5rem' : '3rem',
          flexWrap: 'wrap',
          fontSize: typography?.fontSize?.sm || '0.875rem',
          color: colors?.textSecondary || '#6b7280',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
            <span>No credit card required</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
            <span>Cancel anytime</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
            <span>24/7 support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;

