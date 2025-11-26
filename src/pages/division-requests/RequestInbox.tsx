import React, { useState, useEffect } from 'react';
import { DivisionRequest } from '../../types/project-management';
import { DivisionRequestCard } from '../../components/division-requests/DivisionRequestCard';
import { RequestResponseModal } from '../../components/division-requests/RequestResponseModal';
import { getDivisionRequests, respondDivisionRequest } from '../../services/divisionRequestsApi';
import { Inbox, Filter, AlertCircle } from 'lucide-react';

/**
 * Page component for incoming division requests (requests TO this division)
 */
export default function RequestInbox() {
  const [requests, setRequests] = useState<DivisionRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<DivisionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<DivisionRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [requests, filter]);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      // In production, pass actual user ID to get requests for their division
      const data = await getDivisionRequests();
      setRequests(data);
    } catch (err) {
      setError('Failed to load division requests');
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredRequests(requests);
    } else if (filter === 'pending') {
      setFilteredRequests(requests.filter(r => r.status === 'Pending'));
    } else if (filter === 'accepted') {
      setFilteredRequests(requests.filter(r => r.status === 'Accepted'));
    } else if (filter === 'rejected') {
      setFilteredRequests(requests.filter(r => r.status === 'Rejected'));
    }
  };

  const handleAccept = async (
    requestId: string,
    data: {
      responseNotes: string;
      confirmedDates: string[];
      assignedCrewId?: string;
      assignedForemanId?: string;
    }
  ) => {
    try {
      await respondDivisionRequest(requestId, 'accept', data);
      await loadRequests();
      setSelectedRequest(null);
    } catch (err) {
      console.error('Failed to accept request:', err);
      throw err;
    }
  };

  const handleReject = async (requestId: string, responseNotes: string) => {
    try {
      await respondDivisionRequest(requestId, 'reject', { responseNotes });
      await loadRequests();
      setSelectedRequest(null);
    } catch (err) {
      console.error('Failed to reject request:', err);
      throw err;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'Pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Inbox className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Division Request Inbox</h1>
        </div>
        <p className="text-gray-600">
          Requests from other divisions requiring your crews
        </p>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span className="text-amber-800">
            You have {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} awaiting response
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-3">
        <Filter className="w-5 h-5 text-gray-600" />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({requests.filter(r => r.status === 'Pending').length})
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'accepted'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Accepted ({requests.filter(r => r.status === 'Accepted').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected ({requests.filter(r => r.status === 'Rejected').length})
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Request List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No {filter !== 'all' ? filter : ''} requests found
          </div>
        ) : (
          filteredRequests.map(request => (
            <DivisionRequestCard
              key={request.id}
              request={request}
              onClick={() => setSelectedRequest(request)}
            />
          ))
        )}
      </div>

      {/* Response Modal */}
      {selectedRequest && (
        <RequestResponseModal
          request={selectedRequest}
          onAccept={(data) => handleAccept(selectedRequest.id, data)}
          onReject={(notes) => handleReject(selectedRequest.id, notes)}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
