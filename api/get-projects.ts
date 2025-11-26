import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { Project } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const redis = getRedisInstance();

    // Get query parameters for filtering and pagination
    const {
      status,
      division,
      projectOwnerId,
      clientTier,
      dateFrom,
      dateTo,
      page = '1',
      limit = '50',
      sortBy = 'projectNumber',
      sortOrder = 'desc',
    } = request.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Get all project IDs
    const projectIds = await redis.smembers('projects:index');

    if (!projectIds || projectIds.length === 0) {
      return response.status(200).json({
        projects: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
      });
    }

    // Fetch all projects
    const projects: Project[] = [];

    for (const projectId of projectIds) {
      const projectKey = `project:${projectId}`;
      const projectHash = await redis.hgetall(projectKey);

      if (projectHash && Object.keys(projectHash).length > 0) {
        const project: Partial<Project> = {};
        for (const [key, value] of Object.entries(projectHash)) {
          try {
            project[key as keyof Project] = JSON.parse(value as string);
          } catch {
            (project as any)[key] = value;
          }
        }
        projects.push(project as Project);
      }
    }

    // Apply filters
    let filteredProjects = projects;

    if (status && typeof status === 'string') {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }

    if (division && typeof division === 'string') {
      filteredProjects = filteredProjects.filter(p =>
        p.divisions.some(d => d.division === division)
      );
    }

    if (projectOwnerId && typeof projectOwnerId === 'string') {
      filteredProjects = filteredProjects.filter(p => p.projectOwnerId === projectOwnerId);
    }

    if (clientTier && typeof clientTier === 'string') {
      filteredProjects = filteredProjects.filter(p => p.clientTier === clientTier);
    }

    if (dateFrom && typeof dateFrom === 'string') {
      const fromDate = new Date(dateFrom);
      filteredProjects = filteredProjects.filter(p => {
        const projectDate = new Date(p.estimatedStartDate);
        return projectDate >= fromDate;
      });
    }

    if (dateTo && typeof dateTo === 'string') {
      const toDate = new Date(dateTo);
      filteredProjects = filteredProjects.filter(p => {
        const projectDate = new Date(p.estimatedStartDate);
        return projectDate <= toDate;
      });
    }

    // Sort projects
    filteredProjects.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Project];
      let bValue: any = b[sortBy as keyof Project];

      // Handle date sorting
      if (sortBy === 'estimatedStartDate' || sortBy === 'estimatedEndDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const total = filteredProjects.length;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

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
