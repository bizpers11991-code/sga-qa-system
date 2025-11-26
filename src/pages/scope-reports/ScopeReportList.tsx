import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScopeReport } from '../../types/project-management';
import { ScopeReportCard } from '../../components/scope-reports';
import { Plus, Filter } from 'lucide-react';
import * as scopeReportsApi from '../../services/scopeReportsApi';

export default function ScopeReportList() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ScopeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Draft' | 'Submitted' | 'Reviewed'>('all');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await scopeReportsApi.getScopeReports();
      setReports(data);
    } catch (error) {
      console.error('Error loading scope reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = filter === 'all'
    ? reports
    : reports.filter(r => r.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scope Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Site visit assessments and recommendations
          </p>
        </div>
        <button
          onClick={() => navigate('/scope-reports/create')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 mb-6">
        <Filter className="w-5 h-5 text-gray-400" />
        {['all', 'Draft', 'Submitted', 'Reviewed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-500">Loading reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">No scope reports found</p>
          <button
            onClick={() => navigate('/scope-reports/create')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create Your First Report
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <ScopeReportCard
              key={report.id}
              report={report}
              onClick={() => navigate(`/scope-reports/${report.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
