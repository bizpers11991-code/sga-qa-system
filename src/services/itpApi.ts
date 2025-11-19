import { ItpChecklistData } from '../types';

const API_BASE = '/api';

class ItpApiService {
  /**
   * Fetches all ITP templates
   */
  async getItpTemplates(): Promise<ItpChecklistData[]> {
    try {
      const response = await fetch(`${API_BASE}/get-itp-templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch ITP templates');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ITP templates:', error);
      throw error;
    }
  }

  /**
   * Fetches a specific ITP template by ID
   */
  async getItpTemplate(templateId: string): Promise<ItpChecklistData> {
    try {
      const response = await fetch(`${API_BASE}/get-itp-templates?id=${encodeURIComponent(templateId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch ITP template');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ITP template:', error);
      throw error;
    }
  }
}

export const itpApi = new ItpApiService();
