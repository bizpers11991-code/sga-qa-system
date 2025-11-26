import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { DivisionRequest } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const redis = getRedisInstance();

    // Get query parameters for filtering
    const {
      direction, // 'incoming' | 'outgoing'
      status,
      division,
      projectId,
    } = request.query;

    // Get all division request IDs
    const requestIds = await redis.smembers('divisionrequests:index');

    if (!requestIds || requestIds.length === 0) {
      return response.status(200).json([]);
    }

    // Fetch all division requests
    const requests: DivisionRequest[] = [];

    for (const requestId of requestIds) {
      const requestKey = `divisionrequest:${requestId}`;
      const requestHash = await redis.hgetall(requestKey);

      if (requestHash && Object.keys(requestHash).length > 0) {
        const req: Partial<DivisionRequest> = {};
        for (const [key, value] of Object.entries(requestHash)) {
          try {
            req[key as keyof DivisionRequest] = JSON.parse(value as string);
          } catch {
            (req as any)[key] = value;
          }
        }
        requests.push(req as DivisionRequest);
      }
    }

    // Apply filters
    let filteredRequests = requests;

    // Direction filter (inbox vs outbox)
    if (direction && typeof direction === 'string') {
      if (direction === 'incoming') {
        // Requests where user is the recipient (requestedTo)
        filteredRequests = filteredRequests.filter(r => r.requestedTo === request.user.id);
      } else if (direction === 'outgoing') {
        // Requests where user is the sender (requestedBy)
        filteredRequests = filteredRequests.filter(r => r.requestedBy === request.user.id);
      }
    }

    if (status && typeof status === 'string') {
      filteredRequests = filteredRequests.filter(r => r.status === status);
    }

    if (division && typeof division === 'string') {
      filteredRequests = filteredRequests.filter(r => r.requestedDivision === division);
    }

    if (projectId && typeof projectId === 'string') {
      filteredRequests = filteredRequests.filter(r => r.projectId === projectId);
    }

    // Sort by request number (most recent first)
    filteredRequests.sort((a, b) => {
      return b.requestNumber.localeCompare(a.requestNumber);
    });

    return response.status(200).json(filteredRequests);

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Get Division Requests Failure',
      context: {
        authenticatedUserId: request.user.id,
        query: request.query,
      },
    });
  }
}

// All engineers can view division requests
export default withAuth(handler, [
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'scheduler_admin',
  'management_admin',
  'hseq_manager',
]);
