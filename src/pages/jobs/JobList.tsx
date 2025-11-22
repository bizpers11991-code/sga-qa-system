import { PageContainer, PageHeader } from '../../components/layout';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../../types';
import { jobsApi, JobFilters as JobFiltersType } from '../../services/jobsApi';
import JobCard from '../../components/jobs/JobCard';
import JobFilters from '../../components/jobs/JobFilters';

const ITEMS_PER_PAGE = 20;

const JobList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<JobFiltersType>({});

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await jobsApi.getAllJobs();
      setJobs(data);
      setFilteredJobs(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = useCallback(
    async (newFilters: JobFiltersType) => {
      setFilters(newFilters);
      setCurrentPage(1);
      try {
        const data = await jobsApi.getAllJobs(newFilters);
        setFilteredJobs(data);
      } catch (err) {
        console.error('Error filtering jobs:', err);
      }
    },
    []
  );

  const handleDelete = async (jobId: string) => {
    try {
      await jobsApi.deleteJob(jobId);
      // Refresh the jobs list
      await fetchJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  const handleCreateJob = () => {
    navigate('/jobs/create');
  };

  const handleExportToExcel = () => {
    // Convert jobs to CSV
    const headers = ['Job No', 'Client', 'Division', 'Project', 'Location', 'Job Date', 'Due Date'];
    const csvData = filteredJobs.map((job) => [
      job.jobNo,
      job.client,
      job.division,
      job.projectName,
      job.location,
      job.jobDate,
      job.dueDate,
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobs-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Jobs"
          description="Manage and monitor all jobs"
          breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Jobs' }]}
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sga-700 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title="Jobs"
          description="Manage and monitor all jobs"
          breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Jobs' }]}
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
              <h3 className="text-lg font-semibold text-red-800">Error Loading Jobs</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchJobs}
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
        title="Jobs"
        actions={
          <div className="flex gap-3">
            {filteredJobs.length > 0 && (
              <button
                onClick={handleExportToExcel}
                className="px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium min-h-touch"
              >
                Export to Excel
              </button>
            )}
            <button
              onClick={handleCreateJob}
              className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium min-h-touch"
            >
              New Job
            </button>
          </div>
        }
      />

      {jobs.length === 0 ? (
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
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Yet</h3>
          <p className="text-gray-600 mb-6">Create your first job to get started.</p>
          <button
            onClick={handleCreateJob}
            className="px-6 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium"
          >
            Create Job
          </button>
        </div>
      ) : (
        <>
          <JobFilters onFilterChange={handleFilterChange} initialFilters={filters} />

          {filteredJobs.length === 0 ? (
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Found</h3>
              <p className="text-gray-600 mb-6">
                No jobs match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedJobs.map((job) => (
                  <JobCard key={job.id} job={job} onDelete={handleDelete} />
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

export default JobList;
