import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { DivisionRequest, Project } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError, AuthorizationError, ValidationError } from './_lib/errors.js';
import {
  linkQAPackToRequest,
  updateProjectDivisionStatus,
} from './_lib/divisionRequestHandler.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const redis = getRedisInstance();

    // Get division request ID from query parameter
    const { id } = request.query;
    const { qaPackId } = request.body as {
      qaPackId: string;
    };

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Division Request', { providedId: id });
    }

    if (!qaPackId) {
      throw new ValidationError('QA Pack ID is required to complete a division request', {
        qaPackId,
      });
    }

    // Fetch existing division request
    const requestKey = `divisionrequest:${id}`;
    const requestHash = await redis.hgetall(requestKey);

    if (!requestHash || Object.keys(requestHash).length === 0) {
      throw new NotFoundError('Division Request', { requestId: id });
    }

    // Reconstruct division request
    const existingRequest: Partial<DivisionRequest> = {};
    for (const [key, value] of Object.entries(requestHash)) {
      try {
        existingRequest[key as keyof DivisionRequest] = JSON.parse(value as string);
      } catch {
        (existingRequest as any)[key] = value;
      }
    }

    // Authorization check: Only the assigned foreman or division engineer can complete
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

    // Update request with completion data
    await redis.hset(requestKey, 'status', 'Completed');
    await redis.hset(requestKey, 'completedAt', new Date().toISOString());
    await redis.hset(requestKey, 'qaPackId', qaPackId);

    // Fetch updated request
    const updatedRequestHash = await redis.hgetall(requestKey);
    const updatedRequest: Partial<DivisionRequest> = {};
    for (const [key, value] of Object.entries(updatedRequestHash)) {
      try {
        updatedRequest[key as keyof DivisionRequest] = JSON.parse(value as string);
      } catch {
        (updatedRequest as any)[key] = value;
      }
    }

    // Fetch project
    const projectKey = `project:${existingRequest.projectId}`;
    const projectHash = await redis.hgetall(projectKey);
    const project: Partial<Project> = {};
    for (const [key, value] of Object.entries(projectHash)) {
      try {
        project[key as keyof Project] = JSON.parse(value as string);
      } catch {
        (project as any)[key] = value;
      }
    }

    // Respond to user immediately
    response.status(200).json({
      success: true,
      message: `Division request ${(existingRequest as DivisionRequest).requestNumber} marked as completed`,
      request: updatedRequest as DivisionRequest,
    });

    // --- Asynchronous Post-Completion Tasks ---

    // 1. Link QA pack to request and project
    linkQAPackToRequest(
      updatedRequest as DivisionRequest,
      qaPackId,
      project as Project
    ).catch(err => {
      console.error(`[Non-blocking] Failed to link QA pack to request:`, err);
    });

    // 2. Update project division status
    updateProjectDivisionStatus(
      existingRequest.projectId!,
      (existingRequest as DivisionRequest).requestedDivision,
      qaPackId
    ).catch(err => {
      console.error(`[Non-blocking] Failed to update project division status:`, err);
    });

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

// Assigned foreman or division engineer can complete requests
export default withAuth(handler, [
  'asphalt_foreman',
  'profiling_foreman',
  'spray_foreman',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
]);
