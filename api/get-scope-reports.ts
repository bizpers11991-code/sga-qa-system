import type { VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { ScopeReport } from '../src/types.js';
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
      projectId,
      completedBy,
      status,
      visitType,
    } = request.query;

    // Get all scope report IDs
    const reportIds = await redis.smembers('scopereports:index');

    if (!reportIds || reportIds.length === 0) {
      return response.status(200).json([]);
    }

    // Fetch all scope reports
    const reports: ScopeReport[] = [];

    for (const reportId of reportIds) {
      const reportKey = `scopereport:${reportId}`;
      const reportHash = await redis.hgetall(reportKey);

      if (reportHash && Object.keys(reportHash).length > 0) {
        const report: Partial<ScopeReport> = {};
        for (const [key, value] of Object.entries(reportHash)) {
          try {
            report[key as keyof ScopeReport] = JSON.parse(value as string);
          } catch {
            (report as any)[key] = value;
          }
        }
        reports.push(report as ScopeReport);
      }
    }

    // Apply filters
    let filteredReports = reports;

    if (projectId && typeof projectId === 'string') {
      filteredReports = filteredReports.filter(r => r.projectId === projectId);
    }

    if (completedBy && typeof completedBy === 'string') {
      filteredReports = filteredReports.filter(r => r.completedBy === completedBy);
    }

    if (status && typeof status === 'string') {
      filteredReports = filteredReports.filter(r => r.status === status);
    }

    if (visitType && typeof visitType === 'string') {
      filteredReports = filteredReports.filter(r => r.visitType === visitType);
    }

    // Sort by actual date (most recent first)
    filteredReports.sort((a, b) => {
      return new Date(b.actualDate).getTime() - new Date(a.actualDate).getTime();
    });

    return response.status(200).json(filteredReports);

  } catch (error: any) {
    await handleApiError({
      res: response,
      error,
      title: 'Get Scope Reports Failure',
      context: {
        authenticatedUserId: request.user.id,
        query: request.query,
      },
    });
  }
}

// Any authenticated user can view scope reports
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
