import { PageContainer, PageHeader } from '../../components/layout';
import { useState, useEffect, useCallback } from 'react';
import { resourcesApi } from '../../services/resourcesApi';
import { CrewResource, EquipmentResource } from '../../types';

// Types for dynamic documents API
interface DocumentItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  webUrl: string;
  downloadUrl?: string;
  lastModified: string;
  path: string;
}

interface DocumentsResponse {
  library: string;
  folder: string | null;
  items: DocumentItem[];
  breadcrumb: { name: string; path: string }[];
}

type TabType = 'specifications' | 'test-methods' | 'crew' | 'equipment';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
  library?: string; // SharePoint library name
}

const ResourceList = () => {
  const [activeTab, setActiveTab] = useState<TabType>('specifications');
  const [searchTerm, setSearchTerm] = useState('');

  // Crew & Equipment state
  const [crew, setCrew] = useState<CrewResource[]>([]);
  const [equipment, setEquipment] = useState<EquipmentResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<{ name: string; path: string }[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'crew' | 'equipment'>('crew');
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<any>({});

  const tabs: TabConfig[] = [
    { id: 'specifications', label: 'Specifications', icon: '📋', library: 'Specifications' },
    { id: 'test-methods', label: 'Test Methods', icon: '🧪', library: 'TestMethods' },
    { id: 'crew', label: 'Crew', icon: '👷' },
    { id: 'equipment', label: 'Equipment', icon: '🚜' },
  ];

  // Load documents from SharePoint
  const loadDocuments = useCallback(async (library: string, folder: string | null = null) => {
    setDocsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ library });
      if (folder) params.append('folder', folder);

      const response = await fetch(`/api/resources/documents?${params}`);
      if (!response.ok) throw new Error('Failed to load documents');

      const data: DocumentsResponse = await response.json();
      setDocuments(data.items);
      setBreadcrumb(data.breadcrumb);
      setCurrentFolder(folder);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents. Please try again.');
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  // Load crew and equipment
  const loadResources = async () => {
    setResourcesLoading(true);
    setError(null);
    try {
      const data = await resourcesApi.getResources();
      setCrew(data.crew || []);
      setEquipment(data.equipment || []);
    } catch (err) {
      console.error('Error loading resources:', err);
      setError('Failed to load resources. Please try again.');
    } finally {
      setResourcesLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadResources();
  }, []);

  // Load documents when tab changes
  useEffect(() => {
    const tab = tabs.find(t => t.id === activeTab);
    if (tab?.library) {
      loadDocuments(tab.library, null);
    }
  }, [activeTab, loadDocuments]);

  // Navigate to folder
  const navigateToFolder = (path: string | null) => {
    const tab = tabs.find(t => t.id === activeTab);
    if (tab?.library) {
      loadDocuments(tab.library, path);
    }
  };

  // Open document or navigate to folder
  const handleItemClick = (item: DocumentItem) => {
    if (item.type === 'folder') {
      navigateToFolder(item.path);
    } else {
      window.open(item.webUrl, '_blank');
    }
  };

  // Download file
  const handleDownload = (item: DocumentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.downloadUrl) {
      window.open(item.downloadUrl, '_blank');
    } else {
      window.open(item.webUrl, '_blank');
    }
  };

  // Format file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Modal handlers
  const openAddModal = (type: 'crew' | 'equipment') => {
    setModalType(type);
    setModalMode('add');
    setEditingItem(null);
    setFormData(type === 'crew'
      ? { name: '', division: 'Asphalt', role: '', phone: '', email: '', isForeman: false }
      : { name: '', division: 'Asphalt', type: '', registrationNumber: '', status: 'Available', fleetId: '' }
    );
    setShowModal(true);
    setError(null);
  };

  const openEditModal = (type: 'crew' | 'equipment', item: any) => {
    setModalType(type);
    setModalMode('edit');
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const endpoint = modalType === 'crew' ? '/api/crew' : '/api/equipment';
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const url = modalMode === 'edit' ? `${endpoint}?id=${editingItem.id}` : endpoint;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      setShowModal(false);
      await loadResources();
    } catch (err: any) {
      console.error('Error saving:', err);
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: 'crew' | 'equipment', id: string) => {
    if (!confirm(`Are you sure you want to ${type === 'crew' ? 'deactivate this crew member' : 'delete this equipment'}?`)) {
      return;
    }

    try {
      const endpoint = type === 'crew' ? '/api/crew' : '/api/equipment';
      const response = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }

      await loadResources();
    } catch (err: any) {
      console.error('Error deleting:', err);
      setError(err.message || 'Failed to delete. Please try again.');
    }
  };

  // Filter items by search
  const filterBySearch = <T extends { name: string }>(items: T[]): T[] => {
    if (!searchTerm) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredDocuments = filterBySearch(documents);
  const filteredCrew = filterBySearch(crew);
  const filteredEquipment = filterBySearch(equipment);

  const getDivisionColor = (division: string) => {
    const colors: Record<string, string> = {
      'Asphalt': 'bg-blue-100 text-blue-800',
      'Profiling': 'bg-purple-100 text-purple-800',
      'Spray': 'bg-green-100 text-green-800',
      'Common': 'bg-gray-100 text-gray-800',
    };
    return colors[division] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Available': 'bg-green-100 text-green-800',
      'In Use': 'bg-blue-100 text-blue-800',
      'Maintenance': 'bg-amber-100 text-amber-800',
      'Retired': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const isDocumentTab = activeTab === 'specifications' || activeTab === 'test-methods';

  return (
    <PageContainer>
      <PageHeader
        title="Resources"
        description="Access specifications, test methods, and manage crew & equipment"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Resources' }]}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-2 lg:sticky lg:top-4">
            <nav className="flex lg:flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchTerm(''); setCurrentFolder(null); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all w-full ${
                    activeTab === tab.id
                      ? 'bg-sga-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{tab.label}</div>
                  </div>
                </button>
              ))}
            </nav>

            {/* SharePoint Link */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a
                href="https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-sga-700"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                Open in SharePoint
              </a>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder={`Search ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500 focus:border-sga-500"
            />
          </div>

          {/* Breadcrumb for documents */}
          {isDocumentTab && breadcrumb.length > 1 && (
            <div className="mb-4 flex items-center gap-2 text-sm">
              {breadcrumb.map((item, index) => (
                <span key={item.path} className="flex items-center gap-2">
                  {index > 0 && <span className="text-gray-400">/</span>}
                  <button
                    onClick={() => navigateToFolder(item.path || null)}
                    className={`hover:text-sga-700 ${index === breadcrumb.length - 1 ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                  >
                    {item.name}
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          {/* Document Tabs (Specifications & Test Methods) */}
          {isDocumentTab && (
            <div>
              {docsLoading ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sga-700 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <span className="text-4xl mb-4 block">{activeTab === 'specifications' ? '📋' : '🧪'}</span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
                  <p className="text-gray-600">
                    {currentFolder ? 'This folder is empty.' : 'No documents in this library.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDocuments.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-all p-4 border border-gray-100 cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {item.type === 'folder' ? '📁' : '📄'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm truncate group-hover:text-sga-700">
                            {item.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.type === 'folder' ? 'Folder' : formatSize(item.size)}
                          </p>
                        </div>
                      </div>
                      {item.type === 'file' && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); window.open(item.webUrl, '_blank'); }}
                            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => handleDownload(item, e)}
                            className="flex-1 px-3 py-1.5 text-xs bg-sga-700 text-white rounded hover:bg-sga-600 font-medium"
                          >
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
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

              {resourcesLoading ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sga-700 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading crew...</p>
                </div>
              ) : filteredCrew.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <span className="text-4xl mb-4 block">👷</span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Crew Members</h3>
                  <p className="text-gray-600 mb-6">Add crew members to your system.</p>
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
                          <button
                            onClick={() => openEditModal('crew', member)}
                            className="p-2 text-gray-400 hover:text-sga-700 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete('crew', member.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Deactivate"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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

              {resourcesLoading ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sga-700 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading equipment...</p>
                </div>
              ) : filteredEquipment.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <span className="text-4xl mb-4 block">🚜</span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Equipment</h3>
                  <p className="text-gray-600 mb-6">Add equipment to your system.</p>
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
                            <p className="text-sm text-gray-600">{item.type || 'Equipment'} • {item.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDivisionColor(item.division)}`}>
                            {item.division}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <button
                            onClick={() => openEditModal('equipment', item)}
                            className="p-2 text-gray-400 hover:text-sga-700 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete('equipment', item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === 'add' ? 'Add' : 'Edit'} {modalType === 'crew' ? 'Crew Member' : 'Equipment'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
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

              {modalType === 'crew' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
                    <select
                      value={formData.division || 'Asphalt'}
                      onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
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
                      value={formData.role || ''}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                      placeholder="Roller Operator"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                      placeholder="0400 000 000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                      placeholder="john@sga.com.au"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isForeman"
                      checked={formData.isForeman || false}
                      onChange={(e) => setFormData({ ...formData, isForeman: e.target.checked })}
                      className="w-4 h-4 text-sga-700 border-gray-300 rounded focus:ring-sga-500"
                    />
                    <label htmlFor="isForeman" className="text-sm text-gray-700">Is Foreman/Crew Leader</label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fleet ID</label>
                    <input
                      type="text"
                      value={formData.fleetId || ''}
                      onChange={(e) => setFormData({ ...formData, fleetId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                      placeholder="SGA100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                      placeholder="2m Profiler"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <input
                      type="text"
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                      placeholder="Profiler, Roller, Paver"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
                    <select
                      value={formData.division || 'Asphalt'}
                      onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                    >
                      <option value="Asphalt">Asphalt</option>
                      <option value="Profiling">Profiling</option>
                      <option value="Spray">Spray</option>
                      <option value="Common">Common</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration</label>
                    <input
                      type="text"
                      value={formData.registrationNumber || ''}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                      placeholder="ABC-123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status || 'Available'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-500"
                    >
                      <option value="Available">Available</option>
                      <option value="In Use">In Use</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.name}
                  className="flex-1 px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 font-medium disabled:opacity-50"
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
