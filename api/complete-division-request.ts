import type { VercelResponse } from '@vercel/node';
import { DivisionRequestsData, ProjectsData } from './_lib/sharepointData';
import { DivisionRequest } from '../src/types';
import { withAuth, AuthenticatedRequest } from './_lib/auth';
import { handleApiError, NotFoundError, AuthorizationError, ValidationError } from './_lib/errors';
import {
  linkQAPackToRequest,
  updateProjectDivisionStatus,
} from './_lib/divisionRequestHandler';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const { id } = request.query;
    const { qaPackId } = request.body as { qaPackId: string };

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Division Request', { providedId: id });
    }

    if (!qaPackId) {
      throw new ValidationError('QA Pack ID is required to complete a division request', { qaPackId });
    }

    // Fetch existing division request from SharePoint
    const existingRequest = await DivisionRequestsData.getById(id);

    if (!existingRequest) {
      throw new NotFoundError('Division Request', { requestId: id });
    }

    // Authorization check
    const isAuthorized =
      request.user.id === existingRequest.assignedForemanId ||
      request.user.id === existingRequest.requestedTo;

    if (!isAuthorized) {
      throw new AuthorizationError('You are not authorized to complete this request', {
        userId: request.user.id,
        assignedForemanId: existingRequest.assignedForemanId,
        requestedTo: existingRequest.requestedTo,
      });
    }

    // Update in SharePoint
    const updatedRequest = await DivisionRequestsData.update(id, {
      status: 'Completed',
      completedAt: new Date().toISOString(),
      qaPackId,
    });

    // Fetch project
    const project = await ProjectsData.getById(existingRequest.projectId);

    // Respond immediately
    response.status(200).json({
      success: true,
      message: `Division request ${existingRequest.requestNumber} marked as completed`,
      request: updatedRequest,
    });

    // Async tasks
    if (project) {
      linkQAPackToRequest(updatedRequest as DivisionRequest, qaPackId, project).catch(err => {
        console.error(`[Non-blocking] Failed to link QA pack to request:`, err);
      });

      updateProjectDivisionStatus(
        existingRequest.projectId,
        existingRequest.requestedDivision,
        qaPackId
      ).catch(err => {
        console.error(`[Non-blocking] Failed to update project division status:`, err);
      });
    }

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Complete Division Request Failure',
      context: {
        requestId: request.query.id,
        qaPackId: request.body?.qaPackId,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

export default withAuth(handler, [
  'asphalt_foreman',
  'profiling_foreman',
  'spray_foreman',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
]);
