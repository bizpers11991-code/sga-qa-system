// api/regenerate-ai-summary.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { generateReportSummary } from './_lib/gemini.js';
import { FinalQaPack, Role } from '../types';
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

        const redis = getRedisInstance();
        const historyKey = `history:${jobNo}`;

        const length = await redis.llen(historyKey);
        const indexToUpdate = length - version;

        if (indexToUpdate < 0 || indexToUpdate >= length) {
            return res.status(404).json({ message: `Report version ${version} not found.` });
        }

        const reportJson = await redis.lindex(historyKey, indexToUpdate);
        if (!reportJson) {
            return res.status(404).json({ message: 'Report data is missing or corrupt.' });
        }

        let report: FinalQaPack = migrateReport(JSON.parse(reportJson as string));
        
        // Indicate that the summary is being processed
        report.expertSummaryStatus = 'pending';
        await redis.lset(historyKey, indexToUpdate, JSON.stringify(report));
        
        // Call Gemini to get the new summary
        const newSummary = await generateReportSummary(report);
        
        // Update the report with the new summary
        report.expertSummary = newSummary;
        report.expertSummaryStatus = 'completed';
        
        await redis.lset(historyKey, indexToUpdate, JSON.stringify(report));

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