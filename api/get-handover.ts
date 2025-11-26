import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { TenderHandover } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const redis = getRedisInstance();

    // Get handover ID from query parameter
    const { id } = request.query;

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Handover', { providedId: id });
    }

    // Fetch handover from Redis
    const handoverKey = `handover:${id}`;
    const handoverHash = await redis.hgetall(handoverKey);

    if (!handoverHash || Object.keys(handoverHash).length === 0) {
      throw new NotFoundError('Handover', { handoverId: id });
    }

    // Reconstruct handover object
    const handover: Partial<TenderHandover> = {};
    for (const [key, value] of Object.entries(handoverHash)) {
      try {
        handover[key as keyof TenderHandover] = JSON.parse(value as string);
      } catch {
        (handover as any)[key] = value;
      }
    }

    return response.status(200).json(handover as TenderHandover);

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

// Any authenticated user can view a handover
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
