// api/get-sampling-plans.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { SamplingPlan } from '../types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const redis = getRedisInstance();
        const planIds = await redis.smembers('sampling-plans:index');

        if (planIds.length === 0) {
            return res.status(200).json([]);
        }

        const plansJson = await redis.mget(...planIds.map(id => `sampling-plan:${id}`));

        const plans = plansJson
            .filter((p): p is string => p !== null)
            .map(p => JSON.parse(p) as SamplingPlan)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        res.status(200).json(plans);

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Fetch Sampling Plans Failure',
            context: { authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer']);