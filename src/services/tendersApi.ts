/**
 * Tender Handover API Client
 *
 * Frontend service for interacting with tender handover endpoints.
 */

import { TenderHandover } from '../types';

const API_BASE = '/api';

/**
 * Create a new tender handover
 */
export const createHandover = async (
  handoverData: Omit<TenderHandover, 'id' | 'handoverNumber' | 'dateCreated' | 'createdBy'>
): Promise<{ success: boolean; handover: TenderHandover; message: string }> => {
  const response = await fetch(`${API_BASE}/create-handover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(handoverData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create handover');
  }

  return response.json();
};

/**
 * Get all handovers with optional filters
 */
export const getHandovers = async (filters?: {
  status?: TenderHandover['status'];
  clientTier?: TenderHandover['clientTier'];
  projectOwnerId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TenderHandover[]> => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const response = await fetch(`${API_BASE}/get-handovers?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch handovers');
  }

  return response.json();
};

/**
 * Get a single handover by ID
 */
export const getHandover = async (id: string): Promise<TenderHandover> => {
  const response = await fetch(`${API_BASE}/get-handover?id=${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch handover');
  }

  return response.json();
};

/**
 * Update an existing handover
 */
export const updateHandover = async (
  id: string,
  updates: Partial<TenderHandover>
): Promise<{ success: boolean; handover: TenderHandover; message: string }> => {
  const response = await fetch(`${API_BASE}/update-handover?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update handover');
  }

  return response.json();
};

export default {
  createHandover,
  getHandovers,
  getHandover,
  updateHandover,
};
