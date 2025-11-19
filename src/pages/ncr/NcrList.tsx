import { PageContainer, PageHeader } from '../../components/layout';
import { useState, useEffect } from 'react';
import NcrCard from '../../components/ncr/NcrCard';
import NcrForm from '../../components/ncr/NcrForm';
import { getNcrs, Ncr, NcrFilters } from '../../services/ncrApi';
import useAuth from '../../hooks/useAuth';

const NcrList = () => {
  const { user } = useAuth();
  const [ncrs, setNcrs] = useState<Ncr[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filters
  const [filters, setFilters] = useState<NcrFilters>({
    status: '',
    severity: '',
    jobReference: '',
  });

  // Role check - determine if user can create NCRs
  // For this implementation, we'll assume engineers and admins can create NCRs
  // This should be enhanced based on actual role data from your auth system
  const canCreateNcr = () => {
    // Example role check - adjust based on your actual role structure
    const email = user?.username?.toLowerCase() || '';
    const name = user?.name?.toLowerCase() || '';

    // Check if user is an engineer or admin based on email/name
    // This is a simple check - implement proper role-based access control
    const isEngineer = email.includes('engineer') || name.includes('engineer');
    const isAdmin = email.includes('admin') || name.includes('admin');
    const isQA = email.includes('qa') || name.includes('quality');

    return isEngineer || isAdmin || isQA;
  };

  const userCanCreate = canCreateNcr();

  // Load NCRs
  const loadNcrs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getNcrs(filters);
      setNcrs(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load NCRs';
      setError(errorMessage);
      console.error('Error loading NCRs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNcrs();
  }, [filters]);

  const handleFilterChange = (filterName: keyof NcrFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      severity: '',
      jobReference: '',
    });
  };

  const handleNcrCreated = () => {
    setShowCreateForm(false);
    loadNcrs();
  };

  // Show form modal
  if (showCreateForm) {
    return (
      <PageContainer>
        <NcrForm
          onSuccess={handleNcrCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Non-Conformance Reports (NCRs)"
        description="Manage quality non-conformances"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'NCRs' }
        ]}
        actions={
          userCanCreate ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium min-h-touch"
            >
              Create NCR
            </button>
          ) : undefined
        }
      />

      {/* Role Notice for Read-Only Users */}
      {!userCanCreate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900">Read-Only Access</h3>
              <p className="text-sm text-blue-700">You have read-only access to NCRs. Only engineers and administrators can create or modify NCRs.</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={filters.severity || ''}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Reference</label>
            <input
              type="text"
              value={filters.jobReference || ''}
              onChange={(e) => handleFilterChange('jobReference', e.target.value)}
              placeholder="Search by job..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium whitespace-nowrap"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sga-700 mb-4"></div>
          <p className="text-gray-600">Loading NCRs...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900">Error Loading NCRs</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadNcrs}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && ncrs.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">📋</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No NCRs Found</h3>
          <p className="text-gray-600 mb-6">
            {Object.values(filters).some(v => v)
              ? 'No NCRs match your current filters. Try adjusting your search.'
              : 'No non-conformance reports have been issued.'}
          </p>
          {userCanCreate && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium"
            >
              Create NCR
            </button>
          )}
        </div>
      )}

      {/* NCRs List */}
      {!isLoading && !error && ncrs.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Showing {ncrs.length} NCR{ncrs.length !== 1 ? 's' : ''}
            </p>
          </div>

          {ncrs.map((ncr) => (
            <NcrCard
              key={ncr.id}
              ncr={ncr}
              onUpdate={loadNcrs}
              canEdit={userCanCreate}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default NcrList;
