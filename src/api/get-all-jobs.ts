
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { Job, DailyJobSheetData, Role } from '../types.js';
import { hydrateObjectFromRedisHash } from './_lib/utils.js';
import { migrateJob, migrateJobSheet } from './_lib/migration.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';


async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
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
    
    // Sort jobs by due date, soonest first, with a fallback for invalid dates.
    jobs.sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());

    return response.status(200).json(jobs);

  } catch (error: any) {
    await handleApiError({
        res: response,
        error,
        title: 'Fetch All Jobs Failure',
        context: { authenticatedUserId: request.user.id },
    });
  }
}

const authorizedRoles: Role[] = [
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
];

export default withAuth(handler, authorizedRoles);