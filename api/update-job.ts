import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JobsData } from './_lib/sharepointData.js';
import { Job } from '../src/types.js';
import { LATEST_SCHEMA_VERSION } from './_lib/migration.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { generateAndSendJobSheetPdf } from './_lib/jobSheetHandler.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  let jobData: Job = request.body;

  try {
    if (!jobData.id) {
      return response.status(400).json({ message: 'Job ID is required for an update.' });
    }

    // Stamp the job with the current schema version for forward compatibility.
    jobData.schemaVersion = LATEST_SCHEMA_VERSION;

    // Check if the job exists before updating
    const existingJob = await JobsData.getById(jobData.id);
    if (!existingJob) {
        return response.status(404).json({ message: 'Job not found.' });
    }

    // Update the job in SharePoint (including jobSheetData)
    const updatedJob = await JobsData.update(jobData.id, jobData);

    if (!updatedJob) {
        return response.status(500).json({ message: 'Failed to update job.' });
    }

    // --- Respond to user immediately ---
    response.status(200).json({ message: `Job ${updatedJob.jobNo} updated successfully`, job: updatedJob });

    // --- Asynchronous PDF Generation & Notification ---
    if (updatedJob.jobSheetData) {
        generateAndSendJobSheetPdf(updatedJob).catch(err => {
            console.error(`[Non-blocking] Failed to send updated job sheet notification for ${updatedJob.jobNo}:`, err);
            handleApiError({
                res: response,
                error: err,
                title: 'Job Sheet PDF/Notification Failure (Update)',
                context: { JobNo: updatedJob.jobNo },
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