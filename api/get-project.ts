import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { Project } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError } from './_lib/errors.js';
import { fetchProjectDetails } from './_lib/projectHandler.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const redis = getRedisInstance();

    // Get project ID from query parameter
    const { id } = request.query;

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Project', { providedId: id });
    }

    // Fetch project from Redis
    const projectKey = `project:${id}`;
    const projectHash = await redis.hgetall(projectKey);

    if (!projectHash || Object.keys(projectHash).length === 0) {
      throw new NotFoundError('Project', { projectId: id });
    }

    // Reconstruct project object
    const project: Partial<Project> = {};
    for (const [key, value] of Object.entries(projectHash)) {
      try {
        project[key as keyof Project] = JSON.parse(value as string);
      } catch {
        (project as any)[key] = value;
      }
    }

    // Fetch all related data
    const details = await fetchProjectDetails(project as Project);

    return response.status(200).json({
      project: project as Project,
      jobs: details.jobs,
      scopeReports: details.scopeReports,
      qaPacks: details.qaPacks,
      ncrs: details.ncrs,
      incidents: details.incidents,
      divisionRequests: details.divisionRequests,
    });

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Get Project Failure',
      context: {
        projectId: request.query.id,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

// Any authenticated user can view a project
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
