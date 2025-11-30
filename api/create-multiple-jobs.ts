import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JobsData } from './_lib/sharepointData.js';
import { Job } from '../src/types.js';
import { handleApiError } from './_lib/errors.js';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const jobsData: Job[] = request.body;

    if (!Array.isArray(jobsData) || jobsData.length === 0) {
        return response.status(400).json({ message: 'Request body must be an array of jobs.' });
    }

    const createdJobs: Job[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < jobsData.length; i++) {
        const jobData = jobsData[i];

        if (!jobData.jobNo || !jobData.client) {
            console.warn(`Skipping invalid job data at index ${i}:`, jobData);
            errors.push({ index: i, error: 'Missing required fields (jobNo or client)' });
            continue;
        }

        try {
            // Remove id if present, as SharePoint will auto-generate it
            const { id, ...jobDataWithoutId } = jobData;

            // Create the job in SharePoint (including jobSheetData)
            const createdJob = await JobsData.create(jobDataWithoutId);
            createdJobs.push(createdJob);
        } catch (error: any) {
            console.error(`Error creating job at index ${i}:`, error);
            errors.push({ index: i, error: error.message || 'Unknown error' });
        }
    }

    const successCount = createdJobs.length;
    const failCount = errors.length;

    if (successCount === 0) {
        return response.status(400).json({
            message: 'Failed to create any jobs',
            errors
        });
    }

    if (failCount > 0) {
        return response.status(207).json({
            message: `${successCount} jobs created successfully, ${failCount} failed`,
            created: createdJobs,
            errors
        });
    }

    return response.status(201).json({
        message: `${successCount} jobs created successfully`,
        created: createdJobs
    });

  } catch (error: any) {
    await handleApiError({
        res: response,
        error,
        title: 'Create Multiple Jobs Failure',
        context: { jobCount: request.body?.length || 0 },
    });
  }
}