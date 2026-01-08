/**
 * Theme Preview Component
 * Phase 5.2: Customizable Themes
 * 
 * Preview how the theme looks with sample UI elements
 */

import React from 'react';
import { useTheme } from '../hooks/useTheme';

export const ThemePreview: React.FC = () => {
  const { theme } = useTheme({ autoLoad: true });

  if (!theme) {
    return null;
  }

  return (
    <div style={{
      padding: 'var(--spacing-xl, 24px)',
      fontFamily: 'var(--font-family, Arial, sans-serif)',
      backgroundColor: 'var(--color-background, #ffffff)',
      color: 'var(--color-text, #212529)',
      minHeight: '100vh',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: 'var(--spacing-lg, 16px)' }}>
          Theme Preview: {theme.name}
        </h1>
        <p style={{ color: 'var(--color-text-secondary, #6c757d)', marginBottom: 'var(--spacing-2xl, 32px)' }}>
          See how your theme looks with various UI elements
        </p>

        {/* Typography */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          marginBottom: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
        }}>
          <h2 style={{ marginTop: 0 }}>Typography</h2>
          <h1 style={{ fontSize: 'var(--font-size-4xl, 2.25rem)' }}>Heading 1 - Extra Large</h1>
          <h2 style={{ fontSize: 'var(--font-size-3xl, 1.875rem)' }}>Heading 2 - Large</h2>
          <h3 style={{ fontSize: 'var(--font-size-2xl, 1.5rem)' }}>Heading 3 - Medium</h3>
          <h4 style={{ fontSize: 'var(--font-size-xl, 1.25rem)' }}>Heading 4 - Small</h4>
          <p style={{ fontSize: 'var(--font-size-base, 1rem)' }}>
            Body text - This is a paragraph with normal body text. The quick brown fox jumps over the lazy dog.
          </p>
          <p style={{ fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--color-text-secondary, #6c757d)' }}>
            Small text - This is smaller text often used for captions and secondary information.
          </p>
          <p style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-tertiary, #adb5bd)' }}>
            Extra small text - This is the smallest text size used for fine print.
          </p>
        </div>

        {/* Buttons */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          marginBottom: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
        }}>
          <h2 style={{ marginTop: 0 }}>Buttons</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md, 12px)' }}>
            <button style={{
              padding: 'var(--spacing-md, 12px) var(--spacing-lg, 16px)',
              backgroundColor: 'var(--color-primary, #007bff)',
              color: 'var(--color-text-inverse, #ffffff)',
              border: 'none',
              borderRadius: 'var(--border-radius-md, 8px)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base, 1rem)',
              fontWeight: '500',
            }}>
              Primary Button
            </button>
            <button style={{
              padding: 'var(--spacing-md, 12px) var(--spacing-lg, 16px)',
              backgroundColor: 'var(--color-secondary, #6c757d)',
              color: 'var(--color-text-inverse, #ffffff)',
              border: 'none',
              borderRadius: 'var(--border-radius-md, 8px)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base, 1rem)',
              fontWeight: '500',
            }}>
              Secondary Button
            </button>
            <button style={{
              padding: 'var(--spacing-md, 12px) var(--spacing-lg, 16px)',
              backgroundColor: 'var(--color-success, #28a745)',
              color: 'var(--color-text-inverse, #ffffff)',
              border: 'none',
              borderRadius: 'var(--border-radius-md, 8px)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base, 1rem)',
              fontWeight: '500',
            }}>
              Success Button
            </button>
            <button style={{
              padding: 'var(--spacing-md, 12px) var(--spacing-lg, 16px)',
              backgroundColor: 'var(--color-warning, #ffc107)',
              color: 'var(--color-text, #212529)',
              border: 'none',
              borderRadius: 'var(--border-radius-md, 8px)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base, 1rem)',
              fontWeight: '500',
            }}>
              Warning Button
            </button>
            <button style={{
              padding: 'var(--spacing-md, 12px) var(--spacing-lg, 16px)',
              backgroundColor: 'var(--color-error, #dc3545)',
              color: 'var(--color-text-inverse, #ffffff)',
              border: 'none',
              borderRadius: 'var(--border-radius-md, 8px)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base, 1rem)',
              fontWeight: '500',
            }}>
              Error Button
            </button>
            <button style={{
              padding: 'var(--spacing-md, 12px) var(--spacing-lg, 16px)',
              backgroundColor: 'transparent',
              color: 'var(--color-primary, #007bff)',
              border: '2px solid var(--color-primary, #007bff)',
              borderRadius: 'var(--border-radius-md, 8px)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base, 1rem)',
              fontWeight: '500',
            }}>
              Outline Button
            </button>
          </div>
        </div>

        {/* Cards */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          marginBottom: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
        }}>
          <h2 style={{ marginTop: 0 }}>Cards</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg, 16px)' }}>
            <div style={{
              padding: 'var(--spacing-lg, 16px)',
              backgroundColor: 'var(--color-background-secondary, #f8f9fa)',
              border: '1px solid var(--color-border-light, #e9ecef)',
              borderRadius: 'var(--border-radius-md, 8px)',
            }}>
              <h3 style={{ marginTop: 0 }}>Card Title</h3>
              <p style={{ color: 'var(--color-text-secondary, #6c757d)' }}>
                This is a card with some content. Cards are great for organizing information.
              </p>
              <button style={{
                padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
                backgroundColor: 'var(--color-primary, #007bff)',
                color: 'var(--color-text-inverse, #ffffff)',
                border: 'none',
                borderRadius: 'var(--border-radius-sm, 4px)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm, 0.875rem)',
              }}>
                Learn More
              </button>
            </div>
            <div style={{
              padding: 'var(--spacing-lg, 16px)',
              backgroundColor: 'var(--color-background-secondary, #f8f9fa)',
              border: '1px solid var(--color-border-light, #e9ecef)',
              borderRadius: 'var(--border-radius-md, 8px)',
            }}>
              <h3 style={{ marginTop: 0 }}>Another Card</h3>
              <p style={{ color: 'var(--color-text-secondary, #6c757d)' }}>
                Cards can contain any type of content including text, images, and buttons.
              </p>
              <button style={{
                padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
                backgroundColor: 'var(--color-secondary, #6c757d)',
                color: 'var(--color-text-inverse, #ffffff)',
                border: 'none',
                borderRadius: 'var(--border-radius-sm, 4px)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm, 0.875rem)',
              }}>
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          marginBottom: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
        }}>
          <h2 style={{ marginTop: 0 }}>Alerts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md, 12px)' }}>
            <div style={{
              padding: 'var(--spacing-md, 12px)',
              backgroundColor: 'var(--color-primary-light, #cce5ff)',
              color: 'var(--color-primary-dark, #004085)',
              border: '1px solid var(--color-primary, #007bff)',
              borderRadius: 'var(--border-radius-md, 8px)',
            }}>
              <strong>Info:</strong> This is an informational alert message.
            </div>
            <div style={{
              padding: 'var(--spacing-md, 12px)',
              backgroundColor: '#d4edda',
              color: '#155724',
              border: '1px solid var(--color-success, #28a745)',
              borderRadius: 'var(--border-radius-md, 8px)',
            }}>
              <strong>Success:</strong> Your action was completed successfully!
            </div>
            <div style={{
              padding: 'var(--spacing-md, 12px)',
              backgroundColor: '#fff3cd',
              color: '#856404',
              border: '1px solid var(--color-warning, #ffc107)',
              borderRadius: 'var(--border-radius-md, 8px)',
            }}>
              <strong>Warning:</strong> Please be careful with this action.
            </div>
            <div style={{
              padding: 'var(--spacing-md, 12px)',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              border: '1px solid var(--color-error, #dc3545)',
              borderRadius: 'var(--border-radius-md, 8px)',
            }}>
              <strong>Error:</strong> Something went wrong. Please try again.
            </div>
          </div>
        </div>

        {/* Form Elements */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          marginBottom: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
        }}>
          <h2 style={{ marginTop: 0 }}>Form Elements</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md, 12px)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs, 4px)', fontWeight: '500' }}>
                Text Input
              </label>
              <input
                type="text"
                placeholder="Enter text..."
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md, 12px)',
                  border: '1px solid var(--color-border, #dee2e6)',
                  borderRadius: 'var(--border-radius-md, 8px)',
                  fontSize: 'var(--font-size-base, 1rem)',
                  backgroundColor: 'var(--color-background, #ffffff)',
                  color: 'var(--color-text, #212529)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs, 4px)', fontWeight: '500' }}>
                Select Dropdown
              </label>
              <select style={{
                width: '100%',
                padding: 'var(--spacing-md, 12px)',
                border: '1px solid var(--color-border, #dee2e6)',
                borderRadius: 'var(--border-radius-md, 8px)',
                fontSize: 'var(--font-size-base, 1rem)',
                backgroundColor: 'var(--color-background, #ffffff)',
                color: 'var(--color-text, #212529)',
              }}>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs, 4px)', fontWeight: '500' }}>
                Textarea
              </label>
              <textarea
                placeholder="Enter multiple lines..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: 'var(--spacing-md, 12px)',
                  border: '1px solid var(--color-border, #dee2e6)',
                  borderRadius: 'var(--border-radius-md, 8px)',
                  fontSize: 'var(--font-size-base, 1rem)',
                  backgroundColor: 'var(--color-background, #ffffff)',
                  color: 'var(--color-text, #212529)',
                  resize: 'vertical',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm, 8px)' }}>
              <input type="checkbox" id="checkbox1" />
              <label htmlFor="checkbox1">Checkbox option</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm, 8px)' }}>
              <input type="radio" id="radio1" name="radio" />
              <label htmlFor="radio1">Radio option 1</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm, 8px)' }}>
              <input type="radio" id="radio2" name="radio" />
              <label htmlFor="radio2">Radio option 2</label>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
        }}>
          <h2 style={{ marginTop: 0 }}>Color Palette</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--spacing-md, 12px)' }}>
            {[
              { name: 'Primary', color: 'var(--color-primary, #007bff)' },
              { name: 'Secondary', color: 'var(--color-secondary, #6c757d)' },
              { name: 'Success', color: 'var(--color-success, #28a745)' },
              { name: 'Warning', color: 'var(--color-warning, #ffc107)' },
              { name: 'Error', color: 'var(--color-error, #dc3545)' },
              { name: 'Info', color: 'var(--color-info, #17a2b8)' },
              { name: 'Accent', color: 'var(--color-accent, #007bff)' },
            ].map((item) => (
              <div key={item.name} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '100%',
                  height: '80px',
                  backgroundColor: item.color,
                  borderRadius: 'var(--border-radius-md, 8px)',
                  marginBottom: 'var(--spacing-xs, 4px)',
                  border: '1px solid var(--color-border, #dee2e6)',
                }} />
                <div style={{ fontSize: 'var(--font-size-sm, 0.875rem)', fontWeight: '500' }}>
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemePreview;

