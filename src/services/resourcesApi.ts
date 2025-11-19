import { CrewResource, EquipmentResource } from '../types';

const API_BASE = '/api';

export interface ResourcesResponse {
  crew: CrewResource[];
  equipment: EquipmentResource[];
}

class ResourcesApiService {
  /**
   * Fetches all crew and equipment resources
   */
  async getResources(): Promise<ResourcesResponse> {
    try {
      const response = await fetch(`${API_BASE}/get-resources`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch resources');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  }

  /**
   * Filters crew by division
   */
  filterCrewByDivision(
    crew: CrewResource[],
    division: 'Asphalt' | 'Profiling' | 'Spray'
  ): CrewResource[] {
    return crew.filter(
      (member) => member.division === division || member.division === 'Common'
    );
  }

  /**
   * Filters equipment by division
   */
  filterEquipmentByDivision(
    equipment: EquipmentResource[],
    division: 'Asphalt' | 'Profiling' | 'Spray'
  ): EquipmentResource[] {
    return equipment.filter(
      (item) => item.division === division || item.division === 'Common'
    );
  }

  /**
   * Gets crew leaders (foremen) for a specific division
   */
  getCrewLeaders(
    crew: CrewResource[],
    division: 'Asphalt' | 'Profiling' | 'Spray'
  ): CrewResource[] {
    return this.filterCrewByDivision(crew, division).filter(
      (member) => member.isForeman
    );
  }
}

export const resourcesApi = new ResourcesApiService();
