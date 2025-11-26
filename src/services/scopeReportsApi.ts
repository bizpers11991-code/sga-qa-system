/**
 * Scope Report API Client
 *
 * Frontend service for interacting with scope report endpoints.
 */

import { ScopeReport } from '../types';

const API_BASE = '/api';

/**
 * Submit a new scope report
 */
export const submitScopeReport = async (
  reportData: Omit<ScopeReport, 'id' | 'reportNumber' | 'completedBy' | 'status'>
): Promise<{ success: boolean; report: ScopeReport; message: string }> => {
  const response = await fetch(`${API_BASE}/submit-scope-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit scope report');
  }

  return response.json();
};

/**
 * Get all scope reports with optional filters
 */
export const getScopeReports = async (filters?: {
  projectId?: string;
  completedBy?: string;
  status?: ScopeReport['status'];
  visitType?: ScopeReport['visitType'];
}): Promise<ScopeReport[]> => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const response = await fetch(`${API_BASE}/get-scope-reports?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch scope reports');
  }

  return response.json();
};

/**
 * Get a single scope report by ID
 */
export const getScopeReport = async (id: string): Promise<ScopeReport> => {
  const response = await fetch(`${API_BASE}/get-scope-report?id=${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch scope report');
  }

  return response.json();
};

/**
 * Generate PDF for scope report
 */
export const generateScopeReportPDF = async (id: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE}/generate-scope-report-pdf?id=${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate PDF');
  }

  return response.blob();
};

export default {
  submitScopeReport,
  getScopeReports,
  getScopeReport,
  generateScopeReportPDF,
};
