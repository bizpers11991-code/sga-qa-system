import { PageContainer, PageHeader } from '../../components/layout';
import { useState } from 'react';

interface Resource {
  id: string;
  name: string;
  type: 'Crew' | 'Equipment';
  division: 'Asphalt' | 'Profiling' | 'Spray' | 'Common';
  status: 'Available' | 'In Use' | 'Maintenance';
  lastUpdated: string;
}

const ResourceList = () => {
  // Mock data - replace with API call
  const [resources] = useState<Resource[]>([
    {
      id: 'crew-1',
      name: 'Asphalt Crew A',
      type: 'Crew',
      division: 'Asphalt',
      status: 'Available',
      lastUpdated: '2024-11-15'
    },
    {
      id: 'equip-1',
      name: '2m Profiler #1',
      type: 'Equipment',
      division: 'Profiling',
      status: 'In Use',
      lastUpdated: '2024-11-14'
    },
    {
      id: 'crew-2',
      name: 'Profiling Crew B',
      type: 'Crew',
      division: 'Profiling',
      status: 'Available',
      lastUpdated: '2024-11-15'
    },
  ]);

  const getDivisionColor = (division: string) => {
    switch (division) {
      case 'Asphalt':
        return 'bg-blue-100 text-blue-800';
      case 'Profiling':
        return 'bg-purple-100 text-purple-800';
      case 'Spray':
        return 'bg-green-100 text-green-800';
      case 'Common':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-50 text-green-700 border-l-4 border-green-500';
      case 'In Use':
        return 'bg-blue-50 text-blue-700 border-l-4 border-blue-500';
      case 'Maintenance':
        return 'bg-amber-50 text-amber-700 border-l-4 border-amber-500';
      default:
        return 'bg-gray-50 text-gray-700 border-l-4 border-gray-500';
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Resources"
        description="Manage crew and equipment resources"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Resources' }
        ]}
        actions={
          <button className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium min-h-touch">
            Add Resource
          </button>
        }
      />

      {resources.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">📦</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resources</h3>
          <p className="text-gray-600 mb-6">Add crew and equipment resources to your system.</p>
          <button className="px-6 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium">
            Add Resource
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => (
            <a
              key={resource.id}
              href={`#`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-sga-700 transition-colors">
                      {resource.name}
                    </h3>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {resource.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getDivisionColor(resource.division)}`}>
                      {resource.division}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>📅 Updated {new Date(resource.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${getStatusColor(resource.status)}`}>
                  {resource.status}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default ResourceList;
