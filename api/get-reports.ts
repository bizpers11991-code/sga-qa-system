// api/get-reports.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { QAPacksData } from './_lib/sharepointData.js';
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
    const { user } = request;
    const isAdmin = isAdminRole(user.role);

    // Get all QA packs from SharePoint
    const allReports = await QAPacksData.getAll() as FinalQaPack[];

    if (allReports.length === 0) {
        return response.status(200).json([]);
    }

    // Group by jobNo to get only the latest version of each report
    const latestReportsMap = new Map<string, FinalQaPack>();

    for (const report of allReports) {
        const migrated = migrateReport(report);
        const jobNo = migrated.job?.jobNo;

        if (!jobNo) continue;

        const existing = latestReportsMap.get(jobNo);
        if (!existing || (migrated.version && migrated.version > (existing.version || 0))) {
            latestReportsMap.set(jobNo, migrated);
        }
    }

    let reports: FinalQaPack[] = Array.from(latestReportsMap.values());

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