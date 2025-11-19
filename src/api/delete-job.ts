import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
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
    
    const redis = getRedisInstance();

    // Find the job to get its details, like jobNo and assigned foreman IDs for draft cleanup
    const jobData = await redis.hgetall(`job:${jobId}`);
    const jobNo = jobData?.jobNo as string | undefined;

    // Start a pipeline for atomic deletion
    const pipeline = redis.pipeline();

    // 1. Delete the main job hash
    pipeline.del(`job:${jobId}`);

    // 2. Delete the associated job sheet
    pipeline.del(`jobsheet:${jobId}`);
    
    // 3. Remove the job ID from the main index
    pipeline.srem('jobs:index', jobId);

    // 4. If we have the job number, delete associated report history
    if (jobNo) {
        pipeline.del(`history:${jobNo}`);
        pipeline.srem('reports:index', jobNo);
    }
    
    // 5. Clean up any potential drafts for this job.
    // This is a bit more complex as drafts are keyed by foremanId.
    // We'll scan for keys matching the pattern.
    const draftPattern = `draft:${jobId}:*`;
    const draftKeys = await redis.keys(draftPattern);
    if (draftKeys.length > 0) {
        pipeline.del(...draftKeys);
    }

    await pipeline.exec();
    
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