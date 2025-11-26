import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { TenderHandover } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError, AuthorizationError } from './_lib/errors.js';
import { validateHandover } from './_lib/handoverHandler.js';

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
  try {
    const redis = getRedisInstance();

    // Get handover ID from query parameter
    const { id } = request.query;
    const updates: Partial<TenderHandover> = request.body;

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Handover', { providedId: id });
    }

    // Fetch existing handover
    const handoverKey = `handover:${id}`;
    const handoverHash = await redis.hgetall(handoverKey);

    if (!handoverHash || Object.keys(handoverHash).length === 0) {
      throw new NotFoundError('Handover', { handoverId: id });
    }

    // Reconstruct existing handover
    const existingHandover: Partial<TenderHandover> = {};
    for (const [key, value] of Object.entries(handoverHash)) {
      try {
        existingHandover[key as keyof TenderHandover] = JSON.parse(value as string);
      } catch {
        (existingHandover as any)[key] = value;
      }
    }

    // Authorization check: Only tender_admin, scheduler_admin, management_admin,
    // or the assigned project owner can update
    const isAuthorized =
      request.user.role === 'tender_admin' ||
      request.user.role === 'scheduler_admin' ||
      request.user.role === 'management_admin' ||
      request.user.id === existingHandover.projectOwnerId;

    if (!isAuthorized) {
      throw new AuthorizationError('You do not have permission to update this handover', {
        userId: request.user.id,
        handoverId: id,
        projectOwnerId: existingHandover.projectOwnerId,
      });
    }

    // Prevent updating protected fields
    delete updates.id;
    delete updates.handoverNumber;
    delete updates.dateCreated;
    delete updates.createdBy;

    // Merge updates with existing handover
    const updatedHandover: TenderHandover = {
      ...existingHandover,
      ...updates,
    } as TenderHandover;

    // Validate the updated handover
    validateHandover(updatedHandover);

    // Store updated handover
    const preparedHandover = prepareObjectForRedis(updatedHandover);
    await redis.hset(handoverKey, preparedHandover);

    return response.status(200).json({
      success: true,
      message: `Handover ${updatedHandover.handoverNumber} updated successfully`,
      handover: updatedHandover,
    });

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Update Handover Failure',
      context: {
        handoverId: request.query.id,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

// Auth check is done within the handler for conditional authorization
export default withAuth(handler, [
  'tender_admin',
  'scheduler_admin',
  'management_admin',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
]);
