import React from 'react';
import { DivisionRequest } from '../../types/project-management';
import { Calendar, MapPin, Users, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface DivisionRequestCardProps {
  request: DivisionRequest;
  onClick?: () => void;
  showProject?: boolean;
}

/**
 * Card component for displaying division request in list view
 */
export function DivisionRequestCard({ request, onClick, showProject = true }: DivisionRequestCardProps) {
  const getStatusBadge = (status: DivisionRequest['status']) => {
    const badges = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Accepted: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Completed: 'bg-blue-100 text-blue-800'
    };

    const icons = {
      Pending: Clock,
      Accepted: CheckCircle,
      Rejected: XCircle,
      Completed: CheckCircle
    };

    const Icon = icons[status];
    const colorClass = badges[status];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const getDivisionBadge = (division: string) => {
    const colors = {
      Asphalt: 'bg-gray-800 text-white',
      Profiling: 'bg-orange-600 text-white',
      Spray: 'bg-blue-600 text-white'
    };
    return colors[division as keyof typeof colors] || 'bg-gray-600 text-white';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{request.requestNumber}</h3>
          <p className="text-sm text-gray-500">Project: {request.projectId}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(request.status)}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDivisionBadge(request.requestedDivision)}`}>
            {request.requestedDivision}
          </span>
        </div>
      </div>

      {/* Work Description */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 line-clamp-2">{request.workDescription}</p>
      </div>

      {/* Location and Dates */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{request.location}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            Requested: {request.requestedDates.map(d => new Date(d).toLocaleDateString()).join(', ')}
          </span>
        </div>
        {request.confirmedDates && request.confirmedDates.length > 0 && (
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span>
              Confirmed: {request.confirmedDates.map(d => new Date(d).toLocaleDateString()).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Assignment Info */}
      {(request.assignedCrewId || request.assignedForemanId) && (
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <Users className="w-4 h-4 mr-2" />
          <span>
            {request.assignedForemanId && `Foreman: ${request.assignedForemanId}`}
            {request.assignedCrewId && ` | Crew: ${request.assignedCrewId}`}
          </span>
        </div>
      )}

      {/* Response Notes */}
      {request.responseNotes && (
        <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
          <span className="font-medium">Response:</span> {request.responseNotes}
        </div>
      )}

      {/* Completion Info */}
      {request.completedAt && (
        <div className="mt-3 flex items-center text-sm text-green-600 bg-green-50 p-2 rounded">
          <CheckCircle className="w-4 h-4 mr-2" />
          <span>Completed: {new Date(request.completedAt).toLocaleDateString()}</span>
          {request.qaPackId && (
            <span className="ml-2">| QA Pack: {request.qaPackId}</span>
          )}
        </div>
      )}

      {/* Pending Alert */}
      {request.status === 'Pending' && (
        <div className="mt-3 flex items-center text-sm text-amber-600 bg-amber-50 p-2 rounded">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>Awaiting response from {request.requestedTo}</span>
        </div>
      )}
    </div>
  );
}
