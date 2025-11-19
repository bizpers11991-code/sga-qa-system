// api/delete-resource.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { ResourceType } from '../types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const { type, id } = req.body as { type: ResourceType; id: string };

        if (!type || !id) {
            return res.status(400).json({ message: 'Type and ID are required.' });
        }

        const redis = getRedisInstance();
        const key = type === 'Crew' ? 'resources:crew' : 'resources:equipment';

        const result = await redis.hdel(key, id);

        if (result > 0) {
            res.status(200).json({ message: `${type} resource deleted successfully.` });
        } else {
            res.status(404).json({ message: 'Resource not found.' });
        }

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Delete Resource Failure',
            context: { resourceId: req.body.id, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'hseq_manager']);