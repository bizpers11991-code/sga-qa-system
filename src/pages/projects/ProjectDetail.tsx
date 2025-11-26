import { PageContainer, PageHeader } from '../../components/layout';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import { getProject, updateProjectStatus } from '../../services/projectsApi';
import ProjectHeader from '../../components/projects/ProjectHeader';
import DivisionStatusCard from '../../components/projects/DivisionStatusCard';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'scope' | 'schedule' | 'qa' | 'documents'>('overview');

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProject(id!);
      setProject(data.project);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Project['status']) => {
    if (!project) return;

    try {
      await updateProjectStatus(project.id, newStatus);
      setProject({ ...project, status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'scope' as const, label: 'Scope Reports', icon: '📋' },
    { id: 'schedule' as const, label: 'Schedule', icon: '📅' },
    { id: 'qa' as const, label: 'QA & Compliance', icon: '✓' },
    { id: 'documents' as const, label: 'Documents', icon: '📁' },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Project Details"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Projects', path: '/projects' },
            { label: 'Details' },
          ]}
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sga-700 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading project...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !project) {
    return (
      <PageContainer>
        <PageHeader
          title="Project Details"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Projects', path: '/projects' },
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
              <h3 className="text-lg font-semibold text-red-800">Error Loading Project</h3>
              <p className="text-red-700 mt-1">{error || 'Project not found'}</p>
              <button
                onClick={() => navigate('/projects')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Back to Projects
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
        title={project.projectNumber}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Projects', path: '/projects' },
          { label: project.projectNumber },
        ]}
      />

      <div className="space-y-6">
        {/* Project Header */}
        <ProjectHeader project={project} onStatusUpdate={handleStatusUpdate} />

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-sga-700 text-sga-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Division Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.divisions.map((division) => (
                      <DivisionStatusCard key={division.division} division={division} />
                    ))}
                  </div>
                </div>

                {/* Jobs Summary */}
                {project.jobIds && project.jobIds.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Jobs</h3>
                    <p className="text-gray-600">{project.jobIds.length} jobs associated with this project</p>
                  </div>
                )}

                {/* Scope Reports Summary */}
                {project.scopeReportIds && project.scopeReportIds.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Scope Reports</h3>
                    <p className="text-gray-600">{project.scopeReportIds.length} scope reports completed</p>
                  </div>
                )}
              </div>
            )}

            {/* Scope Reports Tab */}
            {activeTab === 'scope' && (
              <div className="text-center py-12">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Scope Reports</h3>
                <p className="text-gray-600">
                  {project.scopeReportIds && project.scopeReportIds.length > 0
                    ? `${project.scopeReportIds.length} scope reports available`
                    : 'No scope reports yet'}
                </p>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="text-center py-12">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule</h3>
                <p className="text-gray-600">Job calendar and crew assignments</p>
              </div>
            )}

            {/* QA Tab */}
            {activeTab === 'qa' && (
              <div className="text-center py-12">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">QA & Compliance</h3>
                <p className="text-gray-600">
                  {project.qaPackIds && project.qaPackIds.length > 0
                    ? `${project.qaPackIds.length} QA packs available`
                    : 'No QA packs yet'}
                </p>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="text-center py-12">
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
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents</h3>
                <p className="text-gray-600">All project documents and files</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProjectDetail;
