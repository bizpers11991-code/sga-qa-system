// api/save-ncr.ts
/**
 * Business Logic Flow: Non-Conformance Report (NCR) Save/Create
 * 1.  An authenticated Admin submits an NCR form.
 * 2.  If it is a new NCR, a unique, sequential, and year-based NCR ID is generated (e.g., SGA-2025-NCR-001).
 * 3.  The NCR data is validated to ensure required fields are present.
 * 4.  The complete NCR object is saved or updated in the database (Redis).
 * 5.  A success response is returned to the user.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { NonConformanceReport } from '../types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const redis = getRedisInstance();
        let ncrData: NonConformanceReport = req.body;
        const isNew = !ncrData.id;

        if (isNew) {
            // Generate a unique ID and a human-readable ID
            const id = `ncr-${Date.now()}`;
            const year = new Date().getFullYear();
            const ncrCount = await redis.incr(`ncr:counter:${year}`);
            const ncrId = `SGA-${year}-NCR-${String(ncrCount).padStart(3, '0')}`;
            
            ncrData.id = id;
            ncrData.ncrId = ncrId;
        }

        if (!ncrData.id || !ncrData.ncrId) {
            return res.status(400).json({ message: 'NCR ID could not be generated.' });
        }

        const key = `ncr:${ncrData.id}`;
        
        const pipeline = redis.pipeline();
        pipeline.set(key, JSON.stringify(ncrData));
        pipeline.sadd('ncrs:index', ncrData.id);
        
        await pipeline.exec();
        
        res.status(200).json({ message: 'NCR saved successfully.', ncr: ncrData });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Save NCR Failure',
            context: { ncrId: req.body.ncrId, authenticatedUserId: req.user.id },
        });
    }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'hseq_manager']);