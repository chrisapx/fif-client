/**
 * useSessionManager Hook
 *
 * React hook for managing client-side sessions with automatic renewal and timeout.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../utilities/SessionManager';
import { isAuthenticated } from '../utilities/AuthCookieManager';

export const useSessionManager = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Only initialize session manager if user is authenticated
    if (!isAuthenticated()) {
      return;
    }

    // Skip if already initialized to prevent multiple initializations
    if (sessionManager.isSessionActive()) {
      return;
    }

    const handleSessionExpired = () => {
      console.log('Session expired - redirecting to login');
      // Navigate to login page
      navigate('/login', { replace: true });
    };

    const handleSessionRenewed = () => {
      // Optional: You can add visual feedback here
      // console.log('Session renewed');
    };

    // Initialize the session manager
    sessionManager.init(handleSessionExpired, handleSessionRenewed);

    // DO NOT destroy on unmount - session should persist across route changes
    // Session is only destroyed on manual logout or expiration
  }, []); // Empty dependency array - only run once on mount

  return {
    isActive: sessionManager.isSessionActive(),
    destroy: () => sessionManager.destroy(),
    renew: () => sessionManager.renewSession()
  };
};
