import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { SpecificationDocument } from '../types';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const redis = getRedisInstance();
        const docIds = await redis.smembers('documents:index');

        if (docIds.length === 0) {
            return res.status(200).json([]);
        }

        const docsJson = await redis.mget(...docIds.map(id => `document:${id}`));

        const documents = docsJson
            .filter((d): d is string => d !== null)
            .map(d => JSON.parse(d) as SpecificationDocument)
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        
        res.status(200).json(documents);

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Fetch Documents Failure',
            context: { authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, [
    'asphalt_foreman', 'profiling_foreman', 'spray_foreman',
    'asphalt_engineer', 'profiling_engineer', 'spray_admin', 
    'management_admin', 'scheduler_admin', 'hseq_manager'
]);