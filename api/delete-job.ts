import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JobsData } from './_lib/sharepointData';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const { jobId } = request.body;
    if (!jobId || typeof jobId !== 'string') {
      return response.status(400).json({ message: 'Job ID is required.' });
    }

    // Find the job to get its details before deleting
    const job = await JobsData.getById(jobId);
    if (!job) {
      return response.status(404).json({ message: 'Job not found.' });
    }

    const jobNo = job.jobNo;

    // Delete the job from SharePoint
    // Note: SharePoint list deletion will handle cascading deletes if configured
    // For associated data like drafts and reports, those should be handled separately
    // or through SharePoint's relationship configuration
    const deleted = await JobsData.delete(jobId);

    if (!deleted) {
      return response.status(500).json({ message: 'Failed to delete job.' });
    }

    return response.status(200).json({ message: `Job ${jobNo || jobId} and all associated data deleted successfully.` });

  } catch (error: any) {
    await handleApiError({
        res: response,
        error,
        title: 'Delete Job Failure',
        context: { jobId: request.body.jobId, authenticatedUserId: request.user.id },
    });
  }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'scheduler_admin', 'management_admin', 'hseq_manager']);