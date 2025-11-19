import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../../types';

interface CalendarJobCardProps {
  job: Job;
  foremanName?: string;
}

const divisionColors = {
  Profiling: 'border-blue-500',
  Asphalt: 'border-orange-600',
  Spray: 'border-green-500',
};

const divisionBgColors = {
  Profiling: 'bg-blue-50',
  Asphalt: 'bg-orange-50',
  Spray: 'bg-green-50',
};

const CalendarJobCard: React.FC<CalendarJobCardProps> = ({ job, foremanName }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/jobs/${job.id}`);
  };

  const borderColor = divisionColors[job.division] || 'border-gray-500';
  const bgColor = divisionBgColors[job.division] || 'bg-gray-50';

  return (
    <div
      onClick={handleClick}
      className={`
        mb-2 p-3 rounded-lg border-l-4 ${borderColor} ${bgColor}
        cursor-pointer transition-all duration-200
        hover:shadow-md hover:scale-105
        group
      `}
    >
      {/* Job Number and Client */}
      <div className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-sga-700 transition-colors">
        {job.jobNo} - {job.client}
      </div>

      {/* Foreman Name */}
      {foremanName && (
        <div className="text-xs text-gray-600">
          {foremanName}
        </div>
      )}

      {/* Project Name (if different from client) */}
      {job.projectName && job.projectName !== job.client && (
        <div className="text-xs text-gray-500 mt-1 truncate" title={job.projectName}>
          {job.projectName}
        </div>
      )}

      {/* Location */}
      {job.location && (
        <div className="text-xs text-gray-500 mt-1 truncate" title={job.location}>
          {job.location}
        </div>
      )}
    </div>
  );
};

export default CalendarJobCard;
