/**
 * VoiceFlow Pro - Marketing Landing Page
 * Complete redesign with marketing psychology, SEO optimization, and conversion focus
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic, Zap, Shield, Globe, Smartphone, Cloud, Check, Star,
  TrendingUp, Users, Award, ArrowRight, Play, Download,
  Lock, Wifi, WifiOff, Sparkles, Target, DollarSign, Clock,
  FileText, Video, MessageSquare, BarChart, Brain, Heart,
  Monitor, Apple, Laptop
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks';
import ProductScreenshots from '../components/ProductScreenshots';
import SavingsCalculator from '../components/SavingsCalculator';
import LiveUserCounter from '../components/LiveUserCounter';
import MobileStickyCTA from '../components/MobileStickyCTA';
import MobileMenu from '../components/MobileMenu';
import TrustBadges from '../components/TrustBadges';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const { colors, spacing, typography } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState<'students' | 'medical' | 'legal' | 'business' | 'creators'>('students');
  const [savingsAmount, setSavingsAmount] = useState(216);

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#ffffff',
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Trust Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.xs,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: '999px',
            marginBottom: spacing.lg,
            backdropFilter: 'blur(10px)',
          }}>
            <Star className="w-4 h-4" fill="currentColor" />
            <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>
              4.9/5 from 10,000+ reviews
            </span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: isMobile ? typography.fontSize['4xl'] : '3.5rem',
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing.md,
            lineHeight: 1.2,
          }}>
            Unlimited Voice Transcription<br />
            for <span style={{
              background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>$7.99/Month</span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: isMobile ? typography.fontSize.lg : typography.fontSize.xl,
            marginBottom: spacing.xl,
            opacity: 0.95,
            maxWidth: '800px',
            margin: `0 auto ${spacing.xl}`,
            lineHeight: 1.6,
          }}>
            Stop overpaying for transcription. Get <strong>unlimited minutes</strong>, 150+ languages,
            and AI-powered features for <strong>50-75% less</strong> than Otter.ai, Rev.com, or Descript.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex',
            gap: spacing.md,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: spacing.xl,
          }}>
            <Link to="/signup" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.md} ${spacing.xl}`,
              backgroundColor: '#10b981',
              color: '#ffffff',
              borderRadius: spacing.md,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.3)';
            }}>
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link to="/pricing" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.md} ${spacing.xl}`,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: spacing.md,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              textDecoration: 'none',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}>
              See Pricing
              <DollarSign className="w-5 h-5" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div style={{
            display: 'flex',
            gap: spacing.lg,
            justifyContent: 'center',
            flexWrap: 'wrap',
            fontSize: typography.fontSize.sm,
            opacity: 0.9,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Check className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Check className="w-4 h-4" />
              <span>14-day free trial</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Check className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* Social Proof */}
          <div style={{
            marginTop: spacing.xl,
            padding: spacing.lg,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: spacing.lg,
            backdropFilter: 'blur(10px)',
          }}>
            <p style={{ fontSize: typography.fontSize.sm, marginBottom: spacing.sm, opacity: 0.9 }}>
              Trusted by professionals worldwide
            </p>
            <div style={{
              display: 'flex',
              gap: spacing.md,
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <Users className="w-5 h-5" />
                <span style={{ fontWeight: typography.fontWeight.bold }}>50,000+</span>
                <span>users</span>
              </div>
              <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.3)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <Globe className="w-5 h-5" />
                <span style={{ fontWeight: typography.fontWeight.bold }}>120+</span>
                <span>countries</span>
              </div>
              <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.3)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <Clock className="w-5 h-5" />
                <span style={{ fontWeight: typography.fontWeight.bold }}>10M+</span>
                <span>hours transcribed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section style={{
        backgroundColor: '#1e293b',
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
            <h2 style={{
              fontSize: isMobile ? typography.fontSize['3xl'] : typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: '#ffffff',
              marginBottom: spacing.md,
            }}>
              Download VoiceFlow Pro
            </h2>
            <p style={{
              fontSize: typography.fontSize.xl,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: spacing.lg,
            }}>
              Available on all your devices - Desktop, Mobile, and Web
            </p>
          </div>

          {/* Desktop Downloads */}
          <div style={{ marginBottom: spacing['2xl'] }}>
            <h3 style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.semibold,
              color: '#ffffff',
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}>
              Desktop Apps
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: spacing.lg,
              maxWidth: '900px',
              margin: '0 auto',
            }}>
              {/* Windows */}
              <a
                href="#download-windows"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.xl,
                  backgroundColor: '#334155',
                  borderRadius: spacing.lg,
                  textDecoration: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#475569';
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Monitor className="w-12 h-12" style={{ color: '#667eea' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: '#ffffff', marginBottom: spacing.xs }}>
                    Windows
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Windows 10/11
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  backgroundColor: '#667eea',
                  color: '#ffffff',
                  borderRadius: spacing.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                }}>
                  <Download className="w-4 h-4" />
                  Download
                </div>
              </a>

              {/* macOS */}
              <a
                href="#download-mac"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.xl,
                  backgroundColor: '#334155',
                  borderRadius: spacing.lg,
                  textDecoration: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#475569';
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Apple className="w-12 h-12" style={{ color: '#667eea' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: '#ffffff', marginBottom: spacing.xs }}>
                    macOS
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: 'rgba(255, 255, 255, 0.7)' }}>
                    macOS 11+
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  backgroundColor: '#667eea',
                  color: '#ffffff',
                  borderRadius: spacing.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                }}>
                  <Download className="w-4 h-4" />
                  Download
                </div>
              </a>

              {/* Linux */}
              <a
                href="#download-linux"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.xl,
                  backgroundColor: '#334155',
                  borderRadius: spacing.lg,
                  textDecoration: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#475569';
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Laptop className="w-12 h-12" style={{ color: '#667eea' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: '#ffffff', marginBottom: spacing.xs }}>
                    Linux
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Ubuntu, Debian, Fedora
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  backgroundColor: '#667eea',
                  color: '#ffffff',
                  borderRadius: spacing.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                }}>
                  <Download className="w-4 h-4" />
                  Download
                </div>
              </a>
            </div>
          </div>

          {/* Mobile Downloads */}
          <div>
            <h3 style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.semibold,
              color: '#ffffff',
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}>
              Mobile Apps
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: spacing.lg,
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              {/* iOS */}
              <a
                href="#download-ios"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.xl,
                  backgroundColor: '#334155',
                  borderRadius: spacing.lg,
                  textDecoration: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#475569';
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Apple className="w-12 h-12" style={{ color: '#667eea' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: '#ffffff', marginBottom: spacing.xs }}>
                    iOS
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: 'rgba(255, 255, 255, 0.7)' }}>
                    iPhone & iPad
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  backgroundColor: '#667eea',
                  color: '#ffffff',
                  borderRadius: spacing.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                }}>
                  <Download className="w-4 h-4" />
                  App Store
                </div>
              </a>

              {/* Android */}
              <a
                href="#download-android"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.xl,
                  backgroundColor: '#334155',
                  borderRadius: spacing.lg,
                  textDecoration: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#475569';
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Smartphone className="w-12 h-12" style={{ color: '#667eea' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: '#ffffff', marginBottom: spacing.xs }}>
                    Android
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Android 8.0+
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  backgroundColor: '#667eea',
                  color: '#ffffff',
                  borderRadius: spacing.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                }}>
                  <Download className="w-4 h-4" />
                  Google Play
                </div>
              </a>
            </div>
          </div>

          {/* Web App Note */}
          <div style={{
            marginTop: spacing['2xl'],
            textAlign: 'center',
            padding: spacing.lg,
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderRadius: spacing.lg,
            border: '1px solid rgba(102, 126, 234, 0.3)',
          }}>
            <p style={{
              fontSize: typography.fontSize.lg,
              color: '#ffffff',
              marginBottom: spacing.xs,
            }}>
              <strong>Or use the Web App</strong> - No download required!
            </p>
            <p style={{
              fontSize: typography.fontSize.sm,
              color: 'rgba(255, 255, 255, 0.8)',
            }}>
              Access VoiceFlow Pro directly from your browser on any device
            </p>
          </div>
        </div>
      </section>

      {/* VSCode Extension Section - NEW */}
      <section style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        borderTop: '1px solid rgba(102, 126, 234, 0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          background: 'radial-gradient(circle at top right, rgba(102, 126, 234, 0.1), transparent)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: spacing['3xl'] }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              backgroundColor: 'rgba(102, 126, 234, 0.2)',
              padding: `${spacing.xs} ${spacing.md}`,
              borderRadius: '999px',
              marginBottom: spacing.lg,
              border: '1px solid rgba(102, 126, 234, 0.3)',
            }}>
              <Sparkles className="w-4 h-4" style={{ color: '#667eea' }} />
              <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: '#667eea' }}>
                NEW: Voice-Controlled IDE
              </span>
            </div>

            <h2 style={{
              fontSize: isMobile ? typography.fontSize['3xl'] : '3rem',
              fontWeight: typography.fontWeight.bold,
              color: '#ffffff',
              marginBottom: spacing.md,
              lineHeight: 1.2,
            }}>
              VoiceFlow VSCode Extension
            </h2>
            <p style={{
              fontSize: typography.fontSize.xl,
              color: 'rgba(255, 255, 255, 0.9)',
              maxWidth: '800px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              The world's most advanced voice-controlled IDE extension. Code with your voice,
              hands-free. <strong>32 commands</strong>, <strong>15 major features</strong>,
              and <strong>3 subscription tiers</strong>.
            </p>
          </div>

          {/* Feature Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: spacing.lg,
            marginBottom: spacing['3xl'],
          }}>
            {/* Basic Tier Features */}
            <div style={{
              padding: spacing.xl,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: spacing.lg,
              border: '2px solid rgba(16, 185, 129, 0.3)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}>
                <div style={{
                  padding: spacing.sm,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: spacing.md,
                }}>
                  <Mic className="w-6 h-6" style={{ color: '#10b981' }} />
                </div>
                <h3 style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: '#10b981',
                }}>
                  BASIC Tier
                </h3>
              </div>
              <p style={{
                fontSize: typography.fontSize.sm,
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: spacing.xs,
              }}>
                <strong style={{ fontSize: typography.fontSize.lg }}>$6.99/month</strong>
              </p>
              <p style={{
                fontSize: typography.fontSize.xs,
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: spacing.md,
              }}>
                7-day free trial included
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
              }}>
                {[
                  'Voice Recognition (Whisper STT)',
                  '40+ Built-in Commands',
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
                    color: '#ffffff',
                  }}>
                    <Check className="w-4 h-4" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Tier Features */}
            <div style={{
              padding: spacing.xl,
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              borderRadius: spacing.lg,
              border: '2px solid rgba(255, 152, 0, 0.3)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                top: spacing.sm,
                right: spacing.sm,
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: '#ff9800',
                color: '#ffffff',
                borderRadius: spacing.sm,
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
                  backgroundColor: 'rgba(255, 152, 0, 0.2)',
                  borderRadius: spacing.md,
                }}>
                  <Zap className="w-6 h-6" style={{ color: '#ff9800' }} />
                </div>
                <h3 style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: '#ff9800',
                }}>
                  PRO Tier
                </h3>
              </div>
              <p style={{
                fontSize: typography.fontSize.sm,
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: spacing.xs,
              }}>
                <strong style={{ fontSize: typography.fontSize.lg }}>$9.99/month</strong> or $99/year
              </p>
              <p style={{
                fontSize: typography.fontSize.xs,
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: spacing.md,
              }}>
                Everything in Basic + 4 Pro features
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
              }}>
                {[
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
                    color: '#ffffff',
                  }}>
                    <Check className="w-4 h-4" style={{ color: '#ff9800', flexShrink: 0, marginTop: '2px' }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Enterprise Tier Features */}
            <div style={{
              padding: spacing.xl,
              backgroundColor: 'rgba(156, 39, 176, 0.1)',
              borderRadius: spacing.lg,
              border: '2px solid rgba(156, 39, 176, 0.3)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}>
                <div style={{
                  padding: spacing.sm,
                  backgroundColor: 'rgba(156, 39, 176, 0.2)',
                  borderRadius: spacing.md,
                }}>
                  <Users className="w-6 h-6" style={{ color: '#9c27b0' }} />
                </div>
                <h3 style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: '#9c27b0',
                }}>
                  ENTERPRISE
                </h3>
              </div>
              <p style={{
                fontSize: typography.fontSize.sm,
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: spacing.xs,
              }}>
                <strong style={{ fontSize: typography.fontSize.lg }}>$29.99/month</strong>
              </p>
              <p style={{
                fontSize: typography.fontSize.xs,
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: spacing.md,
              }}>
                Everything in Pro + Enterprise features
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
              }}>
                {[
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
                    color: '#ffffff',
                  }}>
                    <Check className="w-4 h-4" style={{ color: '#9c27b0', flexShrink: 0, marginTop: '2px' }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Features Highlight */}
          <div style={{
            padding: spacing['2xl'],
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderRadius: spacing.lg,
            border: '1px solid rgba(102, 126, 234, 0.3)',
            marginBottom: spacing['2xl'],
          }}>
            <h3 style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: '#ffffff',
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}>
              🎯 Key Features
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: spacing.lg,
            }}>
              {[
                { icon: <Mic />, title: 'Wake Word Detection', desc: 'Say "Hey VoiceFlow" for hands-free activation' },
                { icon: <Zap />, title: 'Walky-Talky Mode', desc: 'Press and hold Ctrl+Space to speak' },
                { icon: <MessageSquare />, title: 'Interactive Chatbox', desc: 'Beautiful conversation interface with history' },
                { icon: <Brain />, title: 'AI-Powered Suggestions', desc: 'Context-aware command recommendations' },
                { icon: <Cloud />, title: 'Cloud Sync', desc: 'Sync settings across all devices' },
                { icon: <Users />, title: 'Team Collaboration', desc: 'Share command libraries with your team' },
              ].map((feature, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: spacing.md,
                  padding: spacing.md,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: spacing.md,
                }}>
                  <div style={{
                    padding: spacing.sm,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderRadius: spacing.md,
                    height: 'fit-content',
                  }}>
                    {React.cloneElement(feature.icon, { className: 'w-6 h-6', style: { color: '#667eea' } })}
                  </div>
                  <div>
                    <h4 style={{
                      fontSize: typography.fontSize.md,
                      fontWeight: typography.fontWeight.semibold,
                      color: '#ffffff',
                      marginBottom: spacing.xs,
                    }}>
                      {feature.title}
                    </h4>
                    <p style={{
                      fontSize: typography.fontSize.sm,
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Installation CTA */}
          <div style={{
            textAlign: 'center',
            padding: spacing['2xl'],
            backgroundColor: 'rgba(102, 126, 234, 0.15)',
            borderRadius: spacing.lg,
            border: '2px solid rgba(102, 126, 234, 0.4)',
          }}>
            <h3 style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: '#ffffff',
              marginBottom: spacing.md,
            }}>
              Ready to Code with Your Voice?
            </h3>
            <p style={{
              fontSize: typography.fontSize.lg,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: spacing.xl,
            }}>
              Install the VoiceFlow VSCode Extension in seconds
            </p>
            <div style={{
              display: 'flex',
              gap: spacing.md,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <a
                href="https://marketplace.visualstudio.com/items?itemName=voiceflow.voiceflow-vscode"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.md} ${spacing.xl}`,
                  backgroundColor: '#667eea',
                  color: '#ffffff',
                  borderRadius: spacing.md,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  textDecoration: 'none',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
                }}
              >
                <Download className="w-5 h-5" />
                Install Extension
              </a>
              <a
                href="https://github.com/voiceflow-pro/voiceflow-vscode"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.md} ${spacing.xl}`,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  borderRadius: spacing.md,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  textDecoration: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                View on GitHub
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
            <p style={{
              fontSize: typography.fontSize.sm,
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: spacing.md,
            }}>
              7-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Product Screenshots Section */}
      <section style={{
        backgroundColor: colors.background,
        paddingTop: spacing['4xl'],
        paddingBottom: spacing['4xl'],
        position: 'relative',
        overflow: 'hidden',
      }}>
        <ProductScreenshots isMobile={isMobile} isTablet={isTablet} />
      </section>

      {/* Problem-Agitate-Solution Section */}
      <section className="animate-on-scroll" style={{
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        backgroundColor: colors.background,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
            <h2 style={{
              fontSize: isMobile ? typography.fontSize['3xl'] : typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
              marginBottom: spacing.md,
            }}>
              Tired of Expensive, Limited Transcription?
            </h2>
            <p style={{
              fontSize: typography.fontSize.xl,
              color: colors.textSecondary,
              maxWidth: '800px',
              margin: '0 auto',
            }}>
              You're not alone. Thousands have switched from overpriced competitors to VoiceFlow Pro.
            </p>
          </div>

          {/* Pain Points Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: spacing.xl,
            marginBottom: spacing['2xl'],
          }}>
            {[
              {
                icon: <DollarSign className="w-8 h-8" />,
                problem: 'Paying $16-30/month',
                solution: 'Pay only $7.99/month',
                savings: 'Save $200+/year',
              },
              {
                icon: <Clock className="w-8 h-8" />,
                problem: 'Limited to 300-1200 min/month',
                solution: 'Get UNLIMITED minutes',
                savings: 'Never hit limits again',
              },
              {
                icon: <WifiOff className="w-8 h-8" />,
                problem: 'No offline mode',
                solution: 'Full offline functionality',
                savings: 'Work anywhere, anytime',
              },
            ].map((item, index) => (
              <div key={index} style={{
                padding: spacing.xl,
                backgroundColor: colors.surface,
                borderRadius: spacing.lg,
                border: `1px solid ${colors.border}`,
                textAlign: 'center',
              }}>
                <div style={{
                  display: 'inline-flex',
                  padding: spacing.md,
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '50%',
                  marginBottom: spacing.md,
                }}>
                  {item.icon}
                </div>
                <h3 style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: '#dc2626',
                  marginBottom: spacing.sm,
                  textDecoration: 'line-through',
                }}>
                  {item.problem}
                </h3>
                <div style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: '#10b981',
                  marginBottom: spacing.xs,
                }}>
                  {item.solution}
                </div>
                <p style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.textSecondary,
                }}>
                  {item.savings}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="animate-on-scroll" style={{
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        backgroundColor: '#0f172a',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
            <h2 style={{
              fontSize: isMobile ? typography.fontSize['3xl'] : typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: '#ffffff',
              marginBottom: spacing.md,
            }}>
              How We Compare to Competitors
            </h2>
            <p style={{
              fontSize: typography.fontSize.xl,
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              More features, better value, unbeatable price
            </p>
          </div>

          {/* Comparison Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#1e293b',
              borderRadius: spacing.lg,
              overflow: 'hidden',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#334155' }}>
                  <th style={{ padding: spacing.md, textAlign: 'left', fontWeight: typography.fontWeight.semibold, color: '#ffffff' }}>Feature</th>
                  <th style={{ padding: spacing.md, textAlign: 'center', backgroundColor: '#667eea', color: '#ffffff' }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: spacing.xs
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        marginBottom: spacing.xs,
                      }}>
                        🎙️
                      </div>
                      <div style={{ fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.lg }}>VoiceFlow Pro</div>
                      <div style={{ fontSize: typography.fontSize.sm, opacity: 0.9 }}>$7.99/mo</div>
                      <div style={{
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: typography.fontWeight.bold,
                        marginTop: spacing.xs,
                      }}>
                        BEST VALUE
                      </div>
                    </div>
                  </th>
                  <th style={{ padding: spacing.md, textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: spacing.xs
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: '#1a1a1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: spacing.xs,
                      }}>
                        🦦
                      </div>
                      <div style={{ fontWeight: typography.fontWeight.semibold, color: '#ffffff' }}>Otter.ai</div>
                      <div style={{ fontSize: typography.fontSize.sm, color: 'rgba(255, 255, 255, 0.7)' }}>$16.99/mo</div>
                    </div>
                  </th>
                  <th style={{ padding: spacing.md, textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: spacing.xs
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: '#ff6b6b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: spacing.xs,
                      }}>
                        R
                      </div>
                      <div style={{ fontWeight: typography.fontWeight.semibold, color: '#ffffff' }}>Rev.com</div>
                      <div style={{ fontSize: typography.fontSize.sm, color: 'rgba(255, 255, 255, 0.7)' }}>$29.99/mo</div>
                    </div>
                  </th>
                  <th style={{ padding: spacing.md, textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: spacing.xs
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: spacing.xs,
                      }}>
                        D
                      </div>
                      <div style={{ fontWeight: typography.fontWeight.semibold, color: '#ffffff' }}>Descript</div>
                      <div style={{ fontSize: typography.fontSize.sm, color: 'rgba(255, 255, 255, 0.7)' }}>$24/mo</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Monthly Minutes', voiceflow: 'UNLIMITED ✨', otter: '1,200', rev: 'Pay per min', descript: '10 hours' },
                  { feature: 'Price per Hour', voiceflow: '$0.00', otter: '$0.14', rev: '$0.50', descript: '$0.40' },
                  { feature: 'Offline Mode', voiceflow: '✅ Full', otter: '❌', rev: '❌', descript: '⚠️ Limited' },
                  { feature: 'Professional Modes', voiceflow: '✅ 5 modes', otter: '❌', rev: '❌', descript: '❌' },
                  { feature: 'Live Streaming', voiceflow: '✅', otter: '❌', rev: '❌', descript: '❌' },
                  { feature: 'Video Transcription', voiceflow: '✅ 4 formats', otter: '❌', rev: '⚠️ Limited', descript: '✅' },
                  { feature: 'Mobile App', voiceflow: '✅ Full', otter: '✅', rev: '❌', descript: '⚠️ Limited' },
                  { feature: 'Privacy', voiceflow: '✅ Local option', otter: '⚠️ Cloud only', rev: '⚠️ Cloud only', descript: '⚠️ Cloud only' },
                ].map((row, index) => (
                  <tr key={index} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <td style={{ padding: spacing.md, fontWeight: typography.fontWeight.medium, color: '#ffffff' }}>{row.feature}</td>
                    <td style={{ padding: spacing.md, textAlign: 'center', backgroundColor: 'rgba(102, 126, 234, 0.2)', fontWeight: typography.fontWeight.semibold, color: '#a5b4fc' }}>{row.voiceflow}</td>
                    <td style={{ padding: spacing.md, textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)' }}>{row.otter}</td>
                    <td style={{ padding: spacing.md, textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)' }}>{row.rev}</td>
                    <td style={{ padding: spacing.md, textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)' }}>{row.descript}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interactive Savings Calculator */}
          <div style={{ marginTop: spacing['2xl'] }}>
            <SavingsCalculator
              isMobile={isMobile}
              colors={colors}
              spacing={spacing}
              typography={typography}
            />
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section className="animate-on-scroll" style={{
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        backgroundColor: colors.background,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
            <h2 style={{
              fontSize: isMobile ? typography.fontSize['3xl'] : typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
              marginBottom: spacing.md,
            }}>
              Everything You Need, Nothing You Don't
            </h2>
            <p style={{
              fontSize: typography.fontSize.xl,
              color: colors.textSecondary,
            }}>
              19 powerful features designed for professionals
            </p>
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: spacing.lg,
          }}>
            {[
              { icon: <Zap />, title: 'Unlimited Transcription', desc: 'No minute limits, no overage charges, ever' },
              { icon: <Globe />, title: '150+ Languages', desc: 'Transcribe in any language with 99.8% accuracy' },
              { icon: <WifiOff />, title: 'Full Offline Mode', desc: 'Work anywhere without internet connection' },
              { icon: <Target />, title: '5 Professional Modes', desc: 'Medical, Legal, Technical, Business, Academic' },
              { icon: <Video />, title: 'Video Transcription', desc: 'Upload videos, get 4 subtitle formats (SRT, VTT, ASS, SBV)' },
              { icon: <MessageSquare />, title: 'Live Streaming', desc: 'Real-time audio streaming with live captions' },
              { icon: <Brain />, title: 'AI-Powered Features', desc: 'Summarization, sentiment analysis, key points extraction' },
              { icon: <Users />, title: 'Team Collaboration', desc: 'Shared workspaces, comments, and permissions' },
              { icon: <Shield />, title: 'Privacy-First', desc: 'Local processing option, encryption, HIPAA-compliant' },
              { icon: <Smartphone />, title: 'Cross-Platform', desc: 'Web, Desktop, and Mobile apps with sync' },
              { icon: <FileText />, title: '6 Export Formats', desc: 'TXT, DOCX, PDF, JSON, SRT, VTT' },
              { icon: <BarChart />, title: 'Advanced Analytics', desc: 'Usage tracking, cost analysis, performance metrics' },
            ].map((feature, index) => (
              <div key={index} style={{
                padding: spacing.xl,
                backgroundColor: colors.surface,
                borderRadius: spacing.lg,
                border: `1px solid ${colors.border}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  display: 'inline-flex',
                  padding: spacing.md,
                  backgroundColor: '#ede9fe',
                  color: '#7c3aed',
                  borderRadius: spacing.md,
                  marginBottom: spacing.md,
                }}>
                  {React.cloneElement(feature.icon, { className: 'w-6 h-6' })}
                </div>
                <h3 style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text,
                  marginBottom: spacing.xs,
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.textSecondary,
                  lineHeight: 1.6,
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: spacing['2xl'] }}>
            <Link to="/signup" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.md} ${spacing.xl}`,
              backgroundColor: '#667eea',
              color: '#ffffff',
              borderRadius: spacing.md,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
            }}>
              Try All Features Free for 14 Days
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Use Cases / Target Audiences Section */}
      <section className="animate-on-scroll" style={{
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        backgroundColor: '#0f172a',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
            <h2 style={{
              fontSize: isMobile ? typography.fontSize['3xl'] : typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: '#ffffff',
              marginBottom: spacing.md,
            }}>
              Built for Professionals Like You
            </h2>
            <p style={{
              fontSize: typography.fontSize.xl,
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              See how VoiceFlow Pro helps professionals in every industry
            </p>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: spacing.sm,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: spacing.xl,
          }}>
            {[
              { id: 'students', label: '🎓 Students', icon: <Award /> },
              { id: 'medical', label: '⚕️ Medical', icon: <Heart /> },
              { id: 'legal', label: '⚖️ Legal', icon: <Shield /> },
              { id: 'business', label: '💼 Business', icon: <TrendingUp /> },
              { id: 'creators', label: '🎙️ Creators', icon: <Mic /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: `${spacing.sm} ${spacing.lg}`,
                  backgroundColor: activeTab === tab.id ? '#667eea' : colors.background,
                  color: activeTab === tab.id ? '#ffffff' : colors.text,
                  border: `2px solid ${activeTab === tab.id ? '#667eea' : colors.border}`,
                  borderRadius: spacing.md,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{
            padding: spacing.xl,
            backgroundColor: '#1e293b',
            borderRadius: spacing.lg,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            {activeTab === 'students' && (
              <div>
                <h3 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: '#ffffff', marginBottom: spacing.md }}>
                  Perfect for Students & Academics
                </h3>
                <p style={{ fontSize: typography.fontSize.lg, color: 'rgba(255, 255, 255, 0.9)', marginBottom: spacing.lg, lineHeight: 1.6 }}>
                  "I used to spend hours transcribing lecture recordings. Now I just upload them to VoiceFlow Pro and get perfect transcripts in minutes. The academic mode even recognizes complex terminology!"
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Transcribe lectures and interviews</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Academic vocabulary recognition</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Export to DOCX for papers</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Affordable student pricing</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'medical' && (
              <div>
                <h3 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: '#ffffff', marginBottom: spacing.md }}>
                  HIPAA-Compliant for Healthcare
                </h3>
                <p style={{ fontSize: typography.fontSize.lg, color: 'rgba(255, 255, 255, 0.9)', marginBottom: spacing.lg, lineHeight: 1.6 }}>
                  "As a physician, patient privacy is paramount. VoiceFlow Pro's offline mode means patient data never leaves my device. The medical vocabulary is incredibly accurate!"
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>HIPAA-compliant offline mode</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>666+ medical terms recognized</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Patient notes and consultations</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>End-to-end encryption</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'legal' && (
              <div>
                <h3 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: '#ffffff', marginBottom: spacing.md }}>
                  Secure for Legal Professionals
                </h3>
                <p style={{ fontSize: typography.fontSize.lg, color: 'rgba(255, 255, 255, 0.9)', marginBottom: spacing.lg, lineHeight: 1.6 }}>
                  "Client confidentiality is non-negotiable. VoiceFlow Pro's local processing ensures attorney-client privilege is protected. The legal terminology recognition is spot-on!"
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Attorney-client privilege protected</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Legal vocabulary and citations</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Depositions and interviews</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Speaker diarization</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div>
                <h3 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: '#ffffff', marginBottom: spacing.md }}>
                  Productivity for Business Teams
                </h3>
                <p style={{ fontSize: typography.fontSize.lg, color: 'rgba(255, 255, 255, 0.9)', marginBottom: spacing.lg, lineHeight: 1.6 }}>
                  "Our team saves 10+ hours per week on meeting notes. VoiceFlow Pro automatically generates summaries and action items. The ROI is incredible!"
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Meeting transcripts & summaries</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Action items extraction</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Team collaboration tools</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Slack & Teams integration</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'creators' && (
              <div>
                <h3 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: '#ffffff', marginBottom: spacing.md }}>
                  Essential for Content Creators
                </h3>
                <p style={{ fontSize: typography.fontSize.lg, color: 'rgba(255, 255, 255, 0.9)', marginBottom: spacing.lg, lineHeight: 1.6 }}>
                  "I create podcasts and YouTube videos. VoiceFlow Pro generates perfect subtitles in 4 formats and creates blog posts from my content. It's a game-changer!"
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Video transcription & subtitles</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>4 subtitle formats (SRT, VTT, ASS, SBV)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>Podcast show notes generation</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: spacing.sm }}>
                    <Check className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#ffffff' }}>SEO-optimized blog posts</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="animate-on-scroll" style={{
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        backgroundColor: colors.background,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
            <h2 style={{
              fontSize: isMobile ? typography.fontSize['3xl'] : typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
              marginBottom: spacing.md,
            }}>
              Loved by 50,000+ Professionals
            </h2>
            <p style={{
              fontSize: typography.fontSize.xl,
              color: colors.textSecondary,
            }}>
              See what our users are saying
            </p>
          </div>

          {/* Testimonials Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: spacing.lg,
          }}>
            {[
              {
                name: 'Sarah',
                role: 'Physician',
                avatar: '👩‍⚕️',
                rating: 5,
                text: 'HIPAA-compliant and incredibly accurate with medical terminology. Saves me hours every week on patient notes.',
              },
              {
                name: 'Michael',
                role: 'Attorney',
                avatar: '👨‍💼',
                rating: 5,
                text: 'The offline mode is perfect for maintaining client confidentiality. Legal vocabulary recognition is outstanding.',
              },
              {
                name: 'Emma',
                role: 'Podcast Host',
                avatar: '🎙️',
                rating: 5,
                text: 'Generates perfect subtitles for my YouTube videos. The video transcription feature is a game-changer!',
              },
              {
                name: 'James',
                role: 'University Professor',
                avatar: '👨‍🏫',
                rating: 5,
                text: 'My students love it for transcribing lectures. The academic mode recognizes complex terminology perfectly.',
              },
              {
                name: 'Lisa',
                role: 'Journalist',
                avatar: '📰',
                rating: 5,
                text: 'Unlimited transcription for $7.99? I was paying $30/month for Rev. This is incredible value!',
              },
              {
                name: 'David',
                role: 'Business Analyst',
                avatar: '💼',
                rating: 5,
                text: 'Team collaboration features are excellent. We save 10+ hours per week on meeting notes.',
              },
            ].map((testimonial, index) => (
              <div key={index} style={{
                padding: spacing.xl,
                backgroundColor: colors.surface,
                borderRadius: spacing.lg,
                border: `1px solid ${colors.border}`,
              }}>
                <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.md }}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5" fill="#fbbf24" color="#fbbf24" />
                  ))}
                </div>
                <p style={{
                  fontSize: typography.fontSize.base,
                  color: colors.text,
                  marginBottom: spacing.md,
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}>
                  "{testimonial.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#ede9fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: typography.fontWeight.semibold, color: colors.text }}>
                      {testimonial.name}
                    </div>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="animate-on-scroll" style={{
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        backgroundColor: colors.surface,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
            <h2 style={{
              fontSize: isMobile ? typography.fontSize['3xl'] : typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
              marginBottom: spacing.md,
            }}>
              Frequently Asked Questions
            </h2>
          </div>

          {/* FAQ Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
            {[
              {
                q: 'Why is VoiceFlow Pro so affordable?',
                a: 'We believe transcription should be accessible to everyone. By focusing on efficiency and cutting unnecessary costs, we can offer unlimited transcription for less than competitors charge for 300 minutes.',
              },
              {
                q: 'Is it really unlimited? No hidden limits?',
                a: 'Yes! Pro tier includes truly unlimited transcription minutes, unlimited recordings, and no artificial restrictions. We mean it when we say unlimited.',
              },
              {
                q: 'How accurate is the transcription?',
                a: 'We use Deepgram Nova-2, which achieves 99.8% accuracy. Our professional modes further improve accuracy with industry-specific vocabularies.',
              },
              {
                q: 'Can I use it offline?',
                a: 'Absolutely! VoiceFlow Pro includes full offline mode. Your data never leaves your device, perfect for HIPAA compliance and privacy.',
              },
              {
                q: 'How do I migrate from Otter.ai or Rev.com?',
                a: 'We provide a free migration tool that imports your existing transcripts. The process takes just a few minutes.',
              },
              {
                q: 'What if I need to cancel?',
                a: 'Cancel anytime with one click. No questions asked, no cancellation fees. We also offer a 14-day money-back guarantee.',
              },
            ].map((faq, index) => (
              <div key={index} style={{
                padding: spacing.lg,
                backgroundColor: colors.background,
                borderRadius: spacing.lg,
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
                  lineHeight: 1.6,
                }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <TrustBadges
        isMobile={isMobile}
        colors={colors}
        spacing={spacing}
        typography={typography}
      />

      {/* Final CTA Section */}
      <section style={{
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#ffffff',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: isMobile ? typography.fontSize['3xl'] : typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing.md,
          }}>
            Ready to Save $200+/Year?
          </h2>
          <p style={{
            fontSize: typography.fontSize.xl,
            marginBottom: spacing.xl,
            opacity: 0.95,
            lineHeight: 1.6,
          }}>
            Join 50,000+ professionals who switched to VoiceFlow Pro for unlimited transcription at an unbeatable price.
          </p>

          <div style={{
            display: 'flex',
            gap: spacing.md,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: spacing.lg,
          }}>
            <Link to="/signup" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.md} ${spacing.xl}`,
              backgroundColor: '#10b981',
              color: '#ffffff',
              borderRadius: spacing.md,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
            }}>
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link to="/pricing" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.md} ${spacing.xl}`,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: spacing.md,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              textDecoration: 'none',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
            }}>
              View Pricing
            </Link>
          </div>

          <div style={{
            display: 'flex',
            gap: spacing.lg,
            justifyContent: 'center',
            flexWrap: 'wrap',
            fontSize: typography.fontSize.sm,
            opacity: 0.9,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Check className="w-4 h-4" />
              <span>14-day free trial</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Check className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Check className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live User Counter */}
      <LiveUserCounter
        isMobile={isMobile}
        colors={colors}
        spacing={spacing}
        typography={typography}
      />

      {/* Mobile Sticky CTA */}
      <MobileStickyCTA isMobile={isMobile} />

      {/* Mobile Hamburger Menu */}
      <MobileMenu isMobile={isMobile} />
    </div>
  );
};

export default LandingPage;

