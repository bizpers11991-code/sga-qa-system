import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { Job } from '../types';
import { LATEST_SCHEMA_VERSION } from './_lib/migration.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { generateAndSendJobSheetPdf } from './_lib/jobSheetHandler.js';
import { handleApiError } from './_lib/errors.js';

const prepareObjectForRedis = (obj: Record<string, any>): Record<string, string> => {
    const prepared: Record<string, string> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null) {
            const value = obj[key];
            if (typeof value === 'object') {
                prepared[key] = JSON.stringify(value);
            } else {
                prepared[key] = String(value);
            }
        }
    }
    return prepared;
};


async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  let jobData: Job = request.body;
  
  try {
    const redis = getRedisInstance();

    if (!jobData.id || !jobData.client) {
      return response.status(400).json({ message: 'Job ID and Client are required.' });
    }
    if (jobData.division !== 'Profiling' && !jobData.jobNo) {
        return response.status(400).json({ message: 'Job Number is required for non-Profiling jobs.' });
    }
    
    // Stamp the job with the current schema version for forward compatibility.
    jobData.schemaVersion = LATEST_SCHEMA_VERSION;
    
    const jobKey = `job:${jobData.id}`;
    const jobSheetDataForStorage = jobData.jobSheetData; // Keep a copy with data
    
    // If jobSheetData exists, store it separately
    if (jobData.jobSheetData && Object.keys(jobData.jobSheetData).length > 0) {
        const jobSheetKey = `jobsheet:${jobData.id}`;
        const preparedJobSheet = prepareObjectForRedis(jobData.jobSheetData);
        await redis.hset(jobSheetKey, preparedJobSheet);
    }
    // Remove it from the main job object to avoid duplication in the job hash
    delete jobData.jobSheetData;
    
    const preparedJob = prepareObjectForRedis(jobData);
    
    const pipeline = redis.pipeline();
    pipeline.hset(jobKey, preparedJob);
    pipeline.sadd('jobs:index', jobData.id);
    
    await pipeline.exec();
    
    // Restore jobSheetData for the response and background task
    if (jobSheetDataForStorage) {
        jobData.jobSheetData = jobSheetDataForStorage;
    }

    // --- Respond to user immediately ---
    response.status(201).json({ message: `Job ${jobData.jobNo} created successfully`, job: jobData });

    // --- Asynchronous PDF Generation & Notification ---
    // This runs after the response has been sent.
    if (jobData.jobSheetData) {
        generateAndSendJobSheetPdf(jobData).catch(err => {
            console.error(`[Non-blocking] Failed to send job sheet notification for ${jobData.jobNo}:`, err);
            // This is a background task, so we can use handleApiError without a real response object
            handleApiError({
                res: response,
                error: err,
                title: 'Job Sheet PDF/Notification Failure',
                context: { JobNo: jobData.jobNo },
            });
        });
    }

  } catch (error: any) {
    await handleApiError({
        res: response,
        error,
        title: 'Create Job Failure',
        context: { jobNo: jobData.jobNo, authenticatedUserId: request.user.id },
    });
  }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'scheduler_admin', 'management_admin', 'hseq_manager']);