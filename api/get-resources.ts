// api/get-resources.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ResourcesData, ForemenData } from './_lib/sharepointData.js';
import { CrewResource, EquipmentResource, Role } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

/**
 * Equipment types that belong to each division
 * Based on the SGA Fleet Register upload
 */
const EQUIPMENT_TYPES = ['Paver', 'Roller', 'Truck', 'Profiler', 'Other Equipment'];

// Division mapping for equipment types
function getEquipmentDivision(resourceType: string, division: string): 'Asphalt' | 'Profiling' | 'Spray' | 'Transport' | 'Common' {
    // If division is already set correctly, use it
    if (division === 'Asphalt' || division === 'Profiling' || division === 'Spray' || division === 'Transport') {
        return division;
    }
    // Map 'Shared' to 'Common' for backwards compatibility
    if (division === 'Shared') {
        return 'Common';
    }
    return 'Common';
}

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Get all resources from SharePoint Resources list
        const allResources = await ResourcesData.getAll();

        // Get crew from Foremen list (people marked as crew/foremen)
        const foremenList = await ForemenData.getAll();

        // Convert foremen to CrewResource format
        const crew: CrewResource[] = foremenList.map((f: any) => ({
            id: f.id || f.title,
            name: f.name || f.title,
            division: f.division || 'Common',
            isForeman: f.role?.toLowerCase().includes('foreman') || f.isForeman || false,
            role: f.role,
            phone: f.phone,
            email: f.email,
        })).sort((a: CrewResource, b: CrewResource) => a.name.localeCompare(b.name));

        // Convert SharePoint resources to EquipmentResource format
        // SharePoint fields: Title, ResourceName, ResourceType, Division, Status, RegistrationNumber, Notes
        const equipment: EquipmentResource[] = allResources
            .filter((r: any) => EQUIPMENT_TYPES.includes(r.resourceType))
            .map((r: any) => ({
                id: r.title || r.id, // Title is the SGA asset number (SGA001, SGA002, etc.)
                name: r.resourceName || r.title,
                type: r.resourceType || 'Other Equipment',
                division: getEquipmentDivision(r.resourceType, r.division),
                registrationNumber: r.registrationNumber || undefined,
                status: r.status || 'Available',
            }))
            .sort((a: EquipmentResource, b: EquipmentResource) => a.id.localeCompare(b.id));

        res.status(200).json({ crew, equipment });
    } catch (error: any) {
        await handleApiError({ res, error, title: 'Fetch Resources Failure' });
    }
}

const authorizedRoles: Role[] = [
    'asphalt_foreman', 'profiling_foreman', 'spray_foreman',
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
];

export default withAuth(handler, authorizedRoles);