import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { IncidentReport } from '../types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const redis = getRedisInstance();
        const incidentData: IncidentReport = req.body;

        if (!incidentData.id || !incidentData.reportId) {
            return res.status(400).json({ message: 'Incident ID and Report ID are required.' });
        }

        const key = `incident:${incidentData.id}`;
        
        // Ensure the incident exists before updating
        const exists = await redis.exists(key);
        if (!exists) {
            return res.status(404).json({ message: 'Incident not found.' });
        }
        
        await redis.set(key, JSON.stringify(incidentData));
        
        res.status(200).json({ message: 'Incident report saved successfully.', incident: incidentData });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Save Incident Failure',
            context: { incidentId: req.body.id, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, [
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
]);