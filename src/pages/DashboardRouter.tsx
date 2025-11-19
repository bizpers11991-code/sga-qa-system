// pages/DashboardRouter.tsx

import React from 'react';
import useAuth from '../hooks/useAuth';
import Dashboard from './Dashboard';
import EngineerDashboard from './EngineerDashboard';
import { Role } from '../types';

/**
 * Smart router component that displays the appropriate dashboard
 * based on the user's role
 */
const DashboardRouter = () => {
  const { user } = useAuth();

  // Extract user role from account claims
  const userRole = user?.idTokenClaims?.['roles']?.[0] ||
                   user?.idTokenClaims?.['role'] ||
                   'asphalt_foreman'; // Default fallback role

  // Engineer roles should see EngineerDashboard
  const engineerRoles: Role[] = [
    'asphalt_engineer',
    'profiling_engineer',
    'spray_admin',
    'scheduler_admin',
    'management_admin',
    'hseq_manager'
  ];

  const isEngineer = engineerRoles.includes(userRole as Role);

  // Route to appropriate dashboard
  if (isEngineer) {
    return <EngineerDashboard />;
  }

  // Foreman and other roles see the standard Dashboard
  return <Dashboard />;
};

export default DashboardRouter;
