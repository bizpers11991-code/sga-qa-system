import { ReactNode } from 'react';
import useAuth from '../hooks/useAuth';
import { PageContainer, PageHeader } from '../components/layout';
import { Role } from '../types';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Role[];
}

/**
 * RoleGuard wrapper component that checks user role against allowed roles
 * Shows access denied message if user does not have required role
 */
const RoleGuard = ({ children, allowedRoles }: RoleGuardProps): ReactNode => {
  const { user } = useAuth();

  // Extract user role from account claims (from MSAL)
  // Note: This assumes the role is included in the token claims
  // You may need to adjust this based on your actual token structure
  const userRole = user?.idTokenClaims?.['roles']?.[0] ||
                   user?.idTokenClaims?.['role'] ||
                   'asphalt_foreman'; // Default fallback role

  const hasRequiredRole = allowedRoles.includes(userRole as Role);

  if (!hasRequiredRole) {
    return (
      <PageContainer>
        <PageHeader
          title="Access Denied"
          description="You do not have permission to access this page"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Access Denied' }
          ]}
        />
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0v-2m0 6v2m0 0v2m0-6v-2m0 0v-2m0 6v2m0 0v2m0-6v-2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10h12M6 14h12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Your role ({String(userRole)}) does not have permission to access this resource.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium"
          >
            Return to Dashboard
          </a>
        </div>
      </PageContainer>
    );
  }

  return children;
};

export default RoleGuard;
