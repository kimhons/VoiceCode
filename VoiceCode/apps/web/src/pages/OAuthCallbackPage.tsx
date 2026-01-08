/**
 * OAuth Callback Page
 * Handles OAuth provider redirects after authentication
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseService } from '../services/supabase.service';

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const supabase = getSupabaseService();

        if (!supabase.isAvailable()) {
          throw new Error('Authentication service not available');
        }

        const client = supabase.getClient();

        // Handle the OAuth callback
        const { data, error } = await client.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          // Refresh profile to ensure we have latest user data
          await refreshProfile();

          // Redirect to app
          navigate('/app', { replace: true });
        } else {
          throw new Error('No session found');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [navigate, refreshProfile]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
          }}>⚠️</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#ef4444',
          }}>Authentication Failed</h2>
          <p style={{
            color: '#64748b',
            marginBottom: '20px',
          }}>{error}</p>
          <p style={{
            color: '#94a3b8',
            fontSize: '14px',
          }}>Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px',
        }} />
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '12px',
          color: '#1e293b',
        }}>Completing authentication...</h2>
        <p style={{
          color: '#64748b',
        }}>Please wait while we log you in.</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
