// VoiceFlow Pro - Login Page

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      console.log('Attempting login for:', formData.email);
      await signIn(formData.email, formData.password);
      console.log('Login successful! Redirecting to /app');
      // Redirect to app on success
      navigate('/app');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      console.error('Error message:', errorMessage);
      setGeneralError(errorMessage);
    } finally {
      console.log('Login attempt complete, setting isLoading to false');
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

  const handleSocialLogin = (provider: string) => {
    // TODO: Implement social login
    alert(`${provider} login coming soon!`);
  };

  const handleDemoMode = () => {
    console.log('Demo mode - bypassing authentication');
    // For development: bypass authentication
    navigate('/app');
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
        maxWidth: '440px',
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
            Welcome back! Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* General Error */}
          {generalError && (
            <div style={{
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertCircle size={18} color="#ef4444" />
              <p style={{ color: '#ef4444', fontSize: '14px', margin: 0 }}>
                {generalError}
              </p>
            </div>
          )}

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
          <div style={{ marginBottom: '16px' }}>
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
                placeholder="Enter your password"
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
          </div>

          {/* Remember Me & Forgot Password */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#e0e0e0' : '#333',
              fontSize: '14px',
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                }}
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Forgot Password?
            </Link>
          </div>

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
            {isLoading ? 'Signing In...' : 'Sign In'}
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

        {/* Social Login */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => handleSocialLogin('Google')}
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
            onClick={() => handleSocialLogin('GitHub')}
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

        {/* Demo Mode Button */}
        <button
          onClick={handleDemoMode}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 87, 108, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          🚀 Demo Mode (Skip Login)
        </button>

        {/* Signup Link */}
        <p style={{
          textAlign: 'center',
          color: theme === 'dark' ? '#a0a0a0' : '#666',
          fontSize: '14px',
        }}>
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Sign Up
          </Link>
        </p>

        {/* Trial Notice */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: theme === 'dark' 
            ? 'rgba(102, 126, 234, 0.1)' 
            : 'rgba(102, 126, 234, 0.05)',
          borderRadius: '8px',
          border: `1px solid ${theme === 'dark' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)'}`,
        }}>
          <p style={{
            color: theme === 'dark' ? '#a0a0a0' : '#666',
            fontSize: '13px',
            textAlign: 'center',
            margin: 0,
          }}>
            🎉 New users get a <strong style={{ color: '#667eea' }}>7-day free trial</strong> of all features!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

