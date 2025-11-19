import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, PageHeader } from '../../components/layout';
import JobFormWizard from '../../components/jobs/JobFormWizard';
import { jobsApi, CreateJobRequest } from '../../services/jobsApi';
import { SecureForeman } from '../../types';

const JobCreate: React.FC = () => {
  const navigate = useNavigate();
  const [foremen, setForemen] = useState<SecureForeman[]>([]);
  const [isLoadingForemen, setIsLoadingForemen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchForemen();
  }, []);

  const fetchForemen = async () => {
    try {
      setIsLoadingForemen(true);
      const response = await fetch('/api/get-foremen');
      if (!response.ok) {
        throw new Error('Failed to fetch foremen');
      }
      const data = await response.json();
      setForemen(data);
    } catch (err) {
      console.error('Error fetching foremen:', err);
      setError('Failed to load foremen. Please refresh the page.');
    } finally {
      setIsLoadingForemen(false);
    }
  };

  const handleSubmit = async (data: CreateJobRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await jobsApi.createJob(data);

      setSuccessMessage(`Job ${result.job.jobNo} created successfully!`);

      // Redirect to job detail page after 1.5 seconds
      setTimeout(() => {
        navigate(`/jobs/${result.job.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating job:', err);
      setError(err instanceof Error ? err.message : 'Failed to create job. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/jobs');
  };

  if (isLoadingForemen) {
    return (
      <PageContainer>
        <PageHeader
          title="Create New Job"
          description="Add a new job to the system"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Jobs', path: '/jobs' },
            { label: 'Create' },
          ]}
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sga-700 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading form...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Create New Job"
        description="Add a new job to the system"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Jobs', path: '/jobs' },
          { label: 'Create' },
        ]}
        actions={
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium min-h-touch disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        }
      />

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800">Error Creating Job</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-3 text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-800">Success!</h3>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
              <p className="text-sm text-green-600 mt-1">Redirecting to job details...</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {!successMessage && (
        <JobFormWizard
          onSubmit={handleSubmit}
          foremen={foremen}
          isLoading={isSubmitting}
        />
      )}
    </PageContainer>
  );
};

export default JobCreate;
