// api/get-sampling-plans.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SamplingPlansData } from './_lib/sharepointData.js';
import { SamplingPlan } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const plans = await SamplingPlansData.getAll();

        // Sort by timestamp (most recent first)
        const sortedPlans = plans.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        res.status(200).json(sortedPlans);

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