// VoiceFlow Pro - Pricing Page Component
import React, { useState } from 'react';
import { Check, X, Zap, Users, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks';

type BillingCycle = 'monthly' | 'annual';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  limitations: string[];
  cta: string;
  popular?: boolean;
  icon: React.ReactNode;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free Forever',
    description: 'Perfect for trying out VoiceFlow Pro',
    price: { monthly: 0, annual: 0 },
    features: [
      '120 minutes/month transcription',
      '10 recordings/month',
      '5 minutes max per recording',
      '50+ languages',
      'Basic AI formatting',
      'Desktop + Mobile apps',
      'Export to TXT, PDF',
      'Speaker identification',
      'Community support',
    ],
    limitations: [
      'Limited to 3 professional modes',
      'No offline mode',
      'No cloud sync',
    ],
    cta: 'Get Started Free',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users who need unlimited transcription',
    price: { monthly: 7.99, annual: 6.99 },
    features: [
      'UNLIMITED transcription minutes',
      'UNLIMITED recordings',
      '60 minutes max per recording',
      '150+ languages',
      'Advanced AI processing (8 tones, 8 contexts)',
      'Offline mode (full functionality)',
      'Cloud sync (10GB storage)',
      'Export to DOCX, SRT, VTT',
      'Custom templates',
      'Advanced voice commands',
      'Priority email support',
      'Early access to new features',
    ],
    limitations: [],
    cta: 'Start Pro Trial',
    popular: true,
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For teams that need collaboration features',
    price: { monthly: 14.99, annual: 12.99 },
    features: [
      'Everything in Pro, PLUS:',
      'Shared workspaces',
      'Team collaboration tools',
      'Centralized billing',
      'Admin dashboard & analytics',
      'Team dictionary (shared terminology)',
      'Role-based permissions',
      'Cloud sync (50GB per user)',
      'Priority chat support',
      'Team training session (1 hour)',
    ],
    limitations: ['Minimum 3 users required'],
    cta: 'Start Team Trial',
    icon: <Users className="w-6 h-6" />,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For organizations with advanced needs',
    price: { monthly: 0, annual: 0 }, // Custom pricing
    features: [
      'Everything in Team, PLUS:',
      'Single Sign-On (SSO/SAML)',
      'On-premise deployment option',
      'HIPAA compliance',
      'SOC 2 Type II compliance',
      'Custom AI model training',
      'API access & webhooks',
      'Dedicated account manager',
      '24/7 phone support',
      'SLA guarantees (99.9% uptime)',
      'Custom integrations',
      'Audit logs & compliance reports',
      'Unlimited cloud storage',
      'White-label options',
    ],
    limitations: [],
    cta: 'Contact Sales',
    icon: <Building2 className="w-6 h-6" />,
  },
];

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const { colors, spacing, borderRadius, typography } = useTheme();
  const { isMobile, isTablet } = useResponsive();

  const getPrice = (tier: PricingTier) => {
    if (tier.id === 'enterprise') return 'Custom';
    const price = billingCycle === 'monthly' ? tier.price.monthly : tier.price.annual;
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  };

  const getSavings = (tier: PricingTier) => {
    if (tier.id === 'free' || tier.id === 'enterprise') return null;
    const monthlyCost = tier.price.monthly * 12;
    const annualCost = tier.price.annual * 12;
    const savings = monthlyCost - annualCost;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { amount: savings, percentage };
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.background,
      padding: isMobile ? spacing.lg : spacing['2xl'],
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        marginBottom: spacing['2xl'],
      }}>
        <h1 style={{
          fontSize: isMobile ? typography.fontSize['3xl'] : typography.fontSize['5xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text,
          marginBottom: spacing.md,
        }}>
          Simple, Transparent Pricing
        </h1>
        <p style={{
          fontSize: isMobile ? typography.fontSize.lg : typography.fontSize.xl,
          color: colors.textSecondary,
          marginBottom: spacing.xl,
        }}>
          Choose the plan that's right for you. All plans include a 14-day free trial.
        </p>

        {/* Billing Toggle */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.xs,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: borderRadius.full,
          border: `1px solid ${colors.border}`,
        }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              borderRadius: borderRadius.full,
              backgroundColor: billingCycle === 'monthly' ? colors.primary : 'transparent',
              color: billingCycle === 'monthly' ? '#ffffff' : colors.text,
              border: 'none',
              cursor: 'pointer',
              fontWeight: typography.fontWeight.medium,
              transition: 'all 0.2s ease',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              borderRadius: borderRadius.full,
              backgroundColor: billingCycle === 'annual' ? colors.primary : 'transparent',
              color: billingCycle === 'annual' ? '#ffffff' : colors.text,
              border: 'none',
              cursor: 'pointer',
              fontWeight: typography.fontWeight.medium,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            Annual
            <span style={{
              fontSize: typography.fontSize.xs,
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: `2px ${spacing.xs}`,
              borderRadius: borderRadius.small,
            }}>
              Save 13%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: spacing.xl,
      }}>
        {pricingTiers.map((tier) => {
          const savings = billingCycle === 'annual' ? getSavings(tier) : null;
          
          return (
            <div
              key={tier.id}
              style={{
                position: 'relative',
                backgroundColor: colors.backgroundSecondary,
                border: `2px solid ${tier.popular ? colors.primary : colors.border}`,
                borderRadius: borderRadius.large,
                padding: spacing.xl,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                boxShadow: tier.popular ? '0 10px 40px rgba(0, 0, 0, 0.1)' : 'none',
              }}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: colors.primary,
                  color: '#ffffff',
                  padding: `${spacing.xs} ${spacing.lg}`,
                  borderRadius: borderRadius.full,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.bold,
                }}>
                  MOST POPULAR
                </div>
              )}

              {/* Icon */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: borderRadius.medium,
                backgroundColor: tier.popular ? colors.primary : colors.border,
                color: tier.popular ? '#ffffff' : colors.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.md,
              }}>
                {tier.icon}
              </div>

              {/* Tier Name */}
              <h3 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.text,
                marginBottom: spacing.xs,
              }}>
                {tier.name}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: typography.fontSize.sm,
                color: colors.textSecondary,
                marginBottom: spacing.lg,
              }}>
                {tier.description}
              </p>

              {/* Price */}
              <div style={{ marginBottom: spacing.lg }}>
                <div style={{
                  fontSize: typography.fontSize['4xl'],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: spacing.xs,
                }}>
                  {getPrice(tier)}
                  {tier.id !== 'free' && tier.id !== 'enterprise' && (
                    <span style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.normal,
                      color: colors.textSecondary,
                    }}>
                      /{billingCycle === 'monthly' ? 'mo' : 'mo'}
                    </span>
                  )}
                </div>
                {savings && billingCycle === 'annual' && (
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    color: '#10b981',
                    marginTop: spacing.xs,
                  }}>
                    Save ${savings.amount.toFixed(2)}/year ({savings.percentage}% off)
                  </p>
                )}
                {tier.id !== 'free' && tier.id !== 'enterprise' && billingCycle === 'annual' && (
                  <p style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}>
                    Billed ${(tier.price.annual * 12).toFixed(2)} annually
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <button
                style={{
                  width: '100%',
                  padding: spacing.md,
                  borderRadius: borderRadius.medium,
                  backgroundColor: tier.popular ? colors.primary : colors.backgroundSecondary,
                  color: tier.popular ? '#ffffff' : colors.text,
                  border: tier.popular ? 'none' : `2px solid ${colors.border}`,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  marginBottom: spacing.xl,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Features */}
              <div style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {tier.features.map((feature, index) => (
                    <li
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: spacing.sm,
                        marginBottom: spacing.sm,
                        fontSize: typography.fontSize.sm,
                        color: colors.text,
                      }}
                    >
                      <Check className="w-5 h-5 flex-shrink-0" style={{ color: '#10b981' }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {tier.limitations.map((limitation, index) => (
                    <li
                      key={`limit-${index}`}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: spacing.sm,
                        marginBottom: spacing.sm,
                        fontSize: typography.fontSize.sm,
                        color: colors.textSecondary,
                      }}
                    >
                      <X className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* VSCode Extension Pricing Section */}
      <div style={{
        maxWidth: '1200px',
        margin: `${spacing['4xl']} auto`,
        padding: spacing['2xl'],
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        borderRadius: borderRadius.large,
        border: `2px solid ${colors.border}`,
      }}>
        <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.xs,
            backgroundColor: 'rgba(102, 126, 234, 0.2)',
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: '999px',
            marginBottom: spacing.md,
            border: '1px solid rgba(102, 126, 234, 0.3)',
          }}>
            <Sparkles className="w-4 h-4" style={{ color: '#667eea' }} />
            <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#667eea' }}>
              NEW: Voice-Controlled IDE
            </span>
          </div>
          <h2 style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text,
            marginBottom: spacing.md,
          }}>
            VoiceFlow VSCode Extension
          </h2>
          <p style={{
            fontSize: typography.fontSize.lg,
            color: colors.textSecondary,
            maxWidth: '700px',
            margin: '0 auto',
          }}>
            Code with your voice. The world's most advanced voice-controlled IDE extension.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: spacing.lg,
        }}>
          {/* VSCode Basic Tier */}
          <div style={{
            padding: spacing.xl,
            backgroundColor: colors.background,
            borderRadius: borderRadius.medium,
            border: `2px solid rgba(16, 185, 129, 0.3)`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.md,
            }}>
              <div style={{
                padding: spacing.sm,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: borderRadius.small,
              }}>
                <Sparkles className="w-6 h-6" style={{ color: '#10b981' }} />
              </div>
              <h3 style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: '#10b981',
              }}>
                BASIC
              </h3>
            </div>
            <div style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
              marginBottom: spacing.xs,
            }}>
              $6.99
              <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.normal, color: colors.textSecondary }}>
                /month
              </span>
            </div>
            <p style={{
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              marginBottom: spacing.lg,
            }}>
              7-day free trial
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
            }}>
              {[
                'Voice Recognition',
                '40+ Commands',
                'Wake Word Detection',
                'Walky-Talky Mode',
                'Interactive Chatbox',
                'Project Commands',
                'Visual Feedback',
                'Multi-Window Support',
                'Command History',
              ].map((feature, index) => (
                <li key={index} style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: spacing.xs,
                  fontSize: typography.fontSize.sm,
                  color: colors.text,
                }}>
                  <Check className="w-4 h-4" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* VSCode Pro Tier */}
          <div style={{
            padding: spacing.xl,
            backgroundColor: colors.background,
            borderRadius: borderRadius.medium,
            border: `2px solid rgba(255, 152, 0, 0.5)`,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: spacing.sm,
              right: spacing.sm,
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: '#ff9800',
              color: '#ffffff',
              borderRadius: borderRadius.small,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.bold,
            }}>
              POPULAR
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.md,
            }}>
              <div style={{
                padding: spacing.sm,
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                borderRadius: borderRadius.small,
              }}>
                <Zap className="w-6 h-6" style={{ color: '#ff9800' }} />
              </div>
              <h3 style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: '#ff9800',
              }}>
                PRO
              </h3>
            </div>
            <div style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
              marginBottom: spacing.xs,
            }}>
              $9.99
              <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.normal, color: colors.textSecondary }}>
                /month
              </span>
            </div>
            <p style={{
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              marginBottom: spacing.lg,
            }}>
              or $99/year (save 17%)
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
            }}>
              {[
                'Everything in Basic',
                'Built-in AI Parsing',
                'Command Suggestions',
                'Cloud Sync',
                'Voice Training',
                'Priority Support',
              ].map((feature, index) => (
                <li key={index} style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: spacing.xs,
                  fontSize: typography.fontSize.sm,
                  color: colors.text,
                }}>
                  <Check className="w-4 h-4" style={{ color: '#ff9800', flexShrink: 0, marginTop: '2px' }} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* VSCode Enterprise Tier */}
          <div style={{
            padding: spacing.xl,
            backgroundColor: colors.background,
            borderRadius: borderRadius.medium,
            border: `2px solid rgba(156, 39, 176, 0.3)`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.md,
            }}>
              <div style={{
                padding: spacing.sm,
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                borderRadius: borderRadius.small,
              }}>
                <Building2 className="w-6 h-6" style={{ color: '#9c27b0' }} />
              </div>
              <h3 style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: '#9c27b0',
              }}>
                ENTERPRISE
              </h3>
            </div>
            <div style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
              marginBottom: spacing.xs,
            }}>
              $29.99
              <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.normal, color: colors.textSecondary }}>
                /month
              </span>
            </div>
            <p style={{
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              marginBottom: spacing.lg,
            }}>
              For teams
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
            }}>
              {[
                'Everything in Pro',
                'Team Collaboration',
                'Custom Models',
                'SSO Integration',
                'Dedicated Support',
                'SLA Guarantee',
              ].map((feature, index) => (
                <li key={index} style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: spacing.xs,
                  fontSize: typography.fontSize.sm,
                  color: colors.text,
                }}>
                  <Check className="w-4 h-4" style={{ color: '#9c27b0', flexShrink: 0, marginTop: '2px' }} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{
          marginTop: spacing.xl,
          textAlign: 'center',
          padding: spacing.lg,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: borderRadius.medium,
        }}>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.textSecondary,
            marginBottom: spacing.sm,
          }}>
            <strong>32 commands</strong> • <strong>15 major features</strong> • <strong>7,000+ lines of code</strong>
          </p>
          <a
            href="https://marketplace.visualstudio.com/items?itemName=voiceflow.voiceflow-vscode"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.sm} ${spacing.lg}`,
              backgroundColor: '#667eea',
              color: '#ffffff',
              borderRadius: borderRadius.medium,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            Install Extension
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{
        maxWidth: '800px',
        margin: `${spacing['3xl']} auto 0`,
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text,
          marginBottom: spacing.xl,
        }}>
          Frequently Asked Questions
        </h2>
        <div style={{
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.lg,
        }}>
          {[
            {
              q: 'Can I switch plans at any time?',
              a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal.',
            },
            {
              q: 'Is there a free trial?',
              a: 'Yes! All paid plans include a 14-day free trial. No credit card required.',
            },
            {
              q: 'What happens if I exceed my limits on the Free plan?',
              a: "You'll be notified when you're close to your limits. You can upgrade to Pro for unlimited usage.",
            },
          ].map((faq, index) => (
            <div key={index} style={{
              padding: spacing.lg,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: borderRadius.medium,
              border: `1px solid ${colors.border}`,
            }}>
              <h3 style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text,
                marginBottom: spacing.sm,
              }}>
                {faq.q}
              </h3>
              <p style={{
                fontSize: typography.fontSize.base,
                color: colors.textSecondary,
                margin: 0,
              }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;

