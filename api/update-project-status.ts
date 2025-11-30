import type { VercelResponse } from '@vercel/node';
import { ProjectsData } from './_lib/sharepointData.js';
import { Project } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError, AuthorizationError, ValidationError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
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

    // Fetch existing project from SharePoint
    const existingProject = await ProjectsData.getById(id);

    if (!existingProject) {
      throw new NotFoundError('Project', { projectId: id });
    }

    // Authorization check
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

    // Prepare updates
    const updates: Partial<Project> = { status };

    // Set actual dates based on status
    if (status === 'Completed' && !existingProject.actualEndDate) {
      updates.actualEndDate = new Date().toISOString().split('T')[0];
    }
    if (status === 'In Progress' && !existingProject.actualStartDate) {
      updates.actualStartDate = new Date().toISOString().split('T')[0];
    }

    // Update in SharePoint
    const updatedProject = await ProjectsData.update(id, updates);

    const statusHistory = {
      previousStatus: existingProject.status,
      newStatus: status,
      changedBy: request.user.id,
      changedAt: new Date().toISOString(),
      notes: notes || '',
    };

    return response.status(200).json({
      success: true,
      message: `Project ${existingProject.projectNumber} status updated to ${status}`,
      project: updatedProject,
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

export default withAuth(handler, [
  'scheduler_admin',
  'management_admin',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'hseq_manager',
]);
