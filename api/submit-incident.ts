// api/submit-incident.ts
/**
 * Business Logic Flow: Incident Report Submission
 * 1.  An authenticated user (any role) submits an incident report.
 * 2.  A security check confirms the user is not submitting on behalf of someone else (unless they are an admin).
 * 3.  A unique, sequential, and year-based Report ID is generated (e.g., SGA-2025-Incident-001).
 * 4.  Any attached photos are uploaded to secure cloud storage (R2).
 * 5.  The final report metadata (with URLs to photos, minus large base64 data) is saved to the database (Redis).
 * 6.  An immediate success response is sent to the user.
 * 7.  In the background, a notification is sent to the HSEQ MS Teams channel.
 */
import { Buffer } from 'buffer';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { uploadFile } from './_lib/sharepointFiles.js';
import { IncidentsData } from './_lib/sharepointData.js';
import { IncidentReport, IncidentPhoto } from '../src/types.js';
import { sendErrorNotification, sendIncidentNotification } from './_lib/teams.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

const base64ToBuffer = (base64: string): Buffer => {
  const match = base64.match(/^data:.+;base64,(.+)$/);
  if (!match) return Buffer.from(base64, 'base64');
  return Buffer.from(match[2], 'base64');
};

const uploadAsset = async (
    key: string,
    body: Buffer,
    contentType: string
): Promise<string> => {
    return await uploadFile(key, body, contentType);
};

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    let report: Partial<IncidentReport> = req.body;

    try {
        const { user } = req;
        const isAdmin = ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'hseq_manager', 'scheduler_admin'].includes(user.role);

        // Security check: Non-admins can only submit reports for themselves.
        if (!isAdmin && report.reporterId !== user.id) {
            return res.status(403).json({ message: 'Forbidden: You can only submit reports for yourself.' });
        }

        // Generate sequential incident counter from SharePoint
        const year = new Date().getFullYear();
        const allIncidents = await IncidentsData.getAll() as IncidentReport[];
        const currentYearIncidents = allIncidents.filter(inc =>
            inc.reportId && inc.reportId.startsWith(`SGA-${year}-Incident-`)
        );
        const incidentCount = currentYearIncidents.length + 1;

        const reportId = `SGA-${year}-Incident-${String(incidentCount).padStart(3, '0')}`;

        report.reportId = reportId;

        // Initialize sign-off status for the new workflow
        report.hseqSignOff = { isSigned: false };
        report.adminSignOff = { isSigned: false };

        const timestamp = new Date().toISOString();
        const datePath = timestamp.split('T')[0];

        if (report.photos && report.photos.length > 0) {
            report.photoUrls = await Promise.all(
                report.photos.map(async (photo: IncidentPhoto, index: number) => {
                    const buffer = base64ToBuffer(photo.data);
                    const key = `incidents/${datePath}/${reportId}_${index}.jpeg`;
                    return await uploadAsset(key, buffer, 'image/jpeg');
                })
            );
        }

        // Clean up base64 data before saving to DB
        if (report.photos) report.photos = [];

        const fullReport = report as IncidentReport;

        // Save to SharePoint
        const created = await IncidentsData.create(fullReport) as IncidentReport;

        // Respond to user first
        res.status(201).json({ message: 'Incident report submitted successfully.', report: created });

        // Send notification in the background
        await sendIncidentNotification(created);
        
    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Incident Submission Failure',
            context: { reporter: report.reportedBy, authenticatedUserId: req.user.id },
        });
    }
}

// Allow any authenticated user to submit an incident report
export default withAuth(handler, [
    'asphalt_foreman', 'profiling_foreman', 'spray_foreman',
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
]);