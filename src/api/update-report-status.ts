// api/update-report-status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { FinalQaPack, ReportStatus, Role } from '../types';
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

        const redis = getRedisInstance();
        const historyKey = `history:${jobNo}`;
        
        const length = await redis.llen(historyKey);
        // Version history is stored with the newest (highest version number) at index 0.
        // So, version N is at index 0, N-1 is at index 1, etc.
        // The index for a given version `v` is `length - v`.
        const indexToUpdate = length - version;

        if (indexToUpdate < 0 || indexToUpdate >= length) {
            return res.status(404).json({ message: `Report version ${version} not found in history of length ${length}.` });
        }

        const reportJson = await redis.lindex(historyKey, indexToUpdate);
        if (!reportJson) {
             return res.status(404).json({ message: 'Report version data is missing or corrupt.' });
        }
        
        let report: FinalQaPack = migrateReport(JSON.parse(reportJson as string));
        
        // Ensure the version number matches what we expect
        if (report.version !== version) {
             console.error(`Version mismatch! Expected ${version}, found ${report.version} at index ${indexToUpdate}.`);
             // Try to find the correct index as a fallback
             const allReportsJson = await redis.lrange(historyKey, 0, -1);
             const correctIndex = allReportsJson.findIndex(r => JSON.parse(r).version === version);
             if (correctIndex !== -1) {
                 report = migrateReport(JSON.parse(allReportsJson[correctIndex]));
                 await redis.lset(historyKey, correctIndex, JSON.stringify({ ...report, status, internalNotes }));
                 return res.status(200).json({ message: 'Report status updated successfully (with index correction).', report });
             }
             return res.status(409).json({ message: 'Version mismatch conflict. Data may be out of sync.' });
        }

        report.status = status;
        report.internalNotes = internalNotes;

        await redis.lset(historyKey, indexToUpdate, JSON.stringify(report));

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