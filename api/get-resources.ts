// api/get-resources.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ResourcesData } from './_lib/sharepointData';
import { CrewResource, EquipmentResource, Role } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

// Mock data for initial population
const initialCrew: CrewResource[] = [
  { id: 'crew-1', name: 'John Blundell Snr', division: 'Profiling', isForeman: true },
  { id: 'crew-2', name: 'John Blundell Jnr', division: 'Profiling', isForeman: true },
  { id: 'crew-3', name: 'Scott Haney', division: 'Profiling', isForeman: false },
  { id: 'crew-4', name: 'Jacob Gogoley', division: 'Profiling', isForeman: false },
  { id: 'crew-5', name: 'Jahani Kepa', division: 'Profiling', isForeman: false },
  { id: 'crew-6', name: 'Jack Blundell', division: 'Profiling', isForeman: false },
  { id: 'crew-7', name: 'Jack Williams', division: 'Profiling', isForeman: false },
  { id: 'crew-8', name: 'Geryd Adams', division: 'Profiling', isForeman: false },
];

const initialEquipment: EquipmentResource[] = [
  { id: 'SGA87', name: '2m Profiler', type: 'Profiler', division: 'Profiling' },
  { id: 'SGA100', name: '2m Profiler', type: 'Profiler', division: 'Profiling' },
  { id: 'SGA55', name: 'Pocket Rocket', type: 'Profiler', division: 'Profiling' },
  { id: 'SGA108', name: 'Pocket Rocket', type: 'Profiler', division: 'Profiling' },
  { id: 'SGA88', name: 'Skid Steer', type: 'Skid Steer', division: 'Profiling' },
  { id: 'SGA115', name: 'Skid Steer', type: 'Skid Steer', division: 'Profiling' },
];


async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Get all resources from SharePoint
        const allResources = await ResourcesData.getAll();

        // Check if resources need initial population
        if (allResources.length === 0) {
            // Populate with initial data
            const promises = [
                ...initialCrew.map(c => ResourcesData.create({ ...c, resourceType: 'Crew' })),
                ...initialEquipment.map(e => ResourcesData.create({ ...e, resourceType: 'Equipment' }))
            ];
            await Promise.all(promises);

            // Fetch again after population
            const resources = await ResourcesData.getAll();
            const crew = resources.filter((r: any) => r.resourceType === 'Crew').sort((a: any, b: any) => a.name.localeCompare(b.name));
            const equipment = resources.filter((r: any) => r.resourceType === 'Equipment').sort((a: any, b: any) => a.id.localeCompare(b.id));
            return res.status(200).json({ crew, equipment });
        }

        // Separate crew and equipment
        const crew = allResources.filter((r: any) => r.resourceType === 'Crew').sort((a: any, b: any) => a.name.localeCompare(b.name));
        const equipment = allResources.filter((r: any) => r.resourceType === 'Equipment').sort((a: any, b: any) => a.id.localeCompare(b.id));

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