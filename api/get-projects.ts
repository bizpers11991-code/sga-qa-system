import type { VercelResponse } from '@vercel/node';
import { ProjectsData } from './_lib/sharepointData.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    // Get query parameters for filtering
    const {
      status,
      division,
      projectOwnerId,
      clientTier,
      page = '1',
      limit = '50',
    } = request.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Get projects from SharePoint with filters
    const projects = await ProjectsData.getAll({
      status: status as string | undefined,
      division: division as string | undefined,
      projectOwnerId: projectOwnerId as string | undefined,
      clientTier: clientTier as string | undefined,
    });

    // Apply pagination
    const total = projects.length;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProjects = projects.slice(startIndex, endIndex);

    return response.status(200).json({
      projects: paginatedProjects,
      total,
      page: pageNum,
      limit: limitNum,
    });

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Get Projects Failure',
      context: {
        authenticatedUserId: request.user.id,
        query: request.query,
      },
    });
  }
}

// Any authenticated user can view projects
export default withAuth(handler, [
  'tender_admin',
  'scheduler_admin',
  'management_admin',
  'hseq_manager',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'asphalt_foreman',
  'profiling_foreman',
  'spray_foreman',
]);
