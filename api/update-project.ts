import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { Project } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError, AuthorizationError } from './_lib/errors.js';
import { validateProject } from './_lib/projectHandler.js';

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
  try {
    const redis = getRedisInstance();

    // Get project ID from query parameter
    const { id } = request.query;
    const updates: Partial<Project> = request.body;

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Project', { providedId: id });
    }

    // Fetch existing project
    const projectKey = `project:${id}`;
    const projectHash = await redis.hgetall(projectKey);

    if (!projectHash || Object.keys(projectHash).length === 0) {
      throw new NotFoundError('Project', { projectId: id });
    }

    // Reconstruct existing project
    const existingProject: Partial<Project> = {};
    for (const [key, value] of Object.entries(projectHash)) {
      try {
        existingProject[key as keyof Project] = JSON.parse(value as string);
      } catch {
        (existingProject as any)[key] = value;
      }
    }

    // Authorization check: Only project owner, scheduler_admin, or management_admin can update
    const isAuthorized =
      request.user.role === 'scheduler_admin' ||
      request.user.role === 'management_admin' ||
      request.user.id === existingProject.projectOwnerId;

    if (!isAuthorized) {
      throw new AuthorizationError('You do not have permission to update this project', {
        userId: request.user.id,
        projectId: id,
        projectOwnerId: existingProject.projectOwnerId,
      });
    }

    // Prevent updating protected fields
    delete updates.id;
    delete updates.projectNumber;
    delete updates.handoverId;

    // Merge updates with existing project
    const updatedProject: Project = {
      ...existingProject,
      ...updates,
    } as Project;

    // Validate the updated project
    validateProject(updatedProject);

    // Store updated project
    const preparedProject = prepareObjectForRedis(updatedProject);
    await redis.hset(projectKey, preparedProject);

    return response.status(200).json({
      success: true,
      message: `Project ${updatedProject.projectNumber} updated successfully`,
      project: updatedProject,
    });

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Update Project Failure',
      context: {
        projectId: request.query.id,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

// Auth check is done within the handler for conditional authorization
export default withAuth(handler, [
  'scheduler_admin',
  'management_admin',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
]);
