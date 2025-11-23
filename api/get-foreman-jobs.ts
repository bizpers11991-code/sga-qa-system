
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { Job } from '../src/types.js';
import { hydrateObjectFromRedisHash } from './_lib/utils.js';
import { migrateJob, migrateJobSheet } from './_lib/migration.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  const { foremanId } = request.query;

  if (!foremanId || typeof foremanId !== 'string') {
    return response.status(400).json({ message: 'Foreman ID is required.' });
  }
  
  // Authorization: A user can only request their own jobs.
  if (request.user.id !== foremanId) {
       return response.status(403).json({ message: 'Forbidden: You can only access your own jobs.' });
  }
  
  try {
    const redis = getRedisInstance();
    const jobIds = await redis.smembers('jobs:index');

    if (jobIds.length === 0) {
        return response.status(200).json([]);
    }

    const pipeline = redis.pipeline();
    jobIds.forEach(id => {
      pipeline.hgetall(`job:${id}`);
      pipeline.hgetall(`jobsheet:${id}`);
    });
    
    const results = await pipeline.exec<Array<Record<string, string> | null>>();
    
    const jobs: Job[] = [];
    for (let i = 0; i < results.length; i += 2) {
      const jobDataFromRedis = results[i] as Record<string, string> | null;
      const jobSheetDataFromRedis = results[i+1] as Record<string, string> | null;
      
      if (jobDataFromRedis) {
        const rehydratedJob = hydrateObjectFromRedisHash(jobDataFromRedis);
        const migratedJob = migrateJob(rehydratedJob);

        if (jobSheetDataFromRedis && Object.keys(jobSheetDataFromRedis).length > 0) {
            const rehydratedJobSheet = hydrateObjectFromRedisHash(jobSheetDataFromRedis);
            migratedJob.jobSheetData = migrateJobSheet(rehydratedJobSheet);
        }
        
        // Ensure jobNo is always a string to prevent client-side errors
        if (migratedJob.jobNo) {
            migratedJob.jobNo = String(migratedJob.jobNo);
        }
        
        jobs.push(migratedJob as Job);
      }
    }
    
    // Filter jobs: must be assigned to the foreman
    const assignedJobs = jobs.filter(job => job.foremanId === foremanId);

    // Sort jobs by date, most recent first
    assignedJobs.sort((a, b) => new Date(b.jobDate).getTime() - new Date(a.jobDate).getTime());

    return response.status(200).json(assignedJobs);

  } catch (error: any) {
    await handleApiError({
        res: response,
        error,
        title: 'Fetch Foreman Jobs Failure',
        context: { foremanId, authenticatedUserId: request.user.id },
    });
  }
}

// Any authenticated foreman can access this endpoint, but the handler logic ensures they can only get their own data.
export default withAuth(handler, ['asphalt_foreman', 'profiling_foreman', 'spray_foreman']);