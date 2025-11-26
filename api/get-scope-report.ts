import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { ScopeReport } from '../src/types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError, NotFoundError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    const redis = getRedisInstance();

    // Get scope report ID from query parameter
    const { id } = request.query;

    if (!id || typeof id !== 'string') {
      throw new NotFoundError('Scope Report', { providedId: id });
    }

    // Fetch scope report from Redis
    const reportKey = `scopereport:${id}`;
    const reportHash = await redis.hgetall(reportKey);

    if (!reportHash || Object.keys(reportHash).length === 0) {
      throw new NotFoundError('Scope Report', { reportId: id });
    }

    // Reconstruct scope report object
    const report: Partial<ScopeReport> = {};
    for (const [key, value] of Object.entries(reportHash)) {
      try {
        report[key as keyof ScopeReport] = JSON.parse(value as string);
      } catch {
        (report as any)[key] = value;
      }
    }

    return response.status(200).json(report as ScopeReport);

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Get Scope Report Failure',
      context: {
        reportId: request.query.id,
        authenticatedUserId: request.user.id,
      },
    });
  }
}

// Any authenticated user can view a scope report
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
