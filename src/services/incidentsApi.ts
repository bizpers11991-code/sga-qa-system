// Incident Management API Service

export interface IncidentPhoto {
  dataUrl: string;
  filename: string;
  timestamp: string;
}

export interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export interface IncidentFormData {
  type: 'Incident' | 'Near Miss' | 'Hazard';
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  location: string;
  photos: IncidentPhoto[];
  gpsLocation?: GpsLocation;
  isEmergency: boolean;
  reportedBy?: string;
  reportedDate?: string;
}

export interface IncidentUpdate {
  status: string;
  comment: string;
  updatedBy: string;
  timestamp: string;
}

export interface Incident {
  id: string;
  incidentId: string; // AI-generated ID
  type: 'Incident' | 'Near Miss' | 'Hazard';
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  location: string;
  photos: IncidentPhoto[];
  gpsLocation?: GpsLocation;
  isEmergency: boolean;
  status: 'Open' | 'Under Investigation' | 'Closed';
  reportedBy: string;
  reportedDate: string;
  updates: IncidentUpdate[];
  closedDate?: string;
  closedBy?: string;
}

export interface IncidentFilters {
  type?: string;
  severity?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  isEmergency?: boolean;
}

export interface SubmitIncidentResponse {
  success: boolean;
  incidentId: string;
  message: string;
}

export interface UpdateIncidentStatusRequest {
  status: 'Open' | 'Under Investigation' | 'Closed';
  comment: string;
  updatedBy: string;
}

const API_BASE_URL = '/api';

/**
 * Submit a new incident report
 */
export const submitIncident = async (data: IncidentFormData): Promise<SubmitIncidentResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/submit-incident`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to submit incident' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error submitting incident:', error);
    throw error;
  }
};

/**
 * Save incident (draft or update)
 */
export const saveIncident = async (data: Partial<Incident>): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-incident`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to save incident' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving incident:', error);
    throw error;
  }
};

/**
 * Get all incidents with optional filters
 */
export const getIncidents = async (filters?: IncidentFilters): Promise<Incident[]> => {
  try {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `${API_BASE_URL}/get-incidents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch incidents' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.incidents || data || [];
  } catch (error) {
    console.error('Error fetching incidents:', error);
    throw error;
  }
};

/**
 * Get a single incident by ID
 */
export const getIncidentById = async (id: string): Promise<Incident> => {
  try {
    const response = await fetch(`${API_BASE_URL}/get-incidents?id=${id}`, {
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
    console.error('Error fetching incident:', error);
    throw error;
  }
};

/**
 * Update incident status
 */
export const updateIncidentStatus = async (
  id: string,
  statusUpdate: UpdateIncidentStatusRequest
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/save-incident`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        status: statusUpdate.status,
        updates: [{
          status: statusUpdate.status,
          comment: statusUpdate.comment,
          updatedBy: statusUpdate.updatedBy,
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update status' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating incident status:', error);
    throw error;
  }
};

/**
 * Capture GPS location
 */
export const captureGpsLocation = (): Promise<GpsLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};
