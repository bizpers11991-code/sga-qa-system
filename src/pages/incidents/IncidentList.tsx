import { PageContainer, PageHeader } from '../../components/layout';
import { useState, useEffect } from 'react';
import IncidentCard from '../../components/incidents/IncidentCard';
import IncidentForm from '../../components/incidents/IncidentForm';
import { getIncidents, Incident, IncidentFilters } from '../../services/incidentsApi';

const IncidentList = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);

  // Filters
  const [filters, setFilters] = useState<IncidentFilters>({
    type: '',
    severity: '',
    status: '',
  });

  // Load incidents
  const loadIncidents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getIncidents(filters);
      setIncidents(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load incidents';
      setError(errorMessage);
      console.error('Error loading incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [filters]);

  const handleFilterChange = (filterName: keyof IncidentFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      severity: '',
      status: '',
    });
  };

  const handleIncidentSubmitted = () => {
    setShowReportForm(false);
    loadIncidents();
  };

  // Show form modal
  if (showReportForm) {
    return (
      <PageContainer>
        <IncidentForm
          onSuccess={handleIncidentSubmitted}
          onCancel={() => setShowReportForm(false)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Incidents & Near Misses"
        description="Track and manage safety incidents"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Incidents' }
        ]}
        actions={
          <button
            onClick={() => setShowReportForm(true)}
            className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium min-h-touch"
          >
            Report Incident
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="Incident">Incident</option>
              <option value="Near Miss">Near Miss</option>
              <option value="Hazard">Hazard</option>
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
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Closed">Closed</option>
            </select>
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
          <p className="text-gray-600">Loading incidents...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900">Error Loading Incidents</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadIncidents}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && incidents.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Incidents Found</h3>
          <p className="text-gray-600 mb-6">
            {Object.values(filters).some(v => v)
              ? 'No incidents match your current filters. Try adjusting your search.'
              : 'No safety incidents or near misses have been reported.'}
          </p>
          <button
            onClick={() => setShowReportForm(true)}
            className="px-6 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium"
          >
            Report Incident
          </button>
        </div>
      )}

      {/* Incidents List */}
      {!isLoading && !error && incidents.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Showing {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
            </p>
          </div>

          {incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onStatusUpdate={loadIncidents}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default IncidentList;
