/**
 * Protected Route Component
 * Requires authentication to access
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // E2E bypass: if flag is set, allow access immediately
  // SECURITY: Guarded by import.meta.env.DEV so Vite dead-code-eliminates
  // this entire block in production builds.
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_E2E_AUTH_BYPASS === 'true') {
    try {
      const win: any = typeof window !== 'undefined' ? window : {};
      const e2eBypass = win.__E2E_FAKE_AUTH === '1' || (typeof localStorage !== 'undefined' && localStorage.getItem('__E2E_FAKE_AUTH') === '1');
      if (e2eBypass) {
        return <>{children}</>;
      }
    } catch {
      // Ignore errors accessing window/localStorage (e.g., SSR, restricted contexts)
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#4f46e5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{
            color: '#6b7280',
            fontSize: '1rem',
          }}>Checking authentication...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;

