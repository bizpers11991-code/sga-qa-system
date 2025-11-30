import type { VercelResponse } from '@vercel/node';
import { TendersData } from './_lib/sharepointData';
import { withAuth, AuthenticatedRequest } from './_lib/auth';
import { handleApiError, NotFoundError } from './_lib/errors';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const { id } = request.query;

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Handover', { providedId: id });
    }

    // Fetch handover from SharePoint
    const handover = await TendersData.getById(id);

    if (!handover) {
      throw new NotFoundError('Handover', { handoverId: id });
    }

    return response.status(200).json(handover);

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Get Handover Failure',
      context: {
        handoverId: request.query.id,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

export default withAuth(handler, [
  'tender_admin',
  'scheduler_admin',
  'management_admin',
  'hseq_manager',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'asphalt_foreman',
  'profiling_foreman',
  'spray_foreman',
]);
