import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route Wrapper
 * Redirects to login if no access token is found
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('access_token');

  useEffect(() => {
    if (!accessToken) {
      console.log('[ProtectedRoute] No access token found, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [accessToken, navigate]);

  // Don't render children until auth is verified
  if (!accessToken) {
    return null;
  }

  return <>{children}</>;
}
