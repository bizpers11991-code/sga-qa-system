import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import {
  InteractionStatus
} from '@azure/msal-browser';

export const useAuth = () => {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const user = instance.getActiveAccount();

  const login = () => {
    if (!isAuthenticated && inProgress === InteractionStatus.None) {
      instance.loginRedirect();
    }
  };

  const logout = () => {
    instance.logoutRedirect();
  };

  return {
    isAuthenticated,
    user: user ? {
      name: user.name,
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