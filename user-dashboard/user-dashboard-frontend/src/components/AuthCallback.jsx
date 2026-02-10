/**
 * Auth Callback Handler
 * Handles the OAuth callback from Auth Sentinel service
 * Auth Service will set HttpOnly cookies, frontend just redirects
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_CONFIG } from '../utils/constants';
import { LoadingSpinner } from './LoadingSpinner';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Get authorization code from URL
      const code = searchParams.get('code');

      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        // Exchange code for tokens (backend will set HttpOnly cookies)
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', // CRITICAL: Allow cookies to be set
          body: JSON.stringify({ code })
        });

        if (!response.ok) {
          throw new Error('Failed to exchange authorization code');
        }

        // Backend has set HttpOnly cookies, just redirect to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
        
        // Redirect back to auth service login after 3 seconds
        setTimeout(() => {
          window.location.href = `${API_CONFIG.AUTH_SERVICE_URL}/login`;
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-gray-600 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <LoadingSpinner size="lg" text="Completing authentication..." />
      </div>
    </div>
  );
}
