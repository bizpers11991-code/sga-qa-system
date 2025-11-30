import type { VercelRequest, VercelResponse } from '@vercel/node';
import { IncidentsData } from './_lib/sharepointData.js';
import { IncidentReport, SecureForeman } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    const { reporterId } = req.query;
    try {
        const { user } = req;

        // Fetch all incidents from SharePoint
        let incidents = await IncidentsData.getAll() as IncidentReport[];

        // Sort by dateOfIncident descending
        incidents = incidents.sort((a, b) =>
            new Date(b.dateOfIncident).getTime() - new Date(a.dateOfIncident).getTime()
        );

        // --- Authorization Logic ---
        const isAdmin = ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'scheduler_admin', 'hseq_manager'].includes(user.role);

        // If the user is a foreman (and not an admin), they can ONLY see their own reports.
        if (!isAdmin) {
            incidents = incidents.filter(i => i.reporterId === user.id);
        }
        // If the user is an admin, they can see all, or filter by a specific reporterId if provided.
        else if (reporterId && typeof reporterId === 'string') {
            incidents = incidents.filter(i => i.reporterId === reporterId);
        }

        res.status(200).json(incidents);

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Fetch Incidents Failure',
            context: { reporterId, authenticatedUserId: req.user.id },
        });
    }
}

// Allow any authenticated user to access this endpoint.
// The handler itself will perform the necessary authorization checks.
export default withAuth(handler, [
    'asphalt_foreman', 'profiling_foreman', 'spray_foreman',
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
]);