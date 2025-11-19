// api/save-resource.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { CrewResource, EquipmentResource, ResourceType } from '../types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const { type, resource } = req.body as { type: ResourceType; resource: CrewResource | EquipmentResource };

        if (!type || !resource || !resource.id) {
            return res.status(400).json({ message: 'Type and resource data with an ID are required.' });
        }

        const redis = getRedisInstance();
        const key = type === 'Crew' ? 'resources:crew' : 'resources:equipment';

        await redis.hset(key, { [resource.id]: JSON.stringify(resource) });

        res.status(200).json({ message: `${type} resource saved successfully.` });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Save Resource Failure',
            context: { resourceId: req.body.resource?.id, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'hseq_manager']);