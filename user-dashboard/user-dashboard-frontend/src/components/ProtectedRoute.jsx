/**
 * Auth Protection HOC
 * Protects routes by checking auth status via API call
 * (No client-side token checking since we use HttpOnly cookies)
 */

import { useEffect, useState } from 'react';
import { API_CONFIG } from '../utils/constants';
import { LoadingSpinner } from './LoadingSpinner';

export function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch user profile - cookies sent automatically
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/profile`, {
          credentials: 'include'
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Not authenticated - redirect to Auth Service
          window.location.href = `${API_CONFIG.AUTH_SERVICE_URL}/login`;
        }
      } catch (err) {
        // Network error or auth failure - redirect to Auth Service
        window.location.href = `${API_CONFIG.AUTH_SERVICE_URL}/login`;
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <LoadingSpinner size="lg" text="Checking authentication..." />;
  }

  return children;
}
