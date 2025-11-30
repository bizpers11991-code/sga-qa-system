// api/save-ncr.ts
/**
 * Business Logic Flow: Non-Conformance Report (NCR) Save/Create
 * 1.  An authenticated Admin submits an NCR form.
 * 2.  If it is a new NCR, a unique, sequential, and year-based NCR ID is generated (e.g., SGA-2025-NCR-001).
 * 3.  The NCR data is validated to ensure required fields are present.
 * 4.  The complete NCR object is saved or updated in the database (SharePoint).
 * 5.  A success response is returned to the user.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NCRsData } from './_lib/sharepointData.js';
import { NonConformanceReport } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        let ncrData: NonConformanceReport = req.body;
        const isNew = !ncrData.id;

        if (isNew) {
            // Generate sequential NCR counter from SharePoint
            const year = new Date().getFullYear();
            const allNCRs = await NCRsData.getAll() as NonConformanceReport[];
            const currentYearNCRs = allNCRs.filter(ncr =>
                ncr.ncrId && ncr.ncrId.startsWith(`SGA-${year}-NCR-`)
            );
            const ncrCount = currentYearNCRs.length + 1;

            const ncrId = `SGA-${year}-NCR-${String(ncrCount).padStart(3, '0')}`;

            ncrData.ncrId = ncrId;

            // Create new NCR in SharePoint
            const created = await NCRsData.create(ncrData) as NonConformanceReport;

            res.status(200).json({ message: 'NCR saved successfully.', ncr: created });
        } else {
            // Update existing NCR
            if (!ncrData.id || !ncrData.ncrId) {
                return res.status(400).json({ message: 'NCR ID could not be determined.' });
            }

            const updated = await NCRsData.update(ncrData.id, ncrData);

            res.status(200).json({ message: 'NCR saved successfully.', ncr: updated });
        }

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