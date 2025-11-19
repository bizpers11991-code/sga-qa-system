import { useState } from 'react';
import { Ncr, updateNcr, closeNcr } from '../../services/ncrApi';
import useAuth from '../../hooks/useAuth';

interface NcrCardProps {
  ncr: Ncr;
  onUpdate?: () => void;
  onViewDetail?: (ncr: Ncr) => void;
  canEdit?: boolean;
}

const NcrCard = ({ ncr, onUpdate, onViewDetail, canEdit = true }: NcrCardProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [updateComment, setUpdateComment] = useState('');
  const [newStatus, setNewStatus] = useState(ncr.status);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Major':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Minor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-red-50 text-red-700 border-red-500';
      case 'Under Review':
        return 'bg-blue-50 text-blue-700 border-blue-500';
      case 'In Progress':
        return 'bg-yellow-50 text-yellow-700 border-yellow-500';
      case 'Resolved':
        return 'bg-green-50 text-green-700 border-green-500';
      case 'Closed':
        return 'bg-gray-50 text-gray-700 border-gray-500';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-500';
    }
  };

  const handleUpdate = async () => {
    if (!updateComment.trim()) {
      alert('Please provide a comment for the update');
      return;
    }

    setIsUpdating(true);

    try {
      await updateNcr(ncr.id, {
        status: newStatus,
        comment: updateComment,
        updatedBy: user?.name || user?.username || 'Unknown User',
      });

      setShowUpdateForm(false);
      setUpdateComment('');

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating NCR:', error);
      alert('Failed to update NCR. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = async () => {
    if (!updateComment.trim()) {
      alert('Please provide a comment for closing the NCR');
      return;
    }

    setIsUpdating(true);

    try {
      await closeNcr(ncr.id, {
        comment: updateComment,
        verifiedBy: user?.name || user?.username || 'Unknown User',
      });

      setShowCloseForm(false);
      setUpdateComment('');

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error closing NCR:', error);
      alert('Failed to close NCR. Please try again.');
    } finally {
      setIsUpdating(false);
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
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          {/* Left: NCR Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-xl font-bold text-gray-900">{ncr.ncrId}</h3>
              <span className={`px-2 py-1 rounded border text-xs font-semibold ${getSeverityColor(ncr.severity)}`}>
                {ncr.severity}
              </span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {ncr.jobReference}
              </span>
            </div>

            <p className="text-gray-700 mb-3 font-medium">Issue: {ncr.issueDescription}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Issued by: {ncr.issuedBy}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {formatDate(ncr.dateIssued)}
              </span>
              {ncr.assignedTo && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Assigned to: {ncr.assignedTo}
                </span>
              )}
            </div>
          </div>

          {/* Right: Status Badge */}
          <div className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap border-l-4 ${getStatusColor(ncr.status)}`}>
            {ncr.status}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Root Cause */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Root Cause</h4>
              <p className="text-sm text-gray-600">{ncr.rootCause}</p>
            </div>

            {/* Corrective Action */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Corrective Action</h4>
              <p className="text-sm text-gray-600">{ncr.correctiveAction}</p>
            </div>

            {/* Attachments */}
            {ncr.attachments && ncr.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Attachments ({ncr.attachments.length})</h4>
                <div className="space-y-2">
                  {ncr.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.dataUrl}
                      download={attachment.filename}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{attachment.filename}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {ncr.updates && ncr.updates.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h4>
                <div className="space-y-3">
                  {ncr.updates.map((update, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{update.action}</p>
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

            {/* Verification Info */}
            {ncr.status === 'Closed' && ncr.verifiedBy && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-900">Verified and Closed</p>
                <p className="text-sm text-green-700">
                  Verified by {ncr.verifiedBy} on {ncr.verifiedDate && formatDate(ncr.verifiedDate)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Update Form */}
        {showUpdateForm && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Update NCR</h4>
            <div className="space-y-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
              >
                <option value="Open">Open</option>
                <option value="Under Review">Under Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
              <textarea
                value={updateComment}
                onChange={(e) => setUpdateComment(e.target.value)}
                placeholder="Add a comment about this update..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update NCR'}
                </button>
                <button
                  onClick={() => {
                    setShowUpdateForm(false);
                    setNewStatus(ncr.status);
                    setUpdateComment('');
                  }}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close Form */}
        {showCloseForm && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Close NCR</h4>
            <div className="space-y-3">
              <textarea
                value={updateComment}
                onChange={(e) => setUpdateComment(e.target.value)}
                placeholder="Confirm that all corrective actions have been completed and verified..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Closing...' : 'Close NCR'}
                </button>
                <button
                  onClick={() => {
                    setShowCloseForm(false);
                    setUpdateComment('');
                  }}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 flex-wrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            {isExpanded ? 'Hide Details' : 'View Details'}
          </button>

          {canEdit && ncr.status !== 'Closed' && (
            <>
              {!showUpdateForm && !showCloseForm && (
                <>
                  <button
                    onClick={() => {
                      setShowUpdateForm(true);
                      setShowCloseForm(false);
                    }}
                    className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium text-sm"
                  >
                    Update NCR
                  </button>
                  {ncr.status === 'Resolved' && (
                    <button
                      onClick={() => {
                        setShowCloseForm(true);
                        setShowUpdateForm(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      Close NCR
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {onViewDetail && (
            <button
              onClick={() => onViewDetail(ncr)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm ml-auto"
            >
              View Full Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NcrCard;
