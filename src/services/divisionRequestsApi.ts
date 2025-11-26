/**
 * Division Request API Client
 *
 * Frontend service for interacting with division request endpoints.
 */

import { DivisionRequest } from '../types';

const API_BASE = '/api';

/**
 * Create a new division request
 */
export const createDivisionRequest = async (
  requestData: Omit<DivisionRequest, 'id' | 'requestNumber' | 'requestedBy' | 'status'>
): Promise<{ success: boolean; request: DivisionRequest; message: string }> => {
  const response = await fetch(`${API_BASE}/create-division-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create division request');
  }

  return response.json();
};

/**
 * Respond to a division request (accept or reject)
 */
export const respondDivisionRequest = async (
  id: string,
  response: 'accept' | 'reject',
  data: {
    responseNotes?: string;
    assignedCrewId?: string;
    assignedForemanId?: string;
    confirmedDates?: string[];
  }
): Promise<{ success: boolean; request: DivisionRequest; message: string }> => {
  const res = await fetch(`${API_BASE}/respond-division-request?id=${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ response, ...data }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to respond to division request');
  }

  return res.json();
};

/**
 * Get division requests with filters
 */
export const getDivisionRequests = async (filters?: {
  direction?: 'incoming' | 'outgoing';
  status?: DivisionRequest['status'];
  division?: DivisionRequest['requestedDivision'];
  projectId?: string;
}): Promise<DivisionRequest[]> => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const response = await fetch(`${API_BASE}/get-division-requests?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch division requests');
  }

  return response.json();
};

/**
 * Mark a division request as completed
 */
export const completeDivisionRequest = async (
  id: string,
  qaPackId: string
): Promise<{ success: boolean; request: DivisionRequest; message: string }> => {
  const response = await fetch(`${API_BASE}/complete-division-request?id=${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ qaPackId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to complete division request');
  }

  return response.json();
};

export default {
  createDivisionRequest,
  respondDivisionRequest,
  getDivisionRequests,
  completeDivisionRequest,
};
