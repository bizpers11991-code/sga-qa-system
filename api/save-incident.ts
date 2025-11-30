import type { VercelRequest, VercelResponse } from '@vercel/node';
import { IncidentsData } from './_lib/sharepointData.js';
import { IncidentReport } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const incidentData: IncidentReport = req.body;

        if (!incidentData.id || !incidentData.reportId) {
            return res.status(400).json({ message: 'Incident ID and Report ID are required.' });
        }

        // Ensure the incident exists before updating
        const existing = await IncidentsData.getById(incidentData.id);
        if (!existing) {
            return res.status(404).json({ message: 'Incident not found.' });
        }

        // Update the incident in SharePoint
        const updated = await IncidentsData.update(incidentData.id, incidentData);

        res.status(200).json({ message: 'Incident report saved successfully.', incident: updated });

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