import { useState } from 'react';
import { Incident, updateIncidentStatus } from '../../services/incidentsApi';
import useAuth from '../../hooks/useAuth';

interface IncidentCardProps {
  incident: Incident;
  onStatusUpdate?: () => void;
  onViewDetail?: (incident: Incident) => void;
}

const IncidentCard = ({ incident, onStatusUpdate, onViewDetail }: IncidentCardProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateComment, setUpdateComment] = useState('');
  const [newStatus, setNewStatus] = useState(incident.status);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-red-50 text-red-700 border-red-500';
      case 'Under Investigation':
        return 'bg-blue-50 text-blue-700 border-blue-500';
      case 'Closed':
        return 'bg-green-50 text-green-700 border-green-500';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Incident':
        return '🚨';
      case 'Near Miss':
        return '⚠️';
      case 'Hazard':
        return '⚡';
      default:
        return '📋';
    }
  };

  const handleStatusUpdate = async () => {
    if (!updateComment.trim()) {
      alert('Please provide a comment for the status update');
      return;
    }

    setIsUpdatingStatus(true);

    try {
      await updateIncidentStatus(incident.id, {
        status: newStatus,
        comment: updateComment,
        updatedBy: user?.name || user?.username || 'Unknown User',
      });

      setShowUpdateForm(false);
      setUpdateComment('');

      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200">
      {/* Emergency Banner */}
      {incident.isEmergency && (
        <div className="bg-red-600 text-white px-4 py-2 rounded-t-lg font-semibold text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          EMERGENCY - REQUIRES IMMEDIATE ATTENTION
        </div>
      )}

      {/* Main Card Content */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          {/* Left: Incident Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-2xl">{getTypeIcon(incident.type)}</span>
              <h3 className="text-xl font-bold text-gray-900">{incident.incidentId}</h3>
              <span className={`px-2 py-1 rounded border text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
                {incident.severity}
              </span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {incident.type}
              </span>
            </div>

            <p className="text-gray-700 mb-3 line-clamp-2">{incident.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {incident.location}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {formatDate(incident.reportedDate)}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                {incident.reportedBy}
              </span>
            </div>
          </div>

          {/* Right: Status Badge */}
          <div className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap border-l-4 ${getStatusColor(incident.status)}`}>
            {incident.status}
          </div>
        </div>

        {/* Photo Thumbnails */}
        {incident.photos && incident.photos.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {incident.photos.slice(0, 4).map((photo, index) => (
              <img
                key={index}
                src={photo.dataUrl}
                alt={`Incident photo ${index + 1}`}
                className="w-20 h-20 object-cover rounded border border-gray-300 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(photo.dataUrl, '_blank')}
              />
            ))}
            {incident.photos.length > 4 && (
              <div className="w-20 h-20 bg-gray-100 rounded border border-gray-300 flex items-center justify-center text-sm font-semibold text-gray-600">
                +{incident.photos.length - 4}
              </div>
            )}
          </div>
        )}

        {/* GPS Location */}
        {incident.gpsLocation && (
          <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>
              GPS: {incident.gpsLocation.latitude.toFixed(6)}, {incident.gpsLocation.longitude.toFixed(6)}
            </span>
            <a
              href={`https://www.google.com/maps?q=${incident.gpsLocation.latitude},${incident.gpsLocation.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View on Map
            </a>
          </div>
        )}

        {/* Timeline */}
        {isExpanded && incident.updates && incident.updates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h4>
            <div className="space-y-3">
              {incident.updates.map((update, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{update.status}</p>
                    <p className="text-sm text-gray-600">{update.comment}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {update.updatedBy} - {formatDate(update.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Update Form */}
        {showUpdateForm && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h4>
            <div className="space-y-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
              >
                <option value="Open">Open</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Closed">Closed</option>
              </select>
              <textarea
                value={updateComment}
                onChange={(e) => setUpdateComment(e.target.value)}
                placeholder="Add a comment about this status change..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleStatusUpdate}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  onClick={() => {
                    setShowUpdateForm(false);
                    setNewStatus(incident.status);
                    setUpdateComment('');
                  }}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            {isExpanded ? 'Hide Details' : 'View Details'}
          </button>
          {!showUpdateForm && (
            <button
              onClick={() => setShowUpdateForm(true)}
              className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium text-sm"
            >
              Update Status
            </button>
          )}
          {onViewDetail && (
            <button
              onClick={() => onViewDetail(incident)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm ml-auto"
            >
              View Full Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentCard;
