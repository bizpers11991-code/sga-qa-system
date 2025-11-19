// components/dashboard/QuickActions.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color?: string;
}

export interface QuickActionsProps {
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  {
    id: 'create-job',
    title: 'Create Job',
    description: 'Start a new job assignment',
    icon: '💼',
    path: '/jobs/create',
    color: 'border-blue-200 hover:border-blue-700 hover:bg-blue-50'
  },
  {
    id: 'submit-report',
    title: 'Submit Report',
    description: 'Complete and submit QA pack',
    icon: '📊',
    path: '/reports/submit',
    color: 'border-green-200 hover:border-green-700 hover:bg-green-50'
  },
  {
    id: 'report-incident',
    title: 'Report Incident',
    description: 'Log safety incident or hazard',
    icon: '⚠️',
    path: '/incidents/create',
    color: 'border-red-200 hover:border-red-700 hover:bg-red-50'
  },
  {
    id: 'view-resources',
    title: 'View Resources',
    description: 'Access documents and specs',
    icon: '📚',
    path: '/resources',
    color: 'border-purple-200 hover:border-purple-700 hover:bg-purple-50'
  }
];

const QuickActions: React.FC<QuickActionsProps> = ({ actions = defaultActions }) => {
  const navigate = useNavigate();

  const handleActionClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => (
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
