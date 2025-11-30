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

interface SpecDocument {
  id: string;
  name: string;
  category: 'Specifications' | 'Test Methods' | 'QA Forms' | 'ITP Templates';
  description: string;
  filename: string;
  path: string;
}

// Specification documents from docs folder
const specificationDocuments: SpecDocument[] = [
  // Specifications
  {
    id: 'spec-ipwea',
    name: 'IPWEA/AfPA Asphalt Specification',
    category: 'Specifications',
    description: 'General asphalt specification standard for road construction',
    filename: 'IPWEA_AfPA_Asphalt_Specification.pdf',
    path: '/api/specs/IPWEA_AfPA_Asphalt_Specification.pdf'
  },
  {
    id: 'spec-201',
    name: 'Specification 201 - Quality Management',
    category: 'Specifications',
    description: 'Quality assurance and management processes',
    filename: 'specification-201-quality-management.pdf',
    path: '/api/specs/specification-201-quality-management.pdf'
  },
  {
    id: 'spec-501',
    name: 'Specification 501 - Pavements',
    category: 'Specifications',
    description: 'Pavement design and construction requirements',
    filename: 'specification-501-pavements-doc.pdf',
    path: '/api/specs/specification-501-pavements-doc.pdf'
  },
  {
    id: 'spec-502',
    name: 'Specification 502 - Stone Mastic Asphalt',
    category: 'Specifications',
    description: 'SMA mix design and placement requirements',
    filename: 'specification-502-stone-mastic-asphalt.pdf',
    path: '/api/specs/specification-502-stone-mastic-asphalt.pdf'
  },
  {
    id: 'spec-503',
    name: 'Specification 503 - Bituminous Surfacing',
    category: 'Specifications',
    description: 'Bituminous surface course requirements',
    filename: 'specification-503-bituminous-surfacing.pdf',
    path: '/api/specs/specification-503-bituminous-surfacing.pdf'
  },
  {
    id: 'spec-504',
    name: 'Specification 504 - Asphalt Wearing Course',
    category: 'Specifications',
    description: 'Wearing course asphalt requirements',
    filename: 'specification-504-asphalt-wearing-course.pdf',
    path: '/api/specs/specification-504-asphalt-wearing-course.pdf'
  },
  {
    id: 'spec-505',
    name: 'Specification 505 - Segmental Paving',
    category: 'Specifications',
    description: 'Segmental paving blocks requirements',
    filename: 'specification-505-segmental-paving.pdf',
    path: '/api/specs/specification-505-segmental-paving.pdf'
  },
  {
    id: 'spec-506',
    name: 'Specification 506 - Enrichment Seals',
    category: 'Specifications',
    description: 'Enrichment seal coat requirements',
    filename: 'specification-506-enrichment-seals.pdf',
    path: '/api/specs/specification-506-enrichment-seals.pdf'
  },
  {
    id: 'spec-507',
    name: 'Specification 507 - Microsurfacing',
    category: 'Specifications',
    description: 'Microsurfacing treatment requirements',
    filename: 'specification-507-microsurfacing.pdf',
    path: '/api/specs/specification-507-microsurfacing.pdf'
  },
  {
    id: 'spec-508',
    name: 'Specification 508 - Cold Planing',
    category: 'Specifications',
    description: 'Cold planing/profiling removal requirements',
    filename: 'specification-508-cold-planing.pdf',
    path: '/api/specs/specification-508-cold-planing.pdf'
  },
  {
    id: 'spec-509',
    name: 'Specification 509 - Polymer Modified Bituminous Surfacing',
    category: 'Specifications',
    description: 'PMA binder surfacing requirements',
    filename: 'specification-509-polymer-modified-bituminous-surfacing.pdf',
    path: '/api/specs/specification-509-polymer-modified-bituminous-surfacing.pdf'
  },
  {
    id: 'spec-510',
    name: 'Specification 510 - Asphalt Intermediate Course',
    category: 'Specifications',
    description: 'Intermediate asphalt layer requirements',
    filename: 'specification-510-asphalt-intermediate-course.pdf',
    path: '/api/specs/specification-510-asphalt-intermediate-course.pdf'
  },
  {
    id: 'spec-511',
    name: 'Specification 511 - Materials for Bituminous Treatments',
    category: 'Specifications',
    description: 'Material specifications for bituminous work',
    filename: 'specification-511-materials-for-bituminous-treatments.pdf',
    path: '/api/specs/specification-511-materials-for-bituminous-treatments.pdf'
  },
  {
    id: 'spec-515',
    name: 'Specification 515 - In-Situ Stabilisation',
    category: 'Specifications',
    description: 'In-situ stabilisation of pavement materials',
    filename: 'specification-515-in-situ-stabilisation-of-pavement-materials.pdf',
    path: '/api/specs/specification-515-in-situ-stabilisation-of-pavement-materials.pdf'
  },
  {
    id: 'spec-516',
    name: 'Specification 516 - Crumb Rubber Open Graded Asphalt',
    category: 'Specifications',
    description: 'Open-graded crumb rubber asphalt requirements',
    filename: 'specification-516-crumb-rubber-open-graded-asphalt-pdf.pdf',
    path: '/api/specs/specification-516-crumb-rubber-open-graded-asphalt-pdf.pdf'
  },
  {
    id: 'spec-517',
    name: 'Specification 517 - Crumb Rubber Gap Graded Asphalt',
    category: 'Specifications',
    description: 'Gap-graded crumb rubber asphalt requirements',
    filename: 'specification-517-crumb-rubber-gap-graded-asphalt-pdf.pdf',
    path: '/api/specs/specification-517-crumb-rubber-gap-graded-asphalt-pdf.pdf'
  },
  // Test Methods
  {
    id: 'tm-straightedge',
    name: 'ATM-453-22 - Surface Deviation Using Straightedge',
    category: 'Test Methods',
    description: 'Standard test method for straight edge testing',
    filename: 'ATM-453-22_Surface_Deviation_Using_Straightedge_v1.1.pdf',
    path: '/api/specs/ATM-453-22_Surface_Deviation_Using_Straightedge_v1.1.pdf'
  },
  {
    id: 'tm-adhesion',
    name: 'Assessment of Liquid Adhesion Agents',
    category: 'Test Methods',
    description: 'Testing adhesion agents for bituminous materials',
    filename: 'assessment-of-liquid-adhesion-agents.pdf',
    path: '/api/specs/assessment-of-liquid-adhesion-agents.pdf'
  },
  {
    id: 'tm-bulk-density',
    name: 'Bulk Density and Void Content of Asphalt',
    category: 'Test Methods',
    description: 'Core density testing procedure',
    filename: 'bulk-density-and-void-content-of-asphalt.pdf',
    path: '/api/specs/bulk-density-and-void-content-of-asphalt.pdf'
  },
  {
    id: 'tm-bulk-density-vacuum',
    name: 'Bulk Density - Vacuum Sealing Method',
    category: 'Test Methods',
    description: 'Vacuum sealing method for density testing',
    filename: 'bulk-density-and-void-content-of-asphalt-vacuum-sealing-method.pdf',
    path: '/api/specs/bulk-density-and-void-content-of-asphalt-vacuum-sealing-method.pdf'
  },
  {
    id: 'tm-bitumen-density',
    name: 'Density of Bituminous Materials and Oils',
    category: 'Test Methods',
    description: 'Binder density testing procedure',
    filename: 'density-of-bituminous-materials-and-oils.pdf',
    path: '/api/specs/density-of-bituminous-materials-and-oils.pdf'
  },
  {
    id: 'tm-dsr',
    name: 'Bitumen Durability Using DSR',
    category: 'Test Methods',
    description: 'Dynamic Shear Rheometer testing procedure',
    filename: 'determination-of-bitumen-durability-using-a-dynamic-shear-rheometer-dsr.pdf',
    path: '/api/specs/determination-of-bitumen-durability-using-a-dynamic-shear-rheometer-dsr.pdf'
  },
  {
    id: 'tm-dispersion',
    name: 'Dispersion of Bitumen in Soil',
    category: 'Test Methods',
    description: 'Soil-bitumen adhesion testing',
    filename: 'dispersion-of-bitumen-in-soil.pdf',
    path: '/api/specs/dispersion-of-bitumen-in-soil.pdf'
  },
  {
    id: 'tm-rice',
    name: 'Maximum Density of Asphalt - Rice Method',
    category: 'Test Methods',
    description: 'Rice pycnometer method for maximum density',
    filename: 'maximum-density-of-asphalt-rice-method.pdf',
    path: '/api/specs/maximum-density-of-asphalt-rice-method.pdf'
  },
  {
    id: 'tm-preparation',
    name: 'Preparation of Asphalt for Testing',
    category: 'Test Methods',
    description: 'Sample preparation procedures',
    filename: 'preparation-of-asphalt-for-testing.pdf',
    path: '/api/specs/preparation-of-asphalt-for-testing.pdf'
  },
  {
    id: 'tm-sampling-asphalt',
    name: 'Sampling and Storage of Asphalt',
    category: 'Test Methods',
    description: 'Asphalt sampling procedures',
    filename: 'sampling-and-storage-of-asphalt.pdf',
    path: '/api/specs/sampling-and-storage-of-asphalt.pdf'
  },
  {
    id: 'tm-sampling-bitumen',
    name: 'Sampling Procedures for Bitumen and Oils',
    category: 'Test Methods',
    description: 'Binder sampling procedures',
    filename: 'sampling-procedures-for-bitumen-and-oils.pdf',
    path: '/api/specs/sampling-procedures-for-bitumen-and-oils.pdf'
  },
  {
    id: 'tm-marshall',
    name: 'Stability and Flow - Marshall Method',
    category: 'Test Methods',
    description: 'Marshall test procedure for asphalt',
    filename: 'stability-and-flow-of-asphalt-marshall-method.pdf',
    path: '/api/specs/stability-and-flow-of-asphalt-marshall-method.pdf'
  },
  {
    id: 'tm-emulsion',
    name: 'Stone Coating and Water Resistance Test',
    category: 'Test Methods',
    description: 'Cationic bituminous emulsion testing',
    filename: 'stone-coating-and-water-resistance-test-cationic-bituminous-emulsions.pdf',
    path: '/api/specs/stone-coating-and-water-resistance-test-cationic-bituminous-emulsions.pdf'
  },
  {
    id: 'tm-centrifuge',
    name: 'WA 730.1 - Bitumen Content (Centrifuge)',
    category: 'Test Methods',
    description: 'Centrifuge method for bitumen content',
    filename: 'wa-730.1-bitumen-content-and-particle-size-distribution-of-asphalt-and-stabilised-soil-centrifuge.pdf',
    path: '/api/specs/wa-730.1-bitumen-content-and-particle-size-distribution-of-asphalt-and-stabilised-soil-centrifuge.pdf'
  },
  {
    id: 'tm-ignition',
    name: 'WA 730.2 - Bitumen Content (Ignition Oven)',
    category: 'Test Methods',
    description: 'Ignition oven method for bitumen content',
    filename: 'wa-730.2-bitumen-content-and-particle-size-distribution-of-asphalt-ignition-oven-method.pdf',
    path: '/api/specs/wa-730.2-bitumen-content-and-particle-size-distribution-of-asphalt-ignition-oven-method.pdf'
  },
];

