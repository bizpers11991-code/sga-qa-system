// api/save-sampling-plan.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { SamplingPlan } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const redis = getRedisInstance();
        const planData: SamplingPlan = req.body;

        if (!planData.id || !planData.jobNo || !planData.lotNo) {
            return res.status(400).json({ message: 'Plan ID, Job No, and Lot No are required.' });
        }

        const key = `sampling-plan:${planData.id}`;
        
        const pipeline = redis.pipeline();
        pipeline.set(key, JSON.stringify(planData));
        pipeline.sadd('sampling-plans:index', planData.id);
        
        await pipeline.exec();
        
        res.status(200).json({ message: 'Sampling plan saved successfully.', plan: planData });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Save Sampling Plan Failure',
            context: { planId: req.body.id, authenticatedUserId: req.user.id },
        });
    }
}

// Only allow asphalt engineers to save plans, as this is a lab/asphalt specific tool for now.
export default withAuth(handler, ['asphalt_engineer']);