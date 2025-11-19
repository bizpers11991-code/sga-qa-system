// components/dashboard/StatsCard.tsx

import React from 'react';

export interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  loading?: boolean;
  color?: 'blue' | 'amber' | 'red' | 'green';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  loading = false,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-blue-100',
    amber: 'bg-amber-100',
    red: 'bg-red-100',
    green: 'bg-green-100'
  };

  const iconBgClass = colorClasses[color];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600 font-medium truncate">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500 ml-2">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 ${iconBgClass} rounded-full flex items-center justify-center flex-shrink-0 ml-4`}
        >
          <span className="text-2xl" role="img" aria-label={title}>
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