type TabType = 'crew' | 'specifications';

const ResourceList = () => {
  const [activeTab, setActiveTab] = useState<TabType>('specifications');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Mock crew/equipment data
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Specifications':
        return 'bg-blue-100 text-blue-800';
      case 'Test Methods':
        return 'bg-green-100 text-green-800';
      case 'QA Forms':
        return 'bg-purple-100 text-purple-800';
      case 'ITP Templates':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Specifications':
        return '📋';
      case 'Test Methods':
        return '🧪';
      case 'QA Forms':
        return '📝';
      case 'ITP Templates':
        return '✅';
      default:
        return '📄';
    }
  };

  // Filter specifications
  const filteredSpecs = specificationDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(specificationDocuments.map(d => d.category)))];

  const handleDownload = (doc: SpecDocument) => {
    // Open in new tab or trigger download
    window.open(doc.path, '_blank');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Resources"
        description="Access specifications, test methods, and manage resources"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Resources' }
        ]}
      />

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('specifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'specifications'
                  ? 'border-sga-700 text-sga-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                📚 Specifications & Test Methods
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {specificationDocuments.length}
                </span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('crew')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'crew'
                  ? 'border-sga-700 text-sga-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                👷 Crew & Equipment
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {resources.length}
                </span>
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Specifications Tab */}
      {activeTab === 'specifications' && (
        <div>
          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search specifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Specifications Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpecs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5 border border-gray-100"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{getCategoryIcon(doc.category)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                      {doc.name}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {doc.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 truncate max-w-[150px]" title={doc.filename}>
                    {doc.filename}
                  </span>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredSpecs.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Need Help Finding a Specification?</h4>
                <p className="text-blue-800 text-sm">
                  Ask the AI Assistant! Go to <a href="/chat" className="underline font-medium">AI Assistant</a> and ask questions like:
                </p>
                <ul className="mt-2 text-blue-800 text-sm list-disc list-inside">
                  <li>"What's the temperature requirement for AC14?"</li>
                  <li>"Show me the straight edge testing procedure"</li>
                  <li>"What are the compaction requirements for wearing course?"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crew & Equipment Tab */}
      {activeTab === 'crew' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium min-h-touch">
              Add Resource
            </button>
          </div>

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
                        <span>Updated {new Date(resource.lastUpdated).toLocaleDateString()}</span>
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
        </div>
      )}
    </PageContainer>
  );
};

export default ResourceList;
