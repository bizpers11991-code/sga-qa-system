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

    if (!jobData.id) {
      return response.status(400).json({ message: 'Job ID is required for an update.' });
    }
    
    // Stamp the job with the current schema version for forward compatibility.
    jobData.schemaVersion = LATEST_SCHEMA_VERSION;
    
    const jobKey = `job:${jobData.id}`;
    
    // Check if the job exists before updating
    const jobExists = await redis.exists(jobKey);
    if (!jobExists) {
        return response.status(404).json({ message: 'Job not found.' });
    }
    
    const jobSheetDataForStorage = jobData.jobSheetData; // Keep a copy with data

    if (jobData.jobSheetData && Object.keys(jobData.jobSheetData).length > 0) {
        const jobSheetKey = `jobsheet:${jobData.id}`;
        const preparedJobSheet = prepareObjectForRedis(jobData.jobSheetData);
        await redis.hset(jobSheetKey, preparedJobSheet);
    } else {
        // If job sheet data is empty, ensure it's removed
        await redis.del(`jobsheet:${jobData.id}`);
    }
    delete jobData.jobSheetData;
    
    const preparedJob = prepareObjectForRedis(jobData);
    await redis.hset(jobKey, preparedJob);

    // Restore jobSheetData for the response and background task
    if (jobSheetDataForStorage) {
        jobData.jobSheetData = jobSheetDataForStorage;
    }
    
    // --- Respond to user immediately ---
    response.status(200).json({ message: `Job ${jobData.jobNo} updated successfully`, job: jobData });

    // --- Asynchronous PDF Generation & Notification ---
    if (jobData.jobSheetData) {
        generateAndSendJobSheetPdf(jobData).catch(err => {
            console.error(`[Non-blocking] Failed to send updated job sheet notification for ${jobData.jobNo}:`, err);
            handleApiError({
                res: response,
                error: err,
                title: 'Job Sheet PDF/Notification Failure (Update)',
                context: { JobNo: jobData.jobNo },
            });
        });
    }

  } catch (error: any) {
    await handleApiError({
        res: response,
        error,
        title: 'Update Job Failure',
        context: { jobId: jobData.id, authenticatedUserId: request.user.id },
    });
  }
}

export default withAuth(handler, ['asphalt_engineer', 'profiling_engineer', 'spray_admin', 'scheduler_admin', 'management_admin', 'hseq_manager']);