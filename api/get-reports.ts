// api/get-reports.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisInstance } from './_lib/redis.js';
import { FinalQaPack, Role, isAdminRole } from '../src/types.js';
import { migrateReport } from './_lib/migration.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  const { foremanId } = request.query;
  try {
    const redis = getRedisInstance();
    const { user } = request;
    const isAdmin = isAdminRole(user.role);

    const jobNumbers = await redis.smembers('reports:index');

    if (jobNumbers.length === 0) {
        return response.status(200).json([]);
    }

    const pipeline = redis.pipeline();
    // For each job, we get the most recent report (which is at index 0 of the list)
    jobNumbers.forEach(jobNo => pipeline.lindex(`history:${jobNo}`, 0));
    
    const results = await pipeline.exec<any[]>();
    
    let reports: FinalQaPack[] = results
        .filter(res => res !== null)
        .map(res => {
            const reportData = typeof res === 'string' ? JSON.parse(res) : res;
            return migrateReport(reportData);
        });

    // Authorization Logic
    if (isAdmin) {
      if (foremanId && typeof foremanId === 'string') {
        // Admin can filter by a specific foreman
        reports = reports.filter(report => report.job.foremanId === foremanId);
      }
      // else: Admin gets all reports, no filter needed.
    } else {
      // Non-admins (foremen) can ONLY get their own reports.
      reports = reports.filter(report => report.job.foremanId === user.id);
    }

    // Sort reports by timestamp, most recent first
    reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return response.status(200).json(reports);

  } catch (error: any) {
    await handleApiError({
        res: response,
        error,
        title: 'Fetch Reports Failure',
        context: { foremanId, authenticatedUserId: request.user.id },
    });
  }
}

const authorizedRoles: Role[] = [
    'asphalt_foreman', 'profiling_foreman', 'spray_foreman',
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
];

export default withAuth(handler, authorizedRoles);