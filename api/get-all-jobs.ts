import type { VercelResponse } from '@vercel/node';
import { JobsData } from './_lib/sharepointData.js';
import { Role } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const {
      status,
      division,
      foremanId,
      projectId,
    } = request.query;

    // Get jobs from SharePoint with filters
    const jobs = await JobsData.getAll({
      status: status as string | undefined,
      division: division as string | undefined,
      foremanId: foremanId as string | undefined,
      projectId: projectId as string | undefined,
    });

    // Sort jobs by due date, soonest first
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
