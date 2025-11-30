// api/save-sampling-plan.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SamplingPlansData } from './_lib/sharepointData';
import { SamplingPlan } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const planData: SamplingPlan = req.body;

        if (!planData.id || !planData.jobNo || !planData.lotNo) {
            return res.status(400).json({ message: 'Plan ID, Job No, and Lot No are required.' });
        }

        // Check if plan exists to determine update vs create
        const existingPlan = await SamplingPlansData.getById(planData.id);

        let savedPlan;
        if (existingPlan) {
            // Update existing plan
            savedPlan = await SamplingPlansData.update(planData.id, planData);
        } else {
            // Create new plan
            const { id, ...planWithoutId } = planData;
            savedPlan = await SamplingPlansData.create(planWithoutId);
        }

        res.status(200).json({ message: 'Sampling plan saved successfully.', plan: savedPlan });

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