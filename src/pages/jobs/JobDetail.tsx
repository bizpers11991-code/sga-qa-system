import { PageContainer, PageHeader } from '../../components/layout';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Job, SecureForeman } from '../../types';
import { jobsApi, UpdateJobRequest } from '../../services/jobsApi';

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [foremen, setForemen] = useState<SecureForeman[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editFormData, setEditFormData] = useState<Partial<UpdateJobRequest>>({});

  useEffect(() => {
    if (id) {
      fetchJob();
      fetchForemen();
    }
  }, [id]);

  const fetchJob = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const jobs = await jobsApi.getAllJobs();
      const foundJob = jobs.find((j) => j.id === id);

      if (!foundJob) {
        setError('Job not found');
        return;
      }

      setJob(foundJob);
      setEditFormData({
        id: foundJob.id,
        jobNo: foundJob.jobNo,
        client: foundJob.client,
        division: foundJob.division,
        projectName: foundJob.projectName,
        location: foundJob.location,
        foremanId: foundJob.foremanId,
        jobDate: foundJob.jobDate,
        dueDate: foundJob.dueDate,
        area: foundJob.area,
        thickness: foundJob.thickness,
        qaSpec: foundJob.qaSpec,
      });
    } catch (err) {
      console.error('Error fetching job:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchForemen = async () => {
    try {
      const response = await fetch('/api/get-foremen');
      if (!response.ok) throw new Error('Failed to fetch foremen');
      const data = await response.json();
      setForemen(data);
    } catch (err) {
      console.error('Error fetching foremen:', err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - restore original data
      if (job) {
        setEditFormData({
          id: job.id,
          jobNo: job.jobNo,
          client: job.client,
          division: job.division,
          projectName: job.projectName,
          location: job.location,
          foremanId: job.foremanId,
          jobDate: job.jobDate,
          dueDate: job.dueDate,
          area: job.area,
          thickness: job.thickness,
          qaSpec: job.qaSpec,
        });
      }
      setError(null);
    }
    setIsEditMode(!isEditMode);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const result = await jobsApi.updateJob(editFormData as UpdateJobRequest);

      setJob(result.job);
      setSuccessMessage('Job updated successfully!');
      setIsEditMode(false);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating job:', err);
      setError(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      await jobsApi.deleteJob(id!);

      setSuccessMessage('Job deleted successfully! Redirecting...');

      setTimeout(() => {
        navigate('/jobs');
      }, 1500);
    } catch (err) {
      console.error('Error deleting job:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete job');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const getDivisionColor = (division: string) => {
    switch (division) {
      case 'Asphalt':
        return 'bg-blue-100 text-blue-800';
      case 'Profiling':
        return 'bg-purple-100 text-purple-800';
      case 'Spray':
        return 'bg-green-100 text-green-800';
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

  const getForeman = () => {
    return foremen.find((f) => f.id === job?.foremanId);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Job Details"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Jobs', path: '/jobs' },
            { label: 'Details' },
          ]}
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sga-700 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading job details...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error && !job) {
    return (
      <PageContainer>
        <PageHeader
          title="Job Not Found"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Jobs', path: '/jobs' },
            { label: 'Details' },
          ]}
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
              <h3 className="text-lg font-semibold text-red-800">Error Loading Job</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => navigate('/jobs')}
                className="mt-4 px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium"
              >
                Back to Jobs
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!job) return null;

  const foreman = getForeman();

  return (
    <PageContainer>
      <PageHeader
        title={job.jobNo}
        description={job.projectName}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Jobs', path: '/jobs' },
          { label: job.jobNo },
        ]}
        actions={
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/jobs')}
              className="px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium min-h-touch"
            >
              Back
            </button>
          </div>
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
              <h3 className="text-sm font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-3 text-red-500 hover:text-red-700">
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
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Job Details</h2>
              <button
                onClick={handleEditToggle}
                disabled={isSaving}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors min-h-touch ${
                  isEditMode
                    ? 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50'
                    : 'text-sga-700 border-2 border-sga-200 hover:border-sga-700 hover:bg-sga-50'
                }`}
              >
                {isEditMode ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Number
                    </label>
                    <input
                      type="text"
                      name="jobNo"
                      value={editFormData.jobNo || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <input
                      type="text"
                      name="client"
                      value={editFormData.client || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                    <select
                      name="division"
                      value={editFormData.division || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                    >
                      <option value="Asphalt">Asphalt</option>
                      <option value="Profiling">Profiling</option>
                      <option value="Spray">Spray</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={editFormData.projectName || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned Foreman
                    </label>
                    <select
                      name="foremanId"
                      value={editFormData.foremanId || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                    >
                      {foremen.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Date</label>
                    <input
                      type="date"
                      name="jobDate"
                      value={editFormData.jobDate || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={editFormData.dueDate || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area (m²)
                    </label>
                    <input
                      type="number"
                      name="area"
                      value={editFormData.area || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thickness (mm)
                    </label>
                    <input
                      type="number"
                      name="thickness"
                      value={editFormData.thickness || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QA Specification
                  </label>
                  <textarea
                    name="qaSpec"
                    value={editFormData.qaSpec || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-touch"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Client</label>
                  <p className="text-gray-900">{job.client}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Division</label>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getDivisionColor(
                      job.division
                    )}`}
                  >
                    {job.division}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                  <p className="text-gray-900">{job.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Job Date</label>
                  <p className="text-gray-900">{formatDate(job.jobDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
                  <p className="text-gray-900">{formatDate(job.dueDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Assigned Foreman
                  </label>
                  <p className="text-gray-900">{foreman?.name || 'Unknown'}</p>
                </div>
                {job.area && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Area (m²)
                    </label>
                    <p className="text-gray-900">{job.area.toLocaleString()}</p>
                  </div>
                )}
                {job.thickness && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Thickness (mm)
                    </label>
                    <p className="text-gray-900">{job.thickness}</p>
                  </div>
                )}
                {job.qaSpec && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      QA Specification
                    </label>
                    <p className="text-gray-900">{job.qaSpec}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* QA Packs Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Associated QA Packs</h2>
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-3"
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
              <p className="text-gray-600 mb-4">No QA packs submitted yet</p>
              <button className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium">
                Create QA Pack
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full px-4 py-2 text-sm font-medium text-red-700 border-2 border-red-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
              >
                Delete Job
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Job</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete job <strong>{job.jobNo}</strong>?
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete the job and all associated data, including QA packs and
              reports. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
              >
                {isDeleting ? 'Deleting...' : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default JobDetail;
