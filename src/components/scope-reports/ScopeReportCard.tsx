import React from 'react';
import { ScopeReport } from '../../types/project-management';
import { Calendar, MapPin, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface ScopeReportCardProps {
  report: ScopeReport;
  onClick?: () => void;
}

/**
 * Card component for displaying scope report in list view
 */
export function ScopeReportCard({ report, onClick }: ScopeReportCardProps) {
  const getStatusBadge = (status: ScopeReport['status']) => {
    const badges = {
      Draft: 'bg-gray-100 text-gray-800',
      Submitted: 'bg-blue-100 text-blue-800',
      Reviewed: 'bg-green-100 text-green-800'
    };

    const icons = {
      Draft: Clock,
      Submitted: CheckCircle,
      Reviewed: CheckCircle
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

  const getConditionColor = (condition: string) => {
    const colors = {
      Good: 'text-green-600',
      Fair: 'text-yellow-600',
      Poor: 'text-orange-600',
      Critical: 'text-red-600'
    };
    return colors[condition as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{report.reportNumber}</h3>
          <p className="text-sm text-gray-500">Visit {report.visitNumber} - {report.visitType}</p>
        </div>
        {getStatusBadge(report.status)}
      </div>

      {/* Date and Location */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Scheduled: {new Date(report.scheduledDate).toLocaleDateString()}</span>
          {report.actualDate && (
            <span className="ml-2">
              | Completed: {new Date(report.actualDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Surface Condition */}
      <div className="mb-3">
        <span className="text-sm font-medium text-gray-700">Surface Condition: </span>
        <span className={`text-sm font-semibold ${getConditionColor(report.surfaceCondition.currentCondition)}`}>
          {report.surfaceCondition.currentCondition}
        </span>
      </div>

      {/* Key Info */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Area:</span>
          <span className="ml-1 font-medium">{report.measurements.area} m²</span>
        </div>
        <div>
          <span className="text-gray-500">Depth:</span>
          <span className="ml-1 font-medium">{report.measurements.depth} mm</span>
        </div>
        <div>
          <span className="text-gray-500">Duration:</span>
          <span className="ml-1 font-medium">{report.estimatedDuration} days</span>
        </div>
        <div>
          <span className="text-gray-500">Photos:</span>
          <span className="ml-1 font-medium">{report.photos.length}</span>
        </div>
      </div>

      {/* Hazards Alert */}
      {report.hazards.identified && report.hazards.hazardList.length > 0 && (
        <div className="mt-3 flex items-center text-sm text-amber-600 bg-amber-50 p-2 rounded">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span>{report.hazards.hazardList.length} hazard(s) identified</span>
        </div>
      )}

      {/* Recommendations Preview */}
      {report.recommendations && (
        <div className="mt-3 text-sm text-gray-600 line-clamp-2">
          <span className="font-medium">Recommendations:</span> {report.recommendations}
        </div>
      )}
    </div>
  );
}
