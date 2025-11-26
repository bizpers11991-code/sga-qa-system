/**
 * Project Management API Client
 *
 * Frontend service for interacting with project management endpoints.
 */

import { Project, Job, ScopeReport, FinalQaPack, NonConformanceReport, IncidentReport, DivisionRequest } from '../types';

const API_BASE = '/api';

/**
 * Create a new project
 */
export const createProject = async (
  projectData: Partial<Project> & {
    handoverId?: string;
    divisionsRequired?: { asphalt: boolean; profiling: boolean; spray: boolean };
  }
): Promise<{ success: boolean; project: Project; message: string }> => {
  const response = await fetch(`${API_BASE}/create-project`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create project');
  }

  return response.json();
};

/**
 * Get all projects with optional filters and pagination
 */
export const getProjects = async (options?: {
  status?: Project['status'];
  division?: 'Asphalt' | 'Profiling' | 'Spray';
  projectOwnerId?: string;
  clientTier?: Project['clientTier'];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}> => {
  const params = new URLSearchParams();

  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
  }

  const response = await fetch(`${API_BASE}/get-projects?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch projects');
  }

  return response.json();
};

/**
 * Get full project details with all related data
 */
export const getProject = async (id: string): Promise<{
  project: Project;
  jobs: Job[];
  scopeReports: ScopeReport[];
  qaPacks: FinalQaPack[];
  ncrs: NonConformanceReport[];
  incidents: IncidentReport[];
  divisionRequests: DivisionRequest[];
}> => {
  const response = await fetch(`${API_BASE}/get-project?id=${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch project');
  }

  return response.json();
};

/**
 * Update an existing project
 */
export const updateProject = async (
  id: string,
  updates: Partial<Project>
): Promise<{ success: boolean; project: Project; message: string }> => {
  const response = await fetch(`${API_BASE}/update-project?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update project');
  }

  return response.json();
};

/**
 * Update project status
 */
export const updateProjectStatus = async (
  id: string,
  status: Project['status'],
  notes?: string
): Promise<{
  success: boolean;
  project: Project;
  message: string;
  statusHistory: any;
}> => {
  const response = await fetch(`${API_BASE}/update-project-status?id=${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update project status');
  }

  return response.json();
};

export default {
  createProject,
  getProjects,
  getProject,
  updateProject,
  updateProjectStatus,
};
