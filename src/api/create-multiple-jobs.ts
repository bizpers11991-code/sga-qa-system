import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { Job } from '../types';
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


export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const redis = getRedisInstance();
    const jobsData: Job[] = request.body;

    if (!Array.isArray(jobsData) || jobsData.length === 0) {
        return response.status(400).json({ message: 'Request body must be an array of jobs.' });
    }
    
    const pipeline = redis.pipeline();

    for (const jobData of jobsData) {
        if (!jobData.id || !jobData.jobNo || !jobData.client) {
            console.warn('Skipping invalid job data in batch:', jobData);
            continue;
        }

        const jobKey = `job:${jobData.id}`;
        
        if (jobData.jobSheetData && Object.keys(jobData.jobSheetData).length > 0) {
            const jobSheetKey = `jobsheet:${jobData.id}`;
            const preparedJobSheet = prepareObjectForRedis(jobData.jobSheetData);
            pipeline.hset(jobSheetKey, preparedJobSheet);
        }
        delete jobData.jobSheetData;

        const preparedJob = prepareObjectForRedis(jobData);
        pipeline.hset(jobKey, preparedJob);
        pipeline.sadd('jobs:index', jobData.id);
    }
    
    await pipeline.exec();
    
    return response.status(201).json({ message: `${jobsData.length} jobs created successfully` });

  } catch (error: any) {
    await handleApiError({
        res: response,
        error,
        title: 'Create Multiple Jobs Failure',
        context: { jobCount: request.body.length },
    });
  }
}