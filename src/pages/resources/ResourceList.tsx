import { PageContainer, PageHeader } from '../../components/layout';
import { useState, useEffect } from 'react';
import { resourcesApi } from '../../services/resourcesApi';
import { CrewResource, EquipmentResource } from '../../types';

interface SpecDocument {
  id: string;
  name: string;
  category: 'Specifications' | 'Test Methods';
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

type TabType = 'specifications' | 'test-methods' | 'crew' | 'equipment';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
  count?: number;
}

const ResourceList = () => {
  const [activeTab, setActiveTab] = useState<TabType>('specifications');
  const [searchTerm, setSearchTerm] = useState('');
  const [crew, setCrew] = useState<CrewResource[]>([]);
  const [equipment, setEquipment] = useState<EquipmentResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'crew' | 'equipment'>('crew');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding new crew/equipment
  const [newCrew, setNewCrew] = useState<Partial<CrewResource>>({
    name: '',
    division: 'Asphalt',
    role: '',
    phone: '',
    email: '',
    isForeman: false,
  });
  const [newEquipment, setNewEquipment] = useState<Partial<EquipmentResource>>({
    name: '',
    division: 'Asphalt',
    type: '',
    registrationNumber: '',
    status: 'Available',
  });

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resourcesApi.getResources();
      setCrew(data.crew || []);
      setEquipment(data.equipment || []);
    } catch (err) {
      console.error('Error loading resources:', err);
      setError('Failed to load resources. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter documents by category
  const specifications = specificationDocuments.filter(d => d.category === 'Specifications');
  const testMethods = specificationDocuments.filter(d => d.category === 'Test Methods');

  const tabs: TabConfig[] = [
    { id: 'specifications', label: 'Specifications', icon: '📋', count: specifications.length },
    { id: 'test-methods', label: 'Test Methods', icon: '🧪', count: testMethods.length },
    { id: 'crew', label: 'Crew', icon: '👷', count: crew.length },
    { id: 'equipment', label: 'Equipment', icon: '🚜', count: equipment.length },
  ];

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
        return 'bg-green-100 text-green-800';
      case 'In Use':
        return 'bg-blue-100 text-blue-800';
      case 'Maintenance':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewPdf = (doc: SpecDocument) => {
    window.open(doc.path, '_blank');
  };

  const handleDownloadPdf = (doc: SpecDocument) => {
    const link = document.createElement('a');
    link.href = doc.path;
    link.download = doc.filename;
    link.click();
  };

  const handleAddResource = async () => {
    setSaving(true);
    setError(null);
    try {
      const resourceData = addType === 'crew'
        ? { ...newCrew, id: `crew-${Date.now()}` }
        : { ...newEquipment, id: `equip-${Date.now()}` };

      const response = await fetch('/api/save-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: addType, resource: resourceData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save resource');
      }

      setShowAddModal(false);
      // Reset forms
      setNewCrew({ name: '', division: 'Asphalt', role: '', phone: '', email: '', isForeman: false });
      setNewEquipment({ name: '', division: 'Asphalt', type: '', registrationNumber: '', status: 'Available' });
      // Reload resources
      await loadResources();
    } catch (err) {
      console.error('Error saving resource:', err);
      setError('Failed to save resource. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = (type: 'crew' | 'equipment') => {
    setAddType(type);
    setShowAddModal(true);
    setError(null);
  };

  // Filter by search term
  const filterBySearch = <T extends { name: string }>(items: T[]): T[] => {
    if (!searchTerm) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredSpecs = filterBySearch(specifications);
  const filteredTestMethods = filterBySearch(testMethods);
  const filteredCrew = filterBySearch(crew);
  const filteredEquipment = filterBySearch(equipment);

  return (
    <PageContainer>
      <PageHeader
        title="Resources"
        description="Access specifications, test methods, and manage crew & equipment"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Resources' }
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Vertical Tabs (Left Sidebar) */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-2 lg:sticky lg:top-4">
            <nav className="flex lg:flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all w-full ${
                    activeTab === tab.id
                      ? 'bg-sga-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{tab.label}</div>
                    <div className={`text-xs ${activeTab === tab.id ? 'text-sga-200' : 'text-gray-500'}`}>
                      {tab.count} items
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder={`Search ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === 'specifications' && (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredSpecs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5 border border-gray-100"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">📋</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                        {doc.name}
                      </h3>
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Specification
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {doc.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewPdf(doc)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(doc)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              ))}
              {filteredSpecs.length === 0 && (
                <div className="col-span-2 bg-white rounded-lg shadow p-12 text-center">
                  <span className="text-4xl mb-4 block">🔍</span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Specifications Found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          )}

          {/* Test Methods Tab */}
          {activeTab === 'test-methods' && (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTestMethods.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5 border border-gray-100"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">🧪</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                        {doc.name}
                      </h3>
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Test Method
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {doc.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewPdf(doc)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(doc)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              ))}
              {filteredTestMethods.length === 0 && (
                <div className="col-span-2 bg-white rounded-lg shadow p-12 text-center">
                  <span className="text-4xl mb-4 block">🔍</span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Test Methods Found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          )}

          {/* Crew Tab */}
          {activeTab === 'crew' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => openAddModal('crew')}
                  className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Crew Member
                </button>
              </div>

              {loading ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sga-700 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading crew...</p>
                </div>
              ) : filteredCrew.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <span className="text-4xl mb-4 block">👷</span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Crew Members</h3>
                  <p className="text-gray-600 mb-6">Add crew members to your system.</p>
                  <button
                    onClick={() => openAddModal('crew')}
                    className="px-6 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium"
                  >
                    Add Crew Member
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCrew.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5 border border-gray-100"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                            👷
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-600">{member.role || 'Crew Member'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDivisionColor(member.division)}`}>
                            {member.division}
                          </span>
                          {member.isForeman && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Foreman
                            </span>
                          )}
                        </div>
                      </div>
                      {(member.phone || member.email) && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
                          {member.phone && <span>📞 {member.phone}</span>}
                          {member.email && <span>✉️ {member.email}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => openAddModal('equipment')}
                  className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Equipment
                </button>
              </div>

              {loading ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sga-700 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading equipment...</p>
                </div>
              ) : filteredEquipment.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <span className="text-4xl mb-4 block">🚜</span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Equipment</h3>
                  <p className="text-gray-600 mb-6">Add equipment to your system.</p>
                  <button
                    onClick={() => openAddModal('equipment')}
                    className="px-6 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium"
                  >
                    Add Equipment
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEquipment.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5 border border-gray-100"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                            🚜
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600">{item.type || 'Equipment'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDivisionColor(item.division)}`}>
                            {item.division}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                      {item.registrationNumber && (
                        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                          Registration: {item.registrationNumber}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Add {addType === 'crew' ? 'Crew Member' : 'Equipment'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {addType === 'crew' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newCrew.name}
                      onChange={(e) => setNewCrew({ ...newCrew, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
                    <select
                      value={newCrew.division}
                      onChange={(e) => setNewCrew({ ...newCrew, division: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
                    >
                      <option value="Asphalt">Asphalt</option>
                      <option value="Profiling">Profiling</option>
                      <option value="Spray">Spray</option>
                      <option value="Common">Common</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input
                      type="text"
                      value={newCrew.role}
                      onChange={(e) => setNewCrew({ ...newCrew, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
                      placeholder="Roller Operator"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newCrew.phone}
                      onChange={(e) => setNewCrew({ ...newCrew, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
                      placeholder="0400 000 000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newCrew.email}
                      onChange={(e) => setNewCrew({ ...newCrew, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
                      placeholder="john@sga.com.au"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isForeman"
                      checked={newCrew.isForeman}
                      onChange={(e) => setNewCrew({ ...newCrew, isForeman: e.target.checked })}
                      className="w-4 h-4 text-sga-700 border-gray-300 rounded focus:ring-sga-500"
                    />
                    <label htmlFor="isForeman" className="text-sm text-gray-700">Is Foreman/Crew Leader</label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newEquipment.name}
                      onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
                      placeholder="2m Profiler #1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
                    <select
                      value={newEquipment.division}
                      onChange={(e) => setNewEquipment({ ...newEquipment, division: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
                    >
                      <option value="Asphalt">Asphalt</option>
                      <option value="Profiling">Profiling</option>
                      <option value="Spray">Spray</option>
                      <option value="Common">Common</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <input
                      type="text"
                      value={newEquipment.type}
                      onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
                      placeholder="Profiler, Roller, Paver, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    <input
                      type="text"
                      value={newEquipment.registrationNumber}
                      onChange={(e) => setNewEquipment({ ...newEquipment, registrationNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
                      placeholder="ABC-123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newEquipment.status}
                      onChange={(e) => setNewEquipment({ ...newEquipment, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
                    >
                      <option value="Available">Available</option>
                      <option value="In Use">In Use</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddResource}
                  disabled={saving || (addType === 'crew' ? !newCrew.name : !newEquipment.name)}
                  className="flex-1 px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default ResourceList;
