/**
 * Blog Page - SEO-optimized blog with articles about transcription, productivity, and VoiceFlow Pro
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowRight, Search, Tag } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks';

export const BlogPage: React.FC = () => {
  const { colors, spacing, typography } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'productivity', 'transcription', 'ai', 'tutorials', 'case-studies'];

  const blogPosts = [
    {
      id: 1,
      title: '10 Ways Voice Transcription Can Boost Your Productivity',
      excerpt: 'Discover how voice transcription can save you hours every week and transform the way you work.',
      author: 'Sarah Johnson',
      date: '2024-01-15',
      readTime: '5 min read',
      category: 'productivity',
      image: '📈',
      slug: '10-ways-voice-transcription-boosts-productivity',
    },
    {
      id: 2,
      title: 'Medical Transcription Best Practices: A Complete Guide',
      excerpt: 'Learn the essential best practices for accurate and HIPAA-compliant medical transcription.',
      author: 'Dr. Michael Chen',
      date: '2024-01-12',
      readTime: '8 min read',
      category: 'transcription',
      image: '⚕️',
      slug: 'medical-transcription-best-practices',
    },
    {
      id: 3,
      title: 'How AI is Revolutionizing Voice Recognition Technology',
      excerpt: 'Explore the latest AI advancements that are making voice recognition more accurate than ever.',
      author: 'Emma Williams',
      date: '2024-01-10',
      readTime: '6 min read',
      category: 'ai',
      image: '🤖',
      slug: 'ai-revolutionizing-voice-recognition',
    },
    {
      id: 4,
      title: 'Getting Started with VoiceFlow Pro: A Beginner\'s Tutorial',
      excerpt: 'Step-by-step guide to setting up and using VoiceFlow Pro for the first time.',
      author: 'James Rodriguez',
      date: '2024-01-08',
      readTime: '10 min read',
      category: 'tutorials',
      image: '🎓',
      slug: 'getting-started-voiceflow-pro-tutorial',
    },
    {
      id: 5,
      title: 'Case Study: How Law Firm Saved 20 Hours/Week with VoiceFlow Pro',
      excerpt: 'Real-world success story of a law firm that transformed their documentation process.',
      author: 'Lisa Park',
      date: '2024-01-05',
      readTime: '7 min read',
      category: 'case-studies',
      image: '⚖️',
      slug: 'law-firm-case-study-20-hours-saved',
    },
    {
      id: 6,
      title: 'Offline vs Cloud Transcription: Which is Right for You?',
      excerpt: 'Compare the pros and cons of offline and cloud-based transcription solutions.',
      author: 'David Kumar',
      date: '2024-01-03',
      readTime: '5 min read',
      category: 'transcription',
      image: '☁️',
      slug: 'offline-vs-cloud-transcription-comparison',
    },
  ];

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
            VoiceFlow Pro Blog
          </h1>
          <p style={{
            fontSize: typography.fontSize.xl,
            opacity: 0.95,
            marginBottom: spacing.xl,
          }}>
            Tips, tutorials, and insights on voice transcription, productivity, and AI
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
              placeholder="Search articles..."
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
        padding: `${spacing.xl} ${spacing.lg}`,
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: spacing.md,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: `${spacing.sm} ${spacing.lg}`,
                borderRadius: '999px',
                border: `2px solid ${selectedCategory === category ? colors.primary : colors.border}`,
                backgroundColor: selectedCategory === category ? `${colors.primary}15` : colors.background,
                color: selectedCategory === category ? colors.primary : colors.text,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section style={{
        padding: isMobile ? `${spacing['3xl']} ${spacing.lg}` : `${spacing['4xl']} ${spacing['2xl']}`,
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {filteredPosts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: spacing['4xl'],
            color: colors.textSecondary,
          }}>
            <p style={{ fontSize: typography.fontSize.xl }}>No articles found matching your search.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: spacing.xl,
          }}>
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: spacing.lg,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Image/Icon */}
                <div style={{
                  height: '200px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px',
                }}>
                  {post.image}
                </div>

                {/* Content */}
                <div style={{ padding: spacing.lg }}>
                  {/* Category Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    padding: `${spacing.xs} ${spacing.md}`,
                    backgroundColor: `${colors.primary}15`,
                    color: colors.primary,
                    borderRadius: '999px',
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    marginBottom: spacing.md,
                    textTransform: 'capitalize',
                  }}>
                    <Tag className="w-3 h-3" />
                    {post.category}
                  </div>

                  <h3 style={{
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.text,
                    marginBottom: spacing.sm,
                    lineHeight: 1.3,
                  }}>
                    {post.title}
                  </h3>

                  <p style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.textSecondary,
                    marginBottom: spacing.md,
                    lineHeight: 1.6,
                  }}>
                    {post.excerpt}
                  </p>

                  {/* Meta Info */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    fontSize: typography.fontSize.xs,
                    color: colors.textSecondary,
                    marginBottom: spacing.md,
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      <User className="w-3 h-3" />
                      {post.author}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      <Calendar className="w-3 h-3" />
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>

                  {/* Read More Link */}
                  <Link
                    to={`/blog/${post.slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      color: colors.primary,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      textDecoration: 'none',
                    }}
                  >
                    Read More
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default BlogPage;

