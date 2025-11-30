import type { VercelResponse } from '@vercel/node';
import { JobsData } from './_lib/sharepointData.js';
import { Job } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { generateAndSendJobSheetPdf } from './_lib/jobSheetHandler.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  let jobData: Job = request.body;

  try {
    if (!jobData.client) {
      return response.status(400).json({ message: 'Client is required.' });
    }
    if (jobData.division !== 'Profiling' && !jobData.jobNo) {
      return response.status(400).json({ message: 'Job Number is required for non-Profiling jobs.' });
    }

    // Create job in SharePoint
    const createdJob = await JobsData.create({
      jobNo: jobData.jobNo,
      client: jobData.client,
      division: jobData.division,
      projectName: jobData.projectName,
      location: jobData.location,
      foremanId: jobData.foremanId,
      jobDate: jobData.jobDate,
      dueDate: jobData.dueDate,
      status: jobData.status || 'Pending',
      workDescription: jobData.workDescription,
      area: jobData.area,
      thickness: jobData.thickness,
      clientTier: jobData.clientTier,
      qaSpec: jobData.qaSpec,
      projectId: jobData.projectId,
      assignedCrewId: jobData.assignedCrewId,
      jobSheetData: jobData.jobSheetData,
      asphaltDetails: jobData.asphaltDetails,
      profilingDetails: jobData.profilingDetails,
    });

    // Respond to user immediately
    response.status(201).json({ message: `Job ${createdJob.jobNo} created successfully`, job: createdJob });

    // Asynchronous PDF Generation & Notification (runs after response sent)
    if (createdJob.jobSheetData) {
      generateAndSendJobSheetPdf(createdJob).catch(err => {
        console.error(`[Non-blocking] Failed to send job sheet notification for ${createdJob.jobNo}:`, err);
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
