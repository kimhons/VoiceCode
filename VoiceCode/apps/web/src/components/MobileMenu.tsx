/**
 * Mobile Hamburger Menu Component
 * Responsive navigation menu for mobile devices
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Home, Zap, DollarSign, BookOpen, Briefcase, HelpCircle, Smartphone } from 'lucide-react';

interface MobileMenuProps {
  isMobile?: boolean;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isMobile }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isMobile) {
    return null;
  }

  const menuItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/features', label: 'Features', icon: Zap },
    { path: '/pricing', label: 'Pricing', icon: DollarSign },
    { path: '/blog', label: 'Blog', icon: BookOpen },
    { path: '/case-studies', label: 'Case Studies', icon: Briefcase },
    { path: '/help', label: 'Help Center', icon: HelpCircle },
    { path: '/app', label: 'Launch App', icon: Smartphone },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1001,
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: isOpen ? '#ef4444' : '#667eea',
          border: 'none',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
        }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            animation: 'fadeIn 0.3s ease-out',
          }}
        />
      )}

      {/* Menu Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '80%',
          maxWidth: '320px',
          backgroundColor: '#ffffff',
          zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-out',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            padding: '2rem 1.5rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              margin: 0,
              marginBottom: '0.5rem',
            }}
          >
            VoiceFlow Pro
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              opacity: 0.9,
              margin: 0,
            }}
          >
            Professional Voice Transcription
          </p>
        </div>

        {/* Menu Items */}
        <nav
          style={{
            flex: 1,
            padding: '1rem 0',
            overflowY: 'auto',
          }}
        >
          {menuItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.5rem',
                color: '#374151',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                borderLeft: '4px solid transparent',
                transition: 'all 0.2s',
                animation: `slideInRight 0.3s ease-out ${index * 0.05}s backwards`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderLeftColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderLeftColor = 'transparent';
              }}
            >
              <item.icon className="w-5 h-5" style={{ color: '#667eea' }} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer CTA */}
        <div
          style={{
            padding: '1.5rem',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <Link
            to="/signup"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'block',
              width: '100%',
              padding: '1rem',
              backgroundColor: '#10b981',
              color: '#ffffff',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 'bold',
              textAlign: 'center',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            }}
          >
            Start Free Trial
          </Link>
          <p
            style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textAlign: 'center',
              marginTop: '0.75rem',
              marginBottom: 0,
            }}
          >
            No credit card required • 14 days free
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default MobileMenu;

