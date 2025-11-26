import React from 'react';
import { ProjectDivision } from '../../types';

interface DivisionStatusCardProps {
  division: ProjectDivision;
}

const DivisionStatusCard: React.FC<DivisionStatusCardProps> = ({ division }) => {
  const getDivisionColor = (divisionName: string) => {
    switch (divisionName) {
      case 'Asphalt':
        return 'bg-blue-50 border-blue-200';
      case 'Profiling':
        return 'bg-purple-50 border-purple-200';
      case 'Spray':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getDivisionIconColor = (divisionName: string) => {
    switch (divisionName) {
      case 'Asphalt':
        return 'text-blue-600';
      case 'Profiling':
        return 'text-purple-600';
      case 'Spray':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Assigned':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = () => {
    if (division.scheduledDates.length === 0) return 0;
    return Math.round((division.completedDates.length / division.scheduledDates.length) * 100);
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${getDivisionColor(division.division)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg
            className={`w-6 h-6 ${getDivisionIconColor(division.division)}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">{division.division}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(division.status)}`}>
          {division.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {division.assignedEngineerId && (
          <div>
            <span className="text-gray-600 font-medium">Engineer:</span>
            <p className="text-gray-900">{division.assignedEngineerId}</p>
          </div>
        )}

        {division.assignedCrewIds.length > 0 && (
          <div>
            <span className="text-gray-600 font-medium">Crews Assigned:</span>
            <p className="text-gray-900">{division.assignedCrewIds.length}</p>
          </div>
        )}

        {division.scheduledDates.length > 0 && (
          <div>
            <span className="text-gray-600 font-medium">Scheduled Days:</span>
            <p className="text-gray-900">{division.scheduledDates.length}</p>
          </div>
        )}

        {division.qaPackIds.length > 0 && (
          <div>
            <span className="text-gray-600 font-medium">QA Packs:</span>
            <p className="text-gray-900">{division.qaPackIds.length}</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {division.scheduledDates.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{calculateProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-sga-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-600">
            {division.completedDates.length} of {division.scheduledDates.length} days completed
          </div>
        </div>
      )}
    </div>
  );
};

export default DivisionStatusCard;
