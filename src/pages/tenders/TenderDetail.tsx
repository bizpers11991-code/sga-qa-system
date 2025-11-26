import { PageContainer, PageHeader } from '../../components/layout';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TenderHandover } from '../../types';
import { getHandover } from '../../services/tendersApi';
import { createProject } from '../../services/projectsApi';

const TenderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [handover, setHandover] = useState<TenderHandover | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  useEffect(() => {
    if (id) {
      fetchHandover();
    }
  }, [id]);

  const fetchHandover = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getHandover(id!);
      setHandover(data);
    } catch (err) {
      console.error('Error fetching handover:', err);
      setError(err instanceof Error ? err.message : 'Failed to load handover');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!handover) return;

    try {
      setIsCreatingProject(true);
      const result = await createProject({ handoverId: handover.id });

      if (result.success) {
        navigate(`/projects/${result.project.id}`);
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreatingProject(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800';
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-purple-100 text-purple-800';
      case 'On Hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Handover Details"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Tenders', path: '/tenders' },
            { label: 'Details' },
          ]}
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sga-700 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading handover...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !handover) {
    return (
      <PageContainer>
        <PageHeader
          title="Handover Details"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Tenders', path: '/tenders' },
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
              <h3 className="text-lg font-semibold text-red-800">Error Loading Handover</h3>
              <p className="text-red-700 mt-1">{error || 'Handover not found'}</p>
              <button
                onClick={() => navigate('/tenders')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Back to Tenders
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
        title={handover.handoverNumber}
        actions={
          handover.status === 'Submitted' && (
            <button
              onClick={handleCreateProject}
              disabled={isCreatingProject}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingProject ? 'Creating Project...' : 'Create Project'}
            </button>
          )
        }
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Tenders', path: '/tenders' },
          { label: handover.handoverNumber },
        ]}
      />

      <div className="space-y-6">
        {/* Status and Tier */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(handover.status)}`}>
              {handover.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(handover.clientTier)}`}>
              {handover.clientTier}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{handover.projectName}</h2>
        </div>

        {/* Client Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Details</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Client Name</dt>
              <dd className="mt-1 text-gray-900">{handover.clientName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Client Tier</dt>
              <dd className="mt-1 text-gray-900">{handover.clientTier}</dd>
            </div>
            {handover.contractNumber && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Contract Number</dt>
                <dd className="mt-1 text-gray-900">{handover.contractNumber}</dd>
              </div>
            )}
            {handover.purchaseOrderNumber && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Purchase Order</dt>
                <dd className="mt-1 text-gray-900">{handover.purchaseOrderNumber}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Project Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-gray-900">{handover.location}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-gray-900">{formatDate(handover.estimatedStartDate)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">End Date</dt>
              <dd className="mt-1 text-gray-900">{formatDate(handover.estimatedEndDate)}</dd>
            </div>
            {handover.projectDescription && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-gray-900">{handover.projectDescription}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Divisions Required */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Divisions Required</h3>
          <div className="flex gap-3">
            {handover.divisionsRequired.asphalt && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Asphalt
              </span>
            )}
            {handover.divisionsRequired.profiling && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                Profiling
              </span>
            )}
            {handover.divisionsRequired.spray && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Spray
              </span>
            )}
          </div>
        </div>

        {/* Technical Details */}
        {(handover.estimatedArea || handover.estimatedThickness || handover.specialRequirements) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {handover.estimatedArea && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Estimated Area</dt>
                  <dd className="mt-1 text-gray-900">{handover.estimatedArea} m²</dd>
                </div>
              )}
              {handover.estimatedThickness && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Estimated Thickness</dt>
                  <dd className="mt-1 text-gray-900">{handover.estimatedThickness} mm</dd>
                </div>
              )}
              {handover.specialRequirements && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Special Requirements</dt>
                  <dd className="mt-1 text-gray-900">{handover.specialRequirements}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default TenderDetail;
