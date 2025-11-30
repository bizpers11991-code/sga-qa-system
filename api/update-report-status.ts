// api/update-report-status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { QAPacksData } from './_lib/sharepointData.js';
import { FinalQaPack, ReportStatus, Role } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { migrateReport } from './_lib/migration.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { jobNo, version } = req.body;

    try {
        const { status, internalNotes, updatedBy } = req.body as {
            jobNo: string;
            version: number;
            status: ReportStatus;
            internalNotes?: string;
            updatedBy: string;
        };

        if (!jobNo || !version || !status || !updatedBy) {
            return res.status(400).json({ message: 'jobNo, version, status, and updatedBy are required.' });
        }

        // Get all reports for this job from SharePoint
        const allReports = await QAPacksData.getAll(`JobNo eq '${jobNo}'`) as FinalQaPack[];

        if (allReports.length === 0) {
            return res.status(404).json({ message: `No reports found for job ${jobNo}.` });
        }

        // Find the specific version
        const reportToUpdate = allReports.find(r => r.version === version);

        if (!reportToUpdate) {
            return res.status(404).json({ message: `Report version ${version} not found for job ${jobNo}.` });
        }

        if (!reportToUpdate.id) {
            return res.status(500).json({ message: 'Report ID is missing.' });
        }

        // Migrate and update the report
        let report: FinalQaPack = migrateReport(reportToUpdate);
        report.status = status;
        report.internalNotes = internalNotes;

        // Update in SharePoint
        await QAPacksData.update(reportToUpdate.id, {
            status,
            internalNotes
        } as any);

        res.status(200).json({ message: 'Report status updated successfully.', report });
    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Update Report Status Failure',
            context: { jobNo, version, authenticatedUserId: req.user.id },
        });
    }
}

const authorizedRoles: Role[] = ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'hseq_manager'];
export default withAuth(handler, authorizedRoles);