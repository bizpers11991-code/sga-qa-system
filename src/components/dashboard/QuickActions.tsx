// components/dashboard/QuickActions.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Role } from '../../types';

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color?: string;
  roles?: Role[] | 'all';
}

export interface QuickActionsProps {
  actions?: QuickAction[];
}

const allActions: QuickAction[] = [
  // Universal actions
  {
    id: 'create-job',
    title: 'Create Job',
    description: 'Start a new job sheet',
    icon: '➕',
    path: '/jobs/create',
    color: 'border-sga-200 hover:border-sga-700 hover:bg-sga-50',
    roles: 'all'
  },
  {
    id: 'view-jobs',
    title: 'View Jobs',
    description: 'Browse all job assignments',
    icon: '💼',
    path: '/jobs',
    color: 'border-blue-200 hover:border-blue-700 hover:bg-blue-50',
    roles: 'all'
  },

  // Tender/Project management
  {
    id: 'create-tender',
    title: 'Create Tender',
    description: 'Submit new tender handover',
    icon: '📝',
    path: '/tenders/create',
    color: 'border-purple-200 hover:border-purple-700 hover:bg-purple-50',
    roles: ['tender_admin', 'management_admin', 'scheduler_admin']
  },
  {
    id: 'view-projects',
    title: 'View Projects',
    description: 'Manage active projects',
    icon: '📁',
    path: '/projects',
    color: 'border-indigo-200 hover:border-indigo-700 hover:bg-indigo-50',
    roles: ['tender_admin', 'management_admin', 'scheduler_admin', 'asphalt_engineer', 'profiling_engineer', 'spray_admin']
  },

  // Scope Reports
  {
    id: 'create-scope-report',
    title: 'Create Scope Report',
    description: 'Submit site assessment',
    icon: '📋',
    path: '/scope-reports/create',
    color: 'border-teal-200 hover:border-teal-700 hover:bg-teal-50',
    roles: ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'tender_admin']
  },

  // Division Requests
  {
    id: 'division-requests',
    title: 'Division Requests',
    description: 'Manage cross-division work',
    icon: '↔️',
    path: '/division-requests/inbox',
    color: 'border-amber-200 hover:border-amber-700 hover:bg-amber-50',
    roles: ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'scheduler_admin', 'management_admin']
  },

  // Reports and QA
  {
    id: 'view-reports',
    title: 'QA Reports',
    description: 'Review quality reports',
    icon: '📊',
    path: '/reports',
    color: 'border-green-200 hover:border-green-700 hover:bg-green-50',
    roles: 'all'
  },

  // Scheduler
  {
    id: 'view-scheduler',
    title: 'Scheduler',
    description: 'View work schedule',
    icon: '📅',
    path: '/scheduler',
    color: 'border-orange-200 hover:border-orange-700 hover:bg-orange-50',
    roles: 'all'
  },
  {
    id: 'project-scheduler',
    title: 'Project Timeline',
    description: 'Manage project schedules',
    icon: '📆',
    path: '/scheduler/projects',
    color: 'border-cyan-200 hover:border-cyan-700 hover:bg-cyan-50',
    roles: ['scheduler_admin', 'management_admin', 'asphalt_engineer', 'profiling_engineer', 'spray_admin']
  },

  // Incidents
  {
    id: 'view-incidents',
    title: 'Incidents',
    description: 'Safety incident reports',
    icon: '⚠️',
    path: '/incidents',
    color: 'border-red-200 hover:border-red-700 hover:bg-red-50',
    roles: 'all'
  },

  // Resources
  {
    id: 'view-resources',
    title: 'Resources',
    description: 'Crew and equipment',
    icon: '👥',
    path: '/resources',
    color: 'border-violet-200 hover:border-violet-700 hover:bg-violet-50',
    roles: 'all'
  },

  // Admin
  {
    id: 'admin-panel',
    title: 'Admin Panel',
    description: 'System management',
    icon: '⚙️',
    path: '/admin',
    color: 'border-gray-200 hover:border-gray-700 hover:bg-gray-50',
    roles: ['management_admin', 'scheduler_admin']
  }
];

const getActionsForRole = (userRole?: Role): QuickAction[] => {
  if (!userRole) return allActions.filter(a => a.roles === 'all').slice(0, 6);

  return allActions.filter(action => {
    if (action.roles === 'all') return true;
    if (Array.isArray(action.roles)) return action.roles.includes(userRole);
    return false;
  }).slice(0, 6); // Limit to 6 actions for clean layout
};

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get role from idTokenClaims or default to undefined
  const userRole = user?.idTokenClaims?.['roles']?.[0] as Role | undefined;

  // Use role-based actions if not provided
  const displayActions = actions || getActionsForRole(userRole);

  const handleActionClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action.path)}
            className={`flex items-start p-4 rounded-lg border-2 transition-all group text-left min-h-touch ${
              action.color || 'border-sga-200 hover:border-sga-700 hover:bg-sga-50'
            }`}
            aria-label={action.title}
          >
            <span className="text-2xl mr-3 flex-shrink-0" role="img" aria-hidden="true">
              {action.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 group-hover:text-sga-700 transition-colors">
                {action.title}
              </p>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {action.description}
              </p>
            </div>
            <span className="ml-2 text-gray-400 group-hover:text-sga-700 transition-colors flex-shrink-0">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
