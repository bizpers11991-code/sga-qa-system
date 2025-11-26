import React, { useState, useEffect } from 'react';
import { DivisionRequest } from '../../types/project-management';
import { DivisionRequestCard } from '../../components/division-requests/DivisionRequestCard';
import { DivisionRequestForm } from '../../components/division-requests/DivisionRequestForm';
import { getDivisionRequests, createDivisionRequest } from '../../services/divisionRequestsApi';
import { Send, Filter, Plus } from 'lucide-react';

/**
 * Page component for outgoing division requests (requests FROM this user)
 */
export default function RequestOutbox() {
  const [requests, setRequests] = useState<DivisionRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<DivisionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'completed'>('all');

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
      // In production, pass actual user ID to get requests from this user
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
    } else {
      setFilteredRequests(requests.filter(r => r.status.toLowerCase() === filter));
    }
  };

  const handleCreateRequest = async (requestData: Partial<DivisionRequest>) => {
    try {
      const fullData = {
        projectId: requestData.projectId || '',
        requestedBy: requestData.requestedBy || '',
        requestedDivision: requestData.requestedDivision || 'Profiling',
        requestedTo: requestData.requestedTo || '',
        workDescription: requestData.workDescription || '',
        location: requestData.location || '',
        requestedDates: requestData.requestedDates || []
      };
      await createDivisionRequest(fullData);
      await loadRequests();
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create request:', err);
      throw err;
    }
  };

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
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Send className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Division Request Outbox</h1>
            </div>
            <p className="text-gray-600">
              Your requests to other divisions for crew support
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New Request
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-6">
          <DivisionRequestForm
            projectId="PROJECT_ID" // In production, get from context or props
            projectName="Example Project" // In production, get from context or props
            requestedBy="CURRENT_USER_ID" // In production, get from auth context
            onSubmit={handleCreateRequest}
            onCancel={() => setShowCreateForm(false)}
          />
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
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({requests.filter(r => r.status === 'Completed').length})
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
            <p className="mb-4">No {filter !== 'all' ? filter : ''} requests found</p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Create your first request →
              </button>
            )}
          </div>
        ) : (
          filteredRequests.map(request => (
            <DivisionRequestCard
              key={request.id}
              request={request}
              onClick={() => {
                // In production, navigate to request detail page
                console.log('View request:', request.id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
