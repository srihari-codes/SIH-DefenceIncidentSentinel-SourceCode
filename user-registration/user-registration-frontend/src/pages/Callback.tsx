import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeAuthCode } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { ROLE_REDIRECTS } from '@/lib/constants';
import type { RoleKey } from '@/types';

/**
 * Callback page for OAuth-like authorization code flow
 * Receives code from auth server, exchanges it for tokens, and redirects to dashboard
 */
export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExchanging, setIsExchanging] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setError('No authorization code provided');
      toast({
        title: 'Invalid Request',
        description: 'No authorization code provided',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const exchangeCode = async () => {
      try {
        console.log('[Callback] Exchanging authorization code...');
        const result = await exchangeAuthCode(code);

        if (result.success && result.data) {
          console.log('[Callback] Code exchange successful, storing tokens and redirecting');
          
          // Store tokens in localStorage (cross-domain - tokens in response body)
          localStorage.setItem('access_token', result.data.access_token);
          localStorage.setItem('refresh_token', result.data.refresh_token);
          localStorage.setItem('user', JSON.stringify(result.data.user));
          
          const role = result.data.user.role as RoleKey;

          // Redirect based on role (use same logic as forms)
          let redirectPath = '/dashboard';
          
          const target = ROLE_REDIRECTS[role] || ROLE_REDIRECTS.default;
          
          if (target.startsWith('http')) {
            window.location.href = target;
          } else {
            navigate(target, { replace: true });
          }
          return;

          // For local redirects, use navigate
          navigate(redirectPath, { replace: true });
        } else {
          const errorMsg = result.error?.message || 'Invalid or expired authorization code';
          setError(errorMsg);
          console.error('[Callback] Code exchange failed:', errorMsg);
          
          toast({
            title: 'Authentication Failed',
            description: errorMsg,
            variant: 'destructive',
          });
          
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
      } catch (error) {
        const errorMsg = 'Failed to complete authentication';
        setError(errorMsg);
        console.error('[Callback] Code exchange error:', error);
        
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      } finally {
        setIsExchanging(false);
      }
    };

    exchangeCode();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8 bg-white rounded-xl shadow-lg max-w-md">
        {isExchanging ? (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Completing Authentication
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your credentials...
              </p>
            </div>
          </>
        ) : error ? (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Authentication Failed
              </h2>
              <p className="text-gray-600">{error}</p>
              <p className="text-sm text-gray-500">Redirecting to login...</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Success!
              </h2>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
