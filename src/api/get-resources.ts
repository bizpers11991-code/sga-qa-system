// api/get-resources.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { CrewResource, EquipmentResource, Role } from '../types';
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
        const redis = getRedisInstance();

        // Check if resources are already populated
        const crewExists = await redis.exists('resources:crew');
        if (!crewExists) {
            const pipeline = redis.pipeline();
            initialCrew.forEach(c => pipeline.hset('resources:crew', { [c.id]: JSON.stringify(c) }));
            initialEquipment.forEach(e => pipeline.hset('resources:equipment', { [e.id]: JSON.stringify(e) }));
            await pipeline.exec();
        }

        const crewData = await redis.hvals('resources:crew');
        const equipmentData = await redis.hvals('resources:equipment');

        const crew = crewData.map((c: any) => (typeof c === 'string' ? JSON.parse(c) : c)).sort((a: CrewResource, b: CrewResource) => a.name.localeCompare(b.name));
        const equipment = equipmentData.map((e: any) => (typeof e === 'string' ? JSON.parse(e) : e)).sort((a: EquipmentResource, b: EquipmentResource) => a.id.localeCompare(b.id));

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