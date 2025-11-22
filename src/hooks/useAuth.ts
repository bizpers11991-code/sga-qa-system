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
    user: {
      name: user?.name,
      // Add other user properties as needed
    },
    login,
    logout,
  };
};

export default useAuth;