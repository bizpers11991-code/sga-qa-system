// api/cron/cleanup.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DraftsData, JobsData } from '../_lib/sharepointData.js';
import { handleApiError } from '../_lib/errors.js';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
    // Vercel Cron jobs can be protected by checking the 'x-vercel-cron-secret' header.
    // This secret is set in the Vercel project settings.
    if (process.env.CRON_SECRET && request.headers['x-vercel-cron-secret'] !== process.env.CRON_SECRET) {
        return response.status(401).json({ message: 'Unauthorized' });
    }

    try {
        console.log("Running weekly cleanup cron job...");

        // --- Cleanup old drafts ---
        // Find drafts that haven't been updated in over 30 days
        // and whose corresponding job has been completed or deleted.
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const allDrafts = await DraftsData.getAll();
        const allJobs = await JobsData.getAll();
        const activeJobIds = new Set(allJobs.map(j => j.id));

        let deletedCount = 0;

        for (const draft of allDrafts) {
            const draftDate = draft.modified ? new Date(draft.modified) : new Date(draft.created || 0);
            const isOld = draftDate < thirtyDaysAgo;
            const jobCompleted = !activeJobIds.has(draft.jobId);

            if (isOld && jobCompleted && draft.id) {
                try {
                    await DraftsData.delete(draft.id);
                    deletedCount++;
                } catch (err) {
                    console.error(`Failed to delete draft ${draft.id}`, err);
                }
            }
        }

        const message = `Weekly cleanup completed. Deleted ${deletedCount} old drafts.`;
        console.log(message);

        return response.status(200).json({ message, deletedCount });

    } catch (error: any) {
        await handleApiError({ res: response, error, title: 'Weekly Cleanup Cron Failure' });
    }
}