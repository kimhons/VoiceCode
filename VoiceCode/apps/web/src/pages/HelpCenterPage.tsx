/**
 * Help Center Page - Searchable knowledge base and FAQs
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Book, Video, MessageCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks';

export const HelpCenterPage: React.FC = () => {
  const { colors, spacing, typography } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const categories = [
    {
      icon: Book,
      title: 'Getting Started',
      description: 'Learn the basics of VoiceFlow Pro',
      articles: 12,
      color: '#667eea',
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      articles: 8,
      color: '#10b981',
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Technical documentation and API',
      articles: 25,
      color: '#f59e0b',
    },
    {
      icon: MessageCircle,
      title: 'Troubleshooting',
      description: 'Common issues and solutions',
      articles: 15,
      color: '#ef4444',
    },
  ];

  const faqs = [
    {
      question: 'How do I get started with VoiceFlow Pro?',
      answer: 'Getting started is easy! Sign up for a free account, download the app for your platform (web, desktop, or mobile), and start recording. Our onboarding tutorial will guide you through the key features.',
    },
    {
      question: 'Is my data secure and private?',
      answer: 'Absolutely. We take security seriously. All data is encrypted in transit and at rest. You can also use offline mode for complete privacy. We are HIPAA-compliant and never sell your data.',
    },
    {
      question: 'Can I use VoiceFlow Pro offline?',
      answer: 'Yes! VoiceFlow Pro works fully offline on desktop and mobile apps. Your transcriptions are processed locally on your device, ensuring complete privacy and allowing you to work anywhere.',
    },
    {
      question: 'What languages are supported?',
      answer: 'VoiceFlow Pro supports over 150 languages and dialects, including English, Spanish, French, German, Chinese, Japanese, Arabic, and many more. Language detection is automatic.',
    },
    {
      question: 'How accurate is the transcription?',
      answer: 'Our transcription accuracy averages 95-98% depending on audio quality and language. Professional modes (Medical, Legal, Technical) have specialized vocabularies for even higher accuracy in those fields.',
    },
    {
      question: 'Can I export my transcriptions?',
      answer: 'Yes! Export to 6 formats: TXT, DOCX, PDF, SRT (subtitles), JSON, and CSV. You can also copy to clipboard or share directly to other apps.',
    },
    {
      question: 'What is the difference between Professional Modes?',
      answer: 'Professional Modes optimize transcription for specific fields: Medical (SOAP notes, medical terms), Legal (legal terminology, case formats), Technical (code, technical jargon), Business (meeting minutes, reports), and Academic (lecture notes, citations).',
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel anytime from your account settings. No questions asked, no cancellation fees. Your subscription remains active until the end of your billing period.',
    },
  ];

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            How Can We Help?
          </h1>
          <p style={{
            fontSize: typography.fontSize.xl,
            opacity: 0.95,
            marginBottom: spacing.xl,
          }}>
            Search our knowledge base or browse categories below
          </p>

          {/* Search Bar */}
          <div style={{
            position: 'relative',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            <Search style={{
              position: 'absolute',
              left: spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.textSecondary,
            }} className="w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: `${spacing.md} ${spacing.md} ${spacing.md} 3rem`,
                borderRadius: spacing.lg,
                border: 'none',
                fontSize: typography.fontSize.base,
                outline: 'none',
              }}
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text,
          marginBottom: spacing.xl,
          textAlign: 'center',
        }}>
          Browse by Category
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: spacing.lg,
        }}>
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`/help/${category.title.toLowerCase().replace(' ', '-')}`}
              style={{
                backgroundColor: colors.surface,
                borderRadius: spacing.lg,
                padding: spacing.lg,
                textDecoration: 'none',
                border: `2px solid ${colors.border}`,
                transition: 'all 0.2s',
                display: 'block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = category.color;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: `${category.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.md,
              }}>
                <category.icon className="w-6 h-6" style={{ color: category.color }} />
              </div>
              <h3 style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text,
                marginBottom: spacing.xs,
              }}>
                {category.title}
              </h3>
              <p style={{
                fontSize: typography.fontSize.sm,
                color: colors.textSecondary,
                marginBottom: spacing.sm,
              }}>
                {category.description}
              </p>
              <p style={{
                fontSize: typography.fontSize.xs,
                color: category.color,
                fontWeight: typography.fontWeight.semibold,
              }}>
                {category.articles} articles
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section style={{
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        backgroundColor: colors.surface,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text,
            marginBottom: spacing.xl,
            textAlign: 'center',
          }}>
            Frequently Asked Questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: spacing.md,
                  border: `1px solid ${colors.border}`,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  style={{
                    width: '100%',
                    padding: spacing.lg,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text,
                  }}>
                    {faq.question}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5" style={{ color: colors.primary, flexShrink: 0 }} />
                  ) : (
                    <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary, flexShrink: 0 }} />
                  )}
                </button>
                {expandedFaq === index && (
                  <div style={{
                    padding: `0 ${spacing.lg} ${spacing.lg}`,
                    fontSize: typography.fontSize.sm,
                    color: colors.textSecondary,
                    lineHeight: 1.6,
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section style={{
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text,
            marginBottom: spacing.md,
          }}>
            Still Need Help?
          </h2>
          <p style={{
            fontSize: typography.fontSize.base,
            color: colors.textSecondary,
            marginBottom: spacing.xl,
          }}>
            Our support team is here to help you 24/7
          </p>
          <Link
            to="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.md} ${spacing.xl}`,
              backgroundColor: colors.primary,
              color: '#ffffff',
              borderRadius: spacing.md,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              textDecoration: 'none',
            }}
          >
            <MessageCircle className="w-5 h-5" />
            Contact Support
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HelpCenterPage;

