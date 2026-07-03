/**
 * Mobile Sticky CTA Button
 * Floating call-to-action button that stays visible on mobile devices
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';

interface MobileStickyCTAProps {
  isMobile?: boolean;
}

export const MobileStickyCTA: React.FC<MobileStickyCTAProps> = ({ isMobile }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after scrolling 300px
      if (window.scrollY > 300 && !isDismissed) {
        setIsVisible(true);
      } else if (window.scrollY <= 300) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (!isMobile || isDismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        right: '1rem',
        zIndex: 999,
        transform: isVisible ? 'translateY(0)' : 'translateY(150%)',
        transition: 'transform 0.3s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: '#10b981',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '0.25rem',
            }}
          >
            Start Your Free Trial
          </div>
          <div
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.75rem',
            }}
          >
            No credit card required • 14 days free
          </div>
        </div>

        <Link
          to="/signup"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            color: '#10b981',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <ArrowRight className="w-6 h-6" />
        </Link>

        <button
          onClick={() => setIsDismissed(true)}
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MobileStickyCTA;

