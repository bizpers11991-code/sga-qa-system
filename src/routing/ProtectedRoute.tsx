import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute wrapper component that checks authentication status
 * Redirects to login if user is not authenticated
 * Note: AppShell is already applied in App.tsx, so we don't wrap it here
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
