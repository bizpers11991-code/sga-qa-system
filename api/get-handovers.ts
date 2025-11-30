import type { VercelResponse } from '@vercel/node';
import { TendersData } from './_lib/sharepointData.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const {
      status,
      clientTier,
      projectOwnerId,
      dateFrom,
      dateTo,
    } = request.query;

    // Get handovers from SharePoint with filters
    let handovers = await TendersData.getAll({
      status: status as string | undefined,
      clientTier: clientTier as string | undefined,
    });

    // Apply additional filters
    if (projectOwnerId && typeof projectOwnerId === 'string') {
      handovers = handovers.filter(h => h.projectOwnerId === projectOwnerId);
    }

    if (dateFrom && typeof dateFrom === 'string') {
      const fromDate = new Date(dateFrom);
      handovers = handovers.filter(h => new Date(h.dateCreated) >= fromDate);
    }

    if (dateTo && typeof dateTo === 'string') {
      const toDate = new Date(dateTo);
      handovers = handovers.filter(h => new Date(h.dateCreated) <= toDate);
    }

    // Sort by date created (most recent first)
    handovers.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());

    return response.status(200).json(handovers);

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Get Handovers Failure',
      context: {
        authenticatedUserId: request.user.id,
        query: request.query,
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
