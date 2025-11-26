import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { Project } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError, AuthorizationError, ValidationError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const redis = getRedisInstance();

    // Get project ID from query parameter
    const { id } = request.query;
    const { status, notes } = request.body as {
      status: Project['status'];
      notes?: string;
    };

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Project', { providedId: id });
    }

    if (!status) {
      throw new ValidationError('Status is required', { providedStatus: status });
    }

    // Validate status
    const validStatuses: Project['status'][] = [
      'Scoping',
      'Scheduled',
      'In Progress',
      'QA Review',
      'Completed',
      'On Hold',
    ];

    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid project status', {
        providedStatus: status,
        validStatuses,
      });
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

    // Authorization check: Only project owner, scheduler_admin, or management_admin can update status
    const isAuthorized =
      request.user.role === 'scheduler_admin' ||
      request.user.role === 'management_admin' ||
      request.user.id === existingProject.projectOwnerId;

    if (!isAuthorized) {
      throw new AuthorizationError('You do not have permission to update this project status', {
        userId: request.user.id,
        projectId: id,
        projectOwnerId: existingProject.projectOwnerId,
      });
    }

    // Update status
    await redis.hset(projectKey, 'status', status);

    // Log status change with timestamp and user
    const statusHistory = {
      previousStatus: existingProject.status,
      newStatus: status,
      changedBy: request.user.id,
      changedAt: new Date().toISOString(),
      notes: notes || '',
    };

    // Store status history (append to array)
    const historyKey = `project:${id}:statusHistory`;
    await redis.rpush(historyKey, JSON.stringify(statusHistory));

    // If project is completed, set actual end date
    if (status === 'Completed' && !existingProject.actualEndDate) {
      await redis.hset(projectKey, 'actualEndDate', new Date().toISOString().split('T')[0]);
    }

    // If project is first moved to "In Progress", set actual start date
    if (status === 'In Progress' && !existingProject.actualStartDate) {
      await redis.hset(projectKey, 'actualStartDate', new Date().toISOString().split('T')[0]);
    }

    // Fetch updated project
    const updatedProjectHash = await redis.hgetall(projectKey);
    const updatedProject: Partial<Project> = {};
    for (const [key, value] of Object.entries(updatedProjectHash)) {
      try {
        updatedProject[key as keyof Project] = JSON.parse(value as string);
      } catch {
        (updatedProject as any)[key] = value;
      }
    }

    return response.status(200).json({
      success: true,
      message: `Project ${(existingProject as Project).projectNumber} status updated to ${status}`,
      project: updatedProject as Project,
      statusHistory,
    });

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Update Project Status Failure',
      context: {
        projectId: request.query.id,
        requestedStatus: request.body?.status,
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
  'hseq_manager',
]);
