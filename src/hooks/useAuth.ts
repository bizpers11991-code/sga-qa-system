import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
  InteractionStatus
} from '@azure/msal-browser';
import { useEffect } from 'react';

export const useAuth = () => {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const user = instance.getActiveAccount();

  useEffect(() => {
    console.log('[useAuth] Auth state changed:', {
      isAuthenticated,
      inProgress,
      user: user?.name || 'No user'
    });
  }, [isAuthenticated, inProgress, user]);

  const login = async () => {
    try {
      console.log('[useAuth] Login requested, inProgress:', inProgress);
      if (!isAuthenticated && inProgress === InteractionStatus.None) {
        console.log('[useAuth] Initiating redirect login...');
        await instance.loginRedirect();
      } else {
        console.log('[useAuth] Cannot login - already authenticated or interaction in progress');
      }
    } catch (error) {
      console.error('[useAuth] Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('[useAuth] Logout requested');
      await instance.logoutRedirect();
    } catch (error) {
      console.error('[useAuth] Logout error:', error);
      throw error;
    }
  };

  return {
    isAuthenticated,
    user: user ? {
      name: user.name || (user.idTokenClaims as any)?.name || user.username || 'User',
      username: user.username,
      localAccountId: user.localAccountId,
      homeAccountId: user.homeAccountId,
      idTokenClaims: user.idTokenClaims,
    } : null,
    login,
    logout,
  };
};

export default useAuth;