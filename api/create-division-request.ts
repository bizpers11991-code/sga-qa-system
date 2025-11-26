import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { DivisionRequest, Project } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError } from './_lib/errors.js';
import {
  generateRequestNumber,
  validateDivisionRequest,
  getDefaultEngineerForDivision,
  notifyDivisionEngineer,
} from './_lib/divisionRequestHandler.js';

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
  const requestData: Partial<DivisionRequest> = request.body;

  try {
    const redis = getRedisInstance();

    // Validate division request data
    validateDivisionRequest(requestData);

    // Fetch project to verify it exists and get details
    const projectKey = `project:${requestData.projectId}`;
    const projectHash = await redis.hgetall(projectKey);

    if (!projectHash || Object.keys(projectHash).length === 0) {
      throw new NotFoundError('Project', { projectId: requestData.projectId });
    }

    // Reconstruct project
    const project: Partial<Project> = {};
    for (const [key, value] of Object.entries(projectHash)) {
      try {
        project[key as keyof Project] = JSON.parse(value as string);
      } catch {
        (project as any)[key] = value;
      }
    }

    // Get all existing division requests to generate next number
    const requestKeys = await redis.smembers('divisionrequests:index');
    const existingRequests: DivisionRequest[] = [];

    for (const reqId of requestKeys) {
      const reqKey = `divisionrequest:${reqId}`;
      const reqHash = await redis.hgetall(reqKey);

      if (reqHash && Object.keys(reqHash).length > 0) {
        const req: Partial<DivisionRequest> = {};
        for (const [key, value] of Object.entries(reqHash)) {
          try {
            req[key as keyof DivisionRequest] = JSON.parse(value as string);
          } catch {
            (req as any)[key] = value;
          }
        }
        existingRequests.push(req as DivisionRequest);
      }
    }

    // Auto-assign engineer if not provided
    let requestedTo = requestData.requestedTo;
    if (!requestedTo) {
      requestedTo = getDefaultEngineerForDivision(requestData.requestedDivision!);
    }

    // Generate request number and create full request object
    const requestNumber = generateRequestNumber(existingRequests);
    const requestId = `divisionrequest-${Date.now()}`;

    const completeRequest: DivisionRequest = {
      id: requestId,
      requestNumber,
      projectId: requestData.projectId!,
      requestedBy: request.user.id,
      requestedDivision: requestData.requestedDivision!,
      requestedTo,
      workDescription: requestData.workDescription!,
      location: requestData.location!,
      requestedDates: requestData.requestedDates!,
      status: 'Pending',
    };

    // Store division request in Redis
    const divisionRequestKey = `divisionrequest:${requestId}`;
    const preparedRequest = prepareObjectForRedis(completeRequest);

    const pipeline = redis.pipeline();
    pipeline.hset(divisionRequestKey, preparedRequest);
    pipeline.sadd('divisionrequests:index', requestId);

    await pipeline.exec();

    // Respond to user immediately
    response.status(201).json({
      success: true,
      message: `Division request ${requestNumber} created successfully`,
      request: completeRequest,
    });

    // --- Asynchronous Post-Creation Tasks ---

    // 1. Send notification to division engineer
    notifyDivisionEngineer(completeRequest, project as Project).catch(err => {
      console.error(`[Non-blocking] Failed to notify division engineer:`, err);
    });

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Create Division Request Failure',
      context: {
        projectId: requestData.projectId,
        requestedDivision: requestData.requestedDivision,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

// Project owners (engineers/admins) can create division requests
export default withAuth(handler, [
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'scheduler_admin',
  'management_admin',
]);
