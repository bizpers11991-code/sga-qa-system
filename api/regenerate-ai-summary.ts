// api/regenerate-ai-summary.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { QAPacksData } from './_lib/sharepointData';
import { generateReportSummary } from './_lib/copilot.js';
import { FinalQaPack, Role } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { migrateReport } from './_lib/migration.js';
import { handleApiError } from './_lib/errors.js';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { jobNo, version } = req.body;

    try {
        if (!jobNo || !version) {
            return res.status(400).json({ message: 'jobNo and version are required.' });
        }

        // Get all QA packs for this job number
        const allPacks = await QAPacksData.getAll(`JobNo eq '${jobNo}'`);

        // Sort by version to get the correct order (assuming version field exists)
        const sortedPacks = allPacks.sort((a: any, b: any) => (a.version || 0) - (b.version || 0));

        if (version > sortedPacks.length || version < 1) {
            return res.status(404).json({ message: `Report version ${version} not found.` });
        }

        // Get the pack at the requested version (1-indexed)
        const packToUpdate = sortedPacks[version - 1];
        if (!packToUpdate) {
            return res.status(404).json({ message: 'Report data is missing or corrupt.' });
        }

        let report: FinalQaPack = migrateReport(packToUpdate as any);

        // Indicate that the summary is being processed
        report.expertSummaryStatus = 'pending';
        await QAPacksData.update(packToUpdate.id!, report as any);

        // Call Gemini to get the new summary
        const newSummary = await generateReportSummary(report);

        // Update the report with the new summary
        report.expertSummary = newSummary;
        report.expertSummaryStatus = 'completed';

        await QAPacksData.update(packToUpdate.id!, report as any);

        res.status(200).json({ message: 'Expert summary regenerated successfully.', report });

    } catch (error: any) {
        await handleApiError({
            res,
            error,
            title: 'Regenerate AI Summary Failure',
            context: { jobNo, version, authenticatedUserId: req.user.id },
        });
    }
}

const authorizedRoles: Role[] = ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'management_admin', 'hseq_manager'];
export default withAuth(handler, authorizedRoles);