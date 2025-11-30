import type { VercelResponse } from '@vercel/node';
import { DivisionRequestsData } from './_lib/sharepointData.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const {
      direction,
      status,
      division,
      projectId,
    } = request.query;

    // Get all division requests from SharePoint
    let requests = await DivisionRequestsData.getAll({
      status: status as string | undefined,
      requestedDivision: division as string | undefined,
      projectId: projectId as string | undefined,
    });

    // Direction filter (inbox vs outbox)
    if (direction && typeof direction === 'string') {
      if (direction === 'incoming') {
        requests = requests.filter(r => r.requestedTo === request.user.id);
      } else if (direction === 'outgoing') {
        requests = requests.filter(r => r.requestedBy === request.user.id);
      }
    }

    // Sort by request number (most recent first)
    requests.sort((a, b) => b.requestNumber.localeCompare(a.requestNumber));

    return response.status(200).json(requests);

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

export default withAuth(handler, [
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'scheduler_admin',
  'management_admin',
  'hseq_manager',
]);
