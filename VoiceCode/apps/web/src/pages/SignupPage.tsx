// VoiceFlow Pro - Signup Page

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const SignupPage: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      await signUp(formData.email, formData.password, formData.fullName);
      // Redirect to app on success
      navigate('/app');
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Signup failed. Please try again.';

      // Provide helpful message for common errors
      if (errorMessage.includes('already registered')) {
        setGeneralError('This email is already registered. Please try signing in instead.');
      } else if (errorMessage.includes('Invalid email')) {
        setGeneralError('Please enter a valid email address.');
      } else if (errorMessage.includes('Password')) {
        setGeneralError('Password must be at least 8 characters with uppercase, lowercase, and number.');
      } else if (errorMessage.includes('rate limit')) {
        setGeneralError('Too many signup attempts. Please wait a few minutes and try again.');
      } else {
        setGeneralError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSocialSignup = (provider: string) => {
    // TODO: Implement social signup
    alert(`${provider} signup coming soon!`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: theme === 'dark' ? '#1e1e1e' : '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '480px',
        width: '100%',
        padding: '40px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}>
            VoiceFlow Pro
          </h1>
          <p style={{
            color: theme === 'dark' ? '#a0a0a0' : '#666',
            fontSize: '16px',
          }}>
            Create your account and start your 7-day free trial
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={20} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme === 'dark' ? '#666' : '#999',
              }} />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: errors.fullName 
                    ? '2px solid #ef4444' 
                    : `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: theme === 'dark' ? '#2a2a2a' : '#f9f9f9',
                  color: theme === 'dark' ? '#e0e0e0' : '#333',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                }}
              />
            </div>
            {errors.fullName && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme === 'dark' ? '#666' : '#999',
              }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: errors.email 
                    ? '2px solid #ef4444' 
                    : `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: theme === 'dark' ? '#2a2a2a' : '#f9f9f9',
                  color: theme === 'dark' ? '#e0e0e0' : '#333',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                }}
              />
            </div>
            {errors.email && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme === 'dark' ? '#666' : '#999',
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 44px',
                  border: errors.password 
                    ? '2px solid #ef4444' 
                    : `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: theme === 'dark' ? '#2a2a2a' : '#f9f9f9',
                  color: theme === 'dark' ? '#e0e0e0' : '#333',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#666' : '#999',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> {errors.password}
              </p>
            )}
            <p style={{ color: theme === 'dark' ? '#888' : '#666', fontSize: '12px', marginTop: '4px' }}>
              Min 8 characters, 1 uppercase, 1 lowercase, 1 number
            </p>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme === 'dark' ? '#666' : '#999',
              }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 44px',
                  border: errors.confirmPassword 
                    ? '2px solid #ef4444' 
                    : `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: theme === 'dark' ? '#2a2a2a' : '#f9f9f9',
                  color: theme === 'dark' ? '#e0e0e0' : '#333',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#666' : '#999',
                  padding: '4px',
                }}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
              fontSize: '14px',
            }}>
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (errors.terms) {
                    setErrors(prev => ({ ...prev, terms: '' }));
                  }
                }}
                style={{
                  marginTop: '2px',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                }}
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" style={{ color: '#667eea', textDecoration: 'none' }}>
                  Terms and Conditions
                </Link>
                {' '}and{' '}
                <Link to="/privacy" style={{ color: '#667eea', textDecoration: 'none' }}>
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.terms && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> {errors.terms}
              </p>
            )}
          </div>

          {/* General Error Message */}
          {generalError && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              border: `1px solid ${theme === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertCircle size={18} />
              <span>{generalError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: isLoading 
                ? '#999' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, opacity 0.2s',
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '24px 0',
          gap: '12px',
        }}>
          <div style={{ flex: 1, height: '1px', background: theme === 'dark' ? '#333' : '#ddd' }} />
          <span style={{ color: theme === 'dark' ? '#888' : '#666', fontSize: '14px' }}>
            or continue with
          </span>
          <div style={{ flex: 1, height: '1px', background: theme === 'dark' ? '#333' : '#ddd' }} />
        </div>

        {/* Social Signup */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => handleSocialSignup('Google')}
            style={{
              flex: 1,
              padding: '12px',
              background: theme === 'dark' ? '#2a2a2a' : '#f9f9f9',
              border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
              transition: 'background 0.2s',
            }}
          >
            Google
          </button>
          <button
            onClick={() => handleSocialSignup('GitHub')}
            style={{
              flex: 1,
              padding: '12px',
              background: theme === 'dark' ? '#2a2a2a' : '#f9f9f9',
              border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
              transition: 'background 0.2s',
            }}
          >
            GitHub
          </button>
        </div>

        {/* Login Link */}
        <p style={{
          textAlign: 'center',
          color: theme === 'dark' ? '#a0a0a0' : '#666',
          fontSize: '14px',
        }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;

