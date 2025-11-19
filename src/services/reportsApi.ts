// services/reportsApi.ts

import { DailyJobSheetData, FinalQaPack, SamplingPlan } from '../types';

export interface ReportFilters {
  status?: string;
  jobNo?: string;
  startDate?: string;
  endDate?: string;
  submittedBy?: string;
}

export interface ReportSummary {
  id: string;
  reportId: string;
  jobNo: string;
  submittedBy: string;
  submittedDate: string;
  status: 'Pending Review' | 'Requires Action' | 'Approved' | 'Archived';
  expertSummary?: string;
  pdfUrl?: string;
}

export interface ReportHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  notes?: string;
}

export interface CoreLocationParams {
  startChainage: number;
  endChainage: number;
  numCores: number;
  specification: string;
  lotNo: string;
  jobNo: string;
}

export interface CoreLocation {
  chainage: number;
  offset: 'LWP' | 'RWP' | 'Between WP';
  notes: string;
}

export interface DraftData {
  id: string;
  jobId: string;
  step: number;
  data: Partial<DailyJobSheetData>;
  lastSaved: string;
}

/**
 * Submit a completed report
 */
export const submitReport = async (data: FinalQaPack): Promise<{ success: boolean; reportId: string }> => {
  const response = await fetch('/api/submit-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit report');
  }

  return response.json();
};

/**
 * Save a draft report
 */
export const saveDraft = async (data: DraftData): Promise<{ success: boolean }> => {
  const response = await fetch('/api/save-draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save draft');
  }

  return response.json();
};

/**
 * Get a saved draft
 */
export const getDraft = async (jobId: string): Promise<DraftData | null> => {
  const response = await fetch(`/api/get-draft?jobId=${jobId}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to get draft');
  }

  return response.json();
};

/**
 * Get reports with optional filtering
 */
export const getReports = async (filters?: ReportFilters): Promise<ReportSummary[]> => {
  const params = new URLSearchParams();

  if (filters?.status) params.append('status', filters.status);
  if (filters?.jobNo) params.append('jobNo', filters.jobNo);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.submittedBy) params.append('submittedBy', filters.submittedBy);

  const response = await fetch(`/api/get-reports?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get reports');
  }

  return response.json();
};

/**
 * Get report history/audit trail
 */
export const getReportHistory = async (reportId: string): Promise<ReportHistoryEntry[]> => {
  const response = await fetch(`/api/get-report-history?reportId=${reportId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get report history');
  }

  return response.json();
};

/**
 * Regenerate AI summary for a report
 */
export const regenerateAISummary = async (reportId: string): Promise<{ success: boolean; summary: string }> => {
  const response = await fetch('/api/regenerate-ai-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reportId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to regenerate AI summary');
  }

  return response.json();
};

/**
 * Generate core locations for sampling plan
 */
export const generateCoreLocations = async (params: CoreLocationParams): Promise<SamplingPlan> => {
  const response = await fetch('/api/generate-core-locations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate core locations');
  }

  return response.json();
};

/**
 * Update report status
 */
export const updateReportStatus = async (
  reportId: string,
  status: string,
  notes?: string
): Promise<{ success: boolean }> => {
  const response = await fetch('/api/update-report-status', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reportId, status, notes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update report status');
  }

  return response.json();
};
