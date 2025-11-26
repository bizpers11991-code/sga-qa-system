import React from 'react';
import { Project } from '../../types';

interface ProjectHeaderProps {
  project: Project;
  onStatusUpdate?: (newStatus: Project['status']) => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, onStatusUpdate }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scoping':
        return 'bg-yellow-100 text-yellow-800';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-green-100 text-green-800';
      case 'QA Review':
        return 'bg-purple-100 text-purple-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      case 'On Hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Tier 1':
        return 'bg-green-100 text-green-800';
      case 'Tier 2':
        return 'bg-yellow-100 text-yellow-800';
      case 'Tier 3':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{project.projectNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(project.clientTier)}`}>
              {project.clientTier}
            </span>
          </div>
          <h2 className="text-xl text-gray-700 mb-4">{project.projectName}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 font-medium">Client:</span>
              <p className="text-gray-900">{project.client}</p>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Location:</span>
              <p className="text-gray-900">{project.location}</p>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Start Date:</span>
              <p className="text-gray-900">{formatDate(project.estimatedStartDate)}</p>
            </div>
            <div>
              <span className="text-gray-500 font-medium">End Date:</span>
              <p className="text-gray-900">{formatDate(project.estimatedEndDate)}</p>
            </div>
          </div>
        </div>

        {onStatusUpdate && (
          <div className="ml-4">
            <select
              value={project.status}
              onChange={(e) => onStatusUpdate(e.target.value as Project['status'])}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent text-sm"
            >
              <option value="Scoping">Scoping</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="QA Review">QA Review</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        )}
      </div>

      {/* Division Pills */}
      <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-600 font-medium">Divisions:</span>
        {project.divisions.map((div) => (
          <span
            key={div.division}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              div.division === 'Asphalt'
                ? 'bg-blue-100 text-blue-800'
                : div.division === 'Profiling'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {div.division}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProjectHeader;
