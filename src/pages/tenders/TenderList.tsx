import { PageContainer, PageHeader } from '../../components/layout';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenderHandover } from '../../types';
import { getHandovers } from '../../services/tendersApi';
import TenderCard from '../../components/tenders/TenderCard';

const ITEMS_PER_PAGE = 20;

const TenderList = () => {
  const navigate = useNavigate();
  const [handovers, setHandovers] = useState<TenderHandover[]>([]);
  const [filteredHandovers, setFilteredHandovers] = useState<TenderHandover[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getHandovers();
      setHandovers(data);
      setFilteredHandovers(data);
    } catch (err) {
      console.error('Error fetching handovers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load handovers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = useCallback(() => {
    let filtered = [...handovers];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(h => h.status === statusFilter);
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(h => h.clientTier === tierFilter);
    }

    setFilteredHandovers(filtered);
    setCurrentPage(1);
  }, [handovers, statusFilter, tierFilter]);

  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  const handleCreateHandover = () => {
    navigate('/tenders/create');
  };

  // Pagination
  const totalPages = Math.ceil(filteredHandovers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedHandovers = filteredHandovers.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Tender Handovers"
          description="Manage tender handovers and project creation"
          breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Tenders' }]}
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sga-700 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading handovers...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title="Tender Handovers"
          description="Manage tender handovers and project creation"
          breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Tenders' }]}
        />
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-red-500 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Handovers</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchHandovers}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Tender Handovers"
        actions={
          <button
            onClick={handleCreateHandover}
            className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium min-h-touch"
          >
            New Handover
          </button>
        }
      />

      {handovers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Handovers Yet</h3>
          <p className="text-gray-600 mb-6">Create your first tender handover to get started.</p>
          <button
            onClick={handleCreateHandover}
            className="px-6 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium"
          >
            Create Handover
          </button>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Tier
                </label>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
                >
                  <option value="all">All Tiers</option>
                  <option value="Tier 1">Tier 1</option>
                  <option value="Tier 2">Tier 2</option>
                  <option value="Tier 3">Tier 3</option>
                </select>
              </div>
            </div>
          </div>

          {filteredHandovers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Handovers Found</h3>
              <p className="text-gray-600 mb-6">
                No handovers match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedHandovers.map((handover) => (
                  <TenderCard key={handover.id} handover={handover} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default TenderList;
