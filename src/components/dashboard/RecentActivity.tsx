// components/dashboard/RecentActivity.tsx

import React from 'react';
import { getRelativeTime, RecentActivityItem } from '../../services/dashboardApi';
import { useNavigate } from 'react-router-dom';

export interface RecentActivityProps {
  activities: RecentActivityItem[];
  loading?: boolean;
  onRefresh?: () => void;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  loading = false,
  onRefresh
}) => {
  const navigate = useNavigate();

  const handleActivityClick = (activity: RecentActivityItem) => {
    // Navigate to appropriate page based on activity type
    switch (activity.type) {
      case 'job':
        navigate(`/jobs`);
        break;
      case 'report':
        navigate(`/reports`);
        break;
      case 'incident':
        navigate(`/incidents`);
        break;
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      amber: 'bg-amber-100 text-amber-800',
      purple: 'bg-purple-100 text-purple-800'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          {onRefresh && (
            <button
              disabled
              className="px-3 py-1.5 text-sm text-gray-400 rounded-lg cursor-not-allowed"
              aria-label="Refresh activity"
            >
              Refresh
            </button>
          )}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              {i < 5 && <div className="border-l-2 border-gray-200 h-8 ml-4 my-2"></div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 text-sm text-sga-700 hover:bg-sga-50 rounded-lg transition-colors min-h-touch"
              aria-label="Refresh activity"
            >
              Refresh
            </button>
          )}
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-500 font-medium mb-1">No Recent Activity</p>
          <p className="text-sm text-gray-400">
            Your recent jobs, reports, and incidents will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-sm text-sga-700 hover:bg-sga-50 rounded-lg transition-colors min-h-touch"
            aria-label="Refresh activity"
          >
            Refresh
          </button>
        )}
      </div>
      <div className="relative">
        {activities.map((activity, index) => (
          <div key={activity.id}>
            <button
              onClick={() => handleActivityClick(activity)}
              className="flex items-start space-x-3 w-full text-left hover:bg-gray-50 rounded-lg p-2 -ml-2 transition-colors group"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getColorClasses(
                  activity.color
                )}`}
              >
                <span className="text-sm" role="img" aria-hidden="true">
                  {activity.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 group-hover:text-sga-700 transition-colors text-sm">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {getRelativeTime(activity.timestamp)}
                </p>
              </div>
            </button>
            {index < activities.length - 1 && (
              <div className="border-l-2 border-gray-200 h-6 ml-5 my-1"></div>
            )}
          </div>
        ))}
      </div>
      {activities.length >= 10 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/jobs')}
            className="text-sm text-sga-700 hover:text-sga-600 font-medium transition-colors"
          >
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
