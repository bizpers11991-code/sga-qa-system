import React, { useState } from 'react';
import { DivisionRequest } from '../../types/project-management';
import { CheckCircle, XCircle, Users, Calendar } from 'lucide-react';

interface RequestResponseModalProps {
  request: DivisionRequest;
  onAccept: (data: { responseNotes: string; confirmedDates: string[]; assignedCrewId?: string; assignedForemanId?: string }) => Promise<void>;
  onReject: (responseNotes: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Modal component for responding to a division request
 */
export function RequestResponseModal({
  request,
  onAccept,
  onReject,
  onClose
}: RequestResponseModalProps) {
  const [action, setAction] = useState<'accept' | 'reject' | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [confirmedDates, setConfirmedDates] = useState<string[]>(request.requestedDates);
  const [assignedCrewId, setAssignedCrewId] = useState('');
  const [assignedForemanId, setAssignedForemanId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!action) return;

    setLoading(true);
    try {
      if (action === 'accept') {
        await onAccept({
          responseNotes,
          confirmedDates,
          assignedCrewId: assignedCrewId || undefined,
          assignedForemanId: assignedForemanId || undefined
        });
      } else {
        await onReject(responseNotes);
      }
      onClose();
    } catch (error) {
      console.error('Failed to respond to request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">Respond to Division Request</h2>
          <p className="text-sm text-gray-500 mt-1">{request.requestNumber}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Request Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Request Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">From:</span>
                <span className="ml-2 font-medium">{request.requestedBy}</span>
              </div>
              <div>
                <span className="text-gray-600">Project:</span>
                <span className="ml-2 font-medium">{request.projectId}</span>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="ml-2 font-medium">{request.location}</span>
              </div>
              <div>
                <span className="text-gray-600">Work:</span>
                <p className="ml-2 mt-1 text-gray-700">{request.workDescription}</p>
              </div>
              <div>
                <span className="text-gray-600">Requested Dates:</span>
                <div className="ml-2 mt-1">
                  {request.requestedDates.map((date, idx) => (
                    <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs mr-2 mb-1">
                      {new Date(date).toLocaleDateString()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Selection */}
          {!action && (
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-3">Choose your response:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAction('accept')}
                  className="p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 flex items-center justify-center gap-2 text-green-700 font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  Accept Request
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className="p-4 border-2 border-red-500 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2 text-red-700 font-medium"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Request
                </button>
              </div>
            </div>
          )}

          {/* Accept Form */}
          {action === 'accept' && (
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-gray-900">Acceptance Details</h3>

              {/* Confirmed Dates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Confirmed Dates
                </label>
                {confirmedDates.map((date, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        const newDates = [...confirmedDates];
                        newDates[index] = e.target.value;
                        setConfirmedDates(newDates);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {confirmedDates.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setConfirmedDates(confirmedDates.filter((_, i) => i !== index))}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Crew Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Assigned Crew (Optional)
                </label>
                <input
                  type="text"
                  value={assignedCrewId}
                  onChange={(e) => setAssignedCrewId(e.target.value)}
                  placeholder="Crew ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Foreman Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Foreman (Optional)
                </label>
                <input
                  type="text"
                  value={assignedForemanId}
                  onChange={(e) => setAssignedForemanId(e.target.value)}
                  placeholder="Foreman ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Response Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}

          {/* Reject Form */}
          {action === 'reject' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder="Please provide a reason for rejecting this request..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end">
          {action && (
            <button
              onClick={() => setAction(null)}
              disabled={loading}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Back
            </button>
          )}
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          {action && (
            <button
              onClick={handleSubmit}
              disabled={loading || (action === 'reject' && !responseNotes.trim())}
              className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                action === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : action === 'accept' ? 'Accept Request' : 'Reject Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
