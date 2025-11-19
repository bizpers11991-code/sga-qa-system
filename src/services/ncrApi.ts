// NCR (Non-Conformance Report) Management API Service

export interface NcrAttachment {
  filename: string;
  dataUrl: string;
  uploadedDate: string;
}

export interface NcrFormData {
  jobReference: string;
  issueDescription: string;
  rootCause: string;
  correctiveAction: string;
  severity: 'Critical' | 'Major' | 'Minor';
  assignedTo?: string;
  attachments: NcrAttachment[];
  issuedBy?: string;
  dateIssued?: string;
}

export interface NcrUpdate {
  action: string;
  comment: string;
  updatedBy: string;
  timestamp: string;
}

export interface Ncr {
  id: string;
  ncrId: string; // AI-generated ID
  jobReference: string;
  issueDescription: string;
  rootCause: string;
  correctiveAction: string;
  severity: 'Critical' | 'Major' | 'Minor';
  status: 'Open' | 'Under Review' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo?: string;
  issuedBy: string;
  dateIssued: string;
  attachments: NcrAttachment[];
  updates: NcrUpdate[];
  closedDate?: string;
  closedBy?: string;
  verifiedBy?: string;
  verifiedDate?: string;
}

export interface NcrFilters {
  status?: string;
  severity?: string;
  jobReference?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateNcrResponse {
  success: boolean;
  ncrId: string;
  message: string;
}

export interface UpdateNcrRequest {
  status?: 'Open' | 'Under Review' | 'In Progress' | 'Resolved' | 'Closed';
  rootCause?: string;
  correctiveAction?: string;
  assignedTo?: string;
  comment: string;
  updatedBy: string;
}

export interface CloseNcrRequest {
  comment: string;
  verifiedBy: string;
}

const API_BASE_URL = '/api';

/**
 * Create a new NCR
 */
export const createNcr = async (data: NcrFormData): Promise<CreateNcrResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-ncr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create NCR' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating NCR:', error);
    throw error;
  }
};

/**
 * Save NCR (draft or update)
 */
export const saveNcr = async (data: Partial<Ncr>): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-ncr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to save NCR' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving NCR:', error);
    throw error;
  }
};

/**
 * Get all NCRs with optional filters
 */
export const getNcrs = async (filters?: NcrFilters): Promise<Ncr[]> => {
  try {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `${API_BASE_URL}/get-ncrs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch NCRs' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.ncrs || data || [];
  } catch (error) {
    console.error('Error fetching NCRs:', error);
    throw error;
  }
};

/**
 * Get a single NCR by ID
 */
export const getNcrById = async (id: string): Promise<Ncr> => {
  try {
    const response = await fetch(`${API_BASE_URL}/get-ncrs?id=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching NCR:', error);
    throw error;
  }
};

/**
 * Update an NCR
 */
export const updateNcr = async (
  id: string,
  updateData: UpdateNcrRequest
): Promise<{ success: boolean; message: string }> => {
  try {
    const updates: NcrUpdate[] = [{
      action: updateData.status ? `Status changed to ${updateData.status}` : 'NCR updated',
      comment: updateData.comment,
      updatedBy: updateData.updatedBy,
      timestamp: new Date().toISOString(),
    }];

    const payload: Partial<Ncr> = {
      id,
      updates,
    };

    if (updateData.status) payload.status = updateData.status;
    if (updateData.rootCause) payload.rootCause = updateData.rootCause;
    if (updateData.correctiveAction) payload.correctiveAction = updateData.correctiveAction;
    if (updateData.assignedTo) payload.assignedTo = updateData.assignedTo;

    const response = await fetch(`${API_BASE_URL}/save-ncr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update NCR' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating NCR:', error);
    throw error;
  }
};

/**
 * Close an NCR
 */
export const closeNcr = async (
  id: string,
  closeData: CloseNcrRequest
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-ncr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        status: 'Closed',
        verifiedBy: closeData.verifiedBy,
        verifiedDate: new Date().toISOString(),
        closedDate: new Date().toISOString(),
        closedBy: closeData.verifiedBy,
        updates: [{
          action: 'NCR closed',
          comment: closeData.comment,
          updatedBy: closeData.verifiedBy,
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to close NCR' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error closing NCR:', error);
    throw error;
  }
};

/**
 * Assign NCR to a user
 */
export const assignNcr = async (
  id: string,
  assignedTo: string,
  assignedBy: string
): Promise<{ success: boolean; message: string }> => {
  return updateNcr(id, {
    assignedTo,
    comment: `Assigned to ${assignedTo}`,
    updatedBy: assignedBy,
  });
};

/**
 * Reopen a closed NCR
 */
export const reopenNcr = async (
  id: string,
  reason: string,
  reopenedBy: string
): Promise<{ success: boolean; message: string }> => {
  return updateNcr(id, {
    status: 'Open',
    comment: `NCR reopened. Reason: ${reason}`,
    updatedBy: reopenedBy,
  });
};
