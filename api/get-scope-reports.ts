import type { VercelResponse } from '@vercel/node';
import { ScopeReportsData } from './_lib/sharepointData.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { handleApiError } from './_lib/errors.js';

async function handler(
  request: AuthenticatedRequest,
  response: VercelResponse
) {
  try {
    // Get query parameters for filtering
    const {
      projectId,
      completedBy,
      status,
      visitType,
    } = request.query;

    // Get scope reports from SharePoint
    const reports = await ScopeReportsData.getAll(
      projectId && typeof projectId === 'string' ? projectId : undefined
    );

    // Apply additional filters
    let filteredReports = reports;

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
