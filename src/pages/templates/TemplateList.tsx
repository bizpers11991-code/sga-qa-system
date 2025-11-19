import { PageContainer, PageHeader } from '../../components/layout';
import { useState } from 'react';

interface Template {
  id: string;
  name: string;
  category: string;
  lastModified: string;
  description: string;
}

const TemplateList = () => {
  // Mock data - replace with API call
  const [templates] = useState<Template[]>([
    {
      id: 'template-1',
      name: 'Standard ITP Checklist',
      category: 'Asphalt',
      lastModified: '2024-11-01',
      description: 'Standard Inspection and Test Plan checklist for asphalt placement'
    },
    {
      id: 'template-2',
      name: 'Profiling Pre-Start Inspection',
      category: 'Profiling',
      lastModified: '2024-10-25',
      description: 'Pre-start equipment inspection template for profiling operations'
    },
  ]);

  const getCategoryColor = (category: string) => {
    switch (category) {
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

  return (
    <PageContainer>
      <PageHeader
        title="ITP Templates"
        description="Manage inspection and test plan templates"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Templates' }
        ]}
        actions={
          <button className="px-4 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium min-h-touch">
            New Template
          </button>
        }
      />

      {templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">📝</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates</h3>
          <p className="text-gray-600 mb-6">Create templates to standardize your inspection processes.</p>
          <button className="px-6 py-2 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium">
            Create Template
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <a
              key={template.id}
              href={`#`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-sga-700 transition-colors">
                      {template.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{template.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>📅 Updated {new Date(template.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
                <button className="flex-shrink-0 px-4 py-2 text-sm font-medium text-sga-700 border-2 border-sga-200 rounded-lg hover:border-sga-700 hover:bg-sga-50 transition-colors whitespace-nowrap">
                  Edit
                </button>
              </div>
            </a>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default TemplateList;
