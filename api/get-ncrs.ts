
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { NonConformanceReport, Role } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const redis = getRedisInstance();
        const ncrIds = await redis.smembers('ncrs:index');

        if (ncrIds.length === 0) {
            return res.status(200).json([]);
        }

        const ncrsJson = await redis.mget(...ncrIds.map(id => `ncr:${id}`));

        const ncrs = ncrsJson
            .filter((n): n is string | object => n !== null)
            .map(n => (typeof n === 'string' ? JSON.parse(n) : n) as NonConformanceReport)
            .sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());

        res.status(200).json(ncrs);

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Fetch NCRs Failure',
            context: { authenticatedUserId: req.user.id },
        });
    }
}

const authorizedRoles: Role[] = [
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
];

export default withAuth(handler, authorizedRoles);