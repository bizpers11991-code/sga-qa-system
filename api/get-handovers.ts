import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { TenderHandover } from '../src/types.js';
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
      status,
      clientTier,
      projectOwnerId,
      dateFrom,
      dateTo,
    } = request.query;

    // Get all handover IDs
    const handoverIds = await redis.smembers('handovers:index');

    if (!handoverIds || handoverIds.length === 0) {
      return response.status(200).json([]);
    }

    // Fetch all handovers
    const handovers: TenderHandover[] = [];

    for (const handoverId of handoverIds) {
      const handoverKey = `handover:${handoverId}`;
      const handoverHash = await redis.hgetall(handoverKey);

      if (handoverHash && Object.keys(handoverHash).length > 0) {
        const handover: Partial<TenderHandover> = {};
        for (const [key, value] of Object.entries(handoverHash)) {
          try {
            handover[key as keyof TenderHandover] = JSON.parse(value as string);
          } catch {
            (handover as any)[key] = value;
          }
        }
        handovers.push(handover as TenderHandover);
      }
    }

    // Apply filters
    let filteredHandovers = handovers;

    if (status && typeof status === 'string') {
      filteredHandovers = filteredHandovers.filter(h => h.status === status);
    }

    if (clientTier && typeof clientTier === 'string') {
      filteredHandovers = filteredHandovers.filter(h => h.clientTier === clientTier);
    }

    if (projectOwnerId && typeof projectOwnerId === 'string') {
      filteredHandovers = filteredHandovers.filter(h => h.projectOwnerId === projectOwnerId);
    }

    if (dateFrom && typeof dateFrom === 'string') {
      const fromDate = new Date(dateFrom);
      filteredHandovers = filteredHandovers.filter(h => {
        const handoverDate = new Date(h.dateCreated);
        return handoverDate >= fromDate;
      });
    }

    if (dateTo && typeof dateTo === 'string') {
      const toDate = new Date(dateTo);
      filteredHandovers = filteredHandovers.filter(h => {
        const handoverDate = new Date(h.dateCreated);
        return handoverDate <= toDate;
      });
    }

    // Sort by date created (most recent first)
    filteredHandovers.sort((a, b) => {
      return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
    });

    return response.status(200).json(filteredHandovers);

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

// Any authenticated user can view handovers
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
