import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { AppShell, PageContainer } from '../components/layout';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute wrapper component that checks authentication status
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell>{children}</AppShell>;
};

export default ProtectedRoute;
