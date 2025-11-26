import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ScopeReportForm } from '../../components/scope-reports';
import * as scopeReportsApi from '../../services/scopeReportsApi';
import { ScopeReport } from '../../types/project-management';
import { ArrowLeft } from 'lucide-react';

export default function ScopeReportCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (report: Partial<ScopeReport>) => {
    try {
      setError(null);
      // Save draft functionality - implement when API ready
      console.log('Saving draft:', report);
      // Show success toast (you can add a toast library)
      alert('Draft saved successfully');
    } catch (err) {
      setError('Failed to save draft');
      console.error(err);
    }
  };

  const handleSubmit = async (report: Partial<ScopeReport>) => {
    try {
      setError(null);
      await scopeReportsApi.submitScopeReport(report as any);
      alert('Scope report submitted successfully!');
      navigate('/scope-reports');
    } catch (err) {
      setError('Failed to submit report');
      console.error(err);
    }
  };

  if (!projectId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p>No project ID provided. Please select a project first.</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-2 text-red-900 underline"
          >
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/scope-reports')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Scope Reports
        </button>
        <h1 className="text-3xl font-bold text-gray-900">New Scope Report</h1>
        <p className="mt-1 text-sm text-gray-500">Complete site visit assessment</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <ScopeReportForm
        projectId={projectId}
        onSave={handleSave}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
