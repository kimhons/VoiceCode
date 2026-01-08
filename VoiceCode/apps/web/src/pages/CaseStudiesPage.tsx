/**
 * Case Studies Page - Real-world success stories from VoiceFlow Pro users
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Users, DollarSign, ArrowRight, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks';

export const CaseStudiesPage: React.FC = () => {
  const { colors, spacing, typography } = useTheme();
  const { isMobile, isTablet } = useResponsive();

  const caseStudies = [
    {
      id: 1,
      company: 'Smith & Associates Law Firm',
      industry: 'Legal',
      icon: '⚖️',
      challenge: 'Spending 25+ hours per week on manual transcription of client meetings and court proceedings',
      solution: 'Implemented VoiceFlow Pro with Legal Professional Mode for accurate legal terminology',
      results: [
        { metric: 'Time Saved', value: '20 hours/week', icon: Clock },
        { metric: 'Cost Reduction', value: '$3,200/month', icon: DollarSign },
        { metric: 'Accuracy Improvement', value: '98.5%', icon: TrendingUp },
        { metric: 'Team Satisfaction', value: '95%', icon: Users },
      ],
      testimonial: 'VoiceFlow Pro has transformed our practice. We can now focus on serving clients instead of typing notes.',
      author: 'Michael Rodriguez, Senior Partner',
      color: '#ef4444',
    },
    {
      id: 2,
      company: 'City Medical Center',
      industry: 'Healthcare',
      icon: '⚕️',
      challenge: 'HIPAA-compliant documentation taking physicians away from patient care',
      solution: 'Deployed VoiceFlow Pro with Medical Professional Mode and offline capability for privacy',
      results: [
        { metric: 'Patient Time', value: '+30% more', icon: Users },
        { metric: 'Documentation Time', value: '-60%', icon: Clock },
        { metric: 'Compliance', value: '100% HIPAA', icon: CheckCircle },
        { metric: 'ROI', value: '450%', icon: DollarSign },
      ],
      testimonial: 'Our physicians can now spend more time with patients. The HIPAA compliance and accuracy are outstanding.',
      author: 'Dr. Sarah Chen, Chief Medical Officer',
      color: '#10b981',
    },
    {
      id: 3,
      company: 'TechCast Media',
      industry: 'Content Creation',
      icon: '🎙️',
      challenge: 'Producing 50+ podcast episodes monthly with tight turnaround times',
      solution: 'Integrated VoiceFlow Pro for automated transcription and content repurposing',
      results: [
        { metric: 'Production Speed', value: '3x faster', icon: TrendingUp },
        { metric: 'Cost Savings', value: '$5,000/month', icon: DollarSign },
        { metric: 'Content Output', value: '+150%', icon: Users },
        { metric: 'Quality Score', value: '4.9/5', icon: CheckCircle },
      ],
      testimonial: 'We went from 2 episodes per week to 6. VoiceFlow Pro made it possible to scale without hiring more staff.',
      author: 'Emma Thompson, Podcast Host & Producer',
      color: '#667eea',
    },
  ];

  return (
    <div style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#ffffff',
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: isMobile ? typography.fontSize['3xl'] : typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing.md,
          }}>
            Success Stories
          </h1>
          <p style={{
            fontSize: typography.fontSize.xl,
            opacity: 0.95,
            marginBottom: spacing.md,
          }}>
            See how organizations are transforming their workflows with VoiceFlow Pro
          </p>
          <div style={{
            display: 'flex',
            gap: spacing.xl,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: spacing.xl,
          }}>
            <div>
              <div style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold }}>$50K+</div>
              <div style={{ fontSize: typography.fontSize.sm, opacity: 0.9 }}>Average Annual Savings</div>
            </div>
            <div>
              <div style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold }}>40+</div>
              <div style={{ fontSize: typography.fontSize.sm, opacity: 0.9 }}>Hours Saved Per Week</div>
            </div>
            <div>
              <div style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold }}>98%</div>
              <div style={{ fontSize: typography.fontSize.sm, opacity: 0.9 }}>Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section style={{
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing['3xl'],
        }}>
          {caseStudies.map((study, index) => (
            <article
              key={study.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: spacing.lg,
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                border: `2px solid ${colors.border}`,
              }}
            >
              {/* Header */}
              <div style={{
                background: `linear-gradient(135deg, ${study.color} 0%, ${study.color}dd 100%)`,
                color: '#ffffff',
                padding: isMobile ? spacing.lg : spacing.xl,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  marginBottom: spacing.md,
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                  }}>
                    {study.icon}
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: typography.fontSize['2xl'],
                      fontWeight: typography.fontWeight.bold,
                      margin: 0,
                    }}>
                      {study.company}
                    </h2>
                    <p style={{
                      fontSize: typography.fontSize.base,
                      opacity: 0.9,
                      margin: 0,
                    }}>
                      {study.industry}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: isMobile ? spacing.lg : spacing.xl }}>
                {/* Challenge & Solution */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: spacing.xl,
                  marginBottom: spacing.xl,
                }}>
                  <div>
                    <h3 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text,
                      marginBottom: spacing.sm,
                    }}>
                      Challenge
                    </h3>
                    <p style={{
                      fontSize: typography.fontSize.base,
                      color: colors.textSecondary,
                      lineHeight: 1.6,
                    }}>
                      {study.challenge}
                    </p>
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text,
                      marginBottom: spacing.sm,
                    }}>
                      Solution
                    </h3>
                    <p style={{
                      fontSize: typography.fontSize.base,
                      color: colors.textSecondary,
                      lineHeight: 1.6,
                    }}>
                      {study.solution}
                    </p>
                  </div>
                </div>

                {/* Results */}
                <div style={{ marginBottom: spacing.xl }}>
                  <h3 style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.text,
                    marginBottom: spacing.md,
                  }}>
                    Results
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                    gap: spacing.md,
                  }}>
                    {study.results.map((result, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: colors.background,
                          borderRadius: spacing.md,
                          padding: spacing.md,
                          textAlign: 'center',
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        <result.icon
                          className="w-8 h-8"
                          style={{
                            color: study.color,
                            margin: '0 auto',
                            marginBottom: spacing.sm,
                          }}
                        />
                        <div style={{
                          fontSize: typography.fontSize['2xl'],
                          fontWeight: typography.fontWeight.bold,
                          color: colors.text,
                          marginBottom: spacing.xs,
                        }}>
                          {result.value}
                        </div>
                        <div style={{
                          fontSize: typography.fontSize.sm,
                          color: colors.textSecondary,
                        }}>
                          {result.metric}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonial */}
                <div style={{
                  backgroundColor: `${study.color}10`,
                  borderLeft: `4px solid ${study.color}`,
                  borderRadius: spacing.md,
                  padding: spacing.lg,
                }}>
                  <p style={{
                    fontSize: typography.fontSize.lg,
                    color: colors.text,
                    fontStyle: 'italic',
                    marginBottom: spacing.md,
                    lineHeight: 1.6,
                  }}>
                    "{study.testimonial}"
                  </p>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.textSecondary,
                    fontWeight: typography.fontWeight.semibold,
                  }}>
                    — {study.author}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#ffffff',
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: isMobile ? typography.fontSize['2xl'] : typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing.md,
          }}>
            Ready to Write Your Success Story?
          </h2>
          <p style={{
            fontSize: typography.fontSize.xl,
            opacity: 0.95,
            marginBottom: spacing.xl,
          }}>
            Join thousands of professionals who are saving time and money with VoiceFlow Pro
          </p>
          <Link
            to="/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.md} ${spacing.xl}`,
              backgroundColor: '#10b981',
              color: '#ffffff',
              borderRadius: spacing.md,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
            }}
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default CaseStudiesPage;

