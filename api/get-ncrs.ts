import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NCRsData } from './_lib/sharepointData.js';
import { NonConformanceReport, Role } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        // Fetch all NCRs from SharePoint
        let ncrs = await NCRsData.getAll() as NonConformanceReport[];

        // Sort by dateIssued descending
        ncrs = ncrs.sort((a, b) =>
            new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime()
        );

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