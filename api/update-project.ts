import type { VercelResponse } from '@vercel/node';
import { ProjectsData } from './_lib/sharepointData';
import { Project } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth';
import { handleApiError, NotFoundError, AuthorizationError } from './_lib/errors';
import { validateProject } from './_lib/projectHandler';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const { id } = request.query;
    const updates: Partial<Project> = request.body;

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Project', { providedId: id });
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

    // Merge and validate
    const updatedProject: Project = {
      ...existingProject,
      ...updates,
    } as Project;

    validateProject(updatedProject);

    // Update in SharePoint
    const result = await ProjectsData.update(id, updates);

    return response.status(200).json({
      success: true,
      message: `Project ${existingProject.projectNumber} updated successfully`,
      project: result,
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

export default withAuth(handler, [
  'scheduler_admin',
  'management_admin',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
]);
