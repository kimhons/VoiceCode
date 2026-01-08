/**
 * Product Screenshots Component
 * Displays web, desktop, and mobile app screenshots with device mockups
 */

import React from 'react';
import { Monitor, Smartphone, Laptop } from 'lucide-react';

interface ProductScreenshotsProps {
  isMobile?: boolean;
  isTablet?: boolean;
}

export const ProductScreenshots: React.FC<ProductScreenshotsProps> = ({ isMobile, isTablet }) => {
  return (
    <div style={{
      position: 'relative',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
    }}>
      {/* Main Desktop/Web Screenshot */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        transform: isMobile ? 'none' : 'perspective(1000px) rotateY(-5deg)',
        transition: 'transform 0.3s ease',
      }}
      className="product-screenshot-main">
        {/* Browser Chrome */}
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '12px 12px 0 0',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#febc2e' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28c840' }} />
          </div>
          <div style={{
            flex: 1,
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            padding: '4px 12px',
            fontSize: '12px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Monitor className="w-3 h-3" />
            <span>voiceflowpro.com/app</span>
          </div>
        </div>

        {/* Web App Screenshot */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: isMobile ? '1.5rem' : '2rem',
            color: '#ffffff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>
                🎙️
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>VoiceFlow Pro</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Professional Voice Transcription</div>
              </div>
            </div>
          </div>

          <div style={{ padding: isMobile ? '1.5rem' : '2rem', backgroundColor: '#f9fafb' }}>
            {/* Recording Interface */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: isMobile ? '1.5rem' : '2rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Recording</div>
                <div style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    animation: 'pulse 2s ease-in-out infinite',
                  }} />
                  LIVE
                </div>
              </div>

              {/* Waveform Visualization */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                height: '80px',
                marginBottom: '1rem',
              }}>
                {[20, 40, 60, 80, 50, 70, 90, 60, 40, 70, 85, 65, 45, 75, 95, 70, 50, 80, 60, 40].map((height, i) => (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: `${height}%`,
                      backgroundColor: '#667eea',
                      borderRadius: '2px',
                      animation: `wave 1s ease-in-out infinite`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>

              {/* Timer */}
              <div style={{
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '1rem',
              }}>
                00:02:34
              </div>

              {/* Control Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  ⏸️
                </button>
                <button style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}>
                  ⏹️
                </button>
                <button style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  💾
                </button>
              </div>
            </div>

            {/* Transcription Display */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: isMobile ? '1.5rem' : '2rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                Live Transcription
              </div>
              <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  <span style={{ color: '#667eea', fontWeight: '600' }}>[00:00:12]</span> Welcome to VoiceFlow Pro, 
                  the most advanced voice transcription platform available today.
                </p>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  <span style={{ color: '#667eea', fontWeight: '600' }}>[00:00:24]</span> With support for over 150 languages 
                  and professional modes for medical, legal, and technical transcription...
                </p>
                <p style={{ margin: '0', opacity: 0.5 }}>
                  <span style={{ color: '#667eea', fontWeight: '600' }}>[00:02:34]</span> <span className="typing-cursor">|</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile App Screenshot (Floating) */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          right: '5%',
          zIndex: 4,
          transform: 'perspective(1000px) rotateY(15deg) scale(0.9)',
          transition: 'transform 0.3s ease',
        }}
        className="product-screenshot-mobile">
          {/* Phone Frame */}
          <div style={{
            width: '280px',
            backgroundColor: '#1f2937',
            borderRadius: '32px',
            padding: '12px',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.4)',
          }}>
            {/* Notch */}
            <div style={{
              height: '24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <div style={{
                width: '120px',
                height: '20px',
                backgroundColor: '#000000',
                borderRadius: '0 0 16px 16px',
              }} />
            </div>

            {/* Screen */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              overflow: 'hidden',
              height: '560px',
            }}>
              {/* Mobile App Header */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '1rem',
                color: '#ffffff',
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '0.5rem' }}>VoiceFlow Pro</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Mobile Recording</div>
              </div>

              {/* Mobile Recording Interface */}
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '2rem auto',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
                }}>
                  🎙️
                </div>

                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '0.5rem',
                }}>
                  00:02:34
                </div>

                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '2rem',
                }}>
                  Recording in progress...
                </div>

                {/* Mini Waveform */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  height: '40px',
                  marginBottom: '2rem',
                }}>
                  {[30, 50, 70, 60, 40, 80, 50, 60, 70, 50].map((height, i) => (
                    <div
                      key={i}
                      style={{
                        width: '3px',
                        height: `${height}%`,
                        backgroundColor: '#667eea',
                        borderRadius: '2px',
                      }}
                    />
                  ))}
                </div>

                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '12px',
                  color: '#4b5563',
                  textAlign: 'left',
                  lineHeight: '1.5',
                }}>
                  Welcome to VoiceFlow Pro, the most advanced voice transcription platform...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop App Screenshot (Floating) */}
      {!isMobile && !isTablet && (
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '5%',
          zIndex: 2,
          transform: 'perspective(1000px) rotateY(-15deg) scale(0.85)',
          transition: 'transform 0.3s ease',
          opacity: 0.95,
        }}
        className="product-screenshot-desktop">
          {/* Laptop Frame */}
          <div style={{ width: '400px' }}>
            {/* Screen */}
            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '8px 8px 0 0',
              padding: '8px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '4px',
                overflow: 'hidden',
                height: '240px',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '0.75rem',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}>
                  VoiceFlow Pro Desktop
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#f9fafb', height: '100%' }}>
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '1rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  }}>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '0.5rem' }}>
                      Desktop App - Offline Mode
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '12px',
                      color: '#10b981',
                      fontWeight: '600',
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                      }} />
                      Ready to Record
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Laptop Base */}
            <div style={{
              height: '12px',
              background: 'linear-gradient(to bottom, #374151, #1f2937)',
              borderRadius: '0 0 8px 8px',
            }} />
            <div style={{
              height: '4px',
              background: '#1f2937',
              borderRadius: '0 0 16px 16px',
              margin: '0 -20px',
            }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
        .typing-cursor {
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .product-screenshot-main:hover {
          transform: perspective(1000px) rotateY(0deg) scale(1.02);
        }
        .product-screenshot-mobile:hover {
          transform: perspective(1000px) rotateY(0deg) scale(0.95);
        }
        .product-screenshot-desktop:hover {
          transform: perspective(1000px) rotateY(0deg) scale(0.9);
        }
      `}</style>
    </div>
  );
};

export default ProductScreenshots;

