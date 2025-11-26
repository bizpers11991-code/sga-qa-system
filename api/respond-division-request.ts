import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { DivisionRequest, Project } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError, AuthorizationError, ValidationError } from './_lib/errors.js';
import {
  notifyProjectOwner,
  createDivisionCalendarEvents,
  createJobsForRequest,
} from './_lib/divisionRequestHandler.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const redis = getRedisInstance();

    // Get division request ID from query parameter
    const { id } = request.query;
    const {
      response: requestResponse,
      responseNotes,
      assignedCrewId,
      assignedForemanId,
      confirmedDates,
    } = request.body as {
      response: 'accept' | 'reject';
      responseNotes?: string;
      assignedCrewId?: string;
      assignedForemanId?: string;
      confirmedDates?: string[];
    };

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Division Request', { providedId: id });
    }

    if (!requestResponse || !['accept', 'reject'].includes(requestResponse)) {
      throw new ValidationError('Response must be either "accept" or "reject"', {
        providedResponse: requestResponse,
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

    // Authorization check: Only the requested division engineer can respond
    if (request.user.id !== existingRequest.requestedTo) {
      throw new AuthorizationError('You are not authorized to respond to this request', {
        userId: request.user.id,
        requestedTo: existingRequest.requestedTo,
      });
    }

    // Validate accept requirements
    if (requestResponse === 'accept') {
      if (!assignedCrewId || !assignedForemanId || !confirmedDates || confirmedDates.length === 0) {
        throw new ValidationError(
          'Accepting a request requires assignedCrewId, assignedForemanId, and confirmedDates',
          {
            assignedCrewId,
            assignedForemanId,
            confirmedDates,
          }
        );
      }
    }

    // Update request with response
    const updates: Record<string, any> = {
      status: requestResponse === 'accept' ? 'Accepted' : 'Rejected',
      responseNotes: responseNotes || '',
    };

    if (requestResponse === 'accept') {
      updates.assignedCrewId = assignedCrewId;
      updates.assignedForemanId = assignedForemanId;
      updates.confirmedDates = JSON.stringify(confirmedDates);
    }

    const pipeline = redis.pipeline();
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'object') {
        pipeline.hset(requestKey, key, JSON.stringify(value));
      } else {
        pipeline.hset(requestKey, key, String(value));
      }
    }
    await pipeline.exec();

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
      message: `Division request ${(existingRequest as DivisionRequest).requestNumber} ${requestResponse}ed successfully`,
      request: updatedRequest as DivisionRequest,
    });

    // --- Asynchronous Post-Response Tasks ---

    // 1. Notify project owner
    notifyProjectOwner(
      updatedRequest as DivisionRequest,
      project as Project,
      requestResponse
    ).catch(err => {
      console.error(`[Non-blocking] Failed to notify project owner:`, err);
    });

    // 2. If accepted, create calendar events and jobs
    if (requestResponse === 'accept') {
      createDivisionCalendarEvents(
        updatedRequest as DivisionRequest,
        project as Project
      ).catch(err => {
        console.error(`[Non-blocking] Failed to create calendar events:`, err);
      });

      createJobsForRequest(
        updatedRequest as DivisionRequest,
        project as Project
      ).catch(err => {
        console.error(`[Non-blocking] Failed to create jobs:`, err);
      });
    }

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Respond Division Request Failure',
      context: {
        requestId: request.query.id,
        response: request.body?.response,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

// Division engineers can respond to requests
export default withAuth(handler, [
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'management_admin',
]);
