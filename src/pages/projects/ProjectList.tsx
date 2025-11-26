import { PageContainer, PageHeader } from '../../components/layout';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import { getProjects } from '../../services/projectsApi';

const ITEMS_PER_PAGE = 20;

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProjects();
      setProjects(data.projects);
      setFilteredProjects(data.projects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = useCallback(() => {
    let filtered = [...projects];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(p => p.clientTier === tierFilter);
    }

    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [projects, statusFilter, tierFilter]);

  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

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

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Projects"
          description="Manage all projects and track progress"
          breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Projects' }]}
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sga-700 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title="Projects"
          description="Manage all projects and track progress"
          breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Projects' }]}
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
              <h3 className="text-lg font-semibold text-red-800">Error Loading Projects</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchProjects}
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
      <PageHeader title="Projects" />

      {projects.length === 0 ? (
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
          <p className="text-gray-600 mb-6">Projects are created from tender handovers.</p>
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
                  <option value="Scoping">Scoping</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="QA Review">QA Review</option>
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

          {filteredProjects.length === 0 ? (
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h3>
              <p className="text-gray-600 mb-6">
                No projects match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-sga-700 transition-colors">
                            {project.projectNumber}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTierColor(project.clientTier)}`}>
                            {project.clientTier}
                          </span>
                        </div>

                        <p className="text-gray-700 font-medium mb-3 truncate">{project.projectName}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
                          <p className="truncate">
                            <strong>Client:</strong> {project.client}
                          </p>
                          <p className="truncate">
                            <strong>Location:</strong> {project.location}
                          </p>
                          <p>
                            <strong>Start:</strong> {formatDate(project.estimatedStartDate)}
                          </p>
                          <p>
                            <strong>End:</strong> {formatDate(project.estimatedEndDate)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-600 font-medium">Divisions:</span>
                          {project.divisions.map((div) => (
                            <span
                              key={div.division}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                    </div>
                  </div>
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

export default ProjectList;
