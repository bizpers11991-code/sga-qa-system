import { PageContainer, PageHeader } from '../../components/layout';
import { useState } from 'react';

interface AdminSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  items: string[];
}

const AdminPanel = () => {
  const [sections] = useState<AdminSection[]>([
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage system users and their roles',
      icon: '👥',
      items: ['View Users', 'Add User', 'Edit Roles', 'Deactivate Users']
    },
    {
      id: 'system',
      title: 'System Settings',
      description: 'Configure system parameters and integrations',
      icon: '⚙️',
      items: ['API Configuration', 'Email Settings', 'Integration Keys', 'Backup Settings']
    },
    {
      id: 'audit',
      title: 'Audit & Logs',
      description: 'View system audit logs and user activity',
      icon: '📋',
      items: ['Activity Logs', 'User Logins', 'System Changes', 'Error Reports']
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Generate system and compliance reports',
      icon: '📊',
      items: ['Usage Reports', 'Compliance Reports', 'Performance Metrics', 'Export Data']
    },
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Administration Panel"
        description="Manage system configuration and users"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Admin' }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-sga-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                {section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              {section.items.map((item, index) => (
                <a
                  key={index}
                  href="#"
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-sga-700 hover:bg-sga-50 transition-colors group"
                >
                  <span className="text-gray-400 group-hover:text-sga-700 mr-3">→</span>
                  <span className="text-gray-700 group-hover:text-sga-700 font-medium">{item}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* System Health Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">API Uptime</p>
            <p className="text-2xl font-bold text-green-600">99.9%</p>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Active Users</p>
            <p className="text-2xl font-bold text-blue-600">245</p>
            <p className="text-xs text-gray-500 mt-1">Current sessions</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Database Size</p>
            <p className="text-2xl font-bold text-amber-600">2.4 GB</p>
            <p className="text-xs text-gray-500 mt-1">Total storage</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">API Response Time</p>
            <p className="text-2xl font-bold text-purple-600">145ms</p>
            <p className="text-xs text-gray-500 mt-1">Average response</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AdminPanel;
